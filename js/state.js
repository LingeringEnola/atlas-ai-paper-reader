const listeners = new Map();

export const state = {
  pdf: null,
  docId: null,
  docName: '',
  numPages: 0,
  baseWidth: 0,
  baseHeight: 0,
  currentPage: 1,
  scale: 1,
  fitWidth: true,
  mode: 'page',
  leftTab: 'toc',
  rightTab: 'review',
  toc: [],
  tocZh: null,
  review: null,
};

export function on(evt, fn) {
  if (!listeners.has(evt)) listeners.set(evt, new Set());
  listeners.get(evt).add(fn);
  return () => listeners.get(evt).delete(fn);
}

export function emit(evt, data) {
  const set = listeners.get(evt);
  if (set) for (const fn of set) fn(data);
}

export function set(patch, evt) {
  Object.assign(state, patch);
  if (evt) emit(evt, state);
}
