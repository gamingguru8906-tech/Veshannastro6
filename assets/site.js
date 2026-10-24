/* Veshannastro shared script: menu, night sky, WhatsApp tracking,
   2027 Personal Year finder and Mulank / Bhagyank calculator. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- mobile menu ---------- */
  var btn = $('.menu-btn'), menu = $('#mobile-menu');
  function closeMenu() {
    if (!btn) return;
    btn.setAttribute('aria-expanded', 'false');
    menu.classList.remove('open');
    document.body.classList.remove('menu-open');
  }
  if (btn && menu) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      if (open) return closeMenu();
      btn.setAttribute('aria-expanded', 'true');
      menu.classList.add('open');
      document.body.classList.add('menu-open');
    });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  /* ---------- WhatsApp click tracking ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="wa.me/"]');
    if (a && typeof window.gtag === 'function') {
      window.gtag('event', 'whatsapp_click', { link_text: (a.textContent || '').trim().slice(0, 60), page_path: location.pathname });
    }
  });

  /* ---------- night sky ---------- */
  var sky = $('#sky');
  if (sky && sky.getContext) {
    var ctx = sky.getContext('2d'), stars = [], w = 0, h = 0;
    var size = function () {
      w = innerWidth; h = innerHeight;
      var r = Math.min(window.devicePixelRatio || 1, 2);
      sky.width = w * r; sky.height = h * r; ctx.setTransform(r, 0, 0, r, 0, 0);
      var seed = 2027, rnd = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
      stars = Array.from({ length: Math.round(w * h / 5200) }, function () {
        return { x: rnd() * w, y: rnd() * h, r: .35 + rnd() * 1, a: .1 + rnd() * .4, p: rnd() * 6.28 };
      });
    };
    var draw = function (t) {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i], a = reduced ? s.a : s.a * (.7 + .3 * Math.sin(t * .0006 + s.p));
        ctx.fillStyle = 'rgba(190,212,255,' + a + ')';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.2832); ctx.fill();
      }
      if (!reduced && !document.hidden) requestAnimationFrame(draw);
    };
    size(); addEventListener('resize', size);
    requestAnimationFrame(draw);
    document.addEventListener('visibilitychange', function () { if (!document.hidden && !reduced) requestAnimationFrame(draw); });
  }

  /* ---------- numerology helpers ---------- */
  var digitSum = function (n) { return String(n).split('').reduce(function (a, d) { return a + (+d || 0); }, 0); };
  var toSingle = function (n) { while (n > 9) n = digitSum(n); return n; };
  var PLANET = { 1: 'Sun', 2: 'Moon', 3: 'Jupiter', 4: 'Rahu', 5: 'Mercury', 6: 'Venus', 7: 'Ketu', 8: 'Saturn', 9: 'Mars' };
  var PY_THEME = {
    1: 'A fresh start. 2027 opens a new nine-year cycle for you: begin things, take the lead, decide.',
    2: 'Patience and partnership. Results come through other people this year, so cooperate and let things ripen.',
    3: 'Expression and growth. Speak, write, teach, sell and be seen. Social plans move quickly.',
    4: 'Foundations. Steady work, routines and paperwork pay off. Shortcuts cost more than they save.',
    5: 'Change and movement. Travel, new work and new people. Keep your commitments light enough to move.',
    6: 'Home, love and responsibility. Family, marriage and the people you look after take centre stage.',
    7: 'Reflection. A quieter year for study, health, spiritual practice and getting clear before you act.',
    8: 'Money, status and reward. Effort from past years is measured now. Handle authority and finances carefully.',
    9: 'Completion. Close what is finished, clear space and give back. New beginnings arrive in 2028.'
  };
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var ZODIAC = ['Capricorn', 'Aquarius', 'Pisces', 'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius'];
  var CUT = [20, 19, 21, 20, 21, 21, 23, 23, 23, 23, 22, 22];
  var validDate = function (d, m, y) {
    var dt = new Date(y, m - 1, d);
    return y >= 1900 && y <= new Date().getFullYear() && dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
  };
  var fillMonthSelect = function (sel) {
    if (!sel || sel.options.length > 1) return;
    MONTHS.forEach(function (name, i) { var o = document.createElement('option'); o.value = i + 1; o.textContent = name; sel.appendChild(o); });
  };

  /* ---------- YouTube: load the player only when clicked ---------- */
  $$('.video a[data-yt]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + a.getAttribute('data-yt') + '?autoplay=1&rel=0';
      f.title = a.getAttribute('aria-label') || 'Video';
      f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      f.allowFullscreen = true;
      a.replaceWith(f);
    });
  });

  /* ---------- 2027 Personal Year finder ---------- */
  $$('[data-finder]').forEach(function (box) {
    var form = $('form', box), out = $('.finder-result', box);
    var orderHref = box.getAttribute('data-order') || '/2027-numerology-report/#register';
    fillMonthSelect(form.elements.month);
    var run = function () {
      var d = +form.elements.day.value, m = +form.elements.month.value, y = +form.elements.year.value;
      if (!d || !m || !y || !validDate(d, m, y)) {
        out.innerHTML = '<p class="finder-empty">Enter your birth day, month and year to see your 2027 Personal Year number.</p>';
        return;
      }
      var dd = toSingle(d), mm = toSingle(m), py = toSingle(dd + mm + 2);
      var sign = ZODIAC[(m - 1 + (d >= CUT[m - 1] ? 1 : 0)) % 12];
      out.innerHTML =
        '<div class="finder-out"><div class="finder-num" aria-hidden="true">' + py + '</div><div>' +
        '<h3>Personal Year ' + py + ' in 2027</h3>' +
        '<p>' + PY_THEME[py] + '</p>' +
        '<p class="finder-work">Day ' + d + (d > 9 ? ' (' + dd + ')' : '') + ' + month ' + m + (m > 9 ? ' (' + mm + ')' : '') + ' + 2027 (2) = ' + (dd + mm + 2) + (dd + mm + 2 > 9 ? ' = ' + py : '') + '. Ruled by ' + PLANET[py] + '. Sun sign ' + sign + '.</p>' +
        '<p><a class="text-link" href="/blog/personal-year-' + py + '-in-2027.html">Read Personal Year ' + py + ' in 2027</a></p>' +
        '<a class="btn btn-gold" href="' + orderHref.replace(/"/g, '&quot;') + '"' + (/^https?:/.test(orderHref) ? ' target="_blank" rel="noopener"' : '') + '>Get my full 2027 report</a>' +
        '</div></div>';
      if (typeof window.gtag === 'function') window.gtag('event', 'personal_year_calculated', { personal_year: py });
    };
    form.addEventListener('input', run);
    form.addEventListener('change', run);
    form.addEventListener('submit', function (e) { e.preventDefault(); run(); });
  });

  /* ---------- Mulank / Bhagyank calculator ---------- */
  $$('[data-mulank-calc]').forEach(function (box) {
    var form = $('form', box), out = $('.finder-result', box);
    fillMonthSelect(form.elements.month);
    var run = function () {
      var d = +form.elements.day.value, m = +form.elements.month.value, y = +form.elements.year.value;
      if (!d || !m || !y || !validDate(d, m, y)) {
        out.innerHTML = '<p class="finder-empty">Enter your full date of birth to find your Mulank, Bhagyank and 2027 Personal Year.</p>';
        return;
      }
      var mul = toSingle(d);
      var bhag = toSingle(digitSum(d) + digitSum(m) + digitSum(y));
      var py = toSingle(toSingle(d) + toSingle(m) + 2);
      out.innerHTML =
        '<div class="finder-out"><div class="finder-num" aria-hidden="true">' + mul + '</div><div>' +
        '<h3>Mulank ' + mul + ' (' + PLANET[mul] + ')</h3>' +
        '<p>Bhagyank ' + bhag + ' (' + PLANET[bhag] + '). 2027 Personal Year ' + py + '.</p>' +
        '<p class="finder-work">Mulank is your birth day reduced: ' + d + (d > 9 ? ' = ' + mul : '') + '. Bhagyank is the full date added together: ' + d + '/' + m + '/' + y + ' = ' + bhag + '.</p>' +
        '<p><a class="text-link" href="#mulank-' + mul + '">Mulank ' + mul + ' prediction for 2027</a></p>' +
        '<p><a class="text-link" href="/blog/personal-year-' + py + '-in-2027.html">Personal Year ' + py + ' in 2027</a></p>' +
        '</div></div>';
    };
    form.addEventListener('input', run);
    form.addEventListener('change', run);
    form.addEventListener('submit', function (e) { e.preventDefault(); run(); });
  });
})();
