import { state, on } from '../state.js';
import { store } from '../store/storage.js';
import { toast } from '../ui/toast.js';
import { icons } from '../ui/icons.js';

let el = null;

function render() {
  if (!el) return;
  el.replaceChildren();
  const cards = store.flashcardsFor(state.docId);
  if (!state.docId || !cards.length) {
    el.innerHTML = '<div class="empty">暂无闪卡。在 PDF 中选中一段文字，点击 AI EXPLAIN 浮层中的 "+ Flashcard" 即可创建。</div>';
    return;
  }
  for (const card of cards) {
    const item = document.createElement('div');
    item.className = 'card-item';
    const front = document.createElement('div');
    front.className = 'front';
    front.textContent = card.front;
    const back = document.createElement('div');
    back.className = 'back';
    back.textContent = card.back || '（暂无背面内容）';
    back.setAttribute('contenteditable', 'true');
    back.addEventListener('blur', () => store.updateFlashcard(card.id, { back: back.textContent.trim() }));
    const meta = document.createElement('div');
    meta.className = 'card-meta';
    const pg = document.createElement('span');
    pg.textContent = `p.${card.page || '?'}`;
    const ops = document.createElement('span');
    ops.className = 'ops';
    const flip = document.createElement('button');
    flip.className = 'icon-btn';
    flip.title = '翻转';
    flip.innerHTML = icons.flip;
    flip.addEventListener('click', () => item.classList.toggle('flipped'));
    const del = document.createElement('button');
    del.className = 'icon-btn';
    del.title = '删除';
    del.innerHTML = icons.trash;
    del.addEventListener('click', () => {
      store.removeFlashcard(card.id);
      toast('闪卡已删除');
      render();
    });
    ops.append(flip, del);
    meta.append(pg, ops);
    item.append(front, back, meta);
    item.addEventListener('dblclick', () => item.classList.toggle('flipped'));
    el.appendChild(item);
  }
}

export const flashcardsPanel = {
  mount(container) {
    el = container;
    render();
  },
  refresh: render,
};

on('flashcards', render);
on('doc', render);
