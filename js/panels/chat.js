import { state, on } from '../state.js';
import { store } from '../store/storage.js';
import { chat, AIDisabledError, AIError } from '../ai/adapter.js';
import { pageText } from '../pdf/text-extract.js';
import { toast } from '../ui/toast.js';

let el = null;
let scrollEl = null;
let inputEl = null;
let busy = false;

function renderMessages() {
  if (!scrollEl) return;
  scrollEl.replaceChildren();
  for (const m of store.chatFor(state.docId)) {
    const row = document.createElement('div');
    row.className = 'chat-msg ' + m.role;
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    if (m.quote) {
      const q = document.createElement('div');
      q.className = 'chat-quote';
      q.textContent = m.quote;
      bubble.appendChild(q);
    }
    bubble.appendChild(document.createTextNode(m.content));
    row.appendChild(bubble);
    scrollEl.appendChild(row);
  }
  scrollEl.scrollTop = scrollEl.scrollHeight;
}

async function send(text, quote) {
  if (!text.trim() || busy || !state.docId) return;
  busy = true;
  store.pushChat(state.docId, { role: 'user', content: text, quote, ts: Date.now() });
  renderMessages();
  inputEl.value = '';
  const history = store.chatFor(state.docId).map((m) => ({ role: m.role, content: m.content }));
  let context = '';
  try {
    context = (await pageText(state.pdf, state.currentPage)).slice(0, 2000);
  } catch { /* ignore */ }
  store.pushChat(state.docId, { role: 'assistant', content: '…', ts: Date.now() });
  renderMessages();
  try {
    const reply = await chat(history, quote, { context });
    const list = store.chatFor(state.docId);
    list[list.length - 1] = { role: 'assistant', content: reply, ts: Date.now() };
    store.clearChat(state.docId);
    list.forEach((m) => store.pushChat(state.docId, m));
    renderMessages();
  } catch (err) {
    const list = store.chatFor(state.docId);
    list[list.length - 1] = {
      role: 'assistant',
      content: err instanceof AIDisabledError || err instanceof AIError ? err.message : '回答失败：' + err.message,
      ts: Date.now(),
    };
    store.clearChat(state.docId);
    list.forEach((m) => store.pushChat(state.docId, m));
    renderMessages();
  } finally {
    busy = false;
  }
}

export const chatPanel = {
  mount(container) {
    el = container;
    el.replaceChildren();
    const wrap = document.createElement('div');
    wrap.id = 'chatPanel';
    scrollEl = document.createElement('div');
    scrollEl.className = 'chat-scroll';
    const row = document.createElement('div');
    row.className = 'chat-input-row';
    inputEl = document.createElement('input');
    inputEl.type = 'text';
    inputEl.placeholder = '就这篇论文提问…';
    const btn = document.createElement('button');
    btn.className = 'btn dark';
    btn.textContent = '发送';
    btn.addEventListener('click', () => send(inputEl.value, null));
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') send(inputEl.value, null);
    });
    row.append(inputEl, btn);
    wrap.append(scrollEl, row);
    el.appendChild(wrap);
    renderMessages();
  },
  refresh() {
    renderMessages();
  },
};

on('doc', renderMessages);
on('askInChat', (quote) => {
  send('请结合论文上下文解释我选中的这段文字，并说明它在论证中的作用。', quote);
});
