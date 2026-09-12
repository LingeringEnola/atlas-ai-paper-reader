const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

let currentPage = 2;
let zoom = 115;
let selectedText = $('.selectable.selected').textContent.trim();
let toastTimer;

function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
}

function updatePage() {
  $('#pageNumber').textContent = currentPage;
  $('#pageProgress').textContent = `${currentPage} / 58`;
  $('#progressBar').style.width = `${(currentPage / 58) * 100}%`;
}

function download(filename, content) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

$$('[data-left-tab]').forEach(button => button.addEventListener('click', () => {
  $$('[data-left-tab]').forEach(item => { item.classList.toggle('active', item === button); item.setAttribute('aria-selected', item === button); });
  $$('.left-view').forEach(view => view.classList.remove('active'));
  $(`#${button.dataset.leftTab}View`).classList.add('active');
}));

$$('.toc-list button').forEach(button => button.addEventListener('click', () => {
  const target = $(`#${button.dataset.target}`);
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  $$('.toc-heading').forEach(item => item.classList.remove('active'));
  (button.classList.contains('toc-heading') ? button : button.previousElementSibling)?.classList.add('active');
}));

$('#prevPage').addEventListener('click', () => { currentPage = Math.max(1, currentPage - 1); updatePage(); });
$('#nextPage').addEventListener('click', () => { currentPage = Math.min(58, currentPage + 1); updatePage(); });
$('#zoomOut').addEventListener('click', () => { zoom = Math.max(80, zoom - 5); $('#zoomValue').textContent = `${zoom}%`; $('#paper').style.width = `${zoom / 1.15 * 100}%`; });
$('#zoomIn').addEventListener('click', () => { zoom = Math.min(160, zoom + 5); $('#zoomValue').textContent = `${zoom}%`; $('#paper').style.width = `${zoom / 1.15 * 100}%`; });
$('#fitWidth').addEventListener('click', () => { zoom = 100; $('#zoomValue').textContent = '100%'; $('#paper').style.width = '100%'; toast('已适应可用宽度'); });
$('#translateMode').addEventListener('click', event => { event.currentTarget.classList.toggle('active'); toast(event.currentTarget.classList.contains('active') ? '双语辅助已开启' : '双语辅助已关闭'); });
$('#scrollMode').addEventListener('click', () => toast('当前为连续滚动模式'));

const explanations = [
  '这段话建立了全文的估算框架：AI 的宏观影响由受影响任务比例与任务层面的平均成本节约共同决定。因此，微观层面的效率提升不会自动等比例转化为整体经济增长。',
  '作者使用现有的任务暴露度与生产率证据估算，十年内全要素生产率提升不超过 0.66%。这个结果并非否认 AI 的价值，而是提醒我们区分局部效率与总量增长。',
  '这里强调分配效应：AI 可能提高低技能劳动者在部分任务上的效率，但不一定缩小劳动收入不平等；资本所有权与任务替代仍会影响最终收益分配。',
  '任务模型把生产拆解为不同活动，并比较资本与劳动在每类任务上的优势。AI 改变的是任务边界，工资与产出因此会沿不同渠道变化。',
  '均衡分析同时考虑生产率效应与替代效应：技术让产出更高，却也可能把原本由劳动完成的任务转交给资本。',
  'AI 的四条路径并不等价。自动化主要替代既有任务，互补增强人的工作，新任务则决定技术是否扩展人类可以创造的经济价值。'
];

$$('.selectable').forEach((paragraph, index) => paragraph.addEventListener('click', () => {
  $$('.selectable').forEach(item => item.classList.remove('selected'));
  paragraph.classList.add('selected');
  selectedText = paragraph.textContent.trim();
  $('#aiText').textContent = explanations[index % explanations.length];
  $('#aiCard').classList.remove('hidden');
}));
$('#closeAi').addEventListener('click', () => $('#aiCard').classList.add('hidden'));

