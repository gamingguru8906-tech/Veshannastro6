/**
 * Veshannastro — "Consultations" tab logger  (v1)
 * ===================================================================
 * Apps Script Web App for the website checkout and WhatsApp CRM. Existing
 * tabs and records are preserved; missing columns are appended, never reordered.
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
 * SETUP & DEPLOYMENT INSTRUCTIONS:
 *   1. Paste this entire file into the Apps Script project attached to the CRM Sheet.
 *   2. Project Settings -> Script Properties: set SPREADSHEET_ID to the sheet ID and
 *      GOOGLE_APPS_SCRIPT_SECRET to the same strong random secret used in Render;
 *      set GOOGLE_CALENDAR_ID to the owner calendar ID (or "primary").
 *   3. In Script Properties, set PAYMENT_VERIFICATION_URL to
 *      https://whatsapp-agent-gqg6.onrender.com/payments/verify . If it still
 *      contains the old wallet URL, replace it with this URL.
 *   4. In the Apps Script editor, add the advanced Google service "Calendar API" v3.
 *      If this script uses a standard Cloud project, enable Google Calendar API there too.
 *   5. Run initializeSpreadsheet() once and approve Sheets permissions.
 *   6. Run testCalendarOwnerAccess() once and approve Calendar permissions using
 *      the Google account that owns the booking calendar. It must report Meet available.
 *   7. Run testPaymentVerificationConnection() and testSendEmail() once to grant and
 *      verify UrlFetch/Mail permissions. testSendEmail sends a real test email to you.
 *   8. Deploy as a Web app that executes as you (the calendar owner), with access
 *      set to Anyone so Render can call it. The API secret protects POST actions.
 *      Deploy -> Manage deployments -> Edit -> New version -> Deploy. Save alone
 *      does not update the active /exec deployment URL.
 * ===================================================================
 */

var TAB_NAME = 'Consultations';

// Set SPREADSHEET_ID in Script Properties (the string between /d/ and /edit in the Sheet URL).
var HARDCODED_SPREADSHEET_ID = ''; 

function spreadsheetId() {
  var id = HARDCODED_SPREADSHEET_ID || PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('Missing SPREADSHEET_ID. Please paste it into line 41 of the script.');
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
  'Coupon Discount',  // R  5% new-user coupon amount
  'Cashback Used',    // S  rupees redeemed from wallet
  'Amount Paid',      // T  net actually charged on Razorpay
  'Used Cashback?',   // U  Yes / No
  'Cashback Earned',  // V  credited to wallet for next time
  'Payment Status',   // W
  'Payment ID',       // X  Razorpay payment id
  'Source',           // Y
  'Status',           // Z  New (for your ops board)
  'Notes',            // AA
  'Email Status'      // AB  retries only the same verified payment if sending previously failed
];

/* ── ALL CRM tabs + their exact headers (matches your existing sheet) ──
   Any tab that is missing gets created with these headers; existing tabs
   and their data are never touched. */
var ALL_TABS = {
  'Customers': ['Customer ID','Full Name','Phone','Email','Date of Birth','Birth Time','Birth Place','Gender','Remedies Prescribed','Billing Address','Customer GSTIN','Last Updated'],
  'Bookings': [
    'Client ID','Booked On','Full Name','Phone','Email','Date of Birth',
    'Birth Time','Birth Place','Service','Message','Source','Payment Status',
    'Amount (₹)','Consultation Date','Status','Notes','Payment Link ID','Payment ID','Email Status'
  ],
  'Consultations': HEADERS,
  'Premium Reports': [
    'Client ID','Booked On','Full Name','Phone','Email','Date of Birth',
    'Birth Time','Birth Place','Service','Message','Source','Payment Status',
    'Amount (₹)','Consultation Date','Status','Notes'
  ],
  'Dashboard': ['STAT','COUNT'],
  'Follow-ups': ['Client ID','Name','Phone','Follow-up Date','Notes'],
  'WA Funnel Dashboard': ['Metric', 'Value'],
  'WA All Leads': ['Phone', 'First Contact', 'Last Contact', 'Total Messages', 'Converted?', 'Status'],
  'WA Suspicious': ['Phone', 'Last Contact', 'Total Messages'],
  'WhatsApp Chat History': ['Timestamp', 'Phone', 'Sender', 'Message', 'Notes'],
  'WA Payment Requests': [
    'Payment Link ID','Request Invoice No.','Created At','Customer ID','Full Name','Phone','Email',
    'Billing Address','Customer GSTIN','Gender','Date of Birth','Birth Time','Birth Place','Service',
    'Appointment Date/Time','Normal Rate (₹)','Published Discount (₹)','Additional Discount (₹)',
    'Consultation Total (₹)','Amount Due on Link (₹)','Payment URL','Payment Status','Payment ID',
    'Gateway Test','Source'
  ]
};

function ensureAllTabs() {
  var ss = SpreadsheetApp.openById(spreadsheetId());
  var created = [];
  Object.keys(ALL_TABS).forEach(function (name) {
    var sheet = ss.getSheetByName(name);
    var wasCreated = false;
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.setFrozenRows(1);
      wasCreated = true;
      created.push(name);
    }
    ensureHeaders_(sheet, ALL_TABS[name]);
    if (wasCreated && (name === 'Dashboard' || name === 'WA Funnel Dashboard' || name === 'WA Suspicious')) seedDashboard(sheet);
  });
  return created;
}

// Add only missing columns to existing tabs; never reorder or overwrite data.
function ensureHeaders_(sheet, expectedHeaders) {
  var lastColumn = sheet.getLastColumn();
  var current = lastColumn > 0
    ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0]
    : [];
  if (!current.length || current.every(function (value) { return String(value || '').trim() === ''; })) {
    if (sheet.getLastRow() > 1) {
      throw new Error('Tab "' + sheet.getName() + '" has data but no header row; refusing to guess its schema.');
    }
    sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    return expectedHeaders.slice();
  }
  var missing = expectedHeaders.filter(function (header) { return current.indexOf(header) === -1; });
  if (missing.length) {
    sheet.getRange(1, lastColumn + 1, 1, missing.length).setValues([missing]).setFontWeight('bold');
    current = current.concat(missing);
  }
  if (sheet.getFrozenRows() < 1) sheet.setFrozenRows(1);
  return current;
}

