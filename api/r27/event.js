'use strict';
// POST /api/r27/event: what a visitor does on the site (pages, the calculator, report choice, WhatsApp taps, payment
// steps), sent in small batches. Kept in the shared database with a random id from the visitor's browser, and joined
// to their WhatsApp number once they submit the order form, so Kamala sees the whole story. No database: ignored.
const lib = require('./_lib');

const recent = new Map();

module.exports = async function handler(req, res) {
  if (!lib.guard(req, res)) return;
  if (!lib.store.enabled()) return res.status(204).end();
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const hits = (recent.get(ip) || []).filter(t => now - t < 60 * 1000);
  if (hits.length >= 40) return res.status(429).json({ ok: false });
  hits.push(now); recent.set(ip, hits);
  if (recent.size > 5000) recent.clear();
  const b = lib.body(req);
  try {
    const n = await lib.store.addEvents(String(b.visitor || ''), b.events);
    return res.status(202).json({ ok: true, saved: n });
  } catch (e) {
    console.error('Saving website activity failed:', e.message);
    return res.status(202).json({ ok: false });
  }
};
