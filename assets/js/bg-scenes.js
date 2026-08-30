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
    turing:    0.45,
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
    var MAX_TIPS = 20, MAX_SEGS = 5200, SEG_MIN = 2.6;
    var W_START = 3.2, W_MIN = 0.5;
    var CELL = 26, ANAST_R = 11;
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

        /* bifurcation: parent terminates, two daughters continue,
           calibres set by Murray's law r0^3 = r1^3 + r2^3 */
        if (tips.length < MAX_TIPS - 1 && tp.gen < 5 &&
            Math.random() < 0.0035 * near * adv) {
          var fr = 0.35 + Math.random() * 0.30;
          var r1 = Math.max(W_MIN, tp.w * Math.cbrt(fr));
          var r2 = Math.max(W_MIN, tp.w * Math.cbrt(1 - fr));
          var spread = 0.45 + Math.random() * 0.35;
          tips.push(newTip(tp.x, tp.y, tp.ang + spread * (r2 / (r1 + r2)) * 2, r1, tp.gen + 1));
          tips.push(newTip(tp.x, tp.y, tp.ang - spread * (r1 / (r1 + r2)) * 2, r2, tp.gen + 1));
          tips.splice(i, 1);
          continue;
        }

        if (tp.age > tp.maxAge ||
            tp.x < -70 || tp.x > W + 70 || tp.y < -70 || tp.y > H + 70) {
          tips.splice(i, 1);
        }
      }
      while (tips.length < 4) seedTip();
      while (segs.length > MAX_SEGS * 5) segs.splice(0, 5);      /* regression */

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

      /* vessels: 8 calibre buckets, each drawn as a soft halo + core so
         they read as tubes. Bucketing keeps this to a handful of strokes. */
      var NB = 8, bw = (W_START - W_MIN) / (NB - 1);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (var pass = 0; pass < 2; pass++) {
        for (var b = 0; b < NB; b++) {
          var wpx = W_MIN + b * bw;
          ctx.lineWidth = pass === 0 ? wpx + 2.2 : wpx;
          ctx.strokeStyle = withAlpha(palette.a, pass === 0 ? 0.045 : 0.13 + b * 0.022);
          ctx.beginPath();
          var drew = false;
          for (var q = 0; q < segs.length; q += 5) {
            var bi = Math.max(0, Math.min(NB - 1, Math.round((segs[q + 4] - W_MIN) / bw)));
            if (bi !== b) continue;
            ctx.moveTo(segs[q], segs[q + 1]);
            ctx.lineTo(segs[q + 2], segs[q + 3]);
            drew = true;
          }
          if (drew) ctx.stroke();
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

     Reynolds' three rules (separation, alignment, cohesion) over a
     spatial hash, plus a slowly wandering roost the flock orbits and
     an occasional raptor that cuts through. The order parameter of the
     flock (mean unit velocity, as in the Vicsek model) sits around
     0.9 and drops sharply when the raptor passes -- which is exactly
     the splitting and re-forming that makes a murmuration legible.
     =================================================================== */
  function initMurmuration() {
    var birds = [], predator = null;
    /* MINV sits close to MAXV on purpose. With a wide band the birds
       start near MINV and are pushed to the cap by the accumulated
       steering forces, so the flock measurably doubles its mean speed
       over the first ~5 s. Starting them at cruise speed and keeping
       the band narrow holds the pace flat from the first frame. */
    var SEP = 19, ALI = 46, COH = 90, MAXV = 2.1, MINV = 1.55, CRUISE = 1.95;
    var CELL = 70, gw = 1, gh = 1;

    function reset() {
      var n = Math.max(120, Math.min(420, Math.round((W * H) / 3100)));
      birds = [];
      for (var i = 0; i < n; i++) {
        var a0 = Math.random() * Math.PI * 2;
        birds.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: Math.cos(a0) * CRUISE, vy: Math.sin(a0) * CRUISE,
        });
      }
      gw = Math.ceil(W / CELL) + 3;
      gh = Math.ceil(H / CELL) + 3;
      predator = { x: -200, y: H / 2, vx: 2.2, vy: 0, active: false };
    }
    reset();

    step = function (dt, silent) {
      var adv = dt * speed;

      var ax = W / 2 + Math.cos(t * 0.0035) * W * 0.30;
      var ay = H / 2 + Math.sin(t * 0.0027) * H * 0.26;

      if (!predator.active && Math.random() < 0.0012 * adv) {
        predator.active = true;
        predator.x = -60; predator.y = Math.random() * H;
        var pa = (Math.random() - 0.5) * 0.6;
        predator.vx = Math.cos(pa) * 2.2; predator.vy = Math.sin(pa) * 2.2;
      }
      if (predator.active) {
        predator.x += predator.vx * adv;
        predator.y += predator.vy * adv;
        if (predator.x > W + 80) predator.active = false;
      }

      var grid = new Map(), i, k;
      for (i = 0; i < birds.length; i++) {
        k = (Math.floor(birds[i].y / CELL) + 1) * gw + Math.floor(birds[i].x / CELL) + 1;
        var cellArr = grid.get(k);
        if (!cellArr) { cellArr = []; grid.set(k, cellArr); }
        cellArr.push(i);
      }

      for (i = 0; i < birds.length; i++) {
        var p = birds[i];
        var sx = 0, sy = 0, avx = 0, avy = 0, cx = 0, cy = 0, na = 0, nc = 0;
        var gx = Math.floor(p.x / CELL) + 1, gy = Math.floor(p.y / CELL) + 1;
        for (var oy = -1; oy <= 1; oy++) {
          for (var ox = -1; ox <= 1; ox++) {
            var arr = grid.get((gy + oy) * gw + (gx + ox));
            if (!arr) continue;
            for (var a = 0; a < arr.length; a++) {
              var j = arr[a];
              if (j === i) continue;
              var q = birds[j];
              var dx = q.x - p.x, dy = q.y - p.y, d2 = dx * dx + dy * dy;
              if (d2 < SEP * SEP) { sx -= dx; sy -= dy; }
              if (d2 < ALI * ALI) { avx += q.vx; avy += q.vy; na++; }
              if (d2 < COH * COH) { cx += q.x; cy += q.y; nc++; }
            }
          }
        }
        p.vx += sx * 0.048; p.vy += sy * 0.048;
        if (na) { p.vx += (avx / na - p.vx) * 0.050; p.vy += (avy / na - p.vy) * 0.050; }
        if (nc) { p.vx += (cx / nc - p.x) * 0.00038; p.vy += (cy / nc - p.y) * 0.00038; }
        p.vx += (ax - p.x) * 0.00022; p.vy += (ay - p.y) * 0.00022;

        if (predator.active) {
          var pdx = p.x - predator.x, pdy = p.y - predator.y;
          var pd2 = pdx * pdx + pdy * pdy;
          if (pd2 < 14400) {
            var pd = Math.sqrt(pd2) || 1;
            p.vx += (pdx / pd) * 0.9; p.vy += (pdy / pd) * 0.9;
          }
        }
        p.vx += (Math.random() - 0.5) * 0.22;
        p.vy += (Math.random() - 0.5) * 0.22;

        var spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (spd > MAXV) { p.vx = p.vx / spd * MAXV; p.vy = p.vy / spd * MAXV; }
        else if (spd < MINV && spd > 0) { p.vx = p.vx / spd * MINV; p.vy = p.vy / spd * MINV; }
        p.x += p.vx * adv; p.y += p.vy * adv;
      }

      if (silent) return;

      ctx.clearRect(0, 0, W, H);
      /* two batched paths (body colour + accent) rather than a fill per
         bird, so raising the flock size stays cheap */
      var L = 5.4, Wd = 2.0;
      for (var pass = 0; pass < 2; pass++) {
        ctx.fillStyle = withAlpha(pass === 0 ? palette.text : palette.a, 0.46);
        ctx.beginPath();
        for (i = 0; i < birds.length; i++) {
          if ((i % 9 === 0) !== (pass === 1)) continue;
          var bd = birds[i];
          var sp2 = Math.sqrt(bd.vx * bd.vx + bd.vy * bd.vy) || 1;
          var ux = bd.vx / sp2, uy = bd.vy / sp2;
          ctx.moveTo(bd.x + ux * L, bd.y + uy * L);
          ctx.lineTo(bd.x - ux * L * 0.5 - uy * Wd, bd.y - uy * L * 0.5 + ux * Wd);
          ctx.lineTo(bd.x - ux * L * 0.5 + uy * Wd, bd.y - uy * L * 0.5 - ux * Wd);
          ctx.closePath();
        }
        ctx.fill();
      }
      if (predator.active) {
        ctx.fillStyle = withAlpha(palette.b, 0.5);
        ctx.beginPath();
        ctx.arc(predator.x, predator.y, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    /* let the flock cohere before it is first painted */
    function prewarm() { for (var i = 0; i < 150; i++) step(1, true); }
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
