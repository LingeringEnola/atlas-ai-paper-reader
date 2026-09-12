import { state, on } from '../state.js';
import { store } from '../store/storage.js';
import { toast } from '../ui/toast.js';
import { icons } from '../ui/icons.js';

let el = null;

function render() {
  if (!el) return;
  el.replaceChildren();
  const notes = store.notesFor(state.docId);
  if (!state.docId || !notes.length) {
    el.innerHTML = '<div class="empty">暂无笔记。在 PDF 中选中文字后点击 "+ Notepad"，解释与选文将一并存入此处。</div>';
    return;
  }
  for (const note of notes) {
    const item = document.createElement('div');
    item.className = 'card-item';
    if (note.selection) {
      const q = document.createElement('div');
      q.className = 'chat-quote';
      q.textContent = note.selection;
      item.appendChild(q);
    }
    const text = document.createElement('div');
    text.className = 'front';
    text.textContent = note.text;
    text.setAttribute('contenteditable', 'true');
    text.addEventListener('blur', () => store.updateNote(note.id, { text: text.textContent.trim() }));
    const meta = document.createElement('div');
    meta.className = 'card-meta';
    const when = document.createElement('span');
    when.textContent = `p.${note.page || '?'} · ${new Date(note.createdAt).toLocaleString()}`;
    const ops = document.createElement('span');
    ops.className = 'ops';
    const del = document.createElement('button');
    del.className = 'icon-btn';
    del.title = '删除';
    del.innerHTML = icons.trash;
    del.addEventListener('click', () => {
      store.removeNote(note.id);
      toast('笔记已删除');
      render();
    });
    ops.appendChild(del);
    meta.append(when, ops);
    item.append(text, meta);
    el.appendChild(item);
  }
}

export const notesPanel = {
  mount(container) {
    el = container;
    render();
  },
  refresh: render,
};

on('notes', render);
on('doc', render);
