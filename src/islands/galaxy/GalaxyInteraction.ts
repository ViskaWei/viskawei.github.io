/**
 * GalaxyInteraction — Interaction state management for the galaxy map.
 * Extracts chain-tracing logic from GalaxyView.ts into a reusable module.
 */

import type { GalaxyNode, ConstellationEdge } from '../../data/skilltree';
import type { CourseNode, ProjectNode } from '../../data/techtree';

export interface InteractionState {
  hoveredNodeId: string | null;
  selectedNodeId: string | null;
  highlightedChain: Set<string>;
  overclockTargets: Set<string>;
  fogClusterId: string | null;
}

export interface ChainResult {
  chain: Set<string>;
  overclock: Set<string>;
  activeEdges: Array<{ source: string; target: string }>;
}

export function createInteractionManager(
  nodeMap: Map<string, GalaxyNode>,
  edges: ConstellationEdge[],
  courses: CourseNode[],
  projectNodes: ProjectNode[],
): {
  state: InteractionState;
  hover: (nodeId: string | null) => InteractionState;
  select: (nodeId: string | null) => InteractionState;
  collectChain: (nodeId: string) => ChainResult;
  reset: () => InteractionState;
} {
  const state: InteractionState = {
    hoveredNodeId: null,
    selectedNodeId: null,
    highlightedChain: new Set(),
    overclockTargets: new Set(),
    fogClusterId: null,
  };

  // ── Prerequisite chain (upstream) ─────────────────────────
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

  // ── Downstream chain ──────────────────────────────────────
  function collectDownstreamChain(nodeId: string, visited: Set<string>): void {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    for (const c of courses) {
      if (c.prerequisites?.includes(nodeId)) collectDownstreamChain(c.id, visited);
    }
    for (const p of projectNodes) {
      if (p.relatedCourses.includes(nodeId)) collectDownstreamChain(p.id, visited);
    }
  }

  // ── Upstream skills for overclocking ──────────────────────
  function collectUpstreamSkills(nodeId: string): Set<string> {
    const upstream = new Set<string>();
    const node = nodeMap.get(nodeId);
    if (!node) return upstream;

    const isProjectLike = ['project', 'thesis', 'publication', 'internship', 'repo'].includes(node.nodeType as string);
    if (!isProjectLike && !node.isStarGate) return upstream;

    if (node.relatedCourses) {
      for (const cid of node.relatedCourses) {
        upstream.add(cid);
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

  // ── Full chain collection ─────────────────────────────────
  function collectChain(nodeId: string): ChainResult {
    const chain = new Set<string>();
    collectPrereqChain(nodeId, chain);
    collectDownstreamChain(nodeId, chain);

    const overclock = collectUpstreamSkills(nodeId);

    // Filter edges to those within the chain
    const activeEdges: Array<{ source: string; target: string }> = [];
    for (const e of edges) {
      if (chain.has(e.source) && chain.has(e.target)) {
        activeEdges.push({ source: e.source, target: e.target });
      }
    }

    return { chain, overclock, activeEdges };
  }

  function hover(nodeId: string | null): InteractionState {
    state.hoveredNodeId = nodeId;
    if (nodeId) {
      const result = collectChain(nodeId);
      state.highlightedChain = result.chain;
      state.overclockTargets = result.overclock;
      const node = nodeMap.get(nodeId);
      state.fogClusterId = node?.clusterId || null;
    } else {
      state.highlightedChain = new Set();
      state.overclockTargets = new Set();
      state.fogClusterId = null;
    }
    return state;
  }

  function select(nodeId: string | null): InteractionState {
    state.selectedNodeId = nodeId;
    if (nodeId) {
      const result = collectChain(nodeId);
      state.highlightedChain = result.chain;
      state.overclockTargets = result.overclock;
      const node = nodeMap.get(nodeId);
      state.fogClusterId = node?.clusterId || null;
    } else {
      state.highlightedChain = new Set();
      state.overclockTargets = new Set();
      state.fogClusterId = null;
    }
    return state;
  }

  function reset(): InteractionState {
    state.hoveredNodeId = null;
    state.selectedNodeId = null;
    state.highlightedChain = new Set();
    state.overclockTargets = new Set();
    state.fogClusterId = null;
    return state;
  }

  return { state, hover, select, collectChain, reset };
}
