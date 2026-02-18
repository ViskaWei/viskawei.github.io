/** Default fallback card — floating geometric shapes with soft glows */

import { observeVisibility, setupCanvas, animationLoop, PALETTE_ARRAY, hexToRgba } from './_shared';

interface Shape {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotSpeed: number;
  type: 'circle' | 'diamond' | 'triangle';
  pulse: number;
  pulseSpeed: number;
}

export function initDefault(container: HTMLElement): void {
  observeVisibility(container, () => {
    const { canvas, ctx, width, height } = setupCanvas(container);

    const shapes: Shape[] = Array.from({ length: 15 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.35,
      size: 10 + Math.random() * 20,
      color: PALETTE_ARRAY[Math.floor(Math.random() * PALETTE_ARRAY.length)],
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.012,
      type: (['circle', 'diamond', 'triangle'] as const)[Math.floor(Math.random() * 3)],
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.015 + Math.random() * 0.02,
    }));

    const stop = animationLoop(() => {
      // Gradient bg
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, 'rgba(248,246,255,0.85)');
      grad.addColorStop(1, 'rgba(242,240,252,0.85)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Draw connections between nearby shapes
      ctx.lineWidth = 0.5;
      for (let i = 0; i < shapes.length; i++) {
        for (let j = i + 1; j < shapes.length; j++) {
          const dx = shapes[i].x - shapes[j].x;
          const dy = shapes[i].y - shapes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            const fade = 1 - dist / 100;
            ctx.strokeStyle = hexToRgba(shapes[i].color, fade * 0.08);
            ctx.beginPath();
            ctx.moveTo(shapes[i].x, shapes[i].y);
            ctx.lineTo(shapes[j].x, shapes[j].y);
            ctx.stroke();
          }
        }
      }

      for (const s of shapes) {
        s.x += s.vx;
        s.y += s.vy;
        s.rotation += s.rotSpeed;
        s.pulse += s.pulseSpeed;

        if (s.x < -20) s.x = width + 20;
        if (s.x > width + 20) s.x = -20;
        if (s.y < -20) s.y = height + 20;
        if (s.y > height + 20) s.y = -20;

        const pulseScale = 1 + Math.sin(s.pulse) * 0.1;
        const size = s.size * pulseScale;

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rotation);

        // Glow
        ctx.shadowColor = hexToRgba(s.color, 0.35);
        ctx.shadowBlur = 10;

        ctx.fillStyle = hexToRgba(s.color, 0.22);
        ctx.strokeStyle = hexToRgba(s.color, 0.4);
        ctx.lineWidth = 1.5;

        if (s.type === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, size, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (s.type === 'diamond') {
          ctx.beginPath();
          ctx.moveTo(0, -size);
          ctx.lineTo(size, 0);
          ctx.lineTo(0, size);
          ctx.lineTo(-size, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.moveTo(0, -size);
          ctx.lineTo(size * 0.87, size * 0.5);
          ctx.lineTo(-size * 0.87, size * 0.5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        ctx.restore();
      }
    }, 30);

    return () => {
      stop();
      canvas.remove();
    };
  });
}
