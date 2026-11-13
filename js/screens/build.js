import { esc, firstName, prefersReducedMotion } from '../dom.js';
import { logo, muteButton, progress, meterBlock, timerBlock } from '../chrome.js';
import { characterHTML } from '../characters.js';
import { score } from '../scoring.js';
import { browserShell, renderSite, columnOptions, sectionBar } from '../site/render.js';

const TABS = [
  ['colour', 'Colour'],
  ['type', 'Type'],
  ['style', 'Style'],
  ['images', 'Images'],
  ['decor', 'Decor'],
];

function choice(on, key, value, inner, label) {
  return `<button type="button" class="choice${on ? ' is-on' : ''}" data-action="set-choice" data-key="${esc(key)}" data-value="${esc(value)}" aria-pressed="${on}">
    ${inner}
    <span>${esc(label)}</span>
  </button>`;
}

export function isUntouched(state) {
  return !state.sections.length && !state.palette && !state.heading && !state.body
    && !state.style && !state.picture
    && (state.heroDecor || 'none') === 'none' && (state.pattern || 'none') === 'none';
}

/** What the client shows while you build. Kinder than the final verdict: nothing is judged before you start. */
export function liveMood(state, result) {
  if (isUntouched(state)) return { label: 'Waiting for you', face: 'neutral' };
  if (result.mood === 'dealbreaker') return { label: 'Deal-breaker!', face: 'meltdown' };
  if (result.mood === 'happy') return { label: 'Happy', face: 'happy' };
  if (result.mood === 'meh') return { label: 'Getting there', face: 'meh' };
  return { label: 'Not convinced yet', face: 'neutral' };
}

export function libraryHTML(state, client, game) {
  const items = game.kit.sections.map((sec) => {
    const count = state.sections.filter((s) => s.type === sec.id).length;
    const loved = (client.sectionsTheyLove || []).includes(sec.id);
    const label = `Add ${sec.name} section${count ? `, ${count} on the page` : ''}`;
    return `<li>
      <button type="button" class="section-tile${count ? ' is-on' : ''}" draggable="true" data-action="add-section" data-type="${esc(sec.id)}" aria-label="${esc(label)}">
        <span class="grip" aria-hidden="true">⋮⋮</span>
        <span class="tile-name">${esc(sec.name)}</span>
        ${loved ? '<em><span class="loved-long">Loves this</span><span class="loved-short" aria-hidden="true">♥</span></em>' : ''}
        ${count ? `<span class="tile-count" aria-hidden="true">${count}</span>` : ''}
        <span class="tile-mark" aria-hidden="true">+</span>
      </button>
    </li>`;
  }).join('');
  return `<div class="library-block">
    <h2>Sections</h2>
    <p class="library-hint"><span class="hint-mouse">Click or drag to add.</span><span class="hint-touch">Tap to add.</span> Reorder with ↑ ↓.</p>
    <ul class="library-list">${items}</ul>
  </div>`;
}

export function dockHTML(state, client, result) {
  const live = liveMood(state, result);
  return `<div class="dock-bubble" aria-live="polite">${state.comment ? `<p class="bubble">${esc(state.comment)}</p>` : ''}</div>
    <div class="dock-who">
      ${characterHTML(client.id, live.face, 'dock-art')}
      <div class="dock-meta">
        <strong>${esc(firstName(client))}</strong>
        <button type="button" class="text-btn" data-action="open-brief">Re-read the brief</button>
      </div>
    </div>`;
}