function seedDashboard(sheet) {
  if (sheet.getName() === 'Dashboard') {
    sheet.appendRow(['Total Bookings',        '=MAX(0,COUNTA(Bookings!A2:A))']);
    sheet.appendRow(['Total Consultations',   '=MAX(0,COUNTA(Consultations!A2:A))']);
    sheet.appendRow(['Total Premium Reports', '=MAX(0,COUNTA(\'Premium Reports\'!A2:A))']);
    sheet.appendRow(['Open Follow-ups',       '=MAX(0,COUNTA(\'Follow-ups\'!A2:A))']);
    sheet.appendRow(['Consultation Revenue',  '=SUMPRODUCT(IFERROR(VALUE(REGEXREPLACE(Consultations!T2:T,"[^0-9.]","")),0))']);
  } else if (sheet.getName() === 'WA Funnel Dashboard') {
    sheet.appendRow(['Total Leads', '=MAX(0,COUNTA(\'WA All Leads\'!A2:A))']);
    sheet.appendRow(['Total Converted', '=COUNTIF(\'WA All Leads\'!E2:E, "Yes")']);
    sheet.appendRow(['Conversion Rate', '=IFERROR(COUNTIF(\'WA All Leads\'!E2:E, "Yes") / MAX(1,COUNTA(\'WA All Leads\'!A2:A)), 0)']);
    sheet.getRange(4, 2).setNumberFormat('0.00%');
    sheet.appendRow(['Total Suspicious', '=COUNTIF(\'WA All Leads\'!F2:F, "Suspicious")']);
  } else if (sheet.getName() === 'WA Suspicious') {
    sheet.getRange("A2").setFormula('=QUERY(\'WA All Leads\'!A2:F, "SELECT A, C, D WHERE F = \'Suspicious\'", 0)');
  }
}

function doGet() {
  // Keep the public health endpoint read-only; run initializeSpreadsheet() in the editor for setup.
  return json({ ok: true, service: 'consultations-logger' });
}

