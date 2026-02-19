/**
 * Skill Galaxy — Data model, cluster definitions, and computation functions.
 * Maps existing techtree data into a galactic star-map layout.
 */

import type { CourseNode, ProjectNode, Track, NodeType } from './techtree';

// ── Interfaces ─────────────────────────────────────────────────

export interface SkillCluster {
  id: string;
  label: string;
  color: string;
  nebulaColor: string;
  angle: number;     // radians, position around CORE
  radius: number;    // distance from center
  trackIds: string[];
  darkStars: DarkStar[];
}

export interface DarkStar {
  id: string;
  name: string;
  clusterId: string;
}

export type StarClass = 'hypergiant' | 'main-sequence' | 'brown-dwarf' | 'ghost';
export type MegastructureType = 'dyson' | 'crystal' | 'station' | 'module' | 'diamond' | null;
export type NodeLayer = 'core' | 'inner' | 'mid' | 'outer' | 'stargate';

export interface GalaxyNode {
  id: string;
  name: string;
  code?: string;
  institution?: string;
  track?: string;
  grade?: string;
  year?: number;
  semester?: string;
  nodeType: NodeType | 'dark' | 'core';
  clusterId: string;
  mastery: number;     // 0.0 (dark) to 1.0 (A+)
  brightness: number;  // visual brightness 0-1
  radius: number;      // SVG circle radius 4-16
  x: number;
  y: number;
  starClass: StarClass;
  megastructure: MegastructureType;
  layer: NodeLayer;    // radial layer for positioning
  isStarGate?: boolean; // top projects rendered as Star Gates
  prerequisites?: string[];
  relatedProjects?: string[];
  relatedCourses?: string[];
  url?: string;
  venue?: string;
  isDark?: boolean;
}

// ── Star Gate definitions ─────────────────────────────────────
// Top 5 projects that become "portals" — hover dims everything, click flies in
export const STAR_GATE_IDS = new Set([
  'thesis-phd',       // PhD: SpecViT (ongoing)
  'pub-specvit-apj',  // ApJ: SpecViT (submitted)
  'proj-blade',       // Blade Agent
  'pub-charm',        // PhysRevD: Charm Yukawa
  'intern-bytedance', // ByteDance LLM Intern
]);

export interface ConstellationEdge {
  source: string;
  target: string;
  type: 'prerequisite' | 'related';
}

export interface XPResult {
  xp: number;
  level: number;
  rank: string;
  nextLevelXP: number;
  currentLevelXP: number;
}

// ── Cluster Definitions ────────────────────────────────────────

const TAU = Math.PI * 2;

