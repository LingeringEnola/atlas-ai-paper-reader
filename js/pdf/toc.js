import { state, set, on } from '../state.js';
import { pageLines, sectionTexts } from './text-extract.js';
import { goToPage } from './viewer.js';
import { store, SAMPLE_DOC_ID } from '../store/storage.js';
import { summarizeSections, AIDisabledError } from '../ai/adapter.js';

async function fromOutline(pdf) {
  const outline = await pdf.getOutline();
  if (!outline?.length) return [];
  const out = [];
  const resolve = async (nodes, level) => {
    for (const node of nodes) {
      try {
        const dest = typeof node.dest === 'string' ? await pdf.getDestination(node.dest) : node.dest;
        let page = 1;
        if (Array.isArray(dest) && dest[0]) page = (await pdf.getPageIndex(dest[0])) + 1;
        out.push({ title: node.title.trim(), page, level });
        if (node.items?.length && level < 2) await resolve(node.items, level + 1);
      } catch { /* skip broken dest */ }
    }
  };
  await resolve(outline, 1);
  return out;
}

async function fromHeuristics(pdf) {
  const n = pdf.numPages;
  const sample = [];
  for (let p = 1; p <= Math.min(n, 12); p++) sample.push(p);
  const perPage = [];
  for (const p of sample) perPage.push({ p, lines: await pageLines(pdf, p) });

  const heights = [];
  for (const { lines } of perPage) for (const l of lines) heights.push({ h: l.height, len: l.text.length });
  heights.sort((a, b) => a.h - b.h);
  const total = heights.reduce((s, x) => s + x.len, 0) || 1;
  let acc = 0;
  let bodySize = 10;
  for (const x of heights) {
    acc += x.len;
    if (acc >= total / 2) { bodySize = x.h; break; }
  }

  const repeat = new Map();
  for (const { lines } of perPage) for (const l of lines) repeat.set(l.text, (repeat.get(l.text) || 0) + 1);

  const toc = [];
  for (let p = 1; p <= n; p++) {
    const lines = p <= Math.min(n, 12) ? perPage[p - 1].lines : await pageLines(pdf, p);
    for (const l of lines) {
      const { text, height: h, y, pageHeight, pageWidth } = l;
      if (y > pageHeight * 0.94 || y < pageHeight * 0.06) continue;
      if ((repeat.get(text) || 0) > sample.length * 0.3) continue;
      if (/^\d{1,4}$/.test(text)) continue;
      if (text.length > 90 || /[.,;:]$/.test(text)) continue;
      const allCaps = text === text.toUpperCase() && /[A-Z]{3,}/.test(text);
      const bigEnough = h >= bodySize * 1.22;
      const capsTitle = allCaps && h >= bodySize * 0.95 && text.length <= 60;
      if (!bigEnough && !capsTitle) continue;
      if (l.text.length / pageWidth > 0.12) continue;
      const level = h >= bodySize * 1.9 ? 0 : h >= bodySize * 1.35 ? 1 : 2;
      const last = toc[toc.length - 1];
      if (last && last.title === text && p - last.page <= 1) continue;
      toc.push({ title: text, page: p, level });
    }
  }
  return toc;
}

function fallbackPerPage() {
  return Array.from({ length: state.numPages }, (_, i) => ({ title: `Page ${i + 1}`, page: i + 1, level: 1 }));
}

export function renderToc() {
  const tree = document.getElementById('tocTree');
  tree.replaceChildren();
  if (!state.toc.length) {
    tree.innerHTML = '<div class="empty">暂无目录</div>';
    return;
  }
  const zh = state.tocZh || {};
  for (const item of state.toc) {
    if (item.level === 0) continue;
    const row = document.createElement('div');
    row.className = `toc-item l${item.level}`;
    row.dataset.page = item.page;
    const t = document.createElement('span');
    t.textContent = item.title;
    const pg = document.createElement('span');
    pg.className = 'pg';
    pg.textContent = item.page;
    row.append(t, pg);
    row.addEventListener('click', () => goToPage(item.page));
    tree.appendChild(row);
    if (item.level === 1) {
      for (const bullet of zh[item.title] || []) {
        const b = document.createElement('div');
        b.className = 'toc-bullet';
        b.textContent = bullet;
        b.addEventListener('click', () => goToPage(item.page));
        tree.appendChild(b);
      }
    }
  }
  if (!state.tocZh && state.docId && state.docId !== SAMPLE_DOC_ID) {
    const hint = document.createElement('div');
    hint.className = 'empty';
    hint.textContent = '在设置中配置 OpenAI 兼容接口后，可自动生成各章节中文要点。';
    tree.appendChild(hint);
  }
  highlightCurrent();
}

function highlightCurrent() {
  const items = [...document.querySelectorAll('#tocTree .toc-item')];
  let current = null;
  for (const el of items) if (+el.dataset.page <= state.currentPage) current = el;
  items.forEach((el) => el.classList.toggle('current', el === current));
}

export async function buildToc() {
  if (!state.pdf) return;
  let toc = [];
  try { toc = await fromOutline(state.pdf); } catch { /* ignore */ }
  if (!toc.length) toc = await fromHeuristics(state.pdf);
  if (!toc.length) toc = fallbackPerPage();
  set({ toc }, 'toc');

  const cached = store.getTocZh(state.docId);
  if (cached) {
    set({ tocZh: cached }, 'tocZh');
    return;
  }
  if (state.docId === SAMPLE_DOC_ID) {
    const { demoTocBullets } = await import('../data/demo-data.js');
    store.setTocZh(state.docId, demoTocBullets);
    set({ tocZh: demoTocBullets }, 'tocZh');
    return;
  }
  try {
    const sections = await sectionTexts(state.pdf, toc);
    const bullets = await summarizeSections(sections);
    store.setTocZh(state.docId, bullets);
    set({ tocZh: bullets }, 'tocZh');
  } catch (err) {
    if (!(err instanceof AIDisabledError)) console.error(err);
    set({ tocZh: null }, 'tocZh');
  }
}

export function initToc() {
  on('toc', renderToc);
  on('tocZh', renderToc);
  on('page', highlightCurrent);
  document.getElementById('btnTocRefresh')?.addEventListener('click', () => buildToc());
}
