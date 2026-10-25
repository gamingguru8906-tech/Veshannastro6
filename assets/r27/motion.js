/* Text motion for the 2027 report page (see motion.css). Runs only when <html> has .motion,
   which <head> sets unless the visitor asks for reduced motion. Scroll and pointer work is batched into
   requestAnimationFrame, and loops pause while they are off screen. */
(function () {
  'use strict';
  var root = document.documentElement;
  if (!root.classList.contains('motion')) return;
  window.__motionReady = true;

  var $$ = function (s, el) { return [].slice.call((el || document).querySelectorAll(s)); };
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var raf = window.requestAnimationFrame.bind(window);

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
    $$('.section-heading h2:not(.in), .about-copy h2:not(.in), .closing-title:not(.in), .section-lead:not(.in), mark.hl:not(.in), .draw-num:not(.in)').forEach(function (e) {
      var r = e.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) e.classList.add('in');
    });
  }
  addEventListener('scroll', function () { raf(revealOnScreen); }, { passive: true });
  reveal('mark.hl', '0px 0px -30% 0px');
  reveal('.draw-num', '0px 0px -20% 0px', function () {
    var g = document.querySelector('#year-2027 .glitch');
    if (g) setTimeout(function () { glitch(g); }, 2500);   /* once the outline has drawn */
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
})();
