import { config } from '../config.js';
import { createStore, initialState } from './state.js';
import { score } from './scoring.js';
import { createAudio } from './audio.js';
import { createStats } from './stats.js';
import { createComments } from './comments.js';
import { clientById, onClientInk } from './dom.js';
import { defaultSection } from './site/render.js';
import { shareResult } from './share.js';
import * as attract from './screens/attract.js';
import * as start from './screens/start.js';
import * as howto from './screens/howto.js';
import * as pick from './screens/pick.js';
import * as brief from './screens/brief.js';
import * as build from './screens/build.js';
import * as timesup from './screens/timesup.js';
import * as verdict from './screens/verdict.js';
import * as learn from './screens/learn.js';

const screens = { attract, start, pick, brief, build, timesup, verdict, learn };
let game;
let store;
let audio;
let stats;
let comments;
let castIndex = 0;
let lastFocus = null;
let skipClick = false;
let dragBound = false;

function view(state) {
  return { ...state, canUndo: store.canUndo(), canRedo: store.canRedo() };
}

function currentClient(state = store.get()) {
  return clientById(game, state.clientId);
}

function bindMedia(root) {
  if (!root) return;
  root.querySelectorAll('.char img, .pic img, .pic-mini img').forEach((img) => {
    const fail = () => img.classList.add('is-broken');
    if (img.complete && img.naturalWidth === 0) fail();
    else img.addEventListener('error', fail, { once: true });
  });
}

function renderDialog(state) {
  const root = document.getElementById('dialog-root');
  const client = currentClient(state);
  if (state.howto) root.innerHTML = howto.render();
  else if (state.briefOpen && client) root.innerHTML = brief.reread(client);
  else root.innerHTML = '';
  const dialog = root.querySelector('[role="dialog"]');
  if (dialog) dialog.focus();
  document.getElementById('main').inert = !!(state.howto || state.briefOpen);
}

function paint(state) {
  document.body.dataset.screen = state.screen;
  document.body.dataset.client = state.clientId || '';
  const client = currentClient(state);
  document.body.dataset.ink = client ? onClientInk(client.color) : 'dark';
  document.querySelectorAll('#main [data-screen]').forEach((section) => {
    const on = section.dataset.screen === state.screen;
    section.hidden = !on;
    section.inert = !on;
    if (!on) return;
    section.innerHTML = screens[state.screen].render(view(state), game, client);
    bindMedia(section);
    screens[state.screen].mount?.(section, state, game, client);
  });
  renderDialog(state);
  const live = document.getElementById('live');
  if (state.screen === 'verdict' && state.result && client) {
    live.textContent = `${client.name}. ${state.result.points} out of ${state.result.max}. ${state.result.outcome.label}.`;
  }
}

function freshRound(screen, clientId, played) {
  const fresh = initialState(game.meta);
  fresh.screen = screen;
  fresh.clientId = clientId;
  fresh.played = played;
  fresh.muted = store.get().muted;
  comments.reset();
  store.reset(fresh);
}

function rememberDesign(prev) {
  const client = currentClient();
  if (client) comments.onDesign(prev, store.get(), client);
}

function addSection(type, index = null) {
  const prev = store.get();
  const section = defaultSection(type, game);
  const sections = prev.sections.slice();
  const at = index === null ? sections.length : index;
  sections.splice(at, 0, section);
  store.set({ sections, selectedSection: at }, { history: true });
  rememberDesign(prev);
  audio.play('build.drop');
  stats.send('section_changed', { action: 'add', section: type, layout: section.layout || '', columns: section.columns || '' });
}

function finish(auto) {
  const s = store.get();
  if (s.screen !== 'build') return;
  const client = currentClient(s);
  if (!client) return;
  const result = score(s, client, game);
  const elapsed = s.startedAt
    ? Math.min(game.meta.timerSeconds, Math.floor((Date.now() - s.startedAt) / 1000))
    : 0;
  store.set({
    result,
    elapsed,
    autoSent: !!auto,
    screen: auto ? 'timesup' : 'verdict',
    comment: null,
    timeLeft: auto ? 0 : s.timeLeft,
  });
  stats.send('website_sent', {
    client: client.id,
    score: result.points,
    outcome: result.outcome.id,
    timeLeft: auto ? 0 : s.timeLeft,
    autoSent: !!auto,
    dealBreakers: result.dealBreakers.join(','),
  });
}

