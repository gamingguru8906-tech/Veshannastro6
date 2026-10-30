/* Book animation: the six cover designs sweep in from both sides into a row, the 2027 book is
   drawn out to the centre while the others step aside, opens, turns a page, closes and slides
   back into its place. Mulank 3, 5, 6 and 9 share one cover, so Mulank 6 stands in for all four. */
(function () {
  'use strict';
  var stage = document.getElementById('book-stage');
  if (!stage || !stage.animate) return;
  /* Built only when the stage comes within about a screen of view, so it does not slow the first paint. */
  if ('IntersectionObserver' in window) {
    var nearIo = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { nearIo.disconnect(); init(); } }, { rootMargin: '900px 0px' });
    nearIo.observe(stage);
  } else init();

  function init() {
  var replay = document.getElementById('book-replay');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ROW = [9, 3, 1, 'hero', 6, 5];       // five covers around the Mulank 2 sample; the fan below shows all nine
  var HI = ROW.indexOf('hero');
  var MID = (ROW.length - 1) / 2;
  var OUT = 'cubic-bezier(.22,1,.36,1)';
  var INOUT = 'cubic-bezier(.65,0,.35,1)';
  var TURN = 'cubic-bezier(.42,0,.28,1)';

  /* Lazy, and the 480-wide copies of the sample pages on phones (they are shown at about 240 px there). */
  var SMALL = innerWidth < 760;
  function img(src, w, h) { var i = new Image(); i.loading = 'lazy'; i.decoding = 'async'; i.alt = ''; i.width = w; i.height = h;
    i.src = SMALL && src.indexOf('/book/') > -1 ? src.replace('.webp', '-480.webp') : src; return i; }
  function el(cls, kids) { var d = document.createElement('div'); d.className = cls; (kids || []).forEach(function (k) { d.appendChild(k); }); return d; }

  var books = ROW.map(function (k) {
    var hero = k === 'hero';
    var b = el(hero ? 'bk bk-hero' : 'bk', [img(hero ? '/assets/r27/book/cover.webp' : '/assets/r27/covers/mulank-' + k + '.webp', 360, 640)]);
    stage.appendChild(b); return b;
  });
  var hero = books[HI];
  function face(cls, src) { var s = el('shade'); return el('face ' + cls, [img(src, 720, 1280), s]); }
  var leaf0 = el('leaf', [face('front', '/assets/r27/book/cover.webp'), face('back', '/assets/r27/book/page-1.webp')]);
  var leaf1 = el('leaf', [face('front', '/assets/r27/book/page-2.webp'), face('back', '/assets/r27/book/page-3.webp')]);
  var base = el('ob-base', [img('/assets/r27/book/page-4.webp', 720, 1280)]);
  var ob = el('ob', [base, leaf1, leaf0, el('ob-spine')]);
  stage.appendChild(ob);

  /* geometry */
  var g = {};
  function measure() {
    var bw = books[0].offsetWidth || 120, W = stage.clientWidth, H = stage.clientHeight;
    var gap = Math.min(bw * 1.08, (W - bw * 1.1) / (ROW.length - 1));
    var pw = Math.min(W * .46, Math.min(innerHeight * .8, H * 1.04) * 9 / 16);
    ob.style.setProperty('--pw', pw + 'px');
    g = { bw: bw, W: W, H: H, gap: gap, pw: pw, lift: bw < 100 ? 1.45 : 1.2, up: bw * .1 };
  }
  function slot(i) {
    var k = i - MID, a = Math.abs(k);
    return { x: k * g.gap, y: a * a * 3, r: k * 2, s: i === HI ? 1.04 : 1 };
  }
  function parted(i, far) {
    var side = i < HI ? -1 : 1, n = side < 0 ? HI - 1 - i : i - HI - 1;
    var clear = g.bw * g.lift / 2 + g.bw * .46 + Math.max(12, g.bw * .14);
    // only ever move outward, never toward the 2027 book on its way to the centre
    var x = side * Math.max(Math.abs(slot(i).x) + g.bw * .2, clear + n * g.gap * .78);
    return { x: far ? x * 1.22 : x, y: 14 + n * 6, r: side * (3 + n * 1.5), s: .9 - n * .03 };
  }
  function lifted() { return { x: 0, y: -g.up, r: 0, s: g.lift }; }
  function T(p) { return 'translate(' + p.x + 'px,' + p.y + 'px) rotate(' + p.r + 'deg) scale(' + p.s + ')'; }
  function obClosed() { var s = g.bw * g.lift / g.pw; return 'translate(' + (-g.pw * s / 2) + 'px,' + (-g.up) + 'px) scale(' + s + ')'; }
  var OB_OPEN = 'translate(0px,0px) scale(1)';

  /* animation helpers: every new move starts from where the element is now, so nothing jumps */
  function settle(node) { node.getAnimations().forEach(function (a) { try { a.commitStyles(); } catch (e) {} a.cancel(); }); }
  function run(node, frames, opts) {
    settle(node);
    var a = node.animate(frames, Object.assign({ fill: 'forwards', easing: OUT }, opts));
    a.finished.catch(function () {});
    return a.finished;
  }
  function turn(leaf, from, to, ms, delay) {
    leaf.querySelectorAll('.shade').forEach(function (s) {
      run(s, [{ opacity: 0 }, { opacity: .34, offset: .5 }, { opacity: 0 }], { duration: ms, delay: delay || 0, easing: TURN });
    });
    return run(leaf, [{ transform: 'rotateY(' + from + 'deg)' }, { transform: 'rotateY(' + to + 'deg)' }], { duration: ms, delay: delay || 0, easing: TURN });
  }
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  function place(node, transform, opacity) { settle(node); node.style.transform = transform; node.style.opacity = opacity; }
  function resetBook() {
    settle(ob); ob.style.visibility = 'hidden';
    [leaf0, leaf1].forEach(function (l) { settle(l); l.style.transform = 'rotateY(0deg)'; });
    stage.querySelectorAll('.shade').forEach(function (s) { settle(s); s.style.opacity = 0; });
    leaf0.style.zIndex = 3; leaf1.style.zIndex = 2;
  }
  function finalState() {
    measure(); resetBook();
    books.forEach(function (b, i) { place(b, T(slot(i)), 1); b.style.zIndex = i === HI ? 20 : 10 - Math.abs(i - HI); });
    if (replay) replay.classList.add('show');
  }

  var playing = false;
  async function play() {
    if (playing) return; playing = true;
    if (replay) replay.classList.remove('show');
    measure(); resetBook();
    books.forEach(function (b, i) { place(b, T(slot(i)), 0); b.style.zIndex = i === HI ? 20 : 10 - Math.abs(i - HI); });
    try {
      // 1. the covers sweep in from both sides into the row
      await Promise.all(books.map(function (b, i) {
        if (i === HI) return null;
        var side = i < MID ? -1 : 1, far = Math.abs(i - MID);
        return run(b, [
          { transform: T({ x: side * g.W * .6, y: 26, r: side * 9, s: .86 }), opacity: 0 },
          { transform: T(slot(i)), opacity: 1 }
        ], { duration: 1150, delay: (2.5 - far) * 90 });
      }));
      // 2. the 2027 book rises into its place
      var hs = slot(HI);
      await run(hero, [{ transform: T({ x: hs.x, y: hs.y + 46, r: hs.r, s: .94 }), opacity: 0 }, { transform: T(hs), opacity: 1 }], { duration: 800 });
      await wait(500);
      // 3. it is drawn out to the centre while the others step aside
      books.forEach(function (b, i) { if (i !== HI) run(b, [{ transform: T(parted(i)), opacity: .36 }], { duration: 900 }); });
      await run(hero, [{ transform: T(lifted()) }], { duration: 950, delay: 220, easing: INOUT });
      await wait(160);
      // 4. swap to the book that opens, at exactly the same size and place, and open it
      ob.style.transform = obClosed(); ob.style.visibility = 'visible';
      place(hero, T(lifted()), 0);
      books.forEach(function (b, i) { if (i !== HI) run(b, [{ transform: T(parted(i, true)), opacity: 0 }], { duration: 700, easing: INOUT }); });
      leaf0.style.zIndex = 5;
      var grow = run(ob, [{ transform: obClosed() }, { transform: OB_OPEN }], { duration: 1400, easing: INOUT });
      await turn(leaf0, 0, -180, 1250, 140);
      leaf0.style.zIndex = 3;
      await grow; await wait(1400);
      // 5. turn a page
      leaf1.style.zIndex = 6;
      await turn(leaf1, 0, -180, 1050);
      await wait(1700);
      // 6. close the book and bring it back to its closed size
      turn(leaf1, -180, 0, 700);
      await wait(420); leaf0.style.zIndex = 7;
      var shut = turn(leaf0, -180, 0, 780);
      await run(ob, [{ transform: OB_OPEN }, { transform: obClosed() }], { duration: 1150, easing: INOUT });
      await shut;
      // 7. back into the row, the others return beside it
      place(hero, T(lifted()), 1); resetBook();
      books.forEach(function (b, i) { if (i !== HI) run(b, [{ transform: T(slot(i)), opacity: 1 }], { duration: 1000, delay: 80 + Math.abs(i - HI) * 50, easing: INOUT }); });
      await run(hero, [{ transform: T(slot(HI)) }], { duration: 1000, easing: INOUT });
      await wait(300);
    } catch (e) { /* cancelled by a replay or resize */ }
    playing = false;
    finalState();
  }

  if (reduced) { finalState(); return; }
  var started = false;
  new IntersectionObserver(function (en, obs) {
    if (en[0].isIntersecting && !started) {
      started = true; obs.disconnect();
      var imgs = Array.prototype.slice.call(stage.querySelectorAll('img'));
      Promise.all(imgs.map(function (i) { return i.decode ? i.decode().catch(function () {}) : null; })).then(play);
    }
  }, { threshold: .55 }).observe(stage);
  if (replay) replay.addEventListener('click', function () { play(); });
  var rz; addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { if (!playing && started) finalState(); }, 200); });
  }
})();
