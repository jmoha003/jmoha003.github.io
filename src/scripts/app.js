const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ───── theme ───── */
const root = document.documentElement;
$('#theme')?.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  try { localStorage.setItem('theme', next); } catch {}
});

/* ───── nav ───── */
const nav = $('#nav'), links = $('#links'), burger = $('#burger');
burger?.addEventListener('click', () => {
  const open = links.classList.toggle('open');
  burger.setAttribute('aria-expanded', String(open));
});
$$('#links a').forEach((a) => a.addEventListener('click', () => {
  links.classList.remove('open'); burger?.setAttribute('aria-expanded', 'false');
}));

const prog = $('#prog'), topBtn = $('#top-btn');
addEventListener('scroll', () => {
  const h = document.documentElement;
  const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
  if (prog) prog.style.width = pct + '%';
  nav?.classList.toggle('stuck', h.scrollTop > 8);
  topBtn?.classList.toggle('show', h.scrollTop > 600);
}, { passive: true });
topBtn?.addEventListener('click', () => scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));

/* scroll-spy */
const spy = new IntersectionObserver((es) => {
  es.forEach((e) => {
    if (!e.isIntersecting) return;
    $$('#links a').forEach((a) =>
      a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + e.target.id)));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
$$('section[id]').forEach((s) => spy.observe(s));

/* ───── reveal fallback (browsers without animation-timeline) ───── */
if (!CSS.supports('animation-timeline: view()')) {
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.06 });
  $$('.rv').forEach((el) => io.observe(el));
  $$('.stagger').forEach((g) => $$(':scope > *', g).forEach((c, i) => {
    c.classList.add('rv'); c.style.transitionDelay = i * 70 + 'ms'; io.observe(c);
  }));
}

