"use strict";

const assert = require("assert");
const {
  extractMaayaEvent,
  extractEscalationContact
} = require("../AIquery/server.js");

const marked = extractMaayaEvent(
  "You are in safe hands.\n[[MAAYA_EVENT]]" +
  '{"event":"LEAD_ESCALATION","priority":"HIGH","lead_data":' +
  '{"name":"Amit Sharma","phone":"9810012345","email":"amit@example.com",' +
  '"summary":"Payment callback"}}[[/MAAYA_EVENT]]'
);
assert.strictEqual(marked.reply, "You are in safe hands.");
assert.strictEqual(marked.event.lead_data.email, "amit@example.com");

const fallback = extractEscalationContact([
  { role: "user", content: "I need the owner to call me about a payment issue." },
  { role: "assistant", content: "Please share your contact details." },
  { role: "user", content: "My name is Amit Sharma, phone 9810012345, email amit@example.com." }
]);
assert.strictEqual(fallback.event, "LEAD_ESCALATION");
assert.strictEqual(fallback.lead_data.name, "Amit Sharma");

assert.strictEqual(extractEscalationContact([
  { role: "user", content: "Send a receipt to Amit at 9810012345 and amit@example.com." }
]), null);

console.log("maaya-lead-tests-ok");
