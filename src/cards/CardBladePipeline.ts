/**
 * Blade Agent — The Omniscient Prism (刀光剑影 Edition)
 *
 * FIVE concentric rotating triangles, Tron-style edge runners, Sierpinski
 * fractal interior, data-stream particles, orbital dust, pulsing vertex
 * nodes — PLUS blade-slash energy streaks that fire from vertices and
 * spark particles that scatter on impact.  Always alive, always stunning.
 */

import {
  observeVisibility,
  setupCanvas,
  animationLoop,
  MONET_PALETTE,
  hexToRgba,
} from './_shared';

// ─── Palette ────────────────────────────────────────────────────────

const ACCENT  = '#7c5cbf';
const CYAN    = '#64d8ff';
const GOLD    = '#f0d060';
const ROSE    = '#e87ca0';

// Per-layer triangle colours (mega → outer → main → inner → core)
const TRI_MEGA  = ROSE;
const TRI_OUTER = GOLD;
const TRI_MAIN  = ACCENT;
const TRI_INNER = CYAN;
const TRI_CORE  = MONET_PALETTE.mint;
const VTX_COL = [MONET_PALETTE.sky, MONET_PALETTE.mint, MONET_PALETTE.lavender];
const SLASH_COLORS = [CYAN, MONET_PALETTE.lavender, ACCENT, MONET_PALETTE.sky, GOLD];

// ─── Geometry ───────────────────────────────────────────────────────

