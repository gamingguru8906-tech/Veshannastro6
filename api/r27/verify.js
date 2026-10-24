'use strict';
// POST /api/r27/verify: called by the page when Razorpay Checkout reports a payment.
// Checks Razorpay's signature, then asks Razorpay itself that the payment is real, captured, for this order and
// for its full amount. Only then does it say "paid" and hand the order to Kamala.
const crypto = require('crypto');
const lib = require('./_lib');

module.exports = async function handler(req, res) {
  if (!lib.guard(req, res)) return;
  if (!lib.configured()) return res.status(503).json({ ok: false, error: 'Payments are not set up.' });

  const b = lib.body(req);
  const orderId = String(b.razorpay_order_id || '');
  const paymentId = String(b.razorpay_payment_id || '');
  const signature = String(b.razorpay_signature || '');
  if (!/^order_[A-Za-z0-9]{6,40}$/.test(orderId) || !/^pay_[A-Za-z0-9]{6,40}$/.test(paymentId) || !/^[a-f0-9]{64}$/.test(signature)) {
    return res.status(400).json({ ok: false, error: 'Missing payment details.' });
  }
  const expected = crypto.createHmac('sha256', lib.keySecret()).update(orderId + '|' + paymentId).digest('hex');
  if (!lib.timingSafeEqualHex(expected, signature)) return res.status(400).json({ ok: false, error: 'The payment signature does not match.' });

  let order, payment;
  try {
    [order, payment] = await Promise.all([lib.razorpay('GET', '/orders/' + orderId), lib.razorpay('GET', '/payments/' + paymentId)]);
    if (!String(order.receipt || '').startsWith(lib.RECEIPT_PREFIX) || (order.notes || {}).product !== 'r27') {
      return res.status(400).json({ ok: false, error: 'This is not a 2027 report order.' });
    }
    if (payment.order_id !== order.id || Number(payment.amount) !== Number(order.amount) || payment.currency !== order.currency) {
      console.error(`Payment ${paymentId} does not match order ${orderId}.`);
      return res.status(400).json({ ok: false, error: 'The payment does not match the order.' });
    }
    // Accounts set to capture by hand leave the payment "authorized": capture it for the exact order amount.
    if (payment.status === 'authorized') {
      payment = await lib.razorpay('POST', `/payments/${paymentId}/capture`, { amount: order.amount, currency: order.currency });
    }
  } catch (e) {
    console.error('Payment check failed:', e.status || '', e.message);
    // The payment may still be fine: Razorpay's webhook reaches Kamala on its own.
    return res.status(202).json({ ok: false, pending: true, payment_id: paymentId });
  }
  if (payment.status !== 'captured') return res.status(202).json({ ok: false, pending: true, payment_id: paymentId });

  const later = lib.afterResponse(Promise.all([
    lib.tellKamala(orderId, paymentId).then(r => console.log(`Kamala hand-off for ${orderId}: ${r}`)),
    lib.store.markPaid(String((order.notes || {}).phone || '')).catch(e => console.error('Marking the lead paid failed:', e.message))
  ]));
  const n = order.notes || {};
  const out = {
    ok: true,
    receipt: order.receipt,
    payment_id: paymentId,
    report: n.report_name || '',
    first_name: String(n.customer_name || '').split(' ')[0],
    amount: order.amount / 100,
    currency: order.currency,
    price: lib.money(order.amount / 100, order.currency),
    delivery: lib.CATALOG.delivery
  };
  if (later) await later; // outside Vercel there is no waitUntil
  return res.status(200).json(out);
};
