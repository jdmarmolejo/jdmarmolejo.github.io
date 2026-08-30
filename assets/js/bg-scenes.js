/* =====================================================================
   bg-scenes.js
   ---------------------------------------------------------------------
   A small library of subtle, biologically-inspired / mathematically-
   grounded background animations, used as a fixed backdrop on content
   pages (behind everything, pointer-events: none).

   Each page opts in via a `data-scene` attribute on
   <canvas id="bg-scene" data-scene="...">, set from the page's
   `bg_scene:` front-matter field. Four scenes are available:

     - "diffusion" : molecules performing overdamped Langevin dynamics
                     (a Wiener process with weak friction) — the same
                     kind of stochastic motion behind the chemical
                     master equation / linear-noise approximation.
     - "turing"    : a Gray–Scott reaction-diffusion system — the
                     mathematical model (Turing, 1952) behind
                     biological pattern formation (spots, stripes).
     - "voronoi"   : a spatial tessellation of drifting seed points —
                     an idealised cross-section of tissue, and a
                     classic object in computational geometry.
     - "signal"    : a handful of Ornstein–Uhlenbeck processes drawn
                     as scrolling traces — noisy signals over time,
                     like fluctuating gene-expression trajectories.

   Design goals: dependency-free, retina/resize aware, reads brand
   colours from CSS variables, honours prefers-reduced-motion, and
   pauses when the tab isn't visible.
   ===================================================================== */
