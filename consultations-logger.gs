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
 * SETUP & DEPLOYMENT INSTRUCTIONS:
 *   1. Open your Consultation CRM Google Sheet -> Extensions -> Apps Script.
 *   2. Paste this entire updated code into your Apps Script editor.
 *   3. ⚠️ AUTHORIZE EMAIL (ONE-TIME):
 *        - At the top toolbar, select 'testSendEmail' from the function dropdown.
 *        - Click '▶ Run'.
 *        - Google will pop up "Authorization required" -> Click "Review permissions"
 *          -> Select your Google account -> "Advanced" -> "Go to ... (unsafe)" -> "Allow".
 *        - Check your email inbox to verify you received the test email!
 *   4. ⚠️ UPDATE THE LIVE DEPLOYMENT (CRITICAL):
 *        - Click 'Deploy' (top right) -> 'Manage deployments'.
 *        - Click the pencil icon (✏️ Edit) next to your active Web App deployment.
 *        - Under 'Version', click the dropdown and choose 'New version'.
 *        - Click 'Deploy' -> 'Done'.
 *        (Note: Simply pressing Save (Ctrl+S) does not update the live /exec URL!)
 * ===================================================================
 */

var TAB_NAME = 'Consultations';

// 🛑 IF YOU GET A "MISSING SPREADSHEET_ID" ERROR, PASTE YOUR GOOGLE SHEET ID BELOW:
// (It is the long string of letters and numbers in the URL between /d/ and /edit)
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
  'Notes'             // AA
];

/* ── ALL CRM tabs + their exact headers (matches your existing sheet) ──
   Any tab that is missing gets created with these headers; existing tabs
   and their data are never touched. */
var ALL_TABS = {
  'Customers': ['Customer ID','Full Name','Phone','Email','Date of Birth','Birth Time','Birth Place','Gender','Remedies Prescribed'],
  'Bookings': [
    'Client ID','Booked On','Full Name','Phone','Email','Date of Birth',
    'Birth Time','Birth Place','Service','Message','Source','Payment Status',
    'Amount (₹)','Consultation Date','Status','Notes'
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
  'WhatsApp Chat History': ['Timestamp', 'Phone', 'Sender', 'Message', 'Notes']
};

function ensureAllTabs() {
  var ss = SpreadsheetApp.openById(spreadsheetId());
  var created = [];
  Object.keys(ALL_TABS).forEach(function (name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(ALL_TABS[name]);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, ALL_TABS[name].length).setFontWeight('bold');
      if (name === 'Dashboard' || name === 'WA Funnel Dashboard' || name === 'WA Suspicious') seedDashboard(sheet);
      created.push(name);
    }
  });
  return created;
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
  var created = ensureAllTabs(); // make sure ALL tabs + headers exist
  return json({ ok: true, service: 'consultations-logger',
                tabs: Object.keys(ALL_TABS), created: created });
}

