const VERSION = '4.10.38';
const CDNS = [
  `https://cdn.jsdelivr.net/npm/pdfjs-dist@${VERSION}/legacy/build/`,
  `https://unpkg.com/pdfjs-dist@${VERSION}/legacy/build/`,
];

let promise = null;

export function loadPdfjs() {
  if (!promise) {
    promise = (async () => {
      for (const base of CDNS) {
        try {
          const mod = await import(/* @vite-ignore */ base + 'pdf.min.mjs');
          mod.GlobalWorkerOptions.workerSrc = base + 'pdf.worker.min.mjs';
          return mod;
        } catch {
          // try next CDN
        }
      }
      throw new Error('pdf.js 加载失败，请检查网络后重试');
    })();
  }
  return promise;
}
