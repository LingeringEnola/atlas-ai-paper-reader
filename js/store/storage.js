const PREFIX = 'atlas:';
export const SAMPLE_DOC_ID = 'sample-paper-v1';
const LIST_LIMIT = 200;

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(key, val) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(val));
    return true;
  } catch {
    return false;
  }
}

function listOps(kind) {
  return {
    all: () => read(kind, []),
    forDoc: (docId) => read(kind, []).filter((x) => x.docId === docId),
    add: (item) => {
      const list = read(kind, []);
      list.unshift(item);
      if (list.length > LIST_LIMIT) list.length = LIST_LIMIT;
      return write(kind, list);
    },
    update: (id, patch) => {
      const list = read(kind, []);
      const hit = list.find((x) => x.id === id);
      if (hit) Object.assign(hit, patch);
      return write(kind, list);
    },
    remove: (id) => write(kind, read(kind, []).filter((x) => x.id !== id)),
  };
}

const flashcardOps = listOps('flashcards');
const noteOps = listOps('notes');

export const store = {
  getSettings: () => read('settings', { apiBaseUrl: '', apiKey: '', model: '', stream: true }),
  setSettings: (s) => write('settings', s),

  getReview: (docId) => read(`doc:${docId}:review`, null),
  setReview: (docId, r) => write(`doc:${docId}:review`, r),
  getTocZh: (docId) => read(`doc:${docId}:toc-zh`, null),
  setTocZh: (docId, t) => write(`doc:${docId}:toc-zh`, t),
  getProgress: (docId) => read(`doc:${docId}:progress`, null),
  setProgress: (docId, p) => write(`doc:${docId}:progress`, p),

  flashcards: flashcardOps.all,
  flashcardsFor: flashcardOps.forDoc,
  addFlashcard: flashcardOps.add,
  updateFlashcard: flashcardOps.update,
  removeFlashcard: flashcardOps.remove,

  notes: noteOps.all,
  notesFor: noteOps.forDoc,
  addNote: noteOps.add,
  updateNote: noteOps.update,
  removeNote: noteOps.remove,

  chatFor: (docId) => read(`chat:${docId}`, []),
  pushChat: (docId, msg) => {
    const list = read(`chat:${docId}`, []);
    list.push(msg);
    if (list.length > LIST_LIMIT) list.splice(0, list.length - LIST_LIMIT);
    return write(`chat:${docId}`, list);
  },
  clearChat: (docId) => write(`chat:${docId}`, []),

  clearAll: () => {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  },
  usageBytes: () =>
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .reduce((n, k) => n + k.length + (localStorage.getItem(k) || '').length, 0),
};

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export async function hashDocId(buffer) {
  const slice = buffer.slice(0, 262144);
  if (crypto?.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', slice);
    const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
    return hex.slice(0, 16) + '-' + buffer.byteLength.toString(36);
  }
  const bytes = new Uint8Array(slice);
  let h = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i += 97) h = ((h ^ bytes[i]) * 0x01000193) >>> 0;
  return h.toString(16).padStart(8, '0') + '-' + buffer.byteLength.toString(36);
}
