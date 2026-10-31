/* The header's sliding light, and signing in with a WhatsApp code (api/account/[action].js).
   The session lives in an HttpOnly cookie this script cannot read; it only keeps the first name in localStorage as a
   hint, so visitors who never signed in do not cost a server call on every page. Nothing typed into the order form
   is ever looked up by number: details appear only after the owner of the number enters the code. */
(function () {
  'use strict';
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return [].slice.call((el || document).querySelectorAll(s)); };
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- a soft light slides to whichever header link the pointer or keyboard is on ---------- */
  (function () {
    var nav = $('.topbar .nav-links'); if (!nav) return;
    var glow = document.createElement('span'); glow.className = 'nav-glow'; glow.setAttribute('aria-hidden', 'true');
    nav.insertBefore(glow, nav.firstChild);
    var shown = false;
    function to(a) {
      var nr = nav.getBoundingClientRect(), r = a.getBoundingClientRect();
      if (!shown) { nav.classList.add('snap'); }           // first time: appear in place, then slide from there on
      nav.style.setProperty('--gx', (r.left - nr.left) + 'px');
      nav.style.setProperty('--gw', r.width + 'px');
      nav.classList.add('glowing');
      if (!shown) { shown = true; requestAnimationFrame(function () { requestAnimationFrame(function () { nav.classList.remove('snap'); }); }); }
    }
    function off() { nav.classList.remove('glowing'); shown = false; }
    $$('a', nav).forEach(function (a) {
      a.addEventListener('pointerenter', function () { to(a); });
      a.addEventListener('focus', function () { to(a); });
      a.addEventListener('blur', function () { if (!nav.contains(document.activeElement)) off(); });
    });
    nav.addEventListener('pointerleave', function () { if (!nav.contains(document.activeElement)) off(); });
  })();

  /* ---------- account ---------- */
  var btn = $('.acct-btn'), dlg = $('#account-dialog');
  if (!btn || !dlg) return;
  var HINT = 'vs_account';
  var hint = function () { try { return localStorage.getItem(HINT) || ''; } catch (e) { return ''; } };
  var setHint = function (v) { try { v ? localStorage.setItem(HINT, v) : localStorage.removeItem(HINT); } catch (e) {} };
  var me = null;             // { signedIn, needsProfile, phone, account } from the server
  var sentTo = null;         // { code, mobile, label } while a code is out
  var timer = null;

  function call(action, data) {
    var opt = { method: data ? 'POST' : 'GET', credentials: 'same-origin', headers: { 'X-Requested-With': 'veshannastro', Accept: 'application/json' } };
    if (data) { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(data); }
    return fetch('/api/account/' + action, opt).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { j._status = r.status; return j; });
    }, function () { return { ok: false, _status: 0, error: 'No connection. Check your internet and try again.' }; });
  }

  function paintButton() {
    var a = me && me.signedIn && me.account;
    var first = a ? a.first : (me && me.signedIn ? '' : hint());
    btn.classList.toggle('signed', Boolean(me && me.signedIn) || (!me && Boolean(first)));
    $('.acct-initial', btn).textContent = first ? first.charAt(0).toUpperCase() : '';
    btn.setAttribute('aria-label', a ? 'Your account, signed in as ' + a.first : 'Sign in to your account');
  }

  function step(name) {
    $$('.acct-step', dlg).forEach(function (s) { s.classList.toggle('on', s.getAttribute('data-step') === name); });
    var titles = { loading: 'Your account', phone: 'Sign in with WhatsApp', code: 'Enter your code', profile: 'Create your account', done: 'Your account' };
    $('#acct-title').textContent = titles[name] || 'Your account';
    var first = $('.acct-step.on [data-focus]', dlg);
    if (first && name !== 'loading') setTimeout(function () { first.focus({ preventScroll: true }); }, reduced ? 0 : 60);
  }
  function err(id, msg) { var el = $(id); if (el) { el.textContent = msg || ''; el.hidden = !msg; } }
  function busy(form, on, label) {
    var b = $('.acct-submit', form); if (!b) return;
    b.disabled = on;
    if (!b.dataset.label) b.dataset.label = b.textContent;
    b.textContent = on ? label : b.dataset.label;
  }

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

  function showDone(created) {
    var a = me.account;
    $('#acct-hello').textContent = created ? 'Welcome, ' + a.first + '.' : 'Welcome back, ' + a.first + '.';
    $('#acct-sub').textContent = created ? 'Your account is ready.' : 'You are signed in on this device.';
    $('.acct-avatar', dlg).textContent = a.first.charAt(0).toUpperCase();
    var dl = $('#acct-details'); dl.innerHTML = '';
    [['WhatsApp', me.phone], ['Name', a.name], ['Email', a.email], ['Date of birth', dobText(a.dob)]].forEach(function (r) {
      var d = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = r[0]; dd.textContent = r[1]; d.appendChild(dt); d.appendChild(dd); dl.appendChild(d);
    });
    step('done');
  }
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function dobText(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? +m[3] + ' ' + MONTHS[m[2] - 1] + ' ' + m[1] : iso; }

  function afterSignIn(created) {
    paintButton();
    if (me.needsProfile) { $('#acct-profile-for').textContent = me.phone; return step('profile'); }
    setHint(me.account.first);
    paintButton();
    showDone(created);
  }

  function open() {
    loadCountries();
    if (!dlg.open) { dlg.showModal(); document.body.classList.add('dialog-open'); }
    if (me && me.signedIn) return afterSignIn(false);
    if (!hint()) return step('phone');
    step('loading');
    refresh().then(function () { me && me.signedIn ? afterSignIn(false) : step('phone'); });
  }
  function close() { if (dlg.open) dlg.close(); }
  dlg.addEventListener('close', function () { document.body.classList.remove('dialog-open'); btn.focus({ preventScroll: true }); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });   // a tap on the dimmed backdrop
  $$('[data-acct-close]', dlg).forEach(function (b) { b.addEventListener('click', close); });
  btn.addEventListener('click', open);

  function refresh() {
    return call('me').then(function (r) {
      if (r.ok) { me = r; if (!r.signedIn) setHint(''); else if (r.account) setHint(r.account.first); }
      paintButton();
    });
  }

  /* 1. the number */
  var phoneForm = $('#acct-phone-form');
  phoneForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var code = (cc.value.split('|')[1] || '+91'), mobile = $('#acct-mobile').value.replace(/[\s()-]/g, '');
    err('#acct-mobile-err', ''); err('#acct-phone-err', '');
    if (!/^\+?\d{6,15}$/.test(mobile)) return err('#acct-mobile-err', 'Please enter your WhatsApp number.');
    busy(phoneForm, true, 'Sending code');
    call('send-code', { code: code, mobile: mobile }).then(function (r) {
      busy(phoneForm, false);
      if (r.ok) {
        sentTo = { code: code, mobile: mobile, label: code + ' ' + mobile };
        $('#acct-sent-to').textContent = sentTo.label;
        resetOtp(); countdown(r.resend_in || 60); step('code');
        return;
      }
      if (r.errors && r.errors.mobile) return err('#acct-mobile-err', r.errors.mobile);
      err('#acct-phone-err', r.error || 'Could not send the code. Please try again.');
    });
  });

  /* 2. the code: one real input, drawn as six cells */
  var otpBox = $('.otp', dlg), otp = $('#acct-otp'), cells = $$('.otp-cells span', dlg), codeForm = $('#acct-code-form');
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
        return afterSignIn(false);
      }
      otpBox.classList.add('bad');
      err('#acct-otp-err', r.error || 'That code did not work. Please try again.');
      otp.value = ''; paintOtp(); otp.focus();
      if (r.expired) { $('#acct-resend').disabled = false; $('#acct-resend').textContent = 'Send a new code'; clearInterval(timer); }
    });
  });
  function countdown(sec) {
    var b = $('#acct-resend'), left = sec;
    clearInterval(timer); b.disabled = true;
    (function tick() { b.textContent = left > 0 ? 'Resend code in ' + left + 's' : 'Resend code'; b.disabled = left > 0; })();
    timer = setInterval(function () { left--; b.textContent = left > 0 ? 'Resend code in ' + left + 's' : 'Resend code'; b.disabled = left > 0; if (left <= 0) clearInterval(timer); }, 1000);
  }
  $('#acct-resend').addEventListener('click', function () {
    if (!sentTo) return step('phone');
    var b = this; b.disabled = true; b.textContent = 'Sending';
    call('send-code', { code: sentTo.code, mobile: sentTo.mobile }).then(function (r) {
      if (r.ok) { resetOtp(); countdown(r.resend_in || 60); otp.focus(); return; }
      err('#acct-otp-err', r.error || 'Could not send a new code. Please try again.');
      countdown(r.retry_after || 30);
    });
  });
  $('[data-acct-back]', dlg).addEventListener('click', function () { clearInterval(timer); sentTo = null; step('phone'); });

  /* 3. a new number fills in its details (only after the code proved it is theirs) */
  var profileForm = $('#acct-profile-form');
  profileForm.addEventListener('submit', function (e) {
    e.preventDefault();
    ['name', 'email', 'dob'].forEach(function (k) { err('#acct-' + k + '-err', ''); });
    err('#acct-profile-err', '');
    var data = { name: $('#acct-name').value.trim(), email: $('#acct-email').value.trim(), dob: $('#acct-dob').value };
    busy(profileForm, true, 'Saving');
    call('profile', data).then(function (r) {
      busy(profileForm, false);
      if (r.ok) { me.account = r.account; me.needsProfile = false; setHint(r.account.first); paintButton(); return showDone(r.created); }
      if (r._status === 401) { me = null; setHint(''); paintButton(); err('#acct-phone-err', 'Your sign-in expired. Please sign in again.'); return step('phone'); }
      if (r.errors) { Object.keys(r.errors).forEach(function (k) { err('#acct-' + k + '-err', r.errors[k]); }); return; }
      err('#acct-profile-err', r.error || 'Could not save your details. Please try again.');
    });
  });

  /* 4. signed in */
  $('#acct-logout').addEventListener('click', function () {
    var b = this; b.disabled = true;
    call('logout', {}).then(function () {
      b.disabled = false; me = { ok: true, signedIn: false }; setHint(''); paintButton(); step('phone');
    });
  });

  // Someone who signed in before: confirm the session quietly so the header shows their initial.
  var dob = $('#acct-dob'); if (dob) dob.max = new Date().toISOString().slice(0, 10);
  paintButton();
  if (hint()) (window.requestIdleCallback || setTimeout)(refresh);
})();
