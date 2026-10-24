'use strict';
// POST /api/r27/draft: the 2027 order form as it is being typed (a few seconds after the last key), before anything
// is pressed. Handed to Kamala, who writes it to the "Website Forms" tab of the Sheet and, when a WhatsApp number is
// typed and the order is not finished, sends that number one message (form-drafts.js in the whatsapp-agent repo).
// The form says so at the top. Fields are checked again by Kamala; here they are only trimmed and size-limited.
const lib = require('./_lib');

const recent = new Map(); // per server instance: one save every few seconds per visitor is the normal rate

module.exports = async function handler(req, res) {
  if (!lib.guard(req, res)) return;
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const hits = (recent.get(ip) || []).filter(t => now - t < 60 * 1000);
  if (hits.length >= 40) return res.status(429).json({ ok: false });
  hits.push(now); recent.set(ip, hits);
  if (recent.size > 5000) recent.clear();

  const b = lib.body(req);
  const visitor = String(b.visitor || '').toLowerCase();
  if (!/^[a-f0-9]{16,40}$/.test(visitor)) return res.status(400).json({ ok: false });
  const draft = {
    visitor,
    report: ['blend', 'classic'].includes(b.report) ? b.report : '',
    name: lib.clean(b.name, 80), dob: lib.clean(b.dob, 10), tob: lib.clean(b.tob, 8), pob: lib.clean(b.pob, 100),
    email: lib.clean(b.email, 120), code: String(b.code || '').replace(/\D/g, '').slice(0, 4),
    mobile: String(b.mobile || '').replace(/\D/g, '').slice(0, 15), referral: lib.clean(b.referral, 40), page: lib.clean(b.page, 120)
  };
  if (!draft.name && !draft.mobile && !draft.email && !draft.pob && !draft.dob) return res.status(204).end();
  const later = lib.afterResponse(lib.postKamala('/web-draft', draft).then(r => { if (r !== 'sent') console.log(`Form draft hand-off: ${r}`); }));
  if (later) await later; // outside Vercel there is no waitUntil
  return res.status(202).json({ ok: true });
};
