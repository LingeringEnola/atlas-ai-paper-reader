export async function pageLines(pdf, n) {
  const page = await pdf.getPage(n);
  const tc = await page.getTextContent();
  const vp = page.getViewport({ scale: 1 });
  const rows = [];
  for (const it of tc.items) {
    if (!it.str || !it.str.trim()) continue;
    const y = it.transform[5];
    const h = it.height || Math.abs(it.transform[3]) || 10;
    let row = rows.find((r) => Math.abs(r.y - y) <= 2.5);
    if (!row) {
      row = { y, height: 0, parts: [] };
      rows.push(row);
    }
    row.height = Math.max(row.height, h);
    row.parts.push({ x: it.transform[4], str: it.str });
  }
  const lines = rows
    .map((r) => ({
      y: r.y,
      height: r.height,
      pageWidth: vp.width,
      pageHeight: vp.height,
      text: r.parts
        .sort((a, b) => a.x - b.x)
        .map((p) => p.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim(),
    }))
    .filter((l) => l.text);
  lines.sort((a, b) => b.y - a.y);
  return lines;
}

export async function pageText(pdf, n) {
  const lines = await pageLines(pdf, n);
  return lines.map((l) => l.text).join('\n');
}

export async function sectionTexts(pdf, toc, maxChars = 6000) {
  const l1 = toc.filter((t) => t.level <= 1);
  const out = [];
  for (let i = 0; i < l1.length; i++) {
    const from = l1[i].page;
    const to = i + 1 < l1.length ? Math.max(from, l1[i + 1].page - 1) : pdf.numPages;
    let text = '';
    for (let p = from; p <= to && text.length < maxChars; p++) {
      text += (await pageText(pdf, p)) + '\n';
    }
    out.push({ title: l1[i].title, page: from, text: text.slice(0, maxChars) });
  }
  return out;
}

export async function fullText(pdf, maxChars = 200000) {
  let text = '';
  for (let p = 1; p <= pdf.numPages && text.length < maxChars; p++) {
    text += (await pageText(pdf, p)) + '\n\n';
  }
  return text;
}
