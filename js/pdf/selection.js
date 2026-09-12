import { state } from '../state.js';
import { getHost } from './viewer.js';
import { showPopover } from '../ui/explain-popover.js';

export function initSelection() {
  const host = getHost();
  host.addEventListener('mouseup', () => {
    setTimeout(() => {
      const sel = window.getSelection();
      const text = sel?.toString().replace(/\s+/g, ' ').trim();
      if (!text || text.length < 3) return;
      if (!sel.anchorNode || !host.contains(sel.anchorNode)) return;
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (!rect.width && !rect.height) return;
      showPopover({ text, page: state.currentPage, rect });
    }, 0);
  });
}
