/**
 * Veshannastro — "Consultations" tab logger  (v1)
 * ===================================================================
 * A brand-new, INDEPENDENT Apps Script Web App. It only ever writes into
 * a tab called "Consultations" (auto-created on first run). It does NOT
 * touch your existing "Bookings" tab, your "Premium Reports" tab, or any
 * script that writes to them. Everything you have today keeps working.
 *
 * Used by:
 *   - vedic-checkout.html        (Vedic Complete Consultation)
 *   - numerology-checkout.html   (Numerology Consultation)
 *
 * Captures every field you asked for, including:
 *   Google account email, Firebase UID, phone + verified flag,
 *   cashback used (Y/N + amount), cashback earned, base price,
 *   coupon discount, and final amount paid.
 *
 * SETUP (5 minutes)
 *   1. Open the canonical Consultation CRM spreadsheet, then Extensions ->
 *      Apps Script.
 *   2. In Project Settings -> Script properties, add SPREADSHEET_ID with the
 *      ID from the CRM URL (the value between /d/ and /edit).
 *   3. Create a NEW script file (or new project — either is fine), delete the
 *      boilerplate, paste ALL of this in.
 *   4. Deploy -> New deployment -> type: Web app
 *        Execute as:      Me
 *        Who has access:  Anyone
 *   5. Copy the resulting .../exec URL and paste it back to me. It goes into:
 *        - vedic-checkout.html       -> CONFIG.sheetWebhook
 *        - numerology-checkout.html  -> CONFIG.sheetWebhook
 *
 * TESTING: after deploying, open the /exec URL directly in a browser — you
 * should see {"ok":true,"service":"consultations-logger"}. That confirms it
 * is live. A GET also creates the tab + header row so it's ready.
 * ===================================================================
 */

var TAB_NAME = 'Consultations';

function spreadsheetId() {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('Missing SPREADSHEET_ID Script Property');
  return id;
}

var HEADERS = [
  'Client ID',        // A  CN001, CN002 ...
  'Booked On',        // B  IST timestamp
  'Full Name',        // C
  'Gender',           // D
  'Phone',            // E  +91 xxxxxxxxxx
  'Phone Verified',   // F  Yes / No
  'Google Email',     // G  from Google Sign-In (verified)
  'Firebase UID',     // H  stable wallet key
  'Date of Birth',    // I
  'Birth Time',       // J  (blank for Numerology)
  'Birth Place',      // K
  'Service',          // L
  'Category',         // M  Vedic Kundli / Numerology
  'Query',            // N
  'Preferred Date',   // O
  'Preferred Time',   // P
  'Base Price',       // Q  what the service costs before discounts
  'Coupon Discount',  // R  10% new-user coupon amount
  'Cashback Used',    // S  rupees redeemed from wallet
  'Amount Paid',      // T  net actually charged on Razorpay
  'Used Cashback?',   // U  Yes / No
  'Cashback Earned',  // V  credited to wallet for next time
  'Payment Status',   // W
  'Payment ID',       // X  Razorpay payment id
  'Source',           // Y
  'Status',           // Z  New (for your ops board)
  'Notes'             // AA
];

function doGet() {
  getOrCreateTab(); // make sure the tab + headers exist
  return json({ ok: true, service: 'consultations-logger', tab: TAB_NAME });
}

function doPost(e) {
  try {
    var data = parseBody(e);
    var sheet = getOrCreateTab();
    sheet.appendRow(buildRow(sheet, data));
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function parseBody(e) {
  var raw = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
  try { return JSON.parse(raw); } catch (err) { return {}; }
}

function getOrCreateTab() {
  var ss = SpreadsheetApp.openById(spreadsheetId());
  var sheet = ss.getSheetByName(TAB_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(TAB_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sheet;
}

function nextClientId(sheet) {
  var lastRow = sheet.getLastRow();      // header is row 1
  var n = Math.max(1, lastRow);          // first data row -> CN001
  return 'CN' + ('000' + n).slice(-3);
}

function rupees(v) {
  if (v === '' || v === null || v === undefined) return '';
  var n = Number(v);
  if (isNaN(n)) return String(v);
  return '\u20B9' + n.toLocaleString('en-IN');
}

function buildRow(sheet, d) {
  var bookedOn = d.timestamp ||
    new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  var usedCashback = (Number(d.cashbackUsed) > 0) ? 'Yes' : 'No';

  return [
    nextClientId(sheet),                          // Client ID
    bookedOn,                                     // Booked On
    d.name || '',                                 // Full Name
    d.gender || '',                               // Gender
    d.phone || '',                                // Phone
    d.phoneVerified ? 'Yes' : 'No',               // Phone Verified
    d.googleEmail || d.email || '',               // Google Email
    d.uid || '',                                  // Firebase UID
    d.dob || '',                                  // Date of Birth
    d.birthTime || '',                            // Birth Time
    d.birthPlace || '',                           // Birth Place
    d.service || '',                              // Service
    d.category || '',                             // Category
    d.query || '',                                // Query
    d.sessionDate || '',                          // Preferred Date
    d.sessionTime || '',                          // Preferred Time
    rupees(d.basePrice),                          // Base Price
    rupees(d.couponDiscount),                     // Coupon Discount
    rupees(d.cashbackUsed),                       // Cashback Used
    rupees(d.amountPaid),                          // Amount Paid
    usedCashback,                                 // Used Cashback?
    rupees(d.cashbackEarned),                     // Cashback Earned
    d.paymentStatus || 'Paid',                    // Payment Status
    d.payment_id || '',                           // Payment ID
    d.source || 'Website - Paid',                 // Source
    'New',                                        // Status
    d.notes || ''                                 // Notes
  ];
}
