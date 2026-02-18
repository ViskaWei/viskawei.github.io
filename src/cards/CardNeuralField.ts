/** PIML card — Neural network layers with activation pulses */

import { setupCanvas, animationLoop, observeVisibility, hexToRgba } from './_shared';

const GOLD = '#d4a847';
const AMBER = '#e8a838';
const WARM_WHITE = '#f5e6c8';

interface Node {
  x: number;
  y: number;
  radius: number;
  phase: number;
}

interface Pulse {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  t: number;
  speed: number;
}

export function initNeuralField(container: HTMLElement): void {
  observeVisibility(container, () => {
    const { ctx, width, height } = setupCanvas(container);

    // 3 layers of nodes
    const layers = [4, 6, 4];
    const nodes: Node[][] = [];
    const padX = width * 0.2;
    const layerSpacing = (width - padX * 2) / (layers.length - 1);

    for (let l = 0; l < layers.length; l++) {
      const col: Node[] = [];
      const count = layers[l];
      const padY = height * 0.15;
      const spacing = (height - padY * 2) / (count - 1);
      for (let i = 0; i < count; i++) {
        col.push({
          x: padX + l * layerSpacing,
          y: padY + i * spacing,
          radius: 4 + Math.random() * 2,
          phase: Math.random() * Math.PI * 2,
        });
      }
      nodes.push(col);
    }

    // Connections between adjacent layers
    const connections: { from: Node; to: Node }[] = [];
    for (let l = 0; l < nodes.length - 1; l++) {
      for (const from of nodes[l]) {
        for (const to of nodes[l + 1]) {
          connections.push({ from, to });
        }
      }
    }

    // Active pulses
    const pulses: Pulse[] = [];
    let lastPulseTime = 0;

    const stop = animationLoop((time) => {
      ctx.clearRect(0, 0, width, height);

      // Spawn pulses periodically
      if (time - lastPulseTime > 300) {
        const conn = connections[Math.floor(Math.random() * connections.length)];
        pulses.push({
          fromX: conn.from.x,
          fromY: conn.from.y,
          toX: conn.to.x,
          toY: conn.to.y,
          t: 0,
          speed: 0.015 + Math.random() * 0.01,
        });
        lastPulseTime = time;
      }

      // Draw connections
      for (const conn of connections) {
        ctx.beginPath();
        ctx.moveTo(conn.from.x, conn.from.y);
        ctx.lineTo(conn.to.x, conn.to.y);
        ctx.strokeStyle = hexToRgba(GOLD, 0.08);
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Update and draw pulses
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.t += p.speed;
        if (p.t > 1) {
          pulses.splice(i, 1);
          continue;
        }
        const px = p.fromX + (p.toX - p.fromX) * p.t;
        const py = p.fromY + (p.toY - p.fromY) * p.t;
        const alpha = Math.sin(p.t * Math.PI) * 0.9;

        // Glow
        const grad = ctx.createRadialGradient(px, py, 0, px, py, 8);
        grad.addColorStop(0, hexToRgba(AMBER, alpha));
        grad.addColorStop(1, hexToRgba(AMBER, 0));
        ctx.beginPath();
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(WARM_WHITE, alpha);
        ctx.fill();

        // Light up connection line
        ctx.beginPath();
        ctx.moveTo(p.fromX, p.fromY);
        ctx.lineTo(p.toX, p.toY);
        ctx.strokeStyle = hexToRgba(GOLD, alpha * 0.3);
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw nodes
      const t = time * 0.001;
      for (const layer of nodes) {
        for (const node of layer) {
          const pulse = 1 + Math.sin(t * 2 + node.phase) * 0.3;
          const r = node.radius * pulse;

          // Outer glow
          const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r * 3);
          glow.addColorStop(0, hexToRgba(GOLD, 0.2));
          glow.addColorStop(1, hexToRgba(GOLD, 0));
          ctx.beginPath();
          ctx.arc(node.x, node.y, r * 3, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();

          // Core node
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
          ctx.fillStyle = hexToRgba(AMBER, 0.7);
          ctx.fill();
          ctx.strokeStyle = hexToRgba(WARM_WHITE, 0.5);
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }, 30);

    return stop;
  });
}