function doPost(e) {
  try {
    var data = parseBody(e);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return json({ ok: false, error: 'Request body must be a JSON object.' });
    var protectedTarget = ['booking', 'report', 'payment_request', 'payment_request_status', 'customer_update', 'lead_update', 'chat', 'calendar_hold', 'calendar_finalize', 'calendar_cancel'].indexOf(data.target) !== -1;
    if ((protectedTarget || data.sourceSystem === 'whatsapp') && !isAuthorizedWhatsAppCall_(data)) {
      return json({ ok: false, error: 'Unauthorized WhatsApp service request.' });
    }
    var knownTargets = ['', 'booking', 'report', 'payment_request', 'payment_request_status', 'customer_update', 'lead_update', 'chat', 'calendar_hold', 'calendar_finalize', 'calendar_cancel'];
    var target = String(data.target || '');
    if (knownTargets.indexOf(target) === -1) return json({ ok: false, error: 'Unknown request target.' });
    // Calendar operations run as the deploying calendar owner. Handle them
    // before opening Sheets; they do not need to read or modify CRM data.
    if (data.target === 'calendar_hold') return json(createWhatsAppCalendarHold_(data));
    if (data.target === 'calendar_finalize') return json(finalizeWhatsAppCalendarHold_(data));
    if (data.target === 'calendar_cancel') return json(cancelWhatsAppCalendarHold_(data));
    if (!target) {
      if (!data.payment_id) return json({ ok: false, error: 'Missing Razorpay payment ID; no paid consultation was recorded.' });
      assertCapturedPayment_(data.payment_id, data.amountPaid);
    }
    ensureAllTabs();
    var ss = SpreadsheetApp.openById(spreadsheetId());

    if (data.target === 'lead_update') {
      var lt = ss.getSheetByName('WA All Leads');
      var ltData = lt.getDataRange().getValues();
      var foundRow = -1;
      for(var i=1; i<ltData.length; i++) {
        if(ltData[i][0] == data.phone) {
          foundRow = i + 1;
          break;
        }
      }
      var now = data.timestamp || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      var converted = data.is_customer ? 'Yes' : 'No';
      var status = data.is_customer ? 'Converted' : ((data.message_count || 0) > 15 ? 'Suspicious' : 'Engaging');
      
      if (foundRow > -1) {
        lt.getRange(foundRow, 3).setValue(safeSheetValue_(now));
        lt.getRange(foundRow, 4).setValue(Math.max(1, Number(data.message_count) || 1));
        lt.getRange(foundRow, 5).setValue(converted);
        lt.getRange(foundRow, 6).setValue(status);
      } else {
        lt.appendRow([data.phone, now, now, Math.max(1, Number(data.message_count) || 1), converted, status].map(safeSheetValue_));
      }
      return json({ ok: true, tab: 'WA All Leads' });
    }

    if (data.target === 'chat') {
      if (!data.phone || String(data.message || '').length > 12000) {
        return json({ ok: false, error: 'Chat record needs a phone number and a message no longer than 12,000 characters.' });
      }
      var ct = ss.getSheetByName('WhatsApp Chat History');
      ct.appendRow([
        data.timestamp || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        data.phone || '',
        data.sender || 'Unknown',
        data.message || '',
        data.notes || ''
      ].map(safeSheetValue_));
      return json({ ok: true, tab: 'WhatsApp Chat History' });
    }

    if (data.target === 'payment_request') {
      var paymentLinkId = String(data.payment_link_id || '');
      if (!/^plink_[A-Za-z0-9]+$/.test(paymentLinkId) || !data.invoice_number || !data.name || !data.phone || !data.email || !data.billingAddress || !data.paymentUrl) {
        return json({ ok: false, error: 'Payment request is missing a required customer, invoice, or payment-link field.' });
      }
      if (!/^https:\/\/(?:rzp\.io|(?:[a-z0-9-]+\.)*razorpay\.com)\//i.test(String(data.paymentUrl))) {
        return json({ ok: false, error: 'Payment URL must be a Razorpay HTTPS link.' });
      }
      if (!validPaymentRequestAmounts_(data)) {
        return json({ ok: false, error: 'Payment request prices or discount arithmetic are invalid.' });
      }
      var requestLock = LockService.getScriptLock();
      requestLock.waitLock(10000);
      try {
      var requestSheet = ss.getSheetByName('WA Payment Requests');
      var requestHeaders = requestSheet.getRange(1, 1, 1, requestSheet.getLastColumn()).getValues()[0];
      var requestRow = findRowByHeader_(requestSheet, 'Payment Link ID', paymentLinkId);
      var existingStatus = requestRow ? String(requestSheet.getRange(requestRow, requestHeaders.indexOf('Payment Status') + 1).getValue() || '') : '';
      var existingPaymentId = requestRow ? String(requestSheet.getRange(requestRow, requestHeaders.indexOf('Payment ID') + 1).getValue() || '') : '';
      if (requestRow && (existingStatus === 'PAID' || existingStatus === 'GATEWAY_TEST_PAID')) {
        return json({ ok: true, tab: 'WA Payment Requests', paymentLinkId: paymentLinkId, duplicate: true });
      }
      var requestValues = {
        'Payment Link ID': paymentLinkId, 'Request Invoice No.': data.invoice_number,
        'Created At': data.timestamp || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        'Customer ID': data.customerId || '', 'Full Name': data.name, 'Phone': data.phone,
        'Email': data.email, 'Billing Address': data.billingAddress, 'Customer GSTIN': data.customerGstin || '',
        'Gender': data.gender || '', 'Date of Birth': data.dob || '', 'Birth Time': data.birthTime || '',
        'Birth Place': data.birthPlace || '', 'Service': data.service || '',
        'Appointment Date/Time': data.sessionDate || '', 'Normal Rate (₹)': rupees(data.normalRate),
        'Published Discount (₹)': rupees(data.websiteDiscount), 'Additional Discount (₹)': rupees(data.additionalDiscount),
        'Consultation Total (₹)': rupees(data.serviceTotal), 'Amount Due on Link (₹)': rupees(data.amountDue),
        'Payment URL': data.paymentUrl,
        'Payment Status': existingStatus && existingStatus !== 'DELIVERY_FAILED' ? existingStatus : 'UNPAID',
        'Payment ID': existingPaymentId,
        'Gateway Test': data.isGatewayTest ? 'Yes' : 'No', 'Source': data.source || 'WhatsApp'
      };
      var requestValuesRow = requestHeaders.map(function (header) {
        return Object.prototype.hasOwnProperty.call(requestValues, header) ? requestValues[header] : '';
      }).map(safeSheetValue_);
      if (requestRow) requestSheet.getRange(requestRow, 1, 1, requestHeaders.length).setValues([requestValuesRow]);
      else requestSheet.appendRow(requestValuesRow);
      upsertWhatsAppCustomer_(ss, data);
      return json({ ok: true, tab: 'WA Payment Requests', paymentLinkId: paymentLinkId });
      } finally {
        requestLock.releaseLock();
      }
    }

    if (data.target === 'payment_request_status') {
      var statusLinkId = String(data.payment_link_id || '');
      if (!statusLinkId) return json({ ok: false, error: 'Missing payment link ID.' });
      if (String(data.status || '') !== 'DELIVERY_FAILED') {
        return json({ ok: false, error: 'This endpoint only records delivery failures; payment status requires verified booking fulfillment.' });
      }
      if (!updatePaymentRequestStatus_(ss, statusLinkId, 'DELIVERY_FAILED', '')) {
        return json({ ok: false, error: 'No matching payment-request row was found.' });
      }
      return json({ ok: true, tab: 'WA Payment Requests' });
    }

    if (data.target === 'customer_update') {
      if (!data.phone) return json({ ok: false, error: 'Customer phone is required for a customer update.' });
      upsertWhatsAppCustomer_(ss, data);
      return json({ ok: true, tab: 'Customers' });
    }

    // WhatsApp booking fulfillment is signed and independently payment-verified.
    if (data.target === 'booking') {
      var bookingLock = LockService.getScriptLock();
      bookingLock.waitLock(10000);
      try {
        var paymentLinkId = String(data.payment_link_id || '').trim();
        var paymentId = String(data.payment_id || '').trim();
        var clientEmail = String(data.googleEmail || data.email || '').trim();
        var amountPaid = Number(data.amountPaid);
        if (!/^plink_[A-Za-z0-9]+$/.test(paymentLinkId)) return json({ ok: false, error: 'A valid Razorpay payment-link ID is required.' });
        if (!/^pay_[A-Za-z0-9]+$/.test(paymentId)) return json({ ok: false, error: 'A valid Razorpay payment ID is required.' });
        if (!clientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) return json({ ok: false, error: 'A valid customer email is required.' });
        if (!data.name || !data.phone || !data.service || !Number.isFinite(amountPaid) || amountPaid <= 0) {
          return json({ ok: false, error: 'The paid booking is missing required customer, service, or amount details.' });
        }
        if (!data.invoiceBase64 || String(data.invoiceBase64).length > 12 * 1024 * 1024
          || !/^JVBERi0/.test(String(data.invoiceBase64))) {
          return json({ ok: false, error: 'A valid PDF payment receipt under the attachment size limit is required.' });
        }
        if (!validMeetLink_(data.meetLink)) return json({ ok: false, error: 'A valid Google Meet URL is required before booking confirmation.' });

        var requestsSheet = ss.getSheetByName('WA Payment Requests');
        var request = paymentRequestById_(requestsSheet, paymentLinkId);
        if (!request) return json({ ok: false, error: 'No matching payment request exists; booking was not recorded.' });
        var requestStatus = String(request.values['Payment Status'] || '');
        var requestPaymentId = String(request.values['Payment ID'] || '');
        if ((requestStatus === 'PAID' || requestStatus === 'GATEWAY_TEST_PAID') && requestPaymentId && requestPaymentId !== paymentId) {
          return json({ ok: false, error: 'This payment link has already been fulfilled by a different payment.' });
        }
        var expectedAmount = parseRupees_(request.values['Amount Due on Link (₹)']);
        if (!Number.isFinite(expectedAmount) || Math.abs(expectedAmount - amountPaid) > 0.005) {
          return json({ ok: false, error: 'Paid amount does not match the amount recorded for this payment link.' });
        }
        if (String(request.values.Phone || '') !== String(data.phone)
          || String(request.values.Email || '').toLowerCase() !== clientEmail.toLowerCase()
          || String(request.values.Service || '') !== String(data.service)) {
          return json({ ok: false, error: 'Booking details do not match the customer and service on the payment request.' });
        }
        assertCapturedPayment_(paymentId, amountPaid);

        var bookings = ss.getSheetByName('Bookings');
        var bookingHeaders = bookings.getRange(1, 1, 1, bookings.getLastColumn()).getValues()[0];
        var existingRow = findRowByHeader_(bookings, 'Payment Link ID', paymentLinkId);
        var paymentIdColumn = bookingHeaders.indexOf('Payment ID') + 1;
        if (existingRow && paymentIdColumn > 0) {
          var previousPaymentId = String(bookings.getRange(existingRow, paymentIdColumn).getValue() || '');
          if (previousPaymentId && previousPaymentId !== paymentId) return json({ ok: false, error: 'A different payment is already recorded for this booking.' });
        }
        var emailStatusColumn = bookingHeaders.indexOf('Email Status') + 1;
        var previousEmailStatus = existingRow && emailStatusColumn > 0
          ? String(bookings.getRange(existingRow, emailStatusColumn).getValue() || 'Pending') : 'Pending';
        var rowValuesByHeader = {
          'Client ID': existingRow ? bookings.getRange(existingRow, bookingHeaders.indexOf('Client ID') + 1).getValue() : nextClientId(bookings),
          'Booked On': data.timestamp || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          'Full Name': data.name, 'Phone': data.phone, 'Email': clientEmail,
          'Date of Birth': data.dob || '', 'Birth Time': data.birthTime || '', 'Birth Place': data.birthPlace || '',
          'Service': data.service, 'Message': data.query || data.message || '',
          'Source': data.source || 'WhatsApp Direct Booking',
          'Payment Status': data.isGatewayTest ? 'Gateway test paid - consultation not paid' : 'Paid',
          'Amount (₹)': rupees(amountPaid), 'Consultation Date': data.sessionDate || '',
          'Status': data.isGatewayTest ? 'Gateway test only - not booked' : 'Confirmed',
          'Notes': data.isGatewayTest ? '₹1 gateway validation only; consultation fee remains unpaid.' : (data.notes || ''),
          'Payment Link ID': paymentLinkId, 'Payment ID': paymentId,
          'Email Status': previousEmailStatus
        };
        var bookingRow = bookingHeaders.map(function (header) {
          return Object.prototype.hasOwnProperty.call(rowValuesByHeader, header) ? rowValuesByHeader[header] : '';
        }).map(safeSheetValue_);
        if (existingRow) bookings.getRange(existingRow, 1, 1, bookingHeaders.length).setValues([bookingRow]);
        else { bookings.appendRow(bookingRow); existingRow = bookings.getLastRow(); }

        updatePaymentRequestStatus_(ss, paymentLinkId, data.isGatewayTest ? 'GATEWAY_TEST_PAID' : 'PAID', paymentId);
        if (String(bookings.getRange(existingRow, emailStatusColumn).getValue()) !== 'SENT') {
          var mailResult = sendConsultationConfirmationEmail(data);
          bookings.getRange(existingRow, emailStatusColumn).setValue(mailResult.sent ? 'SENT' : 'FAILED: ' + mailResult.error);
          if (!mailResult.sent) return json({ ok: false, error: 'Payment was verified and booking recorded, but confirmation email failed: ' + mailResult.error });
        }
        return json({ ok: true, tab: 'Bookings', email: 'sent', paymentLinkId: paymentLinkId });
      } finally {
        bookingLock.releaseLock();
      }
    }

    if (data.target === 'report') {
      var reports = ss.getSheetByName('Premium Reports');
      reports.appendRow([
        nextClientId(reports), data.timestamp || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        data.name || '', data.phone || '', data.googleEmail || data.email || '', data.dob || '', data.birthTime || '',
        data.birthPlace || '', data.service || '', data.query || data.message || '', data.source || 'Website',
        data.paymentStatus || 'Paid', rupees(data.amountPaid), data.sessionDate || '', 'New', data.notes || ''
      ].map(safeSheetValue_));
      return json({ ok: true, tab: 'Premium Reports' });
    }

    var sheet = getOrCreateTab();
    var genericLock = LockService.getScriptLock();
    genericLock.waitLock(10000);
    try {
      var existingConsultationRow = findRowByHeader_(sheet, 'Payment ID', data.payment_id);
      var emailStatusColumn = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].indexOf('Email Status') + 1;
      var existingEmailStatus = existingConsultationRow
        ? String(sheet.getRange(existingConsultationRow, emailStatusColumn).getValue() || 'Pending') : '';
      if (existingConsultationRow && existingEmailStatus === 'SENT') {
        return json({ ok: true, tab: TAB_NAME, duplicate: true, email: 'sent' });
      }
      var consultationRow = existingConsultationRow;
      if (!consultationRow) {
        sheet.appendRow(buildRow(sheet, data).map(safeSheetValue_));
        consultationRow = sheet.getLastRow();
      }
      var genericMailResult = sendConsultationConfirmationEmail(data);
      sheet.getRange(consultationRow, emailStatusColumn).setValue(genericMailResult.sent ? 'SENT' : 'FAILED: ' + genericMailResult.error);
      if (!genericMailResult.sent) return json({ ok: false, error: 'Payment was verified and recorded, but the confirmation email failed: ' + genericMailResult.error });
      return json({ ok: true, tab: TAB_NAME, duplicate: Boolean(existingConsultationRow), email: 'sent' });
    } finally {
      genericLock.releaseLock();
    }
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function calendarId_() {
  var id = PropertiesService.getScriptProperties().getProperty('GOOGLE_CALENDAR_ID');
  if (!id) throw new Error('GOOGLE_CALENDAR_ID is not configured in Apps Script properties.');
  return id;
}

// Run once manually in Apps Script to authorize Calendar and confirm that the
// selected owner calendar advertises Google Meet before enabling payment links.
function testCalendarOwnerAccess() {
  var calendar = Calendar.Calendars.get(calendarId_());
  var allowed = calendar.conferenceProperties && calendar.conferenceProperties.allowedConferenceSolutionTypes || [];
  if (allowed.indexOf('hangoutsMeet') === -1) {
    throw new Error('The selected Google Calendar does not advertise Google Meet as an allowed conference type. Check the calendar/account Meet settings.');
  }
  Logger.log('Calendar owner access is authorized and Google Meet is available.');
  return { ok: true, calendarId: calendar.id, googleMeetAvailable: true };
}

function createWhatsAppCalendarHold_(data) {
  var start = new Date(String(data.startTime || ''));
  var end = new Date(String(data.endTime || ''));
  var customerName = String(data.customerName || '').trim();
  var serviceName = String(data.serviceName || '').trim();
  var phone = String(data.phone || '').trim();
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())
    || end.getTime() <= start.getTime() || end.getTime() - start.getTime() !== 60 * 60 * 1000) {
    throw new Error('Calendar hold requires a valid one-hour appointment window.');
  }
  if (!customerName || !serviceName || !phone) {
    throw new Error('Calendar hold requires the customer name, phone, and service.');
  }

  var id = calendarId_();
  var calendarMeta = Calendar.Calendars.get(id);
  var allowedTypes = calendarMeta.conferenceProperties && calendarMeta.conferenceProperties.allowedConferenceSolutionTypes || [];
  if (allowedTypes.indexOf('hangoutsMeet') === -1) {
    throw new Error('Google Meet is not enabled for the selected calendar. No payment link was created.');
  }
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  var created;
  try {
    // Enforce the daily cap against the exact local booking date (IST), not a
    // broad UTC window that could accidentally count appointments on adjacent days.
    var dateKey = Utilities.formatDate(start, 'Asia/Kolkata', 'yyyy-MM-dd');
    var queryStart = new Date(dateKey + 'T00:00:00+05:30');
    var queryEnd = new Date(queryStart.getTime() + 24 * 60 * 60 * 1000);
    var listed = Calendar.Events.list(id, {
      timeMin: queryStart.toISOString(), timeMax: queryEnd.toISOString(),
      singleEvents: true, orderBy: 'startTime', maxResults: 250
    });
    var events = (listed.items || []).filter(function (item) { return item.status !== 'cancelled'; });
    var startMs = start.getTime(), endMs = end.getTime();
    var overlaps = events.some(function (item) {
      var eventStart = new Date(item.start && (item.start.dateTime || item.start.date)).getTime();
      var eventEnd = new Date(item.end && (item.end.dateTime || item.end.date)).getTime();
      return Number.isFinite(eventStart) && Number.isFinite(eventEnd) && startMs < eventEnd && endMs > eventStart;
    });
    if (overlaps) throw new Error('That appointment time is no longer available. Please choose another slot.');
    var dailyCount = events.filter(function (item) {
      return /WhatsApp Booking|Veshannastro Consultation|GATEWAY TEST ONLY/.test(String(item.summary || ''));
    }).length;
    if (dailyCount >= 3) throw new Error('The daily consultation limit has been reached for that date.');

    var event = {
      summary: 'GATEWAY TEST ONLY — NOT A BOOKING — ' + serviceName + ' — ' + customerName,
      description: 'Temporary gateway validation only; this is not a confirmed consultation booking.\n'
        + 'Customer: ' + customerName + '\nWhatsApp: ' + phone + '\nService: ' + serviceName,
      start: { dateTime: start.toISOString(), timeZone: 'Asia/Kolkata' },
      end: { dateTime: end.toISOString(), timeZone: 'Asia/Kolkata' },
      attendees: [],
      conferenceData: {
        createRequest: {
          requestId: Utilities.getUuid(),
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      }
    };
    created = Calendar.Events.insert(event, id, { conferenceDataVersion: 1, sendUpdates: 'none' });
  } finally {
    lock.releaseLock();
  }

  var eventId = String(created && created.id || '');
  if (!eventId) throw new Error('Google Calendar did not return an event ID. No payment link was created.');
  var current = created;
  var meetLink = calendarMeetLink_(current);
  for (var attempt = 0; !meetLink && attempt < 10; attempt++) {
    Utilities.sleep(1000);
    current = Calendar.Events.get(id, eventId);
    meetLink = calendarMeetLink_(current);
    var conferenceStatus = current.conferenceData && current.conferenceData.createRequest
      && current.conferenceData.createRequest.status && current.conferenceData.createRequest.status.statusCode;
    if (conferenceStatus === 'failure') break;
  }
  if (!meetLink) {
    try { Calendar.Events.remove(id, eventId); } catch (ignore) {}
    throw new Error('Google Calendar did not return a Google Meet link. No payment link was created. Check the owner calendar and Meet settings.');
  }
  return { ok: true, eventId: eventId, meetLink: meetLink, htmlLink: current.htmlLink || created.htmlLink || '' };
}

