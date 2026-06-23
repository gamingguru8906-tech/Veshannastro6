/**
 * smooth-scroll.js  —  Veshannastro
 * ============================================================
 * Butter-smooth anchor-link scrolling with:
 *   • Fixed-header offset (your 52 px #site-nav)
 *   • Mobile menu auto-close after nav link tap
 *   • Eased animation (ease-in-out cubic) via requestAnimationFrame
 *   • Accessibility: honours prefers-reduced-motion
 *   • URL hash update after scroll (correct browser history)
 *   • Works in Chrome, Firefox, Safari, Edge, iOS Safari
 *
 * HOW TO ADD THIS TO YOUR SITE:
 * Paste the ONE line below just before </body> in index.html:
 *
 *     <script src="smooth-scroll.js" defer></script>
 *
 * Or paste the JS directly — see setup-instructions.txt.
 * ============================================================
 */

(function () {
  'use strict';

  /* ── CONFIG ────────────────────────────────────────────────
     NAV_HEIGHT: height of your fixed #site-nav in px.
     Matches the 52px set in your CSS. Adjust if you change it.
     EXTRA_OFFSET: breathing room below the nav (px).
     DURATION_MS: animation duration in milliseconds.         */
  var NAV_HEIGHT    = 52;
  var EXTRA_OFFSET  = 16;
  var DURATION_MS   = 700;   /* 700 ms feels silky; raise for slower glide */
  var TOTAL_OFFSET  = NAV_HEIGHT + EXTRA_OFFSET;   /* 68 px */

  /* ── EASING FUNCTION ───────────────────────────────────────
     easeInOutCubic produces a smooth acceleration and
     deceleration — the "butter" feel. It starts slow,
     speeds up in the middle, then eases to a gentle stop.    */
  function easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /* ── CORE SCROLL FUNCTION ──────────────────────────────────
     Animates window scroll from current position to
     targetY using requestAnimationFrame.
     callback() fires when the scroll animation completes.    */
  function smoothScrollTo(targetY, callback) {
    var startY     = window.pageYOffset;
    var distance   = targetY - startY;
    var startTime  = null;

    /* If the user prefers reduced motion, skip animation     */
    var prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReduced || distance === 0) {
      window.scrollTo(0, targetY);
      if (callback) callback();
      return;
    }

    function step(currentTime) {
      if (!startTime) startTime = currentTime;
      var elapsed  = currentTime - startTime;
      var progress = Math.min(elapsed / DURATION_MS, 1);   /* 0 → 1 */
      var eased    = easeInOutCubic(progress);

      window.scrollTo(0, startY + distance * eased);

      if (progress < 1) {
        requestAnimationFrame(step);   /* keep animating */
      } else {
        if (callback) callback();      /* animation complete */
      }
    }

    requestAnimationFrame(step);
  }

  /* ── CALCULATE TARGET Y ────────────────────────────────────
     Gets the vertical position of a target element,
     subtracting the fixed nav offset so the section
     title is never hidden behind the header.                 */
  function getTargetY(el) {
    var rect = el.getBoundingClientRect();
    return rect.top + window.pageYOffset - TOTAL_OFFSET;
  }

  /* ── CLOSE MOBILE MENU ─────────────────────────────────────
     Mirrors what your existing code does when a mobile nav
     link is tapped: collapses the mobile drawer.             */
  function closeMobileMenu() {
    var hamburger   = document.getElementById('nav-hamburger');
    var mobileMenu  = document.getElementById('nav-mobile-menu');
    if (hamburger)  hamburger.classList.remove('open');
    if (mobileMenu) mobileMenu.classList.remove('open');
  }

  /* ── HANDLE ANCHOR CLICK ───────────────────────────────────
     Intercepts clicks on any <a href="#something"> link.
     Prevents the default browser instant-jump, then runs
     our smooth animation instead.                            */
  function handleAnchorClick(e) {
    var link = e.currentTarget;
    var href = link.getAttribute('href');

    /* Only handle hash links that target an element on THIS page */
    if (!href || href === '#' || href.charAt(0) !== '#') return;

    var targetId = href.slice(1);   /* strip the '#' */
    var target   = document.getElementById(targetId);
    if (!target) return;

    e.preventDefault();

    /* Close mobile menu first (if open) */
    closeMobileMenu();

    var targetY = getTargetY(target);

    smoothScrollTo(targetY, function () {
      /* After scroll completes: update URL hash without
         triggering another scroll jump.                       */
      if (history.pushState) {
        history.pushState(null, '', '#' + targetId);
      } else {
        /* Fallback for very old browsers */
        window.location.hash = '#' + targetId;
      }
    });
  }

  /* ── ATTACH LISTENERS ──────────────────────────────────────
     Finds ALL anchor links on the page (including mobile
     nav links) and attaches our smooth scroll handler.       */
  function attachListeners() {
    var anchors = document.querySelectorAll('a[href^="#"]');
    anchors.forEach(function (anchor) {
      /* Skip "Book Now" style links that open a modal
         (they have onclick handlers that call preventDefault) */
      anchor.addEventListener('click', handleAnchorClick);
    });
  }

  /* ── HANDLE INITIAL HASH ON PAGE LOAD ─────────────────────
     If someone loads example.com/#services, the browser
     jumps instantly. We smooth-scroll to it instead.         */
  function handleInitialHash() {
    var hash = window.location.hash;
    if (!hash || hash === '#') return;

    var targetId = hash.slice(1);
    var target   = document.getElementById(targetId);
    if (!target) return;

    /* Small delay so the page has fully painted before scroll */
    setTimeout(function () {
      var targetY = getTargetY(target);
      smoothScrollTo(targetY);
    }, 200);
  }

  /* ── INIT ──────────────────────────────────────────────────
     Run after the DOM is fully parsed.                       */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      attachListeners();
      handleInitialHash();
    });
  } else {
    /* DOM already ready (script loaded with defer or at bottom) */
    attachListeners();
    handleInitialHash();
  }

})();
