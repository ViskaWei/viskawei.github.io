/**
 * Skill Galaxy — Data model, cluster definitions, and computation functions.
 * Maps existing techtree data into a galactic star-map layout.
 */

import type { CourseNode, ProjectNode, Track, NodeType } from './techtree';
import skillsRegistry from './skills-registry.json';

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
    label: 'Physics',
    color: '#4fc3f7',
    nebulaColor: '#1a7aaa',
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
    label: 'Math',
    color: '#ffd54f',
    nebulaColor: '#a08520',
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
    label: 'Algorithm',
    color: '#66bb6a',
    nebulaColor: '#1a8035',
    angle: 3 * TAU / 14,
    radius: 300,
    trackIds: ['algorithms'],
    darkStars: [], // Algorithm topics replace dark stars in this cluster
  },
  {
    id: 'aiml',
    label: 'AI',
    color: '#ef5350',
    nebulaColor: '#9a2020',
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
    label: 'Engineer',
    color: '#26c6da',
    nebulaColor: '#1a8888',
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
    label: 'Finance',
    color: '#ab47bc',
    nebulaColor: '#7a2a9a',
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
    label: 'Society',
    color: '#ff7043',
    nebulaColor: '#aa5520',
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
    case 'skill':       return 'module';
    default:            return null;
  }
}

// ── Node Layer assignment ────────────────────────────────────────

function assignLayer(nodeType: NodeType | 'dark' | 'core', id: string): NodeLayer {
  if (nodeType === 'core') return 'core';
  if (nodeType === 'dark') return 'outer';
  if (STAR_GATE_IDS.has(id)) return 'stargate';
  if (nodeType === 'skill') return 'mid';
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
    case 'skill':       return 4 + mastery * 6; // 4-10
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
  algorithmNodes?: GalaxyNode[],
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

  // Merge algorithm topic nodes
  if (algorithmNodes) nodes.push(...algorithmNodes);

  // Skill nodes for Engineer cluster
  const skillNodes = buildSkillNodes();
  nodes.push(...skillNodes);

  return nodes;
}

// ── Build Constellation Edges ──────────────────────────────────

export function buildEdges(
  courses: CourseNode[],
  projectNodes: ProjectNode[],
  algorithmEdges?: ConstellationEdge[],
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

  // Merge algorithm prerequisite edges
  if (algorithmEdges) edges.push(...algorithmEdges);

  return edges;
}

// ── XP Computation ─────────────────────────────────────────────

const GRADE_XP: Record<string, number> = {
  'A+': 100, 'A': 85, 'A-': 70, 'B+': 55, 'B': 45, 'P': 50,
};

const NODE_TYPE_XP: Record<string, number> = {
  project: 50, thesis: 80, publication: 100, internship: 60, repo: 30, skill: 20,
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

// ── Skill Nodes for Engineer Cluster ─────────────────────────────

interface SkillRegistryEntry {
  id: string;
  name: string;
  description: string | null;
  source: string;
  maturity_score: number;
  maturity_level: string;
  version: string | null;
}

function skillMaturityToStarClass(level: string): StarClass {
  switch (level) {
    case 'mature': return 'hypergiant';
    case 'growing': return 'main-sequence';
    case 'seedling':
    case 'empty':
    default: return 'brown-dwarf';
  }
}

export function buildSkillNodes(): GalaxyNode[] {
  const skills = (skillsRegistry as any).skills as SkillRegistryEntry[];
  if (!skills || skills.length === 0) return [];

  return skills.map(s => ({
    id: `skill-${s.id}`,
    name: s.name,
    nodeType: 'skill' as NodeType,
    clusterId: 'engineering',
    mastery: s.maturity_score / 100,
    brightness: 0.3 + (s.maturity_score / 100) * 0.7,
    radius: 4 + (s.maturity_score / 100) * 6, // 4-10
    x: 0,
    y: 0,
    starClass: skillMaturityToStarClass(s.maturity_level),
    megastructure: 'module' as MegastructureType,
    layer: 'mid' as NodeLayer,
  }));
}
