const DESIGN_KEYS = [
  'sections', 'selectedSection', 'palette', 'heading', 'body', 'style',
  'picture', 'heroDecor', 'pattern',
];

export function initialState(meta) {
  return {
    screen: 'attract',
    clientId: null,
    sections: [],
    selectedSection: null,
    palette: null,
    heading: null,
    body: null,
    style: null,
    picture: null,
    heroDecor: 'none',
    pattern: 'none',
    tab: 'colour',
    previewMode: 'desktop',
    timeLeft: meta?.timerSeconds ?? 300,
    startedAt: null,
    autoSent: false,
    played: [],
    result: null,
    elapsed: 0,
    howto: false,
    briefOpen: false,
    comment: null,
    saidHurry: false,
  };
}

function designSnapshot(state) {
  return {
    sections: structuredClone(state.sections),
    selectedSection: state.selectedSection,
    palette: state.palette,
    heading: state.heading,
    body: state.body,
    style: state.style,
    picture: state.picture,
    heroDecor: state.heroDecor,
    pattern: state.pattern,
  };
}

export function createStore(initial) {
  let state = structuredClone(initial);
  const listeners = new Set();
  const history = [];
  let future = [];

  function emit(prev) {
    listeners.forEach((fn) => fn(state, prev));
  }

  return {
    get: () => state,
    set(partial, opts = {}) {
      const prev = state;
      const patch = typeof partial === 'function' ? partial(state) : partial;
      if (opts.history) {
        history.push(designSnapshot(prev));
        if (history.length > 100) history.shift();
        future = [];
      }
      state = { ...prev, ...patch };
      emit(prev);
    },
    undo() {
      const snap = history.pop();
      if (!snap) return false;
      future.push(designSnapshot(state));
      const prev = state;
      state = { ...state, ...snap };
      emit(prev);
      return true;
    },
    redo() {
      const snap = future.pop();
      if (!snap) return false;
      history.push(designSnapshot(state));
      const prev = state;
      state = { ...state, ...snap };
      emit(prev);
      return true;
    },
    canUndo: () => history.length > 0,
    canRedo: () => future.length > 0,
    reset(next) {
      history.length = 0;
      future = [];
      const prev = state;
      state = structuredClone(next);
      emit(prev);
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

export { DESIGN_KEYS };
