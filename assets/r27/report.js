/* 2027 report page: report choice, order form, calculator with cover reveal, menu and star field. */
(function () {
  'use strict';
  var C = window.R27 || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var track = function (name, params) { if (typeof window.gtag === 'function') window.gtag('event', name, params || {}); };
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var inr = function (n) { return '₹' + n.toLocaleString('en-IN'); };

  /* ---------- hero video: tall cut on portrait screens, wide cut elsewhere ---------- */
  (function () {
    var v = document.getElementById('hero-video'); if (!v) return;
    var tall = matchMedia('(max-aspect-ratio: 1/1)').matches;
    v.poster = v.getAttribute(tall ? 'data-tall-poster' : 'data-wide-poster');
    var save = navigator.connection && navigator.connection.saveData;
    if (reduced || save) return;
    v.src = v.getAttribute(tall ? 'data-tall' : 'data-wide');
    v.muted = true; v.setAttribute('autoplay', '');
    var p = v.play(); if (p && p.catch) p.catch(function () {});
  })();

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
  fetch('/assets/countries.json').then(function (r) { return r.json(); }).then(function (list) {
    var cur = cc.value; cc.innerHTML = '';
    list.forEach(function (c) { opt(cc, c.value, c.label); });
    cc.value = cur || 'India|+91';
  }).catch(function () {});

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
    $('#pay-label').textContent = (C.online ? 'Pay ' : 'Review and order ') + p.now;
    tob.hidden = !r.needs_time;
    $$('select', tob).forEach(function (s) { s.required = r.needs_time; });
    $('#sp-name').textContent = r.name; $('#sp-price').textContent = p.now + ', delivered within ' + C.delivery;
  }
  function choose(key) { report = key; refresh(); track('select_item', { item_name: C.reports[key].name }); }
  $$('[data-report]').forEach(function (b) { b.addEventListener('click', function () { choose(b.getAttribute('data-report')); }); });
  $$('[data-pick]').forEach(function (a) { a.addEventListener('click', function () { choose(a.getAttribute('data-pick')); }); });
  cc.addEventListener('change', refresh);
  refresh();

  /* ---------- validation ---------- */
  var form = $('#registration');
  form.addEventListener('input', function (e) { var f = e.target.closest('.field,.consent'); if (f) f.classList.remove('invalid'); });
  form.addEventListener('change', function (e) { var f = e.target.closest('.field,.consent'); if (f) f.classList.remove('invalid'); });
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
    mark($('#email'), /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(o.email));
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
    lines.push('Place of birth: ' + o.pob, 'Email: ' + o.email, 'WhatsApp: ' + o.code + ' ' + o.mobile);
    if (o.referral) lines.push('Referral code: ' + o.referral);
    return lines.join('\n');
  }

  /* ---------- review dialog (WhatsApp order) ---------- */
  var dlg = $('#review-dialog');
  $$('[data-close]', dlg).forEach(function (b) { b.addEventListener('click', function () { dlg.close(); }); });
  dlg.addEventListener('close', function () { document.body.classList.remove('dialog-open'); });
  function review(o, p) {
    var rows = [['Report', o.reportName + ', ' + p.now], ['Name', o.name], ['Date of birth', o.dob]];
    if (o.tob) rows.push(['Time of birth', o.tob]);
    rows.push(['Place of birth', o.pob], ['Email', o.email], ['WhatsApp', o.code + ' ' + o.mobile]);
    if (o.referral) rows.push(['Referral code', o.referral]);
    $('#review-content').innerHTML = '<section class="review-card"><header><span>Your order</span></header><dl>' +
      rows.map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd></div>'; }).join('') + '</dl></section>';
    $('#review-note').textContent = 'This opens WhatsApp with your order typed out. Send it and we reply with your payment link. Your report arrives within ' + C.delivery + ' of payment.';
    var go = $('#review-go');
    go.href = 'https://wa.me/' + C.wa + '?text=' + encodeURIComponent(waText(o, p));
    go.onclick = function () { track('generate_lead', { currency: p.cur, value: p.amount, item_name: o.reportName }); };
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    document.body.classList.add('dialog-open');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var o = collect(), p = price();
    if (!validate(o)) return;
    track('begin_checkout', { currency: p.cur, value: p.amount, items: [{ item_name: o.reportName, price: p.amount }] });
    if (C.online && typeof window.R27Pay === 'function') return window.R27Pay(o, p, function () { review(o, p); });
    review(o, p);
  });

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
  function onScroll() {
    bar.classList.toggle('solid', scrollY > 28);
    var vh = innerHeight || 800;
    var max = root.scrollHeight - vh; if (prog) prog.style.transform = 'scaleX(' + (max > 0 ? scrollY / max : 0) + ')';
  }
  addEventListener('resize', onScroll);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* sticky mobile bar: shows once the form is out of view */
  var sticky = $('#sticky-pay');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { var v = en[0].isIntersecting; document.body.classList.toggle('form-in-view', v); sticky.classList.toggle('show', !v && scrollY > 200); }, { threshold: 0 }).observe($('.form-card'));
  }

  /* ---------- star field (from the original site) ---------- */
  var sky = $('#star-field'), ctx = sky.getContext('2d'), stars = [], W = 0, H = 0;
  function size() {
    W = innerWidth; H = innerHeight; var r = Math.min(devicePixelRatio || 1, 2);
    sky.width = W * r; sky.height = H * r; ctx.setTransform(r, 0, 0, r, 0, 0);
    var seed = 2719, rnd = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    stars = Array.from({ length: Math.round(W * H / 4200) }, function () { return { x: rnd() * W, y: rnd() * H, r: .4 + rnd() * 1.05, a: .12 + rnd() * .4, p: rnd() * 6.28 }; });
  }
  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    stars.forEach(function (s) { var a = s.a * (.65 + .35 * Math.sin(t * .0007 + s.p)); ctx.fillStyle = 'rgba(177,205,255,' + a + ')'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.2832); ctx.fill(); });
    var cyc = (t % 14000) / 14000;
    if (!reduced && cyc < .11) { var x = W * .2 + cyc * W * 5, y2 = H * .25 + cyc * H * 2, g = ctx.createLinearGradient(x - 130, y2 - 65, x, y2); g.addColorStop(0, 'transparent'); g.addColorStop(1, 'rgba(190,210,255,.35)'); ctx.strokeStyle = g; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 130, y2 - 65); ctx.lineTo(x, y2); ctx.stroke(); }
    if (!reduced && !document.hidden) requestAnimationFrame(draw);
  }
  size(); addEventListener('resize', size); requestAnimationFrame(draw);
  document.addEventListener('visibilitychange', function () { if (!document.hidden && !reduced) requestAnimationFrame(draw); });
})();
