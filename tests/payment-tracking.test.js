const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const source = fs.readFileSync("payment-tracking.js", "utf8");

function loadTracker(verified) {
  const storage = new Map();
  const events = [];
  const sessionStorage = {
    getItem(key) { return storage.has(key) ? storage.get(key) : null; },
    setItem(key, value) { storage.set(key, value); }
  };
  const window = {
    VESHANN_WALLET_API_BASE: "https://wallet.example",
    fbq() { events.push(["facebook", ...arguments]); },
    gtag() { events.push(["google", ...arguments]); },
    dispatchEvent() {}
  };
  const context = {
    window,
    sessionStorage,
    CustomEvent: function CustomEvent() {},
    fetch: async () => ({ ok: true, json: async () => ({ verified }) }),
    Promise,
    Math,
    Number,
    String
  };
  vm.runInNewContext(source, context, { filename: "payment-tracking.js" });
  return { tracker: window.VeshannPayment, events };
}

(async function run() {
  const rejected = loadTracker(false);
  assert.strictEqual(await rejected.tracker.trackPurchase("pay_Test123", 14900), false);
  assert.deepStrictEqual(rejected.events, []);

  const accepted = loadTracker(true);
  assert.strictEqual(await accepted.tracker.trackPurchase("pay_Test123", 14900), true);
  assert.strictEqual(accepted.events.length, 2);
  assert.strictEqual(accepted.events[0][0], "facebook");
  assert.strictEqual(accepted.events[1][0], "google");

  assert.strictEqual(await accepted.tracker.trackPurchase("pay_Test123", 14900), true);
  assert.strictEqual(accepted.events.length, 2, "a payment must be tracked only once per session");

  console.log("payment-tracking-tests-ok");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
