'use strict';
// /api/account/<action>: sign in with a WhatsApp code (see _auth.js). One function for all five actions, so the
// site stays inside Vercel's function count.
//   POST send-code  { code, mobile }          a code goes to that WhatsApp number (same answer whether or not it has an account)
//   POST verify     { code, mobile, otp }     the right code starts a session; says whether the account exists
//   POST profile    { name, email, dob }      a signed-in new number creates its account
//   GET  me                                   the signed-in account, or signedIn: false
//   POST logout                               ends this session
const auth = require('./_auth');
const { r27 } = auth;

const ACTIONS = { 'send-code': ['POST', sendCode], verify: ['POST', verify], profile: ['POST', profile], me: ['GET', me], logout: ['POST', logout] };

module.exports = async function handler(req, res) {
  const entry = ACTIONS[String((req.query || {}).action || '')];
  if (!entry) return res.status(404).json({ ok: false, error: 'Not found.' });
  if (!auth.guard(req, res, entry[0])) return;
  try {
    await entry[1](req, res);
  } catch (e) {
    if (e instanceof auth.Refusal) {
      if (e.body.retry_after) res.setHeader('Retry-After', String(e.body.retry_after));
      return res.status(e.status).json(e.body);
    }
    console.error(`Account ${req.query.action} failed:`, e.message);
    return res.status(500).json({ ok: false, error: 'Something went wrong. Please try again.' });
  }
};

function phoneFrom(b) {
  const phone = r27.normalisePhone(b.code, b.mobile);
  if (!phone) throw new auth.Refusal(400, { error: 'Please enter a valid WhatsApp number.', errors: { mobile: 'Please enter a valid WhatsApp number.' } });
  return phone;
}

async function sendCode(req, res) {
  const phone = phoneFrom(r27.body(req));
  const ip = auth.clientIp(req);
  const bIp = auth.bucket('send-ip', ip), bPhone = auth.bucket('send-phone', phone);
  const code = auth.newCode();
  await auth.tx({ otp_phone: phone, buckets: bIp + ',' + bPhone }, async c => {
    const last = await c.query('SELECT EXTRACT(EPOCH FROM (NOW() - sent_at))::int AS ago FROM web_otps WHERE phone = $1', [phone]);
    if (last.rows[0] && last.rows[0].ago < auth.RESEND_AFTER_SEC) {
      const wait = auth.RESEND_AFTER_SEC - last.rows[0].ago;
      throw new auth.Refusal(429, { error: `Please wait ${wait} seconds before asking for another code.`, retry_after: wait });
    }
    const byIp = await auth.hit(c, bIp, auth.LIMITS.sendIp);
    if (!byIp.ok) throw auth.tooMany(byIp.retry);
    const byPhone = await auth.hit(c, bPhone, auth.LIMITS.sendPhone);
    if (!byPhone.ok) throw auth.tooMany(byPhone.retry);
    // A new code replaces the old one and resets its tries.
    await c.query(`INSERT INTO web_otps (phone, code_hash, expires_at, attempts, sent_at) VALUES ($1, $2, NOW() + make_interval(secs => $3), 0, NOW())
      ON CONFLICT (phone) DO UPDATE SET code_hash = EXCLUDED.code_hash, expires_at = EXCLUDED.expires_at, attempts = 0, sent_at = NOW()`,
    [phone, auth.codeHash(phone, code), auth.CODE_TTL_SEC]);
    if (Math.random() < 0.05) await c.query('SELECT web_auth_cleanup()');
  });
  // Kamala sends it on WhatsApp (her server can take up to a minute to wake), after this reply has gone.
  const sent = r27.postKamala('/web-otp', { phone, code, ttl_min: auth.CODE_TTL_SEC / 60, ts: Date.now() })
    .then(r => { if (r !== 'sent') console.error(`Login code hand-off to Kamala: ${r}`); });
  const later = r27.afterResponse(sent);
  if (later) await later;
  return res.status(202).json({ ok: true, resend_in: auth.RESEND_AFTER_SEC, expires_in: auth.CODE_TTL_SEC });
}

