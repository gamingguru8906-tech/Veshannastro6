/* The header's account button (every page that has it) and the "Your account" page (/account/, tools/build_account.py).
   Signing in uses a WhatsApp code (api/account/[action].js): the visitor types their number, Kamala sends a 6-digit
   code on WhatsApp, the right code starts a session in an HttpOnly cookie this script cannot read. It keeps only the
   first name in localStorage as a hint, so pages do not ask the server on every visit for people who never signed in.
   Nothing typed is ever looked up by number: details appear only after the owner of the number enters the code. */
(function () {
  'use strict';
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return [].slice.call((el || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var HINT = 'vs_account';
  var hint = function () { try { return localStorage.getItem(HINT) || ''; } catch (e) { return ''; } };
  var setHint = function (v) { try { v ? localStorage.setItem(HINT, v) : localStorage.removeItem(HINT); } catch (e) {} };

  function call(action, data) {
    var opt = { method: data ? 'POST' : 'GET', credentials: 'same-origin', headers: { 'X-Requested-With': 'veshannastro', Accept: 'application/json' } };
    if (data) { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(data); }
    return fetch('/api/account/' + action, opt).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { j._status = r.status; return j; });
    }, function () { return { ok: false, _status: 0, error: 'No connection. Check your internet and try again.' }; });
  }

  /* ---------- the header button: the first letter of a signed-in name ---------- */
  var btn = $('.acct-btn');
  function paintButton(me) {
    if (!btn) return;
    var a = me && me.signedIn && me.account;
    var first = a ? a.first : (me ? '' : hint());
    btn.classList.toggle('signed', Boolean(first) || Boolean(me && me.signedIn));
    $('.acct-initial', btn).textContent = first ? first.charAt(0).toUpperCase() : '';
    btn.setAttribute('aria-label', a ? 'Your account, signed in as ' + a.first : 'Your account');
  }
  paintButton(null);

  /* ---------- the three dots, right of the header: the full-screen menu fades in over the page ---------- */
  (function () {
    var dots = $('.menu-dots'), menu = $('#mobile-menu');
    if (!dots || !menu) return;
    function close() {
      dots.setAttribute('aria-expanded', 'false'); dots.setAttribute('aria-label', 'Open menu');
      menu.classList.remove('open'); menu.inert = true; document.body.classList.remove('menu-open');
    }
    dots.addEventListener('click', function () {
      if (dots.getAttribute('aria-expanded') === 'true') return close();
      dots.setAttribute('aria-expanded', 'true'); dots.setAttribute('aria-label', 'Close menu');
      menu.inert = false; menu.classList.add('open'); document.body.classList.add('menu-open');
    });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('open')) { close(); dots.focus(); } });
    window.__closeSiteMenu = close;
  })();

  var app = $('#acct-app');
  if (!app) {
    // Any other page: someone who signed in before has their session confirmed quietly, after the page has settled.
    var confirm = function () {
      (window.requestIdleCallback || setTimeout)(function () {
        call('me').then(function (r) { if (r.ok) { if (!r.signedIn) setHint(''); else if (r.account) setHint(r.account.first); paintButton(r); } });
      });
    };
    if (btn && hint()) { if (document.readyState === 'complete') confirm(); else addEventListener('load', confirm); }
    return;
  }

  /* ---------- the account page ---------- */
  // While the page scrolls, loops hold still (perf.css). The 2027 page sets this in report.js.
  var scrollEnd = 0;
  addEventListener('scroll', function () {
    root.classList.add('scrolling'); clearTimeout(scrollEnd);
    scrollEnd = setTimeout(function () { root.classList.remove('scrolling'); }, 180);
  }, { passive: true });

  var me = null;          // { signedIn, needsProfile, phone, account } from the server
  var intent = 'signin';  // which button they pressed: 'signin' or 'create'
  var sentTo = null;      // { code, mobile, label } while a code is out
  var timer = null;
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  var TITLES = { loading: 'Your account', start: 'Your account', phone: 'Your account', code: 'Your account', profile: 'Welcome', dashboard: 'Your account', closed: 'Your account' };
  var LEADS = {
    start: 'Your details and orders in one place. We sign you in with a code on WhatsApp, so there is no password to remember.',
    phone: 'One number, one account: use the WhatsApp number you order with.',
    code: 'Open WhatsApp: the code is in your chat with Veshannastro.',
    profile: 'One last step. Fields marked * are needed; the rest can wait.',
    dashboard: 'Everything you have ordered with this number, and the details we use for your readings.',
    closed: 'Your details and orders in one place.'
  };
  function view(name) {
    $$('.acct-view', app).forEach(function (v) { v.classList.toggle('on', v.getAttribute('data-view') === name); });
    $('#acct-title').textContent = TITLES[name] || 'Your account';
    if (LEADS[name]) $('#acct-lead').textContent = LEADS[name];
    $('#acct-lead').hidden = !LEADS[name];
    app.setAttribute('aria-busy', name === 'loading' ? 'true' : 'false');
    if (name !== 'loading' && scrollY > 120) scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    var first = $('.acct-view.on [data-focus]', app);
    if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, reduced ? 0 : 80);
  }
  function err(id, msg) { var el = $(id); if (!el) return; el.textContent = msg || ''; if (el.classList.contains('acct-error')) el.hidden = !msg; }
  function fieldErr(key, msg, scope) {
    var p = scope || 'acct';
    err('#' + p + '-' + key + '-err', msg);
    var f = $('#' + p + '-' + key + '-err'); if (f && f.closest('.field')) f.closest('.field').classList.toggle('invalid', Boolean(msg));
  }
  function busy(form, on, label) {
    var b = $('.acct-submit', form); if (!b) return;
    if (!b.dataset.label) b.dataset.label = b.textContent;
    b.disabled = on; b.textContent = on ? label : b.dataset.label;
  }
  function signedOut(message) {
    me = { ok: true, signedIn: false }; setHint(''); paintButton(me);
    view('start');
    err('#acct-start-err', message || '');
  }

  /* start: what the server says about this browser */
  function boot() {
    view('loading');
    call('me').then(function (r) {
      if (r._status === 503) { paintButton({ signedIn: false }); return view('closed'); }
      if (!r.ok) { paintButton(null); return view('start'); }
      me = r; paintButton(r);
      if (!r.signedIn) { setHint(''); return view('start'); }
      if (r.needsProfile) return showProfile();
      setHint(r.account.first);
      showDashboard(false);
    });
  }

  /* 0. sign in or create: the same code either way; the server knows whether the number has an account */
  $$('.acct-option', app).forEach(function (b) {
    b.addEventListener('click', function () {
      intent = b.getAttribute('data-intent');
      $('#acct-phone-title').textContent = intent === 'create' ? 'Create your account' : 'Sign in with WhatsApp';
      err('#acct-phone-err', ''); err('#acct-start-err', ''); fieldErr('mobile', '');
      loadCountries(); view('phone');
    });
  });
  $$('[data-go]', app).forEach(function (b) {
    b.addEventListener('click', function () { clearInterval(timer); if (b.getAttribute('data-go') === 'phone') sentTo = null; view(b.getAttribute('data-go')); });
  });

  /* country codes: the same list as the order form */
  var cc = $('#acct-cc');
  function loadCountries() {
    if (cc.options.length > 1) return;
    fetch('/assets/countries.json').then(function (r) { return r.json(); }).then(function (list) {
      var cur = cc.value; cc.innerHTML = '';
      list.forEach(function (c) { var o = document.createElement('option'); o.value = c.value; o.textContent = c.label; cc.appendChild(o); });
      cc.value = cur || 'India|+91';
    }).catch(function () {});
  }

  /* 1. the number */
  var phoneForm = $('#acct-phone-form');
  phoneForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var code = cc.value.split('|')[1] || '+91', mobile = $('#acct-mobile').value.replace(/[\s()-]/g, '');
    fieldErr('mobile', ''); err('#acct-phone-err', '');
    if (!/^\+?\d{6,15}$/.test(mobile)) return fieldErr('mobile', 'Please enter your WhatsApp number.');
    busy(phoneForm, true, 'Sending code');
    call('send-code', { code: code, mobile: mobile }).then(function (r) {
      busy(phoneForm, false);
      if (r.ok) {
        sentTo = { code: code, mobile: mobile, label: code + ' ' + mobile };
        $('#acct-sent-to').textContent = sentTo.label;
        resetOtp(); countdown(r.resend_in || 60); view('code');
        return;
      }
      if (r._status === 503) return view('closed');
      if (r.errors && r.errors.mobile) return fieldErr('mobile', r.errors.mobile);
      err('#acct-phone-err', r.error || 'Could not send the code. Please try again.');
    });
  });

  /* 2. the code: one real input, drawn as six cells */
  var otpBox = $('.otp', app), otp = $('#acct-otp'), cells = $$('.otp-cells span', app), codeForm = $('#acct-code-form');
  function paintOtp() {
    var v = otp.value;
    cells.forEach(function (c, i) {
      var was = c.textContent;
      c.textContent = v.charAt(i) || '';
      c.classList.toggle('cur', document.activeElement === otp && i === Math.min(v.length, 5));
      if (!was && c.textContent && !reduced) { c.classList.remove('full'); void c.offsetWidth; c.classList.add('full'); }
    });
  }
  function resetOtp() { otp.value = ''; otpBox.classList.remove('bad'); err('#acct-otp-err', ''); paintOtp(); }
  otp.addEventListener('input', function () {
    otp.value = otp.value.replace(/\D/g, '').slice(0, 6);
    otpBox.classList.remove('bad'); err('#acct-otp-err', '');
    paintOtp();
    if (otp.value.length === 6) codeForm.requestSubmit ? codeForm.requestSubmit() : codeForm.dispatchEvent(new Event('submit', { cancelable: true }));
  });
  otp.addEventListener('focus', paintOtp); otp.addEventListener('blur', paintOtp);
  codeForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!sentTo || otp.value.length !== 6) return err('#acct-otp-err', 'Enter the 6-digit code from WhatsApp.');
    busy(codeForm, true, 'Checking');
    call('verify', { code: sentTo.code, mobile: sentTo.mobile, otp: otp.value }).then(function (r) {
      busy(codeForm, false);
      if (r.ok) {
        clearInterval(timer);
        me = { ok: true, signedIn: true, needsProfile: !r.exists, phone: r.phone, account: r.account };
        paintButton(me);
        if (!r.exists) return showProfile();
        setHint(r.account.first);
        return showDashboard(false, intent === 'create');
      }
      otpBox.classList.add('bad');
      err('#acct-otp-err', r.error || 'That code did not work. Please try again.');
      otp.value = ''; paintOtp(); otp.focus();
      if (r.expired) { var rb = $('#acct-resend'); rb.disabled = false; rb.textContent = 'Send a new code'; clearInterval(timer); }
    });
  });
  function countdown(sec) {
    var b = $('#acct-resend'), left = sec;
    clearInterval(timer);
    function paint() { b.textContent = left > 0 ? 'Resend in ' + left + 's' : 'Resend code'; b.disabled = left > 0; }
    paint();
    timer = setInterval(function () { left--; paint(); if (left <= 0) clearInterval(timer); }, 1000);
  }
  $('#acct-resend').addEventListener('click', function () {
    if (!sentTo) return view('phone');
    var b = this; b.disabled = true; b.textContent = 'Sending';
    call('send-code', { code: sentTo.code, mobile: sentTo.mobile }).then(function (r) {
      if (r.ok) { resetOtp(); countdown(r.resend_in || 60); otp.focus(); return; }
      err('#acct-otp-err', r.error || 'Could not send a new code. Please try again.');
      countdown(r.retry_after || 30);
    });
  });

  /* birth time: hour, minute and AM/PM become "HH:MM" (24 hour), or "" when all three are empty */
  function readTob(p) {
    var h = $('#' + p + '-tob-h').value, m = $('#' + p + '-tob-m').value, ap = $('#' + p + '-tob-p').value;
    if (!h && !m && !ap) return '';
    if (!h || !m || !ap) return null;
    var hh = (+h % 12) + (ap === 'PM' ? 12 : 0);
    return (hh < 10 ? '0' : '') + hh + ':' + m;
  }
  function fillTob(p, tob) {
    var x = /^(\d{2}):(\d{2})$/.exec(tob || ''), h = x ? +x[1] : 0;
    $('#' + p + '-tob-h').value = x ? String(h % 12 || 12) : '';
    $('#' + p + '-tob-m').value = x ? x[2] : '';
    $('#' + p + '-tob-p').value = x ? (h >= 12 ? 'PM' : 'AM') : '';
  }
  function extras(p) {
    var tob = readTob(p);
    fieldErr('tob', tob === null ? 'Choose the hour, minute and AM or PM, or leave all three empty.' : '', p);
    return tob === null ? null : { tob: tob, pob: $('#' + p + '-pob').value.trim(), gender: $('#' + p + '-gender').value };
  }

  /* 3. a new number fills in its details (only after the code proved it is theirs) */
  function showProfile() {
    $('#acct-phone-shown').value = phoneText(me.phone) || '';
    $('#acct-profile-note').textContent = intent === 'signin'
      ? 'There is no account on ' + phoneText(me.phone) + ' yet. Add your details below and it is ready.'
      : 'Your number is verified. Add your details to finish.';
    view('profile');
  }
  var profileForm = $('#acct-profile-form');
  profileForm.addEventListener('submit', function (e) {
    e.preventDefault();
    ['name', 'email', 'dob', 'tob', 'pob', 'gender'].forEach(function (k) { fieldErr(k, ''); });
    err('#acct-profile-err', '');
    var name = $('#acct-name').value.trim(), email = $('#acct-email').value.trim();
    var d = $('#acct-dob-d').value, m = $('#acct-dob-m').value, y = $('#acct-dob-y').value;
    var bad = false;
    if (name.length < 2) { fieldErr('name', 'Please enter your full name.'); bad = true; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { fieldErr('email', 'Please enter a valid email.'); bad = true; }
    var dob = '';
    if (!d || !m || !y) { fieldErr('dob', 'Choose your day, month and year of birth.'); bad = true; }
    else {
      var dt = new Date(Date.UTC(+y, +m - 1, +d));
      if (dt.getUTCDate() !== +d || dt > new Date()) { fieldErr('dob', 'That date does not exist. Please check it.'); bad = true; }
      else dob = y + '-' + (+m < 10 ? '0' : '') + m + '-' + (+d < 10 ? '0' : '') + d;
    }
    var more = extras('acct');
    if (!more) bad = true;
    if (bad) { var f = $('.field.invalid select, .field.invalid input', profileForm); if (f) f.focus(); return; }
    busy(profileForm, true, 'Creating account');
    call('profile', { name: name, email: email, dob: dob, tob: more.tob, pob: more.pob, gender: more.gender }).then(function (r) {
      busy(profileForm, false);
      if (r.ok) { me.account = r.account; me.needsProfile = false; setHint(r.account.first); paintButton(me); return showDashboard(r.created); }
      if (r._status === 401) return signedOut('Your sign-in expired. Please sign in again.');
      if (r.errors) { Object.keys(r.errors).forEach(function (k) { fieldErr(k, r.errors[k]); }); return; }
      err('#acct-profile-err', r.error || 'Could not save your details. Please try again.');
    });
  });

  /* 4. signed in: details and orders */
  function dobText(iso) { var x = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return x ? +x[3] + ' ' + MONTHS[x[2] - 1] + ' ' + x[1] : ''; }
  function tobText(t) { var x = /^(\d{2}):(\d{2})$/.exec(t || ''); if (!x) return ''; var h = +x[1]; return (h % 12 || 12) + ':' + x[2] + ' ' + (h >= 12 ? 'PM' : 'AM'); }
  var GENDER = { male: 'Male', female: 'Female', other: 'Other' };
  function phoneText(ph) { var x = /^\+91(\d{5})(\d{5})$/.exec(ph || ''); return x ? '+91 ' + x[1] + ' ' + x[2] : ph; }
  function paintDetails() {
    var a = me.account, dl = $('#acct-details'); dl.innerHTML = '';
    [['Name', a.name], ['WhatsApp', phoneText(me.phone)], ['Email', a.email], ['Date of birth', dobText(a.dob)], ['Birth time', tobText(a.tob)],
     ['Birth place', a.pob], ['Gender', GENDER[a.gender] || '']].forEach(function (r) {
      var row = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = r[0]; dd.textContent = r[1] || 'Not added'; if (!r[1]) dd.className = 'none';
      row.appendChild(dt); row.appendChild(dd); dl.appendChild(row);
    });
    $('#acct-edit').textContent = a.tob || a.pob ? 'Edit birth details' : 'Add birth details';
  }
  function showDashboard(created, alreadyHad) {
    var a = me.account;
    $('#acct-hello').textContent = created ? 'Welcome, ' + a.first + '.' : 'Welcome back, ' + a.first + '.';
    $('#acct-sub').textContent = alreadyHad ? 'This number already had an account, so you are signed in.' : 'Signed in as ' + phoneText(me.phone);
    $('.acct-avatar', app).textContent = a.first.charAt(0).toUpperCase();
    paintDetails(); closeEdit();
    view('dashboard');
    loadOrders();
  }

  var editBtn = $('#acct-edit'), editForm = $('#acct-details-form');
  function closeEdit() { editForm.hidden = true; editBtn.setAttribute('aria-expanded', 'false'); err('#acct-edit-err', ''); }
  editBtn.addEventListener('click', function () {
    if (!editForm.hidden) return closeEdit();
    var a = me.account;
    fillTob('edit', a.tob); $('#edit-pob').value = a.pob || ''; $('#edit-gender').value = a.gender || '';
    ['tob', 'pob', 'gender'].forEach(function (k) { fieldErr(k, '', 'edit'); });
    editForm.hidden = false; editBtn.setAttribute('aria-expanded', 'true');
    $('#edit-tob-h').focus({ preventScroll: true });
  });
  $('#acct-edit-cancel').addEventListener('click', closeEdit);
  editForm.addEventListener('submit', function (e) {
    e.preventDefault();
    err('#acct-edit-err', '');
    var more = extras('edit'); if (!more) return;
    busy(editForm, true, 'Saving');
    call('details', more).then(function (r) {
      busy(editForm, false);
      if (r.ok) { me.account = r.account; paintDetails(); return closeEdit(); }
      if (r._status === 401) return signedOut('Your sign-in expired. Please sign in again.');
      if (r.errors) { Object.keys(r.errors).forEach(function (k) { fieldErr(k, r.errors[k], 'edit'); }); return; }
      err('#acct-edit-err', r.error || 'Could not save. Please try again.');
    });
  });

  /* orders */
  var DAY = 864e5;
  var fmtDate = function (iso, withTime) {
    try {
      return new Date(iso).toLocaleString('en-IN', withTime
        ? { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }
        : { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
    } catch (e) { return String(iso).slice(0, 10); }
  };
  function money(n, cur) {
    if (n == null) return '';
    try { return new Intl.NumberFormat(cur === 'USD' ? 'en-US' : 'en-IN', { style: 'currency', currency: cur || 'INR', maximumFractionDigits: n % 1 ? 2 : 0 }).format(n); }
    catch (e) { return (cur === 'USD' ? 'US$' : '₹') + n; }
  }
  function status(o) {
    var now = Date.now();
    if (o.kind === 'consultation') {
      if (!o.appointment_at) return ['past', 'Paid', ''];
      var at = new Date(o.appointment_at).getTime();
      return at > now ? ['soon', 'Upcoming', 'Your session is on ' + fmtDate(o.appointment_at, true) + ', India time, on Google Meet.']
                      : ['past', 'Past session', 'Session held on ' + fmtDate(o.appointment_at, true) + '.'];
    }
    if (o.delivered_at) return ['ok', 'Delivered', 'Sent to you on WhatsApp on ' + fmtDate(o.delivered_at) + '.'];
    if (o.paid_at && now - new Date(o.paid_at).getTime() < 2 * DAY) return ['wip', 'Being prepared', 'Your report reaches you on WhatsApp within 24 hours of payment.'];
    return ['past', 'Paid', 'Sent on WhatsApp. Cannot find it? Message us and we will send it again.'];
  }
  function loadOrders() {
    var list = $('#orders'), empty = $('#orders-empty'), loading = $('#orders-loading'), count = $('#orders-count');
    list.hidden = true; empty.hidden = true; loading.hidden = false; count.textContent = ''; err('#orders-err', '');
    call('orders').then(function (r) {
      loading.hidden = true;
      if (r._status === 401) return signedOut('Your sign-in expired. Please sign in again.');
      if (!r.ok) return err('#orders-err', r.error || 'Could not load your orders. Please refresh the page.');
      var orders = r.orders || [];
      if (!orders.length) {
        $('p', empty).innerHTML = r.pending
          ? '<b>Your order history is being connected.</b> Until then, message us on WhatsApp for the status of any order.'
          : '<b>No orders yet.</b> When you order a report or a consultation with this number, it shows up here.';
        empty.hidden = false; return;
      }
      count.textContent = orders.length === 1 ? '1 order' : orders.length + ' orders';
      list.innerHTML = '';
      orders.forEach(function (o) {
        var s = status(o), li = document.createElement('li'); li.className = 'order';
        var top = document.createElement('div'); top.className = 'order-top';
        var t = document.createElement('b'); t.textContent = o.title;
        var badge = document.createElement('span'); badge.className = 'badge ' + s[0]; badge.textContent = s[1];
        top.appendChild(t); top.appendChild(badge); li.appendChild(top);
        var meta = document.createElement('p'); meta.className = 'order-meta';
        [o.paid_at ? 'Paid ' + fmtDate(o.paid_at) : '', money(o.amount, o.currency), o.invoice ? 'Invoice ' + o.invoice : 'Ref ' + o.ref].forEach(function (x) {
          if (!x) return; var sp = document.createElement('span'); sp.textContent = x; meta.appendChild(sp);
        });
        li.appendChild(meta);
        if (s[2]) { var n = document.createElement('p'); n.className = 'order-note'; n.textContent = s[2]; li.appendChild(n); }
        list.appendChild(li);
      });
      list.hidden = false;
    });
  }

  $('#acct-logout').addEventListener('click', function () {
    var b = this; b.disabled = true;
    call('logout', {}).then(function () { b.disabled = false; signedOut(''); });
  });

  boot();
})();
