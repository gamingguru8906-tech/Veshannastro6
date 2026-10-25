/* 2027 report page: report choice, order form, calculator with cover reveal, menu and star field. */
(function () {
  'use strict';
  var C = window.R27 || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  /* ---------- what this visitor does on the site, kept in our own database (api/r27/event) ----------
     A random id stays in this browser; once a WhatsApp number is typed into the order form it is joined to that
     number, so Kamala knows what they looked at. (The form itself is saved separately as it is typed, below.) */
  var VISITOR = (function () {
    var make = function () { var a = new Uint8Array(12); (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach(function (_, i) { a[i] = Math.random() * 256; }); return Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); };
    try { var v = localStorage.getItem('vs-visitor'); if (!/^[a-z0-9]{16,40}$/.test(v || '')) { v = make(); localStorage.setItem('vs-visitor', v); } return v; } catch (e) { return make(); }
  })();
  var logQueue = [], logTimer = null;
  function flushLog() {
    if (!logQueue.length) return;
    var body = JSON.stringify({ visitor: VISITOR, events: logQueue.splice(0, 20) });
    try { if (navigator.sendBeacon && navigator.sendBeacon('/api/r27/event', new Blob([body], { type: 'application/json' }))) return; } catch (e) {}
    try { fetch('/api/r27/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true }).catch(function () {}); } catch (e) {}
  }
  function logEvent(kind, detail) {
    logQueue.push({ kind: kind, detail: detail || {}, path: location.pathname, at: Date.now() });
    clearTimeout(logTimer); logTimer = setTimeout(flushLog, 1500);
  }
  addEventListener('pagehide', flushLog);
  (function () {
    var q = new URLSearchParams(location.search), d = {};
    try { if (document.referrer) d.from = new URL(document.referrer).hostname; } catch (e) {}
    ['utm_source', 'utm_medium', 'utm_campaign', 'ref'].forEach(function (k) { if (q.get(k)) d[k] = q.get(k).slice(0, 60); });
    logEvent('visit', d);
  })();
  var track = function (name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
    var p = params || {}, d = {};
    ['item_name', 'currency', 'value', 'personal_year', 'mulank', 'reason', 'link_text', 'transaction_id'].forEach(function (k) { if (p[k] != null) d[k] = p[k]; });
    if (!d.item_name && p.items && p.items[0]) d.item_name = p.items[0].item_name;
    logEvent(name, d);
  };
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var inr = function (n) { return '₹' + n.toLocaleString('en-IN'); };
  function readDraft() {
    try {
      var d = JSON.parse(localStorage.getItem('r27-order-draft') || 'null');
      return d && Date.now() - d.at < 14 * 24 * 3600 * 1000 ? d : null;
    } catch (e) { return null; }
  }

  /* ---------- selects ---------- */
  var opt = function (sel, v, t) { var o = document.createElement('option'); o.value = v; o.textContent = t; sel.appendChild(o); };
  var day = $('#dob-day'), mon = $('#dob-month'), yr = $('#dob-year');
  for (var d = 1; d <= 31; d++) opt(day, d, d);
  MONTHS.forEach(function (m, i) { opt(mon, i + 1, m); });
  for (var y = new Date().getFullYear(); y >= 1920; y--) opt(yr, y, y);
  var th = $('#tob-hour'), tm = $('#tob-min');
  for (var h = 1; h <= 12; h++) opt(th, h, h);
  for (var mi = 0; mi < 60; mi++) opt(tm, mi, (mi < 10 ? '0' : '') + mi);
  $$('.finder-form select[name="month"]').forEach(function (s) { MONTHS.forEach(function (m, i) { opt(s, i + 1, m); }); });

  var cc = $('#country-code');
  /* The full country list is filled in once the page is idle (India is there from the start). */
  var whenIdle = window.requestIdleCallback || function (f) { return setTimeout(f, 1500); };
  whenIdle(function () {
    fetch('/assets/countries.json').then(function (r) { return r.json(); }).then(function (list) {
      var cur = cc.value; cc.innerHTML = '';
      list.forEach(function (c) { opt(cc, c.value, c.label); });
      var saved = readDraft();
      cc.value = (saved && saved.cc) || cur || 'India|+91';
      if (!cc.value) cc.value = 'India|+91';
      if (typeof refresh === 'function') refresh();
    }).catch(function () {});
  }, { timeout: 3000 });

  /* ---------- report choice + price ---------- */
  var report = 'blend';
  var isIndia = function () { return /\|\+91$/.test(cc.value || 'India|+91'); };
  var price = function () {
    var r = C.reports[report];
    return isIndia() ? { now: inr(r.inr), was: inr(r.inr_mrp), amount: r.inr, cur: 'INR' } : { now: 'US$' + r.usd, was: 'US$' + r.usd_mrp, amount: r.usd, cur: 'USD' };
  };
  var tob = $('#tob-field');
  function refresh() {
    var r = C.reports[report], p = price();
    $$('[data-report]').forEach(function (b) { b.setAttribute('aria-checked', String(b.getAttribute('data-report') === report)); });
    $('#pb-now').textContent = p.now; $('#pb-was').textContent = p.was; $('#pb-line').textContent = r.line;
    $('#pay-label').textContent = (C.online && (p.cur === 'INR' || C.usdOnline) ? 'Review and pay ' : 'Review and order ') + p.now;
    tob.hidden = !r.needs_time;
    $$('select', tob).forEach(function (s) { s.required = r.needs_time; });
    $('#sp-name').textContent = r.name; $('#sp-price').textContent = p.now + ', delivered within ' + C.delivery;
  }
  function choose(key) { report = key; refresh(); saveDraft(); track('select_item', { item_name: C.reports[key].name }); }
  $$('[data-report]').forEach(function (b) { b.addEventListener('click', function () { choose(b.getAttribute('data-report')); }); });
  $$('[data-pick]').forEach(function (a) { a.addEventListener('click', function () { choose(a.getAttribute('data-pick')); }); });
  cc.addEventListener('change', refresh);
  refresh();

  /* ---------- validation ---------- */
  var form = $('#registration');
  form.addEventListener('input', function (e) { var f = e.target.closest('.field,.consent'); if (f) f.classList.remove('invalid'); saveDraftSoon(); });
  form.addEventListener('change', function (e) { var f = e.target.closest('.field,.consent'); if (f) f.classList.remove('invalid'); saveDraftSoon(); });

  /* ---------- the order form is kept on this device as it is typed ----------
     Switching between Astro-Numero Blend and Classic keeps every detail (they share one form), and a reload,
     a trip to WhatsApp or an app switch on a phone brings the details back. Cleared after a paid order. */
  var DRAFT_KEY = 'r27-order-draft', DRAFT_FIELDS = ['name', 'dob-day', 'dob-month', 'dob-year', 'tob-hour', 'tob-min', 'tob-ampm', 'pob', 'email', 'mobile', 'referral'];
  var draftTimer = null;
  function saveDraft() {
    try {
      var d = { at: Date.now(), report: report, cc: cc.value };
      DRAFT_FIELDS.forEach(function (id) { var el = document.getElementById(id); if (el) d[id] = el.value; });
      localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    } catch (e) { /* private mode or storage blocked: the form still works */ }
  }
  function saveDraftSoon() { clearTimeout(draftTimer); draftTimer = setTimeout(saveDraft, 200); remoteSoon(); }

  /* ---------- the form is also saved to us as it is typed (api/r27/draft → Kamala → the Google Sheet) ----------
     Whatever has been typed so far, a few seconds after the last key, so the team and Kamala can help someone who
     stops halfway. A WhatsApp number typed here gets one message from Kamala if they do not finish. The notice at the
     top of the form says so. Nothing is sent while the form is empty. */
  var remoteTimer = null, remoteLast = '', remoteAt = 0;
  function draftPayload() {
    var r = C.reports[report] || {};
    var dd = +day.value, mm = +mon.value, yy = +yr.value;
    var dob = dd && mm && yy && dobValid() ? yy + '-' + ('0' + mm).slice(-2) + '-' + ('0' + dd).slice(-2) : '';
    var amp = ($('#tob-ampm') || {}).value;
    return {
      visitor: VISITOR, report: report, name: $('#name').value.trim().slice(0, 80), dob: dob,
      tob: r.needs_time && th.value && tm.value && amp ? th.value + ':' + ('0' + tm.value).slice(-2) + ' ' + amp : '',
      pob: $('#pob').value.trim().slice(0, 100), email: $('#email').value.trim().slice(0, 120),
      code: (cc.value.split('|')[1] || '+91').replace(/\D/g, ''), mobile: $('#mobile').value.replace(/\D/g, '').slice(0, 15),
      referral: $('#referral').value.trim().slice(0, 40), page: location.pathname
    };
  }
  function sendRemote(beacon) {
    clearTimeout(remoteTimer); remoteTimer = null;
    var d = draftPayload();
    if (!d.name && !d.mobile && !d.email && !d.pob && !d.dob) return;
    var body = JSON.stringify(d);
    if (body === remoteLast) return;
    remoteLast = body; remoteAt = Date.now();
    try {
      if (beacon && navigator.sendBeacon && navigator.sendBeacon('/api/r27/draft', new Blob([body], { type: 'application/json' }))) return;
      fetch('/api/r27/draft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true }).catch(function () {});
    } catch (e) {}
  }
  function remoteSoon() {
    if (!window.fetch) return;
    clearTimeout(remoteTimer);
    // 1.5 s after the last change, and at least every 5 s while they keep typing.
    var wait = Math.min(1500, Math.max(0, 5000 - (Date.now() - remoteAt)));
    remoteTimer = setTimeout(sendRemote, remoteAt ? wait : 1500);
  }
  addEventListener('pagehide', function () { sendRemote(true); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') sendRemote(true); });
  function clearDraft() { clearTimeout(draftTimer); try { localStorage.removeItem(DRAFT_KEY); } catch (e) {} }
  (function restoreDraft() {
    var d = readDraft(); if (!d) return;
    DRAFT_FIELDS.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && d[id] != null && d[id] !== '') { el.value = d[id]; if (id === 'pob') el.dataset.picked = d[id]; }
    });
    if (d.cc && cc.querySelector('option[value="' + String(d.cc).replace(/"/g, '') + '"]')) cc.value = d.cc;
    if (C.reports[d.report]) report = d.report;
    refresh();
  })();
  addEventListener('pagehide', saveDraft);

  /* ---------- place of birth: suggestions from Indian and world cities (assets/r27/cities.json) ----------
     Typing "Rai" offers Raipur, Chhattisgarh first; old names work too (Bombay, Gurgaon, Calcutta). A place that is not
     in the list can still be used exactly as written. */
  (function () {
    var input = $('#pob'), list = $('#pob-list');
    if (!input || !list) return;
    var places = null, loading = null, items = [], active = -1;
    var fold = function (v) { return String(v || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, ''); };
    function load() {
      if (places) return Promise.resolve(places);
      if (!loading) loading = fetch('/assets/r27/cities.json').then(function (r) { return r.json(); }).then(function (d) {
        places = d.places.map(function (p) {
          return { name: p[0], region: p[1], country: d.countries[p[2]], rank: p[3] + (p[2] === 0 ? 8 : 0), n: fold(p[0]),
            words: p[0].split(/[\s-]+/).slice(1).map(fold), alias: String(p[4] || '').split('|').filter(Boolean) };
        });
        return places;
      }).catch(function () { loading = null; return null; });
      return loading;
    }
    var label = function (p) { return p.name + (p.region ? ', ' + p.region : '') + ', ' + p.country; };
    function search(q) {
      var n = fold(q.split(',')[0]);
      if (n.length < 2) return [];
      var out = [];
      for (var i = 0; i < places.length; i++) {
        var p = places[i], score = 0, via = '';
        if (p.n === n) score = 4;
        else if (p.n.indexOf(n) === 0) score = 3;
        else {
          for (var a = 0; a < p.alias.length && !score; a++) if (fold(p.alias[a]).indexOf(n) === 0) { score = 2.5; via = p.alias[a]; }
          for (var w = 0; w < p.words.length && !score; w++) if (p.words[w].indexOf(n) === 0) score = 2;
          if (!score && n.length >= 4 && p.n.indexOf(n) > 0) score = 1;
        }
        if (score) out.push({ p: p, score: score, via: via });
      }
      out.sort(function (x, y) { return (y.score - x.score) || (y.p.rank - x.p.rank); });
      return out.slice(0, 7);
    }
    function close() { list.hidden = true; list.innerHTML = ''; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); active = -1; }
    function render() {
      var q = input.value.trim();
      if (!places || q.length < 2 || input.dataset.picked === input.value) return close();
      items = search(q);
      var html = items.map(function (it, i) {
        return '<li role="option" id="pob-opt-' + i + '" data-i="' + i + '" aria-selected="false"><b>' + esc(it.p.name) + (it.via ? ' <em>(' + esc(it.via) + ')</em>' : '') +
          '</b><span>' + esc((it.p.region ? it.p.region + ', ' : '') + it.p.country) + '</span></li>';
      });
      var exact = items.some(function (it) { return it.score === 4; });
      if (q.length >= 3 && !exact) html.push('<li role="option" id="pob-opt-' + items.length + '" data-own="1" class="place-own" aria-selected="false">Use “' + esc(q) + '” as written</li>');
      if (!html.length) return close();
      list.innerHTML = html.join(''); list.hidden = false; input.setAttribute('aria-expanded', 'true'); active = -1;
    }
    function highlight(i) {
      var opts = list.children; if (!opts.length) return;
      active = (i + opts.length) % opts.length;
      for (var k = 0; k < opts.length; k++) opts[k].setAttribute('aria-selected', String(k === active));
      input.setAttribute('aria-activedescendant', opts[active].id);
      opts[active].scrollIntoView({ block: 'nearest' });
    }
    function pick(li) {
      if (!li) return;
      input.value = li.getAttribute('data-own') ? input.value.trim() : label(items[+li.getAttribute('data-i')].p);
      input.dataset.picked = input.value;
      close();
      input.dispatchEvent(new Event('input', { bubbles: true })); // clears the error and saves the draft
    }
    input.addEventListener('focus', load);
    input.addEventListener('input', function () { if (input.dataset.picked !== input.value) delete input.dataset.picked; load().then(render); });
    input.addEventListener('keydown', function (e) {
      if (list.hidden) { if (e.key === 'ArrowDown') { load().then(render); } return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); highlight(active + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); highlight(active - 1); }
      else if (e.key === 'Enter') { e.preventDefault(); pick(list.children[active >= 0 ? active : 0]); }
      else if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'Tab' && active >= 0) pick(list.children[active]);
    });
    list.addEventListener('pointerdown', function (e) { e.preventDefault(); }); // keep focus in the field while choosing
    list.addEventListener('click', function (e) { pick(e.target.closest('li')); });
    input.addEventListener('blur', function () { setTimeout(close, 120); });
  })();

  /* ---------- is online payment open right now? The server knows (Razorpay keys set, phase one open).
     If not, the form goes straight to the WhatsApp order instead of a Pay button that cannot work. ---------- */
  if (C.online && window.fetch) {
    fetch('/api/r27/status', { headers: { Accept: 'application/json' } }).then(function (r) { return r.ok ? r.json() : null; }).then(function (st) {
      if (!st || typeof st.online !== 'boolean') return;
      C.online = st.online;
      C.usdOnline = Boolean(C.usdOnline && st.usd);
      refresh();
    }).catch(function () {});
  }
  function dobValid() {
    var dd = +day.value, mm = +mon.value, yy = +yr.value;
    if (!dd || !mm || !yy) return false;
    var t = new Date(yy, mm - 1, dd);
    return t.getFullYear() === yy && t.getMonth() === mm - 1 && t.getDate() === dd && t <= new Date();
  }
  function collect() {
    var r = C.reports[report];
    return {
      report: report, reportName: r.name, name: $('#name').value.trim(),
      dob: dobValid() ? day.value + ' ' + MONTHS[mon.value - 1] + ' ' + yr.value : '',
      dobIso: dobValid() ? yr.value + '-' + ('0' + mon.value).slice(-2) + '-' + ('0' + day.value).slice(-2) : '',
      tob: r.needs_time && th.value && tm.value && $('#tob-ampm').value ? th.value + ':' + ('0' + tm.value).slice(-2) + ' ' + $('#tob-ampm').value : '',
      pob: $('#pob').value.trim(), email: $('#email').value.trim(),
      code: (cc.value.split('|')[1] || '+91'), mobile: $('#mobile').value.replace(/[\s()-]/g, ''),
      referral: $('#referral').value.trim()
    };
  }
  function validate(o) {
    var bad = [];
    var mark = function (el, ok) { var w = el.closest('.field,.consent'); if (w) w.classList.toggle('invalid', !ok); el.setAttribute('aria-invalid', String(!ok)); if (!ok) bad.push(el); };
    mark($('#name'), o.name.length > 1);
    mark(day, dobValid());
    if (C.reports[report].needs_time) mark(th, !!o.tob);
    mark($('#pob'), o.pob.length > 1);
    mark($('#email'), !o.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(o.email)); // optional, but checked when given
    mark($('#mobile'), /^\d{6,15}$/.test(o.mobile));
    $$('.consent input', form).forEach(function (c) { mark(c, c.checked); });
    $('#form-error').hidden = !bad.length;
    if (bad.length) bad[0].focus();
    return !bad.length;
  }
  function waText(o, p) {
    var lines = ['Hi Veshannastro, I would like to order the 2027 Personal Year Report.', '',
      'Report: ' + o.reportName + ' (' + p.now + ')', 'Name: ' + o.name, 'Date of birth: ' + o.dob];
    if (o.tob) lines.push('Time of birth: ' + o.tob);
    lines.push('Place of birth: ' + o.pob);
    if (o.email) lines.push('Email: ' + o.email);
    lines.push('WhatsApp: ' + o.code + ' ' + o.mobile);
    if (o.referral) lines.push('Referral code: ' + o.referral);
    return lines.join('\n');
  }

  /* ---------- review dialog: pay on the page (Razorpay), or send the order on WhatsApp ---------- */
  var dlg = $('#review-dialog'), payBtn = $('#review-pay'), goWa = $('#review-go'), payErr = $('#pay-error');
  $$('[data-close]', dlg).forEach(function (b) { b.addEventListener('click', function () { dlg.close(); }); });
  dlg.addEventListener('close', function () { document.body.classList.remove('dialog-open'); if (paid) showDone(paid); });
  dlg.addEventListener('cancel', function (e) { if (busy) e.preventDefault(); }); // no closing while the payment starts
  var busy = false, paid = null, cached = null, current = null;

  function openDialog() { if (!dlg.open) { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); } document.body.classList.add('dialog-open'); }
  function rowsHtml(rows, head) {
    return '<section class="review-card"><header><span>' + head + '</span></header><dl>' +
      rows.map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd></div>'; }).join('') + '</dl></section>';
  }
  function setError(msg) { payErr.textContent = msg || ''; payErr.hidden = !msg; }
  // WhatsApp hand-off: the order typed out, ready to send.
  function useWhatsApp(primary) {
    goWa.hidden = false;
    if (primary) payBtn.hidden = true;
    goWa.classList.toggle('wa-secondary', !primary);
  }
  function review(o, p) {
    current = { o: o, p: p };
    var rows = [['Report', o.reportName + ', ' + p.now], ['Name', o.name], ['Date of birth', o.dob]];
    if (o.tob) rows.push(['Time of birth', o.tob]);
    rows.push(['Place of birth', o.pob]);
    if (o.email) rows.push(['Email', o.email]);
    rows.push(['WhatsApp', o.code + ' ' + o.mobile]);
    if (o.referral) rows.push(['Referral code', o.referral]);
    $('#review-title').textContent = 'Check your details';
    $('#review-sub').textContent = 'Edit anything before you continue.';
    $('#review-content').innerHTML = rowsHtml(rows, 'Your order');
    setError('');
    $('#review-edit').hidden = false; $('#review-done').hidden = true;
    goWa.href = 'https://wa.me/' + C.wa + '?text=' + encodeURIComponent(waText(o, p));
    goWa.onclick = function () { sendLead(o, 'whatsapp'); track('generate_lead', { currency: p.cur, value: p.amount, item_name: o.reportName }); };
    sendLead(o, 'form');
    if (C.online && (p.cur === 'INR' || C.usdOnline)) {
      payBtn.hidden = false; payBtn.disabled = false; $('#review-pay-label').textContent = 'Pay ' + p.now;
      goWa.hidden = true;
      $('#review-note').innerHTML = 'Pay by UPI, card or netbanking in Razorpay’s secure window. Your report arrives within ' + esc(C.delivery) +
        ' of payment. Prefer to talk first? <a href="' + esc(goWa.href) + '" target="_blank" rel="noopener" class="wa-inline">Order on WhatsApp</a>.';
      var inl = $('.wa-inline', dlg); if (inl) inl.addEventListener('click', goWa.onclick);
    } else {
      payBtn.hidden = true; goWa.hidden = false;
      $('#review-note').textContent = (C.online ? 'Payment from outside India is taken on WhatsApp for now. ' : '') + 'This opens WhatsApp with your order typed out. Send it and we reply with your payment link. Your report arrives within ' + C.delivery + ' of payment.';
    }
    openDialog();
  }
  // The server says this order should go through WhatsApp (not open yet, dollars, phase closed, Razorpay down).
  function switchToWhatsApp(message) {
    payBtn.hidden = true; goWa.hidden = false;
    $('#review-note').textContent = message;
  }

  // The form goes to Kamala (through our server) once they continue to review it, having ticked the terms and
  // privacy box, so she knows them by their WhatsApp number when they message. Sent once per change of details.
  var leadSent = {};
  function sendLead(o, stage) {
    if (!window.fetch) return;
    flushLog();
    var data = payload(o); data.stage = stage;
    var key = stage + '|' + JSON.stringify(payload(o));
    if (leadSent[key]) return;
    leadSent[key] = true;
    try {
      fetch('/api/r27/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), keepalive: true }).catch(function () {});
    } catch (e) {}
  }

  function payload(o) {
    return { report: o.report, name: o.name, dob: o.dobIso, tob: o.tob, pob: o.pob, email: o.email, code: o.code, mobile: o.mobile,
      referral: o.referral, terms: $('input[name="terms"]', form).checked, updates: $('input[name="wa_ok"]', form).checked, visitor: VISITOR };
  }
  var FIELD = { name: '#name', dob: '#dob-day', tob: '#tob-hour', pob: '#pob', email: '#email', mobile: '#mobile', referral: '#referral', terms: 'input[name="terms"]' };
  function markServerErrors(errors) {
    dlg.close();
    var first = null;
    Object.keys(errors).forEach(function (k) {
      var el = $(FIELD[k] || '#name'); var w = el && el.closest('.field,.consent');
      if (w) { w.classList.add('invalid'); var fe = $('.field-error', w); if (fe) fe.textContent = errors[k]; }
      if (!first && el) first = el;
    });
    $('#form-error').hidden = false;
    if (first) first.focus();
  }
  var rzpLoad = null;
  function loadCheckout() {
    if (window.Razorpay) return Promise.resolve();
    if (rzpLoad) return rzpLoad;
    rzpLoad = new Promise(function (ok, fail) {
      var sc = document.createElement('script'); sc.src = 'https://checkout.razorpay.com/v1/checkout.js'; sc.async = true;
      var t = setTimeout(function () { fail(new Error('timeout')); }, 15000);
      sc.onload = function () { clearTimeout(t); window.Razorpay ? ok() : fail(new Error('missing')); };
      sc.onerror = function () { clearTimeout(t); fail(new Error('blocked')); };
      document.head.appendChild(sc);
    });
    rzpLoad.catch(function () { rzpLoad = null; });
    return rzpLoad;
  }
  function post(url, data) {
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { j._status = r.status; return j; }); });
  }
  function setBusy(on, label) {
    busy = on; payBtn.disabled = on;
    $('#review-pay-label').textContent = on ? (label || 'Opening secure payment') : 'Pay ' + current.p.now;
  }

  payBtn.addEventListener('click', function () {
    if (busy || !current) return;
    var o = current.o, p = current.p, data = payload(o), key = JSON.stringify(data);
    setError(''); setBusy(true);
    track('add_payment_info', { currency: p.cur, value: p.amount, items: [{ item_name: o.reportName, price: p.amount }] });
    // The same details reuse the same Razorpay order (a retry never makes a second one).
    var orderReady = cached && cached.key === key && Date.now() - cached.at < 25 * 60 * 1000
      ? Promise.resolve(cached.res)
      : post('/api/r27/order', data).then(function (res) { if (res.ok) cached = { key: key, at: Date.now(), res: res }; return res; });
    Promise.all([orderReady, loadCheckout().catch(function (e) { return e; })]).then(function (both) {
      var res = both[0], loadErr = both[1];
      if (!res.ok) {
        setBusy(false);
        if (res.errors) return markServerErrors(res.errors);
        return switchToWhatsApp(res.message || 'Online payment could not start just now. Send your order on WhatsApp instead.');
      }
      if (loadErr instanceof Error || !window.Razorpay) {
        setBusy(false);
        setError('The payment window could not load. An ad blocker or a weak connection can stop it. Try again, or order on WhatsApp.');
        return useWhatsApp(false);
      }
      var opts = Object.assign({}, res.checkout, {
        handler: function (r) { confirm(r, o, p, res); },
        modal: { ondismiss: function () { if (!paid) { setBusy(false); openDialog(); } }, confirm_close: true }
      });
      var rzp = new window.Razorpay(opts);
      rzp.on('payment.failed', function (r) {
        var why = r && r.error && r.error.description ? r.error.description : 'The payment did not go through.';
        setError(why + ' You can try again. If any amount was deducted for this attempt, your bank returns it automatically.');
        track('payment_failed', { reason: (r && r.error && r.error.reason) || '' });
      });
      // Razorpay's window must sit on top and take taps; this dialog comes back when it closes.
      dlg.close();
      rzp.open();
    }).catch(function () {
      setBusy(false);
      switchToWhatsApp('We could not reach the payment server. Check your connection and try again, or send your order on WhatsApp.');
      payBtn.hidden = false;
    });
  });

  function confirm(r, o, p, orderRes) {
    setBusy(true, 'Confirming your payment');
    var finish = function (result) {
      paid = { o: o, p: p, result: result, receipt: orderRes.receipt, paymentId: r.razorpay_payment_id };
      clearDraft();
      cached = null; busy = false;
      if (result && result.ok) {
        track('purchase', { transaction_id: r.razorpay_payment_id, currency: result.currency, value: result.amount, items: [{ item_name: o.reportName, price: result.amount }] });
        if (C.ads && typeof window.gtag === 'function') window.gtag('event', 'conversion', { send_to: C.ads, value: result.amount, currency: result.currency, transaction_id: r.razorpay_payment_id });
      }
      showThanks(paid);
    };
    post('/api/r27/verify', r).then(finish).catch(function () { finish({ ok: false, pending: true }); });
  }

  function thanksHtml(d) {
    var o = d.o, ok = d.result && d.result.ok;
    var rows = [['Report', o.reportName], ['Paid', ok ? d.result.price : d.p.now], ['WhatsApp', o.code + ' ' + o.mobile]];
    if (o.email) rows.push(['Email', o.email]);
    rows.push(['Order reference', d.receipt]);
    return rowsHtml(rows, ok ? 'Payment received' : 'Payment being confirmed');
  }
  function showThanks(d) {
    var ok = d.result && d.result.ok;
    $('#review-title').textContent = ok ? 'Thank you, ' + d.o.name.split(' ')[0] : 'We are confirming your payment';
    $('#review-sub').textContent = ok ? 'Your 2027 report is now being prepared for you.' : 'Razorpay has your payment. This can take a minute to confirm.';
    $('#review-content').innerHTML = thanksHtml(d);
    $('#review-note').innerHTML = ok
      ? 'A confirmation with your invoice is on its way to your WhatsApp now. Your report reaches you on WhatsApp within ' + esc(C.delivery) + '.'
      : 'You will get a confirmation on WhatsApp once it clears. If nothing arrives in 15 minutes, <a href="https://wa.me/' + C.wa + '?text=' +
        encodeURIComponent('Hi Veshannastro, I paid for the 2027 report. Payment ID: ' + d.paymentId) + '" target="_blank" rel="noopener">message us with your payment ID</a> (' + esc(d.paymentId) + ').';
    setError('');
    payBtn.hidden = true; goWa.hidden = true; $('#review-edit').hidden = true; $('#review-done').hidden = false;
    openDialog();
  }
  // After paying, the form makes way for a short note so nobody pays twice by accident.
  function showDone(d) {
    var card = $('.form-card'); if (!card || $('.order-done', card)) return;
    var ok = d.result && d.result.ok;
    var box = document.createElement('div'); box.className = 'order-done';
    box.innerHTML = '<p class="report-mark">' + (ok ? 'Payment received' : 'Payment being confirmed') + '</p><h2>Thank you, ' + esc(d.o.name.split(' ')[0]) + '.</h2>' +
      '<p>Your ' + esc(d.o.reportName) + ' reaches you on WhatsApp within ' + esc(C.delivery) + '. Order reference ' + esc(d.receipt) + '.</p>' +
      '<button type="button" class="outline-button" id="order-another">Order a report for someone else</button>';
    form.hidden = true; card.appendChild(box);
    card.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
    $('#order-another').addEventListener('click', function () { box.remove(); form.hidden = false; form.reset(); clearDraft(); delete $('#pob').dataset.picked; cc.value = 'India|+91'; paid = null; refresh(); $('#name').focus(); });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var o = collect(), p = price();
    if (!validate(o)) return;
    track('begin_checkout', { currency: p.cur, value: p.amount, items: [{ item_name: o.reportName, price: p.amount }] });
    review(o, p);
  });

  /* ---------- covers arrive from every side when "What's inside" comes into view ---------- */
  (function () {
    var fan = $('.covers-fan');
    if (!fan || reduced || !fan.animate || !('IntersectionObserver' in window)) return;
    var figs = $$('figure', fan), note = $('.covers-note');
    var EASE = 'cubic-bezier(.16,1,.3,1)';
    var FROM = { left: ['-62vw', '0px', -18], right: ['62vw', '0px', 18], top: ['0px', '-55vh', -10], bottom: ['0px', '48vh', 10] };
    fan.classList.add('covers-pre');
    new IntersectionObserver(function (en, obs) {
      if (!en[0].isIntersecting) return;
      obs.disconnect();
      var grid = getComputedStyle(fan).display === 'grid', n = figs.length, last = 0;
      figs.forEach(function (f, i) {
        var dir, order;
        if (grid) {          // phone: 3 by 2 grid, outer columns from the sides, middle from above and below
          var c = i % 3, r = Math.floor(i / 3);
          dir = c === 0 ? 'left' : c === 2 ? 'right' : (r === 0 ? 'top' : 'bottom');
          order = i;
        } else {             // desktop: the fan, ends from the sides, inner covers from above and below
          dir = i === 0 ? 'left' : i === n - 1 ? 'right' : (i % 2 ? 'top' : 'bottom');
          order = (n - 1) / 2 - Math.abs(i - (n - 1) / 2);
        }
        var d = FROM[dir], delay = 100 + order * 120;
        last = Math.max(last, delay);
        f.animate([
          { translate: d[0] + ' ' + d[1], rotate: d[2] + 'deg', scale: '.84', opacity: 0 },
          { opacity: 1, offset: .4 },
          { translate: '0px 0px', rotate: '0deg', scale: '1', opacity: 1 }
        ], { duration: 1250, delay: delay, easing: EASE, fill: 'backwards' });
      });
      if (note) note.animate([{ opacity: 0, translate: '0 12px' }, { opacity: 1, translate: '0 0' }], { duration: 700, delay: last + 650, easing: EASE, fill: 'backwards' });
      fan.classList.remove('covers-pre');
    }, { threshold: .3 }).observe(fan);
  })();

  /* ---------- Personal Year calculator + cover reveal ---------- */
  var READ = { 1: ['Sun', 'New beginnings, leadership and discipline.'], 2: ['Moon', 'Patience, partnership and emotional balance.'], 3: ['Jupiter', 'Growth, expression and wisdom.'],
    4: ['Rahu', 'Hard work, structure and unexpected turns.'], 5: ['Mercury', 'Movement, change and fast growth.'], 6: ['Venus', 'Family, love, comfort and responsibility.'],
    7: ['Ketu', 'Reflection, spirituality and inner clarity.'], 8: ['Saturn', 'Discipline, karma and reward.'], 9: ['Mars', 'Action, courage and completion.'] };
  var ZOD = ['Capricorn', 'Aquarius', 'Pisces', 'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius'];
  var CUT = [20, 19, 21, 20, 21, 21, 23, 23, 23, 23, 22, 22];
  var red = function (n) { while (n > 9) n = String(n).split('').reduce(function (a, x) { return a + +x; }, 0); return n; };
  var ff = $('.finder-form'), fr = $('.finder-result'), lastKey = '';
  function calc() {
    var dd = +ff.elements.day.value, mm = +ff.elements.month.value, yy = +ff.elements.year.value;
    var t = new Date(yy, mm - 1, dd);
    var ok = dd && mm && yy >= 1900 && yy <= new Date().getFullYear() && t.getFullYear() === yy && t.getMonth() === mm - 1 && t.getDate() === dd;
    fr.classList.toggle('has-result', !!ok);
    if (!ok) { lastKey = ''; fr.innerHTML = '<p class="finder-empty">Enter your birth day, month and year to see the number that sets the tone for your 2027.</p>'; return; }
    var key = dd + '-' + mm + '-' + yy; if (key === lastKey) return; lastKey = key;
    var py = red(red(dd) + red(mm) + 2), mul = red(dd);
    var sign = ZOD[(mm - 1 + (dd >= CUT[mm - 1] ? 1 : 0)) % 12];
    fr.innerHTML = '<div class="reveal"><div class="flip-card" id="flip-card"><div class="flip-inner"><div class="flip-face flip-front"><div><i></i><span>VESHANNASTRO</span></div></div>' +
      '<div class="flip-face flip-back"><img src="/assets/r27/covers/mulank-' + mul + '.webp" alt="Your 2027 report cover for Mulank ' + mul + '" width="360" height="640"></div></div></div>' +
      '<div><div class="finder-number" style="margin-bottom:10px"><span>Personal Year</span><b>' + py + '</b></div>' +
      '<div class="finder-copy"><p class="finder-planet">Ruled by <b>' + READ[py][0] + '</b> · Sun sign <b>' + sign + '</b> · Mulank <b>' + mul + '</b></p><p>' + READ[py][1] + '</p>' +
      '<p class="finder-hint">Your report reads all twelve months of 2027 through Personal Year ' + py + ', on the cover made for Mulank ' + mul + '.</p>' +
      '<a class="pill use-date" href="#register">Use this date for my report</a> <a class="finder-link" href="/blog/personal-year-' + py + '-in-2027.html">Read Personal Year ' + py + ' in 2027</a></div></div></div>';
    var card = $('#flip-card');
    setTimeout(function () { card.classList.add('is-flipped'); }, reduced ? 0 : 450);
    $('.use-date', fr).addEventListener('click', function () { day.value = dd; mon.value = mm; yr.value = yy; track('use_calculator_date', { personal_year: py }); });
    track('personal_year_calculated', { personal_year: py, mulank: mul });
  }
  ff.addEventListener('input', calc); ff.addEventListener('change', calc); ff.addEventListener('submit', function (e) { e.preventDefault(); });

  /* ---------- menu, header, smooth scroll ---------- */
  var burger = $('.burger'), menu = $('#mobile-menu');
  function closeMenu() { burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Open menu'); menu.classList.remove('open'); menu.inert = true; document.body.classList.remove('menu-open'); }
  burger.addEventListener('click', function () {
    if (burger.getAttribute('aria-expanded') === 'true') return closeMenu();
    burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', 'Close menu'); menu.inert = false; menu.classList.add('open'); document.body.classList.add('menu-open');
  });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', closeMenu); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href="#register"]');
    if (a) { e.preventDefault(); closeMenu(); $('.form-card').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }); setTimeout(function () { $('#name').focus({ preventScroll: true }); }, reduced ? 0 : 700); }
    var w = e.target.closest && e.target.closest('a[href*="wa.me/"]');
    if (w) track('whatsapp_click', { link_text: (w.textContent || '').trim().slice(0, 60) });
  });
  var bar = $('.topbar'), root = document.documentElement, prog = $('.progress');
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  /* The page height is read only after the browser has laid the page out (ResizeObserver), never during start-up:
     reading it early forced a full layout of the page while it was still loading. */
  var max = 0;
  function measure() { max = root.scrollHeight - (innerHeight || 800); }
  function onScroll() {
    bar.classList.toggle('solid', scrollY > 28);
    if (prog) prog.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, scrollY / max) : 0) + ')';
  }
  var remeasure = function () { measure(); onScroll(); };
  if ('ResizeObserver' in window) new ResizeObserver(remeasure).observe(document.body); else addEventListener('load', remeasure);
  addEventListener('resize', remeasure);
  addEventListener('scroll', onScroll, { passive: true }); requestAnimationFrame(onScroll);

  /* sticky mobile bar: shows once the form is out of view */
  var sticky = $('#sticky-pay');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { var v = en[0].isIntersecting; document.body.classList.toggle('form-in-view', v); sticky.classList.toggle('show', !v && scrollY > 200); }, { threshold: 0 }).observe($('.form-card'));
  }

  /* ---------- Explore tabs: every page one click away. Without script all panels simply show. ---------- */
  [].forEach.call(document.querySelectorAll('[data-tabs]'), function (box) {
    var tabs = [].slice.call(box.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
    function show(i) {
      tabs.forEach(function (t, j) { t.setAttribute('aria-selected', i === j ? 'true' : 'false'); t.tabIndex = i === j ? 0 : -1; if (panels[j]) panels[j].hidden = i !== j; });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { show(i); track('explore_tab', { tab: t.textContent }); });
      t.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault(); var n = (i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length; show(n); tabs[n].focus();
      });
    });
    show(0);
  });

  /* ---------- star field (from the original site) ---------- */
  var sky = $('#star-field'), ctx = sky.getContext('2d'), stars = [], W = 0, H = 0, last = -1e9;
  function size() {
    /* phones fire resize while the address bar slides; only rebuild when the size really changes */
    if (W && innerWidth === W && Math.abs(innerHeight - H) < 140) return;
    W = innerWidth; H = innerHeight; var r = Math.min(devicePixelRatio || 1, W < 760 ? 1.5 : 2);
    sky.width = W * r; sky.height = H * r; ctx.setTransform(r, 0, 0, r, 0, 0);
    var seed = 2719, rnd = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    stars = Array.from({ length: Math.round(W * H / 4200) }, function () { return { x: rnd() * W, y: rnd() * H, r: .4 + rnd() * 1.05, a: .12 + rnd() * .4, p: rnd() * 6.28 }; });
  }
  function draw(t) {
    /* the twinkle is slow: about 12 frames a second is enough; the shooting star gets about 30 */
    var cyc = (t % 14000) / 14000;
    if (t - last < (cyc < .11 ? 32 : 80)) { if (!reduced && !document.hidden) requestAnimationFrame(draw); return; }
    last = t;
    ctx.clearRect(0, 0, W, H);
    stars.forEach(function (s) { var a = s.a * (.65 + .35 * Math.sin(t * .0007 + s.p)); ctx.fillStyle = 'rgba(177,205,255,' + a + ')'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.2832); ctx.fill(); });
    if (!reduced && cyc < .11) { var x = W * .2 + cyc * W * 5, y2 = H * .25 + cyc * H * 2, g = ctx.createLinearGradient(x - 130, y2 - 65, x, y2); g.addColorStop(0, 'transparent'); g.addColorStop(1, 'rgba(190,210,255,.35)'); ctx.strokeStyle = g; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 130, y2 - 65); ctx.lineTo(x, y2); ctx.stroke(); }
    if (!reduced && !document.hidden) requestAnimationFrame(draw);
  }
  size(); addEventListener('resize', size); requestAnimationFrame(draw);
  document.addEventListener('visibilitychange', function () { if (!document.hidden && !reduced) requestAnimationFrame(draw); });
})();
