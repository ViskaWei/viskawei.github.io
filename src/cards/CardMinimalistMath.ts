/** IPS Unlabeled Particle card — drifting math symbols with gentle connections */

import { observeVisibility, setupCanvas, animationLoop, MONET_PALETTE, hexToRgba } from './_shared';

interface Symbol {
  char: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  baseOpacity: number;
  pulse: number;
  pulseSpeed: number;
}

const MATH_SYMBOLS = ['\u222B', '\u2207', '\u03A3', '\u2202', '\u221E', '\u0394', '\u03C0', '\u03BB', '\u03C6', '\u2211', '\u222C', '\u2208', '\u2200', '\u2203', '\u03B1', '\u03B2'];

export function initMinimalistMath(container: HTMLElement): void {
  observeVisibility(container, () => {
    const { canvas, ctx, width, height } = setupCanvas(container);
    const colors = [MONET_PALETTE.lavender, MONET_PALETTE.sky, MONET_PALETTE.mint];

    const symbols: Symbol[] = Array.from({ length: 22 }, () => {
      const baseOpacity = 0.2 + Math.random() * 0.35;
      return {
        char: MATH_SYMBOLS[Math.floor(Math.random() * MATH_SYMBOLS.length)],
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.3,
        size: 18 + Math.random() * 28,
        opacity: baseOpacity,
        baseOpacity,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.01 + Math.random() * 0.02,
      };
    });

    let time = 0;

    const stop = animationLoop(() => {
      time++;
      ctx.clearRect(0, 0, width, height);

      // Soft white bg with subtle gradient
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#fefefe');
      grad.addColorStop(1, '#f8f6ff');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Draw faint connecting lines between nearby symbols
      ctx.lineWidth = 0.5;
      for (let i = 0; i < symbols.length; i++) {
        for (let j = i + 1; j < symbols.length; j++) {
          const dx = symbols[i].x - symbols[j].x;
          const dy = symbols[i].y - symbols[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const fade = 1 - dist / 120;
            ctx.strokeStyle = hexToRgba(symbols[i].color, fade * 0.08);
            ctx.beginPath();
            ctx.moveTo(symbols[i].x, symbols[i].y);
            ctx.lineTo(symbols[j].x, symbols[j].y);
            ctx.stroke();
          }
        }
      }

      for (const s of symbols) {
        s.x += s.vx;
        s.y += s.vy;
        s.pulse += s.pulseSpeed;
        s.opacity = s.baseOpacity + Math.sin(s.pulse) * 0.08;

        if (s.x < -30) s.x = width + 30;
        if (s.x > width + 30) s.x = -30;
        if (s.y < -30) s.y = height + 30;
        if (s.y > height + 30) s.y = -30;

        // Glow effect
        ctx.save();
        ctx.shadowColor = hexToRgba(s.color, 0.3);
        ctx.shadowBlur = 12;
        ctx.font = `300 ${s.size}px "Inter", sans-serif`;
        ctx.fillStyle = hexToRgba(s.color, s.opacity);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(s.char, s.x, s.y);
        ctx.restore();
      }
    }, 30);

    return () => {
      stop();
      canvas.remove();
    };
  });
}
