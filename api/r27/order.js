'use strict';
// POST /api/r27/order: checks the order form again, prices it from the catalog and makes a Razorpay order.
// Answers { ok, checkout } for Razorpay Checkout, { ok: false, errors } for a field to fix, or
// { ok: false, fallback: 'whatsapp', message } when the order should go through WhatsApp instead.
const crypto = require('crypto');
const lib = require('./_lib');

const WHATSAPP = (message, status = 409) => ({ status, body: { ok: false, fallback: 'whatsapp', message } });

module.exports = async function handler(req, res) {
  if (!lib.guard(req, res)) return;
  const reply = r => res.status(r.status).json(r.body);

  if (!lib.configured()) {
    return reply(WHATSAPP('Online payment is not open yet. Send your order on WhatsApp and we will reply with a secure payment link.', 503));
  }
  const read = lib.readOrder(lib.body(req));
  if (!read.ok) return res.status(400).json({ ok: false, errors: read.errors });
  const o = read.order;

  if (o.currency === 'USD' && process.env.R27_USD !== 'on') {
    return reply(WHATSAPP('Payment in US dollars is taken on WhatsApp for now. Send your order there and we will reply with a payment link.'));
  }
  if (!(await lib.phaseOpen())) {
    return reply(WHATSAPP('Phase one of the 2027 report is closed. Message us on WhatsApp and we will tell you when the next phase opens.', 410));
  }

  const receipt = lib.RECEIPT_PREFIX + Date.now().toString(36) + '_' + crypto.randomBytes(4).toString('hex');
  // Razorpay keeps up to 15 notes of 256 characters each; Kamala reads the order from these.
  const notes = {
    product: 'r27', source: 'website', report: o.key, report_name: o.report.name,
    customer_name: o.name, dob: o.dob, tob: o.tob, pob: o.pob, email: o.email, phone: o.phone,
    referral: o.referral, updates: o.updates ? 'yes' : 'no', price: String(o.amount), mrp: String(o.mrp)
  };
  for (const k of Object.keys(notes)) if (notes[k] === '') delete notes[k]; // no empty notes (Classic has no birth time)
  let order;
  try {
    order = await lib.razorpay('POST', '/orders', { amount: Math.round(o.amount * 100), currency: o.currency, receipt, notes });
  } catch (e) {
    console.error('Razorpay order failed:', e.status || '', e.message);
    return reply(WHATSAPP('Online payment could not start just now. You can send your order on WhatsApp instead, or try again in a minute.', 502));
  }

  return res.status(200).json({
    ok: true,
    receipt,
    price: lib.money(o.amount, o.currency),
    checkout: {
      key: lib.keyId(),
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      name: 'Veshannastro',
      description: '2027 Personal Year Report: ' + o.report.name,
      image: 'https://www.veshannastro.co.in/apple-touch-icon.png',
      prefill: { name: o.name, email: o.email, contact: '+' + o.phone },
      notes: { report: o.report.name },
      theme: { color: '#0b1426' }
    }
  });
};
