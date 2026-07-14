/* =====================================================================
   hero-network.js
   ---------------------------------------------------------------------
   Lightweight, dependency-free animation for the homepage hero.

   Concept (tied to the site owner's research):
     A small gene-regulatory network. Nodes are "genes" whose expression
     level performs a stochastic (mean-reverting) walk, modulating their
     glow. Along the directed edges, discrete "molecules" are emitted as
     a Poisson-like process and travel from source to target, visualising
     noisy signal / information transfer between genes.

   Design goals:
     - No external libraries. ~ a few KB.
     - Retina-aware, resize-aware, pauses when off-screen.
     - Honours prefers-reduced-motion (renders a single static frame).
     - Reads brand colours from CSS custom properties, so it re-themes
       automatically when the site switches light/dark.
     - Gentle mouse interaction (parallax + local excitation).
   ===================================================================== */
(function () {
  "use strict";

  var canvas = document.getElementById("hero-canvas");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");

  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- palette (read from CSS variables, re-read on theme change) ---- */
  var palette = { accentA: "#4dd6e0", accentB: "#ff6b8e", text: "#e8edf2", bg: "#0a1c2f" };

  function readPalette() {
    var cs = getComputedStyle(document.documentElement);
    function pick(varName, fallback) {
      var v = cs.getPropertyValue(varName).trim();
      return v || fallback;
    }
    palette.accentA = pick("--global-base-color", palette.accentA); // teal
    palette.accentB = pick("--global-link-color", palette.accentB); // coral
    palette.text = pick("--global-text-color", palette.text);
    palette.bg = pick("--global-bg-color", palette.bg);
  }
  readPalette();

  // Re-read palette when the theme attribute flips.
  if (window.MutationObserver) {
    new MutationObserver(readPalette).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
  }

  /* ------------------------- geometry / model ------------------------- */
  // Node layout in normalised [0,1] coordinates. A repressilator-style
  // ring (0->1->2->0) plus a couple of feed-forward branches, so the
  // graph reads as a real little circuit rather than random dots.
  var NODES = [
    { x: 0.28, y: 0.30, c: "A" },
    { x: 0.62, y: 0.22, c: "B" },
    { x: 0.80, y: 0.52, c: "A" },
    { x: 0.58, y: 0.74, c: "B" },
    { x: 0.24, y: 0.66, c: "A" },
    { x: 0.46, y: 0.48, c: "B" }, // hub
  ];
  // Directed edges [from, to]. Include the central hub connections.
  var EDGES = [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 0], // outer ring
    [5, 0], [5, 2], [5, 3], [1, 5],          // hub interactions
  ];

  var nodes = [];
  var molecules = [];
  var W = 0, H = 0, DPR = 1;
  var mouse = { x: -1e4, y: -1e4, active: false };
  var t = 0;

  function accent(kind, alpha) {
    var col = kind === "A" ? palette.accentA : palette.accentB;
    return withAlpha(col, alpha);
  }

  // Convert a #rrggbb / rgb() colour + alpha into an rgba() string.
  function withAlpha(col, alpha) {
    col = col.trim();
    if (col[0] === "#") {
      var h = col.slice(1);
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      var n = parseInt(h, 16);
      return (
        "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + alpha + ")"
      );
    }
    if (col.indexOf("rgb") === 0) {
      var inner = col.slice(col.indexOf("(") + 1, col.indexOf(")"));
      var parts = inner.split(",").slice(0, 3).join(",");
      return "rgba(" + parts + "," + alpha + ")";
    }
    return col;
  }

  /* ----------------------------- sizing ------------------------------ */
  function resize() {
    var rect = canvas.getBoundingClientRect();
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function initNodes() {
    nodes = NODES.map(function (n) {
      return {
        bx: n.x, by: n.y,          // base normalised position
        x: n.x * W, y: n.y * H,    // pixel position (updated each frame)
        c: n.c,
        expr: 0.5 + Math.random() * 0.3, // expression level (glow)
        phase: Math.random() * Math.PI * 2,
        drift: 0.4 + Math.random() * 0.6,
      };
    });
  }

  function nodePixel(n, i) {
    // slow organic drift so the circuit feels alive
    var dx = Math.cos(t * 0.15 * n.drift + n.phase) * 0.012;
    var dy = Math.sin(t * 0.13 * n.drift + n.phase * 1.3) * 0.012;
    var px = (n.bx + dx) * W;
    var py = (n.by + dy) * H;
    // gentle parallax repulsion from the cursor
    if (mouse.active) {
      var ddx = px - mouse.x, ddy = py - mouse.y;
      var d2 = ddx * ddx + ddy * ddy;
      var R = Math.min(W, H) * 0.28;
      if (d2 < R * R) {
        var d = Math.sqrt(d2) || 1;
        var f = (1 - d / R) * 22;
        px += (ddx / d) * f;
        py += (ddy / d) * f;
      }
    }
    n.x = px;
    n.y = py;
  }

  /* --------------------------- molecules ----------------------------- */
  function spawnMolecule(edge) {
    var from = nodes[edge[0]];
    molecules.push({
      e: edge,
      p: 0, // progress 0..1 along the edge
      speed: 0.006 + Math.random() * 0.006,
      c: from.c,
      size: 1.6 + Math.random() * 1.4,
    });
  }

  function updateMolecules(dt) {
    for (var i = molecules.length - 1; i >= 0; i--) {
      var m = molecules[i];
      m.p += m.speed * dt;
      if (m.p >= 1) {
        // arrival "excites" the target gene a little
        var target = nodes[m.e[1]];
        target.expr = Math.min(1, target.expr + 0.12);
        molecules.splice(i, 1);
      }
    }
    // Poisson-like emission along every edge; excited / mouse-near
    // source nodes fire more often (visualises noisy transcription).
    for (var j = 0; j < EDGES.length; j++) {
      var src = nodes[EDGES[j][0]];
      var rate = 0.012 + src.expr * 0.03;
      if (Math.random() < rate * dt) spawnMolecule(EDGES[j]);
    }
    if (molecules.length > 140) molecules.splice(0, molecules.length - 140);
  }

  function updateExpression(dt) {
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      // Ornstein-Uhlenbeck-ish: revert to 0.5 with stochastic kicks.
      n.expr += (0.5 - n.expr) * 0.02 * dt + (Math.random() - 0.5) * 0.06 * dt;
      // cursor proximity raises expression (local excitation)
      if (mouse.active) {
        var dx = n.x - mouse.x, dy = n.y - mouse.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        var R = Math.min(W, H) * 0.22;
        if (d < R) n.expr = Math.min(1, n.expr + (1 - d / R) * 0.04 * dt);
      }
      n.expr = Math.max(0.12, Math.min(1, n.expr));
    }
  }

  /* ----------------------------- draw -------------------------------- */
  function pointOnEdge(e, p) {
    var a = nodes[e[0]], b = nodes[e[1]];
    // slight quadratic bow so molecules glide on a curve, not a straight line
    var mx = (a.x + b.x) / 2 + (b.y - a.y) * 0.08;
    var my = (a.y + b.y) / 2 - (b.x - a.x) * 0.08;
    var q = 1 - p;
    return {
      x: q * q * a.x + 2 * q * p * mx + p * p * b.x,
      y: q * q * a.y + 2 * q * p * my + p * p * b.y,
    };
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // edges
    ctx.lineWidth = 1;
    for (var i = 0; i < EDGES.length; i++) {
      var a = nodes[EDGES[i][0]], b = nodes[EDGES[i][1]];
      var mx = (a.x + b.x) / 2 + (b.y - a.y) * 0.08;
      var my = (a.y + b.y) / 2 - (b.x - a.x) * 0.08;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(mx, my, b.x, b.y);
      ctx.strokeStyle = withAlpha(palette.text, 0.14);
      ctx.stroke();
    }

    // molecules (travelling signals) with a soft glow
    for (var k = 0; k < molecules.length; k++) {
      var m = molecules[k];
      var pt = pointOnEdge(m.e, m.p);
      var glow = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, m.size * 4);
      glow.addColorStop(0, accent(m.c, 0.9));
      glow.addColorStop(1, accent(m.c, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, m.size * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // nodes (genes) — glow scales with expression level
    for (var j = 0; j < nodes.length; j++) {
      var n = nodes[j];
      var base = 6 + (j === 5 ? 3 : 0);
      var r = base + n.expr * 5;
      var haloR = r * 3.4;
      var halo = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, haloR);
      halo.addColorStop(0, accent(n.c, 0.35 + n.expr * 0.4));
      halo.addColorStop(1, accent(n.c, 0));
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(n.x, n.y, haloR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = accent(n.c, 0.95);
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = withAlpha(palette.bg, 0.9);
      ctx.beginPath();
      ctx.arc(n.x - r * 0.28, n.y - r * 0.28, r * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* ----------------------------- loop -------------------------------- */
  var running = false;
  var last = 0;

  function frame(now) {
    if (!running) return;
    var dt = Math.min(2.2, (now - last) / 16.67 || 1); // ~frames elapsed
    last = now;
    t += dt;
    for (var i = 0; i < nodes.length; i++) nodePixel(nodes[i], i);
    updateExpression(dt);
    updateMolecules(dt);
    draw();
    requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
  }

  /* --------------------------- listeners ----------------------------- */
  window.addEventListener("resize", function () {
    resize();
    initNodes();
    for (var i = 0; i < nodes.length; i++) nodePixel(nodes[i], i);
    if (!running) draw();
  });

  canvas.addEventListener("pointermove", function (ev) {
    var rect = canvas.getBoundingClientRect();
    mouse.x = ev.clientX - rect.left;
    mouse.y = ev.clientY - rect.top;
    mouse.active = true;
  });
  canvas.addEventListener("pointerleave", function () {
    mouse.active = false;
    mouse.x = mouse.y = -1e4;
  });

  // Pause when the hero scrolls out of view (saves battery/CPU).
  if (window.IntersectionObserver) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (reduceMotion) return;
        if (e.isIntersecting) start();
        else stop();
      });
    }, { threshold: 0.05 }).observe(canvas);
  }

  /* ------------------------------ boot ------------------------------- */
  resize();
  initNodes();
  for (var b = 0; b < nodes.length; b++) nodePixel(nodes[b], b);

  if (reduceMotion) {
    // seed a few molecules so the static frame still reads as a network
    for (var s = 0; s < EDGES.length; s++) {
      spawnMolecule(EDGES[s]);
      molecules[molecules.length - 1].p = Math.random();
    }
    updateMolecules(0);
    draw();
  } else {
    draw();
    if (!window.IntersectionObserver) start();
  }
})();
