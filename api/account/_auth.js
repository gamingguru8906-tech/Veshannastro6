'use strict';
// Sign in with a WhatsApp code, for the account button in the header (assets/r27/account.js).
//
// The flow: the visitor types their WhatsApp number, we keep a keyed hash of a random 6-digit code and ask Kamala to
// send the code on WhatsApp (signed with WEB_ORDER_SECRET). The right code within 5 minutes starts a session: a random
// token in an HttpOnly cookie, stored here only as its SHA-256. A new number then adds name, email and date of birth.
//
// Every query runs as the restricted web_auth login (AUTH_DATABASE_URL, see db/2026-11-accounts.sql) inside a
// transaction that names the one number or session it may see, so Postgres row-level security enforces "your own
// account only" even if a bug here asked for more. The browser never sends an account id: the session decides.
const crypto = require('crypto');
const tls = require('tls');
const { Pool } = require('pg');
const r27 = require('../r27/_lib');

const env = name => String(process.env[name] || '').trim();

const CODE_TTL_SEC = 5 * 60;
const RESEND_AFTER_SEC = 60;
const MAX_CODE_TRIES = 5;
const SESSION_DAYS = 30;
const COOKIE = '__Host-vs_session';
// Per hour: codes sent to one number, codes asked for from one IP, code checks from one IP.
const LIMITS = { sendPhone: 5, sendIp: 12, verifyIp: 30 };

function configured() {
  return Boolean(env('AUTH_DATABASE_URL') && env('AUTH_OTP_PEPPER').length >= 32 && env('KAMALA_URL') && env('WEB_ORDER_SECRET'));
}

/* ---------- database: the restricted login, with the server certificate checked ---------- */
let pool = null;
function db() {
  if (!pool) {
    const url = new URL(env('AUTH_DATABASE_URL'));
    url.searchParams.delete('sslmode'); // the ssl option below decides: encrypted and verified, never "accept anything"
    // Verified TLS: the public roots plus Supabase's own root (its database certificates are signed by it).
    const ca = tls.rootCertificates.concat(require('./_supabase-ca'));
    pool = new Pool({ connectionString: url.toString(), ssl: { rejectUnauthorized: true, ca }, max: 2, idleTimeoutMillis: 10000, connectionTimeoutMillis: 7000 });
    pool.on('error', e => console.error('Auth database idle connection error:', e.message));
  }
  return pool;
}

