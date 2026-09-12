export const SYSTEM_ZH =
  'You are ATLAS, an academic reading assistant. Always answer in Simplified Chinese unless the user explicitly asks for English. Be precise, cite the paper\'s own terms, and keep answers concise.';

export function explainPrompt(selectedText, context) {
  return [
    { role: 'system', content: SYSTEM_ZH },
    {
      role: 'user',
      content:
        `请解释下面这段论文选文（出自当前打开的论文）。\n` +
        (context ? `所在章节上下文：\n"""\n${context}\n"""\n` : '') +
        `选文：\n"""\n${selectedText}\n"""\n` +
        '要求：先用一句话概括选文在论证中的位置，再解释其中的关键概念与机制，最后指出它对全文结论的意义。总长 120-220 字。',
    },
  ];
}

export function summarizePrompt(sections) {
  const body = sections
    .map((s) => `## ${s.title}\n${s.text.slice(0, 1500)}`)
    .join('\n\n');
  return [
    {
      role: 'system',
      content:
        'You output ONLY valid JSON, no fences, no commentary. Schema: {"<section title>": ["中文要点1", "中文要点2"], ...}. Each section gets 2-3 bullets, each bullet <= 24 Chinese characters.',
    },
    {
      role: 'user',
      content: `为下列论文章节各生成 2-3 条中文要点：\n\n${body}`,
    },
  ];
}

export function reviewChunkPrompt(chunk, index, total) {
  return [
    {
      role: 'system',
      content:
        'You output ONLY valid JSON, no fences. Schema: {"points": [{"en": "...", "zh": "..."}]}. Extract 3-6 key points from the given paper fragment, each point one sentence in English plus its Chinese translation.',
    },
    { role: 'user', content: `Paper fragment ${index + 1}/${total}:\n"""\n${chunk}\n"""` },
  ];
}

export function reviewReducePrompt(title, pointsJson) {
  return [
    {
      role: 'system',
      content:
        'You output ONLY valid JSON, no fences. Schema: {"title": {"en": "", "zh": ""}, "authors": {"en": "", "zh": ""}, "venue": {"en": "", "zh": ""}, "sections": [{"no": "I", "titleEn": "", "titleZh": "", "rows": [{"en": "", "zh": ""}]}]}. Sections: I Research Question 研究问题, II Core Methodology 核心方法, III Main Findings 主要发现, IV Wages and Inequality 工资与不平等, V Limitations and Outlook 局限与展望. Each section 2-3 rows.',
    },
    {
      role: 'user',
      content: `Paper title: ${title}\n\nKey points extracted from the paper:\n${pointsJson}\n\nCompose the structured bilingual review now.`,
    },
  ];
}

export function chatPrompt(history, quote, context) {
  const messages = [{ role: 'system', content: SYSTEM_ZH }];
  if (context) messages.push({ role: 'system', content: `Paper context for this conversation:\n"""\n${context}\n"""` });
  for (const m of history.slice(-10)) messages.push({ role: m.role, content: m.content });
  if (quote) messages.push({ role: 'system', content: `User's current selection from the paper:\n"""\n${quote}\n"""` });
  return messages;
}
