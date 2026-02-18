/** SpecViT card — animated stellar spectrum with absorption lines */

import { observeVisibility, setupCanvas, animationLoop, MONET_PALETTE, hexToRgba } from './_shared';

interface AbsorptionLine {
  /** Normalized position along x-axis [0,1] */
  pos: number;
  depth: number;
  width: number;
  label: string;
  color: string;
}

const LINES: AbsorptionLine[] = [
  { pos: 0.12, depth: 0.55, width: 0.012, label: 'Ca II',  color: MONET_PALETTE.lavender },
  { pos: 0.22, depth: 0.35, width: 0.008, label: 'H\u03B4',    color: MONET_PALETTE.sky },
  { pos: 0.35, depth: 0.45, width: 0.010, label: 'H\u03B3',    color: MONET_PALETTE.sky },
  { pos: 0.44, depth: 0.30, width: 0.007, label: 'Fe I',   color: MONET_PALETTE.mint },
  { pos: 0.52, depth: 0.60, width: 0.013, label: 'H\u03B2',    color: MONET_PALETTE.sky },
  { pos: 0.61, depth: 0.25, width: 0.006, label: 'Mg I',   color: MONET_PALETTE.mint },
  { pos: 0.72, depth: 0.40, width: 0.009, label: 'Na D',   color: MONET_PALETTE.yellow },
  { pos: 0.82, depth: 0.70, width: 0.014, label: 'H\u03B1',    color: MONET_PALETTE.rose },
  { pos: 0.91, depth: 0.28, width: 0.007, label: 'Ca II',  color: MONET_PALETTE.lavender },
];

/** Build a smooth continuum + absorption spectrum at x [0,1] */
function spectrumValue(x: number, time: number): number {
  // Smooth blackbody-like continuum (peaks around 0.4)
  let continuum = 0.85 * Math.exp(-((x - 0.42) ** 2) / 0.18) + 0.15;
  // Gentle time-based ripple
  continuum += Math.sin(x * 18 + time * 0.0008) * 0.015;

  // Absorption dips
  let absorption = 0;
  for (const line of LINES) {
    const pulse = 1 + Math.sin(time * 0.001 + line.pos * 20) * 0.12;
    const d = (x - line.pos) / line.width;
    absorption += line.depth * pulse * Math.exp(-d * d);
  }

  return Math.max(continuum - absorption, 0.04);
}

/** Wavelength-like color gradient from violet to red */
function wavelengthColor(x: number): string {
  // Violet → blue → cyan → green → yellow → orange → red
  const r = Math.round(
    x < 0.4 ? 100 + x * 200
    : x < 0.7 ? 180
    : 180 + (x - 0.7) * 250
  );
  const g = Math.round(
    x < 0.3 ? 100 + x * 300
    : x < 0.6 ? 190
    : 190 - (x - 0.6) * 350
  );
  const b = Math.round(
    x < 0.35 ? 200 + x * 100
    : 230 - (x - 0.35) * 300
  );
  return `rgb(${Math.min(r, 255)},${Math.min(g, 255)},${Math.max(b, 0)})`;
}

export function initStellarSpectrum(container: HTMLElement): void {
  observeVisibility(container, () => {
    const { canvas, ctx, width, height } = setupCanvas(container);

    const marginTop = 20;
    const marginBottom = 28;
    const plotH = height - marginTop - marginBottom;

    // Scan line position
    let scanX = 0;

    const stop = animationLoop((time) => {
      ctx.clearRect(0, 0, width, height);

      // Background
      const bg = ctx.createLinearGradient(0, 0, width, 0);
      bg.addColorStop(0, '#f6f4ff');
      bg.addColorStop(0.5, '#fefefe');
      bg.addColorStop(1, '#fff8f6');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Faint wavelength color bar at bottom
      for (let px = 0; px < width; px++) {
        const x = px / width;
        ctx.fillStyle = wavelengthColor(x);
        ctx.globalAlpha = 0.12;
        ctx.fillRect(px, height - 6, 1, 6);
      }
      ctx.globalAlpha = 1;

      // Draw filled area under spectrum
      ctx.beginPath();
      ctx.moveTo(0, height - marginBottom);
      const step = 2;
      for (let px = 0; px <= width; px += step) {
        const x = px / width;
        const val = spectrumValue(x, time);
        const y = marginTop + plotH * (1 - val);
        ctx.lineTo(px, y);
      }
      ctx.lineTo(width, height - marginBottom);
      ctx.closePath();

      const fill = ctx.createLinearGradient(0, marginTop, 0, height - marginBottom);
      fill.addColorStop(0, hexToRgba(MONET_PALETTE.lavender, 0.08));
      fill.addColorStop(1, hexToRgba(MONET_PALETTE.sky, 0.03));
      ctx.fillStyle = fill;
      ctx.fill();

      // Draw spectrum line with gradient
      ctx.beginPath();
      for (let px = 0; px <= width; px += step) {
        const x = px / width;
        const val = spectrumValue(x, time);
        const y = marginTop + plotH * (1 - val);
        if (px === 0) ctx.moveTo(px, y);
        else ctx.lineTo(px, y);
      }
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = hexToRgba(MONET_PALETTE.lavender, 0.6);
      ctx.shadowColor = hexToRgba(MONET_PALETTE.lavender, 0.35);
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Absorption line markers + labels
      ctx.font = '500 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      for (const line of LINES) {
        const lx = line.pos * width;
        const val = spectrumValue(line.pos, time);
        const ly = marginTop + plotH * (1 - val);

        // Vertical dashed guide
        ctx.setLineDash([2, 3]);
        ctx.lineWidth = 0.8;
        ctx.strokeStyle = hexToRgba(line.color, 0.25);
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx, height - marginBottom);
        ctx.stroke();
        ctx.setLineDash([]);

        // Dot at the dip
        ctx.beginPath();
        ctx.arc(lx, ly, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(line.color, 0.7);
        ctx.fill();

        // Label
        ctx.fillStyle = hexToRgba(line.color, 0.55);
        ctx.fillText(line.label, lx, marginTop - 6);
      }

      // Scanning highlight
      scanX = (time * 0.04) % width;
      ctx.save();
      const scanGrad = ctx.createLinearGradient(scanX - 20, 0, scanX + 20, 0);
      scanGrad.addColorStop(0, 'rgba(124,92,191,0)');
      scanGrad.addColorStop(0.5, 'rgba(124,92,191,0.06)');
      scanGrad.addColorStop(1, 'rgba(124,92,191,0)');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(scanX - 20, marginTop, 40, plotH);
      ctx.restore();
    }, 30);

    return () => {
      stop();
      canvas.remove();
    };
  });
}
