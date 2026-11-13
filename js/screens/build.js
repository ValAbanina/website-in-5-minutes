import { esc, firstName, prefersReducedMotion } from '../dom.js';
import { logo, muteButton, progress, meterBlock, timerBlock } from '../chrome.js';
import { characterHTML } from '../characters.js';
import { score } from '../scoring.js';
import { browserShell, renderSite, columnOptions, sectionBar, fitOverview } from '../site/render.js';

const TABS = [
  ['colour', 'Colour'],
  ['type', 'Type'],
  ['style', 'Style'],
  ['images', 'Images'],
  ['decor', 'Decor'],
];

/** Small line icons for the tool row on phones and tablets. */
const ICONS = {
  sections: '<rect x="4" y="4" width="16" height="4" rx="1"/><rect x="4" y="10" width="16" height="4" rx="1"/><rect x="4" y="16" width="16" height="4" rx="1"/>',
  colour: '<path d="M12 3a9 9 0 0 0 0 18c1.4 0 2-1 2-2s-1-1.6-1-2.6S13.8 15 15 15h2a4 4 0 0 0 4-4c0-4.4-4-8-9-8z"/><circle cx="7.5" cy="11" r="1.3"/><circle cx="10.5" cy="7" r="1.3"/><circle cx="15.5" cy="8" r="1.3"/>',
  type: '<path d="M3 19 8 5h1l5 14M5 14h7"/><path d="M15 12.5c.6-1 1.6-1.5 2.8-1.5 1.7 0 2.7 1 2.7 2.7V19M20.5 15.5c-3.5-.3-5.5.4-5.5 2 0 1 .8 1.7 2 1.7 1.8 0 3.5-1.4 3.5-3.2"/>',
  style: '<rect x="4" y="4" width="16" height="16" rx="5"/><path d="M8 15h8"/>',
  images: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 16 5-5 4 4 3-3 6 6"/><circle cx="16" cy="9" r="1.5"/>',
  decor: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>',
  whole: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/><rect x="8" y="8" width="8" height="8" rx="1"/>',
};

