import { store } from '../store/storage.js';
import { chatCompletion, AIError } from '../ai/openai-client.js';
import { toast } from '../ui/toast.js';

let el = null;

function render() {
  if (!el) return;
  el.replaceChildren();
  const s = store.getSettings();

  const mk = (label, hint) => {
    const row = document.createElement('div');
    row.className = 'form-row';
    const l = document.createElement('label');
    l.className = 'caps';
    l.textContent = label;
    row.appendChild(l);
    if (hint) {
      const h = document.createElement('div');
      h.className = 'form-hint';
      h.textContent = hint;
      row.appendChild(h);
    }
    return row;
  };

  const urlRow = mk('API Base URL', 'OpenAI 兼容接口地址，如 https://api.openai.com/v1');
  const urlInput = document.createElement('input');
  urlInput.className = 'field-input';
  urlInput.type = 'text';
  urlInput.value = s.apiBaseUrl || '';
  urlRow.appendChild(urlInput);

  const keyRow = mk('API Key', '仅保存在本机浏览器 localStorage，不会上传或导出');
  const keyInput = document.createElement('input');
  keyInput.className = 'field-input';
  keyInput.type = 'password';
  keyInput.value = s.apiKey || '';
  keyRow.appendChild(keyInput);

  const modelRow = mk('Model', '留空则使用 gpt-4o-mini');
  const modelInput = document.createElement('input');
  modelInput.className = 'field-input';
  modelInput.type = 'text';
  modelInput.value = s.model || '';
  modelRow.appendChild(modelInput);

  const streamRow = document.createElement('label');
  streamRow.className = 'check-row';
  const streamCb = document.createElement('input');
  streamCb.type = 'checkbox';
  streamCb.checked = s.stream !== false;
  streamRow.append(streamCb, document.createTextNode('启用流式输出'));

  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.gap = '8px';
  actions.style.margin = '14px 0';
  const save = document.createElement('button');
  save.className = 'btn dark';
  save.textContent = '保存设置';
  save.addEventListener('click', () => {
    store.setSettings({
      apiBaseUrl: urlInput.value.trim(),
      apiKey: keyInput.value.trim(),
      model: modelInput.value.trim(),
      stream: streamCb.checked,
    });
    toast('设置已保存');
  });
  const test = document.createElement('button');
  test.className = 'btn';
  test.textContent = '测试连接';
  test.addEventListener('click', async () => {
    save.click();
    test.textContent = '测试中…';
    try {
      const out = await chatCompletion({
        messages: [{ role: 'user', content: 'reply with the single word: ok' }],
      });
      toast('连接成功：' + out.slice(0, 40));
    } catch (err) {
      toast(err instanceof AIError ? err.message : '连接失败：' + err.message, 4000);
    } finally {
      test.textContent = '测试连接';
    }
  });
  actions.append(save, test);

  const usage = document.createElement('div');
  usage.className = 'form-hint';
  usage.textContent = `本地存储用量：约 ${(store.usageBytes() / 1024).toFixed(1)} KB`;

  const clear = document.createElement('button');
  clear.className = 'btn';
  clear.style.marginTop = '10px';
  clear.textContent = '清空全部本地数据';
  clear.addEventListener('click', () => {
    if (confirm('将删除所有设置、综述缓存、闪卡、笔记与聊天记录，确定？')) {
      store.clearAll();
      toast('本地数据已清空');
      setTimeout(() => location.reload(), 800);
    }
  });

  el.append(urlRow, keyRow, modelRow, streamRow, actions, usage, clear);
}

export const settingsPanel = {
  mount(container) {
    el = container;
    render();
  },
  refresh: render,
};
