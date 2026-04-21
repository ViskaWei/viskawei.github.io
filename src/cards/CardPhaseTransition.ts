/** ICL task-diversity card — phase-transition animation for positive vs negative transfer */

import { observeVisibility, setupCanvas, animationLoop, MONET_PALETTE, hexToRgba } from './_shared';

interface Particle {
  offset: number;
  speed: number;
  size: number;
  branchBias: number;
  wobble: number;
}

function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function initPhaseTransition(container: HTMLElement): void {
  observeVisibility(container, () => {
    const { canvas, ctx, width, height } = setupCanvas(container);
    const critical = 0.58;
    const xMin = width * 0.08;
    const xMax = width * 0.78;

    const particles: Particle[] = Array.from({ length: 48 }, (_unused, index) => ({
      offset: index / 48,
      speed: 0.055 + (index % 5) * 0.005,
      size: 2.2 + (index % 4) * 0.5,
      branchBias: 0.25 + ((index * 17) % 19) / 22,
      wobble: ((index * 13) % 9) * 0.35,
    }));

    const targetY = (xNorm: number, time: number): number =>
      height * 0.69 - Math.sin(xNorm * 6.4 + time * 0.8) * 8 - xNorm * 14;

    const sourceY = (xNorm: number, time: number): number =>
      height * 0.29 + Math.cos(xNorm * 5.8 - time * 0.9) * 9 + xNorm * 16;

    function drawRibbon(
      path: (xNorm: number, time: number) => number,
      time: number,
      color: string,
      outerAlpha: number,
      coreAlpha: number,
    ): void {
      ctx.beginPath();
      for (let px = 0; px <= width; px += 4) {
        const xNorm = px / width;
        const y = path(xNorm, time);
        if (px === 0) ctx.moveTo(px, y);
        else ctx.lineTo(px, y);
      }
      ctx.lineWidth = 18;
      ctx.lineCap = 'round';
      ctx.strokeStyle = hexToRgba(color, outerAlpha);
      ctx.stroke();

      ctx.beginPath();
      for (let px = 0; px <= width; px += 4) {
        const xNorm = px / width;
        const y = path(xNorm, time);
        if (px === 0) ctx.moveTo(px, y);
        else ctx.lineTo(px, y);
      }
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = hexToRgba(color, coreAlpha);
      ctx.stroke();
    }

    const stop = animationLoop((timeMs) => {
      const time = timeMs * 0.001;
      const mix = 0.5 + 0.42 * Math.sin(time * 0.55);
      const shift = smoothstep(critical - 0.08, critical + 0.08, mix);
      const criticalPulse = Math.exp(-Math.abs(mix - critical) * 16) * (0.45 + 0.55 * Math.sin(time * 8) ** 2);

      const bg = ctx.createLinearGradient(0, 0, width, height);
      bg.addColorStop(0, 'rgba(250,248,255,0.96)');
      bg.addColorStop(0.48, 'rgba(246,245,252,0.92)');
      bg.addColorStop(1, 'rgba(255,251,247,0.94)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      const splitGlow = ctx.createLinearGradient(0, 0, width, 0);
      splitGlow.addColorStop(0, hexToRgba(MONET_PALETTE.mint, 0.05));
      splitGlow.addColorStop(critical, hexToRgba(MONET_PALETTE.lavender, 0.08));
      splitGlow.addColorStop(1, hexToRgba(MONET_PALETTE.rose, 0.06));
      ctx.fillStyle = splitGlow;
      ctx.fillRect(0, 0, width, height);

      drawRibbon(targetY, time, MONET_PALETTE.mint, 0.16 + (1 - shift) * 0.08, 0.38 + (1 - shift) * 0.16);
      drawRibbon(sourceY, time, MONET_PALETTE.rose, 0.08 + shift * 0.12, 0.14 + shift * 0.28);

      const criticalX = lerp(xMin, xMax, critical);
      ctx.beginPath();
      ctx.moveTo(criticalX, height * 0.12);
      ctx.lineTo(criticalX, height * 0.88);
      ctx.strokeStyle = hexToRgba(MONET_PALETTE.lavender, 0.22 + criticalPulse * 0.35);
      ctx.lineWidth = 1.3;
      ctx.setLineDash([4, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = hexToRgba(MONET_PALETTE.lavender, 0.72);
      ctx.fillText('nu_c', criticalX, height * 0.1);

      const gaugeY = height * 0.15;
      ctx.beginPath();
      ctx.moveTo(xMin, gaugeY);
      ctx.lineTo(xMax, gaugeY);
      ctx.strokeStyle = 'rgba(120, 118, 150, 0.18)';
      ctx.lineWidth = 2;
      ctx.stroke();

      const dotX = lerp(xMin, xMax, mix);
      const dotGlow = ctx.createRadialGradient(dotX, gaugeY, 0, dotX, gaugeY, 16);
      dotGlow.addColorStop(0, hexToRgba(shift > 0.5 ? MONET_PALETTE.rose : MONET_PALETTE.sky, 0.28));
      dotGlow.addColorStop(1, hexToRgba(MONET_PALETTE.lavender, 0));
      ctx.beginPath();
      ctx.arc(dotX, gaugeY, 16, 0, Math.PI * 2);
      ctx.fillStyle = dotGlow;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(dotX, gaugeY, 4.6, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(shift > 0.5 ? MONET_PALETTE.rose : MONET_PALETTE.sky, 0.9);
      ctx.fill();

      ctx.textAlign = 'left';
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(88, 86, 112, 0.72)';
      ctx.fillText('task diversity', xMin, gaugeY - 9);

      for (const particle of particles) {
        const flow = (time * particle.speed + particle.offset) % 1;
        const px = lerp(xMin, xMax, flow);
        const xNorm = px / width;

        const branchGate = smoothstep(critical - 0.03, critical + 0.2, flow);
        const branch = shift * branchGate * particle.branchBias;

        const pyTarget = targetY(xNorm, time) + Math.sin(time * 2.8 + particle.wobble + flow * 8) * 2.2;
        const pySource = sourceY(xNorm, time) + Math.cos(time * 3.1 + particle.wobble + flow * 7) * 2.6;
        const py = lerp(pyTarget, pySource, branch);

        const glow = ctx.createRadialGradient(px, py, 0, px, py, particle.size * 5.4);
        glow.addColorStop(0, hexToRgba(branch > 0.5 ? MONET_PALETTE.rose : MONET_PALETTE.sky, 0.24));
        glow.addColorStop(1, hexToRgba(MONET_PALETTE.sky, 0));
        ctx.beginPath();
        ctx.arc(px, py, particle.size * 5.4, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(branch > 0.45 ? MONET_PALETTE.rose : MONET_PALETTE.sky, 0.82);
        ctx.fill();
      }

      ctx.textAlign = 'left';
      ctx.font = '500 10px "JetBrains Mono", monospace';
      ctx.fillStyle = hexToRgba(MONET_PALETTE.mint, 0.74);
      ctx.fillText('target subspace', width * 0.08, height * 0.83);
      ctx.fillStyle = hexToRgba(MONET_PALETTE.rose, 0.66);
      ctx.fillText('off-support source', width * 0.51, height * 0.3);

      const barBaseX = width * 0.83;
      const barBaseY = height * 0.83;
      const barGap = width * 0.025;
      const barHeights = [
        0.52 - shift * 0.18,
        0.44 - shift * 0.08,
        0.14 + shift * 0.28,
        0.1 + shift * 0.42,
        0.08 + shift * 0.35,
      ];

      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(88, 86, 112, 0.6)';
      ctx.fillText('spectrum', width * 0.89, height * 0.9);

      barHeights.forEach((heightNorm, index) => {
        const barX = barBaseX + index * barGap;
        const barH = heightNorm * height * 0.62;
        const color = index < 2 && shift < 0.55 ? MONET_PALETTE.mint : MONET_PALETTE.lavender;
        const accent = index >= 2 && shift > 0.35 ? MONET_PALETTE.rose : color;

        ctx.fillStyle = hexToRgba(accent, 0.22);
        ctx.fillRect(barX - 4, barBaseY - barH, 8, barH);
        ctx.fillStyle = hexToRgba(accent, 0.72);
        ctx.fillRect(barX - 1.8, barBaseY - barH, 3.6, barH);
      });
    }, 30);

    return () => {
      stop();
      canvas.remove();
    };
  });
}
