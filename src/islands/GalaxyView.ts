/**
 * Skill Galaxy — Main D3 visualization (Stellaris Edition).
 * Three.js WebGL background + D3 SVG overlay for interactive star-map nodes,
 * megastructure shapes, energy edges, Star Gates, warp zoom, and fog of war.
 *
 * Layout layers:
 *   Layer 0 (BG):      Deep space nebulae + grid (Three.js)
 *   Layer 1 (inner):   Courses — fundamental knowledge clustered near center
 *   Layer 2 (mid):     Projects/repos — satellites orbiting between clusters
 *   Layer 3 (outer):   Thesis/pubs/internships + Star Gates — top-level highlights
 */

import type { CourseNode, ProjectNode, Track } from '../data/techtree';
import {
  clusters,
  clusterMap,
  buildGalaxyNodes,
  buildEdges,
  computeXP,
  STAR_GATE_IDS,
  type GalaxyNode,
  type ConstellationEdge,
  type SkillCluster,
} from '../data/skilltree';
import { buildAlgorithmNodes, algoNodeExtras } from '../data/algorithms';
import { createGalaxyBackground } from './GalaxyBackground';
import { animationLoop, hexToRgba } from '../cards/_shared';

const TAU = Math.PI * 2;

export function initGalaxyView(
  container: HTMLElement,
  courses: CourseNode[],
  projectNodes: ProjectNode[],
  tracks: Track[],
): void {
  import('d3').then((d3) => {
    const trackMap = new Map(tracks.map(t => [t.id, t]));
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const cx = width / 2;
    const cy = height / 2;

    // ── Build data ────────────────────────────────────────────
    const { nodes: algoNodes, edges: algoEdges } = buildAlgorithmNodes();
    const galaxyNodes = buildGalaxyNodes(courses, projectNodes, clusters, algoNodes);
    const edges = buildEdges(courses, projectNodes, algoEdges);
    const xpResult = computeXP(courses, projectNodes);
    const nodeMap = new Map(galaxyNodes.map(n => [n.id, n]));

    // ── Section A: Three.js background integration ────────────
    const bg = createGalaxyBackground(container, clusters, width, height);

    const stopAnim = animationLoop((time) => {
      bg.update(time);
    }, 30);

    // Mouse parallax forwarding
    container.addEventListener('mousemove', (e) => {
      const r = container.getBoundingClientRect();
      bg.setMousePosition(e.clientX - r.left, e.clientY - r.top);
    });

    // ── SVG layer ─────────────────────────────────────────────
    const svg = d3.select(container)
      .append('svg')
      .attr('class', 'galaxy-svg')
      .attr('width', width)
      .attr('height', height);

    const defs = svg.append('defs');

    // ── Section B: Rich SVG defs for Stellaris-level visuals ───

    // Heavy bloom filter (multi-pass gaussian for intense glow)
    for (const cluster of clusters) {
      // Outer bloom — tighter for Stellaris "tiny dot" aesthetic
      const outerFilter = defs.append('filter')
        .attr('id', `glow-outer-${cluster.id}`)
        .attr('x', '-150%').attr('y', '-150%')
        .attr('width', '400%').attr('height', '400%');
      outerFilter.append('feGaussianBlur')
        .attr('in', 'SourceGraphic').attr('stdDeviation', '6').attr('result', 'blur1');
      const merge1 = outerFilter.append('feMerge');
      merge1.append('feMergeNode').attr('in', 'blur1');
      merge1.append('feMergeNode').attr('in', 'SourceGraphic');

      // Inner glow — tighter, hotter
      const innerFilter = defs.append('filter')
        .attr('id', `glow-inner-${cluster.id}`)
        .attr('x', '-150%').attr('y', '-150%')
        .attr('width', '400%').attr('height', '400%');
      innerFilter.append('feGaussianBlur')
        .attr('in', 'SourceGraphic').attr('stdDeviation', '3').attr('result', 'blur');
      const merge2 = innerFilter.append('feMerge');
      merge2.append('feMergeNode').attr('in', 'blur');
      merge2.append('feMergeNode').attr('in', 'SourceGraphic');
    }

    // Star Gate portal glow (tighter for Stellaris aesthetic)
    const sgGlow = defs.append('filter')
      .attr('id', 'stargate-glow')
      .attr('x', '-150%').attr('y', '-150%')
      .attr('width', '400%').attr('height', '400%');
    sgGlow.append('feGaussianBlur')
      .attr('in', 'SourceGraphic').attr('stdDeviation', '6').attr('result', 'blur1');
    const sgMerge = sgGlow.append('feMerge');
    sgMerge.append('feMergeNode').attr('in', 'blur1');
    sgMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Megastructure neon glow filter
    const megaGlow = defs.append('filter')
      .attr('id', 'mega-glow')
      .attr('x', '-100%').attr('y', '-100%')
      .attr('width', '300%').attr('height', '300%');
    megaGlow.append('feGaussianBlur')
      .attr('in', 'SourceGraphic').attr('stdDeviation', '3').attr('result', 'blur');
    const megaMerge = megaGlow.append('feMerge');
    megaMerge.append('feMergeNode').attr('in', 'blur');
    megaMerge.append('feMergeNode').attr('in', 'blur');
    megaMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Rich radial gradients per cluster — multi-stop for depth
    for (const cluster of clusters) {
      // Hot core gradient (white center → color → dark edge)
      const hotGrad = defs.append('radialGradient')
        .attr('id', `core-grad-hot-${cluster.id}`);
      hotGrad.append('stop').attr('offset', '0%').attr('stop-color', '#ffffff');
      hotGrad.append('stop').attr('offset', '20%').attr('stop-color', '#ffffff').attr('stop-opacity', '0.9');
      hotGrad.append('stop').attr('offset', '45%').attr('stop-color', cluster.color);
      hotGrad.append('stop').attr('offset', '70%').attr('stop-color', cluster.color).attr('stop-opacity', '0.5');
      hotGrad.append('stop').attr('offset', '100%').attr('stop-color', 'transparent');

      // Halo gradient (for outer glow ring)
      const haloGrad = defs.append('radialGradient')
        .attr('id', `halo-grad-${cluster.id}`);
      haloGrad.append('stop').attr('offset', '0%').attr('stop-color', cluster.color).attr('stop-opacity', '0.15');
      haloGrad.append('stop').attr('offset', '50%').attr('stop-color', cluster.color).attr('stop-opacity', '0.06');
      haloGrad.append('stop').attr('offset', '100%').attr('stop-color', 'transparent');

      // Mega fill gradient (dark metal → neon edge)
      const megaFillGrad = defs.append('radialGradient')
        .attr('id', `mega-fill-${cluster.id}`);
      megaFillGrad.append('stop').attr('offset', '0%').attr('stop-color', cluster.color).attr('stop-opacity', '0.08');
      megaFillGrad.append('stop').attr('offset', '60%').attr('stop-color', cluster.color).attr('stop-opacity', '0.03');
      megaFillGrad.append('stop').attr('offset', '100%').attr('stop-color', cluster.color).attr('stop-opacity', '0.12');
    }

    // CORE node gradient — bright, imposing
    const coreGrad = defs.append('radialGradient')
      .attr('id', 'core-gradient');
    coreGrad.append('stop').attr('offset', '0%').attr('stop-color', '#ffffff');
    coreGrad.append('stop').attr('offset', '30%').attr('stop-color', '#e8e8ff');
    coreGrad.append('stop').attr('offset', '60%').attr('stop-color', '#a0a0c0');
    coreGrad.append('stop').attr('offset', '100%').attr('stop-color', '#505060');

    // Star Gate portal gradient — deeper, more dramatic
    const sgGrad = defs.append('radialGradient')
      .attr('id', 'stargate-portal-grad');
    sgGrad.append('stop').attr('offset', '0%').attr('stop-color', '#ffffff').attr('stop-opacity', '0.2');
    sgGrad.append('stop').attr('offset', '30%').attr('stop-color', '#4fc3f7').attr('stop-opacity', '0.1');
    sgGrad.append('stop').attr('offset', '60%').attr('stop-color', '#0a3d5c').attr('stop-opacity', '0.05');
    sgGrad.append('stop').attr('offset', '100%').attr('stop-color', 'transparent');

    // Main group for zoom/pan
    const g = svg.append('g').attr('class', 'galaxy-main-group');

    // ── LAYERED LAYOUT ────────────────────────────────────────
    const scale = Math.min(width, height) / 800;

    // ── Zoom behavior ─────────────────────────────────────────
    // minScale = 1.0: initial view shows entire galaxy; zoom IN to explore.
    // This prevents black edges (canvas always >= viewport size at k >= 1).
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform.toString());
        // Sync Three.js canvas with D3 zoom
        const canvas = container.querySelector('canvas') as HTMLCanvasElement | null;
        if (canvas) {
          const { x: tx, y: ty, k } = event.transform;
          canvas.style.transform = `translate(${tx - cx * k}px, ${ty - cy * k}px) scale(${k})`;
        }
      });

    svg.call(zoom);
    const initialTransform = d3.zoomIdentity.translate(cx, cy).scale(1);
    svg.call(zoom.transform, initialTransform);

    // Radial distances per layer (from cluster center)
    const LAYER_RADIUS = {
      inner:    { min: 25, max: 65 },   // courses close to cluster center
      mid:      { min: 70, max: 100 },   // projects/repos
      outer:    { min: 105, max: 130 },  // thesis/pub/intern
      stargate: { min: 140, max: 160 },  // Star Gates on outermost ring
    };

    // Position cluster centers
    const clusterCenters = new Map<string, { x: number; y: number }>();
    for (const cluster of clusters) {
      clusterCenters.set(cluster.id, {
        x: Math.cos(cluster.angle) * cluster.radius * scale,
        y: Math.sin(cluster.angle) * cluster.radius * scale,
      });
    }

    // CORE node at origin
    const coreNode = nodeMap.get('CORE')!;
    coreNode.x = 0;
    coreNode.y = 0;

    // Run per-cluster force simulation WITH LAYER CONSTRAINTS
    for (const cluster of clusters) {
      const center = clusterCenters.get(cluster.id)!;
      const clusterNodes = galaxyNodes.filter(n => n.clusterId === cluster.id && n.id !== 'CORE');
      if (clusterNodes.length === 0) continue;

      // Group by layer
      const layerGroups: Record<string, GalaxyNode[]> = {
        inner: [], mid: [], outer: [], stargate: [],
      };
      for (const n of clusterNodes) {
        const l = n.layer === 'core' ? 'inner' : n.layer;
        if (layerGroups[l]) layerGroups[l].push(n);
      }

      // Simulate each layer separately with appropriate radial constraints
      for (const [layerName, layerNodes] of Object.entries(layerGroups)) {
        if (layerNodes.length === 0) continue;
        const lr = LAYER_RADIUS[layerName as keyof typeof LAYER_RADIUS] || LAYER_RADIUS.inner;
        const targetR = (lr.min + lr.max) / 2 * scale;

        const sim = d3.forceSimulation(layerNodes as d3.SimulationNodeDatum[])
          .force('center', d3.forceCenter(center.x, center.y).strength(0.1))
          .force('collide', d3.forceCollide((d: any) => (d as GalaxyNode).radius + 6))
          .force('radial', d3.forceRadial(
            targetR + (Math.random() - 0.5) * (lr.max - lr.min) * scale * 0.5,
            center.x,
            center.y,
          ).strength(0.8))
          .stop();

        for (let i = 0; i < 120; i++) sim.tick();

        for (const node of layerNodes) {
          const sn = node as any;
          node.x = sn.x;
          node.y = sn.y;
        }
      }
    }

    // ── Cluster boundaries (Stellaris: borders formed by nebula, not circles) ──
    // Removed: dashed SVG border circles. The Voronoi nebula shader now defines
    // territory boundaries organically, matching Stellaris visual style.

    // ── Edges with per-edge gradients ─────────────────────────
    const edgeGroup = g.append('g').attr('class', 'edges-group');
    const validEdges = edges.filter(e => nodeMap.has(e.source) && nodeMap.has(e.target));

    validEdges.forEach((e, i) => {
      const src = nodeMap.get(e.source)!;
      const tgt = nodeMap.get(e.target)!;
      const cluster = clusterMap.get(tgt.clusterId);
      const color = cluster?.color || '#fff';

      const grad = defs.append('linearGradient')
        .attr('id', `edge-grad-${i}`)
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', src.x).attr('y1', src.y)
        .attr('x2', tgt.x).attr('y2', tgt.y);
      grad.append('stop').attr('offset', '0%').attr('stop-color', color).attr('stop-opacity', 0.03);
      grad.append('stop').attr('offset', '50%').attr('stop-color', color).attr('stop-opacity', 0.15);
      grad.append('stop').attr('offset', '100%').attr('stop-color', color).attr('stop-opacity', 0.03);
    });

    const edgeElements = edgeGroup.selectAll('.constellation-edge')
      .data(validEdges)
      .enter()
      .append('line')
      .attr('class', (d: ConstellationEdge) => {
        const tgt = nodeMap.get(d.target);
        const isSG = tgt?.isStarGate;
        return `constellation-edge${isSG ? ' stargate-lane' : ''}`;
      })
      .attr('x1', (d: ConstellationEdge) => nodeMap.get(d.source)!.x)
      .attr('y1', (d: ConstellationEdge) => nodeMap.get(d.source)!.y)
      .attr('x2', (d: ConstellationEdge) => nodeMap.get(d.target)!.x)
      .attr('y2', (d: ConstellationEdge) => nodeMap.get(d.target)!.y)
      .each(function(this: SVGLineElement, d: ConstellationEdge, i: number) {
        const tgt = nodeMap.get(d.target);
        if (tgt) {
          const cluster = clusterMap.get(tgt.clusterId);
          if (cluster) {
            d3.select(this).style('--edge-color', cluster.color);
            d3.select(this).attr('stroke', `url(#edge-grad-${i})`);
          }
        }
      });

    // Energy flow particles container
    const energyGroup = g.append('g').attr('class', 'energy-particles');

    // ── Cluster labels (outer perimeter, subtle gray) ──────────
    const labelGroup = g.append('g').attr('class', 'cluster-labels');

    for (const cluster of clusters) {
      // Position label on the outer perimeter, along radial direction
      const labelDist = cluster.radius * scale * 1.55;
      const lx = Math.cos(cluster.angle) * labelDist;
      const ly = Math.sin(cluster.angle) * labelDist;

      labelGroup.append('text')
        .attr('class', 'cluster-label-text')
        .attr('data-cluster', cluster.id)
        .attr('x', lx)
        .attr('y', ly)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('fill', 'rgba(255,255,255,0.25)')
        .attr('font-size', `${Math.max(11, 14 * scale)}px`)
        .attr('font-weight', '400')
        .attr('letter-spacing', '0.15em')
        .text(cluster.label.toUpperCase());
    }

    // ── Empire emblems (disabled — removed for cleaner aesthetic) ──
    const emblemGroup = g.append('g').attr('class', 'empire-emblems');
    // Emblems removed per user preference

    // ── Draw CORE node (imposing central star) ────────────────
    const coreGroup = g.append('g')
      .attr('class', 'core-node')
      .attr('transform', `translate(0,0)`);

    // Subtle halo — core void is mainly in the nebula shader
    coreGroup.append('circle')
      .attr('class', 'core-halo')
      .attr('r', 30)
      .attr('fill', 'rgba(200,210,255,0.02)');

    // Main core sphere (small, understated)
    coreGroup.append('circle')
      .attr('r', 12)
      .attr('fill', 'url(#core-gradient)')
      .style('filter', 'drop-shadow(0 0 6px rgba(255,255,255,0.4)) drop-shadow(0 0 15px rgba(200,210,255,0.2))');

    // White-hot center
    coreGroup.append('circle')
      .attr('r', 5)
      .attr('fill', '#ffffff')
      .attr('opacity', 0.85);

    coreGroup.append('text')
      .attr('class', 'core-label')
      .attr('y', 4)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .text('CORE');

    // ── Node classification (must be before hyperlanes) ────────
    const litNodes = galaxyNodes.filter(n => !n.isDark && n.id !== 'CORE');
    const darkNodes = galaxyNodes.filter(n => n.isDark);
    const regularNodes = litNodes.filter(n => !n.isStarGate);
    const starGateNodes = litNodes.filter(n => n.isStarGate);

    // ── Per-cluster fog of war based on lit node count ──────────
    const clusterBrightness: number[] = clusters.map(cluster => {
      const count = litNodes.filter(n => n.clusterId === cluster.id).length;
      return Math.min(1.0, 0.08 + count * 0.18);
    });
    bg.setBaseBrightness(clusterBrightness);

    // Hyperlane connections from CORE to each cluster center
    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];
      const center = clusterCenters.get(cluster.id)!;
      const litCount = litNodes.filter(n => n.clusterId === cluster.id).length;
      // Grey out hyperlane for deep-void clusters (≤1 lit node)
      const hlColor = litCount <= 1
        ? 'rgba(60,60,60,0.03)'
        : hexToRgba(cluster.color, 0.06);
      g.append('line')
        .attr('class', 'hyperlane')
        .attr('x1', 0).attr('y1', 0)
        .attr('x2', center.x).attr('y2', center.y)
        .attr('stroke', hlColor)
        .attr('stroke-width', 0.5)
        .attr('stroke-dasharray', '4 8');
    }

    // ── Star rendering by classification ──────────────────────
    const nodeGroup = g.append('g').attr('class', 'nodes-group');

    // ── Regular star nodes ────────────────────────────────────
    const starElements = nodeGroup.selectAll('.galaxy-star.lit')
      .data(regularNodes)
      .enter()
      .append('g')
      .attr('class', (d: GalaxyNode) => {
        const classes = ['galaxy-star', 'lit', `star-${d.starClass}`, `layer-${d.layer}`];
        if (d.megastructure) classes.push('has-megastructure');
        return classes.join(' ');
      })
      .attr('transform', (d: GalaxyNode) => `translate(${d.x},${d.y})`)
      .each(function(this: SVGGElement, d: GalaxyNode) {
        const cluster = clusterMap.get(d.clusterId);
        const color = cluster?.color || '#fff';
        const el = d3.select(this);
        el.style('--star-color', color);

        if (d.starClass === 'hypergiant') {
          // Stellaris-style: compact glow, not bloated atmosphere
          // Layer 1: Subtle halo
          el.append('circle').attr('class', 'star-halo')
            .attr('r', d.radius * 2.5).attr('fill', `url(#halo-grad-${d.clusterId})`);
          // Layer 2: Corona (tight)
          el.append('circle').attr('class', 'corona-outer')
            .attr('r', d.radius * 1.6).attr('fill', hexToRgba(color, 0.1))
            .style('filter', `url(#glow-inner-${d.clusterId})`);
          // Layer 3: Hot core (bright, saturated)
          el.append('circle').attr('class', 'star-core')
            .attr('r', d.radius).attr('fill', `url(#core-grad-hot-${d.clusterId})`).attr('opacity', d.brightness);
          // Layer 4: White-hot center
          el.append('circle').attr('class', 'star-hotspot')
            .attr('r', d.radius * 0.45).attr('fill', '#ffffff').attr('opacity', 0.95);

        } else if (d.starClass === 'main-sequence') {
          // Layer 1: Subtle outer halo
          el.append('circle').attr('class', 'star-halo')
            .attr('r', d.radius * 1.8).attr('fill', `url(#halo-grad-${d.clusterId})`);
          // Layer 2: Glow ring (compact)
          el.append('circle').attr('class', 'star-glow')
            .attr('r', d.radius * 1.3).attr('fill', hexToRgba(color, 0.1));
          // Layer 3: Core with constrained bloom
          el.append('circle').attr('class', 'star-core')
            .attr('r', d.radius).attr('fill', `url(#core-grad-hot-${d.clusterId})`).attr('opacity', d.brightness)
            .style('filter', `drop-shadow(0 0 4px ${hexToRgba(color, 0.6)}) drop-shadow(0 0 10px ${hexToRgba(color, 0.2)})`);
          // Layer 4: Small white center
          el.append('circle').attr('class', 'star-hotspot')
            .attr('r', d.radius * 0.3).attr('fill', '#ffffff').attr('opacity', 0.7);

        } else if (d.starClass === 'brown-dwarf') {
          // Dim star with subtle glow
          el.append('circle').attr('class', 'star-glow')
            .attr('r', d.radius * 2).attr('fill', hexToRgba(color, 0.04));
          el.append('circle').attr('class', 'star-core brown-dwarf-core')
            .attr('r', d.radius).attr('fill', color)
            .attr('opacity', d.brightness * 0.65)
            .style('filter', `drop-shadow(0 0 ${d.radius}px ${hexToRgba(color, 0.35)})`);

        } else if (d.starClass === 'ghost') {
          // Wireframe ghost with dashed outline + "?"
          el.append('circle').attr('class', 'star-core ghost-outline')
            .attr('r', d.radius).attr('fill', 'transparent')
            .attr('stroke', hexToRgba(color, 0.15)).attr('stroke-width', 1).attr('stroke-dasharray', '2 3');
          el.append('text').attr('class', 'ghost-question')
            .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
            .attr('fill', hexToRgba(color, 0.12))
            .attr('font-family', "'JetBrains Mono', monospace")
            .attr('font-size', `${Math.max(8, d.radius)}px`).text('?');
        }
      });

    starElements.append('text').attr('class', 'star-label')
      .attr('y', (d: GalaxyNode) => d.radius + 14).attr('text-anchor', 'middle')
      .text((d: GalaxyNode) => {
        const name = d.name;
        return name.length > 20 ? name.slice(0, 18) + '\u2026' : name;
      });

    // ── STAR GATE rendering (Layer 3 — top level portals) ─────
    const starGateGroup = g.append('g').attr('class', 'stargates-group');

    const starGateElements = starGateGroup.selectAll('.stargate')
      .data(starGateNodes)
      .enter()
      .append('g')
      .attr('class', 'stargate galaxy-star lit star-hypergiant')
      .attr('transform', (d: GalaxyNode) => `translate(${d.x},${d.y})`)
      .attr('data-id', (d: GalaxyNode) => d.id)
      .each(function(this: SVGGElement, d: GalaxyNode) {
        const cluster = clusterMap.get(d.clusterId);
        const color = cluster?.color || '#4fc3f7';
        const el = d3.select(this);
        el.style('--star-color', color);
        const r = d.radius;

        // Stellaris-compact Star Gate: slightly larger than hypergiant, not bloated
        // Layer 1: Halo (same scale as hypergiant)
        el.append('circle').attr('class', 'sg-halo')
          .attr('r', r * 2.8).attr('fill', `url(#halo-grad-${d.clusterId})`)
          .attr('opacity', 0.7);

        // Layer 2: Portal glow (subtle, not bloated)
        el.append('circle').attr('class', 'sg-event-horizon')
          .attr('r', r * 2).attr('fill', 'url(#stargate-portal-grad)')
          .style('filter', 'url(#stargate-glow)');

        // Layer 3: Outer ring (dashed, visible but tight)
        el.append('circle').attr('class', 'sg-outer-ring')
          .attr('r', r * 1.8).attr('fill', 'none')
          .attr('stroke', hexToRgba(color, 0.3)).attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '10 5 3 5');

        // Layer 4: Mid ring (counter-rotation)
        el.append('circle').attr('class', 'sg-mid-ring')
          .attr('r', r * 1.5).attr('fill', 'none')
          .attr('stroke', hexToRgba(color, 0.2)).attr('stroke-width', 1)
          .attr('stroke-dasharray', '6 4');

        // Layer 5: Corona
        el.append('circle').attr('class', 'corona-outer')
          .attr('r', r * 1.2).attr('fill', hexToRgba(color, 0.1));

        // Layer 6: Hot core
        el.append('circle').attr('class', 'star-core')
          .attr('r', r * 1.1).attr('fill', `url(#core-grad-hot-${d.clusterId})`).attr('opacity', 1)
          .style('filter', `drop-shadow(0 0 ${r * 0.6}px ${hexToRgba(color, 0.5)}) drop-shadow(0 0 ${r}px ${hexToRgba(color, 0.2)})`);

        // Layer 7: White-hot center
        el.append('circle').attr('class', 'star-hotspot')
          .attr('r', r * 0.5).attr('fill', '#ffffff').attr('opacity', 0.95);

        // Always-visible label
        el.append('text').attr('class', 'sg-label')
          .attr('y', r * 2 + 12).attr('text-anchor', 'middle')
          .attr('fill', color).attr('font-family', "'Orbitron', sans-serif")
          .attr('font-size', '10px').attr('font-weight', '700')
          .attr('letter-spacing', '0.1em')
          .text(d.name.length > 22 ? d.name.slice(0, 20) + '\u2026' : d.name);

        // Type badge below label
        el.append('text').attr('class', 'sg-type-badge')
          .attr('y', r * 2 + 24).attr('text-anchor', 'middle')
          .attr('fill', hexToRgba(color, 0.5)).attr('font-family', "'JetBrains Mono', monospace")
          .attr('font-size', '7px').attr('letter-spacing', '0.15em')
          .text(`[ ${(d.nodeType || '').toUpperCase()} ]`);
      });

    // ── Megastructure shapes ──────────────────────────────────
    const megaGroup = g.append('g').attr('class', 'megastructures-group');
    const megaNodes = litNodes.filter(n => n.megastructure != null && !n.isStarGate);

    for (const node of megaNodes) {
      const cluster = clusterMap.get(node.clusterId);
      const color = cluster?.color || '#fff';
      const r = node.radius;

      const mg = megaGroup.append('g')
        .attr('class', `megastructure mega-${node.megastructure}`)
        .attr('transform', `translate(${node.x},${node.y})`)
        .style('--star-color', color);

      if (node.megastructure === 'dyson') {
        // Dyson sphere: hex frame + rotating ring + inner glow fill
        const hexR = r * 2.8;
        const hexPoints = Array.from({ length: 6 }, (_, i) => {
          const a = (Math.PI / 3) * i - Math.PI / 6;
          return `${hexR * Math.cos(a)},${hexR * Math.sin(a)}`;
        }).join(' ');
        // Filled hex with dark metal + neon edge
        mg.append('polygon').attr('class', 'dyson-hex')
          .attr('points', hexPoints)
          .attr('fill', `url(#mega-fill-${node.clusterId})`)
          .attr('stroke', hexToRgba(color, 0.5)).attr('stroke-width', 1.5)
          .style('filter', 'url(#mega-glow)');
        // Rotating dashed ring
        mg.append('circle').attr('class', 'dyson-ring')
          .attr('r', r * 3.2).attr('fill', 'none')
          .attr('stroke', hexToRgba(color, 0.2)).attr('stroke-width', 1)
          .attr('stroke-dasharray', '8 4');
        // Inner hex (smaller, counter-rotation implied by CSS)
        const innerHexR = r * 1.8;
        const innerHexPts = Array.from({ length: 6 }, (_, i) => {
          const a = (Math.PI / 3) * i;
          return `${innerHexR * Math.cos(a)},${innerHexR * Math.sin(a)}`;
        }).join(' ');
        mg.append('polygon').attr('class', 'dyson-inner-hex')
          .attr('points', innerHexPts)
          .attr('fill', 'none')
          .attr('stroke', hexToRgba(color, 0.3)).attr('stroke-width', 0.8);

      } else if (node.megastructure === 'crystal') {
        // Crystal: 8-pointed star with filled interior glow
        const outerR = r * 2.5, innerR = r * 1.4;
        const crystalPoints = Array.from({ length: 16 }, (_, i) => {
          const a = (Math.PI / 8) * i - Math.PI / 2;
          const cr = i % 2 === 0 ? outerR : innerR;
          return `${cr * Math.cos(a)},${cr * Math.sin(a)}`;
        }).join(' ');
        // Filled crystal with neon edges
        mg.append('polygon').attr('class', 'crystal-shape')
          .attr('points', crystalPoints)
          .attr('fill', `url(#mega-fill-${node.clusterId})`)
          .attr('stroke', hexToRgba(color, 0.6)).attr('stroke-width', 1.5)
          .style('filter', 'url(#mega-glow)');
        // Inner diamond
        const iDiamR = r * 1.2;
        const iDiamPts = [`0,${-iDiamR}`, `${iDiamR * 0.6},0`, `0,${iDiamR}`, `${-iDiamR * 0.6},0`].join(' ');
        mg.append('polygon').attr('class', 'crystal-inner')
          .attr('points', iDiamPts)
          .attr('fill', hexToRgba(color, 0.06))
          .attr('stroke', hexToRgba(color, 0.3)).attr('stroke-width', 0.7);

      } else if (node.megastructure === 'station') {
        // Station: pentagon with cross-bars (space station look)
        const pentR = r * 2.2;
        const pentPoints = Array.from({ length: 5 }, (_, i) => {
          const a = (TAU / 5) * i - Math.PI / 2;
          return `${pentR * Math.cos(a)},${pentR * Math.sin(a)}`;
        }).join(' ');
        mg.append('polygon').attr('class', 'station-shape')
          .attr('points', pentPoints)
          .attr('fill', `url(#mega-fill-${node.clusterId})`)
          .attr('stroke', hexToRgba(color, 0.45)).attr('stroke-width', 1.5)
          .style('filter', 'url(#mega-glow)');
        // Cross-bar struts
        for (let i = 0; i < 5; i++) {
          const a = (TAU / 5) * i - Math.PI / 2;
          mg.append('line').attr('class', 'station-strut')
            .attr('x1', 0).attr('y1', 0)
            .attr('x2', pentR * 0.8 * Math.cos(a)).attr('y2', pentR * 0.8 * Math.sin(a))
            .attr('stroke', hexToRgba(color, 0.2)).attr('stroke-width', 0.7);
        }

      } else if (node.megastructure === 'module') {
        // Module: octagon with inner ring (orbital module)
        const octR = r * 2;
        const octPoints = Array.from({ length: 8 }, (_, i) => {
          const a = (TAU / 8) * i;
          return `${octR * Math.cos(a)},${octR * Math.sin(a)}`;
        }).join(' ');
        mg.append('polygon').attr('class', 'module-shape')
          .attr('points', octPoints)
          .attr('fill', `url(#mega-fill-${node.clusterId})`)
          .attr('stroke', hexToRgba(color, 0.35)).attr('stroke-width', 1.2)
          .style('filter', 'url(#mega-glow)');
        mg.append('circle').attr('class', 'module-inner-ring')
          .attr('r', r * 1.2).attr('fill', 'none')
          .attr('stroke', hexToRgba(color, 0.2)).attr('stroke-width', 0.7);

      } else if (node.megastructure === 'diamond') {
        // Diamond: rotated square with filled interior + inner cross
        const diamR = r * 2;
        const diamPoints = [`0,${-diamR}`, `${diamR},0`, `0,${diamR}`, `${-diamR},0`].join(' ');
        mg.append('polygon').attr('class', 'diamond-shape')
          .attr('points', diamPoints)
          .attr('fill', `url(#mega-fill-${node.clusterId})`)
          .attr('stroke', hexToRgba(color, 0.4)).attr('stroke-width', 1.5)
          .style('filter', 'url(#mega-glow)');
        // Inner cross
        mg.append('line').attr('class', 'diamond-cross')
          .attr('x1', 0).attr('y1', -diamR * 0.6).attr('x2', 0).attr('y2', diamR * 0.6)
          .attr('stroke', hexToRgba(color, 0.2)).attr('stroke-width', 0.7);
        mg.append('line').attr('class', 'diamond-cross')
          .attr('x1', -diamR * 0.6).attr('y1', 0).attr('x2', diamR * 0.6).attr('y2', 0)
          .attr('stroke', hexToRgba(color, 0.2)).attr('stroke-width', 0.7);
      }
    }

    // ── Dark star nodes (wireframe aesthetic — Fog of War) ────
    const darkStarElements = nodeGroup.selectAll('.galaxy-star.dark-star')
      .data(darkNodes)
      .enter()
      .append('g')
      .attr('class', 'galaxy-star dark-star')
      .attr('transform', (d: GalaxyNode) => `translate(${d.x},${d.y})`)
      .attr('data-cluster', (d: GalaxyNode) => d.clusterId);

    // Wireframe outer ring
    darkStarElements.append('circle')
      .attr('class', 'dark-wireframe-outer')
      .attr('r', 12).attr('fill', 'none')
      .attr('stroke', (d: GalaxyNode) => hexToRgba(clusterMap.get(d.clusterId)?.color || '#888', 0.06))
      .attr('stroke-width', 0.5).attr('stroke-dasharray', '4 4');

    // Inner ghost circle
    darkStarElements.append('circle')
      .attr('class', 'dark-wireframe-core')
      .attr('r', 5).attr('fill', 'transparent')
      .attr('stroke', (d: GalaxyNode) => hexToRgba(clusterMap.get(d.clusterId)?.color || '#888', 0.12))
      .attr('stroke-width', 1).attr('stroke-dasharray', '2 3');

    // "LOCKED" / "0 SOLVED" label
    darkStarElements.append('text').attr('class', 'dark-locked-label')
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
      .attr('fill', (d: GalaxyNode) => hexToRgba(clusterMap.get(d.clusterId)?.color || '#888', 0.15))
      .attr('font-family', "'Orbitron', sans-serif").attr('font-size', '5px')
      .attr('letter-spacing', '0.15em').attr('font-weight', '700')
      .text((d: GalaxyNode) => d.id.startsWith('algo-') ? '0 SOLVED' : 'LOCKED');

    // Name below (algo ghost → "???" for unsurveyed topics)
    darkStarElements.append('text').attr('class', 'star-label dark-name')
      .attr('y', 16).attr('text-anchor', 'middle')
      .attr('fill', (d: GalaxyNode) => hexToRgba(clusterMap.get(d.clusterId)?.color || '#888', 0.18))
      .attr('font-family', "'Rajdhani', sans-serif")
      .attr('font-size', '8px')
      .text((d: GalaxyNode) => d.id.startsWith('algo-') ? '???' : d.name);

    // "MISSING DATA" / "UNKNOWN SIGNAL" subtext
    darkStarElements.append('text').attr('class', 'dark-missing-label')
      .attr('y', 26).attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255,255,255,0.07)')
      .attr('font-family', "'JetBrains Mono', monospace").attr('font-size', '5px')
      .attr('letter-spacing', '0.1em')
      .text((d: GalaxyNode) => d.id.startsWith('algo-') ? 'UNKNOWN SIGNAL' : 'MISSING DATA');

    // ── Fog of War: dim SVG elements for dark clusters ──────────
    for (let i = 0; i < clusters.length; i++) {
      const b = clusterBrightness[i];
      if (b >= 0.9) continue; // fully lit, skip
      const cid = clusters[i].id;
      // "Deep void" = clusters with ≤1 lit node (data, business)
      const litCount = litNodes.filter(n => n.clusterId === cid).length;
      const isDeepVoid = litCount <= 1;

      if (isDeepVoid) {
        // ── Deep void: nearly invisible, grey only, no color ──
        starElements.filter((d: GalaxyNode) => d.clusterId === cid)
          .style('opacity', 0.06);

        starGateElements.filter((d: GalaxyNode) => d.clusterId === cid)
          .style('opacity', 0.06);

        labelGroup.selectAll('.cluster-label-text')
          .filter(function(this: Element) { return d3.select(this).attr('data-cluster') === cid; })
          .style('opacity', 0.04);

        darkStarElements.filter((ds: GalaxyNode) => ds.clusterId === cid)
          .style('opacity', 0.06);

        edgeElements.filter((e: ConstellationEdge) => {
          const src = nodeMap.get(e.source);
          const tgt = nodeMap.get(e.target);
          return src?.clusterId === cid || tgt?.clusterId === cid;
        }).style('opacity', 0.02)
          .each(function(this: SVGLineElement) {
            d3.select(this).attr('stroke', 'rgba(60,60,60,0.06)');
          });
      } else {
        // ── Standard fog: dim proportionally ──
        starElements.filter((d: GalaxyNode) => d.clusterId === cid)
          .style('opacity', b);

        starGateElements.filter((d: GalaxyNode) => d.clusterId === cid)
          .style('opacity', b);

        labelGroup.selectAll('.cluster-label-text')
          .filter(function(this: Element) { return d3.select(this).attr('data-cluster') === cid; })
          .style('opacity', b);

        edgeElements.filter((e: ConstellationEdge) => {
          const src = nodeMap.get(e.source);
          const tgt = nodeMap.get(e.target);
          return src?.clusterId === cid || tgt?.clusterId === cid;
        }).style('opacity', b * 0.3);
      }
    }

    // ── All interactive nodes (regular + star gates) ──────────
    const allStarElements = d3.selectAll<SVGGElement, GalaxyNode>('.galaxy-star.lit');

    // ── Energy flow particles ─────────────────────────────────
    function spawnEnergyParticles(activeEdges: ConstellationEdge[]) {
      energyGroup.selectAll('.energy-dot').remove();
      for (const e of activeEdges) {
        const src = nodeMap.get(e.source)!;
        const tgt = nodeMap.get(e.target)!;
        const cluster = clusterMap.get(tgt.clusterId);
        const color = cluster?.color || '#fff';

        for (let p = 0; p < 2; p++) {
          const dot = energyGroup.append('circle')
            .attr('class', 'energy-dot').attr('r', 1.5)
            .attr('fill', color).attr('opacity', 0.7)
            .attr('cx', src.x).attr('cy', src.y);

          (function loop() {
            dot.attr('cx', src.x).attr('cy', src.y).attr('opacity', 0.7)
              .transition().duration(1500 + Math.random() * 500).delay(p * 750)
              .ease(d3.easeLinear).attr('cx', tgt.x).attr('cy', tgt.y).attr('opacity', 0.1)
              .on('end', loop);
          })();
        }
      }
    }

    function clearEnergyParticles() {
      energyGroup.selectAll('.energy-dot').interrupt().remove();
    }

    // ── Interaction helpers ───────────────────────────────────
    function collectPrereqChain(nodeId: string, visited: Set<string>): void {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      const node = nodeMap.get(nodeId);
      if (!node) return;
      if (node.prerequisites) {
        for (const pre of node.prerequisites) collectPrereqChain(pre, visited);
      }
      if (node.relatedCourses) {
        for (const cid of node.relatedCourses) collectPrereqChain(cid, visited);
      }
    }

    function collectDownstreamChain(nodeId: string, visited: Set<string>): void {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      for (const c of courses) {
        if (c.prerequisites?.includes(nodeId)) collectDownstreamChain(c.id, visited);
      }
      for (const p of projectNodes) {
        if (p.relatedCourses.includes(nodeId)) collectDownstreamChain(p.id, visited);
      }
      // Also traverse algo prerequisite edges downstream
      for (const e of algoEdges) {
        if (e.source === nodeId) collectDownstreamChain(e.target, visited);
      }
    }

    // ── Overclocking: collect upstream skills that a project depends on ──
    function collectUpstreamSkills(nodeId: string): Set<string> {
      const upstream = new Set<string>();
      const node = nodeMap.get(nodeId);
      if (!node) return upstream;
      // Only overclock when the source is a project-like node
      const isProjectLike = ['project', 'thesis', 'publication', 'internship', 'repo'].includes(node.nodeType as string);
      if (!isProjectLike && !node.isStarGate) return upstream;

      // Collect direct related courses + prerequisites (upstream skills)
      if (node.relatedCourses) {
        for (const cid of node.relatedCourses) {
          upstream.add(cid);
          // Also add prerequisites of those courses
          const cNode = nodeMap.get(cid);
          if (cNode?.prerequisites) {
            for (const pre of cNode.prerequisites) upstream.add(pre);
          }
        }
      }
      if (node.prerequisites) {
        for (const pre of node.prerequisites) upstream.add(pre);
      }
      return upstream;
    }

    // Spawn reverse energy particles (from project → upstream skill)
    function spawnOverclockParticles(sourceNode: GalaxyNode, targetIds: Set<string>) {
      for (const tid of targetIds) {
        const tgt = nodeMap.get(tid);
        if (!tgt || tgt.isDark) continue;
        const cluster = clusterMap.get(tgt.clusterId);
        // Overclock particles are always purple-white
        const color = '#c8a0ff';

        for (let p = 0; p < 3; p++) {
          const dot = energyGroup.append('circle')
            .attr('class', 'energy-dot overclock-particle')
            .attr('r', 2)
            .attr('fill', color)
            .attr('opacity', 0.9)
            .attr('cx', sourceNode.x)
            .attr('cy', sourceNode.y);

          (function loop() {
            dot.attr('cx', sourceNode.x).attr('cy', sourceNode.y).attr('opacity', 0.9)
              .transition().duration(800 + Math.random() * 400).delay(p * 300)
              .ease(d3.easeCubicOut)
              .attr('cx', tgt.x).attr('cy', tgt.y).attr('opacity', 0.3)
              .on('end', loop);
          })();
        }
      }
    }

    function highlightChain(d: GalaxyNode) {
      const chain = new Set<string>();
      collectPrereqChain(d.id, chain);
      collectDownstreamChain(d.id, chain);

      // ── OVERCLOCKING: identify upstream skills for project nodes ──
      const overclocked = collectUpstreamSkills(d.id);

      allStarElements.classed('dimmed', (n: GalaxyNode) => !chain.has(n.id));
      allStarElements.classed('highlighted', (n: GalaxyNode) => chain.has(n.id) && n.id !== d.id);
      // Apply overclocked class to upstream dependency nodes
      allStarElements.classed('overclocked', (n: GalaxyNode) => overclocked.has(n.id));

      const activeEdges: ConstellationEdge[] = [];
      edgeElements.each(function(this: SVGLineElement, e: ConstellationEdge) {
        const inChain = chain.has(e.source) && chain.has(e.target);
        const isOverclockEdge = overclocked.has(e.source) || overclocked.has(e.target);
        d3.select(this)
          .classed('highlighted', inChain)
          .classed('dimmed', !inChain)
          .classed('overclocked', inChain && isOverclockEdge);
        if (inChain) {
          const tgt = nodeMap.get(e.target);
          const cluster = tgt ? clusterMap.get(tgt.clusterId) : null;
          // Overclock edges glow purple
          const color = (isOverclockEdge) ? '#c8a0ff' : (cluster?.color || '#fff');
          d3.select(this).attr('stroke', hexToRgba(color, 0.6)).style('--edge-color', color);
          activeEdges.push(e);
        }
      });

      spawnEnergyParticles(activeEdges);

      // Spawn reverse overclock particles (project → skills)
      if (overclocked.size > 0) {
        spawnOverclockParticles(d, overclocked);
      }

      return chain;
    }

    function clearHighlight() {
      allStarElements.classed('dimmed', false).classed('highlighted', false).classed('overclocked', false);
      edgeElements.classed('highlighted', false).classed('dimmed', false).classed('overclocked', false)
        .each(function(this: SVGLineElement, d: ConstellationEdge, i: number) {
          d3.select(this).attr('stroke', `url(#edge-grad-${i})`);
        });
      clearEnergyParticles();
      darkStarElements.classed('visible', false);
      // Remove stargate-focus mode
      container.classList.remove('stargate-focus');
    }

    // ── Shockwave ring effect ──────────────────────────────────
    function spawnShockwave(x: number, y: number, color: string) {
      const ring = g.append('circle')
        .attr('class', 'shockwave-ring')
        .attr('cx', x).attr('cy', y)
        .attr('r', 4)
        .attr('fill', 'none')
        .attr('stroke', hexToRgba(color, 0.5))
        .attr('stroke-width', 2);

      ring.transition()
        .duration(600)
        .ease(d3.easeCubicOut)
        .attr('r', 60)
        .attr('stroke-width', 0.3)
        .attr('stroke', hexToRgba(color, 0))
        .remove();
    }

    // ── HUD notification popup ──────────────────────────────────
    function showHUDNotification(text: string, color: string) {
      // Remove any existing notification
      container.querySelector('.hud-notification')?.remove();

      const notif = document.createElement('div');
      notif.className = 'hud-notification';
      notif.style.setProperty('--hud-notif-color', color);
      notif.innerHTML = `<span class="hud-notif-icon">&#9670;</span> ${text}`;
      container.appendChild(notif);

      // Trigger animation
      requestAnimationFrame(() => notif.classList.add('visible'));

      setTimeout(() => {
        notif.classList.remove('visible');
        setTimeout(() => notif.remove(), 400);
      }, 2000);
    }

    // ── Screen micro-shake ──────────────────────────────────────
    function screenShake() {
      container.classList.add('screen-shake');
      setTimeout(() => container.classList.remove('screen-shake'), 300);
    }

    // ── Regular star hover ────────────────────────────────────
    starElements.on('mouseenter', (_event: MouseEvent, d: GalaxyNode) => {
      const chain = highlightChain(d);
      darkStarElements.filter((ds: GalaxyNode) => ds.clusterId === d.clusterId).classed('visible', true);

      const cluster = clusterMap.get(d.clusterId);
      const color = cluster?.color || '#fff';
      spawnShockwave(d.x, d.y, color);
    });

    starElements.on('mouseleave', () => {
      clearHighlight();
    });

    // ── STAR GATE hover: dramatic dimming + overclocking ──────
    starGateElements.on('mouseenter', (_event: MouseEvent, d: GalaxyNode) => {
      container.classList.add('stargate-focus');
      highlightChain(d);

      const cluster = clusterMap.get(d.clusterId);
      const color = cluster?.color || '#4fc3f7';
      spawnShockwave(d.x, d.y, color);
      showHUDNotification(`STAR GATE ONLINE: ${d.name}`, color);
    });

    starGateElements.on('mouseleave', () => {
      clearHighlight();
    });

    // ── Regular star click → standard detail panel ────────────
    const detailPanel = container.querySelector('.galaxy-detail-panel') as HTMLElement | null;
    const sgPanel = container.querySelector('.stargate-detail-panel') as HTMLElement | null;

    starElements.on('click', (event: MouseEvent, d: GalaxyNode) => {
      event.stopPropagation();
      closeStarGatePanel();
      showDetailPanel(d);
    });

    function showDetailPanel(d: GalaxyNode) {
      if (!detailPanel) return;

      const cluster = clusterMap.get(d.clusterId);
      const color = cluster?.color || '#4fc3f7';
      const isAlgo = d.id.startsWith('algo-');
      const algoExtra = isAlgo ? algoNodeExtras.get(d.id) : null;

      detailPanel.style.setProperty('--detail-color', color);
      detailPanel.querySelector('h3')!.textContent = d.name;

      const codeEl = detailPanel.querySelector('.detail-code') as HTMLElement;
      if (isAlgo && algoExtra) {
        codeEl.textContent = `> MASTERY: ${algoExtra.masteryPct}%  (${algoExtra.solvedCount} solved)`;
        codeEl.style.display = 'block';
      } else {
        codeEl.textContent = d.code ? `> ${d.code}` : (d.venue ? `> ${d.venue}` : '');
        codeEl.style.display = (d.code || d.venue) ? 'block' : 'none';
      }

      // Mastery bar (algo topics only)
      let masteryBarEl = detailPanel.querySelector('.algo-mastery-bar') as HTMLElement | null;
      if (isAlgo && algoExtra) {
        if (!masteryBarEl) {
          masteryBarEl = document.createElement('div');
          masteryBarEl.className = 'algo-mastery-bar';
          masteryBarEl.innerHTML = '<div class="algo-mastery-fill"></div>';
          codeEl.insertAdjacentElement('afterend', masteryBarEl);
        }
        masteryBarEl.style.display = 'block';
        const fill = masteryBarEl.querySelector('.algo-mastery-fill') as HTMLElement;
        requestAnimationFrame(() => { fill.style.width = `${algoExtra.masteryPct}%`; });
      } else if (masteryBarEl) {
        masteryBarEl.style.display = 'none';
      }

      // Tag chips (algo topics only)
      let tagChipsEl = detailPanel.querySelector('.algo-tag-chips') as HTMLElement | null;
      if (isAlgo && algoExtra) {
        if (!tagChipsEl) {
          tagChipsEl = document.createElement('div');
          tagChipsEl.className = 'algo-tag-chips';
          const masteryBar = detailPanel.querySelector('.algo-mastery-bar');
          (masteryBar || codeEl).insertAdjacentElement('afterend', tagChipsEl);
        }
        tagChipsEl.style.display = 'block';
        tagChipsEl.innerHTML = algoExtra.tagSlugs.map(s =>
          `<span class="algo-tag-chip">${s}</span>`
        ).join('');
      } else if (tagChipsEl) {
        tagChipsEl.style.display = 'none';
      }

      const metaEl = detailPanel.querySelector('.detail-meta') as HTMLElement;
      const instBadge = metaEl.querySelector('.detail-institution-badge') as HTMLElement;
      const yearEl = metaEl.querySelector('.detail-year') as HTMLElement;

      if (isAlgo) {
        instBadge.style.display = 'none';
        yearEl.textContent = '';
      } else if (d.institution) {
        instBadge.textContent = d.institution;
        instBadge.style.display = 'inline-block';
        yearEl.textContent = d.semester && d.year ? `${d.semester} ${d.year}` : '';
      } else {
        instBadge.style.display = 'none';
        yearEl.textContent = d.semester && d.year ? `${d.semester} ${d.year}` : '';
      }

      const gradeEl = detailPanel.querySelector('.detail-grade') as HTMLElement;
      if (isAlgo && algoExtra) {
        gradeEl.textContent = algoExtra.starClassLabel;
        gradeEl.style.display = 'inline-block';
      } else if (d.grade) {
        gradeEl.textContent = d.grade;
        gradeEl.style.display = 'inline-block';
      } else {
        gradeEl.style.display = 'none';
      }

      const typeEl = detailPanel.querySelector('.detail-type') as HTMLElement;
      if (typeEl) {
        typeEl.textContent = isAlgo && algoExtra
          ? `[ ${algoExtra.starClassLabel.toUpperCase()} ]`
          : `[ ${(d.nodeType || 'course').toUpperCase()} ]`;
        typeEl.style.color = color;
      }

      const trackEl = detailPanel.querySelector('.detail-track') as HTMLElement;
      if (isAlgo) {
        trackEl.textContent = 'ALGORITHMS';
      } else {
        const trackObj = d.track ? trackMap.get(d.track) : null;
        trackEl.textContent = cluster?.label || trackObj?.label || '';
      }

      // Links section (repos, papers, demos for project-like nodes)
      const linksSection = detailPanel.querySelector('.detail-links') as HTMLElement;
      const linkList = linksSection.querySelector('.detail-link-list') as HTMLElement;
      linkList.innerHTML = '';
      {
        const links: { label: string; href: string }[] = [];

        // Direct URL on the node
        if (d.url) {
          const isGithub = d.url.includes('github.com');
          const isArxiv = d.url.includes('arxiv.org');
          links.push({ label: isGithub ? '[ GITHUB ]' : isArxiv ? '[ ARXIV ]' : '[ LINK ]', href: d.url });
        }

        // Match against project data for additional links
        const projData = (window as any).__galaxyProjects;
        if (projData) {
          for (const proj of projData) {
            const nameNorm = d.name.toLowerCase().replace(/[-_&]/g, ' ').replace(/\s+/g, ' ');
            const slugNorm = proj.slug.replace(/-/g, ' ');
            const titleNorm = proj.title.toLowerCase().replace(/[-_&]/g, ' ').replace(/\s+/g, ' ');
            const slugMatch = nameNorm.includes(slugNorm) || slugNorm.includes(nameNorm);
            const titleMatch = titleNorm.includes(nameNorm) || nameNorm.includes(titleNorm);
            if (slugMatch || titleMatch) {
              if (proj.githubUrl && !links.some(l => l.href === proj.githubUrl)) {
                links.push({ label: '[ GITHUB ]', href: proj.githubUrl });
              }
              if (proj.paperUrl) {
                links.push({ label: '[ PAPER ]', href: proj.paperUrl });
              }
              if (proj.liveUrl) {
                links.push({ label: '[ DEMO ]', href: proj.liveUrl });
              }
            }
          }
        }

        if (links.length > 0) {
          linksSection.style.display = 'block';
          for (const link of links) {
            const a = document.createElement('a');
            a.href = link.href;
            a.target = '_blank';
            a.rel = 'noopener';
            a.className = 'sg-link';
            a.textContent = link.label;
            a.style.color = color;
            linkList.appendChild(a);
          }
        } else {
          linksSection.style.display = 'none';
        }
      }

      // Prerequisites section
      const prereqSection = detailPanel.querySelector('.detail-prereqs') as HTMLElement;
      const prereqList = prereqSection.querySelector('.detail-list') as HTMLElement;
      prereqList.innerHTML = '';
      const prereqs = d.prerequisites || [];
      const isProjectLike = ['project', 'thesis', 'internship', 'publication', 'repo'].includes(d.nodeType as string);

      if (isAlgo && prereqs.length > 0) {
        // Algo topic: show prerequisite algorithm topics (clickable)
        prereqSection.style.display = 'block';
        prereqSection.querySelector('h4')!.textContent = 'PREREQUISITES';
        for (const preId of prereqs) {
          const preNode = nodeMap.get(preId);
          if (preNode) {
            const item = document.createElement('div');
            item.className = 'detail-prereq-item';
            item.textContent = preNode.name;
            item.addEventListener('click', () => {
              showDetailPanel(preNode);
            });
            prereqList.appendChild(item);
          }
        }
      } else if (isProjectLike && d.relatedCourses && d.relatedCourses.length > 0) {
        prereqSection.style.display = 'block';
        prereqSection.querySelector('h4')!.textContent = 'RELATED COURSES';
        for (const cid of d.relatedCourses) {
          const cNode = nodeMap.get(cid);
          if (cNode) {
            const item = document.createElement('div');
            item.className = 'detail-prereq-item';
            item.textContent = `${cNode.code || ''} ${cNode.name}`;
            item.addEventListener('click', () => {
              const nodeEl = starElements.filter((n: GalaxyNode) => n.id === cid);
              nodeEl.dispatch('click');
            });
            prereqList.appendChild(item);
          }
        }
      } else if (prereqs.length > 0) {
        prereqSection.style.display = 'block';
        prereqSection.querySelector('h4')!.textContent = 'PREREQUISITES';
        for (const preId of prereqs) {
          const preNode = nodeMap.get(preId);
          if (preNode) {
            const item = document.createElement('div');
            item.className = 'detail-prereq-item';
            item.textContent = `${preNode.code || ''} ${preNode.name}`;
            item.addEventListener('click', () => {
              const nodeEl = starElements.filter((n: GalaxyNode) => n.id === preId);
              nodeEl.dispatch('click');
            });
            prereqList.appendChild(item);
          }
        }
      } else {
        prereqSection.style.display = 'none';
      }

      // Related projects section (hidden for algo topics)
      const projectSection = detailPanel.querySelector('.detail-projects') as HTMLElement;
      const projectList = projectSection.querySelector('.detail-list') as HTMLElement;
      projectList.innerHTML = '';

      if (isAlgo) {
        projectSection.style.display = 'none';
      } else if (!isProjectLike) {
        const relatedProjectIds = d.relatedProjects || [];
        const referencing = projectNodes.filter(p => p.relatedCourses.includes(d.id));
        const allRelated = new Set([...relatedProjectIds, ...referencing.map(p => p.id)]);
        if (allRelated.size > 0) {
          projectSection.style.display = 'block';
          for (const projId of allRelated) {
            const projNode = nodeMap.get(projId);
            if (projNode) {
              const item = document.createElement('div');
              item.className = 'detail-related-item';
              item.textContent = projNode.name;
              item.addEventListener('click', () => {
                const nodeEl = starElements.filter((n: GalaxyNode) => n.id === projId);
                nodeEl.dispatch('click');
              });
              projectList.appendChild(item);
            }
          }
        } else {
          projectSection.style.display = 'none';
        }
      } else {
        projectSection.style.display = 'none';
      }

      detailPanel.classList.add('visible');
      highlightChain(d);
    }

    // ── STAR GATE click: cinematic fly-in + rich panel ────────
    starGateElements.on('click', (event: MouseEvent, d: GalaxyNode) => {
      event.stopPropagation();
      closePanel();

      const cluster = clusterMap.get(d.clusterId);
      const color = cluster?.color || '#4fc3f7';

      // Cinematic warp zoom + screen shake
      screenShake();
      bg.setWarpIntensity(1.0);
      bg.setFogOfWar(d.clusterId);
      container.classList.add('stargate-focus');

      const targetScale = 2.5;
      const targetTransform = d3.zoomIdentity
        .translate(cx - d.x * targetScale, cy - d.y * targetScale)
        .scale(targetScale);

      svg.transition()
        .duration(900)
        .ease(d3.easeCubicInOut)
        .call(zoom.transform, targetTransform)
        .on('end', () => {
          bg.setWarpIntensity(0.0);
        });

      highlightChain(d);

      // Show Star Gate panel
      if (!sgPanel) return;
      sgPanel.style.setProperty('--sg-color', color);

      const sgTitle = sgPanel.querySelector('.sg-title') as HTMLElement;
      if (sgTitle) sgTitle.textContent = d.name;

      const sgType = sgPanel.querySelector('.sg-type') as HTMLElement;
      if (sgType) sgType.textContent = `[ ${(d.nodeType || '').toUpperCase()} ]`;

      const sgVenue = sgPanel.querySelector('.sg-venue') as HTMLElement;
      if (sgVenue) {
        sgVenue.textContent = d.venue || '';
        sgVenue.style.display = d.venue ? 'block' : 'none';
      }

      const sgYear = sgPanel.querySelector('.sg-year') as HTMLElement;
      if (sgYear) sgYear.textContent = d.semester && d.year ? `${d.semester} ${d.year}` : '';

      // Links
      const sgLinks = sgPanel.querySelector('.sg-links') as HTMLElement;
      if (sgLinks) {
        sgLinks.innerHTML = '';
        if (d.url) {
          const a = document.createElement('a');
          a.href = d.url;
          a.target = '_blank';
          a.rel = 'noopener';
          a.className = 'sg-link';
          const isGH = d.url.includes('github.com');
          const isArxiv = d.url.includes('arxiv.org');
          a.textContent = isGH ? '[ GITHUB ]' : isArxiv ? '[ ARXIV ]' : '[ LINK ]';
          sgLinks.appendChild(a);
        }
        // Check project data for more links
        const projData = (window as any).__galaxyProjects;
        if (projData) {
          for (const proj of projData) {
            const sgNameNorm = d.name.toLowerCase().replace(/[-_&]/g, ' ').replace(/\s+/g, ' ');
            const sgSlugNorm = proj.slug.replace(/-/g, ' ');
            const sgTitleNorm = proj.title.toLowerCase().replace(/[-_&]/g, ' ').replace(/\s+/g, ' ');
            const matchesName = sgNameNorm.includes(sgSlugNorm) || sgSlugNorm.includes(sgNameNorm) ||
              sgTitleNorm.includes(sgNameNorm) || sgNameNorm.includes(sgTitleNorm);
            if (matchesName) {
              if (proj.githubUrl && !d.url?.includes('github.com')) {
                const a = document.createElement('a');
                a.href = proj.githubUrl;
                a.target = '_blank';
                a.rel = 'noopener';
                a.className = 'sg-link';
                a.textContent = '[ GITHUB ]';
                sgLinks.appendChild(a);
              }
              if (proj.paperUrl) {
                const a = document.createElement('a');
                a.href = proj.paperUrl;
                a.target = '_blank';
                a.rel = 'noopener';
                a.className = 'sg-link';
                a.textContent = '[ PAPER ]';
                sgLinks.appendChild(a);
              }
              if (proj.liveUrl) {
                const a = document.createElement('a');
                a.href = proj.liveUrl;
                a.target = '_blank';
                a.rel = 'noopener';
                a.className = 'sg-link';
                a.textContent = '[ DEMO ]';
                sgLinks.appendChild(a);
              }
            }
          }
        }
      }

      // Tech stack (related courses)
      const sgStack = sgPanel.querySelector('.sg-stack') as HTMLElement;
      if (sgStack) {
        sgStack.innerHTML = '';
        const relCourses = d.relatedCourses || [];
        for (const cid of relCourses) {
          const cNode = nodeMap.get(cid);
          if (cNode) {
            const chip = document.createElement('span');
            chip.className = 'sg-stack-chip';
            chip.textContent = cNode.code || cNode.name;
            chip.style.borderColor = hexToRgba(color, 0.3);
            chip.addEventListener('click', () => {
              closeStarGatePanel();
              showDetailPanel(cNode);
            });
            sgStack.appendChild(chip);
          }
        }
      }

      sgPanel.classList.add('visible');
    });

    // ── Close panels ──────────────────────────────────────────
    function closePanel(): void {
      if (!detailPanel) return;
      detailPanel.classList.remove('visible');
      clearHighlight();
    }

    function closeStarGatePanel(): void {
      if (!sgPanel) return;
      sgPanel.classList.remove('visible');
      container.classList.remove('stargate-focus');
    }

    function closeAll(): void {
      closePanel();
      closeStarGatePanel();
      clearHighlight();
      bg.setFogOfWar(null);
    }

    detailPanel?.querySelector('.close-btn')?.addEventListener('click', closePanel);
    sgPanel?.querySelector('.sg-close-btn')?.addEventListener('click', () => {
      closeStarGatePanel();
      clearHighlight();
      bg.setFogOfWar(null);
      // Reset zoom
      svg.transition().duration(500).call(zoom.transform, initialTransform);
    });
    svg.on('click', closeAll);

    // ── Sidebar: cluster navigation with warp ─────────────────
    container.querySelectorAll('.cluster-nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAll();
        const clusterId = (btn as HTMLElement).dataset.cluster!;
        const center = clusterCenters.get(clusterId);
        if (!center) return;

        bg.setWarpIntensity(1.0);
        bg.setFogOfWar(clusterId);

        const targetScale = 1.8;
        const targetTransform = d3.zoomIdentity
          .translate(cx - center.x * targetScale, cy - center.y * targetScale)
          .scale(targetScale);

        svg.transition()
          .duration(750)
          .call(zoom.transform, targetTransform)
          .on('end', () => { bg.setWarpIntensity(0.0); });

        darkStarElements.classed('visible', (ds: GalaxyNode) => ds.clusterId === clusterId);
        container.querySelectorAll('.cluster-nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // ── XP display (outliner + top bar) ─────────────────────────
    // Outliner XP bar
    const xpBarFill = container.querySelector('.xp-bar-fill') as HTMLElement | null;
    const xpValueEl = container.querySelector('.xp-value');
    if (xpBarFill) {
      const progress = (xpResult.xp - xpResult.currentLevelXP) / (xpResult.nextLevelXP - xpResult.currentLevelXP);
      xpBarFill.style.width = `${Math.min(100, progress * 100)}%`;
    }
    if (xpValueEl) xpValueEl.textContent = `${xpResult.xp} / ${xpResult.nextLevelXP} XP`;

    // Top bar XP level/rank (outside container, use document)
    document.querySelectorAll('[data-xp-level]').forEach(el => {
      el.textContent = `LVL ${xpResult.level}`;
    });
    document.querySelectorAll('[data-xp-rank]').forEach(el => {
      el.textContent = xpResult.rank;
    });

    // Cluster counts (outliner)
    container.querySelectorAll('.cluster-nav-btn').forEach(btn => {
      const clusterId = (btn as HTMLElement).dataset.cluster!;
      const countEl = btn.querySelector('.cluster-count');
      if (countEl) {
        const count = litNodes.filter(n => n.clusterId === clusterId).length;
        countEl.textContent = `${count}`;
      }
    });

    // Top bar resource counters (per-cluster XP)
    for (const cluster of clusters) {
      const clusterXP = litNodes.filter(n => n.clusterId === cluster.id).length * 30;
      document.querySelectorAll(`[data-cluster-xp="${cluster.id}"]`).forEach(el => {
        el.textContent = `+${clusterXP}`;
      });
    }

    // ── Zoom controls (in bottom bar, use document) ────────────
    const zoomInBtn = document.querySelector('.zoom-in');
    const zoomOutBtn = document.querySelector('.zoom-out');
    const zoomResetBtn = document.querySelector('.zoom-reset');

    zoomInBtn?.addEventListener('click', () => {
      svg.transition().duration(300).call(zoom.scaleBy, 1.4);
    });
    zoomOutBtn?.addEventListener('click', () => {
      svg.transition().duration(300).call(zoom.scaleBy, 0.7);
    });
    zoomResetBtn?.addEventListener('click', () => {
      closeAll();
      bg.setWarpIntensity(0);
      bg.setFogOfWar(null);
      svg.transition().duration(500).call(zoom.transform, initialTransform);
      darkStarElements.classed('visible', false);
      container.querySelectorAll('.cluster-nav-btn').forEach(b => b.classList.remove('active'));
    });

    // ── Resize handler ────────────────────────────────────────
    window.addEventListener('resize', () => {
      const newRect = container.getBoundingClientRect();
      const nw = newRect.width;
      const nh = newRect.height;
      svg.attr('width', nw).attr('height', nh);
      bg.resize(nw, nh);
    });
  });
}