function onDrop(info) {
  if (info.type) {
    addSection(info.type, info.targetIndex);
    return;
  }
  if (info.from === null || Number.isNaN(info.from)) return;
  const prev = store.get();
  const sections = prev.sections.slice();
  const [item] = sections.splice(info.from, 1);
  if (!item) return;
  let to = info.targetIndex === null ? sections.length : info.targetIndex;
  if (info.from < to) to -= 1;
  to = Math.max(0, Math.min(to, sections.length));
  sections.splice(to, 0, item);
  store.set({ sections, selectedSection: to }, { history: true });
  rememberDesign(prev);
  audio.play('build.slide');
  stats.send('section_changed', { action: 'reorder', section: item.type, layout: item.layout || '', columns: item.columns || '' });
}

function trapFocus(event) {
  const dialog = document.querySelector('[role="dialog"]');
  if (!dialog) return;
  const items = [...dialog.querySelectorAll('button, a, input, [tabindex]')].filter((el) => !el.disabled && el.tabIndex !== -1 || el === dialog);
  const focusable = [...dialog.querySelectorAll('button, a')].filter((el) => !el.disabled);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
  void items;
}

function openBrief(clientId) {
  const state = store.get();
  const id = clientId || state.clientId || game.clients[0].id;
  audio.play('ui.pick');
  stats.send('client_picked', { client: id });
  store.set({ screen: 'brief', clientId: id });
}

