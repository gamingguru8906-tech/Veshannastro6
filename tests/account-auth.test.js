'use strict';
// Sign in with a WhatsApp code (api/account). Run: node --test tests/account-auth.test.js
// Postgres is replaced by a small in-memory stand-in that applies the same row-level-security rules as
// db/2026-11-accounts.sql, so these tests also prove every query names the one number or session it may see.
const test = require('node:test');
const assert = require('node:assert');

Object.assign(process.env, {
  AUTH_DATABASE_URL: 'postgresql://web_auth:x@db.example.neon.tech/neondb?sslmode=require',
  AUTH_OTP_PEPPER: 'test-pepper-0123456789abcdef0123456789abcdef',
  KAMALA_URL: 'https://kamala.example', WEB_ORDER_SECRET: 'shh'
});

/* ---------- a fake pg with row-level security ---------- */
const store = { otps: new Map(), sessions: new Map(), accounts: new Map(), limits: new Map() };
const snapshot = () => ({ otps: new Map([...store.otps].map(([k, v]) => [k, { ...v }])), sessions: new Map([...store.sessions].map(([k, v]) => [k, { ...v }])), accounts: new Map([...store.accounts].map(([k, v]) => [k, { ...v }])), limits: new Map([...store.limits].map(([k, v]) => [k, { ...v }])) });
const rls = msg => { const e = new Error('new row violates row-level security policy: ' + msg); e.code = '42501'; throw e; };
let clock = Date.now();
class FakeClient {
  constructor() { this.set = {}; this.saved = null; }
  release() {}
  async query(sql, p = []) {
    const s = this.set, now = clock;
    if (sql === 'BEGIN') { this.set = {}; this.saved = snapshot(); return { rows: [] }; }
    if (sql === 'COMMIT') { this.set = {}; return { rows: [] }; }
    if (sql === 'ROLLBACK') { Object.assign(store, this.saved); this.set = {}; return { rows: [] }; }
    if (/^SELECT set_config/.test(sql)) { s[p[0]] = p[1]; return { rows: [] }; }
    if (/web_auth_cleanup/.test(sql)) return { rows: [] };
    if (/INSERT INTO web_auth_limits/.test(sql)) {
      if (!String(s['app.buckets'] || '').split(',').includes(p[0])) rls('limits');
      const cur = store.limits.get(p[0]);
      const fresh = !cur || cur.start < now - p[1] * 1000;
      const row = fresh ? { start: now, hits: 1 } : { start: cur.start, hits: cur.hits + 1 };
      store.limits.set(p[0], row);
      return { rows: [{ hits: row.hits, retry: Math.max(1, Math.ceil((row.start + p[1] * 1000 - now) / 1000)) }] };
    }
    const otpVisible = ph => ph === s['app.otp_phone'];
    if (/SELECT EXTRACT\(EPOCH FROM \(NOW\(\) - sent_at\)\)::int AS ago FROM web_otps/.test(sql)) {
      const r = otpVisible(p[0]) && store.otps.get(p[0]);
      return { rows: r ? [{ ago: Math.floor((now - r.sent) / 1000) }] : [] };
    }
    if (/INSERT INTO web_otps/.test(sql)) {
      if (!otpVisible(p[0])) rls('otps');
      store.otps.set(p[0], { hash: p[1], expires: now + p[2] * 1000, attempts: 0, sent: now });
      return { rows: [] };
    }
    if (/SELECT code_hash, attempts/.test(sql)) {
      const r = otpVisible(p[0]) && store.otps.get(p[0]);
      return { rows: r ? [{ code_hash: r.hash, attempts: r.attempts, live: r.expires > now }] : [] };
    }
    if (/^DELETE FROM web_otps/.test(sql)) { if (otpVisible(p[0])) store.otps.delete(p[0]); return { rows: [] }; }
    if (/^UPDATE web_otps SET attempts/.test(sql)) { if (otpVisible(p[0])) store.otps.get(p[0]).attempts++; return { rows: [] }; }
    if (/^DELETE FROM web_sessions/.test(sql)) { if (p[0] === s['app.session']) store.sessions.delete(p[0]); return { rows: [] }; }
    if (/INSERT INTO web_sessions/.test(sql)) {
      if (p[1] !== s['app.phone']) rls('sessions');
      store.sessions.set(p[0], { phone: p[1], expires: now + p[2] * 86400000, seen: now });
      return { rows: [] };
    }
    if (/SELECT phone, last_seen_at/.test(sql)) {
      const r = p[0] === s['app.session'] && store.sessions.get(p[0]);
      return { rows: r && r.expires > now ? [{ phone: r.phone, stale: false }] : [] };
    }
    if (/^UPDATE web_sessions SET last_seen_at/.test(sql)) return { rows: [] };
    if (/SELECT name, email, dob::text AS dob FROM web_accounts/.test(sql)) {
      const a = p[0] === s['app.phone'] && store.accounts.get(p[0]);
      return { rows: a ? [{ ...a }] : [] };
    }
    if (/INSERT INTO web_accounts/.test(sql)) {
      if (p[0] !== s['app.phone']) rls('accounts');
      if (store.accounts.has(p[0])) return { rows: [] };
      store.accounts.set(p[0], { name: p[1], email: p[2], dob: p[3] });
      return { rows: [{ name: p[1], email: p[2], dob: p[3] }] };
    }
    throw new Error('Unexpected SQL in test: ' + sql.slice(0, 80));
  }
}
class FakePool { connect() { return Promise.resolve(new FakeClient()); } on() {} }
// Every require('pg') gets the fake (the real driver need not even be installed to run these tests).
const Module = require('module');
const realLoad = Module._load;
Module._load = function (request, ...rest) { return request === 'pg' ? { Pool: FakePool } : realLoad.call(this, request, ...rest); };