function finalizeWhatsAppCalendarHold_(data) {
  var eventId = String(data.eventId || '').trim();
  if (!eventId) throw new Error('A calendar event ID is required to finalize the hold.');
  var id = calendarId_();
  var event = Calendar.Events.get(id, eventId);
  var meetLink = calendarMeetLink_(event);
  if (!meetLink) throw new Error('The calendar hold has no Google Meet link; booking confirmation cannot continue.');
  var summary = String(data.summary || '').trim();
  var description = String(data.description || '').trim();
  if (!summary || !description) throw new Error('Calendar finalization requires the booking title and details.');
  var updated = Calendar.Events.patch({ summary: summary, description: description }, id, eventId,
    { conferenceDataVersion: 1, sendUpdates: 'none' });
  meetLink = calendarMeetLink_(updated) || meetLink;
  return { ok: true, eventId: eventId, meetLink: meetLink, htmlLink: updated.htmlLink || event.htmlLink || '' };
}

function cancelWhatsAppCalendarHold_(data) {
  var eventId = String(data.eventId || '').trim();
  if (!eventId) return { ok: false, error: 'A calendar event ID is required to cancel the hold.' };
  try {
    Calendar.Events.remove(calendarId_(), eventId);
    return { ok: true, eventId: eventId };
  } catch (err) {
    var message = String(err && err.message || err);
    if (/404|not found|gone/i.test(message)) return { ok: true, eventId: eventId, alreadyMissing: true };
    throw err;
  }
}