function onClick(event) {
  if (skipClick) {
    skipClick = false;
    return;
  }
  const btn = event.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  if ((action === 'close-howto' || action === 'close-brief') && event.target.closest('.modal') && event.target !== btn) return;
  const state = store.get();
  const client = currentClient(state);

  if (action === 'toggle-faq') {
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    if (btn.nextElementSibling) btn.nextElementSibling.hidden = open;
    return;
  }
  if (action === 'explore' || action === 'info-session') {
    stats.send('program_clicked', { program: btn.dataset.program, target: action === 'explore' ? 'explore' : 'info' });
    audio.play('ui.click');
    return;
  }

  if (action === 'go-home') {
    if (state.screen !== 'attract' || state.howto || state.briefOpen) {
      audio.play('ui.click');
      audio.stopAll();
      comments.reset();
      const fresh = initialState(game.meta);
      fresh.muted = state.muted;
      store.reset(fresh);
    }
    return;
  }

  if (action === 'toggle-mute') {
    const willMute = !audio.isMuted();
    if (willMute) audio.play('ui.toggle');
    audio.setMuted(willMute);
    store.set({ muted: willMute });
    if (!willMute) audio.play('ui.toggle');
    return;
  }

  audio.unlock();
  if (!['send', 'add-section', 'to-pick', 'to-build', 'surprise', 'select-client', 'undo', 'redo', 'share'].includes(action)) {
    audio.play('ui.click');
  }

  if (action === 'to-start') store.set({ screen: 'start' });
  else if (action === 'to-pick') {
    stats.send('game_started', {});
    audio.play('ui.start');
    store.set({ screen: 'pick', clientId: state.clientId || game.clients[0].id });
  } else if (action === 'open-howto') {
    lastFocus = document.activeElement;
    store.set({ howto: true });
  } else if (action === 'close-howto' || action === 'close-brief') {
    store.set({ howto: false, briefOpen: false });
    lastFocus?.focus?.();
  } else if (action === 'select-client') {
    openBrief(btn.dataset.id);
  } else if (action === 'surprise') {
    audio.play('ui.roulette');
    let pool = game.clients.filter((c) => !state.played.includes(c.id) && c.id !== state.clientId);
    if (!pool.length) pool = game.clients.filter((c) => c.id !== state.clientId);
    const pickClient = pool[Math.floor(Math.random() * pool.length)] || game.clients[0];
    openBrief(pickClient.id);
  } else if (action === 'play-brief' && client) {
    audio.say(`voice.${client.id}.brief`);
  } else if (action === 'to-build') {
    audio.play('ui.start');
    store.set({
      screen: 'build',
      startedAt: Date.now(),
      timeLeft: game.meta.timerSeconds,
      result: null,
      comment: null,
      tab: 'colour',
    });
  } else if (action === 'open-brief') store.set({ briefOpen: true });
  else if (action === 'add-section') addSection(btn.dataset.type);
  else if (action === 'select-section') store.set({ selectedSection: Number(btn.dataset.index) });
  else if (action === 'remove-section') {
    const prev = state;
    const index = state.selectedSection ?? 0;
    const sections = state.sections.filter((_, i) => i !== index);
    store.set({ sections, selectedSection: sections.length ? Math.min(index, sections.length - 1) : null }, { history: true });
    rememberDesign(prev);
    audio.play('build.remove');
    stats.send('section_changed', { action: 'remove', section: state.sections[index]?.type || '', layout: '', columns: '' });
  } else if (action === 'move-section') moveSection(Number(btn.dataset.dir));
  else if (action === 'set-layout') setLayout(btn.dataset.layout);
  else if (action === 'set-columns') setColumns(Number(btn.dataset.columns));
  else if (action === 'set-choice') setChoice(btn.dataset.key, btn.dataset.value);
  else if (action === 'set-tab') store.set({ tab: btn.dataset.tab });
  else if (action === 'set-preview') store.set({ previewMode: btn.dataset.preview });
  else if (action === 'undo') {
    const prev = state;
    if (store.undo()) {
      audio.play('ui.rewind');
      rememberDesign(prev);
    }
  } else if (action === 'redo') {
    const prev = state;
    if (store.redo()) {
      audio.play('ui.rewind');
      rememberDesign(prev);
    }
  } else if (action === 'restart-design') {
    const prev = state;
    store.set({
      sections: [],
      selectedSection: null,
      palette: null,
      heading: null,
      body: null,
      style: null,
      picture: null,
      heroDecor: 'none',
      pattern: 'none',
    }, { history: true });
    rememberDesign(prev);
    audio.play('ui.rewind');
  } else if (action === 'send') {
    audio.play('ui.send');
    finish(false);
  } else if (action === 'see-verdict') store.set({ screen: 'verdict' });
  else if (action === 'next-client' || action === 'play-again') {
    const played = state.played.includes(state.clientId) || !state.clientId
      ? state.played
      : [...state.played, state.clientId];
    const next = game.clients.find((c) => !played.includes(c.id)) || game.clients[0];
    freshRound('pick', next.id, action === 'play-again' ? played : played);
  } else if (action === 'to-learn') store.set({ screen: 'learn' });
  else if (action === 'share' && client && state.result) {
    shareResult({ game, client, result: state.result, elapsed: state.elapsed, stats });
  }
}

function moveSection(dir) {
  const prev = store.get();
  const index = prev.selectedSection;
  if (index === null || index === undefined) return;
  const to = index + dir;
  if (to < 0 || to >= prev.sections.length) return;
  const sections = prev.sections.slice();
  const [item] = sections.splice(index, 1);
  sections.splice(to, 0, item);
  store.set({ sections, selectedSection: to }, { history: true });
  rememberDesign(prev);
  audio.play('build.slide');
  stats.send('section_changed', { action: 'reorder', section: item.type, layout: item.layout || '', columns: item.columns || '' });
}