function panelBody(state, game) {
  if (state.tab === 'sections') return `<div class="sheet-only">${libraryHTML(state, game.clients.find((c) => c.id === state.clientId), game)}<button type="button" class="text-btn" data-action="open-brief">Re-read the brief</button></div>`;
  if (state.tab === 'type') {
    const heads = game.kit.headingFonts.map((f) => choice(
      state.heading === f.id,
      'heading',
      f.id,
      `<span class="font-sample" style="font-family:'${esc(f.family)}', serif; font-weight:${f.weight}">Aa</span>`,
      f.family,
    )).join('');
    const bodies = game.kit.bodyFonts.map((f) => choice(
      state.body === f.id,
      'body',
      f.id,
      `<span class="font-sample font-sample-sm" style="font-family:'${esc(f.family)}', serif">The quick brown fox</span>`,
      `${f.family}${f.readable ? '' : ' · hard to read'}`,
    )).join('');
    return `<h2>Type</h2><p>Fonts replace the wireframe type.</p><h3>Heading</h3><div class="choice-grid">${heads}</div><h3>Body</h3><div class="choice-grid">${bodies}</div>`;
  }
  if (state.tab === 'style') {
    const chips = game.kit.styles.map((s) => choice(
      state.style === s.id,
      'style',
      s.id,
      `<span class="style-mini" data-style="${esc(s.id)}" data-palette="${esc(state.palette || 'navy-ledger')}"><i></i><b>Aa</b></span>`,
      s.name,
    )).join('');
    return `<h2>Style</h2><p>Corners, borders and shadows replace the plain boxes.</p><div class="choice-grid">${chips}</div>`;
  }
  if (state.tab === 'images') {
    const chips = game.kit.pictures.map((p) => choice(
      state.picture === p.id,
      'picture',
      p.id,
      `<span class="pic-mini"><img src="assets/svg/pictures/${esc(p.id)}.svg" alt=""></span>`,
      p.name,
    )).join('');
    return `<h2>Images</h2><p>One picture is used across the page.</p><div class="choice-grid choice-grid-pics">${chips}</div>`;
  }
  if (state.tab === 'decor') {
    const decor = game.kit.heroDecor.map((d) => choice(state.heroDecor === d.id, 'heroDecor', d.id, `<span class="decor-mini" data-decor="${esc(d.id)}"></span>`, d.name)).join('');
    const patterns = game.kit.sectionPatterns.map((d) => choice(state.pattern === d.id, 'pattern', d.id, `<span class="decor-mini" data-decor="${esc(d.id)}"></span>`, d.name)).join('');
    return `<h2>Decoration</h2><h3>Hero decor</h3><div class="choice-grid">${decor}</div><h3>Section pattern</h3><div class="choice-grid">${patterns}</div>`;
  }
  const chips = game.kit.palettes.map((p) => choice(
    state.palette === p.id,
    'palette',
    p.id,
    `<span class="swatches" data-palette="${esc(p.id)}"><i style="background:var(--kit-bg)"></i><i style="background:var(--kit-accent-2)"></i><i style="background:var(--kit-accent)"></i><i style="background:var(--kit-text)"></i></span>`,
    p.name,
  )).join('');
  return `<h2>Colour palette</h2><p>Sections start as a wireframe. A palette paints them.</p><div class="choice-grid">${chips}</div>`;
}

function designKey(state) {
  return JSON.stringify({
    sections: state.sections,
    selectedSection: state.selectedSection,
    palette: state.palette,
    heading: state.heading,
    body: state.body,
    style: state.style,
    picture: state.picture,
    heroDecor: state.heroDecor,
    pattern: state.pattern,
    previewMode: state.previewMode,
  });
}