function icon(name) {
  return `<svg class="ico" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}

/** Resting heights of the options panel on phones: a peek row, half the screen, or nearly all of it. */
const SNAPS = ['peek', 'half', 'full'];
const SNAP_WORDS = { peek: 'small', half: 'half height', full: 'full height' };
let sheetSnap = 'peek';

function grabberLabel() {
  return `Options panel is ${SNAP_WORDS[sheetSnap]}. Tap to resize, or drag.`;
}

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
  if (state.tab === 'sections') {
    return `<div class="sheet-only">${libraryHTML(state, game.clients.find((c) => c.id === state.clientId), game)}
      <div class="sheet-extras">
        <button type="button" class="text-btn" data-action="open-brief">Re-read the brief</button>
        <button type="button" class="text-btn" data-action="restart-design">Start over</button>
      </div>
    </div>`;
  }
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
      `<span class="pic-mini"><img src="assets/svg/pictures/${esc(p.id)}.svg" alt=""><span>${esc(p.kind === 'photo' ? 'Photo' : 'Picture')}</span></span>`,
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
    overview: state.overview,
  });
}

export function render(state, game, client) {
  const result = score(state, client, game);
  const who = firstName(client);
  const live = liveMood(state, result);
  const tabs = [['sections', 'Sections'], ...TABS].map(([id, label]) => {
    const on = state.tab === id;
    return `<button type="button" class="tab${on ? ' is-on' : ''}${id === 'sections' ? ' tab-sections' : ''}" data-action="set-tab" data-tab="${id}" aria-selected="${on}" role="tab">${icon(id)}<span class="tab-l">${label}</span></button>`;
  }).join('');
  return `<div class="screen screen-build">
    <header class="topbar build-bar">
      ${logo()}
      ${progress('build')}
      <div class="build-status">
        <div id="build-meter">${meterBlock(client, result, live.label)}</div>
        <div id="build-timer">${timerBlock(state.timeLeft, game.meta)}</div>
        <span class="bar-history">
          <button type="button" class="icon-btn icon-btn-plain" data-action="undo" aria-label="Undo" ${state.canUndo ? '' : 'disabled'}>${icon('undo')}</button>
          <button type="button" class="icon-btn icon-btn-plain bar-redo" data-action="redo" aria-label="Redo" ${state.canRedo ? '' : 'disabled'}>${icon('redo')}</button>
        </span>
        ${muteButton(state.muted)}
        <button type="button" class="btn btn-primary btn-send" data-action="send"><span class="send-long">Send to ${esc(who)}</span><span class="send-short">Send</span></button>
      </div>
    </header>
    <div class="builder">
      <aside class="library" id="build-library" aria-label="Sections">${libraryHTML(state, client, game)}</aside>
      <div class="stage-col">
        <div class="build-tools" id="build-undo">
          <button type="button" class="btn btn-small" data-action="undo" ${state.canUndo ? '' : 'disabled'}>Undo</button>
          <button type="button" class="btn btn-small" data-action="redo" ${state.canRedo ? '' : 'disabled'}>Redo</button>
          <button type="button" class="btn btn-small" data-action="restart-design">Start over</button>
        </div>
        <div class="section-bar" id="build-section-bar">${sectionBar(state, game)}</div>
        <div class="preview-wrap">
          <div id="build-preview">${browserShell(state, client, renderSite(state, client, game))}</div>
          <div class="preview-float">
            <button type="button" class="float-btn" data-action="toggle-overview" aria-pressed="${!!state.overview}">${icon('whole')}<span>Whole page</span></button>
            <div class="seg preview-toggle" role="group" aria-label="Preview width">
              <button type="button" data-action="set-preview" data-preview="desktop" aria-pressed="${state.previewMode !== 'mobile'}">Desktop</button>
              <button type="button" data-action="set-preview" data-preview="mobile" aria-pressed="${state.previewMode === 'mobile'}">Mobile</button>
            </div>
          </div>
        </div>
      </div>
      <div class="client-dock${state.comment ? ' is-talking' : ''}" id="build-client">${dockHTML(state, client, result)}</div>
      <aside class="panel" id="build-panel" data-tab="${esc(state.tab)}" data-snap="${sheetSnap}" aria-label="Style options">
        <button type="button" class="sheet-grabber" data-sheet-grabber aria-label="${grabberLabel()}"><span aria-hidden="true"></span></button>
        <div class="tabs" role="tablist">${tabs}</div>
        <div class="panel-body" id="build-panel-body">${panelBody(state, game)}</div>
      </aside>
    </div>
  </div>`;
}

/** Re-fit the whole-page view, e.g. after a resize or once pictures have loaded. */
export function refit(root, state) {
  if (!state.overview) return;
  fitOverview(root?.querySelector('.browser-page.is-overview'), state.previewMode === 'mobile');
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
      if (state.overview) fitOverview(page, state.previewMode === 'mobile');
      else if (page && !prev.overview) page.scrollTop = keepScroll;
      const moved = state.selectedSection !== prev.selectedSection || state.sections.length !== prev.sections.length;
      const block = page?.querySelector('.block.is-selected');
      if (moved && page && block && !state.overview) {
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
    root.querySelectorAll('[data-action="undo"]').forEach((btn) => { btn.disabled = !history.canUndo(); });
    root.querySelectorAll('[data-action="redo"]').forEach((btn) => { btn.disabled = !history.canRedo(); });
    const whole = root.querySelector('[data-action="toggle-overview"]');
    if (whole) whole.setAttribute('aria-pressed', String(!!state.overview));
    root.querySelectorAll('.preview-toggle button').forEach((btn) => {
      btn.setAttribute('aria-pressed', String((btn.dataset.preview === 'mobile') === (state.previewMode === 'mobile')));
    });
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

/** Phones in portrait get the resizable bottom panel; everything else keeps a fixed panel. */
export const COMPACT_QUERY = '(max-width: 743px) and (orientation: portrait)';

/**
 * The options panel on phones rests at three heights. Tap the handle to step through them,
 * or drag it and let go near the height you want.
 */
export function bindSheet(root) {
  let drag = null;
  let skipClick = false;
  const panelOf = () => root.querySelector('#build-panel');
  const compact = () => window.matchMedia(COMPACT_QUERY).matches;

  function setSnap(name, panel = panelOf()) {
    sheetSnap = name;
    if (!panel) return;
    panel.dataset.snap = name;
    panel.style.height = '';
    panel.querySelector('[data-sheet-grabber]')?.setAttribute('aria-label', grabberLabel());
    const body = panel.querySelector('.panel-body');
    if (body) { body.scrollTop = 0; body.scrollLeft = 0; }
  }

  root.addEventListener('pointerdown', (e) => {
    const grabber = e.target.closest('[data-sheet-grabber]');
    if (!grabber || !compact()) return;
    const panel = panelOf();
    drag = { y: e.clientY, h: panel.offsetHeight, moved: false, id: e.pointerId };
    grabber.setPointerCapture?.(e.pointerId);
    panel.classList.add('is-dragging');
  });
  root.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dy = e.clientY - drag.y;
    if (Math.abs(dy) > 6) drag.moved = true;
    if (!drag.moved) return;
    const max = window.innerHeight - 96;
    panelOf().style.height = `${Math.max(140, Math.min(max, drag.h - dy))}px`;
  });
  const end = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const panel = panelOf();
    const { moved } = drag;
    drag = null;
    if (!moved) {
      panel.classList.remove('is-dragging');
      return;
    }
    skipClick = true;
    const current = panel.offsetHeight;
    const inline = panel.style.height;
    let best = sheetSnap;
    let bestGap = Infinity;
    SNAPS.forEach((name) => {
      panel.style.height = '';
      panel.dataset.snap = name;
      const gap = Math.abs(panel.offsetHeight - current);
      if (gap < bestGap) { bestGap = gap; best = name; }
    });
    panel.dataset.snap = sheetSnap;
    panel.style.height = inline;
    void panel.offsetHeight;
    panel.classList.remove('is-dragging');
    setSnap(best, panel);
  };
  root.addEventListener('pointerup', end);
  root.addEventListener('pointercancel', end);
  root.addEventListener('click', (e) => {
    if (!e.target.closest('[data-sheet-grabber]')) return;
    if (skipClick) { skipClick = false; return; }
    const next = SNAPS[(SNAPS.indexOf(sheetSnap) + 1) % SNAPS.length];
    setSnap(next);
  });

  return {
    /** Make room to see the website again, e.g. after picking a section to edit. */
    peek() { if (compact() && sheetSnap !== 'peek') setSnap('peek'); },
  };
}

/**
 * Touch screens: press and hold a section in the preview, then drag it up or down to move it.
 * A quick swipe still scrolls the page as normal.
 */
export function bindTouchReorder(root, { onDrop, onStart }) {
  let press = null;
  let lift = null;
  let frame = 0;

  const clearMarks = () => root.querySelectorAll('.is-drop-before, .is-drop-after, .is-drop-end')
    .forEach((el) => el.classList.remove('is-drop-before', 'is-drop-after', 'is-drop-end'));

  function mark(x, y) {
    clearMarks();
    const el = document.elementFromPoint(x, y);
    const block = el?.closest?.('.browser-page .block');
    if (!block || block === lift.block) {
      lift.targetIndex = block === lift.block ? lift.from : lift.targetIndex;
      return;
    }
    const box = block.getBoundingClientRect();
    const index = Number(block.dataset.index);
    const after = y > box.top + box.height / 2;
    block.classList.add(after ? 'is-drop-after' : 'is-drop-before');
    lift.targetIndex = after ? index + 1 : index;
  }

  function scrollLoop() {
    if (!lift) return;
    const box = lift.page.getBoundingClientRect();
    const edge = 56;
    let step = 0;
    if (lift.y < box.top + edge) step = -10;
    else if (lift.y > box.bottom - edge) step = 10;
    if (step) {
      lift.page.scrollTop += step;
      mark(lift.x, lift.y);
    }
    frame = requestAnimationFrame(scrollLoop);
  }

  function cancelPress() {
    if (press) window.clearTimeout(press.timer);
    press = null;
  }

  root.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) { cancelPress(); return; }
    const block = e.target.closest('.browser-page:not(.is-overview) .block');
    if (!block) return;
    const t = e.touches[0];
    press = { x: t.clientX, y: t.clientY, block };
    press.timer = window.setTimeout(() => {
      const page = block.closest('.browser-page');
      lift = { from: Number(block.dataset.index), block, page, targetIndex: Number(block.dataset.index), x: press.x, y: press.y };
      press = null;
      block.classList.add('is-lifting');
      document.body.classList.add('is-reordering');
      navigator.vibrate?.(12);
      onStart?.();
      frame = requestAnimationFrame(scrollLoop);
    }, 450);
  }, { passive: true });

  root.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    if (press && Math.hypot(t.clientX - press.x, t.clientY - press.y) > 10) cancelPress();
    if (!lift) return;
    e.preventDefault();
    lift.x = t.clientX;
    lift.y = t.clientY;
    mark(lift.x, lift.y);
  }, { passive: false });

  const finish = (drop) => {
    cancelPress();
    if (!lift) return;
    cancelAnimationFrame(frame);
    const { from, targetIndex, block } = lift;
    lift = null;
    clearMarks();
    block.classList.remove('is-lifting');
    document.body.classList.remove('is-reordering');
    if (drop && targetIndex !== from && targetIndex !== from + 1) onDrop({ type: '', from, targetIndex });
  };
  root.addEventListener('touchend', () => finish(true));
  root.addEventListener('touchcancel', () => finish(false));
  root.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.browser-page .block')) e.preventDefault();
  });
}