(function () {
  "use strict";

  var canvas = document.getElementById("bg-scene");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var sceneName = canvas.dataset.scene;
  if (!sceneName) return;

  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var speedScale = reduceMotion ? 0.4 : 1;

  /* ------------------------- palette (theme-aware) -------------------- */
  var palette = { a: "#4dd6e0", b: "#ff6b8e", text: "#e8edf2", bg: "#0a1c2f" };
  function readPalette() {
    var cs = getComputedStyle(document.documentElement);
    palette.a = cs.getPropertyValue("--global-base-color").trim() || palette.a;
    palette.b = cs.getPropertyValue("--global-link-color").trim() || palette.b;
    palette.text = cs.getPropertyValue("--global-text-color").trim() || palette.text;
    palette.bg = cs.getPropertyValue("--global-bg-color").trim() || palette.bg;
  }
  readPalette();
  if (window.MutationObserver) {
    new MutationObserver(readPalette).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
  }
  function parseColor(col) {
    col = (col || "").trim();
    if (col[0] === "#") {
      var h = col.slice(1);
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      var n = parseInt(h, 16);
      return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    }
    if (col.indexOf("rgb") === 0) {
      var inner = col
        .slice(col.indexOf("(") + 1, col.indexOf(")"))
        .split(",")
        .slice(0, 3)
        .map(function (s) { return parseFloat(s); });
      return { r: inner[0], g: inner[1], b: inner[2] };
    }
    return { r: 255, g: 255, b: 255 };
  }
  function withAlpha(col, alpha) {
    var c = parseColor(col);
    return "rgba(" + c.r + "," + c.g + "," + c.b + "," + alpha + ")";
  }

  /* ------------------------------ canvas ------------------------------ */
  var W = 0, H = 0, DPR = 1, t = 0;
  function resize() {
    W = Math.max(1, window.innerWidth);
    H = Math.max(1, window.innerHeight);
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  var step = null;      // set by the active scene: function(dt)
  var onResize = null;  // optional: function() called after a resize

  /* ===================================================================
     SCENE 1 — diffusion: overdamped Langevin dynamics
     dv = -friction * v * dt + sigma * dW   (Euler–Maruyama step)
     =================================================================== */
  function initDiffusion() {
    function makeParticles() {
      var n = Math.min(60, Math.max(18, Math.round((W * H) / 26000)));
      var parts = [];
      for (var i = 0; i < n; i++) {
        parts.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          r: 1.5 + Math.random() * 2,
          c: i % 2 === 0 ? "a" : "b",
        });
      }
      return parts;
    }
    var parts = makeParticles();

    onResize = function () { parts = makeParticles(); };

    step = function (dt) {
      var linkDist = Math.min(W, H) * 0.1;
      ctx.clearRect(0, 0, W, H);

      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.vx += (-0.02 * p.vx + (Math.random() - 0.5) * 0.055) * dt;
        p.vy += (-0.02 * p.vy + (Math.random() - 0.5) * 0.055) * dt;
        p.x += p.vx * dt * speedScale;
        p.y += p.vy * dt * speedScale;
        if (p.x < -20) p.x = W + 20; else if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; else if (p.y > H + 20) p.y = -20;
      }

      // transient "collision" links between nearby molecules
      ctx.lineWidth = 1;
      for (var i2 = 0; i2 < parts.length; i2++) {
        for (var j = i2 + 1; j < parts.length; j++) {
          var dx = parts[i2].x - parts[j].x, dy = parts[i2].y - parts[j].y;
          var d2 = dx * dx + dy * dy;
          if (d2 < linkDist * linkDist) {
            var d = Math.sqrt(d2) || 1;
            ctx.strokeStyle = withAlpha(palette.a, (1 - d / linkDist) * 0.14);
            ctx.beginPath();
            ctx.moveTo(parts[i2].x, parts[i2].y);
            ctx.lineTo(parts[j].x, parts[j].y);
            ctx.stroke();
          }
        }
      }

      for (var k = 0; k < parts.length; k++) {
        var q = parts[k];
        var col = q.c === "a" ? palette.a : palette.b;
        var haloR = q.r * 5;
        var g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, haloR);
        g.addColorStop(0, withAlpha(col, 0.5));
        g.addColorStop(1, withAlpha(col, 0));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(q.x, q.y, haloR, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = withAlpha(col, 0.75);
        ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2); ctx.fill();
      }
    };
  }

  /* ===================================================================
     SCENE 2 — turing: Gray–Scott reaction-diffusion
       du/dt = Du·lap(u) - u v^2 + f(1-u)
       dv/dt = Dv·lap(v) + u v^2 - (f+k) v
     "Mitosis"-type parameters: patterns keep budding and splitting,
     so the scene never fully settles.
     =================================================================== */
  function initTuring() {
    var gw = 108, gh = Math.max(34, Math.min(84, Math.round(gw * (H / W))));
    var n = gw * gh;
    var u = new Float32Array(n), v = new Float32Array(n);
    var u2 = new Float32Array(n), v2 = new Float32Array(n);
    for (var i = 0; i < n; i++) u[i] = 1;

    function seedBlob() {
      var cx = (Math.random() * gw) | 0, cy = (Math.random() * gh) | 0;
      var rad = 3 + Math.random() * 4;
      for (var y = -rad; y <= rad; y++) {
        for (var x = -rad; x <= rad; x++) {
          if (x * x + y * y > rad * rad) continue;
          var xi = ((cx + x) % gw + gw) % gw, yi = ((cy + y) % gh + gh) % gh;
          var idx = yi * gw + xi;
          u[idx] = 0.5; v[idx] = 0.25;
        }
      }
    }
    for (var s = 0; s < 7; s++) seedBlob();

    var Du = 1.0, Dv = 0.5, f = 0.037, k = 0.06;
    function cellIdx(x, y) { return ((y % gh + gh) % gh) * gw + ((x % gw + gw) % gw); }

    var off = document.createElement("canvas");
    off.width = gw; off.height = gh;
    var octx = off.getContext("2d");
    var img = octx.createImageData(gw, gh);

    var frame = 0;
    onResize = function () { /* keep the simulation grid; only the on-screen scale changes */ };

    step = function () {
      frame++;
      var physEvery = reduceMotion ? 4 : 2;
      if (frame % physEvery === 0) {
        for (var y = 0; y < gh; y++) {
          for (var x = 0; x < gw; x++) {
            var i2 = y * gw + x;
            var lapU = u[cellIdx(x - 1, y)] + u[cellIdx(x + 1, y)] + u[cellIdx(x, y - 1)] + u[cellIdx(x, y + 1)] - 4 * u[i2];
            var lapV = v[cellIdx(x - 1, y)] + v[cellIdx(x + 1, y)] + v[cellIdx(x, y - 1)] + v[cellIdx(x, y + 1)] - 4 * v[i2];
            var uvv = u[i2] * v[i2] * v[i2];
            u2[i2] = u[i2] + Du * lapU - uvv + f * (1 - u[i2]);
            v2[i2] = v[i2] + Dv * lapV + uvv - (f + k) * v[i2];
          }
        }
        var tmp = u; u = u2; u2 = tmp;
        tmp = v; v = v2; v2 = tmp;
      }

      var A = parseColor(palette.a), B = parseColor(palette.b);
      var data = img.data;
      for (var p = 0; p < n; p++) {
        var vv = Math.max(0, Math.min(1, v[p] * 3.4));
        data[p * 4] = A.r + (B.r - A.r) * vv;
        data[p * 4 + 1] = A.g + (B.g - A.g) * vv;
        data[p * 4 + 2] = A.b + (B.b - A.b) * vv;
        data[p * 4 + 3] = vv * 235;
      }
      octx.putImageData(img, 0, 0);

      ctx.clearRect(0, 0, W, H);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(off, 0, 0, gw, gh, 0, 0, W, H);
    };
  }

  /* ===================================================================
     SCENE 3 — voronoi: a drifting spatial tessellation (idealised
     tissue). Seeds do a slow bounded drift; the nearest-seed partition
     is resampled on a coarse grid and cached as line segments.
     =================================================================== */
  function initVoronoi() {
    var M = 14;
    var seeds = [];
    for (var i = 0; i < M; i++) {
      seeds.push({
        bx: Math.random(), by: Math.random(),
        amp: 0.035 + Math.random() * 0.05,
        phase: Math.random() * Math.PI * 2,
        freq: 0.12 + Math.random() * 0.14,
        x: 0, y: 0,
      });
    }
    var gw = 80, gh = 48;
    var owner = new Int16Array(gw * gh);
    var segments = [];
    var frame = 0;

    function updateSeeds() {
      for (var i = 0; i < seeds.length; i++) {
        var sd = seeds[i];
        sd.x = (sd.bx + Math.cos(t * sd.freq * speedScale + sd.phase) * sd.amp) * W;
        sd.y = (sd.by + Math.sin(t * sd.freq * 1.3 * speedScale + sd.phase) * sd.amp) * H;
      }
    }

    function computeOwners() {
      var cw = W / gw, ch = H / gh;
      for (var gy = 0; gy < gh; gy++) {
        for (var gx = 0; gx < gw; gx++) {
          var px = (gx + 0.5) * cw, py = (gy + 0.5) * ch;
          var best = 0, bd = Infinity;
          for (var i = 0; i < seeds.length; i++) {
            var dx = px - seeds[i].x, dy = py - seeds[i].y;
            var d = dx * dx + dy * dy;
            if (d < bd) { bd = d; best = i; }
          }
          owner[gy * gw + gx] = best;
        }
      }
      segments = [];
      for (var gy2 = 0; gy2 < gh; gy2++) {
        for (var gx2 = 0; gx2 < gw; gx2++) {
          var o = owner[gy2 * gw + gx2];
          if (gx2 < gw - 1 && owner[gy2 * gw + gx2 + 1] !== o) {
            segments.push((gx2 + 1) * cw, gy2 * ch, (gx2 + 1) * cw, (gy2 + 1) * ch);
          }
          if (gy2 < gh - 1 && owner[(gy2 + 1) * gw + gx2] !== o) {
            segments.push(gx2 * cw, (gy2 + 1) * ch, (gx2 + 1) * cw, (gy2 + 1) * ch);
          }
        }
      }
    }

    onResize = function () { frame = 0; };

    step = function () {
      frame++;
      updateSeeds();
      if (frame === 1 || frame % 6 === 0) computeOwners();

      ctx.clearRect(0, 0, W, H);

      ctx.strokeStyle = withAlpha(palette.text, 0.1);
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (var s2 = 0; s2 < segments.length; s2 += 4) {
        ctx.moveTo(segments[s2], segments[s2 + 1]);
        ctx.lineTo(segments[s2 + 2], segments[s2 + 3]);
      }
      ctx.stroke();

      for (var i2 = 0; i2 < seeds.length; i2++) {
        var sd2 = seeds[i2];
        var col = i2 % 2 === 0 ? palette.a : palette.b;
        var g = ctx.createRadialGradient(sd2.x, sd2.y, 0, sd2.x, sd2.y, 15);
        g.addColorStop(0, withAlpha(col, 0.32));
        g.addColorStop(1, withAlpha(col, 0));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(sd2.x, sd2.y, 15, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = withAlpha(col, 0.65);
        ctx.beginPath(); ctx.arc(sd2.x, sd2.y, 2.2, 0, Math.PI * 2); ctx.fill();
      }
    };
  }

  /* ===================================================================
     SCENE 4 — signal: scrolling Ornstein–Uhlenbeck traces
       dx = -theta (x - mean) dt + sigma dW
     A handful of independent noisy, mean-reverting signals — like
     fluctuating gene-expression trajectories over time.
     =================================================================== */
  function initSignal() {
    var lines = 3, maxPoints = 0;
    var procs = [];
    for (var i = 0; i < lines; i++) {
      procs.push({
        yFrac: 0.2 + i * 0.28 + Math.random() * 0.06,
        val: 0, theta: 0.05 + Math.random() * 0.03, sigma: 0.85 + Math.random() * 0.35,
        buf: [], color: i % 2 === 0 ? "a" : "b",
      });
    }
    function reset() {
      maxPoints = Math.ceil(W / 2) + 4;
      procs.forEach(function (p) {
        p.buf = [];
        for (var j = 0; j < maxPoints; j++) p.buf.push(0);
      });
    }
    reset();
    onResize = reset;

    step = function (dt) {
      ctx.clearRect(0, 0, W, H);
      for (var pi = 0; pi < procs.length; pi++) {
        var p = procs[pi];
        p.val += (-p.theta * p.val + (Math.random() - 0.5) * p.sigma) * dt * speedScale;
        p.val = Math.max(-1, Math.min(1, p.val));
        p.buf.push(p.val);
        if (p.buf.length > maxPoints) p.buf.shift();

        var col = p.color === "a" ? palette.a : palette.b;
        var baseY = p.yFrac * H, ampl = H * 0.05;
        var n2 = p.buf.length;

        ctx.beginPath();
        for (var i2 = 0; i2 < n2; i2++) {
          var x = W - (n2 - 1 - i2) * 2, y = baseY - p.buf[i2] * ampl;
          if (i2 === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = withAlpha(col, 0.32);
        ctx.lineWidth = 1.4;
        ctx.stroke();

        ctx.lineTo(W, baseY + ampl * 1.4);
        ctx.lineTo(W - (n2 - 1) * 2, baseY + ampl * 1.4);
        ctx.closePath();
        var grad = ctx.createLinearGradient(0, baseY - ampl, 0, baseY + ampl * 1.4);
        grad.addColorStop(0, withAlpha(col, 0.1));
        grad.addColorStop(1, withAlpha(col, 0));
        ctx.fillStyle = grad;
        ctx.fill();
      }
    };
  }

  /* ------------------------------- boot -------------------------------- */
  var scenes = { diffusion: initDiffusion, turing: initTuring, voronoi: initVoronoi, signal: initSignal };
  if (!scenes[sceneName]) return;

  resize();
  scenes[sceneName]();
  if (onResize) onResize();

  var running = false, last = 0;
  function frame(now) {
    if (!running) return;
    var dt = Math.min(2.5, (now - last) / 16.67 || 1);
    last = now; t += dt;
    step(dt);
    requestAnimationFrame(frame);
  }
  function start() { if (running) return; running = true; last = performance.now(); requestAnimationFrame(frame); }
  function stop() { running = false; }

  step(1); // paint an initial frame immediately, before the loop kicks in

  window.addEventListener("resize", function () {
    resize();
    if (onResize) onResize();
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop(); else start();
  });

  start();
})();
