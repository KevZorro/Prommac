/* ============================================================
   PROMMAC — scroll engine (vanilla)
   ============================================================ */
(function () {
  "use strict";

  var docEl = document.documentElement;
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var vh = window.innerHeight;
  var motion = 1;
  function readMotion() {
    var m = parseFloat(getComputedStyle(docEl).getPropertyValue("--motion"));
    motion = isNaN(m) ? 1 : m;
  }

  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var lerp  = function (a, b, t) { return a + (b - a) * t; };
  var easeOut   = function (t) { return 1 - Math.pow(1 - t, 3); };
  var easeInOut = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

  // progress of a section through its pinned stage
  function sceneProgress(el) {
    var r = el.getBoundingClientRect();
    var total = el.offsetHeight - vh;
    if (total <= 0) return 0;
    return clamp(-r.top / total, 0, 1);
  }

  /* ---------- HERO COORDS (ambient readouts) ---------- */
  (function buildCoords() {
    var c = document.getElementById("heroCoords");
    if (!c) return;
    var labels = [
      ["12%", "18%", "26.20 S"],  ["82%", "22%", "28.05 E"],
      ["8%",  "72%", "LAT -33.92"], ["86%", "68%", "LON 151.21"],
      ["46%", "12%", "GRID 04"],  ["70%", "86%", "SECTOR IND"],
      ["20%", "44%", "OPS LIVE"], ["78%", "48%", "20+ NODES"]
    ];
    labels.forEach(function (l) {
      var s = document.createElement("span");
      s.style.left = l[0]; s.style.top = l[1]; s.textContent = l[2];
      c.appendChild(s);
    });
  })();

  /* ---------- HERO kinetic GLOBAL ---------- */
  var hero      = document.querySelector(".hero");
  var heroWord  = document.getElementById("heroWord");
  var heroChars = heroWord ? [].slice.call(heroWord.querySelectorAll(".ch")) : [];
  var heroSub   = document.getElementById("heroSub");
  var heroWeare = document.getElementById("heroWeare");
  var heroTicker = document.getElementById("heroTicker");
  var heroCue   = document.querySelector(".hero-cue");
  var heroCoordsEl = document.getElementById("heroCoords");

  // precompute per-letter scatter vectors
  var scatter = heroChars.map(function (_, i) {
    var n   = heroChars.length;
    var dir = i - (n - 1) / 2;
    return {
      x: dir * 26,
      y: (i % 2 === 0 ? -1 : 1) * (40 + Math.abs(dir) * 14),
      r: dir * 22,
      s: 0.7
    };
  });

  function updateHero() {
    if (!hero) return;
    var p  = sceneProgress(hero);
    var pa = easeInOut(clamp(p / 0.55, 0, 1)) * motion;

    heroChars.forEach(function (ch, i) {
      var s  = scatter[i];
      var tx = s.x * pa, ty = s.y * pa, rot = s.r * pa;
      var sc = 1 + (s.s - 1) * pa;
      ch.style.transform = "translate(" + tx + "vw," + ty + "vh) rotate(" + rot + "deg) scale(" + sc + ")";
      ch.style.opacity   = (1 - clamp(pa * 1.25, 0, 1)).toFixed(3);
    });

    if (heroWeare) {
      heroWeare.style.opacity   = (1 - clamp(p / 0.25, 0, 1)).toFixed(3);
      heroWeare.style.transform = "translateY(" + (-30 * clamp(p / 0.3, 0, 1)) + "px)";
    }
    if (heroCoordsEl) heroCoordsEl.style.opacity = (0.45 * (1 - clamp(p / 0.5, 0, 1))).toFixed(3);

    // sub resolves 0.40 -> 0.72
    if (heroSub) {
      var ps = clamp((p - 0.40) / 0.32, 0, 1);
      heroSub.style.opacity   = ps.toFixed(3);
      heroSub.style.transform = "translateY(-50%) scale(" + lerp(0.86, 1, easeOut(ps)) + ")";
      heroSub.style.filter    = "blur(" + (1 - ps) * 8 + "px)";
    }

    // ticker + cue
    if (heroTicker) {
      var pt    = clamp((p - 0.72) / 0.2, 0, 1);
      heroTicker.style.opacity   = pt.toFixed(3);
      heroTicker.style.transform = "translateY(" + (1 - pt) * 30 + "px)";
      var cprog = easeOut(clamp((p - 0.72) / 0.22, 0, 1));
      for (var hc = 0; hc < heroCounters.length; hc++) renderCounter(heroCounters[hc], cprog);
    }
    if (heroCue) heroCue.style.opacity = (1 - clamp(p / 0.15, 0, 1)).toFixed(3);
    updateHeroGlobe(p);
  }

  /* ---------- MANTRA word reveal ---------- */
  var mantra      = document.querySelector(".mantra");
  var mantraQuote = document.getElementById("mantraQuote");
  var mantraAttr  = document.getElementById("mantraAttr");

  (function buildMantra() {
    if (!mantraQuote) return;
    var text = "Sometimes we win, and sometimes we learn, but we never lose.";
    var hl   = { "win,": 1, "learn,": 1, "never": 1, "lose.": 1 };
    text.split(" ").forEach(function (w) {
      var span       = document.createElement("span");
      span.className = "w" + (hl[w] ? " hl" : "");
      span.textContent = w + " ";
      mantraQuote.appendChild(span);
    });
  })();

  var mantraWords = mantraQuote ? [].slice.call(mantraQuote.querySelectorAll(".w")) : [];

  function updateMantra() {
    if (!mantra) return;
    var p      = sceneProgress(mantra);
    var active = clamp((p - 0.08) / 0.62, 0, 1) * mantraWords.length;
    mantraWords.forEach(function (w, i) { w.classList.toggle("on", i < active); });
    if (mantraAttr) {
      var pa = clamp((p - 0.74) / 0.18, 0, 1);
      mantraAttr.style.opacity   = pa.toFixed(3);
      mantraAttr.style.transform = "translateY(" + (1 - pa) * 20 + "px)";
    }
  }

  /* ---------- TRI horizontal ---------- */
  var tri     = document.querySelector(".tri");
  var triTrack = document.getElementById("triTrack");
  var triBar  = document.getElementById("triProgBar");
  var triDots = document.getElementById("triDots") ? [].slice.call(document.getElementById("triDots").children) : [];

  function updateTri() {
    if (!tri || !triTrack) return;
    var p = sceneProgress(tri);
    triTrack.style.transform = "translateX(" + (-200 * p) + "vw)";
    if (triBar) triBar.style.width = (p * 100) + "%";
    var idx = clamp(Math.round(p * 2), 0, 2);
    triDots.forEach(function (d, i) { d.classList.toggle("on", i === idx); });
  }

  /* ---------- GLOBE (wireframe + location dots) ---------- */
  function makeGlobe(g, pfx) {
    if (!g) return;
    var NS  = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 200 200");
    svg.setAttribute("width",  "100%");
    svg.setAttribute("height", "100%");
    svg.style.overflow = "visible";

    var ring = document.createElementNS(NS, "circle");
    ring.setAttribute("cx", 100); ring.setAttribute("cy", 100); ring.setAttribute("r", 86);
    ring.setAttribute("fill", "none"); ring.setAttribute("stroke", "var(--line)"); ring.setAttribute("stroke-width", "1");
    svg.appendChild(ring);

    var fill = document.createElementNS(NS, "circle");
    fill.setAttribute("cx", 100); fill.setAttribute("cy", 100); fill.setAttribute("r", 86);
    fill.setAttribute("fill", "color-mix(in srgb, var(--accent) 5%, transparent)");
    svg.appendChild(fill);

    var rot = document.createElementNS(NS, "g");
    rot.setAttribute("class", pfx + "-rot");
    rot.setAttribute("transform-origin", "100 100");
    svg.appendChild(rot);

    [-55, -28, 0, 28, 55].forEach(function (lat) {
      var e = document.createElementNS(NS, "ellipse");
      e.setAttribute("cx", 100);
      e.setAttribute("cy", 100 - 86 * Math.sin(lat * Math.PI / 180));
      e.setAttribute("rx", 86 * Math.cos(lat * Math.PI / 180));
      e.setAttribute("ry", Math.max(2, 86 * Math.cos(lat * Math.PI / 180) * 0.18));
      e.setAttribute("fill", "none"); e.setAttribute("stroke", "var(--line)"); e.setAttribute("stroke-width", ".7");
      svg.appendChild(e);
    });

    for (var k = 0; k < 6; k++) {
      var e2 = document.createElementNS(NS, "ellipse");
      e2.setAttribute("cx", 100); e2.setAttribute("cy", 100);
      e2.setAttribute("rx", Math.max(3, 86 * Math.abs(Math.cos(k / 6 * Math.PI))));
      e2.setAttribute("ry", 86);
      e2.setAttribute("fill", "none"); e2.setAttribute("stroke", "var(--line-2)"); e2.setAttribute("stroke-width", ".7");
      rot.appendChild(e2);
    }

    var pts = [
      [0.50, 0.30], [0.44, 0.44], [0.58, 0.40], [0.40, 0.62],
      [0.62, 0.66], [0.70, 0.52], [0.34, 0.40], [0.54, 0.74],
      [0.28, 0.55], [0.66, 0.30], [0.48, 0.55], [0.74, 0.62]
    ];
    var dotG = document.createElementNS(NS, "g");
    svg.appendChild(dotG);
    pts.forEach(function (pt, i) {
      var cx    = 100 + (pt[0] - 0.5) * 168;
      var cy    = 100 + (pt[1] - 0.5) * 168;
      var halo  = document.createElementNS(NS, "circle");
      halo.setAttribute("cx", cx); halo.setAttribute("cy", cy); halo.setAttribute("r", 5.5);
      halo.setAttribute("fill", "var(--accent)"); halo.setAttribute("opacity", "0");
      halo.setAttribute("class", pfx + "-halo"); halo.dataset.i = i;
      var d = document.createElementNS(NS, "circle");
      d.setAttribute("cx", cx); d.setAttribute("cy", cy); d.setAttribute("r", 2.4);
      d.setAttribute("fill", "var(--accent)"); d.setAttribute("opacity", "0");
      d.setAttribute("class", pfx + "-dot"); d.dataset.i = i;
      dotG.appendChild(halo); dotG.appendChild(d);
    });
    g.appendChild(svg);
  }

  makeGlobe(document.getElementById("globe"),     "g");
  makeGlobe(document.getElementById("heroGlobe"), "gh");

  var reach     = document.querySelector(".reach");
  var gDots     = [].slice.call(document.querySelectorAll(".g-dot"));
  var gHalos    = [].slice.call(document.querySelectorAll(".g-halo"));
  var globeRot  = document.querySelector(".g-rot");

  var heroGlobeEl  = document.getElementById("heroGlobe");
  var heroGlobeRot = document.querySelector(".gh-rot");
  var ghDots       = [].slice.call(document.querySelectorAll(".gh-dot"));
  var ghHalos      = [].slice.call(document.querySelectorAll(".gh-halo"));

  function updateHeroGlobe(p) {
    if (heroGlobeRot) heroGlobeRot.setAttribute("transform", "rotate(" + (performance.now() / 140 + p * 40) + " 100 100)");
    var appear = clamp(p / 0.35, 0, 1);
    for (var i = 0; i < ghDots.length; i++) {
      ghDots[i].setAttribute("opacity", (0.82 * appear).toFixed(3));
      var pulse = 0.5 + 0.5 * Math.sin(performance.now() / 700 + i * 1.3);
      ghHalos[i].setAttribute("opacity", (0.16 * appear * pulse).toFixed(3));
      ghHalos[i].setAttribute("r", (5.5 + 4 * (1 - pulse)).toFixed(2));
    }
    if (heroGlobeEl) {
      heroGlobeEl.style.opacity   = (lerp(0.48, 0, clamp((p - 0.45) / 0.4, 0, 1))).toFixed(3);
      heroGlobeEl.style.transform = "translate(-50%,-50%) scale(" + (1 + 0.35 * easeInOut(clamp(p / 0.8, 0, 1)) * motion) + ")";
    }
  }

  function updateReach() {
    if (!reach) return;
    var p = sceneProgress(reach);
    var n = gDots.length;
    gDots.forEach(function (d, i) {
      var t = clamp((p - (i / n) * 0.7) / 0.12, 0, 1);
      d.setAttribute("opacity", t.toFixed(3));
      d.setAttribute("r", (2.4 * t).toFixed(2));
    });
    gHalos.forEach(function (h, i) {
      var t     = clamp((p - (i / n) * 0.7) / 0.12, 0, 1);
      var pulse = t * (0.5 + 0.5 * Math.sin(performance.now() / 600 + i));
      h.setAttribute("opacity", (0.22 * pulse).toFixed(3));
      h.setAttribute("r", (5.5 + 5 * (1 - pulse)).toFixed(2));
    });
    if (globeRot) globeRot.setAttribute("transform", "rotate(" + (p * 60 + performance.now() / 220) + " 100 100)");
    // Reach counters are owned by animations.js (Anime.js count-up on enter).
  }

  /* ---------- INDUSTRIES grid ---------- */
  var industries = [
    "Petrochemical", "Oil & Gas", "Power & Energy", "Mining & Minerals", "Water",
    "Food & Beverage", "Pulp & Paper", "Renewable Energy", "Data Center MEP", "Other Industrial"
  ];

  (function buildInd() {
    var grid = document.getElementById("indGrid");
    if (!grid) return;
    industries.forEach(function (name, i) {
      var cell = document.createElement("div");
      cell.className = "ind-cell";
      cell.style.transitionDelay = (i % 5) * 55 + "ms";
      var no = "0" + (i + 1); no = no.slice(-2);
      cell.innerHTML =
        '<div class="no">' + no + '</div>' +
        '<div class="ic">' + iconSquare() + '</div>' +
        '<h4>' + name + '</h4>' +
        '<div class="arrow">&#8594;</div>';
      grid.appendChild(cell);
    });
  })();

  function iconSquare() {
    return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><circle cx="17.5" cy="17.5" r="3.5"/></svg>';
  }

  /* ---------- WHY list ---------- */
  var whys = [
    ["Safety as a Precondition",      "Every scope starts and ends with HSE. We plan for zero harm, brief every shift, and measure ourselves on getting people home safely."],
    ["Turnaround &amp; Shutdown Discipline", "Tightly sequenced execution where every discipline and contractor works to one integrated plan, so your window closes on schedule."],
    ["Quality Held to Standard",      "Work delivered under ISO 9001 systems and international benchmarks, with documented QA/QC at every hold point."],
    ["Global Reach, Local Crews",     "International engineering capability delivered by teams who understand your site, your permits and your regulators."],
    ["Engineering the Hard Scopes",   "The complex, high-consequence work others decline, delivered with the right method statements and competent people."],
    ["Built to Respond",              "24/7 emergency capability and the flexibility to mobilise quickly when your operation cannot wait."]
  ];

  (function buildWhy() {
    var list = document.getElementById("whyList");
    if (!list) return;
    whys.forEach(function (w, i) {
      var item = document.createElement("div");
      item.className = "why-item";
      var no = "0" + (i + 1); no = no.slice(-2);
      item.innerHTML = '<div class="n">' + no + '</div><div><h4>' + w[0] + '</h4><p>' + w[1] + '</p></div>';
      list.appendChild(item);
    });
  })();

  /* ---------- CLIENTS marquee ---------- */
  var clients = ["SASOL", "Glencore", "Sappi", "Mondi", "Air Liquide", "ADNOC", "Anglo Platinum", "Enaex", "Gautrain", "Microsoft", "Air Products", "Astron", "Scaw", "Sapref"];

  (function buildLogos() {
    var r1 = document.getElementById("logoRow1"), r2 = document.getElementById("logoRow2");
    if (!r1 || !r2) return;
    function fill(row, arr) {
      arr.concat(arr).forEach(function (name) {
        var chip = document.createElement("div");
        chip.className = "logo-chip";
        chip.textContent = name;
        row.appendChild(chip);
      });
    }
    fill(r1, clients.slice(0, 7));
    fill(r2, clients.slice(7));
  })();

  /* ---------- CAPABILITIES steps ---------- */
  var capSteps  = [].slice.call(document.querySelectorAll(".cap-step"));
  var capNum    = document.getElementById("capNum");
  var capTitle  = document.getElementById("capTitle");
  var capActive = -1;

  function updateCap() {
    if (!capSteps.length) return;
    var center = vh / 2, best = 0, bestD = Infinity;
    capSteps.forEach(function (s, i) {
      var r = s.getBoundingClientRect();
      var d = Math.abs((r.top + r.height / 2) - center);
      if (d < bestD) { bestD = d; best = i; }
    });
    if (best !== capActive) {
      capActive = best;
      capSteps.forEach(function (s, i) { s.classList.toggle("active", i === best); });
      var step = capSteps[best];
      // Animate the big number out, swap, then back in
      if (capNum) {
        capNum.classList.add("changing");
        setTimeout(function () {
          capNum.textContent = step.dataset.num;
          capNum.classList.remove("changing");
        }, 180);
      }
      if (capTitle) capTitle.innerHTML = step.dataset.title;
    }
  }

  /* ---------- COUNTERS (scroll-progress driven) + REVEALS ---------- */
  function renderCounter(el, prog) {
    var target = parseFloat(el.dataset.count);
    var suffix = el.dataset.suffix || "";
    var prefix = el.dataset.prefix || "";
    var plain  = el.dataset.plain === "1";
    var start  = plain ? Math.max(0, target - 18) : 0;
    var val    = Math.round(lerp(start, target, clamp(prog, 0, 1)));
    el.textContent = prefix + val + suffix;
  }

  var heroCounters  = [].slice.call(document.querySelectorAll(".hero-ticker [data-count]"));
  // Reveals: only the generic .reveal targets remain here. Industries cards and
  // the Why list are revealed by animations.js (Anime.js staggered, on enter).
  var reveals = [].slice.call(document.querySelectorAll(".reveal"));

  function inView(el, frac) {
    var r = el.getBoundingClientRect();
    if (r.height === 0 && r.width === 0) return false;
    return r.top < vh * (frac || 0.85) && r.bottom > vh * 0.05;
  }

  function updateReveals() {
    for (var i = reveals.length - 1; i >= 0; i--) {
      if (inView(reveals[i])) { reveals[i].classList.add("in"); reveals.splice(i, 1); }
    }
  }

  /* ---------- NAV + scroll progress ---------- */
  var nav        = document.getElementById("nav");
  var scrollProg = document.getElementById("scrollProg");

  function updateChrome() {
    var y = window.scrollY || window.pageYOffset;
    if (nav)        nav.classList.toggle("solid", y > vh * 0.6);
    if (scrollProg) {
      var max = docEl.scrollHeight - vh;
      scrollProg.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    }
  }

  /* ---------- MAIN LOOP ---------- */
  function frame() {
    updateChrome();
    updateHero();
    updateMantra();
    updateTri();
    updateReach();
    updateCap();
    updateReveals();
  }

  // Coalesce scroll events into one frame() per animation frame. Avoids running
  // the layout-reading update path multiple times between paints (scroll can fire
  // more than once per frame), which otherwise causes layout thrashing.
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { frame(); ticking = false; });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () { vh = window.innerHeight; readMotion(); frame(); });

  // Keep globe halos pulsing at idle (throttled to sections near viewport)
  function nearView(el) {
    if (!el) return false;
    var r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < vh;
  }
  function idle() {
    if (nearView(reach)) updateReach();
    if (nearView(hero))  updateHeroGlobe(sceneProgress(hero));
    requestAnimationFrame(idle);
  }

  readMotion();
  frame();
  // Autonomous (non-scroll) motion only runs when the user hasn't asked to reduce motion.
  // Scroll-driven transforms always run because the user controls them directly.
  if (!prefersReduced) requestAnimationFrame(idle);

  // Expose for live refresh hooks
  window.__prommacRefresh = function () { readMotion(); frame(); };

  /* ============================================================
     MOBILE MENU TOGGLE
     ============================================================ */
  (function initMobileMenu() {
    var burger   = document.getElementById("navBurger");
    var mobileMenu = document.getElementById("navMobile");
    if (!burger || !mobileMenu) return;

    var isOpen = false;

    function openMenu() {
      isOpen = true;
      mobileMenu.classList.add("open");
      burger.classList.add("open");
      burger.setAttribute("aria-expanded", "true");
      mobileMenu.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }

    function closeMenu() {
      isOpen = false;
      mobileMenu.classList.remove("open");
      burger.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
      mobileMenu.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    burger.addEventListener("click", function () {
      isOpen ? closeMenu() : openMenu();
    });

    // Close on any nav link click
    var links = [].slice.call(mobileMenu.querySelectorAll("a"));
    links.forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    // Close on Escape key
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen) closeMenu();
    });

    // Close on outside click
    mobileMenu.addEventListener("click", function (e) {
      if (e.target === mobileMenu) closeMenu();
    });
  })();

  /* ============================================================
     GRACEFUL IMAGE FALLBACK
     If a capability photo fails to load, hide it so the styled
     frame and caption stay clean (no broken-image icon).
     ============================================================ */
  [].slice.call(document.querySelectorAll(".ph img")).forEach(function (img) {
    img.addEventListener("error", function () { img.style.display = "none"; });
  });

})();