$$('[data-action]').forEach(button => button.addEventListener('click', async () => {
  const action = button.dataset.action;
  if (action === 'copy') {
    await navigator.clipboard?.writeText($('#aiText').textContent);
    toast('解释已复制');
  }
  if (action === 'flashcard') {
    const list = $('#flashcardList');
    list.innerHTML = `<div class="flashcard"><b>问题</b><p>${selectedText.slice(0, 92)}…</p><b>要点</b><p>${$('#aiText').textContent}</p></div>`;
    toast('已加入闪卡');
  }
  if (action === 'note') {
    $('#notesArea').value += `${$('#notesArea').value ? '\n\n' : ''}${$('#aiText').textContent}`;
    toast('已加入笔记');
  }
  if (action === 'chat') {
    $('[data-review-tab="chat"]').click();
    $('[data-mobile-pane="review"]').click();
    setTimeout(() => $('#chatInput').focus(), 150);
  }
}));

$$('[data-review-tab]').forEach(button => button.addEventListener('click', () => {
  $$('[data-review-tab]').forEach(item => item.classList.toggle('active', item === button));
  $$('.review-view').forEach(view => view.classList.remove('active'));
  $(`#${button.dataset.reviewTab}View`).classList.add('active');
}));

$('#editReview').addEventListener('click', event => {
  const content = $('#reviewContent');
  const editing = content.getAttribute('contenteditable') === 'true';
  content.setAttribute('contenteditable', String(!editing));
  event.currentTarget.textContent = editing ? '编辑' : '完成';
  if (!editing) content.focus();
});
$('#copyReview').addEventListener('click', async () => { await navigator.clipboard?.writeText($('#reviewContent').innerText); toast('综述已复制'); });
$('#exportReview').addEventListener('click', () => { download('AI论文结构化综述.txt', $('#reviewContent').innerText); toast('综述已导出'); });
$('#exportCard').addEventListener('click', () => { download('Atlas知识库卡片.txt', `标题：The Simple Macroeconomics of AI\n作者：Daron Acemoglu\n\n核心结论：\n${$('#aiText').textContent}\n\n结构化综述：\n${$('#reviewContent').innerText}`); toast('知识库卡片已导出'); });
$('#sendQuestion').addEventListener('click', () => { const value = $('#chatInput').value.trim(); if (!value) return toast('请先输入问题'); toast('已基于论文生成回答'); $('#chatInput').value = ''; });

$$('[data-mobile-pane]').forEach(button => button.addEventListener('click', () => {
  $$('[data-mobile-pane]').forEach(item => item.classList.toggle('active', item === button));
  $$('[data-pane]').forEach(pane => pane.classList.toggle('mobile-active', pane.dataset.pane === button.dataset.mobilePane));
}));

if (window.innerWidth <= 760) $('[data-pane="reader"]').classList.add('mobile-active');
window.addEventListener('resize', () => { if (window.innerWidth <= 760 && !$('.mobile-active')) $('[data-pane="reader"]').classList.add('mobile-active'); });

// Expose the reader's core actions to browsers that support WebMCP.
(() => {
  const context = document.modelContext;
  if (!context?.registerTool) return;
  const sections = ['abstract', 'framework', 'equilibrium', 'production', 'wages'];
  const register = tool => Promise.resolve(context.registerTool(tool)).catch(() => {});

  register({
    name: 'navigate_paper_section',
    title: '跳转到论文章节',
    description: '在 Atlas 阅读器中跳转到一个已知的论文章节。',
    inputSchema: { type: 'object', properties: { section: { type: 'string', enum: sections } }, required: ['section'], additionalProperties: false },
    annotations: { readOnlyHint: true, untrustedContentHint: false },
    execute(input) {
      if (!input || !sections.includes(input.section)) throw new Error('未知章节');
      $(`#${input.section}`).scrollIntoView({ behavior: 'smooth', block: 'start' });
      return { section: input.section, status: 'visible' };
    }
  });

  register({
    name: 'save_reader_note',
    title: '保存阅读笔记',
    description: '把一段文字加入 Atlas 当前论文的阅读笔记。',
    inputSchema: { type: 'object', properties: { note: { type: 'string', minLength: 1, maxLength: 2000 } }, required: ['note'], additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute(input) {
      if (!input || typeof input.note !== 'string' || !input.note.trim() || input.note.length > 2000) throw new Error('笔记内容无效');
      const area = $('#notesArea');
      area.value += `${area.value ? '\n\n' : ''}${input.note.trim()}`;
      toast('已加入笔记');
      return { status: 'saved', characters: input.note.trim().length };
    }
  });
})();
