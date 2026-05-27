"""
umbris.server.ui · the single-page web UI for the local UMBRIS server.

One HTML file, inline CSS and JS, zero build step, zero external assets.
Embedded as a Python string so `umbris serve` ships entirely as a Python
install and works offline once the package is on disk.

Visual language matches the UMBRIS register: deep matte black
ground, cream linework, single gold accent, Cinzel-flavoured serif for
display, monospace for the technical text.
"""

from __future__ import annotations

INDEX_HTML: str = r"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>UMBRIS · Local</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Your local UMBRIS convocation. Open-source, multi-provider, fully yours.">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect fill='%23000' width='64' height='64'/%3E%3Ccircle cx='32' cy='32' r='14' fill='none' stroke='%23F2EFE6'/%3E%3Ccircle cx='32' cy='32' r='4' fill='%23D4AF7A'/%3E%3C/svg%3E">
  <style>
    :root {
      --black:  #000000;
      --bone:   #F2EFE6;
      --silver: #BEBCB4;
      --dim:    #787870;
      --gold:   #D4AF7A;
      --serif:  'Cormorant Garamond', 'Times New Roman', Georgia, serif;
      --display: 'Cinzel', 'Trajan Pro', 'Times New Roman', serif;
      --mono:   'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; }
    body {
      background: var(--black);
      color: var(--bone);
      font-family: var(--serif);
      font-size: 16px;
      line-height: 1.55;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      letter-spacing: 0.005em;
      -webkit-font-smoothing: antialiased;
    }
    a { color: var(--gold); text-decoration: none; border-bottom: 1px dotted rgba(212,175,122,0.4); }
    a:hover { border-bottom-style: solid; color: var(--bone); }

    /* ─── Top nav strip ─────────────────────────────────────── */
    .nav {
      display: flex; align-items: center; justify-content: space-between;
      padding: 18px 28px;
      border-bottom: 1px solid rgba(120,120,112,0.25);
      background: linear-gradient(to bottom, rgba(0,0,0,0.85), rgba(0,0,0,0));
    }
    .brand { display: flex; align-items: center; gap: 14px; }
    .brand svg { display: block; }
    .brand-label {
      font-family: var(--display);
      letter-spacing: 0.5em;
      font-size: 0.78rem;
      color: var(--bone);
    }
    .nav-meta {
      display: flex; align-items: center; gap: 18px;
      font-family: var(--mono);
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      color: var(--silver);
    }
    .nav-meta .pill {
      border: 1px solid rgba(212,175,122,0.4);
      padding: 5px 10px;
      color: var(--gold);
    }

    /* ─── Hero ──────────────────────────────────────────────── */
    .hero {
      padding: 60px 28px 30px;
      text-align: center;
    }
    .eyebrow {
      font-family: var(--mono);
      letter-spacing: 0.32em;
      font-size: 0.72rem;
      text-transform: uppercase;
      color: var(--gold);
      margin-bottom: 16px;
    }
    .title {
      font-family: var(--display);
      letter-spacing: 0.42em;
      font-size: clamp(2.2rem, 6vw, 3.6rem);
      color: var(--bone);
      line-height: 1;
      margin-bottom: 18px;
    }
    .tagline {
      font-style: italic;
      color: var(--silver);
      font-size: 1.05rem;
      max-width: 540px;
      margin: 0 auto;
    }

    /* ─── Compose form ──────────────────────────────────────── */
    .compose {
      max-width: 760px;
      margin: 28px auto 0;
      padding: 0 28px;
    }
    .compose-label {
      font-family: var(--mono);
      letter-spacing: 0.28em;
      font-size: 0.65rem;
      text-transform: uppercase;
      color: var(--gold);
      margin-bottom: 10px;
    }
    .compose-row { display: flex; gap: 12px; align-items: stretch; }
    .compose textarea {
      flex: 1;
      min-height: 72px;
      max-height: 220px;
      padding: 14px 16px;
      background: rgba(212,175,122,0.03);
      color: var(--bone);
      border: 1px solid rgba(190,188,180,0.3);
      font-family: var(--serif);
      font-size: 1.05rem;
      resize: vertical;
      outline: none;
      transition: border-color 0.25s, background 0.25s;
    }
    .compose textarea:focus {
      border-color: rgba(212,175,122,0.7);
      background: rgba(212,175,122,0.05);
    }
    .compose button {
      align-self: flex-start;
      padding: 14px 22px;
      background: transparent;
      color: var(--gold);
      border: 1px solid var(--gold);
      font-family: var(--mono);
      letter-spacing: 0.22em;
      text-transform: uppercase;
      font-size: 0.72rem;
      cursor: pointer;
      transition: background 0.25s, color 0.25s;
      white-space: nowrap;
    }
    .compose button:hover:not(:disabled) {
      background: var(--gold);
      color: var(--black);
    }
    .compose button:disabled { opacity: 0.45; cursor: wait; }

    /* ─── Status strip ──────────────────────────────────────── */
    .status {
      max-width: 760px; margin: 22px auto 0; padding: 0 28px;
      display: flex; justify-content: space-between; align-items: center;
      font-family: var(--mono);
      font-size: 0.66rem;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--silver);
    }
    .status-left { display: flex; align-items: center; gap: 14px; }
    .status-dot {
      display: inline-block; width: 8px; height: 8px; border-radius: 50%;
      background: var(--dim);
      transition: background 0.3s, box-shadow 0.3s;
    }
    .status[data-phase="deliberating"] .status-dot,
    .status[data-phase="verifying"]    .status-dot {
      background: var(--gold);
      box-shadow: 0 0 12px rgba(212,175,122,0.5);
      animation: pulse 1.4s infinite;
    }
    .status[data-phase="complete"] .status-dot { background: #6ec06e; }
    .status[data-phase="error"]    .status-dot { background: #d96b6b; }
    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 6px rgba(212,175,122,0.4); }
      50%      { box-shadow: 0 0 18px rgba(212,175,122,0.8); }
    }
    .status-right { display: flex; gap: 18px; color: var(--gold); }

    /* ─── Transcript ────────────────────────────────────────── */
    .transcript {
      max-width: 760px; margin: 28px auto 0; padding: 0 28px 40px;
      display: flex; flex-direction: column; gap: 10px;
    }
    .record {
      border-left: 2px solid rgba(120,120,112,0.4);
      padding: 10px 14px 12px;
      background: rgba(212,175,122,0.02);
      font-size: 0.95rem;
    }
    .record.is-synthesis { border-left-color: var(--gold); }
    .record.is-verifier  { border-left-color: #d96b6b; }
    .record.is-judge     { border-left-color: var(--gold); background: rgba(212,175,122,0.05); }
    .record-meta {
      display: flex; gap: 12px; flex-wrap: wrap;
      font-family: var(--mono);
      font-size: 0.6rem;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--silver);
      margin-bottom: 6px;
    }
    .record-meta .role { color: var(--gold); }
    .record-body { color: var(--bone); white-space: pre-wrap; word-wrap: break-word; }

    /* ─── Final answer panel ────────────────────────────────── */
    .verdict {
      max-width: 760px; margin: 30px auto 50px; padding: 26px 28px;
      border: 1px solid rgba(212,175,122,0.5);
      background: rgba(212,175,122,0.03);
    }
    .verdict-title {
      font-family: var(--display);
      letter-spacing: 0.28em;
      font-size: 0.95rem;
      text-transform: uppercase;
      color: var(--gold);
      margin-bottom: 14px;
    }
    .verdict-body {
      font-size: 1.1rem; line-height: 1.6; color: var(--bone);
      white-space: pre-wrap; word-wrap: break-word;
    }
    .verdict-footer {
      margin-top: 18px; padding-top: 14px;
      border-top: 1px solid rgba(212,175,122,0.2);
      font-family: var(--mono);
      font-size: 0.62rem;
      text-transform: uppercase; letter-spacing: 0.2em;
      color: var(--silver);
      display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px;
    }

    .empty {
      max-width: 760px; margin: 30px auto; padding: 24px 28px;
      text-align: center;
      font-family: var(--mono);
      font-size: 0.7rem;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: var(--dim);
    }

    /* ─── Footer ────────────────────────────────────────────── */
    footer {
      margin-top: auto;
      padding: 20px 28px;
      border-top: 1px solid rgba(120,120,112,0.2);
      display: flex; justify-content: space-between; align-items: center;
      font-family: var(--mono);
      font-size: 0.6rem;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: var(--dim);
      gap: 10px;
      flex-wrap: wrap;
    }
    footer a { color: var(--silver); border: none; }
    footer a:hover { color: var(--gold); }
  </style>
