const el = document.getElementById('toast');
let timer = null;

export function toast(msg, ms = 2400) {
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(timer);
  timer = setTimeout(() => el.classList.add('hidden'), ms);
}
