/* Veshannastro verified purchase tracking.
 * A Razorpay browser callback is not payment proof. This helper asks the
 * wallet backend to confirm an exact captured INR payment before emitting any
 * Purchase conversion. Failed or unavailable verification records nothing.
 */
(function (window) {
  "use strict";

  var API_BASE = (window.VESHANN_WALLET_API_BASE || "https://veshannastro-wallet.onrender.com").replace(/\/$/, "");

  function marker(paymentId) {
    return "veshann_verified_purchase_" + paymentId;
  }

  function alreadyTracked(paymentId) {
    try { return sessionStorage.getItem(marker(paymentId)) === "1"; }
    catch (error) { return false; }
  }

  function remember(paymentId) {
    try { sessionStorage.setItem(marker(paymentId), "1"); }
    catch (error) {}
  }

  function verify(paymentId, expectedAmountPaise) {
    var amount = Math.round(Number(expectedAmountPaise || 0));
    if (!/^pay_[A-Za-z0-9]+$/.test(String(paymentId || "")) || amount <= 0) {
      return Promise.resolve(false);
    }
    return fetch(API_BASE + "/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payment_id: paymentId,
        expected_amount_paise: amount,
        currency: "INR"
      })
    }).then(function (response) {
      if (!response.ok) return false;
      return response.json().then(function (data) { return data && data.verified === true; });
    }).catch(function () { return false; });
  }

  function trackPurchase(paymentId, expectedAmountPaise) {
    if (alreadyTracked(paymentId)) return Promise.resolve(true);
    return verify(paymentId, expectedAmountPaise).then(function (verified) {
      if (!verified) return false;

      var value = Math.round(Number(expectedAmountPaise || 0)) / 100;
      try {
        if (typeof window.fbq === "function") {
          window.fbq("track", "Purchase", { value: value, currency: "INR" });
        }
      } catch (error) {}
      try {
        if (typeof window.gtag === "function") {
          window.gtag("event", "ads_conversion_PURCHASE_1", { value: value, currency: "INR" });
        }
      } catch (error) {}

      remember(paymentId);
      try {
        window.dispatchEvent(new CustomEvent("veshann:verified-purchase", {
          detail: { payment_id: paymentId, amount_paise: Math.round(value * 100), currency: "INR" }
        }));
      } catch (error) {}
      return true;
    });
  }

  window.VeshannPayment = { verify: verify, trackPurchase: trackPurchase };
})(window);