export function render(state, game, client) {
  const result = score(state, client, game);
  const who = firstName(client);
  const live = liveMood(state, result);
  const tabs = [['sections', 'Sections'], ...TABS].map(([id, label]) => {
    const on = state.tab === id;
    return `<button type="button" class="tab${on ? ' is-on' : ''}${id === 'sections' ? ' tab-sections' : ''}" data-action="set-tab" data-tab="${id}" aria-selected="${on}" role="tab">${label}</button>`;
  }).join('');
  return `<div class="screen screen-build">
    <header class="topbar build-bar">
      ${logo()}
      ${progress('build')}
      <div class="build-status">
        <div id="build-meter">${meterBlock(client, result, live.label)}</div>
        <div id="build-timer">${timerBlock(state.timeLeft, game.meta)}</div>
        <button type="button" class="btn btn-primary btn-send" data-action="send"><span class="send-long">Send to ${esc(who)}</span><span class="send-short">Send</span></button>
        ${muteButton(state.muted)}
      </div>
    </header>
    <div class="builder">
      <aside class="library" id="build-library" aria-label="Sections">${libraryHTML(state, client, game)}</aside>
      <div class="stage-col">
        <div class="build-tools" id="build-undo">
          <button type="button" class="btn btn-small" data-action="undo" ${state.canUndo ? '' : 'disabled'}>Undo</button>
          <button type="button" class="btn btn-small" data-action="redo" ${state.canRedo ? '' : 'disabled'}>Redo</button>
          <button type="button" class="btn btn-small" data-action="restart-design">Start over</button>
          <div class="seg preview-toggle" role="group" aria-label="Preview width">
            <button type="button" data-action="set-preview" data-preview="desktop" aria-pressed="${state.previewMode !== 'mobile'}">Desktop</button>
            <button type="button" data-action="set-preview" data-preview="mobile" aria-pressed="${state.previewMode === 'mobile'}">Mobile</button>
          </div>
        </div>
        <div class="section-bar" id="build-section-bar">${sectionBar(state, game)}</div>
        <div id="build-preview">${browserShell(state, client, renderSite(state, client, game))}</div>
      </div>
      <div class="client-dock${state.comment ? ' is-talking' : ''}" id="build-client">${dockHTML(state, client, result)}</div>
      <aside class="panel" id="build-panel" data-tab="${esc(state.tab)}" aria-label="Style options">
        <div class="tabs" role="tablist">${tabs}</div>
        <div class="panel-body" id="build-panel-body">${panelBody(state, game)}</div>
      </aside>
    </div>
  </div>`;
}

function focusKey(el) {
  if (!el?.dataset?.action) return null;
  const d = el.dataset;
  return `[data-action="${d.action}"]${d.dir ? `[data-dir="${d.dir}"]` : ''}${d.layout ? `[data-layout="${d.layout}"]` : ''}${d.columns ? `[data-columns="${d.columns}"]` : ''}`;
}

function paintDock(root, state, client, result) {
  const dock = root.querySelector('#build-client');
  if (!dock) return;
  dock.classList.toggle('is-talking', !!state.comment);
  const live = liveMood(state, result);
  const img = dock.querySelector('.char img');
  if (!img || img.dataset.mood !== live.face) {
    dock.innerHTML = dockHTML(state, client, result);
    return;
  }
  const slot = dock.querySelector('.dock-bubble');
  if (!slot) return;
  const bubble = slot.querySelector('.bubble');
  if (!state.comment) bubble?.remove();
  else if (bubble) bubble.textContent = state.comment;
  else {
    const p = document.createElement('p');
    p.className = 'bubble';
    p.textContent = state.comment;
    slot.append(p);
  }
}

