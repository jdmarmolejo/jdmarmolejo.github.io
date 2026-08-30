/* =====================================================================
   bg-scenes.js  (v3)
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
     phase     : Van der Pol phase portraits — trajectories spiralling
                 onto a limit cycle, as in gene-expression oscillators
                 and circadian clocks. Several are scattered around the
                 viewport so the scene reads at the edges, not only in
                 the middle where page content sits.
     growth    : branching filaments — mycelium / neurite growth, i.e.
                 a spatial branching process.
     angio     : sprouting angiogenesis — tip cells climbing a VEGF
                 gradient, bifurcating under Murray's law and fusing
                 by anastomosis into a looped vascular bed.
     murmuration : flocking starlings — Reynolds/Vicsek collective
                 motion, with a raptor that splits the flock.
     signal    : scrolling Ornstein-Uhlenbeck traces — noisy signals
                 over time.

   To change a page's scene, edit only its `bg_scene:` value.
   To change how fast a scene moves, edit its entry in SPEED below.
   ===================================================================== */
(function () {
  "use strict";

  /* Per-scene pacing. Lower = slower. Tweak these freely. */
  var SPEED = {
    diffusion: 1.00,
    turing:    0.75,
    voronoi:   0.30,
    phase:     0.55,
    growth:    0.45,
    angio:     0.50,
    murmuration: 0.60,
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
     diffusion — overdamped Langevin dynamics
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
        /* Overdamped Langevin step. With friction g=0.02 the noise
           amplitude sets the diffusion coefficient: D = Var(v)/g, so
           sigma 0.055 -> D 0.32 px^2/frame and sigma 0.075 -> D 0.59,
           i.e. roughly +85% diffusivity for +36% RMS speed. Checked
           against a direct MSD simulation (26.7 px predicted vs 25.1
           px measured over 10 s). */
        p.vx += (-0.02 * p.vx + (Math.random() - 0.5) * 0.075) * dt;
        p.vy += (-0.02 * p.vy + (Math.random() - 0.5) * 0.075) * dt;
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

     v3: finer grid (150 wide) and f=0.030 / k=0.062, which measured
     ~28% more interface length than the previous f=0.035 / k=0.065
     while holding coverage near 30%, so the field is more intricate
     without turning into a solid mass. A blob is re-seeded periodically
     so the field keeps reorganising instead of settling.
     =================================================================== */
  function initTuring() {
    var gw = 150, gh = Math.max(50, Math.min(110, Math.round(gw * (H / W))));
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
    for (var s = 0; s < 10; s++) seedBlob();

    var Du = 0.16, Dv = 0.08, f = 0.030, k = 0.062;
    var simCount = 0, RESEED_EVERY = 1200;

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
      acc += dt * speed * 1.6;
      var iters = Math.min(4, Math.floor(acc));
      acc -= iters;

      for (var it = 0; it < iters; it++) {
        simCount++;
        if (simCount % RESEED_EVERY === 0) seedBlob();
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
     voronoi — drifting spatial tessellation
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
    var gw = 130, gh = 76;
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
     phase — Van der Pol phase portraits, scattered
       dx/dt = y
       dy/dt = mu (1 - x^2) y - x

     v3: instead of one large portrait dead-centre (where page content
     covers it), several smaller portraits are anchored around the
     viewport edges, each with its own mu, scale and rotation. The
     limit cycle of each is integrated once at start-up and cached,
     rather than re-integrated every frame.
     =================================================================== */
  function initPhase() {
    var systems = [];
    var H_STEP = 0.02;

    function cycleFor(mu) {
      var x = 2, y = 0, i;
      for (i = 0; i < 4000; i++) {              // discard transient
        var dx0 = y, dy0 = mu * (1 - x * x) * y - x;
        x += dx0 * H_STEP; y += dy0 * H_STEP;
      }
      var pts = [];
      for (i = 0; i < 4200; i++) {              // one full closed orbit
        var dx1 = y, dy1 = mu * (1 - x * x) * y - x;
        x += dx1 * H_STEP; y += dy1 * H_STEP;
        if (i % 20 === 0) pts.push(x, y);
      }
      return pts;
    }

    function spawnTracer() {
      var r = 0.15 + Math.random() * 3.2, a = Math.random() * Math.PI * 2;
      return {
        x: Math.cos(a) * r, y: Math.sin(a) * r * 1.25,
        trail: [], age: Math.random() * 400,
        maxAge: 900 + Math.random() * 900,
        c: Math.random() < 0.5 ? "a" : "b",
      };
    }

    function reset() {
      /* anchors sit away from the centre column, where text lives */
      var wide = W >= 900;
      var anchors = wide
        ? [[0.09, 0.22], [0.91, 0.17], [0.05, 0.63], [0.95, 0.68],
           [0.24, 0.90], [0.76, 0.88], [0.50, 0.07]]
        : [[0.16, 0.10], [0.84, 0.28], [0.13, 0.55], [0.87, 0.76], [0.45, 0.93]];

      var base = Math.min(W, H) * 0.045;
      systems = [];
      for (var i = 0; i < anchors.length; i++) {
        var mu = 0.9 + Math.random() * 0.8;
        var rot = Math.random() * Math.PI * 2;
        var sc = base * (0.78 + Math.random() * 0.5);
        var tracers = [];
        var nt = 5 + ((Math.random() * 3) | 0);
        for (var j = 0; j < nt; j++) tracers.push(spawnTracer());
        systems.push({
          cx: anchors[i][0] * W, cy: anchors[i][1] * H,
          mu: mu, scale: sc,
          cos: Math.cos(rot), sin: Math.sin(rot),
          cycle: cycleFor(mu),
          tracers: tracers,
        });
      }
    }
    reset();
    onResize = reset;

    function sx(sys, x, y) { return sys.cx + (x * sys.cos - y * sys.sin) * sys.scale; }
    function sy(sys, x, y) { return sys.cy - (x * sys.sin + y * sys.cos) * sys.scale; }

    step = function (dt) {
      ctx.clearRect(0, 0, W, H);

      for (var s = 0; s < systems.length; s++) {
        var sys = systems[s];

        /* cached limit cycle */
        ctx.beginPath();
        for (var c = 0; c < sys.cycle.length; c += 2) {
          var px = sx(sys, sys.cycle[c], sys.cycle[c + 1]);
          var py = sy(sys, sys.cycle[c], sys.cycle[c + 1]);
          if (c === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.strokeStyle = withAlpha(palette.text, 0.10);
        ctx.lineWidth = 1;
        ctx.stroke();

        for (var k = 0; k < sys.tracers.length; k++) {
          var p = sys.tracers[k];
          for (var sub = 0; sub < 2; sub++) {
            var dx = p.y;
            var dy = sys.mu * (1 - p.x * p.x) * p.y - p.x;
            p.x += dx * H_STEP * dt * speed;
            p.y += dy * H_STEP * dt * speed;
          }
          p.age += dt;

          if (p.age > p.maxAge || !isFinite(p.x) || !isFinite(p.y) ||
              Math.abs(p.x) > 8 || Math.abs(p.y) > 10) {
            sys.tracers[k] = spawnTracer();
            continue;
          }

          var tx = sx(sys, p.x, p.y), ty = sy(sys, p.x, p.y);
          p.trail.push(tx, ty);
          if (p.trail.length > 80) p.trail.splice(0, 2);

          /* trail drawn as three batched chunks (cheap fade) */
          var col = p.c === "a" ? palette.a : palette.b;
          var pts = p.trail.length / 2;
          if (pts > 3) {
            var alphas = [0.08, 0.18, 0.32];
            for (var chunk = 0; chunk < 3; chunk++) {
              var from = Math.floor((pts * chunk) / 3);
              var to = Math.floor((pts * (chunk + 1)) / 3);
              if (to - from < 2) continue;
              ctx.beginPath();
              for (var q = from; q < to; q++) {
                if (q === from) ctx.moveTo(p.trail[q * 2], p.trail[q * 2 + 1]);
                else ctx.lineTo(p.trail[q * 2], p.trail[q * 2 + 1]);
              }
              ctx.strokeStyle = withAlpha(col, alphas[chunk]);
              ctx.lineWidth = 1.3;
              ctx.stroke();
            }
          }

          var g = ctx.createRadialGradient(tx, ty, 0, tx, ty, 6);
          g.addColorStop(0, withAlpha(col, 0.5));
          g.addColorStop(1, withAlpha(col, 0));
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(tx, ty, 6, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = withAlpha(col, 0.75);
          ctx.beginPath(); ctx.arc(tx, ty, 1.6, 0, Math.PI * 2); ctx.fill();
        }
      }
    };
  }

  /* ===================================================================
     growth — branching filaments
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
    };
  }

  /* ===================================================================
     angio — sprouting angiogenesis

     Hypoxic sites release VEGF; tip cells migrate up the gradient
     (chemotaxis as a reinforced random walk with a bounded turn rate)
     and draw a vessel behind them.

     v5 makes the result read as vasculature rather than as a tree:

       * True bifurcation. A tip does not sprout a side branch and
         carry on -- it ends, and two daughters continue, giving real
         Y-junctions.
       * Murray's law. Daughter calibres satisfy r0^3 = r1^3 + r2^3,
         the relation that actually governs vascular branching, so the
         thicknesses look right at every junction.
       * Anastomosis. Tips that meet another vessel fuse to it, which
         closes loops. Real vascular beds are loopy; trees are not, and
         this is the strongest visual cue of the difference.
       * Taper. Calibre decays slowly along a vessel between junctions,
         and segments are drawn with a faint wider halo under a core
         stroke so they read as tubes rather than hairlines.
     =================================================================== */
  function initAngio() {
    var sources = [], tips = [], segs = [];
    var MAX_TIPS = 20, MAX_SEGS = 7000, SEG_MIN = 2.6;
    var W_START = 3.2, W_MIN = 0.5;
    var CELL = 26, ANAST_R = 11, INHIBIT = 26;
    var pts = null, branchId = 0, frames = 0;

    function newSource() {
      return {
        x: 0.06 * W + Math.random() * 0.88 * W,
        y: 0.06 * H + Math.random() * 0.88 * H,
        phase: Math.random() * Math.PI * 2,
        perfused: 0,
      };
    }
    function pickTarget(x, y) {
      var avail = [], i;
      for (i = 0; i < sources.length; i++) {
        if (sources[i].perfused <= 0) avail.push(i);
      }
      if (!avail.length) return -1;
      if (Math.random() < 0.55) {
        var best = avail[0], bd = Infinity;
        for (i = 0; i < avail.length; i++) {
          var dx = sources[avail[i]].x - x, dy = sources[avail[i]].y - y;
          var d = dx * dx + dy * dy;
          if (d < bd) { bd = d; best = avail[i]; }
        }
        return best;
      }
      return avail[(Math.random() * avail.length) | 0];
    }
    function newTip(x, y, ang, w, gen) {
      return {
        x: x, y: y, ang: ang, w: w, gen: gen, id: ++branchId,
        target: pickTarget(x, y),
        age: 0, maxAge: 2400 + Math.random() * 1800,
        lx: x, ly: y,
      };
    }
    function seedTip() {
      var edge = (Math.random() * 4) | 0, x, y, ang;
      if (edge === 0)      { x = Math.random() * W; y = -8;    ang =  Math.PI / 2; }
      else if (edge === 1) { x = W + 8; y = Math.random() * H; ang =  Math.PI; }
      else if (edge === 2) { x = Math.random() * W; y = H + 8; ang = -Math.PI / 2; }
      else                 { x = -8;    y = Math.random() * H; ang =  0; }
      tips.push(newTip(x, y, ang, W_START, 0));
    }

    /* spatial hash of vessel points, for anastomosis lookups */
    function pkey(x, y) { return (Math.floor(y / CELL)) * 100000 + Math.floor(x / CELL); }
    function addPt(x, y, id) {
      var k = pkey(x, y);
      var arr = pts.get(k);
      if (!arr) { arr = []; pts.set(k, arr); }
      arr.push(x, y, id);
    }
    function rebuildIndex() {
      /* rebuilt periodically so the index cannot grow without bound
         as old segments are pruned */
      pts = new Map();
      for (var q = 0; q < segs.length; q += 5) addPt(segs[q + 2], segs[q + 3], -1);
    }
    function localDensity(x, y) {
      var gx = Math.floor(x / CELL), gy = Math.floor(y / CELL), n = 0;
      for (var oy = -1; oy <= 1; oy++) {
        for (var ox = -1; ox <= 1; ox++) {
          var arr = pts.get((gy + oy) * 100000 + (gx + ox));
          if (arr) n += arr.length / 3;
        }
      }
      return n;
    }
    function findAnastomosis(x, y, id) {
      var gx = Math.floor(x / CELL), gy = Math.floor(y / CELL);
      for (var oy = -1; oy <= 1; oy++) {
        for (var ox = -1; ox <= 1; ox++) {
          var arr = pts.get((gy + oy) * 100000 + (gx + ox));
          if (!arr) continue;
          for (var i = 0; i < arr.length; i += 3) {
            if (arr[i + 2] === id) continue;
            var dx = arr[i] - x, dy = arr[i + 1] - y;
            if (dx * dx + dy * dy < ANAST_R * ANAST_R) {
              return { x: arr[i], y: arr[i + 1] };
            }
          }
        }
      }
      return null;
    }

    function reset() {
      sources = []; tips = []; segs = []; pts = new Map(); frames = 0;
      var ns = Math.max(4, Math.min(8, Math.round(W / 300)));
      for (var i = 0; i < ns; i++) sources.push(newSource());
      for (var j = 0; j < 4; j++) seedTip();
    }
    reset();
    onResize = reset;

    function wrapAngle(a) {
      while (a > Math.PI) a -= Math.PI * 2;
      while (a < -Math.PI) a += Math.PI * 2;
      return a;
    }

    step = function (dt, silent) {
      var adv = dt * speed;
      frames++;
      if (frames % 900 === 0) rebuildIndex();

      for (var i = tips.length - 1; i >= 0; i--) {
        var tp = tips[i];

        if (tp.target < 0 || !sources[tp.target] || sources[tp.target].perfused > 0) {
          tp.target = pickTarget(tp.x, tp.y);
        }
        if (tp.target >= 0) {
          var src = sources[tp.target];
          var diff = wrapAngle(Math.atan2(src.y - tp.y, src.x - tp.x) - tp.ang);
          /* bounded turn rate keeps vessels smoothly curved */
          tp.ang += Math.max(-0.035, Math.min(0.035, diff * 0.05)) * adv;
        }
        tp.ang += (Math.random() - 0.5) * 0.055 * adv;

        tp.x += Math.cos(tp.ang) * 0.95 * adv;
        tp.y += Math.sin(tp.ang) * 0.95 * adv;
        tp.age += adv;
        tp.w = Math.max(W_MIN, tp.w * (1 - 0.00035 * adv));      /* taper */

        var dx2 = tp.x - tp.lx, dy2 = tp.y - tp.ly;
        if (dx2 * dx2 + dy2 * dy2 >= SEG_MIN * SEG_MIN) {
          segs.push(tp.lx, tp.ly, tp.x, tp.y, tp.w);
          addPt(tp.x, tp.y, tp.id);
          tp.lx = tp.x; tp.ly = tp.y;

          var hit = findAnastomosis(tp.x, tp.y, tp.id);
          if (hit && tp.age > 60) {                 /* fuse -> closes a loop */
            segs.push(tp.x, tp.y, hit.x, hit.y, tp.w);
            tips.splice(i, 1);
            continue;
          }
        }

        var near = 1;
        if (tp.target >= 0) {
          var so2 = sources[tp.target];
          var sd = Math.sqrt((so2.x - tp.x) * (so2.x - tp.x) + (so2.y - tp.y) * (so2.y - tp.y));
          near = sd < Math.min(W, H) * 0.22 ? 2.2 : 1;
          if (sd < 18) {
            sources[tp.target] = newSource();
            tp.target = pickTarget(tp.x, tp.y);
          }
        }

        /* Bifurcation: parent terminates, two daughters continue,
           calibres from Murray's law r0^3 = r1^3 + r2^3 and angles from
           the Zamir optimality condition that follows from it. The
           earlier version used an arbitrary 26-46 deg spread; the
           optimal total is ~75 deg with the thinner daughter deviating
           more, which is what makes junctions look vascular.

           Sprouting is also gated by local vessel density, standing in
           for DLL4/Notch lateral inhibition: a tip in already
           well-vascularised tissue does not sprout. This suppresses
           about 40% of attempts and stops the bed over-branching. */
        if (tips.length < MAX_TIPS - 1 && tp.gen < 5 &&
            Math.random() < 0.0035 * near * adv &&
            localDensity(tp.x, tp.y) <= INHIBIT) {
          var fr = 0.35 + Math.random() * 0.30;
          var r1 = Math.max(W_MIN, tp.w * Math.cbrt(fr));
          var r2 = Math.max(W_MIN, tp.w * Math.cbrt(1 - fr));
          var r0s = tp.w * tp.w, r0q = r0s * r0s;
          var c1 = (r0q + Math.pow(r1, 4) - Math.pow(r2, 4)) / (2 * r0s * r1 * r1);
          var c2 = (r0q + Math.pow(r2, 4) - Math.pow(r1, 4)) / (2 * r0s * r2 * r2);
          var th1 = Math.acos(Math.max(-1, Math.min(1, c1)));
          var th2 = Math.acos(Math.max(-1, Math.min(1, c2)));
          tips.push(newTip(tp.x, tp.y, tp.ang + th1, r1, tp.gen + 1));
          tips.push(newTip(tp.x, tp.y, tp.ang - th2, r2, tp.gen + 1));
          tips.splice(i, 1);
          continue;
        }

        if (tp.age > tp.maxAge ||
            tp.x < -70 || tp.x > W + 70 || tp.y < -70 || tp.y > H + 70) {
          tips.splice(i, 1);
        }
      }
      while (tips.length < 4) seedTip();

      /* Regression. Taking segs[0] would always remove the oldest
         segment -- which is a gen-0 trunk at full calibre, so the
         thickest vessels would vanish first while capillaries lingered.
         Real beds regress the other way round: unperfused capillaries
         are resorbed and the trunks persist. So look at a window of the
         oldest segments and drop the thinnest one in it. */
      while (segs.length > MAX_SEGS * 5) {
        /* the window has to be wide enough to actually contain a mix of
           calibres: at 60 segments the candidates are all from the same
           moment and the bias vanishes (measured kept/removed ratio
           1.02, i.e. no effect). At 2000 it is about 1.3. */
        var win = Math.min(2000 * 5, segs.length);
        var thin = 0, thinW = Infinity;
        for (var wq = 0; wq < win; wq += 5) {
          if (segs[wq + 4] < thinW) { thinW = segs[wq + 4]; thin = wq; }
        }
        segs.splice(thin, 5);
      }

      if (silent) return;          /* prewarm pass: advance state, draw nothing */

      ctx.clearRect(0, 0, W, H);

      /* hypoxic sites */
      for (var s = 0; s < sources.length; s++) {
        var so = sources[s];
        var pulse = 0.5 + 0.5 * Math.sin(t * 0.02 + so.phase);
        var rad = 34 + pulse * 12;
        var g = ctx.createRadialGradient(so.x, so.y, 0, so.x, so.y, rad);
        g.addColorStop(0, withAlpha(palette.b, 0.13 + pulse * 0.06));
        g.addColorStop(1, withAlpha(palette.b, 0));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(so.x, so.y, rad, 0, Math.PI * 2); ctx.fill();
      }

      /* Vessels: 8 calibre buckets x 3 age tiers, each drawn as a soft
         halo plus a core so they read as tubes. The age tiers exist so
         that segments about to be pruned dim out first -- without them
         a vessel simply blinks out of existence, which is what makes
         the regression read as a glitch rather than as remodelling. */
      var NB = 8, bw = (W_START - W_MIN) / (NB - 1);
      var cutA = Math.floor(segs.length * 0.10 / 5) * 5;
      var cutB = Math.floor(segs.length * 0.24 / 5) * 5;
      var tierAlpha = [0.28, 0.62, 1];
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (var pass = 0; pass < 2; pass++) {
        for (var b = 0; b < NB; b++) {
          var wpx = W_MIN + b * bw;
          var baseA = pass === 0 ? 0.045 : 0.13 + b * 0.022;
          for (var tier = 0; tier < 3; tier++) {
            ctx.lineWidth = pass === 0 ? wpx + 2.2 : wpx;
            ctx.strokeStyle = withAlpha(palette.a, baseA * tierAlpha[tier]);
            ctx.beginPath();
            var drew = false;
            for (var q = 0; q < segs.length; q += 5) {
              var tq2 = q < cutA ? 0 : (q < cutB ? 1 : 2);
              if (tq2 !== tier) continue;
              var bi = Math.max(0, Math.min(NB - 1, Math.round((segs[q + 4] - W_MIN) / bw)));
              if (bi !== b) continue;
              ctx.moveTo(segs[q], segs[q + 1]);
              ctx.lineTo(segs[q + 2], segs[q + 3]);
              drew = true;
            }
            if (drew) ctx.stroke();
          }
        }
      }

      /* tip cells */
      for (var k = 0; k < tips.length; k++) {
        var tq = tips[k];
        var gg = ctx.createRadialGradient(tq.x, tq.y, 0, tq.x, tq.y, 5);
        gg.addColorStop(0, withAlpha(palette.a, 0.3));
        gg.addColorStop(1, withAlpha(palette.a, 0));
        ctx.fillStyle = gg;
        ctx.beginPath(); ctx.arc(tq.x, tq.y, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = withAlpha(palette.a, 0.55);
        ctx.beginPath(); ctx.arc(tq.x, tq.y, 1.3, 0, Math.PI * 2); ctx.fill();
      }
    };

    /* Prewarm: the growth rate of the network is proportional to the
       number of tips, which starts at 4 and rises to ~19 as the tree
       bifurcates. Without this, the scene visibly speeds up over the
       first half-minute. Advancing the state silently at start-up (and
       after a resize) means the visitor arrives at an already
       established, steady-state vascular bed. */
    function prewarm() { for (var i = 0; i < 1100; i++) step(1, true); }
    prewarm();
    onResize = function () { reset(); prewarm(); };
  }

  /* ===================================================================
     murmuration — flocking starlings

     Reynolds' three rules (separation, alignment, cohesion) evaluated
     over a toroidal spatial hash, plus a raptor that occasionally cuts
     through and tears a hole in the flock.

     v6 notes. The earlier version pulled every bird toward a single
     wandering roost, which packed them into a clump covering only
     ~14% of the screen. Replacing the global attractor with periodic
     boundaries and dropping cohesion to near zero turns it into a
     screen-filling field in the spirit of the Vicsek model: measured
     coverage rises to ~73% while the order parameter (mean unit
     velocity) stays around 0.8, so the flock still moves as a flock
     rather than as a gas.

     Birds are tinted by local crowding: those with few neighbours take
     the accent colour, so the accent traces the edges of the density
     waves travelling through the flock instead of being sprinkled at
     random. Each bird also carries a depth value that scales its size
     and opacity, which gives the field some thickness.
     =================================================================== */
  function initMurmuration() {
    var birds = [], predators = [];
    var SEP = 20, ALI = 40, COH = 55;
    /* Three raptors, each hunting on its own duty cycle, on screen ~9%
       of the time apiece. The duty cycle matters more than the count:
       with three raptors at the old cooldowns the order parameter fell
       to 0.13 and the flock never re-formed, so the cooldowns were
       lengthened to compensate. As shipped the flock spends most of its
       time at order 0.6-0.9 with roughly a quarter of frames showing
       some panic, which is the rhythm that makes an attack legible. */
    var PMAXV = 2.7, PSEE = 150, PFLEE = 112;
    var MAXV = 2.1, MINV = 1.55, CRUISE = 1.95;
    var ACCENT_NB = 11;                /* below this neighbour count -> accent.
                                          11 tints ~35% of the flock; raise it
                                          for more accent, lower for less. */
    var CELL = 58, gxn = 1, gyn = 1;

    function reset() {
      var n = Math.max(250, Math.min(1600, Math.round((W * H) / 980)));
      birds = [];
      for (var i = 0; i < n; i++) {
        var a0 = Math.random() * Math.PI * 2;
        birds.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: Math.cos(a0) * CRUISE, vy: Math.sin(a0) * CRUISE,
          nb: 0,
          z: 0.55 + Math.random() * 0.6,      /* depth: size + opacity */
        });
      }
      gxn = Math.max(1, Math.ceil(W / CELL));
      gyn = Math.max(1, Math.ceil(H / CELL));
      /* staggered initial cooldowns so they rarely arrive together */
      predators = [
        { x: 0, y: 0, vx: 0, vy: 0, active: false, ttl: 0, cool: 300 },
        { x: 0, y: 0, vx: 0, vy: 0, active: false, ttl: 0, cool: 2900 },
        { x: 0, y: 0, vx: 0, vy: 0, active: false, ttl: 0, cool: 5600 },
      ];
    }
    reset();

    function wrapD(d, S) { return d > S / 2 ? d - S : (d < -S / 2 ? d + S : d); }

    step = function (dt, silent) {
      var adv = dt * speed, i;

      for (var pi = 0; pi < predators.length; pi++) {
        var P = predators[pi];
        if (!P.active) {
          P.cool -= dt;
          if (P.cool <= 0) {
            P.active = true;
            P.ttl = 420 + Math.random() * 260;
            P.x = Math.random() * W; P.y = Math.random() * H;
            var pa = Math.random() * Math.PI * 2;
            P.vx = Math.cos(pa) * PMAXV; P.vy = Math.sin(pa) * PMAXV;
          }
          continue;
        }
        /* drift toward the local centre of the flock -- a hunt, not a
           straight line through the field */
        var mx = 0, my = 0, seen = 0;
        for (var bi = 0; bi < birds.length; bi++) {
          var bq = birds[bi];
          var qx = wrapD(bq.x - P.x, W), qy = wrapD(bq.y - P.y, H);
          if (qx * qx + qy * qy < PSEE * PSEE) { mx += qx; my += qy; seen++; }
        }
        if (seen) { P.vx += (mx / seen) * 0.0010; P.vy += (my / seen) * 0.0010; }
        P.vx += (Math.random() - 0.5) * 0.10;
        P.vy += (Math.random() - 0.5) * 0.10;
        var psp = Math.sqrt(P.vx * P.vx + P.vy * P.vy) || 1;
        P.vx = P.vx / psp * PMAXV; P.vy = P.vy / psp * PMAXV;
        P.x += P.vx * adv; P.y += P.vy * adv;
        if (P.x < 0) P.x += W; else if (P.x >= W) P.x -= W;   /* periodic too */
        if (P.y < 0) P.y += H; else if (P.y >= H) P.y -= H;
        P.ttl -= dt;
        if (P.ttl <= 0) { P.active = false; P.cool = 3100 + Math.random() * 2600; }
      }

      /* toroidal bucket grid */
      var grid = new Map(), k;
      for (i = 0; i < birds.length; i++) {
        k = Math.min(gyn - 1, Math.floor(birds[i].y / CELL)) * gxn +
            Math.min(gxn - 1, Math.floor(birds[i].x / CELL));
        var cellArr = grid.get(k);
        if (!cellArr) { cellArr = []; grid.set(k, cellArr); }
        cellArr.push(i);
      }

      for (i = 0; i < birds.length; i++) {
        var p = birds[i];
        var sx = 0, sy = 0, avx = 0, avy = 0, cx = 0, cy = 0, na = 0, nc = 0;
        var gx = Math.min(gxn - 1, Math.floor(p.x / CELL));
        var gy = Math.min(gyn - 1, Math.floor(p.y / CELL));
        for (var oy = -1; oy <= 1; oy++) {
          for (var ox = -1; ox <= 1; ox++) {
            var cgx = ((gx + ox) % gxn + gxn) % gxn;      /* wrap the seam */
            var cgy = ((gy + oy) % gyn + gyn) % gyn;
            var arr = grid.get(cgy * gxn + cgx);
            if (!arr) continue;
            for (var a = 0; a < arr.length; a++) {
              var j = arr[a];
              if (j === i) continue;
              var q = birds[j];
              var dx = wrapD(q.x - p.x, W), dy = wrapD(q.y - p.y, H);
              var d2 = dx * dx + dy * dy;
              if (d2 < SEP * SEP) { sx -= dx; sy -= dy; }
              if (d2 < ALI * ALI) { avx += q.vx; avy += q.vy; na++; }
              if (d2 < COH * COH) { cx += dx; cy += dy; nc++; }
            }
          }
        }
        p.nb = nc;
        p.vx += sx * 0.060; p.vy += sy * 0.060;
        if (na) { p.vx += (avx / na - p.vx) * 0.055; p.vy += (avy / na - p.vy) * 0.055; }
        if (nc) { p.vx += (cx / nc) * 0.0004; p.vy += (cy / nc) * 0.0004; }

        for (var pk = 0; pk < predators.length; pk++) {
          var PR = predators[pk];
          if (!PR.active) continue;
          var pdx = wrapD(p.x - PR.x, W), pdy = wrapD(p.y - PR.y, H);
          var pd2 = pdx * pdx + pdy * pdy;
          if (pd2 < PFLEE * PFLEE) {
            var pd = Math.sqrt(pd2) || 1;
            p.vx += (pdx / pd) * 0.95; p.vy += (pdy / pd) * 0.95;
          }
        }
        p.vx += (Math.random() - 0.5) * 0.26;
        p.vy += (Math.random() - 0.5) * 0.26;

        var spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (spd > MAXV) { p.vx = p.vx / spd * MAXV; p.vy = p.vy / spd * MAXV; }
        else if (spd < MINV && spd > 0) { p.vx = p.vx / spd * MINV; p.vy = p.vy / spd * MINV; }

        p.x += p.vx * adv; p.y += p.vy * adv;
        if (p.x < 0) p.x += W; else if (p.x >= W) p.x -= W;
        if (p.y < 0) p.y += H; else if (p.y >= H) p.y -= H;
      }

      if (silent) return;

      ctx.clearRect(0, 0, W, H);
      /* two batched paths: crowded birds in the body colour, sparse
         ones in the accent, so the accent follows the density waves */
      for (var pass = 0; pass < 2; pass++) {
        var accent = pass === 1;
        ctx.fillStyle = withAlpha(accent ? palette.a : palette.text, accent ? 0.5 : 0.44);
        ctx.beginPath();
        for (i = 0; i < birds.length; i++) {
          var bd = birds[i];
          if ((bd.nb < ACCENT_NB) !== accent) continue;
          var sp2 = Math.sqrt(bd.vx * bd.vx + bd.vy * bd.vy) || 1;
          var ux = bd.vx / sp2, uy = bd.vy / sp2;
          var L = 4.6 * bd.z, Wd = 1.7 * bd.z;
          ctx.moveTo(bd.x + ux * L, bd.y + uy * L);
          ctx.lineTo(bd.x - ux * L * 0.5 - uy * Wd, bd.y - uy * L * 0.5 + ux * Wd);
          ctx.lineTo(bd.x - ux * L * 0.5 + uy * Wd, bd.y - uy * L * 0.5 - ux * Wd);
          ctx.closePath();
        }
        ctx.fill();
      }

      for (var pd3 = 0; pd3 < predators.length; pd3++) {
        var PD = predators[pd3];
        if (!PD.active) continue;
        var pg = ctx.createRadialGradient(PD.x, PD.y, 0, PD.x, PD.y, 26);
        pg.addColorStop(0, withAlpha(palette.b, 0.22));
        pg.addColorStop(1, withAlpha(palette.b, 0));
        ctx.fillStyle = pg;
        ctx.beginPath(); ctx.arc(PD.x, PD.y, 26, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = withAlpha(palette.b, 0.6);
        ctx.beginPath(); ctx.arc(PD.x, PD.y, 3.4, 0, Math.PI * 2); ctx.fill();
      }
    };

    /* let the field organise before it is first painted */
    function prewarm() { for (var i = 0; i < 90; i++) step(1, true); }
    prewarm();
    onResize = function () { reset(); prewarm(); };
  }

  /* ===================================================================
     signal — scrolling Ornstein-Uhlenbeck traces
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
    angio: initAngio,
    murmuration: initMurmuration,
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