function calendarMeetLink_(event) {
  var link = String(event && event.hangoutLink || '');
  if (!link && event && event.conferenceData && event.conferenceData.entryPoints) {
    var video = event.conferenceData.entryPoints.filter(function (point) { return point.entryPointType === 'video'; })[0];
    link = video && video.uri || '';
  }
  return validMeetLink_(link) ? link : '';
}

function isAuthorizedWhatsAppCall_(data) {
  var expected = PropertiesService.getScriptProperties().getProperty('GOOGLE_APPS_SCRIPT_SECRET');
  var supplied = String(data && data.apiSecret || '');
  if (!expected || !supplied || expected.length !== supplied.length) return false;
  var diff = 0;
  for (var i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ supplied.charCodeAt(i);
  return diff === 0;
}

function paymentVerificationUrl_() {
  var configured = PropertiesService.getScriptProperties().getProperty('PAYMENT_VERIFICATION_URL');
  var url = configured || 'https://whatsapp-agent-gqg6.onrender.com/payments/verify';
  if (!/^https:\/\/[a-z0-9.-]+\/payments\/verify\/?$/i.test(url)) {
    throw new Error('PAYMENT_VERIFICATION_URL must be an HTTPS /payments/verify endpoint.');
  }
  return url;
}

// Independently confirm the payment with the private-key-backed wallet service.
// A browser callback or a caller-supplied "Paid" string is never sufficient.
function assertCapturedPayment_(paymentId, amountRupees) {
  var id = String(paymentId || '').trim();
  var amount = Number(amountRupees);
  var amountPaise = Math.round(amount * 100);
  if (!/^pay_[A-Za-z0-9]+$/.test(id) || !Number.isFinite(amount) || amount <= 0
    || amountPaise <= 0 || Math.abs(amount * 100 - amountPaise) > 0.001) {
    throw new Error('A valid Razorpay payment ID and exact positive INR amount are required.');
  }
  var response;
  try {
    var secret = PropertiesService.getScriptProperties().getProperty('GOOGLE_APPS_SCRIPT_SECRET');
    if (!secret) throw new Error('GOOGLE_APPS_SCRIPT_SECRET is not configured in Apps Script properties.');
    response = UrlFetchApp.fetch(paymentVerificationUrl_(), {
      method: 'post',
      contentType: 'application/json',
      headers: { 'X-Google-Apps-Script-Secret': secret },
      payload: JSON.stringify({ payment_id: id, expected_amount_paise: amountPaise, currency: 'INR' }),
      muteHttpExceptions: true
    });
  } catch (err) {
    throw new Error('Payment verification service is unavailable; no paid record was written.');
  }
  var code = response.getResponseCode();
  if (code < 200 || code >= 300) throw new Error('Payment verification service rejected the request (HTTP ' + code + ').');
  var result;
  try { result = JSON.parse(response.getContentText()); }
  catch (err) { throw new Error('Payment verification service returned an invalid response.'); }
  if (!result || result.verified !== true || String(result.payment_id || '') !== id
    || Number(result.amount_paise) !== amountPaise || String(result.currency || '').toUpperCase() !== 'INR') {
    throw new Error('Razorpay has not verified a captured payment for this exact amount.');
  }
  return result;
}

function findRowByHeader_(sheet, headerName, wantedValue) {
  if (sheet.getLastRow() < 2 || sheet.getLastColumn() < 1) return 0;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var column = headers.indexOf(headerName) + 1;
  if (column < 1) throw new Error('Required column "' + headerName + '" is missing from tab "' + sheet.getName() + '".');
  var values = sheet.getRange(2, column, sheet.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]) === String(wantedValue)) return i + 2;
  }
  return 0;
}

