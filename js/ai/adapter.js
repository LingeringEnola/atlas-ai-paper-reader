import { state } from '../state.js';
import { store, SAMPLE_DOC_ID } from '../store/storage.js';
import { demoReview, demoTocBullets, demoChat } from '../data/demo-data.js';
import { matchExplain, matchChat } from '../data/demo-match.js';
import { chatCompletion, parseJsonLoose, AIError } from './openai-client.js';
import * as P from './prompts.js';

export { AIError };

export class AIDisabledError extends Error {
  constructor() {
    super('演示模式仅支持示例论文；请在设置中配置 OpenAI 兼容接口以启用 AI 功能');
    this.name = 'AIDisabledError';
  }
}

function apiConfigured() {
  const s = store.getSettings();
  return !!(s.apiBaseUrl && s.apiKey);
}

function ensureEnabled() {
  if (apiConfigured()) return 'api';
  if (state.docId === SAMPLE_DOC_ID) return 'demo';
  throw new AIDisabledError();
}

function chunkText(text, budgetChars = 24000) {
  const chunks = [];
  const paras = text.split(/\n{2,}/);
  let cur = '';
  for (const p of paras) {
    if ((cur + p).length > budgetChars && cur) {
      chunks.push(cur);
      cur = '';
    }
    cur += p + '\n\n';
  }
  if (cur.trim()) chunks.push(cur);
  return chunks.length ? chunks : [text.slice(0, budgetChars)];
}

async function mapReduce(points, title, onProgress) {
  const all = [];
  for (let i = 0; i < points.length; i++) {
    onProgress?.(i + 1, points.length);
    const raw = await chatCompletion({ messages: P.reviewChunkPrompt(points[i], i, points.length) });
    try {
      all.push(...(parseJsonLoose(raw).points || []));
    } catch { /* skip bad chunk */ }
  }
  const raw = await chatCompletion({ messages: P.reviewReducePrompt(title, JSON.stringify(all)) });
  return parseJsonLoose(raw);
}

export async function explain(selectedText, ctx = {}, onDelta) {
  const mode = ensureEnabled();
  if (mode === 'demo') {
    const hit = matchExplain(selectedText);
    const text =
      hit ||
      `该选文出自第 ${ctx.page || '?'} 页${ctx.sectionTitle ? `《${ctx.sectionTitle}》` : ''}。` +
        '在演示模式下，ATLAS 仅内置了示例论文关键术语的解释；配置 OpenAI 兼容接口后，可对任意选文生成逐句解释。';
    onDelta?.(text, text);
    return text;
  }
  return chatCompletion({
    messages: P.explainPrompt(selectedText, ctx.context || ''),
    onDelta,
    signal: ctx.signal,
  });
}

export async function summarizeSections(sections, onProgress) {
  const mode = ensureEnabled();
  if (mode === 'demo') {
    const out = {};
    for (const s of sections) if (demoTocBullets[s.title]) out[s.title] = demoTocBullets[s.title];
    return out;
  }
  const raw = await chatCompletion({ messages: P.summarizePrompt(sections) });
  const parsed = parseJsonLoose(raw);
  onProgress?.(1, 1);
  return parsed;
}

export async function generateReview(docInfo, onProgress) {
  const mode = ensureEnabled();
  if (mode === 'demo') {
    onProgress?.(1, 1);
    return JSON.parse(JSON.stringify(demoReview));
  }
  const chunks = chunkText(docInfo.fullText || '');
  onProgress?.(0, chunks.length + 1);
  const review = await mapReduce(chunks, docInfo.title || state.docName, onProgress);
  review.source = 'api';
  review.updatedAt = new Date().toISOString();
  return review;
}

export async function chat(history, quote, ctx = {}) {
  const mode = ensureEnabled();
  const last = history[history.length - 1]?.content || '';
  if (mode === 'demo') {
    const hit = matchChat(last);
    if (hit) return hit;
    const fallback =
      demoChat[0].a && quote
        ? `演示模式下我仅能回答与示例论文预置问题相近的提问。你选中的这段文字与论文的核心论证相关：可参考综述面板中的双语要点，或配置 OpenAI 兼容接口后获得针对性回答。`
        : '演示模式下我仅能回答与示例论文预置问题相近的提问，例如："这篇文章的核心结论是什么？"。配置 OpenAI 兼容接口后可自由提问。';
    return fallback;
  }
  return chatCompletion({
    messages: P.chatPrompt(history, quote, ctx.context || ''),
    signal: ctx.signal,
  });
}