function triVerts(cx: number, cy: number, r: number, rot: number) {
  return Array.from({ length: 3 }, (_, i) => {
    const a = rot + (i * Math.PI * 2) / 3 - Math.PI / 2;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
}

// ─── Types ──────────────────────────────────────────────────────────

interface Runner  { edge: number; t: number; speed: number; layer: 0|1|2; color: string; }
interface Stream  { sx: number; sy: number; target: number; progress: number; speed: number; color: string; size: number; }
interface Orbital { angle: number; radius: number; speed: number; size: number; color: string; alpha: number; yR: number; }

interface BladeSlash {
  x0: number; y0: number;     // origin
  x1: number; y1: number;     // destination
  life: number;               // 1 → 0
  color: string;
  width: number;
}

interface Spark {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  color: string;
  size: number;
}

// ─── Main ───────────────────────────────────────────────────────────

export function initBladePipeline(container: HTMLElement): void {
  observeVisibility(container, () => {
    const { canvas, ctx, width: w, height: h } = setupCanvas(container);
    const cx = w * 0.5;
    const cy = h * 0.5;
    const R  = Math.min(w * 0.42, h * 0.42);

    // ── Edge runners (9: 3 per triangle layer) ──
    const runners: Runner[] = Array.from({ length: 9 }, (_, i) => ({
      edge:  i % 3,
      t:     (i % 3) / 3 + Math.random() * 0.2,
      speed: 0.006 + (i % 3) * 0.002,
      layer: (i < 3 ? 0 : i < 6 ? 1 : 2) as 0|1|2,
      color: [CYAN, MONET_PALETTE.lavender, ACCENT][i % 3],
    }));

    // ── Orbital dust ──
    const orbitals: Orbital[] = Array.from({ length: 45 }, () => ({
      angle:  Math.random() * Math.PI * 2,
      radius: R * (0.6 + Math.random() * 1.1),
      speed:  (0.0008 + Math.random() * 0.003) * (Math.random() > 0.5 ? 1 : -1),
      size:   0.4 + Math.random() * 1.8,
      color:  [MONET_PALETTE.sky, MONET_PALETTE.lavender, MONET_PALETTE.mint, CYAN][Math.floor(Math.random() * 4)],
      alpha:  0.1 + Math.random() * 0.35,
      yR:     0.35 + Math.random() * 0.3,
    }));

    // ── Data streams ──
    function spawnStream(): Stream {
      const side = Math.floor(Math.random() * 4);
      const sx = side === 1 ? w + 5 : side === 3 ? -5 : Math.random() * w;
      const sy = side === 0 ? -5 : side === 2 ? h + 5 : Math.random() * h;
      const tgt = Math.floor(Math.random() * 3);
      return { sx, sy, target: tgt, progress: 0, speed: 0.006 + Math.random() * 0.009, color: VTX_COL[tgt], size: 0.7 + Math.random() * 1.4 };
    }
    const streams: Stream[] = Array.from({ length: 18 }, spawnStream);

    // ── Blade slashes & sparks ──
    const slashes: BladeSlash[] = [];
    const sparks: Spark[] = [];
    let slashTimer = 0;

    function spawnSlash(mainV: {x:number;y:number}[]) {
      // Pick a random vertex as origin
      const vi = Math.floor(Math.random() * 3);
      const origin = mainV[vi];
      // Slash direction: toward a random point on the opposite edge or beyond
      const angle = Math.random() * Math.PI * 2;
      const len = R * (0.8 + Math.random() * 0.9);
      const dest = { x: origin.x + Math.cos(angle) * len, y: origin.y + Math.sin(angle) * len };
      const col = SLASH_COLORS[Math.floor(Math.random() * SLASH_COLORS.length)];
      slashes.push({ x0: origin.x, y0: origin.y, x1: dest.x, y1: dest.y, life: 1, color: col, width: 1.2 + Math.random() * 1.5 });

      // Spawn sparks at midpoint and endpoint
      for (let k = 0; k < 6; k++) {
        const sp = 0.4 + Math.random() * 0.6;
        const sx = origin.x + (dest.x - origin.x) * sp;
        const sy = origin.y + (dest.y - origin.y) * sp;
        sparks.push({
          x: sx, y: sy,
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3,
          life: 0.6 + Math.random() * 0.4,
          color: col,
          size: 0.8 + Math.random() * 1.5,
        });
      }
    }

    // ── Sierpinski ──
    function sierpinski(v0: {x:number;y:number}, v1: {x:number;y:number}, v2: {x:number;y:number}, d: number, t: number) {
      if (d >= 3) return;
      const m01 = { x: (v0.x + v1.x) / 2, y: (v0.y + v1.y) / 2 };
      const m12 = { x: (v1.x + v2.x) / 2, y: (v1.y + v2.y) / 2 };
      const m02 = { x: (v0.x + v2.x) / 2, y: (v0.y + v2.y) / 2 };
      ctx.beginPath();
      ctx.moveTo(m01.x, m01.y); ctx.lineTo(m12.x, m12.y); ctx.lineTo(m02.x, m02.y);
      ctx.closePath();
      ctx.strokeStyle = hexToRgba(MONET_PALETTE.lavender, 0.04 + Math.sin(t * 2.5 + d * 1.5) * 0.025);
      ctx.lineWidth = 0.4;
      ctx.stroke();
      sierpinski(v0, m01, m02, d + 1, t);
      sierpinski(m01, v1, m12, d + 1, t);
      sierpinski(m02, m12, v2, d + 1, t);
    }

    // ── Render ──
    const TRAIL = 14;
    const stop = animationLoop((time) => {
      const t = time * 0.001;
      ctx.clearRect(0, 0, w, h);

      // Background
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 2.5);
      bg.addColorStop(0, '#f4f1ff');
      bg.addColorStop(0.4, '#faf8ff');
      bg.addColorStop(1, '#fefefe');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Energy field
      const field = ctx.createRadialGradient(cx, cy, R * 0.12, cx, cy, R * 1.8);
      field.addColorStop(0, hexToRgba(ACCENT, 0.06));
      field.addColorStop(0.5, hexToRgba(MONET_PALETTE.lavender, 0.025));
      field.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = field;
      ctx.fillRect(0, 0, w, h);

      const breathe = 1 + Math.sin(t * 1.8) * 0.025;

      // ── Orbital dust ──
      for (const p of orbitals) {
        p.angle += p.speed;
        ctx.beginPath();
        ctx.arc(cx + p.radius * Math.cos(p.angle), cy + p.radius * Math.sin(p.angle) * p.yR, p.size, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(p.color, p.alpha);
        ctx.fill();
      }

      // ── Data streams ──
      for (const s of streams) {
        s.progress += s.speed;
        if (s.progress >= 1) Object.assign(s, spawnStream());
        const mv = triVerts(cx, cy, R * breathe, t * 0.12);
        const tv = mv[s.target];
        const px = s.sx + (tv.x - s.sx) * s.progress;
        const py = s.sy + (tv.y - s.sy) * s.progress;
        const a = Math.min(s.progress * 4, 1) * (1 - s.progress) * 0.65;
        for (let k = 3; k > 0; k--) {
          const tp = Math.max(0, s.progress - k * 0.018);
          ctx.beginPath();
          ctx.arc(s.sx + (tv.x - s.sx) * tp, s.sy + (tv.y - s.sy) * tp, s.size * (1 - k * 0.2), 0, Math.PI * 2);
          ctx.fillStyle = hexToRgba(s.color, a * (1 - k * 0.25));
          ctx.fill();
        }
        ctx.beginPath(); ctx.arc(px, py, s.size, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(s.color, a); ctx.fill();
      }

      // ═══════════════════════════════════════════════
      //  FIVE TRIANGLE LAYERS (outside → inside)
      // ═══════════════════════════════════════════════

      // Layer 0: MEGA outer triangle — ROSE
      const megaV = triVerts(cx, cy, R * 1.35 * breathe, -t * 0.18);
      ctx.beginPath();
      megaV.forEach((v, i) => (i === 0 ? ctx.moveTo(v.x, v.y) : ctx.lineTo(v.x, v.y)));
      ctx.closePath();
      ctx.strokeStyle = hexToRgba(TRI_MEGA, 0.3);
      ctx.lineWidth = 1.4;
      ctx.shadowColor = hexToRgba(TRI_MEGA, 0.25);
      ctx.shadowBlur = 22;
      ctx.stroke();
      ctx.shadowBlur = 0;
      for (let i = 0; i < 3; i++) {
        const mv = megaV[i];
        const g = ctx.createRadialGradient(mv.x, mv.y, 0, mv.x, mv.y, 16);
        g.addColorStop(0, hexToRgba(TRI_MEGA, 0.28));
        g.addColorStop(1, hexToRgba(TRI_MEGA, 0));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(mv.x, mv.y, 16, 0, Math.PI * 2); ctx.fill();
      }

      // Layer 1: Outer ghost triangle — GOLD
      const outerV = triVerts(cx, cy, R * 1.14 * breathe, t * 0.06);
      ctx.beginPath();
      outerV.forEach((v, i) => (i === 0 ? ctx.moveTo(v.x, v.y) : ctx.lineTo(v.x, v.y)));
      ctx.closePath();
      ctx.setLineDash([4, 8]);
      ctx.strokeStyle = hexToRgba(TRI_OUTER, 0.22);
      ctx.lineWidth = 0.7;
      ctx.stroke();
      ctx.setLineDash([]);

      // Layer 2: Main triangle (the prism) — ACCENT PURPLE
      const mainV = triVerts(cx, cy, R * breathe, t * 0.12);
      ctx.beginPath();
      mainV.forEach((v, i) => (i === 0 ? ctx.moveTo(v.x, v.y) : ctx.lineTo(v.x, v.y)));
      ctx.closePath();
      const mf = ctx.createLinearGradient(mainV[0].x, mainV[0].y, cx, mainV[2].y);
      mf.addColorStop(0, hexToRgba(TRI_MAIN, 0.04));
      mf.addColorStop(1, hexToRgba(MONET_PALETTE.sky, 0.015));
      ctx.fillStyle = mf; ctx.fill();
      ctx.beginPath();
      mainV.forEach((v, i) => (i === 0 ? ctx.moveTo(v.x, v.y) : ctx.lineTo(v.x, v.y)));
      ctx.closePath();
      ctx.strokeStyle = hexToRgba(TRI_MAIN, 0.4);
      ctx.lineWidth = 1.8;
      ctx.shadowColor = hexToRgba(TRI_MAIN, 0.35);
      ctx.shadowBlur = 18;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Sierpinski fractal
      sierpinski(mainV[0], mainV[1], mainV[2], 0, t);

      // Layer 3: Inner triangle (counter-rotating) — CYAN
      const innerV = triVerts(cx, cy, R * 0.50 * breathe, -t * 0.2);
      ctx.beginPath();
      innerV.forEach((v, i) => (i === 0 ? ctx.moveTo(v.x, v.y) : ctx.lineTo(v.x, v.y)));
      ctx.closePath();
      ctx.fillStyle = hexToRgba(TRI_INNER, 0.02); ctx.fill();
      ctx.strokeStyle = hexToRgba(TRI_INNER, 0.3);
      ctx.lineWidth = 1;
      ctx.shadowColor = hexToRgba(TRI_INNER, 0.22);
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Layer 4: Core triangle (fastest) — MINT
      const coreV = triVerts(cx, cy, R * 0.18 * breathe, t * 0.35);
      ctx.beginPath();
      coreV.forEach((v, i) => (i === 0 ? ctx.moveTo(v.x, v.y) : ctx.lineTo(v.x, v.y)));
      ctx.closePath();
      ctx.fillStyle = hexToRgba(TRI_CORE, 0.07); ctx.fill();
      ctx.strokeStyle = hexToRgba(TRI_CORE, 0.5);
      ctx.lineWidth = 0.9;
      ctx.shadowColor = hexToRgba(TRI_CORE, 0.2);
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // ── Neural connections ──
      for (let i = 0; i < 3; i++) {
        const ca = 0.06 + Math.sin(t * 3 + i * 2) * 0.03;
        ctx.beginPath(); ctx.moveTo(mainV[i].x, mainV[i].y); ctx.lineTo(innerV[i].x, innerV[i].y);
        ctx.strokeStyle = hexToRgba(VTX_COL[i], ca); ctx.lineWidth = 0.5; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(innerV[i].x, innerV[i].y); ctx.lineTo(coreV[i].x, coreV[i].y);
        ctx.strokeStyle = hexToRgba(ACCENT, ca * 0.8); ctx.stroke();
        // Also mega → main connections (long-range)
        ctx.beginPath(); ctx.moveTo(megaV[i].x, megaV[i].y); ctx.lineTo(mainV[i].x, mainV[i].y);
        ctx.strokeStyle = hexToRgba(VTX_COL[i], ca * 0.5); ctx.lineWidth = 0.3; ctx.stroke();
      }

      // ── Edge runners with comet tails ──
      const layerVerts = [mainV, innerV, outerV];
      for (const r of runners) {
        r.t += r.speed;
        if (r.t >= 1) { r.t -= 1; r.edge = (r.edge + 1) % 3; }
        const verts = layerVerts[r.layer];
        // Trail
        for (let k = TRAIL; k > 0; k--) {
          let tt = r.t - k * 0.012;
          let te = r.edge;
          while (tt < 0) { tt += 1; te = (te + 2) % 3; }
          const a = verts[te], b = verts[(te + 1) % 3];
          const frac = 1 - k / TRAIL;
          ctx.beginPath();
          ctx.arc(a.x + (b.x - a.x) * tt, a.y + (b.y - a.y) * tt, 2.4 * frac, 0, Math.PI * 2);
          ctx.fillStyle = hexToRgba(r.color, 0.55 * frac);
          ctx.fill();
        }
        // Head
        const v0 = verts[r.edge], v1 = verts[(r.edge + 1) % 3];
        const hx = v0.x + (v1.x - v0.x) * r.t;
        const hy = v0.y + (v1.y - v0.y) * r.t;
        ctx.shadowColor = hexToRgba(r.color, 0.75);
        ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.arc(hx, hy, 2.8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.93)'; ctx.fill();
        ctx.beginPath(); ctx.arc(hx, hy, 4.2, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(r.color, 0.35); ctx.fill();
        ctx.shadowBlur = 0;
      }

      // ── Vertex glow nodes ──
      for (let i = 0; i < 3; i++) {
        const v = mainV[i];
        const pr = 3.2 + Math.sin(t * 3 + i * 2.1) * 1.2;
        const c = VTX_COL[i];
        const vg = ctx.createRadialGradient(v.x, v.y, 0, v.x, v.y, pr * 7);
        vg.addColorStop(0, hexToRgba(c, 0.3));
        vg.addColorStop(1, hexToRgba(c, 0));
        ctx.fillStyle = vg;
        ctx.beginPath(); ctx.arc(v.x, v.y, pr * 7, 0, Math.PI * 2); ctx.fill();
        ctx.shadowColor = hexToRgba(c, 0.55);
        ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(v.x, v.y, pr, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(c, 0.8); ctx.fill();
        ctx.shadowBlur = 0;
      }

      // ═══════════════════════════════════════════════
      //  刀光剑影  —  BLADE SLASHES + SPARKS
      // ═══════════════════════════════════════════════

      // Periodically fire slashes (every ~50 frames ≈ 1.7s)
      slashTimer++;
      if (slashTimer > 40 + Math.random() * 25) {
        slashTimer = 0;
        // Fire 1-2 slashes at once
        const count = Math.random() > 0.6 ? 2 : 1;
        for (let n = 0; n < count; n++) spawnSlash(mainV);
      }

      // Draw blade slashes
      for (let i = slashes.length - 1; i >= 0; i--) {
        const s = slashes[i];
        s.life -= 0.035;
        if (s.life <= 0) { slashes.splice(i, 1); continue; }

        const progress = 1 - s.life;      // 0 → 1 as slash ages
        const headT = Math.min(progress * 2.5, 1);  // head races ahead
        const tailT = Math.max(progress * 2.5 - 0.6, 0); // tail chases

        const hx = s.x0 + (s.x1 - s.x0) * headT;
        const hy = s.y0 + (s.y1 - s.y0) * headT;
        const tx = s.x0 + (s.x1 - s.x0) * tailT;
        const ty = s.y0 + (s.y1 - s.y0) * tailT;

        // Gradient along the slash line
        const sg = ctx.createLinearGradient(tx, ty, hx, hy);
        sg.addColorStop(0, hexToRgba(s.color, 0));
        sg.addColorStop(0.5, hexToRgba(s.color, s.life * 0.5));
        sg.addColorStop(0.85, `rgba(255,255,255,${s.life * 0.7})`);
        sg.addColorStop(1, hexToRgba(s.color, s.life * 0.3));

        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(hx, hy);
        ctx.strokeStyle = sg;
        ctx.lineWidth = s.width * s.life;
        ctx.shadowColor = hexToRgba(s.color, s.life * 0.6);
        ctx.shadowBlur = 12;
        ctx.stroke();

        // Bright tip glow
        if (headT < 1) {
          const tg = ctx.createRadialGradient(hx, hy, 0, hx, hy, 6);
          tg.addColorStop(0, `rgba(255,255,255,${s.life * 0.6})`);
          tg.addColorStop(1, hexToRgba(s.color, 0));
          ctx.fillStyle = tg;
          ctx.beginPath(); ctx.arc(hx, hy, 6, 0, Math.PI * 2); ctx.fill();
        }
        ctx.shadowBlur = 0;
      }

      // Draw sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const sp = sparks[i];
        sp.life -= 0.03;
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vx *= 0.96;
        sp.vy *= 0.96;
        if (sp.life <= 0) { sparks.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size * sp.life, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(sp.color, sp.life * 0.8);
        ctx.shadowColor = hexToRgba(sp.color, sp.life * 0.5);
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // ── Central core ──
      const cPulse = 0.28 + Math.sin(t * 2) * 0.12;
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.14);
      cg.addColorStop(0, `rgba(255,255,255,${cPulse})`);
      cg.addColorStop(0.5, hexToRgba(ACCENT, 0.1));
      cg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.14, 0, Math.PI * 2); ctx.fill();

      // ── BLADE label ──
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = hexToRgba(ACCENT, 0.3);
      ctx.shadowBlur = 8;
      ctx.fillStyle = hexToRgba(ACCENT, 0.2 + Math.sin(t * 1.5) * 0.06);
      ctx.fillText('BLADE', cx, cy);
      ctx.shadowBlur = 0;
      ctx.textBaseline = 'alphabetic';
    }, 30);

    return () => { stop(); canvas.remove(); };
  });
}