function paymentRequestById_(sheet, paymentLinkId) {
  var row = findRowByHeader_(sheet, 'Payment Link ID', paymentLinkId);
  if (!row) return null;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var values = sheet.getRange(row, 1, 1, headers.length).getValues()[0];
  var record = {};
  headers.forEach(function (header, index) { record[header] = values[index]; });
  return { row: row, values: record };
}

function parseRupees_(value) {
  var cleaned = String(value == null ? '' : value).replace(/[^0-9.\-]/g, '');
  var amount = Number(cleaned);
  return Number.isFinite(amount) ? amount : NaN;
}

function validPaymentRequestAmounts_(data) {
  var normalRate = Number(data.normalRate);
  var websiteDiscount = Number(data.websiteDiscount || 0);
  var additionalDiscount = Number(data.additionalDiscount || 0);
  var serviceTotal = Number(data.serviceTotal);
  var amountDue = Number(data.amountDue);
  return [normalRate, websiteDiscount, additionalDiscount, serviceTotal, amountDue].every(Number.isFinite)
    && normalRate > 0 && websiteDiscount >= 0 && additionalDiscount >= 0 && serviceTotal > 0
    && amountDue > 0 && amountDue <= serviceTotal
    && Math.abs(normalRate - websiteDiscount - additionalDiscount - serviceTotal) <= 0.01;
}

function safeSheetValue_(value) {
  if (typeof value !== 'string') return value;
  return /^[\s]*[=+@-]/.test(value) ? "'" + value : value;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function upsertWhatsAppCustomer_(ss, data) {
  var sheet = ss.getSheetByName('Customers');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var rows = sheet.getDataRange().getValues();
  var row = 0;
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][2]) === String(data.phone || '')) { row = i + 1; break; }
  }
  var values = {
    'Customer ID': data.customerId || '', 'Full Name': data.name || '', 'Phone': data.phone || '',
    'Email': data.email || '', 'Date of Birth': data.dob || '', 'Birth Time': data.birthTime || '',
    'Birth Place': data.birthPlace || '', 'Gender': data.gender || '',
    'Billing Address': data.billingAddress || '', 'Customer GSTIN': data.customerGstin || '',
    'Last Updated': data.timestamp || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  };
  if (row) {
    headers.forEach(function (header, index) {
      if (Object.prototype.hasOwnProperty.call(values, header) && values[header] !== '') {
        sheet.getRange(row, index + 1).setValue(safeSheetValue_(values[header]));
      }
    });
  } else {
    sheet.appendRow(headers.map(function (header) {
      return Object.prototype.hasOwnProperty.call(values, header) ? values[header] : '';
    }).map(safeSheetValue_));
  }
}

function updatePaymentRequestStatus_(ss, paymentLinkId, status, paymentId) {
  var sheet = ss.getSheetByName('WA Payment Requests');
  if (!sheet || sheet.getLastRow() < 2) return false;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (['UNPAID', 'DELIVERY_FAILED', 'PAID', 'GATEWAY_TEST_PAID'].indexOf(status) === -1) return false;
  var row = findRowByHeader_(sheet, 'Payment Link ID', paymentLinkId);
  if (!row) return false;
  var statusCol = headers.indexOf('Payment Status') + 1;
  var paymentIdCol = headers.indexOf('Payment ID') + 1;
  if (statusCol < 1 || paymentIdCol < 1) return false;
  var oldStatus = String(sheet.getRange(row, statusCol).getValue() || 'UNPAID');
  var oldPaymentId = String(sheet.getRange(row, paymentIdCol).getValue() || '');
  if (oldStatus === 'PAID' || oldStatus === 'GATEWAY_TEST_PAID') {
    return oldStatus === status && oldPaymentId === String(paymentId || '');
  }
  if ((status === 'PAID' || status === 'GATEWAY_TEST_PAID')
    && (!/^pay_[A-Za-z0-9]+$/.test(String(paymentId || '')) || (oldPaymentId && oldPaymentId !== String(paymentId)))) return false;
  if (status === 'UNPAID' && oldStatus !== 'UNPAID') return false;
  sheet.getRange(row, statusCol).setValue(status);
  if (paymentId && (status === 'PAID' || status === 'GATEWAY_TEST_PAID')) sheet.getRange(row, paymentIdCol).setValue(paymentId);
  return true;
}

function escapeHtml_(value) {
  return String(value == null ? '' : value).replace(/[&<>\"']/g, function (char) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' })[char];
  });
}

function validMeetLink_(value) {
  return /^https:\/\/meet\.google\.com\/[A-Za-z0-9-]+(?:\?[A-Za-z0-9_=&%-]*)?$/.test(String(value || ''));
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
  return '\u20B9' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
    d.notes || '',                                // Notes
    'Pending'                                     // Email Status
  ];
}

/**
 * Sends a confirmation email to the customer with full details and Google Meet link.
 * Works seamlessly for both WhatsApp direct bookings and Website consultations.
 */
