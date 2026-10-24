'use strict';
// Shared by the 2027 report payment functions (order.js, verify.js).
// Prices and the phase come from _catalog.json, written by tools/build_report.py, so the page and the
// server always charge the same amount. The browser never decides the price.
const crypto = require('crypto');
const CATALOG = require('./_catalog.json');
const store = require('./_db');

const env = name => String(process.env[name] || '').trim();
const KEY_ID = env('RAZORPAY_KEY_ID');
const KEY_SECRET = env('RAZORPAY_KEY_SECRET');
const RECEIPT_PREFIX = 'r27_';

const configured = () => Boolean(KEY_ID && KEY_SECRET);

/* ---------- small helpers ---------- */
function clean(value, max) {
  return String(value == null ? '' : value).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}
function timingSafeEqualHex(a, b) {
  const x = Buffer.from(String(a || ''), 'utf8');
  const y = Buffer.from(String(b || ''), 'utf8');
  return x.length > 0 && x.length === y.length && crypto.timingSafeEqual(x, y);
}
function money(amount, currency) {
  return currency === 'INR' ? '₹' + Number(amount).toLocaleString('en-IN') : 'US$' + Number(amount).toLocaleString('en-US');
}

/* ---------- request guards ---------- */
// Only our own pages may call these functions (other sites cannot make orders in our name).
function allowedOrigin(req) {
  const origin = String(req.headers.origin || '');
  if (!origin) return true; // same-origin form posts and server-to-server calls send none
  let host;
  try { host = new URL(origin).hostname; if (new URL(origin).host === String(req.headers.host || '')) return true; } catch (e) { return false; }
  const extra = env('R27_ALLOWED_ORIGINS').split(',').map(s => s.trim()).filter(Boolean);
  return host === 'veshannastro.co.in' || host === 'www.veshannastro.co.in' || /\.vercel\.app$/.test(host) || extra.includes(host);
}
function guard(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); res.status(405).json({ ok: false, error: 'Use POST.' }); return false; }
  if (!allowedOrigin(req)) { res.status(403).json({ ok: false, error: 'Not allowed.' }); return false; }
  return true;
}
function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(String(req.body || '{}')); } catch (e) { return {}; }
}

/* ---------- the order form ---------- */
// The WhatsApp number as digits with the country code, e.g. 919876543210. People type their number in many ways:
// with the country code again, with 00 or a leading 0. Indian mobiles must be 10 digits starting 6 to 9.
function normalisePhone(code, mobile) {
  const cc = String(code || '').replace(/\D/g, '');
  let m = String(mobile || '').replace(/\D/g, '');
  if (!/^\d{1,4}$/.test(cc) || !m) return null;
  if (m.startsWith('00' + cc)) m = m.slice(2 + cc.length);
  else if (m.length > 10 && m.startsWith(cc)) m = m.slice(cc.length);
  m = m.replace(/^0+/, '');
  if (cc === '91') return /^[6-9]\d{9}$/.test(m) ? cc + m : null;
  const full = cc + m;
  return m.length >= 6 && full.length >= 8 && full.length <= 15 ? full : null;
}

function todayIST() {
  return new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}

