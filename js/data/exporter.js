import { state } from '../state.js';
import { store } from '../store/storage.js';

export function slug(title) {
  return (title || 'document')
    .slice(0, 40)
    .replace(/[\\/:*?"<>|\s]+/g, '-')
    .replace(/-+$/, '') || 'document';
}

export function reviewToMarkdown(review) {
  if (!review) return '';
  const lines = [];
  lines.push(`# ${review.title.en} / ${review.title.zh}`);
  lines.push('');
  lines.push(`**作者 / Author:** ${review.authors.en}（${review.authors.zh}）`);
  lines.push(`**发表信息 / Publication:** ${review.venue.en}（${review.venue.zh}）`);
  lines.push('');
  for (const sec of review.sections) {
    lines.push('');
    lines.push(`### ${sec.no}. ${sec.titleEn} / ${sec.titleZh}`);
    for (const row of sec.rows) {
      lines.push('');
      lines.push(`- EN: ${row.en}`);
      lines.push(`- 中文: ${row.zh}`);
    }
  }
  return lines.join('\n');
}

function flashcardsMarkdown(cards) {
  const lines = ['## Flashcards / 闪卡'];
  for (const c of cards) {
    lines.push('');
    lines.push(`- **Q:** ${c.front}`);
    lines.push(`- **A:** ${(c.back || '').replace(/\n/g, ' ')}`);
    lines.push(`  (p.${c.page || '?'})`);
  }
  return lines.join('\n');
}

function notesMarkdown(notes) {
  const lines = ['## Notes / 笔记'];
  for (const n of notes) {
    lines.push('');
    lines.push(`- [p.${n.page || '?'}] ${n.text}`);
    if (n.selection) lines.push(`  > ${n.selection}`);
  }
  return lines.join('\n');
}

export function buildMarkdown(scope = { review: true, flashcards: true, notes: true }) {
  const parts = [];
  const title = state.review?.title?.en || state.docName || 'Document';
  parts.push(`# ${title}`);
  parts.push('');
  if (scope.review && state.review) parts.push(reviewToMarkdown(state.review).replace(/^# .*$/m, '## Structured Review / 论文结构化综述'));
  if (scope.flashcards) {
    const cards = store.flashcardsFor(state.docId);
    if (cards.length) parts.push(flashcardsMarkdown(cards));
  }
  if (scope.notes) {
    const notes = store.notesFor(state.docId);
    if (notes.length) parts.push(notesMarkdown(notes));
  }
  return parts.join('\n') + '\n';
}

export function buildJson(scope = { review: true, flashcards: true, notes: true }) {
  const out = {
    doc: { title: state.review?.title || state.docName, docId: state.docId, fileName: state.docName },
    exportedAt: new Date().toISOString(),
  };
  if (scope.review) out.review = state.review;
  if (scope.flashcards) out.flashcards = store.flashcardsFor(state.docId);
  if (scope.notes) out.notes = store.notesFor(state.docId);
  return JSON.stringify(out, null, 2);
}

export function download(filename, content, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function exportAll(format, scope) {
  if (!state.docId) return false;
  const base = slug(state.review?.title?.en || state.docName);
  if (format === 'json') download(`atlas-cards-${base}.json`, buildJson(scope), 'application/json;charset=utf-8');
  else download(`atlas-cards-${base}.md`, buildMarkdown(scope), 'text/markdown;charset=utf-8');
  return true;
}