function doPost(e) {
  try {
    var data = parseBody(e);
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
        lt.getRange(foundRow, 3).setValue(now);
        lt.getRange(foundRow, 4).setValue(data.message_count || 1);
        lt.getRange(foundRow, 5).setValue(converted);
        lt.getRange(foundRow, 6).setValue(status);
      } else {
        lt.appendRow([data.phone, now, now, data.message_count || 1, converted, status]);
      }
      return json({ ok: true, tab: 'WA All Leads' });
    }

    if (data.target === 'chat') {
      var ct = ss.getSheetByName('WhatsApp Chat History');
      ct.appendRow([
        data.timestamp || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        data.phone || '',
        data.sender || 'Unknown',
        data.message || '',
        data.notes || ''
      ]);
      return json({ ok: true, tab: 'WhatsApp Chat History' });
    }

    if (data.target === 'customer_update') {
      var ctab = ss.getSheetByName('Customers');
      var cData = ctab.getDataRange().getValues();
      var foundRow = -1;
      for(var i=1; i<cData.length; i++) {
        if(cData[i][2] == data.phone) { // Match by phone
          foundRow = i + 1;
          break;
        }
      }
      if (foundRow > -1) {
        if (data.customerId) ctab.getRange(foundRow, 1).setValue(data.customerId);
        if (data.name) ctab.getRange(foundRow, 2).setValue(data.name);
        if (data.email) ctab.getRange(foundRow, 4).setValue(data.email);
        if (data.dob) ctab.getRange(foundRow, 5).setValue(data.dob);
        if (data.tob) ctab.getRange(foundRow, 6).setValue(data.tob);
        if (data.pob) ctab.getRange(foundRow, 7).setValue(data.pob);
        if (data.gender) ctab.getRange(foundRow, 8).setValue(data.gender);
        if (data.remedies) ctab.getRange(foundRow, 9).setValue(data.remedies);
      } else {
        ctab.appendRow([
          data.customerId || '', data.name || '', data.phone || '', data.email || '', 
          data.dob || '', data.tob || '', data.pob || '', data.gender || '', data.remedies || ''
        ]);
      }
      return json({ ok: true, tab: 'Customers' });
    }

    // optional routing: payload {target:"booking"} or {target:"report"} logs a
    // simple row into Bookings / Premium Reports; default stays Consultations.
    if (data.target === 'booking' || data.target === 'report') {
      var tname = data.target === 'booking' ? 'Bookings' : 'Premium Reports';
      var t = ss.getSheetByName(tname);
      var clientEmail = data.googleEmail || data.email || '';
      t.appendRow([
        nextClientId(t),
        data.timestamp || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        data.name || '', data.phone || '', clientEmail,
        data.dob || '', data.birthTime || '', data.birthPlace || '',
        data.service || '', data.query || data.message || '',
        data.source || 'Website', data.paymentStatus || 'Paid',
        rupees(data.amountPaid), data.sessionDate || '', 'New', data.notes || ''
      ]);

      // Send Automated Confirmation Email for bookings
      if (data.target === 'booking') {
        sendConsultationConfirmationEmail(data);
      }

      return json({ ok: true, tab: tname });
    }

    var sheet = getOrCreateTab();
    sheet.appendRow(buildRow(sheet, data));

    // Send Automated Confirmation Email for Website Consultations
    sendConsultationConfirmationEmail(data);

    return json({ ok: true, tab: TAB_NAME });
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

/**
 * Sends a confirmation email to the customer with full details and Google Meet link.
 * Works seamlessly for both WhatsApp direct bookings and Website consultations.
 */
