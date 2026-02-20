/**
 * Algorithm Galaxy — ~20 algorithm topic stars driven by LeetCode data.
 * Maps LeetCode tag stats to galaxy nodes with mastery-based star classes.
 */

import type { GalaxyNode, ConstellationEdge, StarClass, NodeLayer } from './skilltree';
import leetcodeStatsRaw from './leetcode-stats.json';

// ── LeetCode stats ──────────────────────────────────────────
// The JSON file is always present (committed as fallback; CI refreshes before build).
const tagStatsMap = new Map(
  (leetcodeStatsRaw.tagStats || []).map(
    (t: { tagSlug: string; problemsSolved: number }) => [t.tagSlug, t.problemsSolved] as const
  ),
);

// ── Algorithm topic definitions ──────────────────────────────

interface AlgoTopicDef {
  id: string;
  name: string;
  /** LeetCode tag slugs to aggregate solved count from */
  tagSlugs: string[];
  /** Estimated total problems for mastery computation */
  estimatedTotal: number;
  layer: NodeLayer;
  sector: string;
  prerequisites: string[];
}

const ALGO_TOPICS: AlgoTopicDef[] = [
  // ── Core sector (inner) ──
  { id: 'algo-array-hash', name: 'Array & Hashing', tagSlugs: ['array', 'hash-table'], estimatedTotal: 300, layer: 'inner', sector: 'Core', prerequisites: [] },
  { id: 'algo-string', name: 'String', tagSlugs: ['string'], estimatedTotal: 200, layer: 'inner', sector: 'Core', prerequisites: ['algo-array-hash'] },
  { id: 'algo-sorting', name: 'Sorting', tagSlugs: ['sorting'], estimatedTotal: 120, layer: 'inner', sector: 'Core', prerequisites: ['algo-array-hash'] },

  // ── Linear sector (inner) ──
  { id: 'algo-linked-list', name: 'Linked List', tagSlugs: ['linked-list'], estimatedTotal: 80, layer: 'inner', sector: 'Linear', prerequisites: ['algo-array-hash'] },
  { id: 'algo-stack-queue', name: 'Stack & Queue', tagSlugs: ['stack', 'queue', 'monotonic-stack'], estimatedTotal: 120, layer: 'inner', sector: 'Linear', prerequisites: ['algo-array-hash'] },
  { id: 'algo-two-pointers', name: 'Two Pointers', tagSlugs: ['two-pointers'], estimatedTotal: 80, layer: 'inner', sector: 'Linear', prerequisites: ['algo-array-hash'] },
  { id: 'algo-sliding-window', name: 'Sliding Window', tagSlugs: ['sliding-window'], estimatedTotal: 50, layer: 'inner', sector: 'Linear', prerequisites: ['algo-two-pointers'] },
  { id: 'algo-binary-search', name: 'Binary Search', tagSlugs: ['binary-search'], estimatedTotal: 100, layer: 'inner', sector: 'Linear', prerequisites: ['algo-sorting'] },

  // ── Branching sector (mid) ──
  { id: 'algo-trees', name: 'Trees', tagSlugs: ['tree', 'binary-tree', 'binary-search-tree'], estimatedTotal: 150, layer: 'mid', sector: 'Branching', prerequisites: ['algo-stack-queue'] },
  { id: 'algo-heap', name: 'Heap / Priority Queue', tagSlugs: ['heap-priority-queue'], estimatedTotal: 60, layer: 'mid', sector: 'Branching', prerequisites: ['algo-trees'] },
  { id: 'algo-divide-conquer', name: 'Divide & Conquer', tagSlugs: ['divide-and-conquer'], estimatedTotal: 40, layer: 'mid', sector: 'Branching', prerequisites: ['algo-binary-search'] },

  // ── Network sector (mid) ──
  { id: 'algo-graphs', name: 'Graphs', tagSlugs: ['graph', 'breadth-first-search', 'depth-first-search'], estimatedTotal: 150, layer: 'mid', sector: 'Network', prerequisites: ['algo-trees'] },
  { id: 'algo-trie', name: 'Trie', tagSlugs: ['trie'], estimatedTotal: 30, layer: 'mid', sector: 'Network', prerequisites: ['algo-trees'] },
  { id: 'algo-union-find', name: 'Union Find', tagSlugs: ['union-find'], estimatedTotal: 40, layer: 'mid', sector: 'Network', prerequisites: ['algo-graphs'] },

  // ── Advanced sector (outer) ──
  { id: 'algo-dp', name: 'Dynamic Programming', tagSlugs: ['dynamic-programming'], estimatedTotal: 250, layer: 'outer', sector: 'Advanced', prerequisites: ['algo-divide-conquer'] },
  { id: 'algo-greedy', name: 'Greedy', tagSlugs: ['greedy'], estimatedTotal: 120, layer: 'outer', sector: 'Advanced', prerequisites: ['algo-sorting'] },
  { id: 'algo-backtracking', name: 'Backtracking', tagSlugs: ['backtracking'], estimatedTotal: 60, layer: 'outer', sector: 'Advanced', prerequisites: ['algo-trees'] },
  { id: 'algo-design', name: 'Design', tagSlugs: ['design'], estimatedTotal: 50, layer: 'outer', sector: 'Advanced', prerequisites: ['algo-stack-queue', 'algo-trees'] },

  // ── Nebula sector (outer) ──
  { id: 'algo-math', name: 'Math & Geometry', tagSlugs: ['math', 'geometry'], estimatedTotal: 150, layer: 'outer', sector: 'Nebula', prerequisites: [] },
  { id: 'algo-bit', name: 'Bit Manipulation', tagSlugs: ['bit-manipulation'], estimatedTotal: 60, layer: 'outer', sector: 'Nebula', prerequisites: [] },
];

