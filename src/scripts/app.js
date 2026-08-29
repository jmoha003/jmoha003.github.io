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
const shots = $$('#gal .shot');
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
    if (ok && el.dataset.collapsed) ok = false;      // hidden behind "See all"
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
   Faithful port of NRMP_ABM_v7 (Mohanty & Collins, WSC 2026).

   Agents hold a score (1 Low / 2 Med / 3 High, 25/50/25) and a
   discrete application level L1..L5. Each of 52 cycles a year an
   agent may copy a Von Neumann neighbour that outranks it on BOTH
   score and apps, with probability (score difference)/3.
   Year end runs the two-stage match: Stage 1 visibility p = apps/5,
   Stage 2 score-weighted sampling without replacement using the
   Efraimidis-Spirakis key u^(1/score). Matched agents leave; a
   fraction reapp-rate of the unmatched return one level higher and
   carry the fever; new cohorts always arrive naive at L1..L3.
   Fever = L4 or L5.
   ═══════════════════════════════════════════════════════════ */
(() => {
  const cv = document.getElementById('sim');
  const ch = document.getElementById('chart');
  if (!cv || !ch) return;
  const g = cv.getContext('2d'), gc = ch.getContext('2d');
  const C = 52, YEARS = 10, GROWTH = 0.03, R = 1;
  const LVL = ['#334155', '#3b82f6', '#22d3ee', '#f59e0b', '#f43f5e']; // L1..L5
  const BAND = ['#f43f5e', '#f59e0b', '#22d3ee'];                      // Low/Med/High
  let N0 = 400, posRatio = 0.8, reapp = 0.6;
  let D, cell, agents, year, hist, PFIX, running = true, done = false;

  const rndScore = () => { const u = Math.random(); return u < 0.25 ? 1 : u < 0.75 ? 2 : 3; };
  const newAgent = () => ({ score: rndScore(), apps: (Math.random() * 3 | 0) + 1 });

  const shuffle = (a) => { for (let k = a.length - 1; k > 0; k--) { const r = Math.random() * (k + 1) | 0; [a[k], a[r]] = [a[r], a[k]]; } return a; };

  // initial scatter
  const layout = (list) => {
    D = Math.max(4, Math.ceil(Math.sqrt(list.length)));
    cell = new Array(D * D).fill(null);
    shuffle([...cell.keys()]).forEach((slot, n) => { if (n < list.length) cell[slot] = list[n]; });
    agents = list;
  };

  // survivors HOLD their patch; the new cohort sprouts onto empty ones, growing the
  // grid if needed. This is what lets fever cluster spatially instead of resetting.
  const reseat = (leavers, incoming) => {
    const gone = new Set(leavers);
    for (let i = 0; i < cell.length; i++) if (cell[i] && gone.has(cell[i])) cell[i] = null;
    const staying = cell.filter(Boolean).length;
    const need = staying + incoming.length;
    if (need > cell.length) {                       // expand the world, keeping coordinates
      const D2 = Math.ceil(Math.sqrt(need));
      const next = new Array(D2 * D2).fill(null);
      for (let i = 0; i < cell.length; i++) if (cell[i]) {
        next[((i / D) | 0) * D2 + (i % D)] = cell[i];
      }
      cell = next; D = D2;
    }
    const empty = shuffle(cell.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0));
    incoming.forEach((a, n) => { if (n < empty.length) cell[empty[n]] = a; });
    agents = cell.filter(Boolean);
  };

  const init = () => {
    layout(Array.from({ length: N0 }, newAgent));
    PFIX = Math.max(1, Math.round(N0 * posRatio));   // positions are FIXED while the pool grows
    year = 0; hist = []; done = false; running = true;
    tokens = []; matchShare = 0.8; carrierShare = 0; spawn();
    const t = document.getElementById('sim-toggle'); if (t) t.textContent = 'Pause';
    record(); paint();
  };

  const neighbours = (i) => {
    const x = i % D, y = (i / D) | 0, out = [];
    for (let d = 1; d <= R; d++) {
      [[d,0],[-d,0],[0,d],[0,-d]].forEach(([dx, dy]) => {
        const j = (((y + dy) % D + D) % D) * D + (((x + dx) % D + D) % D);
        if (cell[j]) out.push(cell[j]);
      });
    }
    return out;
  };

  const cycle = () => {                                   // one weekly interaction cycle
    for (let i = 0; i < cell.length; i++) {
      const me = cell[i]; if (!me) continue;
      const nb = neighbours(i); if (!nb.length) continue;
      const other = nb[Math.random() * nb.length | 0];
      if (other.score <= me.score) continue;               // must outrank on score
      if (other.apps <= me.apps) continue;                 // and on applications
      if (Math.random() < (other.score - me.score) / 3.0) me.apps = other.apps;
    }
  };

  const runYear = () => {
    for (let c = 0; c < C; c++) cycle();
    // ── two-stage match ──
    const P = PFIX;
    let survivors;
    if (agents.length <= P) survivors = [];
    else {
      const visible = agents.filter((a) => Math.random() < a.apps / 5);
      visible.forEach((a) => { a.key = Math.pow(Math.random(), 1 / a.score); });
      visible.sort((a, b) => b.key - a.key);
      const slots = Math.min(P, visible.length);
      const matched = new Set(visible.slice(0, slots));
      survivors = agents.filter((a) => !matched.has(a));
    }
    // ── reapplicants: a fraction return one level higher, the rest exit ──
    for (let k = survivors.length - 1; k > 0; k--) { const r = Math.random() * (k + 1) | 0; [survivors[k], survivors[r]] = [survivors[r], survivors[k]]; }
    const keep = survivors.slice(0, Math.ceil(reapp * survivors.length));
    keep.forEach((a) => { a.apps = Math.min(a.apps + 1, 5); a.re = true; });
    matchShare = agents.length ? 1 - survivors.length / agents.length : 0.8;
    carrierShare = agents.length ? keep.length / agents.length : 0;
    // ── a new cohort ARRIVES on top of the returning pool, naive at L1..L3 ──
    const cohort = Math.ceil(N0 * Math.pow(1 + GROWTH, year + 1));
    const kept = new Set(keep);
    const leaving = agents.filter((a) => !kept.has(a));
    reseat(leaving, Array.from({ length: cohort }, newAgent));
    year++; record();
    if (year >= YEARS) { done = true; running = false; const t = document.getElementById('sim-toggle'); if (t) t.textContent = 'Replay'; }
  };

  const record = () => {
    const cnt = [0,0,0], fev = [0,0,0];
    let sum = 0, tot = 0;
    agents.forEach((a) => {
      const b = a.score - 1; cnt[b]++; sum += a.apps;
      if (a.apps >= 4) { fev[b]++; tot++; }
    });
    const n = agents.length || 1;
    hist.push({ all: tot / n, byBand: fev.map((f, i) => (cnt[i] ? f / cnt[i] : 0)) });
    const mean = sum / n;
    document.getElementById('r-year').textContent = year + ' / ' + YEARS;
    document.getElementById('r-apps').textContent = 'L' + mean.toFixed(2);
    document.getElementById('r-fever').textContent = ((tot / n) * 100).toFixed(1) + '%';
    const base = hist[0] ? 2.0 : 2.0;
    document.getElementById('r-drift').textContent = '+' + (((mean - base) / base) * 100).toFixed(1) + '%';
  };

  // one applicant, drawn as a small human figure
  const figure = (cx, cy, s) => {
    const head = s * 0.20, bodyTop = cy - s * 0.10, bodyBot = cy + s * 0.40;
    g.beginPath();                                  // head
    g.arc(cx, cy - s * 0.34, head, 0, 6.2832);
    g.fill();
    g.beginPath();                                  // shoulders + torso
    g.moveTo(cx, bodyTop - head * 0.2);
    g.lineTo(cx, bodyBot);
    g.lineWidth = s * 0.26; g.lineCap = 'round';
    g.stroke();
    g.beginPath();                                  // arms
    g.moveTo(cx - s * 0.30, cy + s * 0.06);
    g.lineTo(cx + s * 0.30, cy + s * 0.06);
    g.lineWidth = s * 0.14;
    g.stroke();
  };

  // population mix across L1..L5 — the whole pool sliding up the levels
  const mixEl = document.getElementById('mix');
  const mix = () => {
    if (!mixEl) return;
    const c = [0, 0, 0, 0, 0];
    agents.forEach((a) => c[a.apps - 1]++);
    const n = agents.length || 1;
    mixEl.innerHTML = c.map((v, i) =>
      `<span style="flex:0 0 ${(v / n) * 100}%;background:${LVL[i]}" title="L${i + 1}: ${Math.round((v / n) * 100)}%"></span>`).join('');
  };

  /* ── PIPELINE VIEW ───────────────────────────────────────────
     A schematic of the mechanism, driven by the live model:
     cohort arrives naive -> copies upward from higher-scoring peers
     -> two-stage match -> matched exit, unmatched escalate one level
     and return as carriers. The return edge thickens as fever builds.
     ─────────────────────────────────────────────────────────── */
  const W = 560, H = 360;
  const NODES = {
    cohort:   { x:  62, y: 168, w: 74, h: 70, t: 'COHORT',    s: 'naive L1–L3' },
    influence:{ x: 186, y: 156, w: 118, h: 94, t: 'INFLUENCE', s: 'copy upward' },
    match:    { x: 352, y: 156, w: 96, h: 94, t: 'MATCH',     s: 'visibility ×\nscore weight' },
    exit:     { x: 490, y: 84,  w: 62, h: 54, t: 'MATCHED',   s: 'leaves' },
    escal:    { x: 490, y: 246, w: 62, h: 60, t: 'UNMATCHED', s: '+1 level' },
  };
  const cx = (n) => n.x + n.w / 2, cy = (n) => n.y + n.h / 2;
  const N = NODES;
  const SEGS = [
    [[N.cohort.x + N.cohort.w, cy(N.cohort)], [N.influence.x, cy(N.influence)]],
    [[N.influence.x + N.influence.w, cy(N.influence)], [N.match.x, cy(N.match)]],
    [[N.match.x + N.match.w, cy(N.match)], [N.exit.x, cy(N.exit)]],          // matched
    [[N.match.x + N.match.w, cy(N.match)], [N.escal.x, cy(N.escal)]],        // unmatched
    [[cx(N.escal), N.escal.y + N.escal.h], [cx(N.escal), 334], [70, 334], [70, N.cohort.y + N.cohort.h]], // carriers
  ];
  let tokens = [], carrierShare = 0, matchShare = 0;

  const along = (seg, t) => {                        // walk a polyline
    let total = 0; const L = [];
    for (let i = 1; i < seg.length; i++) {
      const d = Math.hypot(seg[i][0] - seg[i-1][0], seg[i][1] - seg[i-1][1]);
      L.push(d); total += d;
    }
    let want = t * total;
    for (let i = 0; i < L.length; i++) {
      if (want <= L[i]) { const k = L[i] ? want / L[i] : 0;
        return [seg[i][0] + (seg[i+1][0] - seg[i][0]) * k, seg[i][1] + (seg[i+1][1] - seg[i][1]) * k]; }
      want -= L[i];
    }
    return seg[seg.length - 1];
  };

  const spawn = () => {                              // one wave, sampled from the pool
    const sample = agents.length ? agents : [];
    for (let i = 0; i < 30; i++) {
      const a = sample[(Math.random() * sample.length) | 0] || newAgent();
      tokens.push({ seg: 0, t: -Math.random() * 0.9, lvl: a.apps, score: a.score, carrier: false });
    }
  };

  const advance = () => {
    const speed = 0.0135;
    tokens.forEach((k) => {
      k.t += speed;
      if (k.t < 1) return;
      k.t = 0;
      if (k.seg === 0) { k.seg = 1; if (Math.random() < 0.42) k.lvl = Math.min(5, k.lvl + 1); }  // influence
      else if (k.seg === 1) { k.seg = Math.random() < matchShare ? 2 : 3; }                       // the match
      else if (k.seg === 2) { k.dead = true; }                                                    // matched, gone
      else if (k.seg === 3) { k.lvl = Math.min(5, k.lvl + 1); k.carrier = true; k.seg = 4; }      // escalate
      else { k.dead = true; }                                                                     // returned
    });
    tokens = tokens.filter((k) => !k.dead);
    if (tokens.length < 72) spawn();
  };

  const roundRect = (x, y, w, h, r) => {
    g.beginPath();
    g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  };

  const paint = () => {
    const cs = getComputedStyle(document.documentElement);
    const line = cs.getPropertyValue('--line-2').trim() || '#2e3844';
    const ink2 = cs.getPropertyValue('--ink-2').trim() || '#a8b3c1';
    const ink3 = cs.getPropertyValue('--ink-3').trim() || '#6f7d8d';
    g.clearRect(0, 0, W, H);

    // edges
    SEGS.forEach((seg, i) => {
      const carrier = i === 4;
      g.strokeStyle = carrier ? '#f43f5e' : line;
      g.globalAlpha = carrier ? 0.28 + carrierShare * 0.72 : 0.85;
      g.lineWidth = carrier ? 1.4 + carrierShare * 5.5 : 1.4;
      g.setLineDash(carrier ? [7, 5] : []);
      g.beginPath(); g.moveTo(seg[0][0], seg[0][1]);
      for (let n = 1; n < seg.length; n++) g.lineTo(seg[n][0], seg[n][1]);
      g.stroke(); g.setLineDash([]);
    });
    g.globalAlpha = 1;

    // carrier edge label
    g.font = '9px ui-monospace, monospace'; g.fillStyle = '#f43f5e'; g.textAlign = 'center';
    g.fillText(`carriers  ${(carrierShare * 100).toFixed(0)}%`, 300, 330);

    // nodes
    Object.values(NODES).forEach((n) => {
      g.fillStyle = cs.getPropertyValue('--surface').trim() || '#151a21';
      roundRect(n.x, n.y, n.w, n.h, 12); g.fill();
      g.strokeStyle = line; g.lineWidth = 1; g.stroke();
      g.textAlign = 'center';
      g.font = '600 9.5px ui-monospace, monospace'; g.fillStyle = ink2;
      g.fillText(n.t, cx(n), n.y + 19);
      g.font = '8.5px ui-monospace, monospace'; g.fillStyle = ink3;
      n.s.split('\n').forEach((ln, i) => g.fillText(ln, cx(n), n.y + 33 + i * 11));
    });

    // tokens
    tokens.forEach((k) => {
      if (k.t < 0) return;
      const [x, y] = along(SEGS[k.seg], k.t);
      const col = LVL[k.lvl - 1];
      g.fillStyle = col; g.strokeStyle = col;
      if (k.lvl >= 4) { g.shadowColor = col; g.shadowBlur = 7; }
      figure(x, y, 13);
      g.shadowBlur = 0;
    });

    chart(); mix();
  };
  const chart = () => {
    const W = ch.width, H = ch.height, L = 36, B = 26, maxY = 0.6;
    gc.clearRect(0, 0, W, H);
    const cs = getComputedStyle(document.documentElement);
    const grid = cs.getPropertyValue('--line').trim() || '#232b35';
    const ink = cs.getPropertyValue('--ink-3').trim() || '#6f7d8d';
    gc.font = '10px ui-monospace, monospace'; gc.textBaseline = 'middle';
    for (let k = 0; k <= 3; k++) {
      const yy = 12 + (H - B - 12) * (k / 3);
      gc.strokeStyle = grid; gc.globalAlpha = .6; gc.beginPath(); gc.moveTo(L, yy); gc.lineTo(W - 8, yy); gc.stroke(); gc.globalAlpha = 1;
      gc.fillStyle = ink; gc.textAlign = 'right'; gc.fillText(Math.round(maxY * 100 * (1 - k / 3)) + '%', L - 6, yy);
    }
    gc.textAlign = 'center';
    for (let yr = 0; yr <= YEARS; yr += 2) gc.fillText(yr, L + (W - L - 10) * (yr / YEARS), H - B / 2);
    if (hist.length < 2) return;
    gc.textAlign = 'left';
    for (let b = 0; b < 3; b++) {
      gc.strokeStyle = BAND[b]; gc.lineWidth = 2; gc.lineJoin = 'round'; gc.beginPath();
      hist.forEach((h, i) => {
        const X = L + (W - L - 10) * (i / YEARS);
        const Y = 12 + (H - B - 12) * (1 - Math.min(h.byBand[b], maxY) / maxY);
        i ? gc.lineTo(X, Y) : gc.moveTo(X, Y);
      });
      gc.stroke();
      const h = hist[hist.length - 1];
      const X = L + (W - L - 10) * ((hist.length - 1) / YEARS);
      const Y = 12 + (H - B - 12) * (1 - Math.min(h.byBand[b], maxY) / maxY);
      gc.fillStyle = BAND[b]; gc.beginPath(); gc.arc(X, Y, 3, 0, 7); gc.fill();
      if (done) gc.fillText((h.byBand[b] * 100).toFixed(1) + '%', X + 7, Y);
    }
  };

  let last = 0;
  const loop = (t) => {
    requestAnimationFrame(loop);
    if (reduced) return;
    if (running) advance();
    paint();
    if (running && t - last > 2400) { last = t; runYear(); }
  };

  const bind = (id, vid, fn, fmt) => {
    const el = document.getElementById(id);
    el?.addEventListener('input', () => { fn(+el.value); document.getElementById(vid).textContent = fmt(+el.value); init(); });
  };
  bind('s-scale', 'v-scale', (v) => { N0 = v * v; }, (v) => (v * v) + ' agents');
  bind('s-ratio', 'v-ratio', (v) => { posRatio = v / 100; }, (v) => (v / 100).toFixed(2) + ' P/N');
  bind('s-influence', 'v-influence', (v) => { reapp = v / 100; }, (v) => (v / 100).toFixed(2));

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

/* ───── publication list: reveal the rest ───── */
(() => {
  const btn = document.getElementById('pub-more');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') === 'true';
    $$('.pub-extra').forEach((el) => { el.dataset.collapsed = open ? '1' : ''; });
    btn.setAttribute('aria-expanded', String(!open));
    btn.childNodes[0].nodeValue = open ? `See all ${pubs.length} papers ` : 'Show fewer ';
    btn.querySelector('svg')?.style.setProperty('transform', open ? 'none' : 'rotate(180deg)');
    applyFilter();
    if (open) document.getElementById('papers')?.scrollIntoView({ block: 'start' });
  });
  $$('.pub-extra').forEach((el) => { el.dataset.collapsed = '1'; el.hidden = false; });
  applyFilter();
})();

/* ───── gallery carousel ───── */
(() => {
  const rail = document.getElementById('gal');
  if (!rail) return;
  const page = () => Math.max(240, rail.clientWidth * 0.8);
  document.getElementById('gal-next')?.addEventListener('click', () => rail.scrollBy({ left: page(), behavior: 'smooth' }));
  document.getElementById('gal-prev')?.addEventListener('click', () => rail.scrollBy({ left: -page(), behavior: 'smooth' }));
})();
