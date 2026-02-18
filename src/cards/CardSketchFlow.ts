/** Sketch & Scale card — data points flowing through compression pipeline */

import { observeVisibility, setupCanvas, animationLoop, MONET_PALETTE, hexToRgba } from './_shared';

interface Dot {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  color: string;
  size: number;
  phase: number;
  origSize: number;
}

export function initSketchFlow(container: HTMLElement): void {
  observeVisibility(container, () => {
    const { canvas, ctx, width, height } = setupCanvas(container);
    const colors = [MONET_PALETTE.sky, MONET_PALETTE.mint, MONET_PALETTE.lavender, MONET_PALETTE.rose];

    const N = 60;
    const stages = [
      { label: 'Raw', cx: width * 0.15, spread: 0.13 },
      { label: 'PCA', cx: width * 0.38, spread: 0.09 },
      { label: 'Sketch', cx: width * 0.62, spread: 0.06 },
      { label: 'UMAP', cx: width * 0.85, spread: 0.035 },
    ];

    const dots: Dot[] = [];
    for (let i = 0; i < N; i++) {
      const stage = stages[0];
      const baseSize = 2.5 + Math.random() * 3.5;
      dots.push({
        x: stage.cx + (Math.random() - 0.5) * width * stage.spread * 2,
        y: height * 0.45 + (Math.random() - 0.5) * height * 0.55,
        targetX: 0,
        targetY: 0,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: baseSize,
        origSize: baseSize,
        phase: 0,
      });
    }

    let time = 0;
    let transitionProgress = 0;

    function setTargets(phase: number) {
      const stage = stages[phase];
      for (const d of dots) {
        d.phase = phase;
        d.targetX = stage.cx + (Math.random() - 0.5) * width * stage.spread * 2;
        d.targetY = height * 0.45 + (Math.random() - 0.5) * height * (0.55 - phase * 0.1);
      }
      transitionProgress = 0;
    }

    setTargets(0);

    const stop = animationLoop(() => {
      time++;
      transitionProgress = Math.min(transitionProgress + 0.015, 1);

      // Cycle stages every ~3.5 seconds
      if (time % 105 === 0) {
        const nextPhase = (dots[0].phase + 1) % 4;
        setTargets(nextPhase);
      }

      ctx.clearRect(0, 0, width, height);

      // Background gradient
      const bg = ctx.createLinearGradient(0, 0, width, height);
      bg.addColorStop(0, 'rgba(248,246,255,0.7)');
      bg.addColorStop(1, 'rgba(245,243,252,0.7)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Stage labels
      ctx.font = '600 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      for (let i = 0; i < stages.length; i++) {
        const s = stages[i];
        const isActive = dots[0].phase === i;
        ctx.fillStyle = isActive ? hexToRgba(MONET_PALETTE.lavender, 0.9) : 'rgba(136,136,170,0.5)';
        ctx.fillText(s.label, s.cx, height - 10);
      }

      // Arrows between stages
      ctx.lineWidth = 1;
      for (let i = 0; i < stages.length - 1; i++) {
        const x1 = stages[i].cx + 28;
        const x2 = stages[i + 1].cx - 28;
        const y = height - 12;
        ctx.strokeStyle = 'rgba(196,181,224,0.25)';
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.stroke();
        // Arrowhead
        ctx.beginPath();
        ctx.moveTo(x2, y);
        ctx.lineTo(x2 - 5, y - 3);
        ctx.lineTo(x2 - 5, y + 3);
        ctx.closePath();
        ctx.fillStyle = 'rgba(196,181,224,0.25)';
        ctx.fill();
      }

      // Draw trails and dots
      for (const d of dots) {
        const ease = 0.06;
        const prevX = d.x;
        const prevY = d.y;
        d.x += (d.targetX - d.x) * ease;
        d.y += (d.targetY - d.y) * ease;

        // Subtle motion trail
        if (transitionProgress < 0.8) {
          ctx.beginPath();
          ctx.moveTo(prevX, prevY);
          ctx.lineTo(d.x, d.y);
          ctx.strokeStyle = hexToRgba(d.color, 0.15);
          ctx.lineWidth = d.size * 0.6;
          ctx.stroke();
        }

        // Dot with glow
        ctx.save();
        ctx.shadowColor = hexToRgba(d.color, 0.4);
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(d.color, 0.65);
        ctx.fill();
        ctx.restore();
      }
    }, 30);

    return () => {
      stop();
      canvas.remove();
    };
  });
}