/* ───── counters ───── */
const fmt = (v, p, s) => p + (v >= 1000 ? v.toLocaleString() : v) + s;
const counters = new IntersectionObserver((es) => {
  es.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target, target = +el.dataset.count;
    const p = el.dataset.prefix || '', s = el.dataset.suffix || '';
    counters.unobserve(el);
    if (reduced) { el.textContent = fmt(target, p, s); return; }
    const t0 = performance.now(), dur = 1500;
    const step = (t) => {
      const k = Math.min((t - t0) / dur, 1);
      el.textContent = fmt(Math.round(target * (1 - Math.pow(1 - k, 3))), p, s);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}, { threshold: 0.5 });
$$('[data-count]').forEach((el) => counters.observe(el));

/* ───── project modal ───── */
const modal = $('#modal');
let lastFocus = null;
const openModal = (id, cardImg) => {
  const p = (window.__PROJECTS__ || []).find((x) => x.id === id);
  if (!p) return;
  lastFocus = document.activeElement;
  $('#modal-tag').textContent = p.tag;
  $('#modal-title').textContent = p.title;
  $('#modal-detail').textContent = p.detail;
  $('#modal-img').innerHTML = cardImg ? `<img src="${cardImg.currentSrc || cardImg.src}" alt="${p.title}">` : '';
  $('#modal-stats').innerHTML = p.stats.filter(([a]) => a)
    .map(([a, b]) => `<div><b>${a}</b><span>${b}</span></div>`).join('');
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  $('.x-btn', modal)?.focus();
};
const closeModal = () => {
  modal.classList.remove('open'); document.body.style.overflow = '';
  lastFocus?.focus();
};
$$('[data-project]').forEach((btn) => btn.addEventListener('click', () =>
  openModal(btn.dataset.project, $('img', btn))));
$$('[data-close]', modal).forEach((el) => el.addEventListener('click', closeModal));

/* ───── gallery lightbox ───── */
const lb = $('#lb'), lbImg = $('#lb-img'), lbCap = $('#lb-cap');
const shots = $$('#gal button');
let gi = 0;
const showShot = (i) => {
  gi = (i + shots.length) % shots.length;
  const img = $('img', shots[gi]);
  lbImg.src = img.currentSrc || img.src;
  lbImg.alt = img.alt;
  lbCap.textContent = img.alt;
};
shots.forEach((b, i) => b.addEventListener('click', () => {
  lastFocus = b; showShot(i); lb.classList.add('open');
  document.body.style.overflow = 'hidden'; $('#lb-next')?.focus();
}));
const closeLb = () => { lb.classList.remove('open'); document.body.style.overflow = ''; lastFocus?.focus(); };
$('#lb-next')?.addEventListener('click', (e) => { e.stopPropagation(); showShot(gi + 1); });
$('#lb-prev')?.addEventListener('click', (e) => { e.stopPropagation(); showShot(gi - 1); });
lb?.addEventListener('click', (e) => { if (e.target === lb || e.target === lbImg) closeLb(); });

/* ───── publication filter ───── */
const pubs = $$('.pub'), empty = $('#pub-empty'), q = $('#pub-q');
let filter = 'all';
const applyFilter = () => {
  const term = (q?.value || '').trim().toLowerCase();
  let n = 0;
  pubs.forEach((el) => {
    let ok = filter === 'all'
      || (filter[0] === 'y' && el.dataset.year === filter.slice(1))
      || (filter[0] === 't' && el.dataset.topics.split('|').includes(filter.slice(1)));
    if (ok && term) ok = el.dataset.text.includes(term);
    el.style.display = ok ? '' : 'none';
    if (ok) n++;
  });
  if (empty) empty.hidden = n > 0;
};
$$('.chip[data-f]').forEach((c) => c.addEventListener('click', () => {
  $$('.chip[data-f]').forEach((o) => o.setAttribute('aria-pressed', String(o === c)));
  filter = c.dataset.f; applyFilter();
}));
q?.addEventListener('input', applyFilter);

/* ───── command palette ───── */
const pal = $('#pal'), palQ = $('#pal-q'), palList = $('#pal-list');
const items = [
  ...$$('#links a').map((a) => ({ label: a.textContent.trim(), hint: 'Section', href: a.getAttribute('href') })),
  ...(window.__PROJECTS__ || []).map((p) => ({ label: p.title, hint: 'Project', pid: p.id })),
  ...$$('.pub h4').map((h) => ({ label: h.textContent.trim(), hint: 'Paper', href: '#papers' })),
  { label: 'Toggle theme', hint: 'Action', act: () => $('#theme').click() },
  { label: 'Résumé (PDF)', hint: 'Link', href: '/JoshitMohanty_Resume.pdf' },
  { label: 'Google Scholar', hint: 'Link', href: 'https://scholar.google.com/citations?user=MB2HbuAAAAAJ&hl=en' },
];
let sel = 0, shown = [];
const renderPal = () => {
  const term = palQ.value.trim().toLowerCase();
  shown = (term ? items.filter((i) => i.label.toLowerCase().includes(term)) : items).slice(0, 9);
  sel = 0;
  palList.innerHTML = shown.map((i, n) =>
    `<li data-sel="${n === 0}" data-n="${n}"><button type="button">${i.label}<span class="k">${i.hint}</span></button></li>`).join('')
    || '<li><button type="button" style="color:var(--ink-3)">No matches</button></li>';
};
const runItem = (i) => {
  if (!i) return;
  closePal();
  if (i.act) i.act();
  else if (i.pid) { const b = $(`[data-project="${i.pid}"]`); b?.scrollIntoView({ block: 'center' }); openModal(i.pid, b ? $('img', b) : null); }
  else if (i.href) location.href = i.href;
};
const openPal = () => { pal.classList.add('open'); palQ.value = ''; renderPal(); palQ.focus(); document.body.style.overflow = 'hidden'; };
const closePal = () => { pal.classList.remove('open'); document.body.style.overflow = ''; };
$('#cmd')?.addEventListener('click', openPal);
$$('[data-close]', pal).forEach((el) => el.addEventListener('click', closePal));
palQ?.addEventListener('input', renderPal);
palList?.addEventListener('click', (e) => {
  const li = e.target.closest('li[data-n]'); if (li) runItem(shown[+li.dataset.n]);
});
palQ?.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + shown.length) % shown.length;
    $$('#pal-list li').forEach((li, n) => li.setAttribute('data-sel', String(n === sel)));
  } else if (e.key === 'Enter') { e.preventDefault(); runItem(shown[sel]); }
});

/* ───── global keys ───── */
addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); pal.classList.contains('open') ? closePal() : openPal(); }
  if (e.key === 'Escape') { closePal(); closeModal(); closeLb(); }
  if (lb?.classList.contains('open')) {
    if (e.key === 'ArrowRight') showShot(gi + 1);
    if (e.key === 'ArrowLeft') showShot(gi - 1);
  }
});

/* ═══════════════════════════════════════════════════════════
   NRMP APPLICATION-FEVER MODEL
   Prestige-biased transmission on a toroidal lattice, with an
   annual matching phase. Unmatched agents reapply escalated.
   ═══════════════════════════════════════════════════════════ */