function setLayout(layout) {
  const prev = store.get();
  const index = prev.selectedSection;
  if (index === null) return;
  const sections = prev.sections.map((section, i) => {
    if (i !== index) return section;
    const options = build.columnsFor(section.type, layout, game);
    const columns = options.includes(Number(section.columns)) ? section.columns : (options[0] ?? null);
    return { ...section, layout, columns };
  });
  store.set({ sections }, { history: true });
  rememberDesign(prev);
  stats.send('section_changed', { action: 'layout', section: sections[index].type, layout, columns: sections[index].columns || '' });
}

function setColumns(columns) {
  const prev = store.get();
  const index = prev.selectedSection;
  if (index === null) return;
  const sections = prev.sections.map((section, i) => (i === index ? { ...section, columns } : section));
  store.set({ sections }, { history: true });
  rememberDesign(prev);
  stats.send('section_changed', { action: 'columns', section: sections[index].type, layout: sections[index].layout || '', columns });
}

function setChoice(key, value) {
  const prev = store.get();
  if (prev[key] === value) return;
  store.set({ [key]: value }, { history: true });
  rememberDesign(prev);
  stats.send('choice_changed', { category: key, value });
  audio.play('ui.pick');
}

function onKey(event) {
  const state = store.get();
  if (event.key === 'Escape' && (state.howto || state.briefOpen)) {
    store.set({ howto: false, briefOpen: false });
    lastFocus?.focus?.();
    return;
  }
  if ((state.howto || state.briefOpen) && event.key === 'Tab') {
    trapFocus(event);
    return;
  }
  if (state.screen === 'pick' && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
    event.preventDefault();
    const ids = game.clients.map((c) => c.id);
    const index = Math.max(0, ids.indexOf(state.clientId));
    const next = ids[(index + (event.key === 'ArrowRight' ? 1 : -1) + ids.length) % ids.length];
    audio.play('ui.sticker');
    store.set({ clientId: next });
  } else if (state.screen === 'pick' && event.key === 'Enter') {
    const action = event.target.closest?.('[data-action]')?.dataset.action;
    if (action === 'select-client') return;
    if (!action) {
      event.preventDefault();
      openBrief(state.clientId);
    }
  } else if (state.screen === 'build' && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
    if (event.target.closest?.('input, textarea')) return;
    if (state.selectedSection === null) return;
    event.preventDefault();
    moveSection(event.key === 'ArrowUp' ? -1 : 1);
  } else if ((state.screen === 'attract') && (event.key === 'Enter' || event.key === ' ')) {
    if (event.target.closest?.('[data-action="toggle-mute"]')) return;
    event.preventDefault();
    audio.unlock();
    store.set({ screen: 'start' });
  }
}

function effects(next, prev) {
  const client = currentClient(next);
  if (next.screen === 'brief' && prev.screen !== 'brief' && client) audio.say(`voice.${client.id}.brief`);
    if (next.screen === 'timesup' && prev.screen !== 'timesup') {
      audio.play('deadline.gong');
      audio.say('voice.deadline.1');
    }
  if (next.screen === 'verdict' && prev.screen !== 'verdict' && client && next.result) {
    audio.stopMusic();
    audio.play(`verdict.${next.result.outcome.id}`);
    audio.say(`voice.${client.id}.${next.result.outcome.id}-1`);
  }
  if (next.screen === 'build' && prev.screen === 'build' && next.timeLeft !== prev.timeLeft && client) {
    const left = next.timeLeft;
    const meta = game.meta;
    if (prev.timeLeft > meta.clientHurryCommentAtSeconds && left <= meta.clientHurryCommentAtSeconds) {
      comments.push(client.lines.hurry, `voice.${client.id}.hurry`);
    }
    if (left > 0 && left <= meta.panicAtSeconds) audio.play('timer.heartbeat');
    else if (left > meta.panicAtSeconds && left <= meta.hurryAtSeconds) audio.play('timer.tick');
  }
  if (next.screen === 'attract') audio.stopMusic();
  else if (next.screen === 'build') {
    audio.loop(next.timeLeft <= game.meta.hurryAtSeconds ? 'music.build-fast' : 'music.build');
  } else if (next.screen === 'timesup' || next.screen === 'verdict') audio.stopMusic();
  else audio.loop('music.lobby');
}

