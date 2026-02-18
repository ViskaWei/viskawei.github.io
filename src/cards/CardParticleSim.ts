/** Charm Yukawa card — Feynman diagram with animated propagators and glowing vertices */

import { observeVisibility, MONET_PALETTE, hexToRgba } from './_shared';

export function initParticleSim(container: HTMLElement): void {
  observeVisibility(container, () => {
    const svgNS = 'http://www.w3.org/2000/svg';
    const rect = container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    container.appendChild(svg);

    // Background rect
    const bgRect = document.createElementNS(svgNS, 'rect');
    bgRect.setAttribute('width', String(w));
    bgRect.setAttribute('height', String(h));
    bgRect.setAttribute('fill', 'rgba(248,246,255,0.5)');
    svg.appendChild(bgRect);

    // Defs for glow filter and gradients
    const defs = document.createElementNS(svgNS, 'defs');
    defs.innerHTML = `
      <filter id="vertex-glow">
        <feGaussianBlur stdDeviation="4" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      <radialGradient id="vertex-grad" cx="35%" cy="35%">
        <stop offset="0%" stop-color="${MONET_PALETTE.rose}" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="${MONET_PALETTE.lavender}" stop-opacity="0.6"/>
      </radialGradient>
      <linearGradient id="fermion-grad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${MONET_PALETTE.lavender}" stop-opacity="0.7"/>
        <stop offset="100%" stop-color="${MONET_PALETTE.sky}" stop-opacity="0.5"/>
      </linearGradient>
    `;
    svg.appendChild(defs);

    // Vertices
    const vertices = [
      { x: w * 0.15, y: h * 0.5, label: 'c', labelOffset: -15 },
      { x: w * 0.42, y: h * 0.3, label: 'H', labelOffset: -15 },
      { x: w * 0.42, y: h * 0.7, label: '', labelOffset: 0 },
      { x: w * 0.72, y: h * 0.2, label: 'c\u0304', labelOffset: -15 },
      { x: w * 0.72, y: h * 0.5, label: 'g', labelOffset: -15 },
      { x: w * 0.72, y: h * 0.8, label: 'g', labelOffset: -15 },
    ];

    // Propagator lines
    const propagators = [
      { from: 0, to: 1, style: 'fermion', color: 'url(#fermion-grad)' },
      { from: 0, to: 2, style: 'fermion', color: 'url(#fermion-grad)' },
      { from: 1, to: 3, style: 'dashed', color: hexToRgba(MONET_PALETTE.yellow, 0.75) },
      { from: 1, to: 4, style: 'wavy', color: hexToRgba(MONET_PALETTE.sky, 0.65) },
      { from: 2, to: 5, style: 'wavy', color: hexToRgba(MONET_PALETTE.sky, 0.65) },
    ];

    // Draw propagators
    for (const p of propagators) {
      const v1 = vertices[p.from];
      const v2 = vertices[p.to];

      if (p.style === 'wavy') {
        // Create a wavy path (sine wave)
        const dx = v2.x - v1.x;
        const dy = v2.y - v1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        const waves = Math.floor(dist / 12);
        const amp = 5;

        let d = `M ${v1.x} ${v1.y}`;
        for (let i = 1; i <= waves; i++) {
          const t = i / waves;
          const cx = v1.x + dx * t;
          const cy = v1.y + dy * t;
          const perpX = -Math.sin(angle) * amp * (i % 2 === 0 ? 1 : -1);
          const perpY = Math.cos(angle) * amp * (i % 2 === 0 ? 1 : -1);
          const midT = (i - 0.5) / waves;
          const midX = v1.x + dx * midT + perpX;
          const midY = v1.y + dy * midT + perpY;
          d += ` Q ${midX} ${midY} ${cx} ${cy}`;
        }

        const path = document.createElementNS(svgNS, 'path');
        path.setAttribute('d', d);
        path.setAttribute('stroke', p.color);
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');
        path.classList.add('propagator-line');
        svg.appendChild(path);
      } else {
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', String(v1.x));
        line.setAttribute('y1', String(v1.y));
        line.setAttribute('x2', String(v2.x));
        line.setAttribute('y2', String(v2.y));
        line.setAttribute('stroke', p.color);
        line.setAttribute('stroke-width', '2');
        line.setAttribute('fill', 'none');
        line.classList.add('propagator-line');

        if (p.style === 'dashed') {
          line.setAttribute('stroke-dasharray', '8 5');
        } else if (p.style === 'fermion') {
          // Solid line with arrow
          line.setAttribute('stroke-dasharray', 'none');
        }

        svg.appendChild(line);

        // Arrow for fermion lines
        if (p.style === 'fermion') {
          const midX = (v1.x + v2.x) / 2;
          const midY = (v1.y + v2.y) / 2;
          const dx = v2.x - v1.x;
          const dy = v2.y - v1.y;
          const angle = Math.atan2(dy, dx);
          const arrowSize = 7;

          const arrow = document.createElementNS(svgNS, 'polygon');
          const tipX = midX + Math.cos(angle) * 4;
          const tipY = midY + Math.sin(angle) * 4;
          const leftX = tipX - Math.cos(angle - 0.5) * arrowSize;
          const leftY = tipY - Math.sin(angle - 0.5) * arrowSize;
          const rightX = tipX - Math.cos(angle + 0.5) * arrowSize;
          const rightY = tipY - Math.sin(angle + 0.5) * arrowSize;
          arrow.setAttribute('points', `${tipX},${tipY} ${leftX},${leftY} ${rightX},${rightY}`);
          arrow.setAttribute('fill', hexToRgba(MONET_PALETTE.lavender, 0.6));
          svg.appendChild(arrow);
        }
      }
    }

    // Draw vertices with glow
    for (const v of vertices) {
      // Outer glow circle
      const glow = document.createElementNS(svgNS, 'circle');
      glow.setAttribute('cx', String(v.x));
      glow.setAttribute('cy', String(v.y));
      glow.setAttribute('r', '10');
      glow.setAttribute('fill', hexToRgba(MONET_PALETTE.rose, 0.15));
      glow.classList.add('vertex-pulse');
      svg.appendChild(glow);

      // Main vertex
      const circle = document.createElementNS(svgNS, 'circle');
      circle.setAttribute('cx', String(v.x));
      circle.setAttribute('cy', String(v.y));
      circle.setAttribute('r', '5');
      circle.setAttribute('fill', 'url(#vertex-grad)');
      circle.setAttribute('filter', 'url(#vertex-glow)');
      svg.appendChild(circle);

      if (v.label) {
        const text = document.createElementNS(svgNS, 'text');
        text.setAttribute('x', String(v.x));
        text.setAttribute('y', String(v.y + v.labelOffset));
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', 'rgba(74,74,106,0.75)');
        text.setAttribute('font-family', '"JetBrains Mono", monospace');
        text.setAttribute('font-size', '12');
        text.setAttribute('font-weight', '500');
        text.textContent = v.label;
        svg.appendChild(text);
      }
    }

    // Animate dashes and vertex pulses
    let animId: number;
    let offset = 0;
    let pulseTime = 0;

    function animate() {
      animId = requestAnimationFrame(animate);
      offset -= 0.4;
      pulseTime += 0.02;

      const dashedLines = svg.querySelectorAll('line[stroke-dasharray]');
      dashedLines.forEach(l => l.setAttribute('stroke-dashoffset', String(offset)));

      // Pulse vertex glows
      const pulseCircles = svg.querySelectorAll('.vertex-pulse');
      const pulseScale = 10 + Math.sin(pulseTime) * 3;
      const pulseOpacity = 0.15 + Math.sin(pulseTime) * 0.05;
      pulseCircles.forEach(c => {
        c.setAttribute('r', String(pulseScale));
        c.setAttribute('fill', hexToRgba(MONET_PALETTE.rose, pulseOpacity));
      });
    }
    animate();

    return () => {
      cancelAnimationFrame(animId);
      svg.remove();
    };
  });
}