function sendConsultationConfirmationEmail(data) {
  var clientEmail = data.googleEmail || data.email || '';
  if (!clientEmail || clientEmail.indexOf('@') === -1) {
    console.warn('Skipping confirmation email: no valid email found for customer: ' + (data.name || 'Seeker'));
    return { sent: false, error: 'Customer email is missing or invalid.' };
  }

  try {
    var customerName = data.name || 'Seeker';
    var serviceName = data.service || 'Astrology Consultation';
    var meetLink = validMeetLink_(data.meetLink) ? data.meetLink : '';
    var isGatewayTest = data.isGatewayTest === true;
    if (data.target === 'booking' && !data.invoiceBase64) return { sent: false, error: 'Payment receipt PDF is missing.' };
    if (data.target === 'booking' && !validMeetLink_(meetLink)) return { sent: false, error: 'Google Meet link is missing or invalid.' };
    var sessionTime = data.eventTime || (data.sessionDate ? (data.sessionDate + (data.sessionTime ? ' (' + data.sessionTime + ')' : '')) : 'Tomorrow at 11:00 AM IST (Tentative)');
    var customerNameHtml = escapeHtml_(customerName);
    var serviceNameHtml = escapeHtml_(serviceName);
    var sessionTimeHtml = escapeHtml_(sessionTime);
    var meetLinkHtml = escapeHtml_(meetLink);
    var dobHtml = escapeHtml_(data.dob || 'Not specified');
    var birthTimeHtml = escapeHtml_(data.birthTime || 'Not specified');
    var birthPlaceHtml = escapeHtml_(data.birthPlace || 'Not specified');
    var genderHtml = escapeHtml_(data.gender || 'Not specified');
    var queryHtml = escapeHtml_(data.query || '');
    
    var birthDetailsList = [
      '- Gender: ' + (data.gender || 'Not specified'),
      '- Date of Birth: ' + (data.dob || 'Not specified'),
      '- Time of Birth: ' + (data.birthTime || 'Not specified'),
      '- Place of Birth: ' + (data.birthPlace || 'Not specified')
    ];
    if (data.query) {
      birthDetailsList.push('- Topic / Query: ' + data.query);
    }
    var birthDetailsText = birthDetailsList.join('\n');

    var subject = isGatewayTest
      ? '₹1 Razorpay gateway test receipt - not a consultation booking'
      : "Your Consultation is Confirmed! 🕉️ - Veshannastro";
    
    var textBody = "Hari Om, " + customerName + "!\n\n" +
      (isGatewayTest
        ? 'Razorpay verified your INR ' + Number(data.amountPaid || 1).toFixed(2) + ' gateway test payment. This is only a payment-system test; it does not pay for or confirm a consultation. The published consultation price is INR ' + Number(data.basePrice || 0).toFixed(2) + '.\n\n'
        : "Thank you for booking your consultation with Veshannastro (" + serviceName + ").\n\n") +
      "Here are the details we received from you:\n" + birthDetailsText + "\n\n" +
      (isGatewayTest ? 'Requested test slot: ' : 'Scheduled Slot: ') + sessionTime + "\n" +
      (meetLink ? ("Google Meet Link: " + meetLink + "\n\n") : ("We will share your Google Meet link shortly prior to the session.\n\n")) +
      (isGatewayTest ? 'The consultation itself has not been booked or paid for.\n\n' : "Shashank Agrawal will also reach out to you shortly to re-confirm.\n\n") +
      "Warm regards,\n" +
      "Veshannastro Team\n\n" +
      "Shri Radharamano Vijayate";

    var htmlBody = '<div style="font-family: \'Playfair Display\', \'Georgia\', serif; max-width: 650px; margin: 0 auto; background: #ffffff; border: 1px solid #d4af37; border-radius: 16px; overflow: hidden; color: #2c2c2c; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">' +
      '<div style="background: linear-gradient(135deg, #1c1c1c, #2a2a2a); padding: 40px 30px; text-align: center; color: #ffffff; border-bottom: 3px solid #d4af37;">' +
        '<div style="font-size: 32px; font-weight: 700; letter-spacing: 2px; color: #d4af37; text-transform: uppercase;">🕉️ Veshannastro</div>' +
        '<div style="font-size: 16px; margin-top: 10px; color: #a9a9a9; font-family: -apple-system, sans-serif; font-weight: 300; letter-spacing: 1px;">' + (isGatewayTest ? 'Gateway Payment Test Receipt' : 'Sacred Consultation Confirmed') + '</div>' +
      '</div>' +
      '<div style="padding: 40px 30px; font-family: -apple-system, sans-serif;">' +
        (isGatewayTest ? '<div style="background:#fff7e8;color:#78581c;padding:14px 18px;margin:0 0 22px;border-radius:8px;font-family:-apple-system,sans-serif;font-weight:600;">₹1 GATEWAY TEST ONLY - NOT A CONSULTATION PAYMENT OR BOOKING</div>' : '') +
        '<p style="font-size: 18px; margin: 0 0 20px; color: #1c1c1c;">Hari Om, <strong>' + customerNameHtml + '</strong> 🙏</p>' +
        '<p style="font-size: 16px; line-height: 1.7; color: #4a4a4a; margin: 0 0 30px;">' +
          (isGatewayTest
            ? 'This INR ' + Number(data.amountPaid || 1).toFixed(2) + ' transaction only validates the payment gateway. It does not pay for or confirm your <strong>' + serviceNameHtml + '</strong> consultation. Published price: INR ' + Number(data.basePrice || 0).toFixed(2) + '.'
            : 'Your sacred consultation for <strong>' + serviceNameHtml + '</strong> is fully confirmed. We deeply honor your trust and look forward to guiding you through the planetary energies.') +
        '</p>' +
        '<div style="background: #faf8f5; border-left: 4px solid #d4af37; padding: 25px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">' +
          '<div style="font-weight: 600; color: #8b7322; margin-bottom: 15px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">' + (isGatewayTest ? 'Gateway Test Details' : 'Session Schedule') + '</div>' +
          '<div style="font-size: 16px; line-height: 1.8; color: #2c2c2c;">' +
            '<div><strong>' + (isGatewayTest ? 'Requested test time:' : 'Time:') + '</strong> ' + sessionTimeHtml + '</div>' +
            (data.amountPaid ? ('<div><strong>' + (isGatewayTest ? 'Test charge:' : 'Contribution:') + '</strong> ' + rupees(data.amountPaid) + '</div>') : '') +
            (data.payment_id ? ('<div><strong>Transaction ID:</strong> <span style="font-family: monospace; font-size: 13px; color: #8b7322;">' + escapeHtml_(data.payment_id) + '</span></div>') : '') +
          '</div>' +
        '</div>' +
        '<div style="padding: 0 10px; margin-bottom: 35px;">' +
          '<div style="font-weight: 600; color: #1c1c1c; margin-bottom: 15px; font-size: 15px; border-bottom: 1px solid #eee; padding-bottom: 8px;">Your Birth Details</div>' +
          '<div style="font-size: 15px; line-height: 1.8; color: #555555; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">' +
            '<div><strong style="color: #1c1c1c;">Date of Birth:</strong><br>' + dobHtml + '</div>' +
            '<div><strong style="color: #1c1c1c;">Time of Birth:</strong><br>' + birthTimeHtml + '</div>' +
            '<div><strong style="color: #1c1c1c;">Place of Birth:</strong><br>' + birthPlaceHtml + '</div>' +
            '<div><strong style="color: #1c1c1c;">Gender:</strong><br>' + genderHtml + '</div>' +
            (data.query ? ('<div style="grid-column: 1 / -1; margin-top: 10px;"><strong style="color: #1c1c1c;">Core Query:</strong><br><span style="font-style: italic;">"' + queryHtml + '"</span></div>') : '') +
          '</div>' +
        '</div>' +
        (meetLink ? (
          '<div style="text-align: center; margin: 40px 0;">' +
            '<a href="' + meetLinkHtml + '" style="background: #1c1c1c; color: #d4af37; font-weight: 600; text-decoration: none; padding: 16px 36px; border-radius: 30px; display: inline-block; font-size: 16px; letter-spacing: 0.5px; border: 1px solid #d4af37; transition: all 0.3s ease;">' +
              (isGatewayTest ? 'Open Test Google Meet' : 'Join Video Consultation') +
            '</a>' +
            '<div style="font-size: 13px; color: #888888; margin-top: 15px;">Meeting Link: <a href="' + meetLinkHtml + '" style="color: #8b7322; text-decoration: underline;">' + meetLinkHtml + '</a></div>' +
          '</div>'
        ) : (
          '<div style="text-align: center; margin: 40px 0; padding: 20px; border: 1px dashed #d4af37; border-radius: 8px; color: #8b7322; background: #faf8f5;">' +
            '📹 <strong>Video Link Pending:</strong> We will share your secure Google Meet link shortly before the session begins.' +
          '</div>'
        )) +
        '<div style="margin-top: 40px; text-align: center; padding-top: 30px; border-top: 1px solid #eeeeee;">' +
          '<div style="font-size: 15px; font-weight: 600; color: #1c1c1c; margin-bottom: 5px;">Veshannastro Team</div>' +
          '<div style="font-size: 13px; color: #888888; margin-bottom: 15px;">Guidance for the soul.</div>' +
          '<div style="color: #d4af37; font-style: italic; font-family: \'Georgia\', serif; font-size: 16px; letter-spacing: 1px;">Shri Radharamano Vijayate</div>' +
        '</div>' +
      '</div>' +
    '</div>';

    var attachments = [];
    if (data.invoiceBase64) {
      try {
        var encodedPdf = String(data.invoiceBase64);
        if (encodedPdf.length > 12 * 1024 * 1024 || !/^JVBERi0/.test(encodedPdf)) {
          return { sent: false, error: 'Receipt attachment is not a valid PDF or exceeds the size limit.' };
        }
        var attachmentName = String(data.invoiceName || 'Payment_Receipt.pdf')
          .replace(/^Invoice_/i, 'Payment_Receipt_')
          .replace(/[^A-Za-z0-9_.-]/g, '_').slice(0, 120);
        if (!/\.pdf$/i.test(attachmentName)) attachmentName += '.pdf';
        var blob = Utilities.newBlob(Utilities.base64Decode(encodedPdf), 'application/pdf', attachmentName);
        attachments.push(blob);
      } catch (e) {
        console.error('Error decoding invoice base64:', e);
        if (data.target === 'booking') return { sent: false, error: 'Could not decode payment receipt PDF.' };
      }
    }

    MailApp.sendEmail({
      to: clientEmail,
      subject: subject,
      body: textBody,
      htmlBody: htmlBody,
      name: "Veshannastro",
      attachments: attachments
    });
    console.log("Confirmation email successfully sent to: " + clientEmail);
    return { sent: true };
  } catch (mailErr) {
    console.error("MailApp.sendEmail failed for " + clientEmail + ": " + mailErr);
    return { sent: false, error: String(mailErr) };
  }
}

