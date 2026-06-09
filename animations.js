/* ============================================================
   PROMMAC — Motion layer (Anime.js v4)
   ------------------------------------------------------------
   Professional, industrial, performance-conscious motion.
   - transform + opacity only (no layout properties)
   - IntersectionObserver, one-shot, observers disconnect after firing
   - prefers-reduced-motion fully short-circuits every animation
   - durations <= 640ms (counters are the documented exception)
   - degrades safely: hidden states are gated behind html.anim-on,
     which is only added after a successful module import, so a CDN
     failure or disabled JS leaves all content visible.

   This is the vanilla-ESM equivalent of the requested
   src/lib/animations.ts + src/hooks/useInViewAnimation.ts.
   ============================================================ */

import {
  animate,
  stagger,
  createTimeline,
  svg,
  utils,
} from "https://cdn.jsdelivr.net/npm/animejs@4.4.1/+esm";

/* ---- Shared tokens ------------------------------------------------ */
// Decelerating ease-out, no overshoot/bounce. Matches the site's --ease.
const EASE = "cubicBezier(0.16, 1, 0.3, 1)";
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ============================================================
   UTILITY: one-shot in-view trigger (the "useInViewAnimation")
   Fires `onEnter` once when `el` crosses the threshold, then
   disconnects. Returns the observer so callers can tear down early.
   ============================================================ */
function inView(el, onEnter, opts = {}) {
  if (!el) return null;
  const { threshold = 0.2, rootMargin = "0px 0px -8% 0px" } = opts;
  const io = new IntersectionObserver((entries, obs) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        onEnter(entry.target);
        obs.disconnect();
        break;
      }
    }
  }, { threshold, rootMargin });
  io.observe(el);
  return io;
}

/* ============================================================
   UTILITY: staggered reveal (opacity + translateY + optional scale)
   ============================================================ */
function revealStagger(targets, opts = {}) {
  const { y = 18, scale = null, delay = 65, duration = 560 } = opts;
  const params = {
    opacity: [0, 1],
    translateY: [y, 0],
    duration,
    ease: EASE,
    delay: stagger(delay),
  };
  if (scale != null) params.scale = [scale, 1];
  return animate(targets, params);
}

/* ============================================================
   UTILITY: number count-up
   Honors the existing data-count / data-prefix / data-suffix /
   data-plain semantics so it matches scroll.js renderCounter.
   Counters intentionally run longer than 640ms: a count that
   resolves too fast reads as a flicker, not a measured climb.
   ============================================================ */
function countUp(el, opts = {}) {
  const target = parseFloat(el.dataset.count);
  if (Number.isNaN(target)) return null;
  const { duration = 1300 } = opts;
  const suffix = el.dataset.suffix || "";
  const prefix = el.dataset.prefix || "";
  const plain = el.dataset.plain === "1";
  const from = plain ? Math.max(0, target - 18) : 0;
  const fmt = (v) => prefix + Math.round(v) + suffix;

  if (reduce) { el.textContent = fmt(target); return null; }

  const proxy = { v: from };
  el.textContent = fmt(from);
  return animate(proxy, {
    v: target,
    duration,
    ease: "out(3)",
    onUpdate: () => { el.textContent = fmt(proxy.v); },
  });
}

/* ============================================================
   UTILITY: SVG line draw-on (blueprint-style)
   Sets the strokes undrawn immediately and returns a play() that
   draws them on. Splitting setup from play avoids a flash: targets
   are hidden at boot, drawn only when the section enters view.
   ============================================================ */
function drawOn(targets, opts = {}) {
  const { delay = 70, duration = 640 } = opts;
  const drawables = svg.createDrawable(targets);
  utils.set(drawables, { draw: "0 0" });          // start undrawn
  return () => animate(drawables, {
    draw: "0 1",
    duration,
    ease: EASE,
    delay: stagger(delay),
  });
}

/* ============================================================
   SECTION WIRING
   ============================================================ */

/* 1) HERO — one-shot engineered intro, then hand off to scroll.js.
      Only runs at the top of the page; cancels on first scroll so the
      kinetic GLOBAL scroll sequence (owned by scroll.js) takes over. */