/** Runs fn(client) in one transaction with the row-level-security settings it may use (app.phone and friends). */
async function tx(settings, fn) {
  const client = await db().connect();
  try {
    await client.query('BEGIN');
    for (const [k, v] of Object.entries(settings)) await client.query('SELECT set_config($1, $2, true)', ['app.' + k, String(v)]);
    const out = await fn(client);
    await client.query('COMMIT');
    return out;
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
const scope = (client, k, v) => client.query('SELECT set_config($1, $2, true)', ['app.' + k, String(v)]);

/* ---------- codes, tokens and hashes ---------- */
const sha256 = s => crypto.createHash('sha256').update(String(s)).digest('hex');
const keyed = s => crypto.createHmac('sha256', env('AUTH_OTP_PEPPER')).update(String(s)).digest('hex');
const newCode = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');
const codeHash = (phone, code) => keyed('otp:' + phone + ':' + code);
const newToken = () => crypto.randomBytes(32).toString('base64url');
// Rate-limit counters are keyed by a hash, so the table never holds raw numbers or IP addresses.
const bucket = (kind, value) => kind + ':' + keyed('bucket:' + kind + ':' + value).slice(0, 32);
function sameHex(a, b) {
  const x = Buffer.from(String(a), 'hex'), y = Buffer.from(String(b), 'hex');
  return x.length === 32 && y.length === 32 && crypto.timingSafeEqual(x, y);
}

/* ---------- request checks ---------- */
// Vercel sets x-real-ip from the connection itself; the forwarded-for chain is only a fallback off Vercel.
function clientIp(req) {
  const h = req.headers;
  return String(h['x-real-ip'] || h['x-vercel-forwarded-for'] || h['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
}
// State-changing calls must come from our own pages: an exact Origin match (no wildcard hosts) plus a custom header
// that another site cannot add without a CORS preflight we never answer. Together with SameSite cookies this is CSRF-proof.
function allowedOrigin(req) {
  const origin = String(req.headers.origin || '');
  if (!origin) return false;
  let u;
  try { u = new URL(origin); } catch (e) { return false; }
  if (u.host === String(req.headers.host || '')) return true;
  const allowed = ['https://www.veshannastro.co.in', 'https://veshannastro.co.in'].concat(env('ACCOUNT_ALLOWED_ORIGINS').split(',').map(s => s.trim()).filter(Boolean));
  return allowed.includes(u.origin);
}
function guard(req, res, method) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Vary', 'Cookie');
  if (req.method !== method) { res.setHeader('Allow', method); res.status(405).json({ ok: false, error: 'Method not allowed.' }); return false; }
  if (method !== 'GET' && (!allowedOrigin(req) || req.headers['x-requested-with'] !== 'veshannastro')) {
    res.status(403).json({ ok: false, error: 'Not allowed.' });
    return false;
  }
  if (!configured()) { res.status(503).json({ ok: false, error: 'Sign in is not available yet. Please try again later.' }); return false; }
  return true;
}

/* ---------- cookies ---------- */
function readCookie(req, name) {
  for (const part of String(req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return '';
}
const validToken = t => /^[A-Za-z0-9_-]{43}$/.test(t);
// __Host- means: only over HTTPS, only for this exact host, path /. JavaScript on the page cannot read it.
const sessionCookie = token => `${COOKIE}=${token}; Path=/; Max-Age=${SESSION_DAYS * 86400}; HttpOnly; Secure; SameSite=Lax`;
const clearCookie = () => `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;

/* ---------- the profile a new account fills in ---------- */
function todayIST() { return new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10); }
function readProfile(input) {
  const errors = {};
  const name = r27.clean(input.name, 80);
  if (!/^[\p{L}\p{M}][\p{L}\p{M} .'-]{1,79}$/u.test(name)) errors.name = 'Please enter your full name.';
  const email = r27.clean(input.email, 120).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length < 6) errors.email = 'Please enter a valid email.';
  const dob = r27.clean(input.dob, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  const d = m && new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  if (!m || d.getUTCFullYear() !== +m[1] || d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3] || +m[1] < 1900 || dob > todayIST()) {
    errors.dob = 'Please enter your real date of birth.';
  }
  const extra = readExtras(input, errors);
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, profile: Object.assign({ name, email, dob }, extra) };
}
/** The optional details (birth time, birth place, gender): empty is fine and saves as nothing; a wrong value is an error. */
const GENDERS = ['male', 'female', 'other'];
function readExtras(input, errors) {
  const tob = r27.clean(input.tob, 5);
  if (tob && !/^([01]\d|2[0-3]):[0-5]\d$/.test(tob)) errors.tob = 'Please choose the hour, minute and AM or PM, or leave the time empty.';
  const pob = r27.clean(input.pob, 120);
  if (pob && pob.length < 2) errors.pob = 'Please enter your town or city of birth, or leave it empty.';
  const gender = r27.clean(input.gender, 10).toLowerCase();
  if (gender && !GENDERS.includes(gender)) errors.gender = 'Please choose an option, or leave it empty.';
  return { tob: tob || null, pob: pob || null, gender: gender || null };
}
function readDetails(input) {
  const errors = {};
  const extra = readExtras(input || {}, errors);
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, details: extra };
}
const ACCOUNT_COLUMNS = 'name, email, dob::text AS dob, tob, pob, gender';
const isoDate = v => (v instanceof Date ? new Date(v.getTime() - v.getTimezoneOffset() * 60000).toISOString() : String(v)).slice(0, 10);
const publicAccount = (a, phone) => ({ name: a.name, first: String(a.name).split(' ')[0], email: a.email, dob: isoDate(a.dob),
  tob: a.tob || '', pob: a.pob || '', gender: a.gender || '', phone: '+' + phone });

/* ---------- rate limits (fixed one-hour windows in Postgres, shared by every instance) ---------- */
async function hit(client, key, limit, windowSec = 3600) {
  const r = await client.query(`INSERT INTO web_auth_limits (bucket, window_start, hits) VALUES ($1, NOW(), 1)
    ON CONFLICT (bucket) DO UPDATE SET
      hits = CASE WHEN web_auth_limits.window_start < NOW() - make_interval(secs => $2) THEN 1 ELSE web_auth_limits.hits + 1 END,
      window_start = CASE WHEN web_auth_limits.window_start < NOW() - make_interval(secs => $2) THEN NOW() ELSE web_auth_limits.window_start END
    RETURNING hits, GREATEST(1, CEIL(EXTRACT(EPOCH FROM (window_start + make_interval(secs => $2) - NOW()))))::int AS retry`, [key, windowSec]);
  return { ok: r.rows[0].hits <= limit, retry: r.rows[0].retry };
}
class Refusal extends Error {
  constructor(status, body) { super(body.error || 'refused'); this.status = status; this.body = Object.assign({ ok: false }, body); }
}
const tooMany = retry => new Refusal(429, { error: 'Too many attempts. Please try again later.', retry_after: retry });

/* ---------- sessions ---------- */
/** The session behind this request's cookie, or null. Sets app.phone for the rest of the transaction when valid. */
async function sessionPhone(client, req) {
  const token = readCookie(req, COOKIE);
  if (!validToken(token)) return null;
  const th = sha256(token);
  await scope(client, 'session', th);
  const r = await client.query('SELECT phone, last_seen_at < NOW() - INTERVAL \'1 hour\' AS stale FROM web_sessions WHERE token_hash = $1 AND expires_at > NOW()', [th]);
  if (!r.rows[0]) return null;
  if (r.rows[0].stale) await client.query('UPDATE web_sessions SET last_seen_at = NOW() WHERE token_hash = $1', [th]);
  await scope(client, 'phone', r.rows[0].phone);
  return r.rows[0].phone;
}

module.exports = {
  CODE_TTL_SEC, RESEND_AFTER_SEC, MAX_CODE_TRIES, SESSION_DAYS, COOKIE, LIMITS,
  configured, db, tx, scope, sha256, newCode, codeHash, newToken, bucket, sameHex, clientIp, allowedOrigin, guard,
  readCookie, validToken, sessionCookie, clearCookie, readProfile, readDetails, ACCOUNT_COLUMNS, publicAccount, hit, Refusal, tooMany,
  sessionPhone, r27
};
