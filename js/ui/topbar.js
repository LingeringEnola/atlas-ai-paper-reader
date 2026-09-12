import { state, on } from '../state.js';
import { hashDocId } from '../store/storage.js';
import { openDocument } from '../pdf/viewer.js';
import { exportAll } from '../data/exporter.js';
import { toast } from './toast.js';

const fileInput = document.getElementById('fileInput');
const overlay = document.getElementById('dropOverlay');
const exportMenu = document.getElementById('exportMenu');

export async function handleFile(file) {
  if (!file) return;
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (!isPdf) return toast('请选择 PDF 文件');
  const buffer = await file.arrayBuffer();
  const docId = await hashDocId(buffer);
  await openDocument(buffer, { docId, name: file.name });
}

export function initTopbar() {
  document.getElementById('btnUpload').addEventListener('click', () => fileInput.click());
  document.getElementById('btnUpload2').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    handleFile(fileInput.files[0]);
    fileInput.value = '';
  });

  let dragDepth = 0;
  window.addEventListener('dragenter', (e) => {
    if (![...e.dataTransfer.types].includes('Files')) return;
    dragDepth++;
    overlay.classList.remove('hidden');
  });
  window.addEventListener('dragover', (e) => {
    if ([...e.dataTransfer.types].includes('Files')) e.preventDefault();
  });
  window.addEventListener('dragleave', () => {
    if (--dragDepth <= 0) {
      dragDepth = 0;
      overlay.classList.add('hidden');
    }
  });
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    dragDepth = 0;
    overlay.classList.add('hidden');
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  });

  document.getElementById('btnExportCards').addEventListener('click', (e) => {
    e.stopPropagation();
    exportMenu.classList.toggle('hidden');
  });
  exportMenu.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      exportMenu.classList.add('hidden');
      if (!state.docId) return toast('请先打开一篇论文');
      exportAll(btn.dataset.format, { review: true, flashcards: true, notes: true });
      toast('已导出知识库卡片');
    });
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.export-wrap')) exportMenu.classList.add('hidden');
  });

  on('doc', () => {
    document.getElementById('docTitle').textContent = (state.docName || '—').replace(/\.pdf$/i, '');
  });
}