export const clusters: SkillCluster[] = [
  {
    id: 'physics',
    label: 'Fundamental Physics',
    color: '#4fc3f7',
    nebulaColor: '#0a3d5c',
    angle: -TAU / 14,          // ~top-right
    radius: 300,
    trackIds: ['physics'],
    darkStars: [
      { id: 'dark-condensed-matter', name: 'Condensed Matter', clusterId: 'physics' },
      { id: 'dark-nuclear', name: 'Nuclear Physics', clusterId: 'physics' },
      { id: 'dark-astro', name: 'Astrophysics', clusterId: 'physics' },
      { id: 'dark-plasma', name: 'Plasma Physics', clusterId: 'physics' },
    ],
  },
  {
    id: 'math',
    label: 'Mathematics',
    color: '#ffd54f',
    nebulaColor: '#5c4a0a',
    angle: TAU / 14,            // ~top-left
    radius: 300,
    trackIds: ['math'],
    darkStars: [
      { id: 'dark-algebra', name: 'Abstract Algebra', clusterId: 'math' },
      { id: 'dark-analysis', name: 'Real Analysis', clusterId: 'math' },
      { id: 'dark-number-theory', name: 'Number Theory', clusterId: 'math' },
      { id: 'dark-diff-eq', name: 'Differential Equations', clusterId: 'math' },
    ],
  },
  {
    id: 'cs',
    label: 'Computer Science',
    color: '#66bb6a',
    nebulaColor: '#0a4f1a',
    angle: 3 * TAU / 14,
    radius: 300,
    trackIds: ['algorithms'],
    darkStars: [
      { id: 'dark-ds', name: 'Data Structures', clusterId: 'cs' },
      { id: 'dark-complexity', name: 'Complexity Theory', clusterId: 'cs' },
      { id: 'dark-os', name: 'Operating Systems', clusterId: 'cs' },
      { id: 'dark-networks', name: 'Networks', clusterId: 'cs' },
      { id: 'dark-databases', name: 'Databases', clusterId: 'cs' },
      { id: 'dark-compilers', name: 'Compilers', clusterId: 'cs' },
    ],
  },
  {
    id: 'aiml',
    label: 'AI & Machine Learning',
    color: '#ef5350',
    nebulaColor: '#5c0a0a',
    angle: 5 * TAU / 14,
    radius: 300,
    trackIds: ['ai', 'ml'],
    darkStars: [
      { id: 'dark-rl', name: 'Reinforcement Learning', clusterId: 'aiml' },
      { id: 'dark-genai', name: 'Generative AI', clusterId: 'aiml' },
      { id: 'dark-robotics', name: 'Robotics', clusterId: 'aiml' },
      { id: 'dark-cv', name: 'Computer Vision', clusterId: 'aiml' },
    ],
  },
  {
    id: 'engineering',
    label: 'Engineering & Systems',
    color: '#26c6da',
    nebulaColor: '#0a4f4f',
    angle: 7 * TAU / 14,        // bottom
    radius: 300,
    trackIds: ['systems'],
    darkStars: [
      { id: 'dark-swe', name: 'Software Engineering', clusterId: 'engineering' },
      { id: 'dark-webdev', name: 'Web Development', clusterId: 'engineering' },
      { id: 'dark-devops', name: 'DevOps', clusterId: 'engineering' },
      { id: 'dark-cloud', name: 'Cloud Computing', clusterId: 'engineering' },
      { id: 'dark-data-eng', name: 'Data Engineering', clusterId: 'engineering' },
    ],
  },
  {
    id: 'data',
    label: 'Data & Analytics',
    color: '#ab47bc',
    nebulaColor: '#3d0a5c',
    angle: 9 * TAU / 14,
    radius: 300,
    trackIds: [],  // no dedicated track, but EN553636 maps here
    darkStars: [
      { id: 'dark-viz', name: 'Visualization', clusterId: 'data' },
      { id: 'dark-statmodel', name: 'Statistical Modeling', clusterId: 'data' },
      { id: 'dark-scicomp', name: 'Scientific Computing', clusterId: 'data' },
    ],
  },
  {
    id: 'business',
    label: 'Business & Humanities',
    color: '#ff7043',
    nebulaColor: '#5c2a0a',
    angle: 11 * TAU / 14,
    radius: 300,
    trackIds: ['business', 'social'],
    darkStars: [
      { id: 'dark-strategy', name: 'Strategy', clusterId: 'business' },
      { id: 'dark-economics', name: 'Economics', clusterId: 'business' },
      { id: 'dark-finance', name: 'Finance', clusterId: 'business' },
      { id: 'dark-communication', name: 'Communication', clusterId: 'business' },
      { id: 'dark-design', name: 'Design Thinking', clusterId: 'business' },
    ],
  },
];

export const clusterMap = new Map(clusters.map(c => [c.id, c]));

// Track-to-cluster mapping (built from cluster definitions)
const trackToCluster = new Map<string, string>();
for (const c of clusters) {
  for (const tid of c.trackIds) {
    trackToCluster.set(tid, c.id);
  }
}

// Special overrides for specific courses
const courseClusterOverrides: Record<string, string> = {
  'EN553636': 'data',  // Intro to Data Science → Data & Analytics
};