(() => {
  const cv = document.getElementById('sim');
  if (!cv) return;
  const ctx = cv.getContext('2d', { alpha: false });
  const BASE = 10;           // baseline applications
  const FEVER = BASE * 1.25; // fever threshold
  let N = 40, ratio = 1.6, influence = 0.55;
  let side, score, apps, year, running = true, acc = 0;

  const init = () => {
    side = N;
    const n = side * side;
    score = new Float32Array(n);
    apps = new Float32Array(n);
    for (let i = 0; i < n; i++) { score[i] = Math.random(); apps[i] = BASE * (0.9 + Math.random() * 0.2); }
    year = 0;
    draw(); readout();
  };
  const idx = (x, y) => ((y + side) % side) * side + ((x + side) % side);

  const step = () => {
    const n = side * side;
    // 1 — prestige-biased social transmission
    for (let k = 0; k < n; k++) {
      const i = (Math.random() * n) | 0;
      const x = i % side, y = (i / side) | 0;
      const d = [[1,0],[-1,0],[0,1],[0,-1]][(Math.random() * 4) | 0];
      const j = idx(x + d[0], y + d[1]);
      const gap = score[j] - score[i];
      if (gap > 0 && Math.random() < gap * influence) {
        apps[i] += (apps[j] - apps[i]) * 0.5;   // adopt upward
      }
    }
    // 2 — matching phase: highest scores match, leave, and are replaced
    const positions = Math.floor(n / ratio);
    const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => score[b] - score[a]);
    for (let r = 0; r < n; r++) {
      const i = order[r];
      if (r < positions) {                       // matched → new cohort member
        score[i] = Math.random();
        apps[i] = BASE * (0.9 + Math.random() * 0.2);
      } else {                                   // unmatched → escalate and carry fever
        apps[i] *= 1.08;
      }
    }
    year++;
  };

  const draw = () => {
    const px = cv.width / side;
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg') || '#0b0d10';
    ctx.fillRect(0, 0, cv.width, cv.height);
    for (let i = 0; i < side * side; i++) {
      const t = Math.max(0, Math.min(1, (apps[i] - BASE) / (BASE * 1.4)));
      const h = 172 - t * 150;                   // teal → amber as fever rises
      const l = 26 + t * 42;
      ctx.fillStyle = `hsl(${h} ${55 + t * 35}% ${l}%)`;
      ctx.fillRect((i % side) * px, ((i / side) | 0) * px, px + 0.6, px + 0.6);
    }
  };

  const readout = () => {
    const n = side * side;
    let sum = 0, fev = 0;
    for (let i = 0; i < n; i++) { sum += apps[i]; if (apps[i] > FEVER) fev++; }
    const mean = sum / n;
    document.getElementById('r-year').textContent = year;
    document.getElementById('r-apps').textContent = mean.toFixed(1);
    document.getElementById('r-fever').textContent = Math.round((fev / n) * 100) + '%';
    const drift = ((mean - BASE) / BASE) * 100;
    document.getElementById('r-drift').textContent = (drift >= 0 ? '+' : '') + drift.toFixed(0) + '%';
  };

  let last = 0;
  const loop = (t) => {
    requestAnimationFrame(loop);
    if (!running || reduced) return;
    if (t - last < 420) return;
    last = t;
    step(); draw(); readout();
  };

  const bind = (id, vid, fn, fmt) => {
    const el = document.getElementById(id);
    el?.addEventListener('input', () => {
      const v = +el.value; fn(v);
      document.getElementById(vid).textContent = fmt(v);
    });
  };
  bind('s-scale', 'v-scale', (v) => { N = v; init(); }, (v) => v);
  bind('s-ratio', 'v-ratio', (v) => { ratio = v / 10; }, (v) => (v / 10).toFixed(1));
  bind('s-influence', 'v-influence', (v) => { influence = v / 100; }, (v) => (v / 100).toFixed(2));

  const toggle = document.getElementById('sim-toggle');
  toggle?.addEventListener('click', () => {
    running = !running;
    toggle.textContent = running ? 'Pause' : 'Play';
    toggle.setAttribute('aria-pressed', String(running));
  });
  document.getElementById('sim-reset')?.addEventListener('click', init);

  // only run while visible
  new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting && running) { running = false; if (toggle) toggle.textContent = 'Play'; } }),
    { threshold: 0 }).observe(cv);

  init();
  requestAnimationFrame(loop);
})();

/* ───── hero particle field ───── */
(() => {
  const cv = document.getElementById('field');
  if (!cv || reduced) return;
  const ctx = cv.getContext('2d');
  let w, h, pts = [];
  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = cv.width = innerWidth * dpr; h = cv.height = cv.offsetHeight * dpr;
    ctx.scale(1, 1);
    pts = Array.from({ length: Math.min(70, Math.floor(innerWidth / 22)) }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.22 * dpr, vy: (Math.random() - 0.5) * 0.22 * dpr,
    }));
  };
  addEventListener('resize', resize); resize();
  const tick = () => {
    requestAnimationFrame(tick);
    ctx.clearRect(0, 0, w, h);
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#5eead4';
    for (const p of pts) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
    }
    ctx.strokeStyle = accent; ctx.fillStyle = accent;
    for (let i = 0; i < pts.length; i++) {
      ctx.globalAlpha = 0.5; ctx.beginPath();
      ctx.arc(pts[i].x, pts[i].y, 1.5, 0, 7); ctx.fill();
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 20000) {
          ctx.globalAlpha = 0.13 * (1 - d2 / 20000);
          ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
  };
  tick();
})();
