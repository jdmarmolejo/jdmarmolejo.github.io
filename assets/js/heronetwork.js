/* =====================================================================
   heronetwork.js
   ---------------------------------------------------------------------
   Animated gene-regulatory network for the homepage hero.

   Model:
     - Nodes are genes with an ON/OFF state (a glow that eases toward it).
     - Directed edges are ACTIVATION (+) or REPRESSION (-). An active gene
       emits discrete "molecules" (signals) along its outgoing edges.
     - When a molecule reaches its target it switches that gene ON
       (activation) or OFF (repression), with a little flash — so waves of
       expression sweep across the circuit.
     - One gene carries a self-loop (negative autoregulation) and pulses.
     - A dash of spontaneous noise keeps the network alive; the cursor
       switches nearby genes ON.

   Dependency-free, retina/resize aware, pauses when off-screen, reads
   brand colours from CSS variables, and honours prefers-reduced-motion
   with a calmer (but still living) animation.
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
  var palette = { act: "#4dd6e0", rep: "#ff6b8e", text: "#e8edf2", bg: "#0a1c2f" };
  function readPalette() {
    var cs = getComputedStyle(document.documentElement);
    palette.act = (cs.getPropertyValue("--global-base-color").trim() || palette.act); // teal
    palette.rep = (cs.getPropertyValue("--global-link-color").trim() || palette.rep); // coral
    palette.text = (cs.getPropertyValue("--global-text-color").trim() || palette.text);
    palette.bg = (cs.getPropertyValue("--global-bg-color").trim() || palette.bg);
  }
  readPalette();
  if (window.MutationObserver) {
    new MutationObserver(readPalette).observe(document.documentElement, {
      attributes: true, attributeFilter: ["data-theme"],
    });
  }
  function withAlpha(col, alpha) {
    col = (col || "").trim();
    if (col[0] === "#") {
      var h = col.slice(1);
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      var n = parseInt(h, 16);
      return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + alpha + ")";
    }
    if (col.indexOf("rgb") === 0) {
      var inner = col.slice(col.indexOf("(") + 1, col.indexOf(")")).split(",").slice(0, 3).join(",");
      return "rgba(" + inner + "," + alpha + ")";
    }
    return col;
  }
  function signColor(sign, alpha) { return withAlpha(sign === "act" ? palette.act : palette.rep, alpha); }

  /* ------------------------- geometry / model ------------------------- */
  // Node layout in normalised [0,1] coordinates.
  var NODES = [
    { x: 0.28, y: 0.30 },
    { x: 0.62, y: 0.22 },
    { x: 0.82, y: 0.50 },
    { x: 0.60, y: 0.76 },
    { x: 0.24, y: 0.66 },
    { x: 0.46, y: 0.48 }, // hub, carries the self-loop
  ];
  // Directed, signed edges. [from, to, sign]. A from==to edge is a self-loop.
  var EDGES = [
    [0, 1, "act"],
    [1, 2, "rep"],
    [2, 3, "act"],
    [3, 4, "rep"],
    [4, 0, "act"],
    [5, 0, "act"],
    [5, 3, "rep"],
    [1, 5, "act"],
    [5, 5, "rep"], // negative autoregulation (self-control)
  ];

  var nodes = [];
  var molecules = [];
  var W = 0, H = 0, DPR = 1;
  var mouse = { x: -1e5, y: -1e5, active: false };
  var t = 0;
  var speedScale = reduceMotion ? 0.55 : 1;

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
    nodes = NODES.map(function (n, i) {
      return {
        bx: n.x, by: n.y,
        x: n.x * W, y: n.y * H,
        state: i % 2 === 0 ? 1 : 0, // start with a few genes ON
        glow: i % 2 === 0 ? 1 : 0.12,
        flash: 0,
        phase: Math.random() * Math.PI * 2,
        drift: 0.4 + Math.random() * 0.6,
      };
    });
  }

  function nodePixel(n) {
    var amp = reduceMotion ? 0.004 : 0.011;
    var dx = Math.cos(t * 0.15 * n.drift + n.phase) * amp;
    var dy = Math.sin(t * 0.13 * n.drift + n.phase * 1.3) * amp;
    var px = (n.bx + dx) * W;
    var py = (n.by + dy) * H;
    if (mouse.active && !reduceMotion) {
      var ddx = px - mouse.x, ddy = py - mouse.y;
      var d2 = ddx * ddx + ddy * ddy;
      var R = Math.min(W, H) * 0.26;
      if (d2 < R * R) {
        var d = Math.sqrt(d2) || 1;
        var f = (1 - d / R) * 20;
        px += (ddx / d) * f; py += (ddy / d) * f;
      }
    }
    n.x = px; n.y = py;
  }

  /* --------------------------- molecules ----------------------------- */
  function spawn(edge) {
    molecules.push({
      e: edge, p: 0,
      speed: (0.007 + Math.random() * 0.004) * speedScale,
      sign: edge[2],
      size: 2 + Math.random() * 1.4,
    });
  }

  function updateModel(dt) {
    // ease glow toward state; decay flashes
    for (var i = 0; i < nodes.length; i++) {
      var nd = nodes[i];
      nd.glow += (nd.state - nd.glow) * Math.min(1, 0.08 * dt);
      if (nd.flash > 0) nd.flash = Math.max(0, nd.flash - 0.05 * dt);
      // cursor switches nearby genes ON
      if (mouse.active) {
        var dx = nd.x - mouse.x, dy = nd.y - mouse.y;
        if (dx * dx + dy * dy < 900) { nd.state = 1; }
      }
    }

    // active genes emit signals along their outgoing edges
    for (var j = 0; j < EDGES.length; j++) {
      var src = nodes[EDGES[j][0]];
      if (src.glow > 0.55) {
        var rate = 0.03 * dt * (0.6 + src.glow);
        if (Math.random() < rate) spawn(EDGES[j]);
      }
    }

    // advance molecules; on arrival, switch the target gene
    for (var k = molecules.length - 1; k >= 0; k--) {
      var m = molecules[k];
      m.p += m.speed * dt;
      if (m.p >= 1) {
        var target = nodes[m.e[1]];
        target.state = m.sign === "act" ? 1 : 0;
        target.flash = 1;
        molecules.splice(k, 1);
      }
    }
    if (molecules.length > 160) molecules.splice(0, molecules.length - 160);

    // spontaneous basal activation so waves keep restarting
    if (Math.random() < 0.015 * dt) {
      var r = nodes[(Math.random() * nodes.length) | 0];
      r.state = 1; r.flash = Math.max(r.flash, 0.6);
    }
  }

  /* --------------------------- geometry ------------------------------ */
  function ctrlPoint(a, b) {
    return { x: (a.x + b.x) / 2 + (b.y - a.y) * 0.08, y: (a.y + b.y) / 2 - (b.x - a.x) * 0.08 };
  }
  function loopParams(n) {
    var r = Math.max(16, Math.min(W, H) * 0.05);
    return { cx: n.x + r * 1.1, cy: n.y - r * 1.3, r: r };
  }
  function pointOnEdge(e, p) {
    var a = nodes[e[0]], b = nodes[e[1]];
    if (e[0] === e[1]) {
      var lp = loopParams(a);
      var ang = -Math.PI * 0.5 + p * Math.PI * 2;
      return { x: lp.cx + Math.cos(ang) * lp.r, y: lp.cy + Math.sin(ang) * lp.r };
    }
    var c = ctrlPoint(a, b), q = 1 - p;
    return { x: q * q * a.x + 2 * q * p * c.x + p * p * b.x, y: q * q * a.y + 2 * q * p * c.y + p * p * b.y };
  }

  /* ----------------------------- draw -------------------------------- */
  function drawRegulatoryEnd(e) {
    // small glyph near the target end: arrowhead (activation) or bar (repression)
    if (e[0] === e[1]) return;
    var tip = pointOnEdge(e, 0.9), a = nodes[e[0]], b = nodes[e[1]];
    var c = ctrlPoint(a, b);
    var ang = Math.atan2(b.y - c.y, b.x - c.x);
    ctx.save();
    ctx.translate(tip.x, tip.y);
    ctx.rotate(ang);
    ctx.strokeStyle = signColor(e[2], 0.5);
    ctx.fillStyle = signColor(e[2], 0.5);
    ctx.lineWidth = 1.4;
    if (e[2] === "act") {
      ctx.beginPath(); ctx.moveTo(-5, -4); ctx.lineTo(2, 0); ctx.lineTo(-5, 4); ctx.closePath(); ctx.fill();
    } else {
      ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(0, 5); ctx.stroke();
    }
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // edges
    ctx.lineWidth = 1;
    for (var i = 0; i < EDGES.length; i++) {
      var e = EDGES[i];
      ctx.strokeStyle = signColor(e[2], 0.16);
      if (e[0] === e[1]) {
        var lp = loopParams(nodes[e[0]]);
        ctx.beginPath(); ctx.arc(lp.cx, lp.cy, lp.r, 0, Math.PI * 2); ctx.stroke();
      } else {
        var a = nodes[e[0]], b = nodes[e[1]], c = ctrlPoint(a, b);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(c.x, c.y, b.x, b.y); ctx.stroke();
      }
      drawRegulatoryEnd(e);
    }

    // molecules
    for (var k = 0; k < molecules.length; k++) {
      var m = molecules[k], pt = pointOnEdge(m.e, m.p), rad = m.size * 4;
      var g = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, rad);
      g.addColorStop(0, signColor(m.sign, 0.95));
      g.addColorStop(1, signColor(m.sign, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, rad, 0, Math.PI * 2); ctx.fill();
    }

    // nodes
    for (var j = 0; j < nodes.length; j++) {
      var n = nodes[j];
      var isHub = j === 5;
      var col = n.glow > 0.5 ? palette.act : palette.rep;
      var r = (isHub ? 8 : 6) + n.glow * 6;

      // flash ring when a gene has just switched
      if (n.flash > 0.01) {
        ctx.strokeStyle = withAlpha(col, n.flash * 0.7);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + (1 - n.flash) * 26, 0, Math.PI * 2);
        ctx.stroke();
      }

      // halo scales with ON-ness
      var haloR = r * (2.6 + n.glow * 1.8);
      var halo = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, haloR);
      halo.addColorStop(0, withAlpha(col, 0.15 + n.glow * 0.5));
      halo.addColorStop(1, withAlpha(col, 0));
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(n.x, n.y, haloR, 0, Math.PI * 2); ctx.fill();

      // core (dim outline when OFF, bright fill when ON)
      ctx.fillStyle = withAlpha(col, 0.25 + n.glow * 0.7);
      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = withAlpha(col, 0.5 + n.glow * 0.5);
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2); ctx.stroke();

      // little highlight
      ctx.fillStyle = withAlpha(palette.bg, 0.85);
      ctx.beginPath(); ctx.arc(n.x - r * 0.3, n.y - r * 0.3, r * 0.28, 0, Math.PI * 2); ctx.fill();
    }
  }

  /* ----------------------------- loop -------------------------------- */
  var running = false, last = 0;
  function frame(now) {
    if (!running) return;
    var dt = Math.min(2.5, (now - last) / 16.67 || 1);
    last = now;
    t += dt;
    window.__heroFrames = (window.__heroFrames || 0) + 1;
    for (var i = 0; i < nodes.length; i++) nodePixel(nodes[i]);
    updateModel(dt);
    draw();
    requestAnimationFrame(frame);
  }
  function start() { if (running) return; running = true; last = performance.now(); requestAnimationFrame(frame); }
  function stop() { running = false; }

  /* --------------------------- listeners ----------------------------- */
  window.addEventListener("resize", function () {
    resize(); initNodes();
    for (var i = 0; i < nodes.length; i++) nodePixel(nodes[i]);
    if (!running) draw();
  });
  canvas.addEventListener("pointermove", function (ev) {
    var rect = canvas.getBoundingClientRect();
    mouse.x = ev.clientX - rect.left; mouse.y = ev.clientY - rect.top; mouse.active = true;
  });
  canvas.addEventListener("pointerleave", function () { mouse.active = false; mouse.x = mouse.y = -1e5; });

  // Pause when scrolled out of view (perf) — but always run while visible.
  if (window.IntersectionObserver) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) start(); else stop(); });
    }, { threshold: 0 }).observe(canvas);
  }

  /* ------------------------------ boot ------------------------------- */
  resize();
  initNodes();
  for (var b = 0; b < nodes.length; b++) nodePixel(nodes[b]);
  draw();
  start(); // start immediately; the observer only pauses/resumes afterwards
})();
