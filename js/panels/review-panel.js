import { state, on } from '../state.js';
import { store } from '../store/storage.js';
import { generateReview, AIDisabledError, AIError } from '../ai/adapter.js';
import { sectionTexts } from '../pdf/text-extract.js';
import { reviewToMarkdown, download, slug } from '../data/exporter.js';
import { toast } from '../ui/toast.js';
import { copyText } from '../ui/clipboard.js';

let el = null;
let editing = false;
let saveTimer = 0;

function setPath(obj, path, value) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
  cur[parts[parts.length - 1]] = value;
}

function editable(node, path) {
  if (!editing) return node;
  node.setAttribute('contenteditable', 'true');
  node.dataset.path = path;
  node.addEventListener('blur', () => {
    setPath(state.review, path, node.textContent.trim());
    state.review.source = 'edited';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => store.setReview(state.docId, state.review), 300);
  });
  return node;
}

function render() {
  if (!el) return;
  el.replaceChildren();
  const r = state.review;
  if (!r) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = '尚未生成结构化综述。';
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = '生成综述';
    btn.addEventListener('click', generate);
    el.append(empty, btn);
    return;
  }

  const title = document.createElement('div');
  title.className = 'review-title';
  title.append(
    editable(span(r.title.en), 'title.en'),
    span(' / ', 'sep'),
    editable(span(r.title.zh), 'title.zh')
  );
  el.appendChild(title);

  el.appendChild(field('作者 / Author', editable(span(`${r.authors.en}（${r.authors.zh}）`), 'authors.en')));
  el.appendChild(field('发表信息 / Publication', editable(span(`${r.venue.en}（${r.venue.zh}）`), 'venue.en')));

  for (const sec of r.sections) {
    const h = document.createElement('div');
    h.className = 'review-sec-h';
    h.append(
      editable(span(`${sec.no}. ${sec.titleZh}`), `sections.${r.sections.indexOf(sec)}.titleZh`),
      span(' / ', 'sep'),
      editable(span(sec.titleEn), `sections.${r.sections.indexOf(sec)}.titleEn`)
    );
    el.appendChild(h);
    const table = document.createElement('table');
    table.className = 'review-table';
    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>English</th><th>中文</th></tr>';
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    sec.rows.forEach((row, ri) => {
      const tr = document.createElement('tr');
      const tdEn = document.createElement('td');
      tdEn.className = 'en';
      tdEn.appendChild(editable(span(row.en), `sections.${r.sections.indexOf(sec)}.rows.${ri}.en`));
      const tdZh = document.createElement('td');
      tdZh.appendChild(editable(span(row.zh), `sections.${r.sections.indexOf(sec)}.rows.${ri}.zh`));
      tr.append(tdEn, tdZh);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    el.appendChild(table);
  }

  const src = document.createElement('div');
  src.className = 'review-src';
  src.textContent = '来源：' + (r.source === 'demo' ? '内置演示数据' : r.source === 'edited' ? '手动编辑' : 'AI 生成') + (r.updatedAt ? ` · ${new Date(r.updatedAt).toLocaleString()}` : '');
  el.appendChild(src);
}

function span(text, cls) {
  const s = document.createElement('span');
  s.textContent = text;
  if (cls) s.className = cls;
  return s;
}

function field(label, valueNode) {
  const div = document.createElement('div');
  div.className = 'review-field';
  const b = document.createElement('b');
  b.textContent = label + ': ';
  div.append(b, valueNode);
  return div;
}

async function generate() {
  if (!state.pdf) return;
  toast('正在提取正文…', 4000);
  try {
    const toc = state.toc.length ? state.toc : [{ title: 'Full text', page: 1, level: 1 }];
    const secs = await sectionTexts(state.pdf, toc);
    const fullText = secs.map((s) => `## ${s.title}\n${s.text}`).join('\n\n');
    const review = await generateReview(
      { title: state.docName, fullText },
      (i, n) => toast(`生成综述 ${i}/${n}…`, 4000)
    );
    review.updatedAt = new Date().toISOString();
    store.setReview(state.docId, review);
    state.review = review;
    render();
    toast('综述生成完成');
  } catch (err) {
    if (err instanceof AIDisabledError || err instanceof AIError) toast(err.message, 4000);
    else {
      console.error(err);
      toast('综述生成失败：' + err.message, 4000);
    }
  }
}

export const reviewPanel = {
  mount(container) {
    el = container;
    render();
  },
  refresh() {
    render();
  },
  setEditing(v) {
    editing = v;
    render();
  },
  isEditing() {
    return editing;
  },
  copy() {
    if (!state.review) return toast('暂无综述');
    copyText(reviewToMarkdown(state.review)).then((ok) =>
      toast(ok ? '综述已复制为 Markdown' : '复制失败：浏览器拒绝剪贴板访问')
    );
  },
  exportMd() {
    if (!state.review) return toast('暂无综述');
    download(`review-${slug(state.review.title.en)}.md`, reviewToMarkdown(state.review), 'text/markdown;charset=utf-8');
    toast('综述已导出');
  },
};

export function initReviewActions() {
  document.getElementById('btnReviewEdit').addEventListener('click', (e) => {
    reviewPanel.setEditing(!reviewPanel.isEditing());
    e.target.textContent = reviewPanel.isEditing() ? '完成' : '编辑';
    e.target.classList.toggle('dark', reviewPanel.isEditing());
  });
  document.getElementById('btnReviewCopy').addEventListener('click', () => reviewPanel.copy());
  document.getElementById('btnReviewExport').addEventListener('click', () => reviewPanel.exportMd());
  on('review', () => reviewPanel.refresh());
}