// ── Grade → Mastery ────────────────────────────────────────────

export function gradeToMastery(grade?: string): number {
  if (!grade) return 0.5;
  switch (grade) {
    case 'A+': return 1.0;
    case 'A':  return 0.85;
    case 'A-': return 0.7;
    case 'B+': return 0.55;
    case 'B':  return 0.45;
    case 'P':  return 0.5;
    default:   return 0.4;
  }
}

// ── Grade → Star Classification ─────────────────────────────────

export function gradeToStarClass(grade: string | undefined, nodeType: NodeType | 'dark' | 'core'): StarClass {
  if (nodeType === 'dark') return 'ghost';
  if (nodeType === 'thesis' || nodeType === 'publication') return 'hypergiant';
  if (!grade) return 'main-sequence';
  switch (grade) {
    case 'A+': return 'hypergiant';
    case 'A':
    case 'A-': return 'main-sequence';
    case 'B+':
    case 'P':  return 'brown-dwarf';
    default:   return 'brown-dwarf';
  }
}

// ── Node Type → Megastructure ───────────────────────────────────

export function nodeTypeToMegastructure(nodeType: NodeType | 'dark' | 'core'): MegastructureType {
  switch (nodeType) {
    case 'thesis':      return 'dyson';
    case 'publication': return 'crystal';
    case 'internship':  return 'station';
    case 'repo':        return 'module';
    case 'project':     return 'diamond';
    default:            return null;
  }
}

// ── Node Layer assignment ────────────────────────────────────────

function assignLayer(nodeType: NodeType | 'dark' | 'core', id: string): NodeLayer {
  if (nodeType === 'core') return 'core';
  if (nodeType === 'dark') return 'outer';
  if (STAR_GATE_IDS.has(id)) return 'stargate';
  if (nodeType === 'course') return 'inner';
  // projects, repos = mid layer; thesis/pub/intern = outer
  if (nodeType === 'thesis' || nodeType === 'publication' || nodeType === 'internship') return 'outer';
  return 'mid';
}

// ── Node Type → visual radius ──────────────────────────────────

function nodeTypeRadius(nodeType: NodeType | 'dark' | 'core', mastery: number): number {
  switch (nodeType) {
    case 'core':        return 24;
    case 'thesis':      return 14;
    case 'publication': return 10;
    case 'internship':  return 11;
    case 'repo':        return 7;
    case 'project':     return 12;
    case 'dark':        return 5;
    case 'course':
    default:            return 6 + mastery * 8; // 6-14
  }
}

// ── Build Galaxy Nodes ─────────────────────────────────────────

