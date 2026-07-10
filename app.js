/* =========================================================
   Deck2Vid Studio — prototype logic
   No network / no LLM. Everything is placeholder + local state.
   ========================================================= */
(() => {
  'use strict';

  /* ---------------- tiny helpers ---------------- */
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const fmt = (s) => {
    s = Math.max(0, Math.round(s));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };
  const uid = (() => { let n = 0; return () => 'id' + (++n); })();
  const esc = (t) => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function icon(id) { return `<svg class="ic"><use href="#${id}"/></svg>`; }
  const typeLabel = (t) => ({ title: 'Title', 'talking-head': 'Presenter', bullets: 'Key points', chart: 'Data', quote: 'Quote', outro: 'Outro' }[t] || t);

  /* ---------------- reference data ---------------- */
  const BACKGROUNDS = [
    { id: 'ember', name: 'Ember',  css: 'radial-gradient(130% 130% at 22% 8%, #3a2a0e, #120d05 70%)', accent: '#f2b53c' },
    { id: 'ink',   name: 'Ink',    css: 'radial-gradient(130% 130% at 80% 8%, #16233c, #080b12 70%)', accent: '#7aa2f7' },
    { id: 'mint',  name: 'Mint',   css: 'radial-gradient(130% 130% at 28% 16%, #0e3a34, #05100e 72%)', accent: '#54d6c6' },
    { id: 'plum',  name: 'Plum',   css: 'radial-gradient(130% 130% at 74% 12%, #331a33, #120812 72%)', accent: '#e08ad0' },
    { id: 'slate', name: 'Slate',  css: 'linear-gradient(158deg, #23252b, #0e0f12)', accent: '#c7ccd6' },
    { id: 'paper', name: 'Paper',  css: 'linear-gradient(158deg, #efe9dc, #d8ccb6)', accent: '#b9791a', light: true },
  ];
  const bg = (id) => BACKGROUNDS.find(b => b.id === id) || BACKGROUNDS[0];

  const AVATARS = [
    { id: 'none', name: 'No avatar', tone: 'Text & visuals only' },
    { id: 'nova', name: 'Nova', tone: 'Warm · Female',       color: '#f2b53c', ini: 'N' },
    { id: 'kai',  name: 'Kai',  tone: 'Confident · Male',    color: '#54d6c6', ini: 'K' },
    { id: 'sol',  name: 'Sol',  tone: 'Friendly · Neutral',  color: '#e0865f', ini: 'S' },
    { id: 'ada',  name: 'Ada',  tone: 'Crisp · Female',      color: '#8ea2f7', ini: 'A' },
  ];
  const avatar = (id) => AVATARS.find(a => a.id === id) || AVATARS[0];

  const VOICES = [
    { id: 'nova',  name: 'Nova',  desc: 'US · warm, natural' },
    { id: 'atlas', name: 'Atlas', desc: 'UK · authoritative' },
    { id: 'rae',   name: 'Rae',   desc: 'US · bright, energetic' },
    { id: 'kenji', name: 'Kenji', desc: 'US · calm, measured' },
  ];
  const voice = (id) => VOICES.find(v => v.id === id) || VOICES[0];

  const scn = (title, type, script, dur, bgId, extra = {}) =>
    ({ id: uid(), title, type, script, dur, bgId, ...extra });

  const SAMPLES = [
    {
      id: 'founder', name: "The Founder's Dilemma", kind: 'Article', icon: 'i-article',
      meta: '~1,200 words · Essay',
      brief: "A punchy narrative explainer of a startup founder's raise-vs-control dilemma, for an entrepreneurial audience.",
      scenes: [
        scn('Cold Open', 'title', 'Every founder faces one defining choice.', 5, 'ember'),
        scn('The Setup', 'talking-head', 'Meet Alex — three years in, real traction, and a term sheet on the table.', 12, 'slate'),
        scn('The Dilemma', 'bullets', 'Raise now — scale fast, share control · Stay lean — grow slow, keep the wheel', 13, 'ink'),
        scn('The Data', 'chart', '73% of founders who raised early lost majority control by Series B.', 11, 'mint', { chart: [0.34, 0.52, 0.71, 0.92] }),
        scn('The Turn', 'quote', 'The dilemma was never money versus control — it was speed versus certainty.', 9, 'plum'),
        scn('Close', 'outro', 'Tell your story with Deck2Vid.', 6, 'ember', { headline: 'What would you choose?' }),
      ],
    },
    {
      id: 'q3', name: 'Atlas 2.0 Launch', kind: 'Deck', icon: 'i-deck',
      meta: '18 slides · Keynote',
      brief: 'An upbeat product-launch video introducing Atlas 2.0 to prospective customers, about 60 seconds.',
      scenes: [
        scn('Title', 'title', 'Introducing Atlas 2.0.', 5, 'ember'),
        scn('The Problem', 'talking-head', 'Teams lose six hours a week just switching between tools.', 11, 'slate'),
        scn('The Idea', 'bullets', 'One workspace · Every workflow · Zero context-switching', 12, 'ink'),
        scn("What's New", 'bullets', 'Unified inbox · AI summaries · Real-time canvas', 12, 'mint'),
        scn('By the Numbers', 'chart', '3× faster onboarding and 40% fewer status meetings.', 10, 'plum', { chart: [0.4, 0.62, 0.8, 1] }),
        scn('CTA', 'outro', 'Available today — start free.', 6, 'ember', { headline: 'Meet Atlas 2.0' }),
      ],
    },
    {
      id: 'protect', name: 'Protecting Your Content', kind: 'PDF', icon: 'i-pdf',
      meta: '9 pages · PDF',
      brief: 'A clear, reassuring explainer on protecting your content from piracy, for rights-holders.',
      scenes: [
        scn('Title', 'title', 'Protecting what you create.', 5, 'ember'),
        scn('Why It Matters', 'talking-head', 'Every minute, 500 hours of video are uploaded — some of it yours.', 11, 'slate'),
        scn('How Piracy Spreads', 'bullets', 'Cyberlockers · Social clips · Mass re-uploads', 11, 'ink'),
        scn('The Approach', 'bullets', 'Detect · Match · Take down — automatically', 12, 'mint'),
        scn('Close', 'outro', 'Your content, always yours.', 6, 'ember', { headline: 'Protected at scale' }),
      ],
    },
  ];

  // keyword-matched canned "director" replies (NOT an LLM)
  const CHAT_RULES = [
    { re: /(short|trim|cut|60|shorter|tighten|pac)/i,
      reply: "Tightened the pacing — I trimmed each scene a touch and brought the total down. Feels snappier now.",
      fx: () => { state.scenes.forEach(s => s.dur = Math.max(3, Math.round(s.dur * 0.8))); } },
    { re: /(caption|subtitle|cc)/i,
      reply: "Captions are switched on for every scene now.",
      fx: () => { state.settings.captions = true; } },
    { re: /(energetic|punch|upbeat|excit|hype|fast)/i,
      reply: "Punchier it is — I swapped in a brighter voice and a more energetic tone.",
      fx: () => { state.settings.voiceId = 'rae'; state.settings.tone = 'Energetic'; } },
    { re: /(formal|professional|serious|corporate|calm)/i,
      reply: "Dialed it back to a more professional, measured read.",
      fx: () => { state.settings.voiceId = 'atlas'; state.settings.tone = 'Professional'; } },
    { re: /(music|soundtrack|track|audio bed)/i,
      reply: "Added a subtle upbeat bed underneath, mixed low so the voice stays clear.",
      fx: () => { state.settings.music = true; } },
    { re: /(avatar|presenter|host|face|person)/i,
      reply: "You can pick from the avatar library in the Studio — hit “Open in Studio” and open the Avatar tab.",
      fx: null },
  ];
  const CHAT_DEFAULT = "Got it — noted. You can fine-tune every scene precisely once you open the Studio.";
  const CHAT_CHIPS = ['Make it punchier', 'Shorten to ~60s', 'Add captions', 'More professional tone'];

  const STAGES = [
    { id: 'intake',     label: 'Intake' },
    { id: 'comprehend', label: 'Comprehend' },
    { id: 'edit',       label: 'Studio' },
    { id: 'generate',   label: 'Generate' },
    { id: 'export',     label: 'Export' },
  ];
  const stageIdx = (id) => STAGES.findIndex(s => s.id === id);

  /* ---------------- state ---------------- */
  const state = {
    stage: 'intake',
    maxReached: 0,
    source: null,
    brief: '',
    project: 'Untitled project',
    scenes: [],
    settings: { avatarId: 'nova', voiceId: 'nova', captions: true, tone: 'Balanced', music: false,
                format: 'MP4', res: '1080p', aspect: '16:9' },
    currentScene: 0,
    currentTime: 0,
    playing: false,
    inspTab: 'script',
    chatBusy: false,
    chat: [],
    flags: { analyzed: false, greeted: false, generated: false },
    _raf: null, _last: 0, _lastRender: -1, _playIcon: null, _genTimer: null,
  };

  const totalDur = () => state.scenes.reduce((t, s) => t + s.dur, 0);
  const sceneStart = (i) => state.scenes.slice(0, i).reduce((t, s) => t + s.dur, 0);
  const sceneAtTime = (t) => {
    let acc = 0;
    for (let i = 0; i < state.scenes.length; i++) { acc += state.scenes[i].dur; if (t < acc) return i; }
    return state.scenes.length - 1;
  };
  const studioHost = () => (state.stage === 'edit' ? $('#studioStage') : $('#genStage'));

  function toast(msg, ic = 'i-check') {
    const t = $('#toast');
    t.innerHTML = icon(ic) + `<span>${esc(msg)}</span>`;
    t.hidden = false; requestAnimationFrame(() => t.classList.add('show'));
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.hidden = true, 300); }, 2600);
  }

  /* =========================================================
     SHARED · placeholder video frame renderer
     ========================================================= */
  function renderFrame(host, index) {
    const s = state.scenes[index];
    if (!host) return;
    if (!s) { host.className = 'video-stage empty'; host.innerHTML = 'No scenes'; return; }
    const b = bg(s.bgId);
    const av = avatar(state.settings.avatarId);
    const showAvatar = av.id !== 'none' && (s.type === 'talking-head' || s.type === 'outro');
    const cap = state.settings.captions && (s.type === 'talking-head' || s.type === 'chart');

    let inner = '';
    switch (s.type) {
      case 'title':
        inner = `<div class="vs-content"><div class="vs-kicker" style="color:${b.accent}">${esc(state.project)}</div>
                 <div class="vs-title">${esc(s.script)}</div></div>`; break;
      case 'quote':
        inner = `<div class="vs-content"><div class="vs-quote">“${esc(s.script)}”</div>
                 <div class="vs-kicker" style="color:${b.accent}">${esc(s.title)}</div></div>`; break;
      case 'bullets': {
        const items = s.script.split(/\s*·\s*/).filter(Boolean);
        inner = `<div class="vs-content"><div class="vs-title" style="font-size:clamp(11px,3.6cqw,34px)">${esc(s.title)}</div>
                 <div class="vs-bullets">${items.map(it => `<div class="b"><i style="color:${b.accent}"></i>${esc(it)}</div>`).join('')}</div></div>`; break;
      }
      case 'chart': {
        const data = s.chart || [0.4, 0.6, 0.8, 1];
        const bars = data.map((v, i) => `<div class="bar" style="height:${Math.round(v * 100)}%;background:${i === data.length - 1 ? b.accent : 'currentColor'};opacity:${i === data.length - 1 ? 1 : 0.82}"></div>`).join('');
        inner = `<div class="vs-content"><div class="vs-title" style="font-size:clamp(11px,3.4cqw,32px)">${esc(s.title)}</div>
                 <div class="vs-chart">${bars}</div></div>`; break;
      }
      case 'outro':
        inner = `<div class="vs-content"><div class="vs-title">${esc(s.headline || s.title)}</div>
                 <div class="vs-body">${esc(s.script)}</div>
                 <div class="vs-kicker" style="color:${b.accent};margin-top:1%">▸ Deck2Vid</div></div>`; break;
      default: // talking-head
        inner = `<div class="vs-lower3"><div class="vs-kicker" style="color:${b.accent}">${esc(s.title)}</div></div>`;
    }

    const avatarHTML = showAvatar
      ? `<div class="vs-avatar"><div class="ava-body" style="--ava:${av.color}"><div class="ava-head" style="--ava:${av.color}"></div><div class="ava-mono">${av.ini}</div></div></div>`
      : '';
    const capHTML = cap ? `<div class="vs-cc">${esc(s.script)}</div>` : '';

    host.className = 'video-stage' + (b.light ? ' light' : '');
    host.innerHTML =
      `<div class="vs-bg" style="background:${b.css}"></div>
       <div class="vs-grain"></div>
       ${avatarHTML}${inner}${capHTML}
       <div class="vs-badge-type">${typeLabel(s.type)}</div>`;
  }

  /* =========================================================
     STEPPER + NAVIGATION
     ========================================================= */
  function renderStepper() {
    const cur = stageIdx(state.stage);
    $('#stepper').innerHTML = STAGES.map((s, i) => {
      const cls = i === cur ? 'active' : (i <= state.maxReached ? 'done' : 'locked');
      const mark = (cls === 'done' && i !== cur) ? icon('i-check') : (i + 1);
      const sep = i < STAGES.length - 1 ? '<span class="step-sep"></span>' : '';
      return `<button class="step ${cls}" data-nav="${s.id}" ${cls === 'locked' ? 'disabled aria-disabled="true"' : ''} ${i === cur ? 'aria-current="step"' : ''}>
                <span class="step-n">${mark}</span><span>${s.label}</span></button>${sep}`;
    }).join('');
  }

  function goTo(id) {
    const idx = stageIdx(id);
    if (idx < 0 || idx > state.maxReached + 1) return;
    if (id !== 'intake' && !state.source) return;
    stopPlay();
    if (state._genTimer) { clearTimeout(state._genTimer); state._genTimer = null; }
    state.stage = id;
    state.maxReached = Math.max(state.maxReached, idx);
    $$('.stage').forEach(sec => sec.hidden = sec.dataset.stage !== id);
    renderStepper();
    window.scrollTo(0, 0);
    ({ intake: enterIntake, comprehend: enterComprehend, generate: enterGenerate,
       edit: enterStudio, export: enterExport }[id])();
  }

  /* =========================================================
     STAGE 1 · INTAKE
     ========================================================= */
  function enterIntake() {
    const grid = $('#samplesGrid');
    if (!grid.dataset.built) {
      grid.innerHTML = SAMPLES.map(s => `
        <button class="sample" data-sample="${s.id}">
          <div class="sample-top">
            <span class="sample-ic">${icon(s.icon)}</span>
            <span class="sample-kind">${s.kind}</span>
          </div>
          <div class="sample-name">${esc(s.name)}</div>
          <div class="sample-meta">${esc(s.meta)}</div>
        </button>`).join('');
      grid.dataset.built = '1';
    }
    // reset the composer for a fresh start
    pendingSource = null; renderAttachChip();
    if ($('#briefInput')) $('#briefInput').value = '';
  }

  let pendingSource = null;   // intake staging: { name, kind, scenes }
  const truncate = (t, n) => (t.length > n ? t.slice(0, n).trim() + '…' : t);

  function loadProject(brief, source, scenes, name) {
    state.brief = (brief || '').trim();
    state.source = source;                 // { name, kind } or null
    state.project = name;
    state.scenes = scenes.map(s => ({ ...s, id: uid(), chart: s.chart ? [...s.chart] : undefined }));
    state.currentScene = 0; state.currentTime = 0; state._lastRender = -1;
    state.settings.captions = true; state.settings.tone = 'Balanced'; state.settings.music = false;
    state.settings.voiceId = 'nova'; state.settings.avatarId = 'nova';
    state.flags = { analyzed: false, greeted: false, generated: false };
    state.maxReached = stageIdx('comprehend');   // lock later stages for the fresh project
    // the intake brief becomes the first turn of the Director conversation
    state.chat = state.brief ? [{ who: 'me', html: esc(state.brief) }] : [];
    $('#genThumbs').innerHTML = '';
    goTo('comprehend');
  }

  const pickSample = (id) => { const s = SAMPLES.find(x => x.id === id); loadProject(s.brief, { name: s.name, kind: s.kind }, s.scenes, s.name); };

  function attachFile(file) {
    // Only the NAME is read as a placeholder — the file is never parsed or uploaded.
    const name = file.name.replace(/\.[^.]+$/, '');
    const ext = (file.name.split('.').pop() || '').toUpperCase();
    pendingSource = { name, kind: ext || 'File', scenes: SAMPLES[0].scenes };
    renderAttachChip();
    toast('Attached “' + file.name + '” (prototype — content not parsed)', 'i-spark');
  }
  function renderAttachChip() {
    const chip = $('#attachChip'), hint = $('#attachHint'), btn = $('#attachBtn');
    if (!chip) return;
    if (pendingSource) {
      chip.hidden = false; if (hint) hint.hidden = true; if (btn) btn.hidden = true;
      chip.innerHTML = `<span class="fname">${esc(pendingSource.name)}</span><span class="fkind">${esc(pendingSource.kind)}</span>` +
                       `<button class="chip-x" id="detachBtn" type="button" aria-label="Remove attached file">${icon('i-x')}</button>`;
    } else {
      chip.hidden = true; chip.innerHTML = ''; if (hint) hint.hidden = false; if (btn) btn.hidden = false;
    }
  }
  function deriveTitle(brief) {
    const t = (brief || '').trim().replace(/\s+/g, ' ');
    if (!t) return 'Untitled project';
    const w = t.split(' ').slice(0, 6).join(' ');
    return (w.length > 48 ? w.slice(0, 48) + '…' : w).replace(/[.,;:]$/, '');
  }
  function createFromComposer() {
    const brief = (($('#briefInput') && $('#briefInput').value) || '').trim();
    if (!brief && !pendingSource) { toast('Add a description or attach a file first', 'i-spark'); if ($('#briefInput')) $('#briefInput').focus(); return; }
    const source = pendingSource ? { name: pendingSource.name, kind: pendingSource.kind } : null;
    const scenes = pendingSource ? pendingSource.scenes : SAMPLES[0].scenes;
    loadProject(brief, source, scenes, source ? source.name : deriveTitle(brief));
  }
  function sourceChipsHTML() {
    const chips = [];
    if (state.brief) chips.push(`<span class="src-chip brief" title="${esc(state.brief)}">${icon('i-spark')} <span class="val">Brief: “${esc(truncate(state.brief, 64))}”</span></span>`);
    chips.push(state.source
      ? `<span class="src-chip">${icon('i-article')} <span class="val">${esc(state.source.name)} · ${esc(state.source.kind)}</span></span>`
      : `<span class="src-chip">${icon('i-spark')} <span class="val">From your description</span></span>`);
    return chips.join('');
  }

  /* =========================================================
     STAGE 2 · COMPREHEND
     ========================================================= */
  function enterComprehend() {
    const chips = sourceChipsHTML();
    $('#anFrom').innerHTML = chips;
    $('#sourcesRecap').innerHTML = chips;
    if (!state.flags.analyzed) runAnalyze();
    else { $('#analyzing').hidden = true; $('#flow').hidden = false; renderFlow(); }
  }
  function runAnalyze() {
    $('#flow').hidden = true;
    const wrap = $('#analyzing'); wrap.hidden = false;
    const steps = $$('#anSteps li');
    steps.forEach(s => s.classList.remove('active', 'done'));
    let i = 0;
    const tick = () => {
      if (state.stage !== 'comprehend') return;
      if (i > 0) steps[i - 1].classList.replace('active', 'done');
      if (i < steps.length) { steps[i].classList.add('active'); i++; setTimeout(tick, 620); }
      else { state.flags.analyzed = true; setTimeout(() => { if (state.stage === 'comprehend') { wrap.hidden = true; $('#flow').hidden = false; renderFlow(); } }, 420); }
    };
    setTimeout(tick, 380);
  }

  function renderFlow() {
    renderFlowSummary();
    $('#sceneList').innerHTML = state.scenes.map((s, i) => sceneCardHTML(s, i)).join('');
  }
  function renderFlowSummary() {
    $('#flowSummary').innerHTML = `
      <div class="sum-chip"><span class="k">Scenes</span><span class="v">${state.scenes.length}</span></div>
      <div class="sum-chip"><span class="k">Runtime</span><span class="v">${fmt(totalDur())}</span></div>
      <div class="sum-chip"><span class="k">Tone</span><span class="v ai">${esc(state.settings.tone)}</span></div>`;
  }
  function sceneCardHTML(s, i) {
    return `<li class="scene-card" data-scene="${s.id}" data-idx="${i}" draggable="true">
      <div class="sc-handle" data-handle aria-hidden="true">${icon('i-grip')}<span class="sc-num">${i + 1}</span></div>
      <div class="sc-body">
        <div class="sc-title" contenteditable="true" data-edit="title" spellcheck="false" role="textbox" aria-label="Scene title">${esc(s.title)}</div>
        <div class="sc-script" contenteditable="true" data-edit="script" spellcheck="false" role="textbox" aria-label="Scene script">${esc(s.script)}</div>
        <div class="sc-tags">
          <span class="sc-tag">${icon('i-layers')} ${typeLabel(s.type)}</span>
          <span class="sc-tag dur">${icon('i-clock')} ${s.dur}s</span>
        </div>
      </div>
      <div class="sc-actions"><button class="icon-btn sc-del" data-del aria-label="Delete scene ${i + 1}">${icon('i-trash')}</button></div>
    </li>`;
  }

  // drag-reorder (blocked while editing text)
  let dragIdx = null;
  function wireFlowDnD() {
    const list = $('#sceneList');
    list.addEventListener('dragstart', e => {
      const card = e.target.closest('.scene-card');
      if (!card || e.target.isContentEditable) { e.preventDefault(); return; }
      dragIdx = +card.dataset.idx; card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    list.addEventListener('dragend', () => { dragIdx = null; $$('.scene-card', list).forEach(c => c.classList.remove('dragging', 'drop-target')); });
    list.addEventListener('dragover', e => {
      e.preventDefault();
      const card = e.target.closest('.scene-card');
      $$('.scene-card', list).forEach(c => c.classList.remove('drop-target'));
      if (card && +card.dataset.idx !== dragIdx) card.classList.add('drop-target');
    });
    list.addEventListener('drop', e => {
      e.preventDefault();
      const card = e.target.closest('.scene-card'); if (!card || dragIdx === null) return;
      const to = +card.dataset.idx;
      const [m] = state.scenes.splice(dragIdx, 1);
      state.scenes.splice(to, 0, m);
      state.currentScene = state.scenes.findIndex(s => s.id === m.id);
      renderFlow();
    });
  }

  /* =========================================================
     STAGE 4 · GENERATE (render + preview)
     ========================================================= */
  function enterGenerate() {
    $('#genProjName').textContent = state.project;
    renderThumbs();
    renderFrame($('#genStage'), state.currentScene);   // always show the selected slide
    reflectActive(state.currentScene);
    updateTransport();
    if (!state.flags.generated) { state.flags.generated = true; runGenerate(); }
    else { $('#genShimmer').hidden = true; $('#genStatus').textContent = 'Preview'; }
    syncGenReady();
  }
  function runGenerate() {
    const sh = $('#genShimmer'); if (!sh) return;
    sh.hidden = false; $('#genStatus').textContent = 'Generating…'; syncGenReady();
    const fill = $('#genBarFill'); if (fill) fill.style.width = '0%';
    const steps = ['Compositing scenes…', 'Synthesizing voiceover…', 'Rendering avatar…', 'Finalizing…'];
    let p = 0;
    clearInterval(runGenerate._iv);
    runGenerate._iv = setInterval(() => {
      p = Math.min(100, p + (10 + Math.random() * 12));
      if (fill) fill.style.width = p + '%';
      const msg = $('#genMsg'); if (msg) msg.textContent = steps[Math.min(steps.length - 1, Math.floor(p / (100 / steps.length)))];
      if (p >= 100) {
        clearInterval(runGenerate._iv);
        if (state.stage === 'generate') { sh.hidden = true; $('#genStatus').textContent = 'Preview'; syncGenReady(); }
      }
    }, 260);
  }
  // big center play button shown once the video is "generated" and paused
  function syncGenReady() {
    const gr = $('#genReady'); if (!gr) return;
    const shimmerHidden = !$('#genShimmer') || $('#genShimmer').hidden;
    gr.hidden = !(state.stage === 'generate' && shimmerHidden && !state.playing);
  }

  /* ---- Director chat — lives inside the Studio inspector ---- */
  const chipsHTML = () => CHAT_CHIPS.map(c => `<button class="chip" data-chip>${esc(c)}</button>`).join('');
  function renderChat() {
    const log = $('#chatLog'); if (!log) return;
    log.innerHTML = state.chat.map(m => m.pending
      ? `<div class="msg ai"><span class="av" aria-hidden="true">${icon('i-spark')}</span><div class="bubble"><div class="typing" aria-label="Director is typing"><span></span><span></span><span></span></div></div></div>`
      : `<div class="msg ${m.who}"><span class="av" aria-hidden="true">${icon(m.who === 'ai' ? 'i-spark' : 'i-user')}</span><div class="bubble">${m.html}</div></div>`
    ).join('');
    log.scrollTop = log.scrollHeight;
  }
  function sendMessage(text) {
    text = text.trim(); if (!text || state.chatBusy) return;
    state.chatBusy = true;
    state.chat.push({ who: 'me', html: esc(text) });
    const pending = { who: 'ai', pending: true };
    state.chat.push(pending);
    renderChat();
    const inp = $('#chatText'); if (inp) inp.disabled = true;
    const snd = $('#chatSend'); if (snd) snd.disabled = true;
    setTimeout(() => {
      const rule = CHAT_RULES.find(r => r.re.test(text));
      if (rule && rule.fx) rule.fx();
      pending.pending = false; pending.html = rule ? rule.reply : CHAT_DEFAULT;
      state.chatBusy = false;
      renderChat();
      // reflect any changes into the studio preview + tracks
      if (state.stage === 'edit') { renderFrame($('#studioStage'), state.currentScene); renderTimeline(); renderAllRailMinis(); }
      updateTransport();
      const i2 = $('#chatText'); if (i2) { i2.disabled = false; i2.focus(); }
      const s2 = $('#chatSend'); if (s2) s2.disabled = false;
    }, 640);
  }

  function renderThumbs() {
    const strip = $('#genThumbs');
    strip.innerHTML = state.scenes.map((s, i) =>
      `<button class="thumb ${i === state.currentScene ? 'active' : ''}" data-thumb="${i}" aria-label="Scene ${i + 1}: ${esc(s.title)}" ${i === state.currentScene ? 'aria-current="true"' : ''}>
         <div class="thumb-n">${i + 1}</div><div class="video-stage" data-mini="${i}"></div></button>`).join('');
    $$('[data-mini]', strip).forEach(el => renderFrame(el, +el.dataset.mini));
  }

  /* =========================================================
     STAGE 4 · STUDIO
     ========================================================= */
  function enterStudio() {
    $('#studioProj').textContent = state.project;
    if (!state.flags.greeted) {
      state.flags.greeted = true;
      let from;
      if (state.brief && state.source) from = `your brief and <b>${esc(state.source.name)}</b>`;
      else if (state.brief) from = 'your brief';
      else if (state.source) from = `<b>${esc(state.source.name)}</b>`;
      else from = 'your inputs';
      state.chat.push({ who: 'ai', html: `Working from ${from}, I've drafted <b>${esc(state.project)}</b> as ${state.scenes.length} scenes (~${fmt(totalDur())}). Edit any scene on the left, or tell me what to change — tone, pacing, captions, voice.` });
    }
    renderRail(); renderTimeline(); renderInspector();
    renderFrame($('#studioStage'), state.currentScene);
    updateTransport();
  }
  function renderRail() {
    $('#sceneRail').innerHTML = state.scenes.map((s, i) =>
      `<button class="rail-scene ${i === state.currentScene ? 'active' : ''}" data-rail="${i}" aria-label="Scene ${i + 1}: ${esc(s.title)}" ${i === state.currentScene ? 'aria-current="true"' : ''}>
         <div class="rail-thumb"><div class="rail-n">${i + 1}</div><div class="video-stage" data-mini="${i}"></div></div>
         <div class="rail-cap"><span class="t">${esc(s.title)}</span><span class="d">${s.dur}s</span></div>
       </button>`).join('');
    $$('[data-mini]', $('#sceneRail')).forEach(el => renderFrame(el, +el.dataset.mini));
  }
  const renderRailMini = (i) => { const el = $(`#sceneRail [data-mini="${i}"]`); if (el) renderFrame(el, i); };
  const renderAllRailMinis = () => $$('#sceneRail [data-mini]').forEach(el => renderFrame(el, +el.dataset.mini));

  function renderTimeline() {
    const total = totalDur() || 1;
    const clips = state.scenes.map((s, i) =>
      `<span class="tl-clip ${i === state.currentScene ? 'active' : ''}" style="flex:${s.dur};--clip:${bg(s.bgId).accent}66">${esc(s.title)}</span>`).join('');
    const v = voice(state.settings.voiceId);
    $('#tlTracks').innerHTML = `
      <div class="tl-grid">
        <div class="tl-names">
          <div class="tl-tname">${icon('i-layers')} Scenes</div>
          <div class="tl-tname">${icon('i-mic')} Voice</div>
          <div class="tl-tname">${icon('i-music')} Music</div>
          <div class="tl-tname">${icon('i-cc')} Captions</div>
        </div>
        <div class="tl-lanes" id="tlLanes">
          <div class="tl-lane scenes" id="tlSeek" role="slider" tabindex="0" aria-label="Timeline — seek"
               aria-valuemin="0" aria-valuemax="${Math.round(totalDur())}" aria-valuenow="${Math.round(state.currentTime)}">${clips}</div>
          <div class="tl-lane solid"><span class="tl-band" style="background:var(--brand-dim)">${esc(v.name)} · ${esc(v.desc)}</span></div>
          <div class="tl-lane solid"><span class="tl-band" style="background:var(--ai-dim)">${state.settings.music ? 'Upbeat bed · −18 dB' : 'No music'}</span></div>
          <div class="tl-lane solid"><span class="tl-band">${state.settings.captions ? 'Captions on' : 'Captions off'}</span></div>
          <div class="tl-playhead" id="tlPlayhead" style="left:${(state.currentTime / total) * 100}%"></div>
        </div>
      </div>`;
    $('#studioDur').textContent = fmt(totalDur());
  }

  function renderInspector() {
    $$('.insp-tab').forEach(t => { const on = t.dataset.tab === state.inspTab; t.classList.toggle('active', on); t.setAttribute('aria-selected', on); });
    const body = $('#inspBody');
    body.classList.toggle('is-chat', state.inspTab === 'chat');

    if (state.inspTab === 'chat') {
      body.innerHTML =
        `<div class="insp-chat">
           <div class="chat-log" id="chatLog" aria-live="polite"></div>
           <div class="chat-chips" id="chatChips">${chipsHTML()}</div>
           <form class="chat-input" id="chatForm">
             <input type="text" id="chatText" placeholder="Ask the Director to change something…" autocomplete="off" ${state.chatBusy ? 'disabled' : ''}/>
             <button class="btn primary icon" id="chatSend" type="submit" aria-label="Send" ${state.chatBusy ? 'disabled' : ''}><svg class="ic"><use href="#i-send"/></svg></button>
           </form>
         </div>`;
      renderChat();
      return;
    }

    const s = state.scenes[state.currentScene];
    if (!s) { body.innerHTML = ''; return; }

    if (state.inspTab === 'script') {
      body.innerHTML = `
        <div class="field"><label class="field-label" for="inTitle">Scene title</label>
          <input class="ta one" id="inTitle" value="${esc(s.title)}"/></div>
        <div class="field"><label class="field-label" for="inScript">Script / narration</label>
          <textarea class="ta" id="inScript">${esc(s.script)}</textarea></div>
        <div class="field"><span class="field-label" id="typeLbl">Scene type <span class="hint">${typeLabel(s.type)}</span></span>
          <div class="seg wrap" data-opt="type" role="radiogroup" aria-labelledby="typeLbl">
            ${['title', 'talking-head', 'bullets', 'chart', 'quote', 'outro'].map(t =>
              `<button class="seg-btn ${t === s.type ? 'active' : ''}" data-val="${t}" role="radio" aria-checked="${t === s.type}">${typeLabel(t)}</button>`).join('')}
          </div></div>
        <div class="field"><label class="field-label" for="inDur">Duration <span class="hint" id="durHint">${s.dur}s</span></label>
          <input type="range" class="range" id="inDur" min="3" max="20" value="${s.dur}" aria-label="Scene duration in seconds"/></div>`;
      $('#inTitle').addEventListener('input', e => { s.title = e.target.value; softRefresh('title'); });
      $('#inScript').addEventListener('input', e => { s.script = e.target.value; softRefresh('frame'); });
      $('#inDur').addEventListener('input', e => { s.dur = +e.target.value; $('#durHint').textContent = s.dur + 's'; softRefresh('dur'); });
    }
    else if (state.inspTab === 'avatar') {
      body.innerHTML = `<div class="field"><span class="field-label" id="avLbl">Presenter <span class="hint">all scenes</span></span>
        <div class="opt-list" role="radiogroup" aria-labelledby="avLbl">${AVATARS.map(a => `
          <button class="opt-row ${a.id === state.settings.avatarId ? 'sel' : ''}" data-avatar="${a.id}" role="radio" aria-checked="${a.id === state.settings.avatarId}">
            <span class="opt-avatar" style="background:${a.color || 'var(--surface-3)'}">${a.ini || '—'}</span>
            <span class="meta"><span class="n">${a.name}</span><span class="s">${a.tone}</span></span>
            <span class="radio" aria-hidden="true"></span></button>`).join('')}</div></div>`;
    }
    else if (state.inspTab === 'voice') {
      body.innerHTML = `<div class="field"><span class="field-label" id="voLbl">Voice <span class="hint">all scenes</span></span>
        <div class="opt-list" role="radiogroup" aria-labelledby="voLbl">${VOICES.map(v => `
          <button class="opt-row ${v.id === state.settings.voiceId ? 'sel' : ''}" data-voice="${v.id}" role="radio" aria-checked="${v.id === state.settings.voiceId}">
            <span class="opt-avatar" style="background:var(--surface-3);color:var(--ai)">${icon('i-mic')}</span>
            <span class="meta"><span class="n">${v.name}</span><span class="s">${v.desc}</span></span>
            <span class="radio" aria-hidden="true"></span></button>`).join('')}</div></div>`;
    }
    else { // scene / background
      body.innerHTML = `
        <div class="field"><span class="field-label" id="bgLbl">Background <span class="hint">this scene</span></span>
          <div class="swatch-grid" role="radiogroup" aria-labelledby="bgLbl">${BACKGROUNDS.map(b => `
            <button class="swatch ${b.id === s.bgId ? 'sel' : ''}" data-bg="${b.id}" role="radio" aria-checked="${b.id === s.bgId}" aria-label="${b.name} background" title="${b.name}" style="background:${b.css}"></button>`).join('')}</div></div>
        <div class="toggle-row"><span id="capLbl">Captions</span>
          <button class="switch ${state.settings.captions ? 'on' : ''}" data-toggle="captions" role="switch" aria-checked="${state.settings.captions}" aria-labelledby="capLbl"></button></div>
        <div class="toggle-row"><span id="musLbl">Background music</span>
          <button class="switch ${state.settings.music ? 'on' : ''}" data-toggle="music" role="switch" aria-checked="${state.settings.music}" aria-labelledby="musLbl"></button></div>`;
    }
  }

  // targeted refresh after inspector edits
  function softRefresh(kind) {
    renderFrame($('#studioStage'), state.currentScene);
    if (kind === 'title') { renderRailCaptions(); renderTimeline(); }
    else if (kind === 'dur') { renderTimeline(); renderRailCaptions(); }
    else { renderRailMini(state.currentScene); renderTimeline(); } // script / type / bg
    positionPlayhead();
  }
  function renderRailCaptions() {
    $$('#sceneRail .rail-scene').forEach((el, i) => {
      const s = state.scenes[i]; if (!s) return;
      el.querySelector('.rail-cap .t').textContent = s.title;
      el.querySelector('.rail-cap .d').textContent = s.dur + 's';
      el.setAttribute('aria-label', `Scene ${i + 1}: ${s.title}`);
    });
  }

  /* =========================================================
     SELECTION + PLAYBACK (shared by generate + studio)
     ========================================================= */
  function reflectActive(i) {
    if (state.stage === 'generate') {
      $$('#genThumbs .thumb').forEach((t, k) => { t.classList.toggle('active', k === i); t.setAttribute('aria-current', k === i ? 'true' : 'false'); });
    } else if (state.stage === 'edit') {
      $$('#sceneRail .rail-scene').forEach((t, k) => { t.classList.toggle('active', k === i); t.setAttribute('aria-current', k === i ? 'true' : 'false'); });
      $$('#tlTracks .tl-clip').forEach((c, k) => c.classList.toggle('active', k === i));
    }
  }
  function selectScene(i, seek = true) {
    i = clamp(i, 0, state.scenes.length - 1);
    state.currentScene = i;
    if (seek) state.currentTime = sceneStart(i);
    state._lastRender = -1;
    renderFrame(studioHost(), i);
    reflectActive(i);
    if (state.stage === 'edit') renderInspector();
    updateTransport();
  }

  // seek by 0..1 ratio; only re-renders the frame when the scene index changes
  function seekToRatio(ratio, finalize) {
    const total = totalDur();
    state.currentTime = clamp(ratio, 0, 1) * total;
    const si = sceneAtTime(state.currentTime);
    if (si !== state.currentScene || state._lastRender !== si) {
      state.currentScene = si; state._lastRender = si;
      renderFrame(studioHost(), si); reflectActive(si);
    }
    updateTransport();
    if (finalize && state.stage === 'edit') renderInspector();
  }
  function seekKey(e) {
    const total = totalDur(); let t = state.currentTime;
    if (e.key === 'ArrowRight') t += 1;
    else if (e.key === 'ArrowLeft') t -= 1;
    else if (e.key === 'Home') t = 0;
    else if (e.key === 'End') t = total;
    else return;
    e.preventDefault();
    seekToRatio(clamp(t, 0, total) / (total || 1), true);
  }

  function positionPlayhead() { const ph = $('#tlPlayhead'); if (ph) ph.style.left = (state.currentTime / (totalDur() || 1)) * 100 + '%'; }
  function updateTransport() {
    const total = totalDur();
    if ($('#genTC')) $('#genTC').textContent = fmt(state.currentTime);
    if ($('#genDur')) $('#genDur').textContent = fmt(total);
    if ($('#genScrubFill')) $('#genScrubFill').style.width = (state.currentTime / (total || 1)) * 100 + '%';
    const gs = $('#genScrub'); if (gs) { gs.setAttribute('aria-valuemax', Math.round(total)); gs.setAttribute('aria-valuenow', Math.round(state.currentTime)); }
    if ($('#studioTC')) $('#studioTC').textContent = fmt(state.currentTime);
    const ts = $('#tlSeek'); if (ts) { ts.setAttribute('aria-valuemax', Math.round(total)); ts.setAttribute('aria-valuenow', Math.round(state.currentTime)); }
    positionPlayhead();
    // swap play/pause icon only on transition (cheap during rAF)
    const pic = state.playing ? 'i-pause' : 'i-play';
    if (pic !== state._playIcon) {
      state._playIcon = pic;
      ['#genPlay', '#studioPlay'].forEach(sel => { const b = $(sel); if (b) { b.innerHTML = icon(pic); b.setAttribute('aria-label', state.playing ? 'Pause' : 'Play'); } });
    }
    syncGenReady();
  }

  function togglePlay() { state.playing ? stopPlay() : startPlay(); }
  function startPlay() {
    if (!state.scenes.length) return;
    if (state.currentTime >= totalDur()) state.currentTime = 0;
    state.playing = true; state._last = performance.now(); updateTransport();
    const loop = (ts) => {
      if (!state.playing) return;
      const dt = (ts - state._last) / 1000; state._last = ts;
      state.currentTime += dt;
      const total = totalDur();
      if (state.currentTime >= total) { state.currentTime = total; state.playing = false; }
      const si = sceneAtTime(state.currentTime);
      if (si !== state._lastRender) { state._lastRender = si; state.currentScene = si; renderFrame(studioHost(), si); reflectActive(si); }
      updateTransport();
      if (state.playing) state._raf = requestAnimationFrame(loop);
      else if (state.stage === 'edit') renderInspector();   // resync inspector to final scene
    };
    state._raf = requestAnimationFrame(loop);
  }
  function stopPlay() {
    const was = state.playing;
    state.playing = false;
    if (state._raf) { cancelAnimationFrame(state._raf); state._raf = null; }
    updateTransport();
    if (was && state.stage === 'edit') renderInspector();
  }

  /* =========================================================
     STAGE 5 · EXPORT
     ========================================================= */
  function enterExport() {
    $('#exportOptions').hidden = false;
    $('#exportRender').hidden = true;
    syncSeg('format', state.settings.format);
    syncSeg('res', state.settings.res);
    syncSeg('aspect', state.settings.aspect);
    $('#expCaptions').checked = state.settings.captions;
    let ps = $('#exportPosterStage');
    if (!ps) { $('#exportPoster').innerHTML = '<div class="video-stage" id="exportPosterStage"></div>'; ps = $('#exportPosterStage'); }
    const ti = state.scenes.findIndex(s => s.type === 'title');
    renderFrame(ps, ti >= 0 ? ti : 0);
    renderPosterMeta();
  }
  function syncSeg(opt, val) {
    $$(`.seg[data-opt="${opt}"] .seg-btn`).forEach(b => { const on = b.dataset.val === val; b.classList.toggle('active', on); b.setAttribute('aria-checked', on); });
  }
  const renderPosterMeta = () => {
    $('#posterMeta').innerHTML = [state.settings.format, state.settings.res, state.settings.aspect, fmt(totalDur()), state.scenes.length + ' scenes']
      .map(x => `<span class="pm">${esc(x)}</span>`).join('');
  };

  function runExport() {
    $('#exportOptions').hidden = true;
    const r = $('#exportRender'); r.hidden = false;
    const vis = $('#renderVisual'); vis.className = 'render-visual spin';
    vis.innerHTML = `<div class="rv-core">${icon('i-spark')}</div>`;
    $('#renderTitle').textContent = 'Rendering…';
    $('#renderActions').hidden = true;
    const fill = $('#renderFill'); fill.style.width = '0%';
    const msgs = ['Compositing scenes…', 'Synthesizing voiceover…', 'Rendering avatar…', 'Burning in captions…', 'Finalizing ' + state.settings.format + '…'];
    let p = 0;
    const iv = setInterval(() => {
      p = Math.min(100, p + (6 + Math.random() * 9));
      fill.style.width = p + '%';
      $('#renderSub').textContent = msgs[Math.min(msgs.length - 1, Math.floor(p / (100 / msgs.length)))];
      if (p >= 100) {
        clearInterval(iv);
        vis.className = 'render-visual done'; vis.innerHTML = `<div class="rv-core">${icon('i-check')}</div>`;
        $('#renderTitle').textContent = 'Export complete';
        $('#renderSub').textContent = `${state.project} · ${state.settings.res} ${state.settings.format} · ${fmt(totalDur())}`;
        $('#renderActions').hidden = false; $('#btnDownload').focus();
      }
    }, 260);
  }

  // tangible offline artifact: render the poster frame to a PNG via canvas
  function downloadPoster() {
    const ti = state.scenes.findIndex(s => s.type === 'title');
    const s = state.scenes[ti >= 0 ? ti : 0]; const b = bg(s.bgId);
    const W = 1280, H = 720, c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, b.light ? '#efe9dc' : '#1a1509'); g.addColorStop(1, b.light ? '#d8ccb6' : '#0a0a0d');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.font = '600 26px Georgia, serif'; x.fillStyle = b.accent;
    x.fillText(state.project.toUpperCase(), 90, 300);
    x.fillStyle = b.light ? '#1b1712' : '#f2eee6'; x.font = '600 64px Georgia, serif';
    wrapText(x, s.script, 90, 372, W - 180, 72);
    x.font = '500 20px Georgia, serif'; x.fillStyle = b.accent;
    x.fillText('▸ DECK2VID · PROTOTYPE', 90, H - 66);
    c.toBlob(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = state.project.replace(/[^\w]+/g, '-').toLowerCase() + '-poster.png';
      a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      toast('Downloaded poster (prototype stand-in for the rendered video)', 'i-download');
    });
  }
  function wrapText(ctx, text, x, y, maxW, lh) {
    const words = text.split(' '); let line = '', yy = y;
    for (const w of words) { if (ctx.measureText(line + w).width > maxW && line) { ctx.fillText(line.trim(), x, yy); line = ''; yy += lh; } line += w + ' '; }
    ctx.fillText(line.trim(), x, yy);
  }

  /* =========================================================
     ADD SCENE (shared)
     ========================================================= */
  function addScene() {
    const s = scn('New scene', 'talking-head', 'Add your narration here.', 6, 'slate');
    const at = state.stage === 'edit' ? state.currentScene + 1 : state.scenes.length;
    state.scenes.splice(at, 0, s);
    renderFlowSummary();
    if (state.stage === 'comprehend') renderFlow();
    if (state.stage === 'edit') { renderRail(); renderTimeline(); selectScene(at); }  // rebuild DOM, then select
  }

  /* =========================================================
     EVENT WIRING
     ========================================================= */
  function wireEvents() {
    document.addEventListener('click', (e) => {
      const nav = e.target.closest('[data-nav]');
      if (nav && !nav.disabled) { e.preventDefault(); goTo(nav.dataset.nav); return; }
      const sample = e.target.closest('[data-sample]'); if (sample) { pickSample(sample.dataset.sample); return; }
      if (e.target.closest('[data-add-scene]')) { addScene(); return; }
      const del = e.target.closest('[data-del]');
      if (del) {
        const i = +del.closest('[data-idx]').dataset.idx;
        if (state.scenes.length > 1) { state.scenes.splice(i, 1); if (state.currentScene >= state.scenes.length) state.currentScene = state.scenes.length - 1; renderFlow(); }
        else toast('Keep at least one scene', 'i-spark');
        return;
      }
      const chip = e.target.closest('[data-chip]'); if (chip) { sendMessage(chip.textContent); return; }
      const thumb = e.target.closest('[data-thumb]'); if (thumb) { selectScene(+thumb.dataset.thumb); return; }
      const rail = e.target.closest('[data-rail]'); if (rail) { selectScene(+rail.dataset.rail); return; }
      if (e.target.closest('#genPlay') || e.target.closest('#studioPlay') || e.target.closest('#genReady')) { togglePlay(); return; }
      const tab = e.target.closest('.insp-tab'); if (tab) { state.inspTab = tab.dataset.tab; renderInspector(); return; }
      const av = e.target.closest('[data-avatar]'); if (av) { state.settings.avatarId = av.dataset.avatar; renderInspector(); renderFrame($('#studioStage'), state.currentScene); renderAllRailMinis(); return; }
      const vo = e.target.closest('[data-voice]'); if (vo) { state.settings.voiceId = vo.dataset.voice; renderInspector(); renderTimeline(); return; }
      const bgSw = e.target.closest('[data-bg]'); if (bgSw) { state.scenes[state.currentScene].bgId = bgSw.dataset.bg; renderInspector(); softRefresh('frame'); return; }
      const tog = e.target.closest('[data-toggle]'); if (tog) { const k = tog.dataset.toggle; state.settings[k] = !state.settings[k]; renderInspector(); renderFrame($('#studioStage'), state.currentScene); renderTimeline(); return; }
      const segType = e.target.closest('.seg[data-opt="type"] .seg-btn'); if (segType) { state.scenes[state.currentScene].type = segType.dataset.val; renderInspector(); softRefresh('frame'); return; }
      const segEx = e.target.closest('.export-side .seg .seg-btn');
      if (segEx) { const opt = segEx.closest('.seg').dataset.opt; state.settings[opt] = segEx.dataset.val; syncSeg(opt, segEx.dataset.val); renderPosterMeta(); return; }
      if (e.target.closest('#btnExport')) { state.settings.captions = $('#expCaptions').checked; runExport(); return; }
      if (e.target.closest('#btnDownload')) { downloadPoster(); return; }
      if (e.target.closest('#btnRestart')) { restart(); return; }
      if (e.target.closest('#detachBtn')) { pendingSource = null; renderAttachChip(); return; }
    });

    // flow inline editing
    const list = $('#sceneList');
    list.addEventListener('input', (e) => {
      const ed = e.target.closest('[data-edit]'); if (!ed) return;
      const s = state.scenes[+ed.closest('[data-idx]').dataset.idx];
      if (ed.dataset.edit === 'title') s.title = ed.textContent; else s.script = ed.textContent;
    });
    list.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.closest('.sc-title')) { e.preventDefault(); e.target.blur(); } });
    wireFlowDnD();

    // chat (form is rendered dynamically inside the Studio inspector)
    document.addEventListener('submit', (e) => {
      if (e.target && e.target.id === 'chatForm') { e.preventDefault(); const t = $('#chatText'); const v = t.value; t.value = ''; sendMessage(v); }
    });

    // generate scrubber — pointer drag + keyboard
    const gs = $('#genScrub');
    const seekGen = (e) => { const r = gs.getBoundingClientRect(); seekToRatio((e.clientX - r.left) / r.width, false); };
    const endGen = () => { window.removeEventListener('pointermove', seekGen); window.removeEventListener('pointerup', endGen); };
    gs.addEventListener('pointerdown', (e) => { e.preventDefault(); gs.focus(); seekGen(e); window.addEventListener('pointermove', seekGen); window.addEventListener('pointerup', endGen); });
    gs.addEventListener('keydown', seekKey);

    // studio timeline — pointer drag + keyboard (delegated on stable #tlTracks)
    const tlt = $('#tlTracks');
    const seekLane = (e) => { const lane = $('#tlSeek'); if (!lane) return; const r = lane.getBoundingClientRect(); seekToRatio((e.clientX - r.left) / r.width, false); };
    const endLane = () => { window.removeEventListener('pointermove', seekLane); window.removeEventListener('pointerup', endLane); if (state.stage === 'edit') renderInspector(); };
    tlt.addEventListener('pointerdown', (e) => { const lane = $('#tlSeek'); if (!lane || (e.target !== lane && !lane.contains(e.target))) return; e.preventDefault(); lane.focus(); seekLane(e); window.addEventListener('pointermove', seekLane); window.addEventListener('pointerup', endLane); });
    tlt.addEventListener('keydown', (e) => { if (e.target.id === 'tlSeek') seekKey(e); });

    // intake composer (describe + attach)
    const fi = $('#fileInput');
    fi.addEventListener('change', () => { if (fi.files[0]) attachFile(fi.files[0]); fi.value = ''; });
    $('#attachBtn').addEventListener('click', () => fi.click());
    $('#btnCreate').addEventListener('click', createFromComposer);
    $('#briefInput').addEventListener('keydown', (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); createFromComposer(); } });
    const comp = $('#composer');
    ['dragenter', 'dragover'].forEach(ev => comp.addEventListener(ev, e => { e.preventDefault(); comp.classList.add('drag'); }));
    comp.addEventListener('dragleave', e => { if (!comp.contains(e.relatedTarget)) comp.classList.remove('drag'); });
    comp.addEventListener('drop', e => { e.preventDefault(); comp.classList.remove('drag'); const f = e.dataTransfer.files[0]; if (f) attachFile(f); });

    // spacebar = play/pause on generate/studio
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !/input|textarea/i.test(e.target.tagName) && !e.target.isContentEditable
          && (state.stage === 'generate' || state.stage === 'edit')) { e.preventDefault(); togglePlay(); }
    });
  }

  function restart() {
    stopPlay();
    if (state._genTimer) { clearTimeout(state._genTimer); state._genTimer = null; }
    state.source = null; state.brief = ''; state.scenes = []; state.maxReached = 0;
    state.flags = { analyzed: false, greeted: false, generated: false };
    state.chat = []; pendingSource = null;
    goTo('intake');
  }

  /* ---------------- boot ---------------- */
  function init() { wireEvents(); enterIntake(); goTo('intake'); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