// ── Mastery computation ──────────────────────────────────────

function computeSolvedCount(tagSlugs: string[]): number {
  let total = 0;
  for (const slug of tagSlugs) {
    total += tagStatsMap.get(slug) || 0;
  }
  return total;
}

function masteryToStarClass(mastery: number): StarClass {
  if (mastery < 0.05) return 'ghost';
  if (mastery < 0.3) return 'brown-dwarf';
  if (mastery < 0.7) return 'main-sequence';
  return 'hypergiant';
}

const STAR_CLASS_LABELS: Record<StarClass, string> = {
  ghost: 'Ghost',
  'brown-dwarf': 'Brown Dwarf',
  'main-sequence': 'Main Sequence',
  hypergiant: 'Hypergiant',
};

// ── Public API ───────────────────────────────────────────────

export interface AlgoNodeExtra {
  solvedCount: number;
  estimatedTotal: number;
  masteryPct: number;
  starClassLabel: string;
  sector: string;
  tagSlugs: string[];
}

/** Map from algo node id → extra algorithm data for detail panel */
export const algoNodeExtras = new Map<string, AlgoNodeExtra>();

export function buildAlgorithmNodes(): { nodes: GalaxyNode[]; edges: ConstellationEdge[] } {
  const nodes: GalaxyNode[] = [];
  const edges: ConstellationEdge[] = [];

  for (const topic of ALGO_TOPICS) {
    const solvedCount = computeSolvedCount(topic.tagSlugs);
    const mastery = Math.min(1, solvedCount / topic.estimatedTotal);
    const starClass = masteryToStarClass(mastery);
    const isDark = starClass === 'ghost';
    const radius = Math.max(4, Math.min(16, 4 + solvedCount * 0.08));

    // Store extra data for detail panel
    algoNodeExtras.set(topic.id, {
      solvedCount,
      estimatedTotal: topic.estimatedTotal,
      masteryPct: Math.round(mastery * 100),
      starClassLabel: STAR_CLASS_LABELS[starClass],
      sector: topic.sector,
      tagSlugs: topic.tagSlugs,
    });

    nodes.push({
      id: topic.id,
      name: topic.name,
      nodeType: isDark ? 'dark' : 'course', // reuse course rendering for lit algo nodes
      clusterId: 'cs',
      mastery,
      brightness: isDark ? 0.15 : 0.4 + mastery * 0.6,
      radius,
      x: 0,
      y: 0,
      starClass,
      megastructure: null,
      layer: topic.layer,
      isDark,
      prerequisites: topic.prerequisites.length > 0 ? topic.prerequisites : undefined,
      track: 'algorithms',
    });

    // Build prerequisite edges
    for (const preId of topic.prerequisites) {
      edges.push({ source: preId, target: topic.id, type: 'prerequisite' });
    }
  }

  return { nodes, edges };
}