function boot(data, cues) {
  game = data;
  document.title = game.meta.title;
  const seed = initialState(game.meta);
  try { seed.muted = sessionStorage.getItem('w5-muted') === '1'; } catch { /* private mode */ }
  store = createStore(seed);
  audio = createAudio(cues.cues, cues.mixing);
  if (seed.muted) audio.setMuted(true);
  stats = createStats(config.STATS_URL);
  comments = createComments({ store, game, audio });

  store.subscribe((next, prev) => {
    if (next.screen === 'build' && prev.screen === 'build' && next.timeLeft <= 0 && prev.timeLeft > 0) {
      finish(true);
      return;
    }
    const structural = next.screen !== prev.screen || next.howto !== prev.howto || next.briefOpen !== prev.briefOpen
      || (next.screen === 'pick' && next.clientId !== prev.clientId);
    if (structural) {
      const row = document.querySelector('.card-row');
      const left = row?.scrollLeft || 0;
      paint(next);
      const nextRow = document.querySelector('.card-row');
      if (nextRow) nextRow.scrollLeft = left;
    } else if (next.screen === 'build') {
      const node = document.querySelector('[data-screen="build"]');
      build.sync(node, next, prev, game, currentClient(next), store);
      bindMedia(node);
    }
    if (next.muted !== prev.muted) {
      document.querySelectorAll('[data-action="toggle-mute"]').forEach((btn) => {
        btn.setAttribute('aria-pressed', String(next.muted));
        btn.setAttribute('aria-label', next.muted ? 'Unmute sound' : 'Mute sound');
      });
    }
    effects(next, prev);
  });

  document.getElementById('main').addEventListener('click', onClick);
  document.getElementById('dialog-root').addEventListener('click', onClick);
  document.addEventListener('keydown', onKey);

  const buildRoot = document.querySelector('[data-screen="build"]');
  if (!dragBound) {
    build.bindDrag(buildRoot, {
      onDrop,
      onDragStart() { skipClick = true; },
    });
    dragBound = true;
  }

  let idle;
  const bump = () => {
    window.clearTimeout(idle);
    idle = window.setTimeout(() => {
      if (store.get().screen === 'attract') {
        bump();
        return;
      }
      audio.stopAll();
      audio.resetMute();
      comments.reset();
      const fresh = initialState(game.meta);
      fresh.muted = false;
      store.reset(fresh);
    }, game.meta.idleResetSeconds * 1000);
  };
  ['pointerdown', 'keydown', 'touchstart'].forEach((type) => {
    document.addEventListener(type, bump, { passive: true });
  });
  bump();

  window.setInterval(() => {
    const state = store.get();
    if (state.screen !== 'build' || !state.startedAt) return;
    const left = Math.max(0, game.meta.timerSeconds - Math.floor((Date.now() - state.startedAt) / 1000));
    if (left !== state.timeLeft) store.set({ timeLeft: left });
  }, 250);

  window.setInterval(() => {
    const state = store.get();
    if (state.screen !== 'attract' && state.screen !== 'start') return;
    castIndex = (castIndex + 1) % game.clients.length;
    const { client, line } = attract.lineFor(game, castIndex);
    document.querySelectorAll('.cast-person').forEach((person) => {
      const on = person.dataset.id === client.id;
      person.classList.toggle('is-speaking', on);
      let bubble = person.querySelector('.bubble');
      if (on) {
        if (!bubble) {
          person.insertAdjacentHTML('afterbegin', '<p class="bubble"></p>');
          bubble = person.querySelector('.bubble');
        }
        bubble.textContent = line;
      } else if (bubble) bubble.remove();
    });
    document.getElementById('live').textContent = `${client.name}. ${line}`;
  }, 3500);

  paint(store.get());
}

const gameData = await fetch('data/game-data.json').then((res) => res.json());
const soundData = await fetch('data/sound-cues.json').then((res) => res.json());
boot(gameData, soundData);
