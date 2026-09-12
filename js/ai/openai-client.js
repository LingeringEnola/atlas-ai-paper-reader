import { store } from '../store/storage.js';

export class AIError extends Error {}

function baseUrl() {
  let base = (store.getSettings().apiBaseUrl || '').trim().replace(/\/+$/, '');
  if (!base) throw new AIError('未配置 API Base URL');
  if (!/\/v\d+$/.test(base) && !base.endsWith('/chat/completions')) base += '/v1';
  return base;
}

export function parseJsonLoose(text) {
  const cleaned = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const start = Math.min(
    ...[cleaned.indexOf('{'), cleaned.indexOf('[')]
      .filter((i) => i >= 0)
      .concat([0])
  );
  const end = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function postOnce(url, body, signal, onDelta) {
  const settings = store.getSettings();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) {
    const bodyText = (await res.text().catch(() => '')).slice(0, 300);
    if (res.status === 401) throw new AIError('API Key 无效（401），请在设置中检查');
    if (res.status === 429) throw new AIError('请求过于频繁或额度不足（429）');
    if (res.status === 404) return { retryWithV1: true, status: 404 };
    throw new AIError(`API 请求失败（${res.status}）：${bodyText}`);
  }
  if (!body.stream) {
    const json = await res.json();
    return { text: json.choices?.[0]?.message?.content || '' };
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let full = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const chunks = buf.split('\n\n');
    buf = chunks.pop();
    for (const chunk of chunks) {
      const line = chunk.split('\n').find((l) => l.startsWith('data:'));
      if (!line) continue;
      const payload = line.slice(5).trim();
      if (payload === '[DONE]') continue;
      try {
        const delta = JSON.parse(payload).choices?.[0]?.delta?.content || '';
        if (delta) {
          full += delta;
          onDelta?.(delta, full);
        }
      } catch { /* keep-alive line */ }
    }
  }
  return { text: full };
}

export async function chatCompletion({ messages, onDelta, signal }) {
  const settings = store.getSettings();
  if (!settings.apiBaseUrl || !settings.apiKey) {
    throw new AIError('未配置 AI 接口：请先填写 API Base URL 与 API Key');
  }
  const wantStream = settings.stream !== false && !!onDelta;
  const body = {
    model: settings.model || 'gpt-4o-mini',
    messages,
    stream: wantStream,
    temperature: 0.3,
  };
  let url = baseUrl() + '/chat/completions';
  try {
    let out = await postOnce(url, body, signal, onDelta);
    if (out?.retryWithV1) {
      url = store.getSettings().apiBaseUrl.trim().replace(/\/+$/, '') + '/chat/completions';
      out = await postOnce(url, body, signal, onDelta);
      if (out?.retryWithV1) throw new AIError('找不到 chat/completions 端点（404），请检查 Base URL');
    }
    return out.text;
  } catch (err) {
    if (err instanceof AIError) throw err;
    if (err.name === 'AbortError') throw err;
    throw new AIError('网络或 CORS 错误：请检查接口是否允许浏览器直连（' + err.message + '）');
  }
}
