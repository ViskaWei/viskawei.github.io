/** Shared utilities for project card animations */

export const MONET_PALETTE = {
  lavender: '#c4b5e0',
  sky: '#a0c8e8',
  mint: '#a8dbc5',
  yellow: '#f0e6a0',
  rose: '#e8b4c8',
} as const;

export const PALETTE_ARRAY = Object.values(MONET_PALETTE);

export function setupCanvas(container: HTMLElement): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
} {
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;
  const rect = container.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio, 1.5);
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  ctx.scale(dpr, dpr);
  return { canvas, ctx, width: rect.width, height: rect.height };
}

export function animationLoop(
  callback: (time: number) => void,
  fps: number = 30
): () => void {
  let animId: number;
  let lastTime = 0;
  const interval = 1000 / fps;

  function tick(time: number) {
    animId = requestAnimationFrame(tick);
    if (time - lastTime < interval) return;
    lastTime = time;
    callback(time);
  }

  animId = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(animId);
}

export function observeVisibility(
  element: HTMLElement,
  onVisible: () => (() => void),
): void {
  let cleanup: (() => void) | null = null;

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting && !cleanup) {
        cleanup = onVisible();
      } else if (!entry.isIntersecting && cleanup) {
        cleanup();
        cleanup = null;
      }
    }
  }, { threshold: 0.1 });

  observer.observe(element);
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