async function verify(req, res) {
  const b = r27.body(req);
  const phone = phoneFrom(b);
  const otp = String(b.otp || '').replace(/\D/g, '');
  if (!/^\d{6}$/.test(otp)) throw new auth.Refusal(400, { error: 'Enter the 6-digit code from WhatsApp.', errors: { otp: 'Enter the 6-digit code.' } });
  const bIp = auth.bucket('verify-ip', auth.clientIp(req));
  const oldToken = auth.readCookie(req, auth.COOKIE);
  const token = auth.newToken();
  const out = await auth.tx({ otp_phone: phone, buckets: bIp }, async c => {
    const byIp = await auth.hit(c, bIp, auth.LIMITS.verifyIp);
    if (!byIp.ok) throw auth.tooMany(byIp.retry);
    const r = await c.query('SELECT code_hash, attempts, expires_at > NOW() AS live FROM web_otps WHERE phone = $1 FOR UPDATE', [phone]);
    const row = r.rows[0];
    if (!row || !row.live) return { refuse: [400, { error: 'This code has expired. Ask for a new one.', expired: true }] };
    if (row.attempts >= auth.MAX_CODE_TRIES) {
      await c.query('DELETE FROM web_otps WHERE phone = $1', [phone]);
      return { refuse: [429, { error: 'Too many wrong codes. Ask for a new one.', expired: true }] };
    }
    if (!auth.sameHex(auth.codeHash(phone, otp), row.code_hash)) {
      await c.query('UPDATE web_otps SET attempts = attempts + 1 WHERE phone = $1', [phone]);
      const left = auth.MAX_CODE_TRIES - row.attempts - 1;
      return { refuse: [400, { error: left > 0 ? `That code is not right. ${left} ${left === 1 ? 'try' : 'tries'} left.` : 'That code is not right. Ask for a new one.', errors: { otp: 'Wrong code.' }, expired: left <= 0 }] };
    }
    // Right code: it is used up, any earlier session in this browser ends, and a new one starts for this number.
    await c.query('DELETE FROM web_otps WHERE phone = $1', [phone]);
    if (auth.validToken(oldToken)) {
      await auth.scope(c, 'session', auth.sha256(oldToken));
      await c.query('DELETE FROM web_sessions WHERE token_hash = $1', [auth.sha256(oldToken)]);
    }
    await auth.scope(c, 'phone', phone);
    await c.query(`INSERT INTO web_sessions (token_hash, phone, expires_at) VALUES ($1, $2, NOW() + make_interval(days => $3))`, [auth.sha256(token), phone, auth.SESSION_DAYS]);
    const a = await c.query('SELECT name, email, dob::text AS dob FROM web_accounts WHERE phone = $1', [phone]);
    return { account: a.rows[0] || null };
  });
  if (out.refuse) return res.status(out.refuse[0]).json(Object.assign({ ok: false }, out.refuse[1]));
  res.setHeader('Set-Cookie', auth.sessionCookie(token));
  return res.status(200).json({ ok: true, exists: Boolean(out.account), account: out.account ? auth.publicAccount(out.account, phone) : null, phone: '+' + phone });
}

async function profile(req, res) {
  const read = auth.readProfile(r27.body(req));
  if (!read.ok) return res.status(400).json({ ok: false, errors: read.errors });
  const p = read.profile;
  const out = await auth.tx({}, async c => {
    const phone = await auth.sessionPhone(c, req);
    if (!phone) return { status: 401 };
    // Only a number with no account yet can fill this in; an existing account is left exactly as it is.
    const ins = await c.query(`INSERT INTO web_accounts (phone, name, email, dob) VALUES ($1, $2, $3, $4)
      ON CONFLICT (phone) DO NOTHING RETURNING name, email, dob::text AS dob`, [phone, p.name, p.email, p.dob]);
    if (ins.rows[0]) return { phone, account: ins.rows[0], created: true };
    const a = await c.query('SELECT name, email, dob::text AS dob FROM web_accounts WHERE phone = $1', [phone]);
    return { phone, account: a.rows[0], created: false };
  });
  if (out.status === 401) { res.setHeader('Set-Cookie', auth.clearCookie()); return res.status(401).json({ ok: false, error: 'Please sign in again.' }); }
  return res.status(out.created ? 201 : 200).json({ ok: true, created: out.created, account: auth.publicAccount(out.account, out.phone) });
}

async function me(req, res) {
  if (!auth.validToken(auth.readCookie(req, auth.COOKIE))) return res.status(200).json({ ok: true, signedIn: false });
  const out = await auth.tx({}, async c => {
    const phone = await auth.sessionPhone(c, req);
    if (!phone) return null;
    const a = await c.query('SELECT name, email, dob::text AS dob FROM web_accounts WHERE phone = $1', [phone]);
    return { phone, account: a.rows[0] || null };
  });
  if (!out) { res.setHeader('Set-Cookie', auth.clearCookie()); return res.status(200).json({ ok: true, signedIn: false }); }
  return res.status(200).json({ ok: true, signedIn: true, needsProfile: !out.account, phone: '+' + out.phone, account: out.account ? auth.publicAccount(out.account, out.phone) : null });
}

async function logout(req, res) {
  const token = auth.readCookie(req, auth.COOKIE);
  if (auth.validToken(token)) {
    await auth.tx({ session: auth.sha256(token) }, c => c.query('DELETE FROM web_sessions WHERE token_hash = $1', [auth.sha256(token)]));
  }
  res.setHeader('Set-Cookie', auth.clearCookie());
  return res.status(200).json({ ok: true });
}
