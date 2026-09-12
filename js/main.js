import { state, on, emit } from './state.js';
import { hydrateIcons } from './ui/icons.js';
import { initTopbar } from './ui/topbar.js';
import { initViewer, openDocument, showEmpty } from './pdf/viewer.js';
import { initSelection } from './pdf/selection.js';
import { initPopover } from './ui/explain-popover.js';
import { initToc, buildToc } from './pdf/toc.js';
import { initMindmap, renderMindmap } from './mindmap/mindmap.js';
import { initReviewActions, reviewPanel } from './panels/review-panel.js';
import { flashcardsPanel } from './panels/flashcards.js';
import { notesPanel } from './panels/notes.js';
import { chatPanel } from './panels/chat.js';
import { cardsPanel } from './panels/cards-export.js';
import { settingsPanel } from './panels/settings.js';
import { store, SAMPLE_DOC_ID } from './store/storage.js';
import { demoReview } from './data/demo-data.js';

function boot() {
  hydrateIcons();
  initTopbar();
  initViewer();
  initSelection();
  initPopover();
  initToc();
  initMindmap();
  initReviewActions();
  initRightTabs();
  initLeftTabs();

  on('doc', () => {
    state.review =
      store.getReview(state.docId) ||
      (state.docId === SAMPLE_DOC_ID ? JSON.parse(JSON.stringify(demoReview)) : null);
    emit('review');
    buildToc();
  });

  loadSample();
}

async function loadSample() {
  try {
    const res = await fetch('assets/sample-paper.pdf');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const buf = await res.arrayBuffer();
    await openDocument(buf, {
      docId: SAMPLE_DOC_ID,
      name: 'Artificial Intelligence and the Equilibrium of Production.pdf',
    });
  } catch (err) {
    console.warn('示例论文加载失败：', err);
    showEmpty(true);
  }
}

const panels = {
  review: reviewPanel,
  flashcards: flashcardsPanel,
  notes: notesPanel,
  chat: chatPanel,
  cards: cardsPanel,
  settings: settingsPanel,
};
const wrappers = {};
const panelBody = document.getElementById('panelBody');

function switchRight(tab) {
  state.rightTab = tab;
  document
    .querySelectorAll('#rightTabs .icon-btn')
    .forEach((b) => b.classList.toggle('active', b.dataset.righttab === tab));
  document.getElementById('reviewActions').classList.toggle('hidden', tab !== 'review');
  panelBody.classList.toggle('chat-mode', tab === 'chat');
  if (!wrappers[tab]) {
    wrappers[tab] = document.createElement('div');
    wrappers[tab].style.height = '100%';
    panels[tab].mount(wrappers[tab]);
  }
  panelBody.replaceChildren(wrappers[tab]);
  panels[tab].refresh?.();
}

function initRightTabs() {
  document
    .querySelectorAll('#rightTabs .icon-btn')
    .forEach((b) => b.addEventListener('click', () => switchRight(b.dataset.righttab)));
  on('rightTab', () => switchRight(state.rightTab));
  switchRight('review');
}

function initLeftTabs() {
  const tabs = document.querySelectorAll('.left-tab');
  tabs.forEach((b) =>
    b.addEventListener('click', () => {
      state.leftTab = b.dataset.lefttab;
      tabs.forEach((x) => x.classList.toggle('active', x === b));
      document.getElementById('tocView').classList.toggle('hidden', state.leftTab !== 'toc');
      document.getElementById('mindmapView').classList.toggle('hidden', state.leftTab !== 'mindmap');
      if (state.leftTab === 'mindmap') renderMindmap();
    })
  );
}

if (location.protocol === 'file:') {
  const banner = document.createElement('div');
  banner.id = 'fileProtocolBanner';
  banner.innerHTML =
    'ATLAS 需要通过 HTTP 访问（ES modules 与 fetch 在 file:// 下不可用）。<br>' +
    '请在项目目录运行 <code>npx serve .</code> 或 <code>python -m http.server 8080</code> 后打开对应地址。';
  document.body.appendChild(banner);
} else {
  boot();
}
