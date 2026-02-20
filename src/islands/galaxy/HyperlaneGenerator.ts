/**
 * HyperlaneGenerator — Nearest-neighbor hyperlane web for a Stellaris-style galaxy map.
 *
 * Generates line segments connecting stars within territories (clusters) and
 * across territory borders. Returns flat Float32Arrays ready for Three.js
 * BufferGeometry LineSegments.
 */

// ── Types ──────────────────────────────────────────────────────────

export interface TerritoryStarData {
  x: number;
  y: number;
  clusterId: string;
  size: number;
}

interface StarWithIndex extends TerritoryStarData {
  index: number;
}

// ── Configuration ──────────────────────────────────────────────────

/** Max intra-territory neighbors per star */
const INTRA_NEIGHBORS = 3;

/** Min intra-territory neighbors per star (ensures connectivity) */
const MIN_INTRA_NEIGHBORS = 2;

/** Max cross-border connections per star near a border */
const CROSS_BORDER_NEIGHBORS = 1;

/**
 * Distance threshold multiplier for cross-border connections.
 * Stars within this fraction of the inter-cluster distance are
 * candidates for cross-border hyperlanes.
 */
const CROSS_BORDER_THRESHOLD = 180;

// ── Helpers ────────────────────────────────────────────────────────

/** Squared Euclidean distance between two points */
function dist2(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

/**
 * Find the k nearest neighbors of a star within a candidate set.
 * Returns indices into the candidates array sorted by distance.
 */
function kNearest(
  star: StarWithIndex,
  candidates: StarWithIndex[],
  k: number,
): StarWithIndex[] {
  const scored = candidates
    .filter(c => c.index !== star.index)
    .map(c => ({ star: c, d2: dist2(star.x, star.y, c.x, c.y) }))
    .sort((a, b) => a.d2 - b.d2);

  return scored.slice(0, k).map(s => s.star);
}

// ── Main Generation ────────────────────────────────────────────────

/**
 * Generate hyperlane segments connecting stars.
 *
 * For each star, connects to its 2-3 nearest neighbors in the same
 * territory. Stars near territory borders also get a connection to
 * the nearest star in an adjacent territory.
 *
 * @param stars      Array of star positions with cluster assignments
 * @param clusterCenters  Map of clusterId -> {x, y} center positions
 * @returns Float32Array of line segment positions [x1,y1,z1, x2,y2,z2, ...]
 */
export function generateHyperlanes(
  stars: TerritoryStarData[],
  clusterCenters: Map<string, { x: number; y: number }>,
): Float32Array {
  // Index stars and group by cluster
  const indexed: StarWithIndex[] = stars.map((s, i) => ({ ...s, index: i }));
  const byCluster = new Map<string, StarWithIndex[]>();

  for (const star of indexed) {
    let group = byCluster.get(star.clusterId);
    if (!group) {
      group = [];
      byCluster.set(star.clusterId, group);
    }
    group.push(star);
  }

  // Track already-created edges to avoid duplicates
  const edgeSet = new Set<string>();
  const segments: number[] = [];

  function addEdge(a: StarWithIndex, b: StarWithIndex): boolean {
    const key = a.index < b.index
      ? `${a.index}:${b.index}`
      : `${b.index}:${a.index}`;
    if (edgeSet.has(key)) return false;
    edgeSet.add(key);
    // Push two vertices: [x1,y1,z1, x2,y2,z2]
    segments.push(a.x, a.y, 0, b.x, b.y, 0);
    return true;
  }

  // ── Intra-territory hyperlanes ────────────────────────────────
  // Connect each star to its nearest neighbors within the same cluster
  for (const [_clusterId, group] of byCluster) {
    if (group.length < 2) continue;

    for (const star of group) {
      const neighbors = kNearest(star, group, INTRA_NEIGHBORS);
      // Ensure at least MIN_INTRA_NEIGHBORS connections
      const count = Math.min(neighbors.length, Math.max(MIN_INTRA_NEIGHBORS, INTRA_NEIGHBORS));
      for (let i = 0; i < count; i++) {
        addEdge(star, neighbors[i]);
      }
    }
  }

  // ── Cross-border hyperlanes ───────────────────────────────────
  // Connect stars near territory borders to nearest stars in adjacent territories
  const clusterIds = Array.from(byCluster.keys());

  for (let ci = 0; ci < clusterIds.length; ci++) {
    for (let cj = ci + 1; cj < clusterIds.length; cj++) {
      const idA = clusterIds[ci];
      const idB = clusterIds[cj];
      const groupA = byCluster.get(idA)!;
      const groupB = byCluster.get(idB)!;

      const centerA = clusterCenters.get(idA);
      const centerB = clusterCenters.get(idB);
      if (!centerA || !centerB) continue;

      // Find the closest pair of stars between the two clusters
      // that are within the cross-border threshold
      const threshold2 = CROSS_BORDER_THRESHOLD * CROSS_BORDER_THRESHOLD;

      // Collect candidate pairs: stars from A that are close to any star in B
      const pairs: { a: StarWithIndex; b: StarWithIndex; d2: number }[] = [];

      for (const starA of groupA) {
        for (const starB of groupB) {
          const d = dist2(starA.x, starA.y, starB.x, starB.y);
          if (d < threshold2) {
            pairs.push({ a: starA, b: starB, d2: d });
          }
        }
      }

      // Sort by distance and take the closest few
      pairs.sort((a, b) => a.d2 - b.d2);
      const maxCrossBorder = Math.min(
        CROSS_BORDER_NEIGHBORS * 2,
        pairs.length,
      );

      for (let i = 0; i < maxCrossBorder; i++) {
        addEdge(pairs[i].a, pairs[i].b);
      }
    }
  }

  return new Float32Array(segments);
}

// ── Color Generation ───────────────────────────────────────────────

/**
 * Generate per-vertex colors for hyperlane segments.
 *
 * Each line segment has two vertices. The color of each vertex is
 * determined by the cluster of the nearest star. For cross-border
 * segments, each endpoint gets its own cluster color, creating a
 * gradient effect.
 *
 * @param stars         Original star data (same order as passed to generateHyperlanes)
 * @param segments      The Float32Array from generateHyperlanes
 * @param clusterColors Map of clusterId -> [r, g, b] in 0-1 range
 * @returns Float32Array of vertex colors [r1,g1,b1, r2,g2,b2, ...]
 */
export function generateHyperlaneColors(
  stars: TerritoryStarData[],
  segments: Float32Array,
  clusterColors: Map<string, [number, number, number]>,
): Float32Array {
  const vertexCount = segments.length / 3;
  const colors = new Float32Array(vertexCount * 3);

  // Default color (dim blue-white) for unmatched vertices
  const defaultColor: [number, number, number] = [0.4, 0.45, 0.55];

  // For each vertex in the segments, find the nearest star and use its cluster color
  for (let v = 0; v < vertexCount; v++) {
    const vx = segments[v * 3];
    const vy = segments[v * 3 + 1];

    // Find nearest star to this vertex
    let minDist = Infinity;
    let nearestCluster = '';

    for (const star of stars) {
      const d = dist2(vx, vy, star.x, star.y);
      if (d < minDist) {
        minDist = d;
        nearestCluster = star.clusterId;
      }
    }

    const color = clusterColors.get(nearestCluster) || defaultColor;
    colors[v * 3] = color[0];
    colors[v * 3 + 1] = color[1];
    colors[v * 3 + 2] = color[2];
  }

  return colors;
}
