/* =====================================================================
   bg-scenes.js  (v2)
   ---------------------------------------------------------------------
   Subtle, biologically-inspired / mathematically-grounded background
   animations, drawn as a fixed backdrop behind page content.

   A page opts in with `bg_scene: <name>` in its front matter.

   Available scenes
   ----------------
     diffusion : molecules under overdamped Langevin dynamics — the
                 stochastic motion behind the chemical master equation.
     turing    : Gray-Scott reaction-diffusion — Turing's (1952) model
                 of biological pattern formation.
     voronoi   : a drifting spatial tessellation — idealised tissue,
                 and a classic object of computational geometry.
     phase     : a Van der Pol phase portrait — trajectories spiralling
                 onto a limit cycle, as in gene-expression oscillators
                 and circadian clocks.
     growth    : branching filaments — mycelium / neurite growth, i.e.
                 a spatial branching process.
     signal    : scrolling Ornstein-Uhlenbeck traces — noisy signals
                 over time.

   To change a page's scene, edit only its `bg_scene:` value.
   To change how fast a scene moves, edit its entry in SPEED below.
   ===================================================================== */
(function () {
  "use strict";

  /* Per-scene pacing. Lower = slower. Tweak these freely. */
  var SPEED = {
    diffusion: 1.00,  // unchanged — this one reads well as-is
    turing:    0.45,
    voronoi:   0.30,
    phase:     0.55,
    growth:    0.45,
    signal:    0.35,
  };

  var canvas = document.getElementById("bg-scene");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var sceneName = canvas.dataset.scene;
  if (!sceneName) return;

  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var speed = (SPEED[sceneName] || 1) * (reduceMotion ? 0.4 : 1);

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
      attributes: true, attributeFilter: ["data-theme"],
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
      var inner = col.slice(col.indexOf("(") + 1, col.indexOf(")")).split(",")
        .slice(0, 3).map(function (s) { return parseFloat(s); });
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

  var step = null;
  var onResize = null;

  /* ===================================================================
     diffusion — overdamped Langevin dynamics (unchanged)
     =================================================================== */
  function initDiffusion() {
    function makeParticles() {
      var n = Math.min(60, Math.max(18, Math.round((W * H) / 26000)));
      var parts = [];
      for (var i = 0; i < n; i++) {
        parts.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2,
          r: 1.5 + Math.random() * 2, c: i % 2 === 0 ? "a" : "b",
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
        p.x += p.vx * dt * speed;
        p.y += p.vy * dt * speed;
        if (p.x < -20) p.x = W + 20; else if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; else if (p.y > H + 20) p.y = -20;
      }
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
        var q = parts[k], col = q.c === "a" ? palette.a : palette.b;
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
     turing — Gray-Scott reaction-diffusion
       du/dt = Du.lap(u) - u v^2 + f(1-u)
       dv/dt = Dv.lap(v) + u v^2 - (f+k) v

     NOTE (v2 fix): the previous version used a fractional seed radius,
     which produced fractional array indices — JS silently discards
     those writes, so nothing was ever seeded and the field stayed
     empty. Radii are integers now. Du/Dv were also above the stability
     limit for a unit timestep, which drove v to zero; they now use the
     standard values.
     =================================================================== */
  function initTuring() {
    var gw = 108, gh = Math.max(36, Math.min(84, Math.round(gw * (H / W))));
    var n = gw * gh;
    var u = new Float32Array(n), v = new Float32Array(n);
    var u2 = new Float32Array(n), v2 = new Float32Array(n);
    for (var i = 0; i < n; i++) u[i] = 1;

    function seedBlob() {
      var cx = (Math.random() * gw) | 0;
      var cy = (Math.random() * gh) | 0;
      var rad = (3 + Math.random() * 4) | 0;          // integer radius
      for (var y = -rad; y <= rad; y++) {
        for (var x = -rad; x <= rad; x++) {
          if (x * x + y * y > rad * rad) continue;
          var xi = ((cx + x) % gw + gw) % gw;
          var yi = ((cy + y) % gh + gh) % gh;
          var idx = yi * gw + xi;                     // integer index
          u[idx] = 0.5; v[idx] = 0.25;
        }
      }
    }
    for (var s = 0; s < 7; s++) seedBlob();

    var Du = 0.16, Dv = 0.08, f = 0.035, k = 0.065;
    function cellIdx(x, y) {
      return ((y % gh + gh) % gh) * gw + ((x % gw + gw) % gw);
    }

    var off = document.createElement("canvas");
    off.width = gw; off.height = gh;
    var octx = off.getContext("2d");
    var img = octx.createImageData(gw, gh);

    var acc = 0;
    onResize = function () { /* grid is resolution-independent */ };

    step = function (dt) {
      /* physics iterations are paced by SPEED.turing */
      acc += dt * speed * 1.6;
      var iters = Math.min(4, Math.floor(acc));
      acc -= iters;

      for (var it = 0; it < iters; it++) {
        for (var y = 0; y < gh; y++) {
          for (var x = 0; x < gw; x++) {
            var i2 = y * gw + x;
            var lapU = u[cellIdx(x - 1, y)] + u[cellIdx(x + 1, y)] +
                       u[cellIdx(x, y - 1)] + u[cellIdx(x, y + 1)] - 4 * u[i2];
            var lapV = v[cellIdx(x - 1, y)] + v[cellIdx(x + 1, y)] +
                       v[cellIdx(x, y - 1)] + v[cellIdx(x, y + 1)] - 4 * v[i2];
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
        var vv = Math.max(0, Math.min(1, v[p] * 2.6));
        data[p * 4]     = A.r + (B.r - A.r) * vv;
        data[p * 4 + 1] = A.g + (B.g - A.g) * vv;
        data[p * 4 + 2] = A.b + (B.b - A.b) * vv;
        data[p * 4 + 3] = vv * 225;
      }
      octx.putImageData(img, 0, 0);

      ctx.clearRect(0, 0, W, H);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(off, 0, 0, gw, gh, 0, 0, W, H);
    };
  }

  /* ===================================================================
     voronoi — drifting spatial tessellation (slower + smoother in v2)
     =================================================================== */
  function initVoronoi() {
    var M = 14;
    var seeds = [];
    for (var i = 0; i < M; i++) {
      seeds.push({
        bx: Math.random(), by: Math.random(),
        amp: 0.03 + Math.random() * 0.04,
        phase: Math.random() * Math.PI * 2,
        freq: 0.05 + Math.random() * 0.06,
        x: 0, y: 0,
      });
    }
    var gw = 130, gh = 76;                 // finer grid -> less boundary snapping
    var owner = new Int16Array(gw * gh);
    var segments = [];
    var frame = 0;

    function updateSeeds() {
      for (var i = 0; i < seeds.length; i++) {
        var sd = seeds[i];
        sd.x = (sd.bx + Math.cos(t * sd.freq * speed + sd.phase) * sd.amp) * W;
        sd.y = (sd.by + Math.sin(t * sd.freq * 1.3 * speed + sd.phase) * sd.amp) * H;
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
      if (frame === 1 || frame % 10 === 0) computeOwners();

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
        var sd2 = seeds[i2], col = i2 % 2 === 0 ? palette.a : palette.b;
        var g = ctx.createRadialGradient(sd2.x, sd2.y, 0, sd2.x, sd2.y, 15);
        g.addColorStop(0, withAlpha(col, 0.3));
        g.addColorStop(1, withAlpha(col, 0));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(sd2.x, sd2.y, 15, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = withAlpha(col, 0.6);
        ctx.beginPath(); ctx.arc(sd2.x, sd2.y, 2.2, 0, Math.PI * 2); ctx.fill();
      }
    };
  }

  /* ===================================================================
     phase — Van der Pol phase portrait  (NEW)
       dx/dt = y
       dy/dt = mu (1 - x^2) y - x
     Tracers seeded across phase space are advected by the vector field
     and spiral onto the limit cycle, then are recycled so the inward
     convergence stays visible.
     =================================================================== */
  function initPhase() {
    var mu = 1.2, hStep = 0.02;
    var tracers = [];
    var scale = 1, cx = 0, cy = 0;

    function fit() {
      /* phase space x in [-3,3], y in [-4,4], centred and contained */
      scale = Math.min(W / 7.2, H / 9.2);
      cx = W / 2; cy = H / 2;
    }
    function spawn() {
      var r = 0.15 + Math.random() * 3.4, a = Math.random() * Math.PI * 2;
      return {
        x: Math.cos(a) * r, y: Math.sin(a) * r * 1.25,
        trail: [], age: 0,
        maxAge: 900 + Math.random() * 900,
        c: Math.random() < 0.5 ? "a" : "b",
      };
    }
    function reset() {
      fit();
      var n = Math.max(14, Math.min(30, Math.round(W / 55)));
      tracers = [];
      for (var i = 0; i < n; i++) {
        var tr = spawn();
        tr.age = Math.random() * 600;   // desynchronise
        tracers.push(tr);
      }
    }
    reset();
    onResize = reset;

    function toScreen(x, y) { return [cx + x * scale, cy - y * scale]; }

    step = function (dt) {
      ctx.clearRect(0, 0, W, H);

      /* faint reference limit cycle */
      var lx = 2.0, ly = 0;
      ctx.beginPath();
      for (var i = 0; i < 1400; i++) {
        var dx0 = ly, dy0 = mu * (1 - lx * lx) * ly - lx;
        lx += dx0 * hStep; ly += dy0 * hStep;
        var pt = toScreen(lx, ly);
        if (i === 0) ctx.moveTo(pt[0], pt[1]); else ctx.lineTo(pt[0], pt[1]);
      }
      ctx.strokeStyle = withAlpha(palette.text, 0.09);
      ctx.lineWidth = 1;
      ctx.stroke();

      for (var k = 0; k < tracers.length; k++) {
        var p = tracers[k];
        var sub = 2;
        for (var s = 0; s < sub; s++) {
          var dx = p.y;
          var dy = mu * (1 - p.x * p.x) * p.y - p.x;
          p.x += dx * hStep * dt * speed;
          p.y += dy * hStep * dt * speed;
        }
        p.age += dt;

        var sp = toScreen(p.x, p.y);
        p.trail.push(sp[0], sp[1]);
        if (p.trail.length > 56) { p.trail.splice(0, 2); }

        if (p.age > p.maxAge || !isFinite(p.x) || !isFinite(p.y) ||
            Math.abs(p.x) > 8 || Math.abs(p.y) > 10) {
          tracers[k] = spawn();
          continue;
        }

        var col = p.c === "a" ? palette.a : palette.b;
        var pts = p.trail.length / 2;
        /* fade the trail: draw as short segments with rising alpha */
        for (var q = 1; q < pts; q++) {
          var alpha = (q / pts) * 0.34;
          ctx.strokeStyle = withAlpha(col, alpha);
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(p.trail[(q - 1) * 2], p.trail[(q - 1) * 2 + 1]);
          ctx.lineTo(p.trail[q * 2], p.trail[q * 2 + 1]);
          ctx.stroke();
        }
        var g = ctx.createRadialGradient(sp[0], sp[1], 0, sp[0], sp[1], 7);
        g.addColorStop(0, withAlpha(col, 0.5));
        g.addColorStop(1, withAlpha(col, 0));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(sp[0], sp[1], 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = withAlpha(col, 0.75);
        ctx.beginPath(); ctx.arc(sp[0], sp[1], 1.7, 0, Math.PI * 2); ctx.fill();
      }
    };
  }

  /* ===================================================================
     growth — branching filaments  (NEW)
     A spatial branching process: tips advance as a correlated random
     walk and occasionally bifurcate, tracing mycelium/neurite-like
     structures. Old segments are recycled, so the structure keeps
     growing and receding rather than filling the screen.
     =================================================================== */
  function initGrowth() {
    var tips = [], segs = [];
    var MAX_TIPS = 16, MAX_SEGS = 2600;

    function newTip(x, y, ang, c) {
      return {
        x: x, y: y, ang: ang,
        speed: 0.5 + Math.random() * 0.4,
        age: 0, maxAge: 420 + Math.random() * 520,
        c: c || (Math.random() < 0.5 ? "a" : "b"),
      };
    }
    function seedTip() {
      var edge = (Math.random() * 4) | 0, x, y, ang;
      if (edge === 0) { x = Math.random() * W; y = -10; ang = Math.PI / 2; }
      else if (edge === 1) { x = W + 10; y = Math.random() * H; ang = Math.PI; }
      else if (edge === 2) { x = Math.random() * W; y = H + 10; ang = -Math.PI / 2; }
      else { x = -10; y = Math.random() * H; ang = 0; }
      ang += (Math.random() - 0.5) * 1.0;
      tips.push(newTip(x, y, ang));
    }
    function reset() { tips = []; segs = []; for (var i = 0; i < 4; i++) seedTip(); }
    reset();
    onResize = reset;

    step = function (dt) {
      var adv = dt * speed;

      for (var i = tips.length - 1; i >= 0; i--) {
        var tp = tips[i];
        tp.ang += (Math.random() - 0.5) * 0.16 * adv;
        var nx = tp.x + Math.cos(tp.ang) * tp.speed * adv;
        var ny = tp.y + Math.sin(tp.ang) * tp.speed * adv;
        segs.push(tp.x, tp.y, nx, ny, tp.c === "a" ? 0 : 1);
        tp.x = nx; tp.y = ny; tp.age += adv;

        if (tips.length < MAX_TIPS && Math.random() < 0.006 * adv) {
          tips.push(newTip(tp.x, tp.y, tp.ang + (Math.random() < 0.5 ? 0.6 : -0.6), tp.c));
        }
        var out = tp.x < -60 || tp.x > W + 60 || tp.y < -60 || tp.y > H + 60;
        if (tp.age > tp.maxAge || out) tips.splice(i, 1);
      }
      while (tips.length < 3) seedTip();
      while (segs.length > MAX_SEGS * 5) segs.splice(0, 5);

      ctx.clearRect(0, 0, W, H);
      var total = segs.length / 5;
      for (var pass = 0; pass < 2; pass++) {
        ctx.strokeStyle = withAlpha(pass === 0 ? palette.a : palette.b, 0.26);
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        for (var s = 0; s < segs.length; s += 5) {
          if (segs[s + 4] !== pass) continue;
          ctx.moveTo(segs[s], segs[s + 1]);
          ctx.lineTo(segs[s + 2], segs[s + 3]);
        }
        ctx.stroke();
      }
      for (var k = 0; k < tips.length; k++) {
        var q = tips[k], col = q.c === "a" ? palette.a : palette.b;
        var g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, 9);
        g.addColorStop(0, withAlpha(col, 0.45));
        g.addColorStop(1, withAlpha(col, 0));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(q.x, q.y, 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = withAlpha(col, 0.7);
        ctx.beginPath(); ctx.arc(q.x, q.y, 1.8, 0, Math.PI * 2); ctx.fill();
      }
      if (total === 0) reset();
    };
  }

  /* ===================================================================
     signal — scrolling Ornstein-Uhlenbeck traces (slower in v2)
     =================================================================== */
  function initSignal() {
    var lines = 3, maxPoints = 0, procs = [];
    for (var i = 0; i < lines; i++) {
      procs.push({
        yFrac: 0.2 + i * 0.28 + Math.random() * 0.06,
        val: 0, theta: 0.05 + Math.random() * 0.03,
        sigma: 0.85 + Math.random() * 0.35,
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
        p.val += (-p.theta * p.val + (Math.random() - 0.5) * p.sigma) * dt * speed;
        p.val = Math.max(-1, Math.min(1, p.val));
        p.buf.push(p.val);
        if (p.buf.length > maxPoints) p.buf.shift();

        var col = p.color === "a" ? palette.a : palette.b;
        var baseY = p.yFrac * H, ampl = H * 0.05, n2 = p.buf.length;
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
  var scenes = {
    diffusion: initDiffusion,
    turing: initTuring,
    voronoi: initVoronoi,
    phase: initPhase,
    growth: initGrowth,
    signal: initSignal,
  };
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

  step(1);

  window.addEventListener("resize", function () {
    resize();
    if (onResize) onResize();
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop(); else start();
  });

  start();
})();
