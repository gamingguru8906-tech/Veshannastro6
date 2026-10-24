'use strict';
// GET /api/r27/status: whether the page can take payment right now, and what is missing if not.
// Never shows a key: only whether each setting is present. Open it in a browser after changing settings in Vercel.
const lib = require('./_lib');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.setHeader('Allow', 'GET'); return res.status(405).json({ ok: false }); }
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30, stale-while-revalidate=60');
  const keys = lib.configured();
  const id = lib.keyId();
  const open = keys ? await lib.phaseOpen() : Date.now() <= Date.parse(lib.CATALOG.offer.closes_at);
  const kamala = Boolean(String(process.env.KAMALA_URL || '').trim() && String(process.env.WEB_ORDER_SECRET || '').trim());
  const missing = [];
  if (!String(process.env.RAZORPAY_KEY_ID || '').trim()) missing.push('RAZORPAY_KEY_ID');
  if (!String(process.env.RAZORPAY_KEY_SECRET || '').trim()) missing.push('RAZORPAY_KEY_SECRET');
  if (!String(process.env.KAMALA_URL || '').trim()) missing.push('KAMALA_URL');
  if (!String(process.env.WEB_ORDER_SECRET || '').trim()) missing.push('WEB_ORDER_SECRET');
  res.status(200).json({
    ok: true,
    online: keys && open,
    razorpay_keys: keys,
    key_mode: !keys ? null : /^rzp_live_/.test(id) ? 'live' : /^rzp_test_/.test(id) ? 'test' : 'unknown',
    kamala_handoff: kamala,
    phase_open: open,
    usd: process.env.R27_USD === 'on',
    missing
  });
};