</head>
<body>

<header class="nav">
  <div class="brand">
    <!-- Tiny armillary sphere · the UMBRIS brand mark -->
    <svg width="28" height="28" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true" style="color: #F2EFE6;">
      <circle cx="32" cy="32" r="22"/>
      <ellipse cx="32" cy="32" rx="22" ry="7" stroke-width="0.6"/>
      <ellipse cx="32" cy="32" rx="7"  ry="22" stroke-width="0.6"/>
      <line x1="32" y1="10" x2="32" y2="54" stroke-width="0.6"/>
      <line x1="10" y1="32" x2="54" y2="32" stroke-width="0.6"/>
      <circle cx="32" cy="32" r="5" stroke-width="0.6"/>
      <circle cx="32" cy="32" r="2.2" fill="#D4AF7A" stroke="none"/>
      <line x1="32" y1="4" x2="32" y2="10" stroke-width="0.8"/>
      <circle cx="32" cy="3" r="1.6" fill="currentColor" stroke="none"/>
    </svg>
    <span class="brand-label">U M B R I S</span>
  </div>
  <div class="nav-meta">
    <span id="provider-pill" class="pill">…</span>
    <span>LOCALHOST</span>
  </div>
</header>

<section class="hero">
  <p class="eyebrow">§ Your Local Convocation · MMXXVI</p>
  <h1 class="title">P O S E&nbsp;&nbsp;A&nbsp;&nbsp;Q U E S T I O N</h1>
  <p class="tagline">The full nine-planet UMBRIS convocation, running on your own machine, on your own keys.</p>
