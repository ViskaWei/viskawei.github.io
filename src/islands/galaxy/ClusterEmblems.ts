/**
 * ClusterEmblems — SVG path data and rendering for Stellaris-style
 * empire emblems, one per skill-galaxy cluster.
 */

// ── Emblem path data ──────────────────────────────────────────────

export interface EmblemDef {
  paths: string[];
  viewBox: string;
}

/**
 * Each emblem is drawn in a 64x64 viewBox with clean geometric strokes.
 * Paths use fill only (no stroke) so they scale crisply at any size.
 */
export const CLUSTER_EMBLEMS: Record<string, EmblemDef> = {
  /* ── Physics: atom with 3 elliptical orbits + nucleus ───────── */
  physics: {
    viewBox: '0 0 64 64',
    paths: [
      // nucleus dot
      'M32 32 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0',
      // orbit 1 — horizontal ellipse
      'M32 32 m-22 0 a22 9 0 1 0 44 0 a22 9 0 1 0 -44 0 M32 32 m-20 0 a20 7 0 1 1 40 0 a20 7 0 1 1 -40 0',
      // orbit 2 — rotated 60deg
      'M32 32 m-11 -19.05 a22 9 30 1 0 22 38.1 a22 9 30 1 0 -22 -38.1 M32 32 m-10 -17.32 a20 7 30 1 1 20 34.64 a20 7 30 1 1 -20 -34.64',
      // orbit 3 — rotated -60deg
      'M32 32 m11 -19.05 a22 9 -30 1 0 -22 38.1 a22 9 -30 1 0 22 -38.1 M32 32 m10 -17.32 a20 7 -30 1 1 -20 34.64 a20 7 -30 1 1 20 -34.64',
    ],
  },

  /* ── Math: integral symbol (∫) ──────────────────────────────── */
  math: {
    viewBox: '0 0 64 64',
    paths: [
      // stylised integral curve
      'M38 8 C44 8 46 14 46 20 L46 44 C46 50 44 56 38 56 ' +
        'L36 56 C30 56 28 50 28 44 ' +
        'M26 56 C20 56 18 50 18 44 L18 20 C18 14 20 8 26 8 ' +
        'L28 8 C34 8 36 14 36 20',
      // top serif dot
      'M38 6 m-2.5 0 a2.5 2.5 0 1 0 5 0 a2.5 2.5 0 1 0 -5 0',
      // bottom serif dot
      'M26 58 m-2.5 0 a2.5 2.5 0 1 0 5 0 a2.5 2.5 0 1 0 -5 0',
    ],
  },

  /* ── CS: angle brackets < / > ──────────────────────────────── */
  cs: {
    viewBox: '0 0 64 64',
    paths: [
      // left bracket <
      'M22 32 L8 20 L8 16 L24 28 L24 36 L8 48 L8 44 Z',
      // right bracket >
      'M42 32 L56 20 L56 16 L40 28 L40 36 L56 48 L56 44 Z',
      // forward slash /
      'M29 52 L35 12 L38 12 L32 52 Z',
    ],
  },

  /* ── AI/ML: neural network — 6 nodes with connecting lines ── */
  aiml: {
    viewBox: '0 0 64 64',
    paths: [
      // input layer nodes
      'M12 16 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0',
      'M12 32 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0',
      'M12 48 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0',
      // hidden layer nodes
      'M32 22 m-4.5 0 a4.5 4.5 0 1 0 9 0 a4.5 4.5 0 1 0 -9 0',
      'M32 42 m-4.5 0 a4.5 4.5 0 1 0 9 0 a4.5 4.5 0 1 0 -9 0',
      // output node
      'M52 32 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0',
      // connections input→hidden (6 lines)
      'M16 16 L27.5 22 L28.5 20.5 L17 14.5 Z',
      'M16 16 L27.5 42 L28.5 40.5 L17 14.5 Z',
      'M16 32 L27.5 22 L28.5 23.5 L17 33.5 Z',
      'M16 32 L27.5 42 L28.5 40.5 L17 30.5 Z',
      'M16 48 L27.5 22 L28.5 23.5 L17 49.5 Z',
      'M16 48 L27.5 42 L28.5 43.5 L17 49.5 Z',
      // connections hidden→output (2 lines)
      'M36.5 22 L47 32 L48 30.5 L37.5 20.5 Z',
      'M36.5 42 L47 32 L48 33.5 L37.5 43.5 Z',
    ],
  },

  /* ── Engineering: hexagonal gear ────────────────────────────── */
  engineering: {
    viewBox: '0 0 64 64',
    paths: [
      // outer gear ring with 6 teeth
      'M32 6 L36 6 L38 12 L44 14 L49 9 L52 12 L48 18 L50 24 L56 26 L56 30 ' +
        'L50 32 L50 38 L56 40 L56 44 L50 46 L48 52 L52 56 L49 59 L44 54 ' +
        'L38 56 L36 62 L28 62 L26 56 L20 54 L15 59 L12 56 L16 52 L14 46 ' +
        'L8 44 L8 40 L14 38 L14 32 L8 30 L8 26 L14 24 L16 18 L12 12 ' +
        'L15 9 L20 14 L26 12 L28 6 Z ' +
        // inner cutout (counter-clockwise for hole)
        'M32 22 L24.5 26.3 L24.5 37.7 L32 42 L39.5 37.7 L39.5 26.3 Z',
      // center dot
      'M32 32 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0',
    ],
  },

  /* ── Data/Finance: classical columns (Parthenon) ──────────────── */
  data: {
    viewBox: '0 0 64 64',
    paths: [
      // pediment (triangle roof)
      'M8 18 L32 6 L56 18 L54 20 L32 9 L10 20 Z',
      // entablature (horizontal beam)
      'M10 20 L54 20 L54 24 L10 24 Z',
      // left column
      'M14 24 L14 50 L20 50 L20 24 Z',
      // center column
      'M29 24 L29 50 L35 50 L35 24 Z',
      // right column
      'M44 24 L44 50 L50 50 L50 24 Z',
      // base platform
      'M8 50 L56 50 L56 54 L8 54 Z',
      // steps
      'M6 54 L58 54 L58 57 L6 57 Z',
    ],
  },

  /* ── Business/Society: people / community silhouette ─────────── */
  business: {
    viewBox: '0 0 64 64',
    paths: [
      // center person head
      'M32 12 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0',
      // center person body
      'M24 26 C24 22 28 20 32 20 C36 20 40 22 40 26 L40 40 L24 40 Z',
      // left person head
      'M14 18 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0',
      // left person body
      'M8 30 C8 26 11 24 14 24 C17 24 20 26 20 30 L20 44 L8 44 Z',
      // right person head
      'M50 18 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0',
      // right person body
      'M44 30 C44 26 47 24 50 24 C53 24 56 26 56 30 L56 44 L44 44 Z',
      // shared base/ground
      'M6 44 L58 44 L58 48 L6 48 Z',
    ],
  },
};

