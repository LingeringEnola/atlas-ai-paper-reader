import { state, on } from '../state.js';
import { goToPage } from '../pdf/viewer.js';

const svg = document.getElementById('mindmapSvg');
const NODE_H = 26;
const GAP_Y = 12;
const COL_GAP = 46;
const PAD = 9;
let lastBox = null;

function textWidth(t, fs = 11) {
  let w = 0;
  for (const ch of t) w += ch.charCodeAt(0) > 255 ? fs : fs * 0.55;
  return w;
}

function heightOf(n) {
  if (!n.children?.length) return NODE_H;
  const sum = n.children.reduce((s, c) => s + heightOf(c), 0) + GAP_Y * (n.children.length - 1);
  return Math.max(NODE_H, sum);
}

export function renderMindmap() {
  svg.replaceChildren();
  const sections = state.toc.filter((t) => t.level <= 1);
  if (!sections.length) return;
  const zh = state.tocZh || {};
  const rootLabel = (state.review?.title?.en || state.docName || 'Paper').replace(/\.pdf$/i, '');
  const root = {
    label: rootLabel.length > 26 ? rootLabel.slice(0, 26) + '…' : rootLabel,
    children: sections.map((s) => ({
      label: s.title.length > 26 ? s.title.slice(0, 26) + '…' : s.title,
      page: s.page,
      children: (zh[s.title] || []).map((b) => ({
        label: b.length > 18 ? b.slice(0, 18) + '…' : b,
        page: s.page,
      })),
    })),
  };

  const nodes = [];
  const links = [];

  function place(n, side, xStart, cy, parent) {
    const w = textWidth(n.label) + PAD * 2;
    const rectX = side > 0 ? xStart : -xStart - w;
    const entry = { ...n, rectX, cy, w };
    nodes.push(entry);
    if (parent) links.push({ parent, child: entry, side });
    if (n.children?.length) {
      const total = n.children.reduce((s, c) => s + heightOf(c), 0) + GAP_Y * (n.children.length - 1);
      let y = cy - total / 2;
      for (const c of n.children) {
        const hC = heightOf(c);
        place(c, side, xStart + w + COL_GAP, y + hC / 2, entry);
        y += hC + GAP_Y;
      }
    }
  }

  const rootW = textWidth(root.label) + PAD * 2 + 8;
  const rootEntry = { ...root, rectX: -rootW / 2, cy: 0, w: rootW, root: true };
  nodes.push(rootEntry);
  const right = root.children.filter((_, i) => i % 2 === 0);
  const left = root.children.filter((_, i) => i % 2 === 1);
  for (const [list, side] of [[right, 1], [left, -1]]) {
    const total = list.reduce((s, c) => s + heightOf(c), 0) + GAP_Y * (list.length - 1);
    let y = -total / 2;
    for (const c of list) {
      const hC = heightOf(c);
      place(c, side, rootW / 2 + COL_GAP, y + hC / 2, rootEntry);
      y += hC + GAP_Y;
    }
  }

  const NS = 'http://www.w3.org/2000/svg';
  for (const l of links) {
    const px = l.side > 0 ? l.parent.rectX + l.parent.w : l.parent.rectX;
    const cxEdge = l.side > 0 ? l.child.rectX : l.child.rectX + l.child.w;
    const path = document.createElementNS(NS, 'path');
    const mid = (px + cxEdge) / 2;
    path.setAttribute('d', `M ${px} ${l.parent.cy} C ${mid} ${l.parent.cy}, ${mid} ${l.child.cy}, ${cxEdge} ${l.child.cy}`);
    path.setAttribute('class', 'mm-link');
    svg.appendChild(path);
  }
  let minX = 0, maxX = 0, minY = 0, maxY = 0;
  for (const n of nodes) {
    minX = Math.min(minX, n.rectX);
    maxX = Math.max(maxX, n.rectX + n.w);
    minY = Math.min(minY, n.cy - NODE_H / 2);
    maxY = Math.max(maxY, n.cy + NODE_H / 2);
  }
  lastBox = [minX - 20, minY - 20, maxX - minX + 40, maxY - minY + 40];
  svg.setAttribute('viewBox', lastBox.join(' '));

  for (const n of nodes) {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'mm-node' + (n.root ? ' root' : ''));
    const rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('x', n.rectX);
    rect.setAttribute('y', n.cy - NODE_H / 2);
    rect.setAttribute('width', n.w);
    rect.setAttribute('height', NODE_H);
    rect.setAttribute('rx', 2);
    const text = document.createElementNS(NS, 'text');
    text.setAttribute('x', n.rectX + PAD);
    text.setAttribute('y', n.cy + 4);
    text.textContent = n.label;
    g.append(rect, text);
    if (n.page) g.addEventListener('click', () => goToPage(n.page));
    svg.appendChild(g);
  }
  fitMindmap();
}

export function fitMindmap() {
  if (!lastBox) return;
  const view = svg.parentElement;
  const cw = Math.max(view.clientWidth - 8, 100);
  const ch = Math.max(view.clientHeight - 8, 100);
  const vbW = lastBox[2];
  const vbH = lastBox[3];
  const s = Math.min(Math.max(ch / vbH, cw / vbW), 1.6);
  svg.style.width = Math.round(vbW * s) + 'px';
  svg.style.height = Math.round(vbH * s) + 'px';
  requestAnimationFrame(() => {
    view.scrollLeft = Math.max(0, (view.scrollWidth - view.clientWidth) / 2);
  });
}

export function initMindmap() {
  document.getElementById('btnMindmapFit').addEventListener('click', fitMindmap);
  on('toc', () => state.leftTab === 'mindmap' && renderMindmap());
  on('tocZh', () => state.leftTab === 'mindmap' && renderMindmap());
  on('review', () => state.leftTab === 'mindmap' && renderMindmap());
}
