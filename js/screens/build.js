import { esc, firstName, prefersReducedMotion } from '../dom.js';
import { logo, muteButton, progress, meterBlock, timerBlock } from '../chrome.js';
import { characterHTML } from '../characters.js';
import { score } from '../scoring.js';
import { browserShell, renderSite, columnOptions } from '../site/render.js';

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

export function libraryHTML(state, client, game) {
  const items = game.kit.sections.map((sec) => {
    const on = state.sections.some((s) => s.type === sec.id);
    const loved = (client.sectionsTheyLove || []).includes(sec.id);
    return `<li>
      <button type="button" class="section-tile${on ? ' is-on' : ''}" draggable="true" data-action="add-section" data-type="${esc(sec.id)}">
        <span class="grip" aria-hidden="true">⋮⋮</span>
        <span>${esc(sec.name)}</span>
        ${loved ? '<em>Loves this</em>' : ''}
        <span class="tile-mark" aria-hidden="true">${on ? '✓' : '+'}</span>
      </button>
    </li>`;
  }).join('');
  return `<div class="library-block">
    <h2>Sections</h2>
    <p>Drag onto the page. Change layout and columns on the selected section.</p>
    <ul class="library-list">${items}</ul>
    <button type="button" class="text-btn" data-action="open-brief">Re-read the brief</button>
  </div>`;
}

function panelBody(state, game) {
  if (state.tab === 'sections') return `<div class="sheet-only">${libraryHTML(state, game.clients.find((c) => c.id === state.clientId), game)}</div>`;
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
    return `<h2>Type</h2><h3>Heading</h3><div class="choice-grid">${heads}</div><h3>Body</h3><div class="choice-grid">${bodies}</div>`;
  }
  if (state.tab === 'style') {
    const chips = game.kit.styles.map((s) => choice(
      state.style === s.id,
      'style',
      s.id,
      `<span class="style-mini" data-style="${esc(s.id)}" data-palette="${esc(state.palette || 'navy-ledger')}"><i></i><b>Aa</b></span>`,
      s.name,
    )).join('');
    return `<h2>Style</h2><p>Corners, borders and shadows update at once.</p><div class="choice-grid">${chips}</div>`;
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
  return `<h2>Colour palette</h2><p>Pick the mood. Every section updates at once.</p><div class="choice-grid">${chips}</div>`;
}

export function render(state, game, client) {
  const result = score(state, client, game);
  const who = firstName(client);
  const tabs = [['sections', 'Sections'], ...TABS].map(([id, label]) => {
    const on = state.tab === id;
    return `<button type="button" class="tab${on ? ' is-on' : ''}${id === 'sections' ? ' tab-sections' : ''}" data-action="set-tab" data-tab="${id}" aria-selected="${on}" role="tab">${label}</button>`;
  }).join('');
  return `<div class="screen screen-build">
    <header class="topbar build-bar">
      ${logo()}
      ${progress('build')}
      <div class="build-status">
        <div id="build-meter">${meterBlock(client, result)}</div>
        <div id="build-timer">${timerBlock(state.timeLeft, game.meta)}</div>
        <button type="button" class="btn btn-primary" data-action="send"><span class="send-long">Send to ${esc(who)}</span><span class="send-short">Send</span></button>
        ${muteButton(state.muted)}
      </div>
    </header>
    <div class="builder">
      <aside class="library" id="build-library">${libraryHTML(state, client, game)}</aside>
      <div class="workspace">
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
        <div id="build-preview">${browserShell(state, client, renderSite(state, client, game))}</div>
        <div id="build-peek" class="peek${state.comment ? ' is-up' : ''}">
          ${characterHTML(client.id, result.mood === 'dealbreaker' ? 'meltdown' : result.mood === 'happy' ? 'happy' : result.mood === 'meh' ? 'meh' : 'neutral', 'peek-art')}
          ${state.comment ? `<p class="bubble">${esc(state.comment)}</p>` : ''}
        </div>
      </div>
      <aside class="panel" id="build-panel" data-tab="${esc(state.tab)}">
        <div class="tabs" role="tablist">${tabs}</div>
        <div class="panel-body" id="build-panel-body">${panelBody(state, game)}</div>
      </aside>
      </div>
    </div>
  </div>`;
}