/**
 * TEST FUNCTION: Run this in Apps Script editor to authorize MailApp permissions!
 * 1. Select 'testSendEmail' in the function dropdown at the top of the Apps Script editor.
 * 2. Click ▶ Run.
 * 3. Grant Google authorization when prompted.
 * 4. Check your inbox for the test email.
 */
function testSendEmail() {
  var myEmail = Session.getActiveUser().getEmail();
  if (!myEmail) {
    Logger.log("No active user email detected. Please replace myEmail with your actual email address in testSendEmail().");
    return;
  }
  Logger.log("Sending test confirmation email to: " + myEmail);
  sendConsultationConfirmationEmail({
    target: "email_test",
    name: "Test Seeker",
    email: myEmail,
    gender: "Not specified",
    dob: "15/08/1995",
    birthTime: "10:30 AM",
    birthPlace: "Bhopal, MP",
    service: "Vedic Complete Consultation",
    amountPaid: 1100,
    payment_id: "pay_test123456",
    meetLink: "https://meet.google.com/abc-defg-hij",
    eventTime: "Tomorrow at 11:00 AM IST",
    query: "Career and Marriage guidance"
  });
  Logger.log("Test finished! Please check your email inbox: " + myEmail);
}

// Run once from the editor to create missing CRM tabs and append missing headers.
function initializeSpreadsheet() {
  var created = ensureAllTabs();
  Logger.log('Spreadsheet setup complete. New tabs: ' + (created.length ? created.join(', ') : 'none'));
  return { ok: true, created: created };
}

// Safe connectivity/authorization check; this does not create or verify a payment.
function testPaymentVerificationConnection() {
  var verifyUrl = paymentVerificationUrl_();
  var healthUrl = verifyUrl.replace(/\/payments\/verify\/?$/i, '/payments/verify/health');
  var response = UrlFetchApp.fetch(healthUrl, { method: 'get', muteHttpExceptions: true });
  var code = response.getResponseCode();
  if (code < 200 || code >= 300) throw new Error('WhatsApp service health check failed (HTTP ' + code + ').');
  var result = JSON.parse(response.getContentText());
  if (!result || result.ok !== true || result.payment_verification_configured !== true) {
    throw new Error('WhatsApp service responded, but payment verification is not configured there.');
  }
  Logger.log('WhatsApp service is reachable and Razorpay payment verification is configured.');
  return { ok: true };
}
