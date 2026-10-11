/* Theme, motion control + FPS watchdog, reveals, tilt, lightbox, typing. */
(function () {
  "use strict";
  const root = document.documentElement;
  const body = document.body;
  const store = {
    get theme() { return localStorage.getItem("sc-theme") || "dark"; },
    set theme(v) { localStorage.setItem("sc-theme", v); },
    get motion() { return localStorage.getItem("sc-motion"); }, // null | "off" | "on"
    set motion(v) { localStorage.setItem("sc-motion", v); },
  };

  /* ---------- toasts ---------- */
  function toast(msg, actionLabel, onAction, ms = 7000) {
    let zone = document.getElementById("toast-zone");
    if (!zone) { zone = document.createElement("div"); zone.id = "toast-zone"; body.appendChild(zone); }
    const t = document.createElement("div");
    t.className = "toast"; t.setAttribute("role", "status");
    t.innerHTML = `<span>${msg}</span>`;
    if (actionLabel) {
      const b = document.createElement("button");
      b.textContent = actionLabel;
      b.onclick = () => { onAction && onAction(); dismiss(); };
      t.appendChild(b);
    }
    zone.appendChild(t);
    function dismiss() { t.style.opacity = 0; setTimeout(() => t.remove(), 400); }
    setTimeout(dismiss, ms);
  }

  /* ---------- theme ---------- */
  const themeBtn = document.getElementById("theme-toggle");
  function applyTheme(v) {
    root.setAttribute("data-theme", v);
    if (themeBtn) { themeBtn.textContent = v === "dark" ? "☾" : "☀"; themeBtn.classList.toggle("on", v === "light"); }
  }
  applyTheme(store.theme);
  themeBtn && themeBtn.addEventListener("click", () => {
    store.theme = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(store.theme);
  });

  /* ---------- motion control ---------- */
  const motionBtn = document.getElementById("motion-toggle");
  function prefersReduced() { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
  function setMotion(on, opts = {}) {
    body.classList.toggle("no-motion", !on);
    if (window.NeuralBG) on ? window.NeuralBG.start() : window.NeuralBG.stop();
    document.dispatchEvent(new CustomEvent("sc:motion", { detail: { on } }));
    if (motionBtn) {
      motionBtn.classList.toggle("on", on);
      motionBtn.setAttribute("aria-pressed", String(on));
      const tip = motionBtn.querySelector(".tip");
      if (tip) tip.textContent = on ? "Animations ON — click to disable" : "Animations OFF — click to enable";
    }
    if (!opts.silent) store.motion = on ? "on" : "off";
  }
  const savedMotion = store.motion;
  const initialOn = savedMotion !== null ? savedMotion === "on" : !prefersReduced();
  setMotion(initialOn, { silent: true });
  motionBtn && motionBtn.addEventListener("click", () => {
    setMotion(body.classList.contains("no-motion"));
  });

  /* ---------- FPS watchdog: auto-drop below 25fps ---------- */
  (function fpsWatch() {
    if (!window.NeuralBG) return;
    let frames = 0, t0 = performance.now(), lowStreak = 0, tripped = false;
    function tick(now) {
      frames++;
      const dt = now - t0;
      if (dt >= 1000) {
        const fps = Math.round(frames * 1000 / dt);
        frames = 0; t0 = now;
        if (!window.NeuralBG.running) { lowStreak = 0; return requestAnimationFrame(tick); }
        if (fps < 25) lowStreak++; else lowStreak = Math.max(0, lowStreak - 1);
        if (lowStreak >= 4 && !tripped) {
          tripped = true;
          setMotion(false);
          toast("⚡ Frame rate dropped below 25fps — animations were switched off automatically.", "Re-enable", () => {
            setMotion(true); lowStreak = 0; tripped = false;
          });
        }
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();

  /* ---------- scroll reveals ---------- */
  const io = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }, { threshold: .12 });
  document.querySelectorAll(".reveal").forEach(el => io.observe(el));

  /* ---------- card tilt (tactile) ---------- */
  const fine = window.matchMedia("(pointer:fine)").matches;
  if (fine) {
    document.querySelectorAll("[data-tilt]").forEach(card => {
      card.addEventListener("pointermove", e => {
        if (body.classList.contains("no-motion")) return;
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        card.style.transform = `perspective(900px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg) translateY(-4px)`;
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });
  }

  /* ---------- mobile nav ---------- */
  const burger = document.getElementById("burger"), links = document.getElementById("nav-links");
  burger && burger.addEventListener("click", () => links.classList.toggle("open"));
  links && links.querySelectorAll("a").forEach(a => a.addEventListener("click", () => links.classList.remove("open")));

  /* ---------- lightbox ---------- */
  const lb = document.createElement("div"); lb.className = "lightbox"; lb.innerHTML = "<img alt='figure'>";
  body.appendChild(lb);
  lb.addEventListener("click", () => lb.classList.remove("open"));
  document.querySelectorAll("[data-zoom]").forEach(el => {
    el.addEventListener("click", () => {
      const img = el.tagName === "IMG" ? el : el.querySelector("img");
      if (!img) return;
      lb.querySelector("img").src = img.src;
      lb.classList.add("open");
    });
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") lb.classList.remove("open"); });

  /* ---------- hero typing ---------- */
  const typedEl = document.getElementById("typed");
  if (typedEl) {
    const words = JSON.parse(typedEl.dataset.words || "[]");
    let wi = 0, ci = 0, del = false;
    function step() {
      if (body.classList.contains("no-motion")) { typedEl.textContent = words[0]; return; }
      const w = words[wi % words.length];
      typedEl.textContent = w.slice(0, ci);
      if (!del && ci < w.length) { ci++; setTimeout(step, 58); }
      else if (!del) { del = true; setTimeout(step, 1600); }
      else if (ci > 0) { ci--; setTimeout(step, 26); }
      else { del = false; wi++; setTimeout(step, 300); }
    }
    step();
  }

  /* ---------- GIFs: pause offscreen gifs is not possible w/ <img>; keep simple ---------- */
  document.querySelectorAll("img[data-poster]").forEach(img => {
    if (!img.dataset.gifsrc) img.dataset.gifsrc = img.src; // remember the animated source
    // poster fallback already handled via srcset swap when motion off
    const swap = () => {
      if (body.classList.contains("no-motion") && img.dataset.poster) img.src = img.dataset.poster;
      else if (!body.classList.contains("no-motion") && img.dataset.gifsrc) img.src = img.dataset.gifsrc;
    };
    swap();
    document.addEventListener("sc:motion", swap);
  });

  /* ---------- footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());
})();