export function buildGalaxyNodes(
  courses: CourseNode[],
  projectNodes: ProjectNode[],
  _clusters: SkillCluster[],
): GalaxyNode[] {
  const nodes: GalaxyNode[] = [];

  // CORE node
  nodes.push({
    id: 'CORE',
    name: 'CORE',
    nodeType: 'core',
    clusterId: 'core',
    mastery: 1,
    brightness: 1,
    radius: 24,
    x: 0, y: 0,
    starClass: 'hypergiant',
    megastructure: null,
    layer: 'core',
  });

  // Course nodes
  for (const c of courses) {
    const clusterId = courseClusterOverrides[c.id] || trackToCluster.get(c.track) || 'cs';
    const mastery = gradeToMastery(c.grade);
    const nt = c.nodeType || 'course';
    nodes.push({
      id: c.id,
      name: c.name,
      code: c.code,
      institution: c.institution,
      track: c.track,
      grade: c.grade,
      year: c.year,
      semester: c.semester,
      nodeType: nt,
      clusterId,
      mastery,
      brightness: 0.4 + mastery * 0.6,
      radius: nodeTypeRadius(nt, mastery),
      x: 0, y: 0,
      starClass: gradeToStarClass(c.grade, nt),
      megastructure: nodeTypeToMegastructure(nt),
      layer: assignLayer(nt, c.id),
      prerequisites: c.prerequisites,
      relatedProjects: c.relatedProjects,
    });
  }

  // Project nodes
  for (const p of projectNodes) {
    const track = p.track || 'ml';
    const clusterId = trackToCluster.get(track) || 'aiml';
    const nt = p.nodeType || 'project';
    const mastery = nt === 'thesis' ? 0.95 : nt === 'publication' ? 0.9 : nt === 'internship' ? 0.85 : 0.75;
    const isSG = STAR_GATE_IDS.has(p.id);
    nodes.push({
      id: p.id,
      name: p.name,
      track,
      year: p.year,
      semester: p.semester,
      nodeType: nt,
      clusterId,
      mastery,
      brightness: 0.5 + mastery * 0.5,
      radius: isSG ? 18 : nodeTypeRadius(nt, mastery),
      x: 0, y: 0,
      starClass: isSG ? 'hypergiant' : gradeToStarClass(undefined, nt),
      megastructure: nodeTypeToMegastructure(nt),
      layer: assignLayer(nt, p.id),
      isStarGate: isSG || undefined,
      relatedCourses: p.relatedCourses,
      url: p.url,
      venue: p.venue,
    });
  }

  // Dark star nodes
  for (const cluster of _clusters) {
    for (const ds of cluster.darkStars) {
      nodes.push({
        id: ds.id,
        name: ds.name,
        nodeType: 'dark',
        clusterId: cluster.id,
        mastery: 0,
        brightness: 0.15,
        radius: 5,
        x: 0, y: 0,
        starClass: 'ghost',
        megastructure: null,
        layer: 'outer',
        isDark: true,
      });
    }
  }

  return nodes;
}

// ── Build Constellation Edges ──────────────────────────────────

export function buildEdges(
  courses: CourseNode[],
  projectNodes: ProjectNode[],
): ConstellationEdge[] {
  const edges: ConstellationEdge[] = [];

  // Course prerequisites
  for (const c of courses) {
    if (c.prerequisites) {
      for (const pre of c.prerequisites) {
        edges.push({ source: pre, target: c.id, type: 'prerequisite' });
      }
    }
  }

  // Project related courses
  for (const p of projectNodes) {
    for (const cid of p.relatedCourses) {
      edges.push({ source: cid, target: p.id, type: 'related' });
    }
  }

  return edges;
}

// ── XP Computation ─────────────────────────────────────────────

const GRADE_XP: Record<string, number> = {
  'A+': 100, 'A': 85, 'A-': 70, 'B+': 55, 'B': 45, 'P': 50,
};

const NODE_TYPE_XP: Record<string, number> = {
  project: 50, thesis: 80, publication: 100, internship: 60, repo: 30,
};

const RANK_TABLE: [number, string][] = [
  [0, 'Stargazer'],
  [3, 'Nebula Scout'],
  [5, 'Stellar Cartographer'],
  [8, 'Constellation Architect'],
  [12, 'Galaxy Navigator'],
  [16, 'Cosmic Voyager'],
  [20, 'Supernova'],
  [25, 'Quasar'],
  [30, 'Event Horizon'],
];

export function computeXP(
  courses: CourseNode[],
  projectNodes: ProjectNode[],
): XPResult {
  let xp = 0;

  for (const c of courses) {
    xp += GRADE_XP[c.grade] || 50;
  }

  for (const p of projectNodes) {
    const nt = p.nodeType || 'project';
    xp += NODE_TYPE_XP[nt] || 30;
  }

  const level = Math.floor(Math.sqrt(xp / 100));
  const currentLevelXP = level * level * 100;
  const nextLevelXP = (level + 1) * (level + 1) * 100;

  let rank = RANK_TABLE[0][1];
  for (const [minLevel, title] of RANK_TABLE) {
    if (level >= minLevel) rank = title;
  }

  return { xp, level, rank, nextLevelXP, currentLevelXP };
}
