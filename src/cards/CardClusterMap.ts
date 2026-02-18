/** Cancer Clustering card — UMAP-style breathing dot clusters */

import { setupCanvas, animationLoop, observeVisibility, hexToRgba } from './_shared';

const CLUSTER_COLORS = ['#e8b4c8', '#a8dbc5', '#a0c8e8', '#c4b5e0'];

interface Dot {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  phase: number;
  orbit: number;
  orbitSpeed: number;
}

interface Cluster {
  cx: number;
  cy: number;
  dots: Dot[];
  breathPhase: number;
  breathSpeed: number;
  rotateSpeed: number;
}

export function initClusterMap(container: HTMLElement): void {
  observeVisibility(container, () => {
    const { ctx, width, height } = setupCanvas(container);

    // Create 4 clusters
    const clusterPositions = [
      { cx: width * 0.28, cy: height * 0.35 },
      { cx: width * 0.68, cy: height * 0.30 },
      { cx: width * 0.35, cy: height * 0.72 },
      { cx: width * 0.72, cy: height * 0.68 },
    ];

    const clusters: Cluster[] = clusterPositions.map((pos, ci) => {
      const dots: Dot[] = [];
      const count = 18 + Math.floor(Math.random() * 10);
      const spread = Math.min(width, height) * 0.12;

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * spread * (0.3 + Math.random() * 0.7);
        const bx = pos.cx + Math.cos(angle) * dist;
        const by = pos.cy + Math.sin(angle) * dist;

        dots.push({
          baseX: bx,
          baseY: by,
          x: bx,
          y: by,
          radius: 1.5 + Math.random() * 2,
          color: CLUSTER_COLORS[ci],
          phase: Math.random() * Math.PI * 2,
          orbit: 2 + Math.random() * 4,
          orbitSpeed: 0.3 + Math.random() * 0.4,
        });
      }

      return {
        cx: pos.cx,
        cy: pos.cy,
        dots,
        breathPhase: Math.random() * Math.PI * 2,
        breathSpeed: 0.4 + Math.random() * 0.3,
        rotateSpeed: 0.08 + Math.random() * 0.06,
      };
    });

    const stop = animationLoop((time) => {
      ctx.clearRect(0, 0, width, height);
      const t = time * 0.001;

      for (const cluster of clusters) {
        const breathScale = 1 + Math.sin(t * cluster.breathSpeed + cluster.breathPhase) * 0.08;
        const rotAngle = t * cluster.rotateSpeed;

        // Draw cluster background glow
        const bgGlow = ctx.createRadialGradient(
          cluster.cx, cluster.cy, 0,
          cluster.cx, cluster.cy, Math.min(width, height) * 0.15,
        );
        bgGlow.addColorStop(0, hexToRgba(cluster.dots[0].color, 0.06));
        bgGlow.addColorStop(1, hexToRgba(cluster.dots[0].color, 0));
        ctx.beginPath();
        ctx.arc(cluster.cx, cluster.cy, Math.min(width, height) * 0.15, 0, Math.PI * 2);
        ctx.fillStyle = bgGlow;
        ctx.fill();

        for (const dot of cluster.dots) {
          // Breathing: scale distance from cluster center
          const dx = (dot.baseX - cluster.cx) * breathScale;
          const dy = (dot.baseY - cluster.cy) * breathScale;

          // Rotate around cluster center
          const cos = Math.cos(rotAngle);
          const sin = Math.sin(rotAngle);
          const rx = dx * cos - dy * sin;
          const ry = dx * sin + dy * cos;

          // Small individual orbit
          const ox = Math.cos(t * dot.orbitSpeed + dot.phase) * dot.orbit;
          const oy = Math.sin(t * dot.orbitSpeed + dot.phase) * dot.orbit;

          dot.x = cluster.cx + rx + ox;
          dot.y = cluster.cy + ry + oy;

          // Soft glow
          const glow = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, dot.radius * 3);
          glow.addColorStop(0, hexToRgba(dot.color, 0.25));
          glow.addColorStop(1, hexToRgba(dot.color, 0));
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, dot.radius * 3, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();

          // Core dot
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
          ctx.fillStyle = hexToRgba(dot.color, 0.7);
          ctx.fill();
        }
      }
    }, 30);

    return stop;
  });
}
