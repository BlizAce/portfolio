/* Neural-sphere background: depth-shaded neurons with synapse pulses. */
(function () {
  "use strict";
  const cvs = document.getElementById("neural-canvas");
  if (!cvs) return;
  const ctx = cvs.getContext("2d");
  let W, H, DPR, nodes = [], pulses = [], raf = null, running = false;
  let mouse = { x: -9999, y: -9999 };
  const PALETTE = [[139, 92, 246], [34, 211, 238], [236, 72, 153]];

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = cvs.clientWidth; H = cvs.clientHeight;
    cvs.width = W * DPR; cvs.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    build();
  }

  function build() {
    const count = Math.max(14, Math.min(34, Math.round((W * H) / 52000)));
    nodes = [];
    for (let i = 0; i < count; i++) {
      const z = 0.35 + Math.random() * 0.65; // depth: small & dim = far
      nodes.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - .5) * .22 * z, vy: (Math.random() - .5) * .22 * z,
        r: (3 + Math.random() * 7) * z, z,
        col: PALETTE[i % PALETTE.length],
        phase: Math.random() * Math.PI * 2,
      });
    }
    pulses = [];
  }

  function linkDist() { return Math.min(190, Math.max(120, W / 8)); }

  function spawnPulses(dt) {
    if (pulses.length > 14 || Math.random() > dt * 1.6) return;
    const a = Math.floor(Math.random() * nodes.length);
    for (let tries = 0; tries < 6; tries++) {
      const b = Math.floor(Math.random() * nodes.length);
      if (a === b) continue;
      const d = Math.hypot(nodes[a].x - nodes[b].x, nodes[a].y - nodes[b].y);
      if (d < linkDist()) { pulses.push({ a, b, t: 0, speed: .5 + Math.random() * .7 }); return; }
    }
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    ctx.clearRect(0, 0, W, H);
    const LD = linkDist();
    // edges
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      a.x += a.vx; a.y += a.vy;
      if (a.x < -20) a.x = W + 20; if (a.x > W + 20) a.x = -20;
      if (a.y < -20) a.y = H + 20; if (a.y > H + 20) a.y = -20;
      // gentle mouse repulsion
      const mdx = a.x - mouse.x, mdy = a.y - mouse.y, md = Math.hypot(mdx, mdy);
      if (md < 130 && md > 1) { a.x += mdx / md * .6; a.y += mdy / md * .6; }
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LD) {
          const al = (1 - d / LD) * .34 * ((a.z + b.z) / 2);
          ctx.strokeStyle = `rgba(139,120,220,${al})`;
          ctx.lineWidth = .8;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    // synapse pulses travelling along edges
    spawnPulses(dt);
    for (const p of pulses) {
      p.t += dt * p.speed;
      if (p.t >= 1) continue;
      const a = nodes[p.a], b = nodes[p.b];
      const x = a.x + (b.x - a.x) * p.t, y = a.y + (b.y - a.y) * p.t;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 9);
      glow.addColorStop(0, "rgba(255,255,255,.9)");
      glow.addColorStop(.4, "rgba(160,140,255,.55)");
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.fill();
    }
    pulses = pulses.filter(p => p.t < 1);
    // neuron spheres with pulsing halo
    for (const n of nodes) {
      const pulse = 1 + .16 * Math.sin(now / 900 + n.phase);
      const R = n.r * pulse;
      const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, R * 3.4);
      const [r, gg, b] = n.col;
      g.addColorStop(0, `rgba(${r},${gg},${b},${.95 * n.z})`);
      g.addColorStop(.28, `rgba(${r},${gg},${b},${.5 * n.z})`);
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(n.x, n.y, R * 3.4, 0, 7); ctx.fill();
      // lit core with specular offset (sphere feel)
      const cg = ctx.createRadialGradient(n.x - R * .35, n.y - R * .4, R * .1, n.x, n.y, R);
      cg.addColorStop(0, `rgba(255,255,255,${.85 * n.z})`);
      cg.addColorStop(.5, `rgba(${r},${gg},${b},${.9 * n.z})`);
      cg.addColorStop(1, `rgba(${Math.round(r * .4)},${Math.round(gg * .4)},${Math.round(b * .4)},${.9 * n.z})`);
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.arc(n.x, n.y, R, 0, 7); ctx.fill();
    }
    raf = requestAnimationFrame(frame);
  }

  function start() { if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; ctx.clearRect(0, 0, W, H); }

  window.NeuralBG = { start, stop, get running() { return running; } };
  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("pointermove", e => { mouse.x = e.clientX; mouse.y = e.clientY - (cvs.getBoundingClientRect().top - cvs.offsetTop) ; }, { passive: true });
  window.addEventListener("pointerleave", () => { mouse.x = -9999; mouse.y = -9999; });
  resize();
})();