/** Checks every field again on the server. Returns { ok, order } or { ok: false, errors: { field: message } }. */
function readOrder(input) {
  const errors = {};
  const key = clean(input.report, 20);
  const report = CATALOG.reports[key];
  if (!report) errors.report = 'Choose Astro-Numero Blend or Classic.';

  const name = clean(input.name, 80);
  if (!/^[\p{L}\p{M}][\p{L}\p{M} .'-]{1,79}$/u.test(name)) errors.name = 'Please enter your full name.';

  const dob = clean(input.dob, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  const d = m && new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  if (!m || !d || d.getUTCFullYear() !== +m[1] || d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3] || +m[1] < 1900 || dob > todayIST()) {
    errors.dob = 'Please enter a real date of birth.';
  }

  let tob = clean(input.tob, 8).toUpperCase();
  if (report && report.needs_time) {
    if (!/^(1[0-2]|[1-9]):[0-5]\d (AM|PM)$/.test(tob)) errors.tob = 'The Astro-Numero Blend needs your time of birth.';
  } else tob = '';

  const pob = clean(input.pob, 100);
  if (pob.length < 2 || !/\p{L}/u.test(pob)) errors.pob = 'Please enter your place of birth.';

  // Email is optional (reports go on WhatsApp); when given it must look like an email.
  const email = clean(input.email, 120).toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = 'Check the email, or leave it empty.';

  const phone = normalisePhone(input.code, input.mobile);
  if (!phone) errors.mobile = 'Please enter a valid WhatsApp number.';

  const referral = clean(input.referral, 40);
  if (referral && !/^[\p{L}\p{N} _-]+$/u.test(referral)) errors.referral = 'Use letters and numbers only.';

  if (input.terms !== true) errors.terms = 'Please accept the terms, privacy and refund policy.';

  if (Object.keys(errors).length) return { ok: false, errors };
  const currency = String(input.code || '').replace(/\D/g, '') === '91' ? 'INR' : 'USD';
  const amount = currency === 'INR' ? report.inr : report.usd;
  const mrp = currency === 'INR' ? report.inr_mrp : report.usd_mrp;
  return {
    ok: true,
    order: { key, report, name, dob, tob, pob, email, phone, referral, updates: input.updates === true, currency, amount, mrp }
  };
}

/* ---------- Razorpay ---------- */
async function razorpay(method, path, payload) {
  const res = await fetch('https://api.razorpay.com/v1' + path, {
    method,
    headers: { Authorization: 'Basic ' + Buffer.from(KEY_ID + ':' + KEY_SECRET).toString('base64'), 'Content-Type': 'application/json' },
    body: payload ? JSON.stringify(payload) : undefined,
    signal: AbortSignal.timeout(12000)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data && data.error && data.error.description) || 'Razorpay HTTP ' + res.status);
    err.status = res.status;
    throw err;
  }
  return data;
}

// Paid 2027 orders so far, counted from Razorpay itself (no separate database to fall out of step).
// Kept for a minute per server so a busy hour does not call Razorpay for every order.
let soldCache = { at: 0, n: 0 };
async function soldCount() {
  if (Date.now() - soldCache.at < 60 * 1000) return soldCache.n;
  const from = Math.floor(Date.parse(env('R27_COUNT_FROM') || '2026-10-20T00:00:00+05:30') / 1000);
  let n = 0;
  for (let skip = 0; skip < 3000; skip += 100) {
    const page = await razorpay('GET', `/orders?count=100&skip=${skip}&from=${from}&authorized=1`);
    const items = Array.isArray(page.items) ? page.items : [];
    n += items.filter(o => String(o.receipt || '').startsWith(RECEIPT_PREFIX)).length;
    if (items.length < 100) break;
  }
  soldCache = { at: Date.now(), n };
  return n;
}

/** Whether phase one still takes orders. Fails open on a Razorpay hiccup: the date limit still applies. */
async function phaseOpen() {
  if (env('R27_CLOSED') === '1') return false;
  if (Date.now() > Date.parse(CATALOG.offer.closes_at)) return false;
  const limit = Number(env('R27_LIMIT') || CATALOG.offer.limit);
  const extra = Number(env('R27_SOLD_ELSEWHERE') || 0); // 2027 reports already sold on WhatsApp, if you want them counted
  try {
    return (await soldCount()) + extra < limit;
  } catch (e) {
    console.error('Could not count phase one orders, taking the order:', e.message);
    return true;
  }
}

/* ---------- Kamala ---------- */
// Wakes Kamala (Render can be asleep for up to a minute) and hands her the paid order. She checks it with Razorpay
// herself before doing anything, and Razorpay's own webhook reaches her too, so this is a fast path, not the only one.
async function tellKamala(orderId, paymentId) {
  return postKamala('/web-order', { order_id: orderId, payment_id: paymentId });
}

// The order form, handed to Kamala so she knows this person when they message (details she already has are kept).
function tellKamalaLead(o, stage) {
  return postKamala('/web-lead', {
    phone: o.phone, name: o.name, email: o.email, dob: o.dob, tob: o.tob, pob: o.pob, referral: o.referral,
    report: o.key, report_name: o.report.name, price: money(o.amount, o.currency), stage
  });
}

// The form goes straight into the shared database when it is connected (Vercel DATABASE_URL), else to Kamala.
async function recordLead(o, stage, visitor) {
  if (store.enabled()) {
    try {
      if (await store.saveLead(o, stage, visitor, money(o.amount, o.currency)) === 'saved') return 'database';
    } catch (e) {
      console.error('Saving the order form to the database failed, handing it to Kamala:', e.message);
    }
  }
  return tellKamalaLead(o, stage);
}

async function postKamala(path, body) {
  const url = env('KAMALA_URL').replace(/\/+$/, '');
  const secret = env('WEB_ORDER_SECRET');
  if (!url || !secret) return 'skipped';
  const payload = JSON.stringify(body);
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  // Both tries fit inside the function's 60 seconds: the first waits out a Render cold start, the second is quick.
  const waits = [40000, 15000];
  for (let attempt = 1; attempt <= waits.length; attempt++) {
    try {
      const res = await fetch(url + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-veshannastro-signature': signature },
        body: payload,
        signal: AbortSignal.timeout(waits[attempt - 1])
      });
      if (res.ok) return 'sent';
      if (res.status < 500) return 'refused ' + res.status;
    } catch (e) {
      console.error(`Kamala hand-off attempt ${attempt} failed:`, e.message);
    }
    if (attempt < waits.length) await new Promise(r => setTimeout(r, 2000));
  }
  return 'failed';
}

// Lets slow work finish after the reply has gone to the browser (Vercel's waitUntil), without a package.
function afterResponse(promise) {
  const ctx = globalThis[Symbol.for('@vercel/request-context')];
  const waitUntil = ctx && typeof ctx.get === 'function' && ctx.get() && ctx.get().waitUntil;
  if (typeof waitUntil === 'function') { waitUntil(promise); return null; }
  return promise; // not on Vercel: the caller awaits it
}

module.exports = {
  CATALOG, RECEIPT_PREFIX, configured, keyId: () => KEY_ID, keySecret: () => KEY_SECRET,
  clean, timingSafeEqualHex, money, guard, body, normalisePhone, readOrder, razorpay, phaseOpen, tellKamala, tellKamalaLead, recordLead, postKamala, afterResponse, store
};