const r27 = require('../api/r27/_lib');
const auth = require('../api/account/_auth');
const handler = require('../api/account/[action].js');
const kamala = [];
r27.postKamala = async (route, body) => { kamala.push({ route, body }); return 'sent'; };

/* ---------- requests ---------- */
let ipN = 0;
function req(action, { method = 'POST', body = {}, cookie = '', origin = 'https://www.veshannastro.co.in', header = 'veshannastro', ip } = {}) {
  const headers = { host: 'www.veshannastro.co.in', 'x-real-ip': ip || '203.0.113.' + (++ipN % 250) };
  if (origin) headers.origin = origin;
  if (header) headers['x-requested-with'] = header;
  if (cookie) headers.cookie = cookie;
  return { method, query: { action }, headers, body };
}
async function run(r) {
  const res = { statusCode: 200, headers: {}, body: null, status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; }, setHeader(k, v) { this.headers[k.toLowerCase()] = v; }, end() { return this; } };
  await handler(r, res);
  return res;
}
const cookieOf = res => String(res.headers['set-cookie'] || '').split(';')[0];
const lastCode = () => kamala.filter(k => k.route === '/web-otp').pop().body.code;
const IN = { code: '+91', mobile: '98765 43210' };

test('only our own pages can call it: method, origin, custom header', async () => {
  assert.strictEqual((await run(req('send-code', { method: 'GET' }))).statusCode, 405);
  assert.strictEqual((await run(req('send-code', { body: IN, origin: '' }))).statusCode, 403);
  assert.strictEqual((await run(req('send-code', { body: IN, origin: 'https://evil.vercel.app' }))).statusCode, 403);
  assert.strictEqual((await run(req('send-code', { body: IN, origin: 'https://www.veshannastro.co.in.evil.com' }))).statusCode, 403);
  assert.strictEqual((await run(req('send-code', { body: IN, header: '' }))).statusCode, 403);
  assert.strictEqual((await run(req('nope'))).statusCode, 404);
});

