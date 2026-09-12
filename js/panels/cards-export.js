import { state, on } from '../state.js';
import { store } from '../store/storage.js';
import { exportAll } from '../data/exporter.js';
import { toast } from '../ui/toast.js';

let el = null;
const scope = { review: true, flashcards: true, notes: true };

function render() {
  if (!el) return;
  el.replaceChildren();
  if (!state.docId) {
    el.innerHTML = '<div class="empty">请先打开一篇论文。</div>';
    return;
  }
  const counts = {
    review: state.review ? state.review.sections.reduce((n, s) => n + s.rows.length, 0) : 0,
    flashcards: store.flashcardsFor(state.docId).length,
    notes: store.notesFor(state.docId).length,
  };
  const labels = { review: '结构化综述要点', flashcards: '闪卡', notes: '笔记' };
  for (const key of ['review', 'flashcards', 'notes']) {
    const row = document.createElement('label');
    row.className = 'check-row';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = scope[key];
    cb.addEventListener('change', () => (scope[key] = cb.checked));
    const txt = document.createElement('span');
    txt.textContent = labels[key];
    const count = document.createElement('span');
    count.className = 'scope-count';
    count.textContent = `(${counts[key]} 条)`;
    row.append(cb, txt, count);
    el.appendChild(row);
  }
  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.gap = '8px';
  actions.style.marginTop = '14px';
  for (const [fmt, label] of [['md', '导出 Markdown'], ['json', '导出 JSON']]) {
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = label;
    btn.addEventListener('click', () => {
      if (exportAll(fmt, scope)) toast('知识库卡片已导出');
    });
    actions.appendChild(btn);
  }
  el.appendChild(actions);
  const hint = document.createElement('div');
  hint.className = 'empty';
  hint.textContent = '导出内容包含所选范围的综述要点、闪卡正面/背面与笔记（含页码引用）。';
  el.appendChild(hint);
}

export const cardsPanel = {
  mount(container) {
    el = container;
    render();
  },
  refresh: render,
};

on('doc', render);
on('flashcards', render);
on('notes', render);
on('review', render);
