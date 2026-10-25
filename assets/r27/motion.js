/* Text motion for the 2027 report page (see motion.css). Runs only when <html> has .motion,
   which <head> sets unless the visitor asks for reduced motion. Scroll and pointer work is batched into
   requestAnimationFrame, and loops pause while they are off screen. */
(function () {
  'use strict';
  var root = document.documentElement;
  countdown();                                               /* information, not motion: runs for everyone */
  docks(root.classList.contains('motion'));                /* the calculator dock works for everyone; it turns on its own only with motion */
  if (!root.classList.contains('motion')) return;
  window.__motionReady = true;

  var $$ = function (s, el) { return [].slice.call((el || document).querySelectorAll(s)); };
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var raf = window.requestAnimationFrame.bind(window);

  /* Run fn once the element is within about a screen of view, so start-up stays light. */
  var pendingBuilds = [];
  function near(sel, fn) {
    var el = document.querySelector(sel); if (!el) return;
    var done = false, io = null;
    function run() { if (done) return; done = true; if (io) io.disconnect(); fn(); }
    pendingBuilds.push(run);
    if (!('IntersectionObserver' in window)) return run();
    io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) run(); }, { rootMargin: '900px 0px' });
    io.observe(el);
  }
  function buildAll() { pendingBuilds.forEach(function (f) { f(); }); }
  /* A jump to a section (menu link) builds everything first, so the page does not change height mid-scroll;
     and everything is built a few seconds after load anyway. */
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('a[href^="#"]')) buildAll(); }, true);
  addEventListener('load', function () { setTimeout(function () { (window.requestIdleCallback || setTimeout)(buildAll); }, 4000); });
  if (location.hash) buildAll();

  /* ---------- reveal on scroll: headings (clip-path), leads (blur), marks, the 11/2 drawing ---------- */
  function reveal(sel, margin, onIn) {
    var els = $$(sel); if (!els.length) return;
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); if (onIn) onIn(e); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in'); io.unobserve(en.target); if (onIn) onIn(en.target);
      });
    }, { rootMargin: margin, threshold: 0 });
    els.forEach(function (e) { io.observe(e); });
  }
  reveal('.section-heading h2, .about-copy h2, .closing-title', '0px 0px -12% 0px');
  reveal('.section-lead', '0px 0px -38% 0px');             /* comes into focus near the middle of the screen */

  /* Near the bottom of the page some items can never reach their trigger line: show whatever is on screen. */
  function revealOnScreen() {
    if (innerHeight + scrollY < document.documentElement.scrollHeight - 80) return;
    $$('.section-heading h2:not(.in), .about-copy h2:not(.in), .closing-title:not(.in), .section-lead:not(.in), mark.hl:not(.in), .draw-num:not(.in), .kicker:not(.in), .plan:not(.in), .sig-line:not(.in), .foot-mark:not(.in)').forEach(function (e) {
      var r = e.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) e.classList.add('in');
    });
  }
  addEventListener('scroll', function () { raf(revealOnScreen); }, { passive: true });
  reveal('mark.hl', '0px 0px -30% 0px');
  reveal('.draw-num', '0px 0px -20% 0px', function () {
    var g = document.querySelector('#year-2027 .glitch');
    if (g) setTimeout(function () { glitch(g); }, 2500);   /* once the outline has drawn */
  });
  reveal('.kicker', '0px 0px -10% 0px');                   /* the small label slides in with its line */
  reveal('.sig-line', '0px 0px -15% 0px');                 /* "Curated by Shashank Agrawal" */
  reveal('.foot-mark', '0px 0px -4% 0px');                 /* the footer wordmark */

  /* ---------- card sheen: a light streak crosses each price card once as it arrives, and again on hover ---------- */
  function sheen(card) { card.classList.remove('sheen'); void card.offsetWidth; card.classList.add('sheen'); }
  reveal('.plan', '0px 0px -25% 0px', function (card) { setTimeout(function () { sheen(card); }, 250); });
  $$('.plan').forEach(function (card) {
    card.addEventListener('animationend', function (e) { if (e.pseudoElement === '::after') card.classList.remove('sheen'); });
    card.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' && !card.classList.contains('sheen')) sheen(card); });
  });

  /* ---------- constellation path: a line draws through the order steps as you scroll; each step lights as it is reached ---------- */
  near('#how', function () {
    var ol = document.querySelector('#how .report-steps'); if (!ol) return;
    var lis = $$('li', ol); if (lis.length < 2) return;
    var NS = 'http://www.w3.org/2000/svg';
    var wrap = document.createElement('div'); wrap.className = 'cst-wrap';
    ol.parentNode.insertBefore(wrap, ol); wrap.appendChild(ol); ol.classList.add('constellation');
    var svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'cst'); svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = '<defs><linearGradient id="cst-g" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#8fd8ff"/><stop offset="1" stop-color="#f3cd93"/></linearGradient></defs>' +
      '<path class="cst-base"/><g class="cst-lines"></g><g class="cst-nodes"></g><circle class="cst-tip-glow" r="9"/><circle class="cst-tip" r="3.2"/>';
    wrap.appendChild(svg);
    var base = svg.querySelector('.cst-base'), linesG = svg.querySelector('.cst-lines'), nodes = svg.querySelector('.cst-nodes'), grad = svg.querySelector('#cst-g');
    var tip = svg.querySelector('.cst-tip'), glow = svg.querySelector('.cst-tip-glow');
    /* one path per segment: Chrome restarts a dash pattern at every gap in a path, so each segment draws on its own */
    var total = 0, marks = [], pts = [], segs = [], vertical = false, cur = 0, target = 0, running = false;
    var STAR = function (s) { var q = s * .26; return 'M0 ' + -s + 'L' + q + ' ' + -q + 'L' + s + ' 0L' + q + ' ' + q + 'L0 ' + s + 'L' + -q + ' ' + q + 'L' + -s + ' 0L' + -q + ' ' + -q + 'Z'; };

    function build() {
      vertical = getComputedStyle(ol).gridTemplateColumns.split(' ').length < 2;
      wrap.classList.toggle('v', vertical);
      var wr = wrap.getBoundingClientRect();
      pts = lis.map(function (li) {
        var r = li.querySelector('.step-number').getBoundingClientRect();
        return { x: vertical ? 13 : r.left + r.width / 2 - wr.left, y: r.top + r.height / 2 - wr.top };
      });
      svg.setAttribute('viewBox', '0 0 ' + wr.width + ' ' + wr.height);
      var trim = vertical ? 7 : 26, amp = vertical ? 7 : 13, d = '', lens = [];
      linesG.innerHTML = ''; segs = [];
      for (var i = 0; i < pts.length - 1; i++) {
        var a = pts[i], b = pts[i + 1], vx = b.x - a.x, vy = b.y - a.y, L = Math.hypot(vx, vy), ux = vx / L, uy = vy / L, nx = -uy, ny = ux;
        var s = { x: a.x + ux * trim, y: a.y + uy * trim }, e = { x: b.x - ux * trim, y: b.y - uy * trim }, k = (i % 2 ? -1 : 1) * amp;
        var seg = 'M' + s.x.toFixed(1) + ' ' + s.y.toFixed(1) + 'C' + (s.x + vx * .3 + nx * k).toFixed(1) + ' ' + (s.y + vy * .3 + ny * k).toFixed(1) + ' ' +
          (e.x - vx * .3 - nx * k).toFixed(1) + ' ' + (e.y - vy * .3 - ny * k).toFixed(1) + ' ' + e.x.toFixed(1) + ' ' + e.y.toFixed(1);
        var sp = document.createElementNS(NS, 'path'); sp.setAttribute('class', 'cst-line'); sp.setAttribute('d', seg); linesG.appendChild(sp);
        var len = sp.getTotalLength(); sp.style.strokeDasharray = len + ' ' + len; sp.style.strokeDashoffset = len;
        segs.push({ el: sp, len: len }); lens.push(len); d += seg;
      }
      base.setAttribute('d', d);
      var first = pts[0], last = pts[pts.length - 1];
      grad.setAttribute('x1', first.x); grad.setAttribute('y1', first.y); grad.setAttribute('x2', last.x); grad.setAttribute('y2', last.y + (vertical ? 0 : 1));
      total = 0; segs.forEach(function (s) { s.start = total; total += s.len; });
      var acc = 0; marks = [0];                               /* where along the line each step is reached */
      lens.forEach(function (l) { acc += l; marks.push(acc / total); });
      nodes.innerHTML = pts.map(function (p, i) {
        var sx = p.x + (vertical ? 15 : 24), sy = p.y - (vertical ? 13 : 22);
        return (vertical ? '<circle class="cst-node" data-i="' + i + '" cx="' + p.x + '" cy="' + p.y + '" r="5"/>' : '') +
          '<g transform="translate(' + sx.toFixed(1) + ' ' + sy.toFixed(1) + ')"><path class="cst-spark" data-i="' + i + '" d="' + STAR(vertical ? 5 : 6.5) + '"/></g>';
      }).join('');
      measure(); paint();
    }
    function measure() {
      var r = wrap.getBoundingClientRect(), vh = innerHeight, p;
      if (vertical) p = (vh * .62 - r.top - pts[0].y) / (pts[pts.length - 1].y - pts[0].y);
      else p = (vh * .84 - r.top) / (vh * .42);
      target = Math.max(0, Math.min(1, p));
    }
    function paint() {
      var at = total * cur, head = null;
      segs.forEach(function (s) {
        var shown = Math.max(0, Math.min(s.len, at - s.start));
        s.el.style.strokeDashoffset = (s.len - shown).toFixed(1);
        if (shown > 0 && shown < s.len) head = s.el.getPointAtLength(shown);
      });
      var on = !!head && cur < .998;
      if (on) { tip.setAttribute('cx', head.x); tip.setAttribute('cy', head.y); glow.setAttribute('cx', head.x); glow.setAttribute('cy', head.y); }
      svg.classList.toggle('tip-on', on);
      marks.forEach(function (m, i) {
        var lit = cur > 0 && cur >= m - .004;
        lis[i].classList.toggle('lit', lit);
        $$('[data-i="' + i + '"]', nodes).forEach(function (n) { n.classList.toggle('lit', lit); });
      });
    }
    function loop() {
      if (running) return; running = true;
      raf(function step() {
        cur += (target - cur) * .12;
        if (Math.abs(target - cur) < .0008) cur = target;
        paint();
        if (cur !== target) raf(step); else running = false;
      });
    }
    addEventListener('scroll', function () { measure(); loop(); }, { passive: true });
    var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(build, 150); });
    build(); loop();
  });

  /* ---------- the five Vedic sessions: pinned on wide screens; the one at the middle of the screen lights up ----------
     Native sticky positioning does the pinning, and five invisible steps tell which session is current, so scrolling
     itself never runs any script. */
  (function () {
    var box = document.querySelector('[data-sessions]'); if (!box || !('IntersectionObserver' in window)) return;
    var mq = matchMedia('(min-width: 1001px) and (min-height: 600px)'), io = null, ro = null;
    var items = $$('.sessions-list li', box), arts = $$('.sessions-detail article', box), steps = $$('.sessions-steps i', box);
    var sticky = box.querySelector('.sessions-sticky');
    if (!sticky || !steps.length) return;
    var cur = 0, held = -1;                   /* cur: the step at the middle line; held: a card whose link has keyboard focus */
    function show(i) {
      items.forEach(function (li, n) { li.classList.toggle('on', n === i); });
      arts.forEach(function (a, n) { a.classList.toggle('on', n === i); });
    }
    function set(i) { if (i < 0) return; cur = i; if (held < 0) show(i); }
    /* tabbing to a card's Book link brings that card forward and keeps it there until focus leaves the cards */
    box.addEventListener('focusin', function (e) {
      var a = e.target.closest && e.target.closest('.sessions-detail article');
      if (a && box.classList.contains('pinned')) { held = arts.indexOf(a); show(held); }
    });
    box.addEventListener('focusout', function (e) {
      var to = e.relatedTarget, a = to && to.closest && to.closest('.sessions-detail article');
      if (!a || !box.contains(a)) { held = -1; show(cur); }
    });
    /* the track is five steps of scroll plus the pinned block's own height, so each session gets an equal share of the pin */
    function fit() { box.style.setProperty('--ss-h', sticky.offsetHeight + 'px'); }
    function apply() {
      box.classList.toggle('pinned', mq.matches);
      if (io) { io.disconnect(); io = null; }
      if (ro) { ro.disconnect(); ro = null; }
      if (!mq.matches) { box.style.removeProperty('--ss-h'); return; }
      fit();
      if ('ResizeObserver' in window) { ro = new ResizeObserver(fit); ro.observe(sticky); }
      /* the middle line of the screen picks the step. The first step reaches a screen above the block and the last one a
         screen below it, so wherever a scroll or a jump from a link lands, the line sits in exactly one step */
      io = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) set(steps.indexOf(e.target)); }); },
        { rootMargin: '-50% 0px -50% 0px' });
      steps.forEach(function (st) { io.observe(st); });
    }
    if (mq.addEventListener) mq.addEventListener('change', apply); else if (mq.addListener) mq.addListener(apply);
    apply();
  })();

  /* ---------- 3D ring of the report chapters: turn with the arrows, a swipe or a click; turns on its own while in view ---------- */
  near('#inside', function () {
    var ol = document.querySelector('#inside .inside-list'), ctr = document.querySelector('#inside .ring-controls');
    if (!ol || !ctr) return;
    var items = $$('li', ol), n = items.length; if (n < 3) return;
    var stage = document.createElement('div'); stage.className = 'ring-stage';
    ol.parentNode.insertBefore(stage, ol); stage.appendChild(ol); ol.classList.add('ring'); ctr.hidden = false;
    var count = ctr.querySelector('.ring-count'), turn = 0, stepDeg = 360 / n, visible = false, hold = 0, timer = null;
    var pad = function (x) { return (x < 10 ? '0' : '') + x; };
    function layout() {
      var w = items[0].offsetWidth, r = Math.round(w / 2 / Math.tan(Math.PI / n) * 1.12), h = 0;
      ol.style.setProperty('--r', r + 'px');
      items.forEach(function (li, i) { li.style.setProperty('--a', (i * stepDeg) + 'deg'); h = Math.max(h, li.offsetHeight); });
      ol.style.setProperty('--h', h + 'px');
    }
    function show() {
      var idx = ((turn % n) + n) % n;
      ol.style.setProperty('--rot', (-turn * stepDeg) + 'deg');
      items.forEach(function (li, i) {
        var dd = ((i - idx) % n + n) % n, dist = Math.min(dd, n - dd);
        li.classList.toggle('front', dist === 0);
        li.style.setProperty('--o', dist === 0 ? 1 : dist === 1 ? .5 : 0);
      });
      count.textContent = pad(idx + 1) + ' / ' + pad(n);
    }
    function go(delta, byUser) { turn += delta; show(); if (byUser) hold = Date.now() + 9000; }
    ctr.querySelector('.ring-prev').addEventListener('click', function () { go(-1, true); });
    ctr.querySelector('.ring-next').addEventListener('click', function () { go(1, true); });
    items.forEach(function (li, i) {                         /* a click on a side card brings it to the front */
      li.addEventListener('click', function () {
        var idx = ((turn % n) + n) % n, dd = ((i - idx) % n + n) % n;
        if (dd) go(dd <= n / 2 ? dd : dd - n, true);
      });
    });
    var x0 = null;
    stage.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
    stage.addEventListener('pointerup', function (e) { if (x0 === null) return; var dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1, true); });
    stage.addEventListener('pointercancel', function () { x0 = null; });
    stage.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hold = Infinity; });
    stage.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') hold = Date.now() + 2500; });
    ctr.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { go(1, true); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { go(-1, true); e.preventDefault(); }
    });
    function tick() { timer = setTimeout(function () { if (visible && Date.now() > hold && !ctr.contains(document.activeElement)) go(1); tick(); }, 5200); }
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { threshold: .35 }).observe(stage);
    var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { layout(); show(); }, 150); });
    layout(); show(); tick();
  });

  /* ---------- subtle glitch (one brief slice, also on hover) ---------- */
  function glitch(el) {
    if (el.classList.contains('glitching')) return;
    el.classList.add('glitching');
    setTimeout(function () { el.classList.remove('glitching'); }, 460);
  }
  $$('.glitch').forEach(function (g) { g.addEventListener('mouseenter', function () { glitch(g); }); });

  /* ---------- infinite marquee + kinetic scroll ---------- */
  (function () {
    var mq = document.querySelector('.marquee'); if (!mq) return;
    var track = mq.querySelector('.marquee-track');
    var anim = track.getAnimations ? track.getAnimations()[0] : null;
    var visible = false, lastY = scrollY, lastT = performance.now(), k = 0, target = 0, running = false;
    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      if (anim) visible ? anim.play() : anim.pause();
      if (!visible) { k = target = 0; mq.style.setProperty('--k', '0'); if (anim) anim.playbackRate = 1; }
      if (visible) loop();
    }).observe(mq);
    addEventListener('scroll', function () {
      var now = performance.now(), dt = Math.max(16, now - lastT);
      var v = Math.abs(scrollY - lastY) / dt;              /* px per ms */
      target = Math.min(1, v / 2.2);
      lastY = scrollY; lastT = now;
      if (visible) loop();
    }, { passive: true });
    function loop() {
      if (running) return; running = true;
      raf(function step() {
        target *= 0.9;                                       /* ease back when scrolling stops */
        k += (target - k) * 0.18;
        if (k < 0.002 && target < 0.002) { k = 0; mq.style.setProperty('--k', '0'); if (anim) anim.playbackRate = 1; running = false; return; }
        mq.style.setProperty('--k', k.toFixed(3));
        if (anim) anim.playbackRate = 1 + k * 3;
        if (visible) raf(step); else running = false;
      });
    }
  })();

  /* ---------- scramble decode: the Personal Year result cycles through digits, then locks ---------- */
  (function () {
    var box = document.querySelector('.finder-result'); if (!box || !('MutationObserver' in window)) return;
    function scramble(el) {
      if (el.dataset.sc) return;                            /* each result is a fresh element: scramble it once */
      var final = el.textContent; if (!/^\d+$/.test(final.trim())) return;
      el.dataset.sc = '1'; el.classList.add('scrambling');
      var frames = 0, max = 16;
      (function tick() {
        frames++;
        if (frames >= max) { el.textContent = final; el.classList.remove('scrambling'); return; }
        el.textContent = final.replace(/\d/g, function () { return String(1 + Math.floor(Math.random() * 9)); });
        setTimeout(tick, 38);
      })();
    }
    new MutationObserver(function () { $$('.finder-number b', box).forEach(scramble); }).observe(box, { childList: true, subtree: true });
  })();

  /* ---------- 3D letter flip: one word swaps letter by letter ---------- */
  $$('.flip').forEach(function (el) {
    var words = (el.getAttribute('data-words') || '').split('|').filter(Boolean); if (words.length < 2) return;
    var i = 0, visible = false, timer = null;
    function paint(word, cls) {
      el.innerHTML = '';
      word.split('').forEach(function (ch, n) {
        var s = document.createElement('span'); s.className = 'fl' + (cls ? ' ' + cls : ''); s.textContent = ch;
        s.style.transitionDelay = (n * 40) + 'ms'; el.appendChild(s);
      });
    }
    paint(words[0]);
    function next() {
      var letters = $$('.fl', el);
      letters.forEach(function (s) { s.classList.add('out'); });
      setTimeout(function () {
        i = (i + 1) % words.length; paint(words[i], 'pre');
        raf(function () { raf(function () { $$('.fl', el).forEach(function (s) { s.classList.remove('pre'); }); }); });
      }, 380 + letters.length * 40);
    }
    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      if (visible && !timer) timer = setTimeout(function run() { next(); timer = setTimeout(run, 2600); }, 1600);
      if (!visible && timer) { clearTimeout(timer); timer = null; }
    }).observe(el);
  });

  /* ---------- fluid morph: one word melts into the other ---------- */
  $$('.morph').forEach(function (box) {
    var words = $$('.morph-word', box); if (words.length < 2) return;
    var cur = 0, visible = false, busy = false, timer = null;
    var MORPH = 1100, HOLD = 2200;
    function set(el, f) {                                   /* f: 0 hidden, 1 sharp */
      var blur = f >= 1 ? 0 : Math.min(8 / Math.max(f, 0.0001) - 8, 60);
      el.style.filter = blur ? 'blur(' + blur.toFixed(2) + 'px)' : '';
      el.style.opacity = Math.pow(Math.max(f, 0), 0.4).toFixed(3);
    }
    function morph() {
      if (busy) return; busy = true;
      var a = words[cur], b = words[(cur + 1) % words.length], t0 = performance.now();
      box.classList.add('moving');
      raf(function step(now) {
        var f = Math.min(1, (now - t0) / MORPH);
        set(b, f); set(a, 1 - f);
        if (f < 1) return raf(step);
        set(a, 0); set(b, 1); box.classList.remove('moving');
        cur = (cur + 1) % words.length; busy = false;
      });
    }
    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      if (visible && !timer) timer = setTimeout(function run() { morph(); timer = setTimeout(run, MORPH + HOLD); }, 1200);
      if (!visible && timer) { clearTimeout(timer); timer = null; }
    }).observe(box);
  });

  if (!fine) return;                                        /* the last two need a mouse */

  /* ---------- magnetic hover: buttons lean toward the cursor ---------- */
  $$('.pill, .wa-btn').forEach(function (btn) {
    var pending = null;
    btn.classList.add('magnetic');
    btn.addEventListener('pointermove', function (e) {
      pending = e; if (btn._f) return;
      btn._f = raf(function () {
        btn._f = 0; var r = btn.getBoundingClientRect();
        var dx = (pending.clientX - (r.left + r.width / 2)) / (r.width / 2);
        var dy = (pending.clientY - (r.top + r.height / 2)) / (r.height / 2);
        btn.classList.add('pulling');
        btn.style.setProperty('--mx', (dx * 7).toFixed(1) + 'px');
        btn.style.setProperty('--my', (dy * 5).toFixed(1) + 'px');
      });
    });
    btn.addEventListener('pointerleave', function () {
      btn.classList.remove('pulling'); btn.style.setProperty('--mx', '0px'); btn.style.setProperty('--my', '0px');
    });
  });

  /* ---------- cursor spotlight on the About text ---------- */
  $$('.about-copy').forEach(function (box) {
    box.classList.add('spot');
    var pending = null, f = 0;
    box.addEventListener('pointerenter', function () { box.classList.add('lit'); });
    box.addEventListener('pointerleave', function () { box.classList.remove('lit'); });
    box.addEventListener('pointermove', function (e) {
      pending = e; if (f) return;
      f = raf(function () {
        f = 0;
        $$('p', box).forEach(function (p) {
          var r = p.getBoundingClientRect();
          p.style.setProperty('--sx', (pending.clientX - r.left).toFixed(0) + 'px');
          p.style.setProperty('--sy', (pending.clientY - r.top).toFixed(0) + 'px');
        });
      });
    });
  });

  /* ---------- calculator dock (hoisted, called at the top): a tile opens into its card on hover or focus; with
     motion, the first row also turns on its own while it is in view and the pointer is elsewhere ---------- */
  function docks(autoTurn) {
    [].forEach.call(document.querySelectorAll('.dock'), function (dock, di) {
      var cards = [].slice.call(dock.querySelectorAll('.dock-card')); if (!cards.length) return;
      var hovering = false, visible = false;
      function open(c) { cards.forEach(function (x) { x.classList.toggle('is-open', x === c); }); }
      cards.forEach(function (c) {
        c.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { hovering = true; open(c); } });
        c.addEventListener('focus', function () { open(c); });
      });
      dock.addEventListener('pointerleave', function () { hovering = false; });
      if (!autoTurn || di !== 0 || !('IntersectionObserver' in window)) return;
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { threshold: .6 }).observe(dock);
      (function tick() {
        setTimeout(function () {
          if (visible && !hovering && !dock.contains(document.activeElement) && innerWidth > 1000 && !document.hidden) {
            var i = cards.findIndex(function (x) { return x.classList.contains('is-open'); });
            open(cards[(i + 1) % cards.length]);
          }
          tick();
        }, 3800);
      })();
    });
  }

  /* ---------- countdown to the end of phase one (hoisted, called at the top) ---------- */
  function countdown() {
    var cd = document.querySelector('.countdown[data-ends]'); if (!cd) return;
    var end = Date.parse(cd.getAttribute('data-ends')); if (!end) return;
    var u = {}; ['d', 'h', 'm', 's'].forEach(function (k) { u[k] = cd.querySelector('[data-u="' + k + '"]'); });
    var two = function (x) { return (x < 10 ? '0' : '') + x; };
    function set(el, v) {
      if (el.textContent === v) return;
      el.textContent = v; el.classList.remove('tk'); void el.offsetWidth; el.classList.add('tk');
    }
    (function tick() {
      var left = end - Date.now();
      if (left <= 0) { cd.hidden = true; return; }        /* the offer has ended: nothing to count */
      cd.hidden = false;
      var s = Math.floor(left / 1000);
      set(u.d, two(Math.floor(s / 86400))); set(u.h, two(Math.floor(s % 86400 / 3600)));
      set(u.m, two(Math.floor(s % 3600 / 60))); set(u.s, two(s % 60));
      setTimeout(tick, 1000 - (Date.now() % 1000) + 8);
    })();
  }
})();