// ── Standalone SVG element factory ────────────────────────────────

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Create a standalone `<svg>` DOM element for a cluster emblem.
 * Used outside D3 contexts (e.g. sidebar, tooltip overlays).
 */
export function createEmblemSVG(
  clusterId: string,
  color: string,
  size: number = 96,
): SVGElement {
  const def = CLUSTER_EMBLEMS[clusterId];
  if (!def) {
    // return empty svg for unknown cluster
    const empty = document.createElementNS(SVG_NS, 'svg');
    empty.setAttribute('width', String(size));
    empty.setAttribute('height', String(size));
    return empty;
  }

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('xmlns', SVG_NS);
  svg.setAttribute('viewBox', def.viewBox);
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.style.overflow = 'visible';

  // drop-shadow filter
  const filterId = `emblem-glow-${clusterId}`;
  const defs = document.createElementNS(SVG_NS, 'defs');
  const filter = document.createElementNS(SVG_NS, 'filter');
  filter.setAttribute('id', filterId);
  filter.setAttribute('x', '-50%');
  filter.setAttribute('y', '-50%');
  filter.setAttribute('width', '200%');
  filter.setAttribute('height', '200%');

  const feFlood = document.createElementNS(SVG_NS, 'feFlood');
  feFlood.setAttribute('flood-color', color);
  feFlood.setAttribute('flood-opacity', '0.6');
  feFlood.setAttribute('result', 'flood');

  const feComposite = document.createElementNS(SVG_NS, 'feComposite');
  feComposite.setAttribute('in', 'flood');
  feComposite.setAttribute('in2', 'SourceGraphic');
  feComposite.setAttribute('operator', 'in');
  feComposite.setAttribute('result', 'colored');

  const feBlur = document.createElementNS(SVG_NS, 'feGaussianBlur');
  feBlur.setAttribute('in', 'colored');
  feBlur.setAttribute('stdDeviation', '3');
  feBlur.setAttribute('result', 'blur');

  const feMerge = document.createElementNS(SVG_NS, 'feMerge');
  const mergeBlur = document.createElementNS(SVG_NS, 'feMergeNode');
  mergeBlur.setAttribute('in', 'blur');
  const mergeSource = document.createElementNS(SVG_NS, 'feMergeNode');
  mergeSource.setAttribute('in', 'SourceGraphic');
  feMerge.appendChild(mergeBlur);
  feMerge.appendChild(mergeSource);

  filter.append(feFlood, feComposite, feBlur, feMerge);
  defs.appendChild(filter);
  svg.appendChild(defs);

  // paths
  const g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('fill', '#ffffff');
  g.setAttribute('fill-opacity', '0.6');
  g.setAttribute('filter', `url(#${filterId})`);

  for (const d of def.paths) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    g.appendChild(path);
  }

  svg.appendChild(g);
  return svg;
}