test('the full sign-in: code, new account, profile, me, logout', async () => {
  const sent = await run(req('send-code', { body: IN }));
  assert.strictEqual(sent.statusCode, 202);
  const code = lastCode();
  assert.match(code, /^\d{6}$/);
  assert.strictEqual(kamala[kamala.length - 1].body.phone, '919876543210');
  // only a keyed hash of the code is kept
  assert.ok(![...store.otps.values()].some(o => JSON.stringify(o).includes(code)));

  const wrong = await run(req('verify', { body: { ...IN, otp: code === '000000' ? '111111' : '000000' } }));
  assert.strictEqual(wrong.statusCode, 400);
  assert.match(wrong.body.error, /4 tries left/);

  const ok = await run(req('verify', { body: { ...IN, otp: code } }));
  assert.strictEqual(ok.statusCode, 200);
  assert.strictEqual(ok.body.exists, false);
  const sc = ok.headers['set-cookie'];
  assert.match(sc, /^__Host-vs_session=[A-Za-z0-9_-]{43}; Path=\/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax$/);
  // the cookie value is not what is stored
  assert.ok(!store.sessions.has(cookieOf(ok).split('=')[1]));
  // the code is used up
  assert.strictEqual((await run(req('verify', { body: { ...IN, otp: code } }))).statusCode, 400);

  const cookie = cookieOf(ok);
  const me1 = await run(req('me', { method: 'GET', cookie }));
  assert.deepStrictEqual([me1.body.signedIn, me1.body.needsProfile], [true, true]);

  const bad = await run(req('profile', { cookie, body: { name: 'A', email: 'nope', dob: '2999-01-01' } }));
  assert.strictEqual(bad.statusCode, 400);
  assert.deepStrictEqual(Object.keys(bad.body.errors).sort(), ['dob', 'email', 'name']);

  const made = await run(req('profile', { cookie, body: { name: 'Asha Rao', email: 'Asha@Example.com', dob: '1990-06-15' } }));
  assert.strictEqual(made.statusCode, 201);
  assert.deepStrictEqual(made.body.account, { name: 'Asha Rao', first: 'Asha', email: 'asha@example.com', dob: '1990-06-15', phone: '+919876543210' });

  // an existing account is never overwritten by a second profile call
  const again = await run(req('profile', { cookie, body: { name: 'Someone Else', email: 'x@y.zz', dob: '1980-01-01' } }));
  assert.strictEqual(again.statusCode, 200);
  assert.strictEqual(again.body.account.name, 'Asha Rao');

  const me2 = await run(req('me', { method: 'GET', cookie }));
  assert.strictEqual(me2.body.account.email, 'asha@example.com');

  const out = await run(req('logout', { cookie, body: {} }));
  assert.match(out.headers['set-cookie'], /Max-Age=0/);
  assert.strictEqual((await run(req('me', { method: 'GET', cookie }))).body.signedIn, false);
});

test('a returning number is told its account exists, and sees only its own', async () => {
  // Asha (from the previous test) signs in again; Ravi has a different number
  await run(req('send-code', { body: IN }));
  const asha = await run(req('verify', { body: { ...IN, otp: lastCode() } }));
  assert.strictEqual(asha.body.exists, true);
  assert.strictEqual(asha.body.account.name, 'Asha Rao');

  const RAVI = { code: '+91', mobile: '9123456780' };
  await run(req('send-code', { body: RAVI }));
  const ravi = await run(req('verify', { body: { ...RAVI, otp: lastCode() } }));
  assert.strictEqual(ravi.body.exists, false);
  const me = await run(req('me', { method: 'GET', cookie: cookieOf(ravi) }));
  assert.strictEqual(me.body.phone, '+919123456780');
  assert.strictEqual(me.body.account, null);
  // body fields cannot pick another account: the session decides
  const made = await run(req('profile', { cookie: cookieOf(ravi), body: { name: 'Ravi Kumar', email: 'ravi@example.com', dob: '1985-02-03', phone: '919876543210' } }));
  assert.strictEqual(made.body.account.phone, '+919123456780');
  assert.strictEqual(store.accounts.get('919876543210').name, 'Asha Rao');
});

