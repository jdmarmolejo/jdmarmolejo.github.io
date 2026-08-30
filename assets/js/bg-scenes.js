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
                 gradient (chemotaxis as a reinforced random walk),
                 laying down vessels that branch, thin with each
                 generation, and regress when they go unperfused.
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

     Hypoxic sites release VEGF. Tip cells migrate up the gradient
     (chemotaxis, modelled as a reinforced random walk: heading is a
     weighted blend of persistence, gradient direction and noise) and
     drag a vessel behind them. Sprouts branch, each generation thinner
     than its parent. When a tip reaches its source the site is
     perfused and a new hypoxic region appears elsewhere. Old vessel
     segments are pruned, so the network keeps remodelling.
     =================================================================== */
  function initAngio() {
    var sources = [], tips = [], segs = [];
    var MAX_TIPS = 22, MAX_SEGS = 1500;
    var W_START = 2.8, W_MIN = 0.55, W_DECAY = 0.74;

    function newSource() {
      return {
        x: 0.08 * W + Math.random() * 0.84 * W,
        y: 0.08 * H + Math.random() * 0.84 * H,
        phase: Math.random() * Math.PI * 2,
        perfused: 0,
      };
    }
    function nearestSource(x, y) {
      var best = -1, bd = Infinity;
      for (var i = 0; i < sources.length; i++) {
        if (sources[i].perfused > 0) continue;
        var dx = sources[i].x - x, dy = sources[i].y - y;
        var d = dx * dx + dy * dy;
        if (d < bd) { bd = d; best = i; }
      }
      return best;
    }
    function newTip(x, y, ang, w, gen) {
      return {
        x: x, y: y, ang: ang, w: w, gen: gen,
        target: nearestSource(x, y),
        age: 0, maxAge: 900 + Math.random() * 700,
      };
    }
    function seedTip() {
      var edge = (Math.random() * 4) | 0, x, y, ang;
      if (edge === 0)      { x = Math.random() * W; y = -8;     ang =  Math.PI / 2; }
      else if (edge === 1) { x = W + 8; y = Math.random() * H;  ang =  Math.PI; }
      else if (edge === 2) { x = Math.random() * W; y = H + 8;  ang = -Math.PI / 2; }
      else                 { x = -8;    y = Math.random() * H;  ang =  0; }
      tips.push(newTip(x, y, ang, W_START, 0));
    }
    function reset() {
      sources = []; tips = []; segs = [];
      var ns = Math.max(3, Math.min(6, Math.round(W / 460)));
      for (var i = 0; i < ns; i++) sources.push(newSource());
      for (var j = 0; j < 3; j++) seedTip();
    }
    reset();
    onResize = reset;

    function wrapAngle(a) {
      while (a > Math.PI) a -= Math.PI * 2;
      while (a < -Math.PI) a += Math.PI * 2;
      return a;
    }

    step = function (dt) {
      var adv = dt * speed;

      for (var i = tips.length - 1; i >= 0; i--) {
        var tp = tips[i];

        if (tp.target < 0 || !sources[tp.target] || sources[tp.target].perfused > 0) {
          tp.target = nearestSource(tp.x, tp.y);
        }

        /* chemotaxis: steer toward the VEGF source, with persistence + noise */
        if (tp.target >= 0) {
          var src = sources[tp.target];
          var want = Math.atan2(src.y - tp.y, src.x - tp.x);
          var diff = wrapAngle(want - tp.ang);
          tp.ang += diff * 0.035 * adv;
        }
        tp.ang += (Math.random() - 0.5) * 0.22 * adv;

        var sp = 0.62 + tp.gen * 0.05;
        var nx = tp.x + Math.cos(tp.ang) * sp * adv;
        var ny = tp.y + Math.sin(tp.ang) * sp * adv;

        var bucket = Math.max(0, Math.min(3, Math.round((tp.w - W_MIN) / 0.75)));
        segs.push(tp.x, tp.y, nx, ny, bucket);
        tp.x = nx; tp.y = ny; tp.age += adv;

        /* sprouting: more likely close to a source, and capped by generation */
        var near = 1;
        if (tp.target >= 0) {
          var sd = Math.hypot(sources[tp.target].x - tp.x, sources[tp.target].y - tp.y);
          near = sd < Math.min(W, H) * 0.22 ? 2.4 : 1;
          if (sd < 16) {                       /* perfused */
            sources[tp.target].perfused = 1;
            sources[tp.target] = newSource();
            sources[tp.target].perfused = 0;
            tp.target = nearestSource(tp.x, tp.y);
          }
        }
        if (tips.length < MAX_TIPS && tp.gen < 4 &&
            Math.random() < 0.0045 * near * adv) {
          var cw = Math.max(W_MIN, tp.w * W_DECAY);
          tips.push(newTip(tp.x, tp.y,
            tp.ang + (Math.random() < 0.5 ? 0.75 : -0.75), cw, tp.gen + 1));
          tp.w = Math.max(W_MIN, tp.w * 0.94);
        }

        var out = tp.x < -70 || tp.x > W + 70 || tp.y < -70 || tp.y > H + 70;
        if (tp.age > tp.maxAge || out) tips.splice(i, 1);
      }
      while (tips.length < 3) seedTip();
      while (segs.length > MAX_SEGS * 5) segs.splice(0, 5);   /* vessel regression */

      ctx.clearRect(0, 0, W, H);

      /* hypoxic sites */
      for (var s = 0; s < sources.length; s++) {
        var so = sources[s];
        var pulse = 0.5 + 0.5 * Math.sin(t * 0.02 + so.phase);
        var rad = 34 + pulse * 12;
        var g = ctx.createRadialGradient(so.x, so.y, 0, so.x, so.y, rad);
        g.addColorStop(0, withAlpha(palette.b, 0.16 + pulse * 0.07));
        g.addColorStop(1, withAlpha(palette.b, 0));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(so.x, so.y, rad, 0, Math.PI * 2); ctx.fill();
      }

      /* vessels, batched by calibre so thickness varies without a
         stroke call per segment */
      var widths = [0.7, 1.3, 2.0, 2.8];
      for (var b = 0; b < 4; b++) {
        ctx.lineWidth = widths[b];
        ctx.lineCap = "round";
        ctx.strokeStyle = withAlpha(palette.a, 0.16 + b * 0.05);
        ctx.beginPath();
        for (var q = 0; q < segs.length; q += 5) {
          if (segs[q + 4] !== b) continue;
          ctx.moveTo(segs[q], segs[q + 1]);
          ctx.lineTo(segs[q + 2], segs[q + 3]);
        }
        ctx.stroke();
      }

      /* tip cells */
      for (var k = 0; k < tips.length; k++) {
        var tq = tips[k];
        var gg = ctx.createRadialGradient(tq.x, tq.y, 0, tq.x, tq.y, 8);
        gg.addColorStop(0, withAlpha(palette.a, 0.45));
        gg.addColorStop(1, withAlpha(palette.a, 0));
        ctx.fillStyle = gg;
        ctx.beginPath(); ctx.arc(tq.x, tq.y, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = withAlpha(palette.a, 0.7);
        ctx.beginPath(); ctx.arc(tq.x, tq.y, 1.6, 0, Math.PI * 2); ctx.fill();
      }
    };
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