</section>

<form class="compose" id="compose" autocomplete="off">
  <p class="compose-label">— Question for the convocation —</p>
  <div class="compose-row">
    <textarea id="query-input"
              placeholder="What is the strongest argument against my own thesis?"
              required></textarea>
    <button type="submit" id="submit-btn">Cast</button>
  </div>
</form>

<div class="status" id="status" data-phase="idle">
  <div class="status-left">
    <span class="status-dot"></span>
    <span id="phase-label">Idle. Awaiting question.</span>
  </div>
  <div class="status-right">
    <span><span id="cost-ticker">$0.0000</span></span>
    <span><span id="time-ticker">0.0s</span></span>
  </div>
</div>

<div class="transcript" id="transcript"></div>
<div class="empty" id="empty">The transcript appears here once the convocation wakes.</div>
<div id="verdict-mount"></div>

<footer>
  <span>UMBRIS · MMXXVI</span>
  <span>
    <a href="https://github.com/UmbrisLLM/Umbris-AI-LLM-Swarm-Architecture" target="_blank" rel="noreferrer">GitHub</a>
    &nbsp;·&nbsp;
    <a href="https://www.umbrisai.com" target="_blank" rel="noreferrer">umbrisai.com</a>
  </span>
</footer>

<script>
(function () {
  const form        = document.getElementById('compose');
  const input       = document.getElementById('query-input');
  const submitBtn   = document.getElementById('submit-btn');
  const statusEl    = document.getElementById('status');
  const phaseLabel  = document.getElementById('phase-label');
  const costTicker  = document.getElementById('cost-ticker');
  const timeTicker  = document.getElementById('time-ticker');
  const transcript  = document.getElementById('transcript');
  const emptyEl     = document.getElementById('empty');
  const verdictMt   = document.getElementById('verdict-mount');
  const providerPill = document.getElementById('provider-pill');

  // ── boot: report which provider is wired up ──
  fetch('/api/status').then(r => r.json()).then(data => {
    providerPill.textContent = 'PROVIDER: ' + (data.provider || 'unknown').toUpperCase();
  }).catch(() => { providerPill.textContent = 'PROVIDER: ?'; });

  let activeEventSource = null;
  let startedAt = null;
  let timerId = null;

  function setPhase(phase, label) {
    statusEl.dataset.phase = phase;
    phaseLabel.textContent = label;
  }

  function fmtCost(usd) { return '$' + Number(usd || 0).toFixed(4); }
  function fmtTime(sec) { return Number(sec || 0).toFixed(1) + 's'; }

  function escape(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  function recordCard(rec) {
    const card = document.createElement('div');
    card.className = 'record';
    if (rec.type && rec.type.indexOf('synthesis') >= 0) card.classList.add('is-synthesis');
    if (rec.agent_role === 'saturnus') card.classList.add('is-verifier');
    if (rec.agent_role === 'iuppiter') card.classList.add('is-judge');
    const meta = document.createElement('div'); meta.className = 'record-meta';
    meta.innerHTML =
        '<span class="role">' + escape(rec.agent_role || '·') + '</span>'
      + '<span>' + escape(rec.agent_id || '') + '</span>'
      + '<span>' + escape(rec.type || '') + '</span>'
      + '<span>conf ' + Number(rec.confidence || 0).toFixed(2) + '</span>'
      + '<span>' + fmtCost(rec.cost_estimate) + '</span>';
    const body = document.createElement('div'); body.className = 'record-body';
    let content = rec.content;
    if (content && typeof content === 'object') {
      content = content.answer || JSON.stringify(content, null, 2);
    }
    body.textContent = String(content == null ? '' : content);
    card.appendChild(meta); card.appendChild(body);
    return card;
  }

  function showVerdict(payload) {
    verdictMt.innerHTML = '';
    const v = document.createElement('div'); v.className = 'verdict';
    const title = document.createElement('div'); title.className = 'verdict-title';
    title.textContent = payload.accepted ? '— Vision · verified ✓ —' : '— Vision · unresolved falsifications —';
    const body = document.createElement('div'); body.className = 'verdict-body';
    let answer = payload.answer;
    if (answer && typeof answer === 'object') {
      answer = answer.answer || JSON.stringify(answer, null, 2);
    }
    body.textContent = String(answer == null ? '(no answer)' : answer);
    const footer = document.createElement('div'); footer.className = 'verdict-footer';
    footer.innerHTML =
        '<span>Cost ' + fmtCost(payload.cost_usd) + '</span>'
      + '<span>Wall ' + fmtTime(payload.wall_seconds) + '</span>'
      + '<span>Records ' + (payload.total_records || 0) + '</span>'
      + '<span>Provider ' + escape((payload.provider || '·').toUpperCase()) + '</span>';
    v.appendChild(title); v.appendChild(body); v.appendChild(footer);
    verdictMt.appendChild(v);
    v.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }

  function startStream(runId) {
    if (activeEventSource) activeEventSource.close();
    const es = new EventSource('/api/stream/' + encodeURIComponent(runId));
    activeEventSource = es;

    es.addEventListener('phase', e => {
      try {
        const p = JSON.parse(e.data);
        setPhase(p.phase, p.label);
      } catch (_) {}
    });

    es.addEventListener('record', e => {
      try {
        const rec = JSON.parse(e.data);
        transcript.appendChild(recordCard(rec));
        if (typeof rec.running_cost_usd === 'number') {
          costTicker.textContent = fmtCost(rec.running_cost_usd);
        }
      } catch (_) {}
    });

    es.addEventListener('complete', e => {
      try {
        const payload = JSON.parse(e.data);
        showVerdict(payload);
        setPhase('complete', 'Complete.');
        costTicker.textContent = fmtCost(payload.cost_usd);
        timeTicker.textContent = fmtTime(payload.wall_seconds);
      } catch (_) {}
      stopTimer();
      submitBtn.disabled = false;
      submitBtn.textContent = 'Cast';
      es.close();
    });

    es.addEventListener('error', () => {
      setPhase('error', 'Connection lost.');
      stopTimer();
      submitBtn.disabled = false;
      submitBtn.textContent = 'Cast';
      es.close();
    });
  }

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const q = input.value.trim();
    if (!q) return;

    // Reset UI
    transcript.innerHTML = '';
    verdictMt.innerHTML = '';
    emptyEl.style.display = 'none';
    costTicker.textContent = '$0.0000';
    timeTicker.textContent = '0.0s';
    setPhase('deliberating', 'Mercurii gathering…');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Running';

    // Tick the timer
    startedAt = performance.now();
    stopTimer();
    timerId = setInterval(() => {
      timeTicker.textContent = fmtTime((performance.now() - startedAt) / 1000);
    }, 100);

    try {
      const resp = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      if (!resp.ok) throw new Error('Server returned ' + resp.status);
      const { run_id } = await resp.json();
      startStream(run_id);
    } catch (err) {
      setPhase('error', err.message);
      stopTimer();
      submitBtn.disabled = false;
      submitBtn.textContent = 'Cast';
    }
  });

  // Submit on Cmd/Ctrl+Enter
  input.addEventListener('keydown', (ev) => {
    if ((ev.metaKey || ev.ctrlKey) && ev.key === 'Enter') {
      form.requestSubmit();
    }
  });
})();
</script>
</body>
</html>
"""