function heroIntro() {
  const weare = document.getElementById("heroWeare");
  const chars = document.querySelectorAll(".hero-word .ch");
  if (!chars.length || window.scrollY > 4) return;

  utils.set(weare, { opacity: 0, translateY: -8 });
  utils.set(chars, { opacity: 0, translateY: 26 });

  const tl = createTimeline({ defaults: { ease: EASE } });
  tl.add(weare, { opacity: 1, translateY: 0, duration: 460 }, 0)
    .add(chars, { opacity: 1, translateY: 0, duration: 500, delay: stagger(34) }, 120);

  let done = false;
  tl.then(() => { done = true; });
  // If the user scrolls mid-intro, stop and let scroll.js drive the letters.
  window.addEventListener("scroll", () => { if (!done) tl.pause(); }, { passive: true, once: true });
}

/* 2) SERVICE / CONTENT CARDS — stagger in on enter. */
function cardReveals() {
  const indGrid = document.getElementById("indGrid");
  if (indGrid) {
    const cells = indGrid.querySelectorAll(".ind-cell");
    inView(indGrid, () => revealStagger(cells, { y: 22, scale: 0.985, delay: 55, duration: 560 }), { threshold: 0.14 });
  }
  const whyList = document.getElementById("whyList");
  if (whyList) {
    const items = whyList.querySelectorAll(".why-item");
    inView(whyList, () => revealStagger(items, { y: 20, delay: 60, duration: 560 }), { threshold: 0.12 });
  }
}

/* 3) STATISTICS — count up when the stats block enters view. */
function statCounters() {
  const reachStats = document.querySelector(".reach-stats");
  if (!reachStats) return;
  const nums = [].slice.call(reachStats.querySelectorAll("[data-count]"));
  const fmt = (el, v) => (el.dataset.prefix || "") + v + (el.dataset.suffix || "");

  if (reduce) {
    // No motion: show final values immediately, no observer.
    nums.forEach((el) => { el.textContent = fmt(el, parseFloat(el.dataset.count)); });
    return;
  }
  // Reset to start values now (module loaded); the section is far below the
  // fold so this is never visible, and it guarantees a clean 0 -> target climb.
  nums.forEach((el) => {
    const target = parseFloat(el.dataset.count);
    const from = el.dataset.plain === "1" ? Math.max(0, target - 18) : 0;
    el.textContent = fmt(el, from);
  });
  inView(reachStats, () => nums.forEach((el) => countUp(el)), { threshold: 0.5 });
}

/* 4) INDUSTRIAL SVG ACCENT — credentials icons draw on like line work,
      labels rise in behind them. */
function trustBarAccent() {
  const bar = document.querySelector(".trust-bar");
  if (!bar) return;
  const strokes = bar.querySelectorAll(".t-icon svg *");
  const labels = bar.querySelectorAll(".t-label");
  const playDraw = drawOn(strokes, { delay: 80, duration: 640 });
  inView(bar, () => {
    playDraw();
    animate(labels, {
      opacity: [0, 1],
      translateY: [8, 0],
      duration: 520,
      ease: EASE,
      delay: stagger(80, { start: 140 }),
    });
  }, { threshold: 0.3 });
}

/* 5) CTA — headline, copy and buttons settle in on enter. */
function ctaReveal() {
  const cta = document.querySelector(".cta");
  if (!cta) return;
  const heading = cta.querySelector("h2");
  const copy = cta.querySelector(".wrap > p");
  const btns = cta.querySelectorAll(".cta-actions .btn, .cta-actions .btn-outline");
  inView(cta, () => {
    const tl = createTimeline({ defaults: { ease: EASE } });
    tl.add(heading, { opacity: [0, 1], translateY: [20, 0], duration: 560 }, 0)
      .add(copy, { opacity: [0, 1], translateY: [16, 0], duration: 520 }, 140)
      .add(btns, { opacity: [0, 1], translateY: [14, 0], duration: 500, delay: stagger(90) }, 240);
  }, { threshold: 0.25 });
}

/* ============================================================
   BOOT
   ============================================================ */
function boot() {
  if (reduce) {
    // Honor the user's setting: snap everything to its final state, no motion.
    statCounters();          // sets counters to final values (reduce branch)
    return;
  }
  // Mark the document so CSS applies the pre-animation hidden states only when
  // motion is on AND this module actually loaded.
  document.documentElement.classList.add("anim-on");

  heroIntro();
  cardReveals();
  statCounters();
  trustBarAccent();
  ctaReveal();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
