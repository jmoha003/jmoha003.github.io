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
   NRMP APPLICATION-FEVER MODEL  (Mohanty & Collins, WSC 2026)
   Agents copy application behaviour from higher-scoring
   neighbours. Each year the match removes most applicants;
   the unmatched return with escalated behaviour and carry the
   fever into the next cohort. Published run: ~3% -> ~21% in
   the fever zone over 10 years, worst among low scorers.
   ═══════════════════════════════════════════════════════════ */
(() => {
  const cv = document.getElementById('sim');
  const ch = document.getElementById('chart');
  if (!cv || !ch) return;
  const g = cv.getContext('2d'), gc = ch.getContext('2d');
  const BASE = 10, FEVER = 13, YEARS = 10;
  const C = ['#f43f5e', '#f59e0b', '#22d3ee'];        // low / medium / high score
  let N = 40, ratio = 1.6, influence = 0.55;
  let score, apps, year, hist, running = true, done = false;

  const band = (s) => (s < 0.34 ? 0 : s < 0.67 ? 1 : 2);
  const at = (x, y) => ((y + N) % N) * N + ((x + N) % N);

  const init = () => {
    const n = N * N;
    score = new Float32Array(n); apps = new Float32Array(n);
    for (let i = 0; i < n; i++) { score[i] = Math.random(); apps[i] = BASE * (0.95 + Math.random() * 0.1); }
    year = 0; hist = []; done = false;
    const t = document.getElementById('sim-toggle');
    if (t) { t.textContent = 'Pause'; }
    running = true;
    record(); paint();
  };

  const step = () => {
    const n = N * N;
    // 1 — prestige-biased transmission: copy upward from better-scoring neighbours
    for (let k = 0; k < n * 2; k++) {
      const i = (Math.random() * n) | 0, x = i % N, y = (i / N) | 0;
      const d = [[1,0],[-1,0],[0,1],[0,-1]][(Math.random() * 4) | 0];
      const j = at(x + d[0], y + d[1]);
      const gap = score[j] - score[i];
      if (gap > 0 && apps[j] > apps[i] && Math.random() < gap * influence)
        apps[i] += (apps[j] - apps[i]) * 0.6;
    }
    // 2 — the match. Probability of matching rises with score but is never certain,
    //     so strong applicants can also fail and escalate.
    const seats = Math.min(0.95, 1 / ratio);
    for (let i = 0; i < n; i++) {
      const pMatch = Math.min(0.97, seats * (0.45 + 0.85 * score[i]));
      if (Math.random() < pMatch) {                    // matched -> replaced by a new applicant
        score[i] = Math.random();
        apps[i] = BASE * (0.95 + Math.random() * 0.1);
      } else {                                         // unmatched -> reapplies, escalated
        apps[i] = Math.min(apps[i] * 1.16 + 0.35, BASE * 3.2);
      }
    }
    year++; record();
    if (year >= YEARS) { done = true; running = false; const t = document.getElementById('sim-toggle'); if (t) t.textContent = 'Replay'; }
  };

  const record = () => {
    const n = N * N, cnt = [0,0,0], fev = [0,0,0];
    let sum = 0, tot = 0;
    for (let i = 0; i < n; i++) {
      const b = band(score[i]); cnt[b]++; sum += apps[i];
      if (apps[i] > FEVER) { fev[b]++; tot++; }
    }
    hist.push({ all: tot / n, byBand: fev.map((f, i) => (cnt[i] ? f / cnt[i] : 0)) });
    const h = hist[hist.length - 1], mean = sum / n;
    document.getElementById('r-year').textContent = year + ' / ' + YEARS;
    document.getElementById('r-apps').textContent = mean.toFixed(1);
    document.getElementById('r-fever').textContent = (h.all * 100).toFixed(1) + '%';
    const dr = ((mean - BASE) / BASE) * 100;
    document.getElementById('r-drift').textContent = (dr >= 0 ? '+' : '') + dr.toFixed(1) + '%';
  };

  const paint = () => {
    const px = cv.width / N;
    g.fillStyle = '#0a0c10'; g.fillRect(0, 0, cv.width, cv.height);
    for (let i = 0; i < N * N; i++) {
      const x = (i % N) * px, y = ((i / N) | 0) * px;
      if (apps[i] > FEVER) {                            // in the fever zone: score-band colour
        const heat = Math.min(1, (apps[i] - FEVER) / 10);
        g.fillStyle = C[band(score[i])];
        g.globalAlpha = 0.45 + heat * 0.55;
      } else {                                          // calm: near-invisible slate
        g.fillStyle = '#1e293b';
        g.globalAlpha = 0.5 + ((apps[i] - BASE) / (FEVER - BASE)) * 0.4;
      }
      g.fillRect(x, y, px - 0.5, px - 0.5);
    }
    g.globalAlpha = 1;
    chart();
  };

  const chart = () => {
    const W = ch.width, H = ch.height, L = 34, B = 26, maxY = 0.5;
    gc.clearRect(0, 0, W, H);
    const cs = getComputedStyle(document.documentElement);
    const grid = cs.getPropertyValue('--line').trim() || '#232b35';
    const ink = cs.getPropertyValue('--ink-3').trim() || '#6f7d8d';
    gc.font = '10px ui-monospace, monospace'; gc.textBaseline = 'middle';
    for (let k = 0; k <= 5; k++) {
      const yy = 10 + (H - B - 10) * (k / 5);
      gc.strokeStyle = grid; gc.globalAlpha = .6; gc.beginPath();
      gc.moveTo(L, yy); gc.lineTo(W - 6, yy); gc.stroke(); gc.globalAlpha = 1;
      gc.fillStyle = ink; gc.textAlign = 'right';
      gc.fillText(Math.round(maxY * 100 * (1 - k / 5)) + '%', L - 5, yy);
    }
    gc.textAlign = 'center';
    for (let yr = 0; yr <= YEARS; yr += 2) {
      const xx = L + (W - L - 8) * (yr / YEARS);
      gc.fillStyle = ink; gc.fillText(yr, xx, H - B / 2);
    }
    gc.textAlign = 'left';
    if (hist.length < 2) return;
    for (let b = 0; b < 3; b++) {
      gc.strokeStyle = C[b]; gc.lineWidth = 2; gc.lineJoin = 'round'; gc.beginPath();
      hist.forEach((h, i) => {
        const X = L + (W - L - 8) * (i / YEARS);
        const Y = 10 + (H - B - 10) * (1 - Math.min(h.byBand[b], maxY) / maxY);
        i ? gc.lineTo(X, Y) : gc.moveTo(X, Y);
      });
      gc.stroke();
      const h = hist[hist.length - 1];
      const X = L + (W - L - 8) * ((hist.length - 1) / YEARS);
      const Y = 10 + (H - B - 10) * (1 - Math.min(h.byBand[b], maxY) / maxY);
      gc.fillStyle = C[b]; gc.beginPath(); gc.arc(X, Y, 3, 0, 7); gc.fill();
      if (done) { gc.fillText((h.byBand[b] * 100).toFixed(1) + '%', X + 6, Y); }
    }
  };

  let last = 0;
  const loop = (t) => {
    requestAnimationFrame(loop);
    if (!running || reduced || t - last < 700) return;
    last = t; step(); paint();
  };

  const bind = (id, vid, fn, fmt) => {
    const el = document.getElementById(id);
    el?.addEventListener('input', () => { fn(+el.value); document.getElementById(vid).textContent = fmt(+el.value); });
  };
  bind('s-scale', 'v-scale', (v) => { N = v; init(); }, (v) => v + '²');
  bind('s-ratio', 'v-ratio', (v) => { ratio = v / 10; init(); }, (v) => (v / 10).toFixed(1) + '×');
  bind('s-influence', 'v-influence', (v) => { influence = v / 100; init(); }, (v) => (v / 100).toFixed(2));

  const tg = document.getElementById('sim-toggle');
  tg?.addEventListener('click', () => {
    if (done) { init(); return; }
    running = !running; tg.textContent = running ? 'Pause' : 'Play';
    tg.setAttribute('aria-pressed', String(running));
  });
  document.getElementById('sim-reset')?.addEventListener('click', init);
  new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting && running && !done) { running = false; if (tg) tg.textContent = 'Play'; }
  }), { threshold: 0 }).observe(cv);

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

/* ───── tabs ───── */
(() => {
  const tabs = $$('[role="tab"]');
  if (!tabs.length) return;
  const show = (i) => {
    tabs.forEach((t, n) => {
      t.setAttribute('aria-selected', String(n === i));
      const panel = document.getElementById(`panel-${n}`);
      if (panel) panel.hidden = n !== i;
    });
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => show(i));
    t.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      const n = (i + d + tabs.length) % tabs.length;
      tabs[n].focus(); show(n);
    });
  });
})();

/* ───── collapse the long topic filter list ───── */
(() => {
  const btn = document.getElementById('more-filters');
  if (!btn) return;
  const hidden = $$('.more-f');
  const label = btn.textContent;
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') === 'true';
    hidden.forEach((c) => { c.hidden = open; });
    btn.setAttribute('aria-expanded', String(!open));
    btn.textContent = open ? label : 'Fewer topics';
  });
})();
