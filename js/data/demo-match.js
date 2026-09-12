import { demoExplains, demoChat } from './demo-data.js';

export function normalize(text) {
  return text
    .toLowerCase()
    .replace(/-\s*\n?\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(text) {
  return new Set(
    normalize(text)
      .split(/[^a-z0-9'\u4e00-\u9fff]+/)
      .filter((t) => t.length > 2)
  );
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

export function matchExplain(selectedText) {
  const sel = normalize(selectedText);
  let best = null;
  let bestScore = 0;
  for (const entry of demoExplains) {
    const key = normalize(entry.match);
    if (sel.includes(key)) return entry.zh;
    const score = jaccard(tokens(key), tokens(sel));
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  return best && bestScore > 0.4 ? best.zh : null;
}

export function matchChat(question) {
  const qt = tokens(question);
  let best = null;
  let bestScore = 0;
  for (const { q, a } of demoChat) {
    const score = jaccard(qt, tokens(q));
    if (score > bestScore) {
      bestScore = score;
      best = a;
    }
  }
  return bestScore > 0.2 ? best : null;
}