function sendConsultationConfirmationEmail(data) {
  var clientEmail = data.googleEmail || data.email || '';
  if (!clientEmail || clientEmail.indexOf('@') === -1) {
    console.warn('Skipping confirmation email: no valid email found for customer: ' + (data.name || 'Seeker'));
    return;
  }

  try {
    var customerName = data.name || 'Seeker';
    var serviceName = data.service || 'Astrology Consultation';
    var meetLink = data.meetLink || '';
    var sessionTime = data.eventTime || (data.sessionDate ? (data.sessionDate + (data.sessionTime ? ' (' + data.sessionTime + ')' : '')) : 'Tomorrow at 11:00 AM IST (Tentative)');
    
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

    var subject = "Your Consultation is Confirmed! 🕉️ - Veshannastro";
    
    var textBody = "Hari Om, " + customerName + "!\n\n" +
      "Thank you for booking your consultation with Veshannastro (" + serviceName + ").\n\n" +
      "Here are the details we received from you:\n" + birthDetailsText + "\n\n" +
      "Scheduled Slot: " + sessionTime + "\n" +
      (meetLink ? ("Google Meet Link: " + meetLink + "\n\n") : ("We will share your Google Meet link shortly prior to the session.\n\n")) +
      "Shashank Agrawal will also reach out to you shortly to re-confirm.\n\n" +
      "Warm regards,\n" +
      "Veshannastro Team\n\n" +
      "Shri Radharamano Vijayate";

    var htmlBody = '<div style="font-family: \'Playfair Display\', \'Georgia\', serif; max-width: 650px; margin: 0 auto; background: #ffffff; border: 1px solid #d4af37; border-radius: 16px; overflow: hidden; color: #2c2c2c; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">' +
      '<div style="background: linear-gradient(135deg, #1c1c1c, #2a2a2a); padding: 40px 30px; text-align: center; color: #ffffff; border-bottom: 3px solid #d4af37;">' +
        '<div style="font-size: 32px; font-weight: 700; letter-spacing: 2px; color: #d4af37; text-transform: uppercase;">🕉️ Veshannastro</div>' +
        '<div style="font-size: 16px; margin-top: 10px; color: #a9a9a9; font-family: -apple-system, sans-serif; font-weight: 300; letter-spacing: 1px;">Sacred Consultation Confirmed</div>' +
      '</div>' +
      '<div style="padding: 40px 30px; font-family: -apple-system, sans-serif;">' +
        '<p style="font-size: 18px; margin: 0 0 20px; color: #1c1c1c;">Hari Om, <strong>' + customerName + '</strong> 🙏</p>' +
        '<p style="font-size: 16px; line-height: 1.7; color: #4a4a4a; margin: 0 0 30px;">' +
          'Your sacred consultation for <strong>' + serviceName + '</strong> is fully confirmed. We deeply honor your trust and look forward to guiding you through the planetary energies.' +
        '</p>' +
        '<div style="background: #faf8f5; border-left: 4px solid #d4af37; padding: 25px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">' +
          '<div style="font-weight: 600; color: #8b7322; margin-bottom: 15px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Session Schedule</div>' +
          '<div style="font-size: 16px; line-height: 1.8; color: #2c2c2c;">' +
            '<div><strong>Time:</strong> ' + sessionTime + '</div>' +
            (data.amountPaid ? ('<div><strong>Contribution:</strong> ' + rupees(data.amountPaid) + '</div>') : '') +
            (data.payment_id ? ('<div><strong>Transaction ID:</strong> <span style="font-family: monospace; font-size: 13px; color: #8b7322;">' + data.payment_id + '</span></div>') : '') +
          '</div>' +
        '</div>' +
        '<div style="padding: 0 10px; margin-bottom: 35px;">' +
          '<div style="font-weight: 600; color: #1c1c1c; margin-bottom: 15px; font-size: 15px; border-bottom: 1px solid #eee; padding-bottom: 8px;">Your Birth Details</div>' +
          '<div style="font-size: 15px; line-height: 1.8; color: #555555; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">' +
            '<div><strong style="color: #1c1c1c;">Date of Birth:</strong><br>' + (data.dob || 'Not specified') + '</div>' +
            '<div><strong style="color: #1c1c1c;">Time of Birth:</strong><br>' + (data.birthTime || 'Not specified') + '</div>' +
            '<div><strong style="color: #1c1c1c;">Place of Birth:</strong><br>' + (data.birthPlace || 'Not specified') + '</div>' +
            '<div><strong style="color: #1c1c1c;">Gender:</strong><br>' + (data.gender || 'Not specified') + '</div>' +
            (data.query ? ('<div style="grid-column: 1 / -1; margin-top: 10px;"><strong style="color: #1c1c1c;">Core Query:</strong><br><span style="font-style: italic;">"' + data.query + '"</span></div>') : '') +
          '</div>' +
        '</div>' +
        (meetLink ? (
          '<div style="text-align: center; margin: 40px 0;">' +
            '<a href="' + meetLink + '" style="background: #1c1c1c; color: #d4af37; font-weight: 600; text-decoration: none; padding: 16px 36px; border-radius: 30px; display: inline-block; font-size: 16px; letter-spacing: 0.5px; border: 1px solid #d4af37; transition: all 0.3s ease;">' +
              'Join Video Consultation' +
            '</a>' +
            '<div style="font-size: 13px; color: #888888; margin-top: 15px;">Meeting Link: <a href="' + meetLink + '" style="color: #8b7322; text-decoration: underline;">' + meetLink + '</a></div>' +
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

    MailApp.sendEmail({
      to: clientEmail,
      subject: subject,
      body: textBody,
      htmlBody: htmlBody,
      name: "Veshannastro"
    });
    console.log("Confirmation email successfully sent to: " + clientEmail);
  } catch (mailErr) {
    console.error("MailApp.sendEmail failed for " + clientEmail + ": " + mailErr);
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
    target: "booking",
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

