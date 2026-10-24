/* Book animation: covers sweep in from both sides, the 2027 book pops forward,
   opens, flips its pages across the screen, closes and settles back into the row. */
(function () {
  'use strict';
  var stage = document.getElementById('book-stage');
  if (!stage || !stage.animate) return;
  var replay = document.getElementById('book-replay');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SIDE = [1, 4, 7, 8, 9, 3];           // Mulank covers that sweep in (3 left, 3 right)
  var CENTER = 3;                          // slot index of the 2027 book in the final row
  var EASE = 'cubic-bezier(.16,1,.3,1)';

  function img(src, w, h) { var i = new Image(); i.src = src; i.alt = ''; i.width = w; i.height = h; i.decoding = 'async'; return i; }
  function el(cls, kids) { var d = document.createElement('div'); d.className = cls; (kids || []).forEach(function (k) { d.appendChild(k); }); return d; }

  // Build: 6 side books, 1 hero book, 1 open book
  var order = SIDE.slice(0, 3).concat(['hero']).concat(SIDE.slice(3));
  var books = order.map(function (k) {
    var src = k === 'hero' ? '/assets/r27/book/cover.webp' : '/assets/r27/covers/mulank-' + k + '.webp';
    var b = el('bk', [img(src, 360, 640)]); stage.appendChild(b); return b;
  });
  var hero = books[CENTER];
  var face = function (cls, src) { return el('face ' + cls, [img(src, 720, 1280)]); };
  var leaf0 = el('leaf', [face('front', '/assets/r27/book/cover.webp'), face('back', '/assets/r27/book/page-1.webp')]);
  var leaf1 = el('leaf', [face('front', '/assets/r27/book/page-2.webp'), face('back', '/assets/r27/book/page-3.webp')]);
  var base = el('ob-base', [img('/assets/r27/book/page-4.webp', 720, 1280)]);
  var ob = el('ob', [base, leaf1, leaf0, el('ob-spine')]);
  ob.style.transformStyle = 'flat'; ob.style.perspective = '2400px';
  base.style.zIndex = 1; leaf1.style.zIndex = 2; leaf0.style.zIndex = 3;
  stage.appendChild(ob);

  var geo = {};
  function measure() {
    var bw = books[0].getBoundingClientRect().width || 120;
    var W = stage.clientWidth, H = stage.clientHeight;
    var gap = Math.min(bw * .62, (W - bw) / 6.2);
    var pw = Math.min(W * .46, Math.min(innerHeight * .8, H * 1.1) * 9 / 16);
    ob.style.setProperty('--pw', pw + 'px');
    geo = { bw: bw, W: W, H: H, gap: gap, pw: pw };
  }
  function slot(i) {
    var k = i - CENTER;
    return { x: k * geo.gap, z: i === CENTER ? 40 : -Math.abs(k) * 45, ry: -k * 9, rz: k * 1.2 };
  }
  var T = function (x, y, z, ry, rz, s, sx) {
    return 'translate3d(' + x + 'px,' + (y || 0) + 'px,' + (z || 0) + 'px) rotateY(' + (ry || 0) + 'deg) rotateZ(' + (rz || 0) + 'deg) scale(' + (s == null ? 1 : s) + ')' + (sx ? ' scaleX(' + sx + ')' : '');
  };
  var atSlot = function (i, extra) { var s = slot(i); extra = extra || {}; return T(s.x, extra.y || 0, (extra.z != null ? extra.z : s.z), s.ry, s.rz, extra.s); };
  var run = function (node, frames, opts) { return node.animate(frames, Object.assign({ fill: 'forwards', easing: EASE }, opts)).finished; };
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var closedScale = function (pop) { return (geo.bw * (pop || 1)) / geo.pw; };
  var obClosed = function (pop, z) { var s = closedScale(pop); return 'translate3d(' + (-geo.pw * s / 2) + 'px,0,' + (z || 0) + 'px) scale(' + s + ')'; };

  function finalState() {
    measure();
    books.forEach(function (b, i) { b.getAnimations().forEach(function (a) { a.cancel(); }); b.style.opacity = 1; b.style.filter = ''; b.style.transform = atSlot(i); });
    ob.getAnimations().forEach(function (a) { a.cancel(); });
    [leaf0, leaf1].forEach(function (l) { l.getAnimations().forEach(function (a) { a.cancel(); }); l.style.transform = 'rotateY(0deg)'; });
    ob.style.visibility = 'hidden';
    if (replay) replay.classList.add('show');
  }

  var playing = false;
  async function play() {
    if (playing) return; playing = true;
    if (replay) replay.classList.remove('show');
    measure();
    books.forEach(function (b) { b.getAnimations().forEach(function (a) { a.cancel(); }); b.style.opacity = 0; b.style.transform = ''; });
    ob.style.visibility = 'hidden';
    [leaf0, leaf1].forEach(function (l) { l.getAnimations().forEach(function (a) { a.cancel(); }); l.style.transform = 'rotateY(0deg)'; });
    try {
      // 1. sweep in from both sides
      var sweeps = books.map(function (b, i) {
        if (i === CENTER) return null;
        var left = i < CENTER, from = left ? -1 : 1, s = slot(i);
        var far = Math.abs(i - CENTER);
        return run(b, [
          { transform: T(from * geo.W * .75, -20, -380, from * -72, from * 8, .7, 1.9), opacity: 0, filter: 'blur(10px)' },
          { transform: T(from * geo.W * .2, 0, -120, from * -30, s.rz, .95, 1.25), opacity: 1, filter: 'blur(3px)', offset: .55 },
          { transform: atSlot(i), opacity: 1, filter: 'blur(0px)' }
        ], { duration: 1300, delay: (3 - far) * 110 });
      });
      await Promise.all(sweeps);
      // 2. the 2027 book rises from the middle and pops forward
      await run(hero, [{ transform: T(0, 40, -520, 0, 0, .55), opacity: 0 }, { transform: T(0, 0, 230, 0, 0, 1.12), opacity: 1 }], { duration: 900 });
      books.forEach(function (b, i) { if (i !== CENTER) run(b, [{ transform: atSlot(i, { z: -170 }), opacity: .3 }], { duration: 700 }); });
      await wait(250);
      // 3. swap to the open-able book at the same size and place
      ob.style.transform = obClosed(1.12, 230); ob.style.visibility = 'visible'; hero.style.opacity = 0;
      // 4. open and grow to fill the stage
      var grow = run(ob, [{ transform: obClosed(1.12, 230) }, { transform: 'translate3d(0,0,0) scale(1)' }], { duration: 1300 });
      books.forEach(function (b, i) { if (i !== CENTER) run(b, [{ opacity: .1 }], { duration: 600 }); });
      leaf0.style.zIndex = 5;
      await run(leaf0, [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(-180deg)' }], { duration: 1150, delay: 200, easing: 'cubic-bezier(.45,.05,.25,1)' });
      leaf0.style.zIndex = 3;
      await grow; await wait(1300);
      // 5. flip a page
      leaf1.style.zIndex = 6;
      await run(leaf1, [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(-180deg)' }], { duration: 950, easing: 'cubic-bezier(.45,.05,.25,1)' });
      await wait(1500);
      // 6. close and shrink back
      run(leaf1, [{ transform: 'rotateY(-180deg)' }, { transform: 'rotateY(0deg)' }], { duration: 620, easing: 'cubic-bezier(.5,0,.5,1)' });
      await wait(260); leaf0.style.zIndex = 7;
      var shut = run(leaf0, [{ transform: 'rotateY(-180deg)' }, { transform: 'rotateY(0deg)' }], { duration: 700, easing: 'cubic-bezier(.5,0,.5,1)' });
      await run(ob, [{ transform: 'translate3d(0,0,0) scale(1)' }, { transform: obClosed(1.12, 230) }], { duration: 950, easing: 'cubic-bezier(.65,0,.35,1)' });
      await shut; leaf0.style.zIndex = 3; leaf1.style.zIndex = 2;
      // 7. settle back into the row
      hero.getAnimations().forEach(function (a) { a.cancel(); });
      hero.style.transform = T(0, 0, 230, 0, 0, 1.12); hero.style.opacity = 1; ob.style.visibility = 'hidden';
      await Promise.all(books.map(function (b, i) { return run(b, [{ transform: atSlot(i), opacity: 1 }], { duration: 900, delay: i === CENTER ? 0 : 80 }); }));
    } catch (e) { /* animation cancelled by a resize or replay */ }
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
  }, { threshold: .6 }).observe(stage);
  if (replay) replay.addEventListener('click', function () { play(); });
  var rz; addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { if (!playing && started) finalState(); }, 200); });
})();
