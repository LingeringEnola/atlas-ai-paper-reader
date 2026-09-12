import { state, set, on, emit } from '../state.js';
import { store, uid } from '../store/storage.js';
import { explain, AIDisabledError, AIError } from '../ai/adapter.js';
import { pageText } from '../pdf/text-extract.js';
import { getHost } from '../pdf/viewer.js';
import { toast } from './toast.js';
import { copyText } from './clipboard.js';
import { icons } from './icons.js';

const pop = document.getElementById('explainPopover');
const quoteEl = document.getElementById('popQuote');
const bodyEl = document.getElementById('popBody');
const host = getHost();

let current = null;
let abortCtl = null;

export function initPopover() {
  document.getElementById('popClose').innerHTML = icons.close;
  document.getElementById('popClose').addEventListener('click', hidePopover);
  document.getElementById('popCopy').addEventListener('click', async () => {
    if (!current) return;
    const payload = `“${current.text}”\n\n${current.explanation}`;
    const ok = await copyText(payload);
    toast(ok ? '已复制到剪贴板' : '复制失败：浏览器拒绝剪贴板访问');
  });
  document.getElementById('popFlashcard').addEventListener('click', () => {
    if (!current) return;
    const ok = store.addFlashcard({
      id: uid(),
      docId: state.docId,
      front: current.text,
      back: current.explanation,
      page: current.page,
      createdAt: Date.now(),
    });
    toast(ok ? '已加入闪卡' : '存储失败：本地空间不足');
    if (ok) emit('flashcards');
  });
  document.getElementById('popNotepad').addEventListener('click', () => {
    if (!current) return;
    const ok = store.addNote({
      id: uid(),
      docId: state.docId,
      text: current.explanation,
      selection: current.text,
      page: current.page,
      createdAt: Date.now(),
    });
    toast(ok ? '已加入笔记本' : '存储失败：本地空间不足');
    if (ok) emit('notes');
  });
  document.getElementById('popChat').addEventListener('click', () => {
    if (!current) return;
    set({ rightTab: 'chat' }, 'rightTab');
    emit('askInChat', current.text);
    hidePopover();
  });

  document.addEventListener('mousedown', (e) => {
    if (pop.classList.contains('hidden')) return;
    if (pop.contains(e.target)) return;
    if (e.target.closest('.textLayer')) return;
    hidePopover();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hidePopover();
  });
  host.addEventListener('scroll', () => {
    if (!pop.classList.contains('hidden')) hidePopover();
  }, { passive: true });
  on('page', hidePopover);
  on('doc', hidePopover);
}

export function hidePopover() {
  pop.classList.add('hidden');
  if (abortCtl) {
    abortCtl.abort();
    abortCtl = null;
  }
}

export async function showPopover({ text, page, rect }) {
  hidePopover();
  current = { text, page, explanation: '' };
  quoteEl.textContent = text.length > 160 ? text.slice(0, 160) + '…' : text;
  bodyEl.textContent = '思考中…';
  pop.classList.remove('hidden');

  const hostRect = host.getBoundingClientRect();
  const w = pop.offsetWidth;
  const h = pop.offsetHeight;
  const cx = rect.left - hostRect.left + host.scrollLeft + rect.width / 2;
  let left = Math.min(Math.max(cx - w / 2, 8), host.scrollWidth - w - 8);
  let top = rect.top - hostRect.top + host.scrollTop - h - 10;
  if (top < host.scrollTop + 8) top = rect.bottom - hostRect.top + host.scrollTop + 12;
  pop.style.left = left + 'px';
  pop.style.top = top + 'px';

  const section = [...state.toc].reverse().find((t) => t.level <= 1 && t.page <= page);
  let context = '';
  try {
    context = (await pageText(state.pdf, page)).slice(0, 1500);
  } catch { /* ignore */ }

  abortCtl = new AbortController();
  bodyEl.textContent = '';
  try {
    await explain(
      text,
      { page, sectionTitle: section?.title, context, signal: abortCtl.signal },
      (delta, full) => {
        current.explanation = full;
        bodyEl.textContent = full;
        bodyEl.scrollTop = bodyEl.scrollHeight;
      }
    );
  } catch (err) {
    if (err.name === 'AbortError') return;
    bodyEl.textContent = err instanceof AIDisabledError || err instanceof AIError ? err.message : '解释生成失败：' + err.message;
    if (err instanceof AIDisabledError) {
      const btn = document.createElement('button');
      btn.className = 'btn small';
      btn.textContent = '打开设置';
      btn.addEventListener('click', () => {
        set({ rightTab: 'settings' }, 'rightTab');
        hidePopover();
      });
      bodyEl.appendChild(document.createElement('br'));
      bodyEl.appendChild(btn);
    }
  } finally {
    abortCtl = null;
  }
}
