import { loadPdfjs } from '../vendor/pdfjs-loader.js';
import { state, set, emit, on } from '../state.js';
import { store } from '../store/storage.js';

const host = document.getElementById('viewerHost');
const pageWrap = document.getElementById('pageModeWrap');
const scrollWrap = document.getElementById('scrollWrap');
const emptyState = document.getElementById('emptyState');
const errorBox = document.getElementById('viewerError');

let pdfjs = null;
let loadingTask = null;
let pageSlot = null;
let slots = new Map();
let rendered = new Set();
let observer = null;
const renderSeq = new Map();
let progressTimer = null;
let scrollRaf = 0;

const clampScale = (s) => Math.min(3, Math.max(0.5, Math.round(s * 100) / 100));
const dpr = () => window.devicePixelRatio || 1;

function renderTextLayer(textContentSource, container, viewport) {
  if (pdfjs.TextLayer) {
    const tl = new pdfjs.TextLayer({ textContentSource, container, viewport });
    return tl.render();
  }
  const task = pdfjs.renderTextLayer({ textContentSource, container, viewport });
  return task.promise || Promise.resolve();
}

function makeSlot() {
  const slot = document.createElement('div');
  slot.className = 'page-slot';
  const canvas = document.createElement('canvas');
  const tl = document.createElement('div');
  tl.className = 'textLayer';
  slot.append(canvas, tl);
  return slot;
}

export function getHost() {
  return host;
}

export function showEmpty(show) {
  emptyState.classList.toggle('hidden', !show);
}

export function showViewerError(msg) {
  errorBox.innerHTML = '';
  if (!msg) {
    errorBox.classList.add('hidden');
    return;
  }
  errorBox.classList.remove('hidden');
  const div = document.createElement('div');
  div.textContent = msg;
  const btn = document.createElement('button');
  btn.className = 'btn';
  btn.textContent = '重试';
  btn.addEventListener('click', () => location.reload());
  errorBox.append(div, btn);
}

function updateIndicators() {
  const total = state.numPages || '–';
  document.getElementById('pageIndicator').textContent = `${state.numPages ? state.currentPage : '–'} / ${total}`;
  document.getElementById('zoomLabel').textContent = state.numPages ? Math.round(state.scale * 100) + '%' : '–';
  document.getElementById('readingPos').textContent = `${state.numPages ? state.currentPage : '–'} / ${total}`;
  const pct = state.numPages ? (state.currentPage / state.numPages) * 100 : 0;
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('btnPrev').disabled = !state.numPages || state.currentPage <= 1;
  document.getElementById('btnNext').disabled = !state.numPages || state.currentPage >= state.numPages;
}

function saveProgress() {
  clearTimeout(progressTimer);
  progressTimer = setTimeout(() => {
    if (state.docId) store.setProgress(state.docId, { page: state.currentPage });
  }, 500);
}

async function renderPageInto(slot, num) {
  if (!state.pdf) return;
  const seq = (renderSeq.get(slot) || 0) + 1;
  renderSeq.set(slot, seq);
  if (slot._task) {
    try { slot._task.cancel(); } catch { /* ignore */ }
  }
  try {
    const page = await state.pdf.getPage(num);
    if (renderSeq.get(slot) !== seq) return;
    const viewport = page.getViewport({ scale: state.scale });
    const canvas = slot.querySelector('canvas');
    const ratio = dpr();
    canvas.width = Math.floor(viewport.width * ratio);
    canvas.height = Math.floor(viewport.height * ratio);
    canvas.style.width = viewport.width + 'px';
    canvas.style.height = viewport.height + 'px';
    slot.style.width = viewport.width + 'px';
    slot.style.height = viewport.height + 'px';
    const ctx = canvas.getContext('2d', { alpha: false });
    slot._task = page.render({
      canvasContext: ctx,
      viewport,
      transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : null,
    });
    await slot._task.promise;
    if (renderSeq.get(slot) !== seq) return;
    const tlDiv = slot.querySelector('.textLayer');
    tlDiv.replaceChildren();
    const tc = await page.getTextContent();
    if (renderSeq.get(slot) !== seq) return;
    await renderTextLayer(tc, tlDiv, viewport);
    rendered.add(num);
  } catch (err) {
    if (err?.name === 'RenderingCancelledException') return;
    console.error(err);
  }
}

function recycleSlot(slot, num) {
  if (!rendered.has(num)) return;
  renderSeq.set(slot, (renderSeq.get(slot) || 0) + 1);
  if (slot._task) {
    try { slot._task.cancel(); } catch { /* ignore */ }
    slot._task = null;
  }
  const canvas = slot.querySelector('canvas');
  canvas.width = 0;
  canvas.height = 0;
  slot.querySelector('.textLayer').replaceChildren();
  rendered.delete(num);
}

function buildPageMode() {
  if (observer) { observer.disconnect(); observer = null; }
  slots.clear();
  rendered.clear();
  scrollWrap.replaceChildren();
  scrollWrap.classList.add('hidden');
  pageWrap.classList.remove('hidden');
  pageWrap.replaceChildren();
  pageSlot = makeSlot();
  pageWrap.appendChild(pageSlot);
}

