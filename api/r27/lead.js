'use strict';
// POST /api/r27/lead: the order form, sent when someone continues to review it (after ticking the terms and privacy
// box) or chooses to order on WhatsApp. Kamala keeps the details against their WhatsApp number, so when they message
// she already knows them and never asks again.
const lib = require('./_lib');

const recent = new Map(); // per server instance: a handful of saves a minute per visitor is plenty

module.exports = async function handler(req, res) {
  if (!lib.guard(req, res)) return;
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const hits = (recent.get(ip) || []).filter(t => now - t < 60 * 1000);
  if (hits.length >= 8) return res.status(429).json({ ok: false });
  hits.push(now); recent.set(ip, hits);
  if (recent.size > 5000) recent.clear();

  const b = lib.body(req);
  const read = lib.readOrder(b);
  if (!read.ok) return res.status(400).json({ ok: false, errors: read.errors });
  const stage = ['form', 'whatsapp'].includes(b.stage) ? b.stage : 'form';
  // Straight into the shared database (quick), or handed to Kamala after the reply when it is not connected.
  if (lib.store.enabled()) {
    const r = await lib.recordLead(read.order, stage, String(b.visitor || ''));
    return res.status(202).json({ ok: true, saved: r });
  }
  const later = lib.afterResponse(lib.tellKamalaLead(read.order, stage));
  if (later) await later;
  return res.status(202).json({ ok: true, saved: 'kamala' });
};