test('a forged or expired cookie gets nothing', async () => {
  const forged = '__Host-vs_session=' + 'A'.repeat(43);
  assert.strictEqual((await run(req('me', { method: 'GET', cookie: forged }))).body.signedIn, false);
  assert.strictEqual((await run(req('profile', { cookie: forged, body: { name: 'Eve Mallory', email: 'eve@evil.com', dob: '1990-01-01' } }))).statusCode, 401);
  const P = { code: '+91', mobile: '9000000001' };
  await run(req('send-code', { body: P }));
  const s = await run(req('verify', { body: { ...P, otp: lastCode() } }));
  clock += 31 * 86400000; // 31 days later
  assert.strictEqual((await run(req('me', { method: 'GET', cookie: cookieOf(s) }))).body.signedIn, false);
  clock -= 31 * 86400000;
});

test('codes: 60 seconds between sends, 5 wrong tries, 5 minutes to use', async () => {
  const P = { code: '+91', mobile: '9000000002' };
  assert.strictEqual((await run(req('send-code', { body: P }))).statusCode, 202);
  const again = await run(req('send-code', { body: P }));
  assert.strictEqual(again.statusCode, 429);
  assert.ok(again.headers['retry-after']);

  const code = lastCode();
  const wrongOtp = code === '000000' ? '111111' : '000000';
  for (let i = 0; i < 5; i++) await run(req('verify', { body: { ...P, otp: wrongOtp } }));
  const locked = await run(req('verify', { body: { ...P, otp: code } }));
  assert.ok([400, 429].includes(locked.statusCode));
  assert.strictEqual(locked.body.ok, false);

  clock += 61 * 1000;
  await run(req('send-code', { body: P }));
  const fresh = lastCode();
  clock += 6 * 60 * 1000; // past the 5 minutes
  const late = await run(req('verify', { body: { ...P, otp: fresh } }));
  assert.strictEqual(late.statusCode, 400);
  assert.strictEqual(late.body.expired, true);
});

test('one number gets at most 5 codes an hour, one IP at most 12', async () => {
  const P = { code: '+91', mobile: '9000000003' };
  const codes = [];
  for (let i = 0; i < 6; i++) { codes.push((await run(req('send-code', { body: P }))).statusCode); clock += 61 * 1000; }
  assert.deepStrictEqual(codes, [202, 202, 202, 202, 202, 429]);
  const ipCodes = [];
  for (let i = 0; i < 13; i++) ipCodes.push((await run(req('send-code', { body: { code: '+91', mobile: '90000001' + String(i).padStart(2, '0') }, ip: '198.51.100.7' }))).statusCode);
  assert.strictEqual(ipCodes.filter(c => c === 202).length, 12);
  assert.strictEqual(ipCodes[12], 429);
  clock += 2 * 3600 * 1000;
});

test('helpers: numbers, profile checks, hashed rate-limit keys', () => {
  assert.strictEqual(r27.normalisePhone('+91', '098765 43210'), '919876543210');
  assert.strictEqual(r27.normalisePhone('+91', '12345'), null);
  assert.ok(!auth.bucket('send-ip', '203.0.113.9').includes('203.0.113.9'));
  assert.strictEqual(auth.readProfile({ name: '  Asha  Rao ', email: 'a@b.co', dob: '1990-02-30' }).errors.dob, 'Please enter your real date of birth.');
  assert.strictEqual(auth.readProfile({ name: '=HYPERLINK("x")', email: 'a@b.co', dob: '1990-02-03' }).ok, false);
  assert.ok(auth.validToken(auth.newToken()));
});