function buildScrollMode() {
  pageWrap.classList.add('hidden');
  scrollWrap.classList.remove('hidden');
  scrollWrap.replaceChildren();
  slots.clear();
  rendered.clear();
  const w = state.baseWidth * state.scale;
  const h = state.baseHeight * state.scale;
  for (let n = 1; n <= state.numPages; n++) {
    const slot = makeSlot();
    slot.dataset.page = n;
    slot.style.width = w + 'px';
    slot.style.height = h + 'px';
    slots.set(n, slot);
    scrollWrap.appendChild(slot);
  }
  if (observer) observer.disconnect();
  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const num = +e.target.dataset.page;
        if (e.isIntersecting) renderPageInto(e.target, num);
        else if (Math.abs(num - state.currentPage) > 5) recycleSlot(e.target, num);
      }
    },
    { root: host, rootMargin: '500px 0px' }
  );
  slots.forEach((slot) => observer.observe(slot));
}

function buildMode() {
  if (state.mode === 'page') buildPageMode();
  else buildScrollMode();
}

export function fitWidthScale() {
  if (!state.baseWidth) return 1;
  return clampScale((host.clientWidth - 40) / state.baseWidth);
}

export function setScale(s, fit = false) {
  if (!state.pdf) return;
  state.fitWidth = fit;
  state.scale = clampScale(s);
  emit('scale', state);
  updateIndicators();
  if (state.mode === 'page') {
    renderPageInto(pageSlot, state.currentPage);
  } else {
    const w = state.baseWidth * state.scale;
    const h = state.baseHeight * state.scale;
    for (const [num, slot] of slots) {
      if (!rendered.has(num)) {
        slot.style.width = w + 'px';
        slot.style.height = h + 'px';
      } else {
        renderPageInto(slot, num);
      }
    }
  }
}

export function setMode(m) {
  if (!state.pdf || state.mode === m) return;
  state.mode = m;
  emit('mode', state);
  document.getElementById('btnModePage').classList.toggle('active', m === 'page');
  document.getElementById('btnModeScroll').classList.toggle('active', m === 'scroll');
  buildMode();
  goToPage(state.currentPage, true);
}

export function goToPage(n, force = false) {
  if (!state.pdf) return;
  n = Math.min(state.numPages, Math.max(1, n));
  if (n === state.currentPage && !force) {
    if (state.mode === 'page') renderPageInto(pageSlot, n);
    return;
  }
  state.currentPage = n;
  emit('page', state);
  updateIndicators();
  saveProgress();
  if (state.mode === 'page') renderPageInto(pageSlot, n);
  else {
    const slot = slots.get(n);
    if (slot) host.scrollTo({ top: Math.max(0, slot.offsetTop - 14), behavior: 'smooth' });
  }
}

export async function openDocument(data, meta) {
  showViewerError(null);
  showEmpty(false);
  try {
    pdfjs = await loadPdfjs();
  } catch (err) {
    showEmpty(true);
    showViewerError(err.message);
    return;
  }
  if (loadingTask) {
    try { loadingTask.destroy(); } catch { /* ignore */ }
  }
  try {
    loadingTask = pdfjs.getDocument({ data });
    const pdf = await loadingTask.promise;
    const page1 = await pdf.getPage(1);
    const vp1 = page1.getViewport({ scale: 1 });
    set(
      {
        pdf,
        docId: meta.docId,
        docName: meta.name,
        numPages: pdf.numPages,
        baseWidth: vp1.width,
        baseHeight: vp1.height,
        toc: [],
        tocZh: null,
        review: null,
      },
      'doc'
    );
    state.scale = fitWidthScale();
    state.fitWidth = true;
    buildMode();
    updateIndicators();
    const prog = store.getProgress(meta.docId);
    goToPage(prog?.page || 1, true);
  } catch (err) {
    console.error(err);
    showEmpty(true);
    showViewerError('PDF 打开失败：' + (err?.message || err));
  }
}

function detectScrollPage() {
  const center = host.scrollTop + host.clientHeight / 2;
  let cur = 1;
  for (const [num, slot] of slots) {
    if (slot.offsetTop <= center) cur = num;
    else break;
  }
  if (cur !== state.currentPage) {
    state.currentPage = cur;
    emit('page', state);
    updateIndicators();
    saveProgress();
  }
}

export function initViewer() {
  document.getElementById('btnPrev').addEventListener('click', () => goToPage(state.currentPage - 1));
  document.getElementById('btnNext').addEventListener('click', () => goToPage(state.currentPage + 1));
  document.getElementById('btnZoomIn').addEventListener('click', () => setScale(state.scale + 0.1));
  document.getElementById('btnZoomOut').addEventListener('click', () => setScale(state.scale - 0.1));
  document.getElementById('btnFitWidth').addEventListener('click', () => setScale(fitWidthScale(), true));
  document.getElementById('btnModePage').addEventListener('click', () => setMode('page'));
  document.getElementById('btnModeScroll').addEventListener('click', () => setMode('scroll'));

  host.addEventListener('scroll', () => {
    if (state.mode !== 'scroll') return;
    cancelAnimationFrame(scrollRaf);
    scrollRaf = requestAnimationFrame(detectScrollPage);
  }, { passive: true });

  let resizeTimer = 0;
  new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (state.pdf && state.fitWidth) setScale(fitWidthScale(), true);
    }, 150);
  }).observe(host);

  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea, [contenteditable="true"]')) return;
    if (state.mode !== 'page' || !state.pdf) return;
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); goToPage(state.currentPage - 1); }
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); goToPage(state.currentPage + 1); }
  });

  on('page', updateIndicators);
  updateIndicators();
}