// ── D3 group renderer ─────────────────────────────────────────────

export interface ClusterPosition {
  id: string;
  color: string;
  x: number;
  y: number;
}

/**
 * Render emblems into a D3 `<g>` selection, one per cluster center.
 * Each emblem is an SVG `<g>` with `<path>` children, centered at (x, y).
 *
 * @param d3Group  A D3 selection of a `<g>` element to append into.
 * @param clusters Array of cluster positions with id, color, x, y.
 * @param scale    Multiplier controlling emblem size (1.0 ≈ 80px).
 */
export function renderEmblemsToGroup(
  d3Group: any,
  clusters: ClusterPosition[],
  scale: number = 1.0,
): void {
  const filterId = 'emblem-cluster-glow';

  // Ensure a shared filter <defs> exists
  let defs = d3Group.select('defs.emblem-defs');
  if (defs.empty()) {
    defs = d3Group.append('defs').attr('class', 'emblem-defs');
  }

  for (const cluster of clusters) {
    const def = CLUSTER_EMBLEMS[cluster.id];
    if (!def) continue;

    // Per-cluster filter for the glow color
    const fid = `${filterId}-${cluster.id}`;
    if (defs.select(`#${fid}`).empty()) {
      const filter = defs.append('filter')
        .attr('id', fid)
        .attr('x', '-50%')
        .attr('y', '-50%')
        .attr('width', '200%')
        .attr('height', '200%');

      filter.append('feFlood')
        .attr('flood-color', cluster.color)
        .attr('flood-opacity', 0.6)
        .attr('result', 'flood');

      filter.append('feComposite')
        .attr('in', 'flood')
        .attr('in2', 'SourceGraphic')
        .attr('operator', 'in')
        .attr('result', 'colored');

      filter.append('feGaussianBlur')
        .attr('in', 'colored')
        .attr('stdDeviation', 4 * scale)
        .attr('result', 'blur');

      const merge = filter.append('feMerge');
      merge.append('feMergeNode').attr('in', 'blur');
      merge.append('feMergeNode').attr('in', 'SourceGraphic');
    }

    // Parse the viewBox to compute centering offset
    const [, , vbW, vbH] = def.viewBox.split(' ').map(Number);
    const emblemSize = 160 * scale;
    const svgScale = emblemSize / Math.max(vbW, vbH);

    const g = d3Group.append('g')
      .attr('class', `cluster-emblem emblem-${cluster.id}`)
      .attr('transform',
        `translate(${cluster.x}, ${cluster.y}) ` +
        `scale(${svgScale}) ` +
        `translate(${-vbW / 2}, ${-vbH / 2})`,
      )
      .attr('fill', '#ffffff')
      .attr('fill-opacity', 0.65)
      .attr('filter', `url(#${fid})`)
      .attr('pointer-events', 'none');

    for (const d of def.paths) {
      g.append('path').attr('d', d);
    }
  }
}