export function sync(root, state, prev, game, client, history) {
  const design = JSON.stringify({
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
  const prevDesign = JSON.stringify({
    sections: prev.sections,
    selectedSection: prev.selectedSection,
    palette: prev.palette,
    heading: prev.heading,
    body: prev.body,
    style: prev.style,
    picture: prev.picture,
    heroDecor: prev.heroDecor,
    pattern: prev.pattern,
    previewMode: prev.previewMode,
  });
  if (state.timeLeft !== prev.timeLeft) {
    const timer = root.querySelector('#build-timer');
    if (timer) timer.innerHTML = timerBlock(state.timeLeft, game.meta);
  }
  if (design !== prevDesign) {
    const result = score(state, client, game);
    const meter = root.querySelector('#build-meter');
    if (meter) meter.innerHTML = meterBlock(client, result);
    const preview = root.querySelector('#build-preview');
    if (preview) {
      preview.innerHTML = browserShell(state, client, renderSite(state, client, game));
      const moved = state.selectedSection !== prev.selectedSection || state.sections.length !== prev.sections.length;
      const page = preview.querySelector('.browser-page');
      const block = page?.querySelector('.block.is-selected');
      if (moved && page && block) {
        const top = block.getBoundingClientRect().top - page.getBoundingClientRect().top + page.scrollTop;
        page.scrollTo({ top: Math.max(0, top - 12), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      }
    }
    root.querySelectorAll('.library').forEach((node) => {
      if (node.id === 'build-library') node.innerHTML = libraryHTML(state, client, game);
    });
    const peek = root.querySelector('#build-peek');
    if (peek) {
      const face = result.mood === 'dealbreaker' ? 'meltdown' : result.mood === 'happy' ? 'happy' : result.mood === 'meh' ? 'meh' : 'neutral';
      peek.classList.toggle('is-up', !!state.comment);
      peek.innerHTML = `${characterHTML(client.id, face, 'peek-art')}${state.comment ? `<p class="bubble">${esc(state.comment)}</p>` : ''}`;
    }
    const undo = root.querySelector('#build-undo');
    if (undo) {
      undo.querySelector('[data-action="undo"]').disabled = !history.canUndo();
      undo.querySelector('[data-action="redo"]').disabled = !history.canRedo();
    }
    if (state.tab === 'sections') {
      const body = root.querySelector('#build-panel-body');
      if (body) body.innerHTML = panelBody(state, game);
    }
  }
  if (state.comment !== prev.comment) {
    const result = score(state, client, game);
    const peek = root.querySelector('#build-peek');
    if (peek) {
      const face = result.mood === 'dealbreaker' ? 'meltdown' : result.mood === 'happy' ? 'happy' : result.mood === 'meh' ? 'meh' : 'neutral';
      peek.classList.toggle('is-up', !!state.comment);
      const bubble = peek.querySelector('.bubble');
      if (state.comment) {
        if (bubble) bubble.textContent = state.comment;
        else peek.insertAdjacentHTML('beforeend', `<p class="bubble"></p>`);
        const next = peek.querySelector('.bubble');
        if (next) next.textContent = state.comment;
      } else bubble?.remove();
      const img = peek.querySelector('img');
      if (img && img.dataset.mood !== face) {
        peek.querySelector('.char')?.replaceWith(document.createRange().createContextualFragment(characterHTML(client.id, face, 'peek-art')).firstElementChild);
      }
    }
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
    if (body) body.innerHTML = panelBody(state, game);
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
  root.addEventListener('dragover', (e) => {
    if (e.target.closest('[data-dropzone], .block')) e.preventDefault();
  });
  root.addEventListener('drop', (e) => {
    const zone = e.target.closest('[data-dropzone], .block');
    if (!zone || !e.dataTransfer) return;
    e.preventDefault();
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