export function sync(root, state, prev, game, client, history) {
  const changed = designKey(state) !== designKey(prev);
  if (state.timeLeft !== prev.timeLeft) {
    const timer = root.querySelector('#build-timer');
    if (timer) timer.innerHTML = timerBlock(state.timeLeft, game.meta);
  }
  if (changed) {
    const result = score(state, client, game);
    const meter = root.querySelector('#build-meter');
    if (meter) meter.innerHTML = meterBlock(client, result, liveMood(state, result).label);

    const active = document.activeElement;
    const preview = root.querySelector('#build-preview');
    const bar = root.querySelector('#build-section-bar');
    const library = root.querySelector('#build-library');
    const body = root.querySelector('#build-panel-body');
    const hadPreviewFocus = !!preview?.contains(active);
    const barKey = bar?.contains(active) ? focusKey(active) : null;
    const tileType = active?.closest?.('.section-tile')?.dataset.type || null;
    const tileHome = tileType ? (library?.contains(active) ? library : body) : null;

    if (preview) {
      const oldPage = preview.querySelector('.browser-page');
      const keepScroll = oldPage?.scrollTop || 0;
      preview.innerHTML = browserShell(state, client, renderSite(state, client, game));
      const page = preview.querySelector('.browser-page');
      if (page) page.scrollTop = keepScroll;
      const moved = state.selectedSection !== prev.selectedSection || state.sections.length !== prev.sections.length;
      const block = page?.querySelector('.block.is-selected');
      if (moved && page && block) {
        const top = block.getBoundingClientRect().top - page.getBoundingClientRect().top + page.scrollTop;
        page.scrollTo({ top: Math.max(0, top - 12), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      }
      if (hadPreviewFocus) block?.focus({ preventScroll: true });
    }
    if (bar) {
      bar.innerHTML = sectionBar(state, game);
      if (barKey) {
        const again = bar.querySelector(barKey);
        if (again && !again.disabled) again.focus();
        else (bar.querySelector('button:not(:disabled)') || preview?.querySelector('.block.is-selected'))?.focus();
      }
    }
    if (library) library.innerHTML = libraryHTML(state, client, game);
    if (state.tab === 'sections' && body) body.innerHTML = panelBody(state, game);
    if (tileType && tileHome) tileHome.querySelector(`.section-tile[data-type="${tileType}"]`)?.focus();

    paintDock(root, state, client, result);
    const undo = root.querySelector('#build-undo');
    if (undo) {
      undo.querySelector('[data-action="undo"]').disabled = !history.canUndo();
      undo.querySelector('[data-action="redo"]').disabled = !history.canRedo();
    }
  } else if (state.comment !== prev.comment) {
    paintDock(root, state, client, score(state, client, game));
  }
  if (state.tab !== prev.tab) {
    root.querySelectorAll('.tab').forEach((tab) => {
      const on = tab.dataset.tab === state.tab;
      tab.classList.toggle('is-on', on);
      tab.setAttribute('aria-selected', String(on));
    });
    const panel = root.querySelector('#build-panel');
    if (panel) panel.dataset.tab = state.tab;
    const body = root.querySelector('#build-panel-body');
    if (body) {
      body.innerHTML = panelBody(state, game);
      body.scrollTop = 0;
    }
  }
}

export function columnsFor(type, layout, game) {
  const meta = game.kit.sections.find((s) => s.id === type);
  return columnOptions(meta, layout);
}

export function bindDrag(root, handlers) {
  const onDrop = handlers.onDrop || handlers;
  const onDragStart = handlers.onDragStart || (() => {});
  root.addEventListener('dragstart', (e) => {
    const tile = e.target.closest('.section-tile');
    const block = e.target.closest('.block');
    if (!e.dataTransfer) return;
    if (tile) {
      e.dataTransfer.setData('application/x-section-type', tile.dataset.type);
      e.dataTransfer.effectAllowed = 'copy';
      onDragStart();
    } else if (block) {
      e.dataTransfer.setData('application/x-section-index', block.dataset.index);
      e.dataTransfer.effectAllowed = 'move';
      onDragStart();
    }
  });
  const clearMark = () => root.querySelectorAll('.is-drop-before, .is-drop-end').forEach((el) => el.classList.remove('is-drop-before', 'is-drop-end'));
  root.addEventListener('dragover', (e) => {
    const zone = e.target.closest('[data-dropzone], .block');
    if (!zone) return;
    e.preventDefault();
    clearMark();
    const target = e.target.closest('.block');
    if (target) target.classList.add('is-drop-before');
    else zone.classList.add('is-drop-end');
  });
  root.addEventListener('dragleave', (e) => {
    if (!root.contains(e.relatedTarget)) clearMark();
  });
  root.addEventListener('dragend', clearMark);
  root.addEventListener('drop', (e) => {
    const zone = e.target.closest('[data-dropzone], .block');
    if (!zone || !e.dataTransfer) return;
    e.preventDefault();
    clearMark();
    const type = e.dataTransfer.getData('application/x-section-type');
    const from = e.dataTransfer.getData('application/x-section-index');
    const target = e.target.closest('.block');
    onDrop({
      type,
      from: from === '' ? null : Number(from),
      targetIndex: target ? Number(target.dataset.index) : null,
    });
  });
}
