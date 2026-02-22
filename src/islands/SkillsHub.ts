/**
 * Skills Hub — Dual-panel Blade Agent Skill Tree
 *
 * TOP PANEL:    Blade composition tree (blade → scientist/engineer/student → skills)
 * BOTTOM PANEL: Full skill inventory in original track categories
 */

interface SkillRecord {
  id: string;
  name: string;
  description: string;
  source: string;
  maturity_score: number;
  maturity_level: string;
  status: string;
  word_count: number;
  file_count: number;
  has_skill_md: boolean;
  version: string | null;
  tags: string[];
  progress: number | null;
  definition_of_done: string[] | null;
  last_modified: string;
  category: string | null;
  overrides_applied: boolean;
}

interface Registry {
  summary: {
    total: number;
    by_source: Record<string, number>;
    by_maturity: Record<string, number>;
    average_maturity_score: number;
  };
  skills: SkillRecord[];
}

interface SkillTrack {
  id: string;
  label: string;
  color: string;
  column: number;
}

interface NodeDatum {
  id: string;
  name: string;
  description: string;
  track: string;
  source: string;
  maturity_score: number;
  maturity_level: string;
  status: string;
  level: number;
  tags: string[];
  progress: number | null;
  definition_of_done: string[] | null;
  version: string | null;
  last_modified: string;
  x: number;
  y: number;
}

interface EdgeDatum {
  source: string;
  target: string;
}

// ── Layout ────────────────────────────────────────────────────────
const NODE_W = 168;
const NODE_H = 44;
const SUB_ROW_H = NODE_H + 16;
const ROW_GAP = 100;

// ── Color maps ────────────────────────────────────────────────────
const MATURITY_COLORS: Record<string, string> = {
  mature: '#4fc3f7', growing: '#66bb6a', seedling: '#ffd54f', empty: '#ef5350',
};
const SOURCE_COLORS: Record<string, string> = {
  private: '#26c6da', public: '#66bb6a', scientific: '#ab47bc', local: '#ff7043',
};

// ── Top panel config: Blade tree (3 columns) ──────────────────────
const BLADE_COL_GAP = 300;
const BLADE_TRACKS: SkillTrack[] = [
  { id: 'scientist', label: 'SCIENTIST', color: '#ffa726', column: 0 },
  { id: 'engineer',  label: 'ENGINEER',  color: '#ef3535', column: 1 },
  { id: 'student',   label: 'STUDENT',   color: '#66bb6a', column: 2 },
];

function categorizeForBlade(s: SkillRecord): string {
  const id = s.id;
  const studentIds = new Set([
    'blade-student', 'blade-student-paper',
    'notebooklm-learn', 'research-lookup', 'markitdown',
  ]);
  if (studentIds.has(id) || id.startsWith('blade-student-')) return 'student';

  if (id.startsWith('research-') || id.startsWith('giftlive-')) return 'scientist';
  if (s.source === 'scientific') return 'scientist';
  const scientistIds = new Set([
    'blade-scientist',
    'vit-experiment', 'ml-experiment-patterns', 'parallel-experiment-runner',
    'scicomp-validation', 'desi-download', 'ips-datagen',
    'bosz-to-desi-training', 'vit-desi-apogee-pipeline',
    'peer-review', 'research-grants', 'paper-2-web',
  ]);
  if (scientistIds.has(id)) return 'scientist';

  return 'engineer';
}

// ── Bottom panel config: Inventory (8 columns) ───────────────────
const INV_COL_GAP = 185;
const INV_TRACKS: SkillTrack[] = [
  { id: 'standard',   label: 'STANDARD',         color: '#a0c8e8', column: 0 },
  { id: 'research',   label: 'RESEARCH',         color: '#ffa726', column: 1 },
  { id: 'scientific', label: 'SCIENTIFIC',       color: '#ab47bc', column: 2 },
  { id: 'ml',         label: 'ML & EXPERIMENT',  color: '#4fc3f7', column: 3 },
  { id: 'visual',     label: 'VISUAL',           color: '#ffd54f', column: 4 },
  { id: 'production', label: 'PRODUCTION',       color: '#66bb6a', column: 5 },
  { id: 'devtools',   label: 'DEV TOOLS',        color: '#ff7043', column: 6 },
  { id: 'business',   label: 'BUSINESS',         color: '#f0e6a0', column: 7 },
];

function categorizeOriginal(s: SkillRecord): string {
  const id = s.id;

  // Standard — reference specs, professional conventions, domain standards
  // These skills encode authoritative external/internal standards with references/
  const standardIds = new Set([
    'flowchart',           // ISO 5807 flowchart symbol standard
    'code2d2-web',         // D2 language syntax standard
    'audit',               // QA/acceptance standard
    'notebooklm-learn',    // LaTeX formatting standard
    'venue-templates',     // Publication venue formatting standards
    'scicomp-validation',  // Scientific computing validation standard
  ]);
  if (standardIds.has(id) || id.startsWith('standard')) return 'standard';

  if (id.startsWith('research-') || id.startsWith('giftlive-')) return 'research';
  if (s.source === 'scientific') return 'scientific';

  const mlIds = new Set([
    'ml-experiment-patterns', 'vit-experiment',
    'parallel-experiment-runner', 'nn-training',
    'desi-download', 'ips-datagen',
    'bosz-to-desi-training', 'vit-desi-apogee-pipeline',
  ]);
  if (mlIds.has(id)) return 'ml';

  const visualIds = new Set([
    'flow-plot', 'code2algo', 'algo-plot-latex', 'table-results',
    'canvas-design', 'generate-image', 'image-enhancer',
    'scientific-schematics', 'markitdown',
  ]);
  if (visualIds.has(id)) return 'visual';

  const productionIds = new Set([
    'doc', 'docx', 'pptx', 'xlsx', 'pdf',
    'theme-factory',
    'slide-to-video', 'video-production', 'speechify',
    'research-2-web',
  ]);
  if (productionIds.has(id)) return 'production';

  const devtoolsIds = new Set([
    'skill-creator', 'skill-creator-enhanced', 'skill-init', 'find-skills',
    'mcp-builder', 'agent-browser', 'browser-use', 'webapp-testing',
    'connect', 'connect-apps', 'connect-apps-plugin',
    'langsmith-fetch', 'multi-machine-orchestrator',
    'datascope-python-env', 'telegram-bot-setup',
    'file-organizer', 'changelog-generator',
    'artifacts-builder', 'document-skills',
    'api-key-security', 'gpu-setup-volta04', 'ralph-config',
  ]);
  if (devtoolsIds.has(id)) return 'devtools';

  return 'business';
}

// ── Composition DAG ───────────────────────────────────────────────
const COMPOSITIONS: Record<string, string[]> = {
  // Top: blade → 3 roles
  'blade': ['blade-scientist', 'blade-engineer', 'blade-student'],

  // Scientist sub-tree
  'blade-scientist': [
    'research-project-manager', 'vit-experiment',
    'scientific-writing', 'peer-review', 'research-grants', 'paper-2-web',
  ],
  'research-project-manager': [
    'research-new-experiment', 'research-archive', 'research-update',
    'research-status', 'research-next-steps', 'research-coding-prompt',
    'research-session', 'research-broadcast', 'research-card',
    'research-merge', 'research-design-principles', 'research-grow-topic',
    'research-slides', 'research-repo-init',
  ],
  'vit-experiment': [
    'ml-experiment-patterns', 'parallel-experiment-runner', 'nn-training',
    'desi-download', 'vit-desi-apogee-pipeline', 'bosz-to-desi-training',
    'scicomp-validation',
  ],
  'scientific-writing': [
    'literature-review', 'citation-management', 'hypothesis-generation',
    'venue-templates', 'research-lookup',
  ],
  'research-grants': ['scientific-writing', 'venue-templates', 'citation-management'],
  'peer-review': ['scientific-critical-thinking', 'hypothesis-generation'],
  'paper-2-web': ['research-2-web', 'scientific-schematics', 'notebooklm-learn'],

  // Engineer sub-tree
  'blade-engineer': [
    'audit', 'api-key-security', 'gpu-setup-volta04', 'nn-training', 'ralph-config',
    'skill-creator-enhanced', 'flowchart', 'slide-to-video',
  ],
  'skill-creator-enhanced': ['skill-creator', 'skill-init', 'find-skills'],
  'flowchart': ['flow-plot', 'code2d2-web'],
  'slide-to-video': ['research-slides', 'speechify', 'video-production'],

  // Student sub-tree
  'blade-student': ['blade-student-paper', 'notebooklm-learn', 'markitdown'],
};

// Inventory uses same compositions minus blade role nodes
const BLADE_EXCLUDE_IDS = new Set(['blade', 'blade-scientist', 'blade-engineer', 'blade-student', 'blade-student-paper']);
const INV_COMPOSITIONS: Record<string, string[]> = {};
for (const [p, c] of Object.entries(COMPOSITIONS)) {
  if (!BLADE_EXCLUDE_IDS.has(p)) INV_COMPOSITIONS[p] = c;
}

// ── Virtual nodes ─────────────────────────────────────────────────
const VIRTUAL_NODES: SkillRecord[] = [
  {
    id: 'blade-scientist', name: 'Scientist', description: 'Blade research & science role',
    source: 'local', maturity_score: 60, maturity_level: 'growing', status: 'active',
    word_count: 0, file_count: 0, has_skill_md: false, version: null,
    tags: ['blade', 'role'], progress: null, definition_of_done: null,
    last_modified: '', category: null, overrides_applied: false,
  },
  {
    id: 'blade-engineer', name: 'Engineer', description: 'Blade code & infrastructure role',
    source: 'local', maturity_score: 70, maturity_level: 'growing', status: 'active',
    word_count: 0, file_count: 0, has_skill_md: false, version: null,
    tags: ['blade', 'role'], progress: null, definition_of_done: null,
    last_modified: '', category: null, overrides_applied: false,
  },
  {
    id: 'blade-student', name: 'Student', description: 'Blade learning & study role',
    source: 'local', maturity_score: 30, maturity_level: 'seedling', status: 'active',
    word_count: 0, file_count: 0, has_skill_md: false, version: null,
    tags: ['blade', 'role'], progress: null, definition_of_done: null,
    last_modified: '', category: null, overrides_applied: false,
  },
];

// ── Utilities ─────────────────────────────────────────────────────
function computeLevels(skillIds: Set<string>, compositions: Record<string, string[]>): Map<string, number> {
  const levels = new Map<string, number>();
  for (const id of skillIds) levels.set(id, 0);
  let changed = true;
  let iter = 0;
  while (changed && iter < 10) {
    changed = false; iter++;
    for (const [parentId, childIds] of Object.entries(compositions)) {
      if (!skillIds.has(parentId)) continue;
      const valid = childIds.filter(c => skillIds.has(c));
      if (valid.length === 0) continue;
      const maxChild = Math.max(...valid.map(c => levels.get(c) || 0));
      const newLevel = maxChild + 1;
      if ((levels.get(parentId) || 0) < newLevel) {
        levels.set(parentId, newLevel);
        changed = true;
      }
    }
  }
  return levels;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function collectBladeTree(skillIds: Set<string>): Set<string> {
  const tree = new Set<string>();
  const queue = ['blade'];
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (tree.has(id) || !skillIds.has(id)) continue;
    tree.add(id);
    const children = COMPOSITIONS[id];
    if (children) for (const c of children) if (skillIds.has(c)) queue.push(c);
  }
  return tree;
}

// ── Node rendering helper ─────────────────────────────────────────
function appendNodeGraphics(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nodeEls: any,
  trackMap: Map<string, SkillTrack>,
): void {
  // Background rect
  nodeEls.append('rect')
    .attr('class', 'node-bg')
    .attr('width', NODE_W).attr('height', NODE_H)
    .attr('x', -NODE_W / 2).attr('y', -NODE_H / 2)
    .attr('rx', 5).attr('ry', 5)
    .attr('fill', 'rgba(13, 17, 23, 0.92)')
    .attr('stroke', (d: NodeDatum) => trackMap.get(d.track)?.color || '#888')
    .attr('stroke-width', 1.5);

  // Name
  nodeEls.append('text')
    .attr('class', 'node-name')
    .attr('y', -4).attr('text-anchor', 'middle')
    .attr('fill', '#e2e8f0')
    .attr('font-family', 'Inter, sans-serif')
    .attr('font-size', '11px').attr('font-weight', '600')
    .text((d: NodeDatum) => d.name.length > 20 ? d.name.slice(0, 18) + '\u2026' : d.name);

  // Maturity bar background
  nodeEls.append('rect')
    .attr('x', -NODE_W / 2 + 8).attr('y', NODE_H / 2 - 10)
    .attr('width', NODE_W - 16).attr('height', 4).attr('rx', 2)
    .attr('fill', 'rgba(255,255,255,0.06)');

  // Maturity bar fill
  nodeEls.append('rect')
    .attr('x', -NODE_W / 2 + 8).attr('y', NODE_H / 2 - 10)
    .attr('width', (d: NodeDatum) => (d.maturity_score / 100) * (NODE_W - 16))
    .attr('height', 4).attr('rx', 2)
    .attr('fill', (d: NodeDatum) => MATURITY_COLORS[d.maturity_level] || '#888');

  // Source dot
  nodeEls.append('circle')
    .attr('cx', NODE_W / 2 - 8).attr('cy', -NODE_H / 2 + 8).attr('r', 3)
    .attr('fill', (d: NodeDatum) => SOURCE_COLORS[d.source] || '#888');

  // Score micro-badge
  nodeEls.append('text')
    .attr('x', -NODE_W / 2 + 10).attr('y', NODE_H / 2 - 14)
    .attr('fill', (d: NodeDatum) => MATURITY_COLORS[d.maturity_level] || '#888')
    .attr('font-family', 'JetBrains Mono, monospace')
    .attr('font-size', '7px').attr('font-weight', '600').attr('opacity', 0.6)
    .text((d: NodeDatum) => d.maturity_score.toString());
}

// ── Detail panel helper ───────────────────────────────────────────
function showDetail(d: NodeDatum): void {
  const detailPanel = document.getElementById('skill-detail');
  if (!detailPanel) return;
  const el = (id: string) => document.getElementById(id);

  const srcEl = el('detail-source');
  if (srcEl) { srcEl.textContent = d.source.toUpperCase(); srcEl.style.color = SOURCE_COLORS[d.source] || '#888'; }

  const nameEl = el('detail-name');
  if (nameEl) nameEl.textContent = d.name;

  const idEl = el('detail-id');
  if (idEl) idEl.textContent = d.id;

  const levelEl = el('detail-maturity-level');
  if (levelEl) {
    levelEl.textContent = d.maturity_level;
    const c = MATURITY_COLORS[d.maturity_level] || '#888';
    levelEl.style.background = hexToRgba(c, 0.2);
    levelEl.style.color = c;
    levelEl.style.border = `1px solid ${hexToRgba(c, 0.4)}`;
  }

  const scoreEl = el('detail-score');
  if (scoreEl) scoreEl.textContent = `Score: ${d.maturity_score}/100`;

  const descEl = el('detail-desc');
  if (descEl) descEl.textContent = d.description || '(no description)';

  const tagsSection = el('detail-tags-section');
  const tagsEl = el('detail-tags');
  if (tagsSection && tagsEl) {
    if (d.tags && d.tags.length > 0) {
      tagsSection.style.display = 'block';
      tagsEl.innerHTML = d.tags.map(t =>
        `<span style="display:inline-block;background:rgba(255,255,255,0.08);padding:2px 8px;border-radius:3px;margin:2px;font-size:0.7rem;color:#8b949e">${t}</span>`
      ).join('');
    } else { tagsSection.style.display = 'none'; }
  }

  const dodSection = el('detail-dod-section');
  const dodEl = el('detail-dod');
  if (dodSection && dodEl) {
    if (d.definition_of_done && d.definition_of_done.length > 0) {
      dodSection.style.display = 'block';
      dodEl.innerHTML = d.definition_of_done.map(item =>
        `<div style="font-size:0.72rem;opacity:0.8;margin:2px 0">\u2022 ${item}</div>`
      ).join('');
    } else { dodSection.style.display = 'none'; }
  }

  const barEl = el('detail-maturity-bar');
  if (barEl) {
    barEl.style.width = `${d.maturity_score}%`;
    barEl.style.background = MATURITY_COLORS[d.maturity_level] || '#888';
  }

  // Reference content for specific skills
  const refSection = el('detail-reference-section');
  const refEl = el('detail-reference');
  if (refSection && refEl) {
    const ref = SKILL_REFERENCES[d.id];
    if (ref) {
      refSection.style.display = 'block';
      refEl.innerHTML = ref;
    } else {
      refSection.style.display = 'none';
      refEl.innerHTML = '';
    }
  }

  detailPanel.classList.add('visible');
}

// ── Skill reference content (shown in detail panel) ───────────────
const SKILL_REFERENCES: Record<string, string> = {
  'flowchart': `
    <div style="font-weight:600;color:#a0c8e8;margin-bottom:6px">24 Standard Flowchart Symbols</div>
    <table style="width:100%;border-collapse:collapse;font-size:0.65rem">
      <tr style="border-bottom:1px solid rgba(255,255,255,0.08)">
        <th style="text-align:left;padding:3px 4px;color:#4fc3f7">Tier 1 — Core</th><th style="color:#475569;padding:3px">Shape</th><th style="color:#475569;padding:3px">D2</th>
      </tr>
      <tr><td style="padding:2px 4px">Terminator</td><td style="padding:2px;color:#8b949e">Oval</td><td style="padding:2px;color:#66bb6a;font-family:monospace">oval</td></tr>
      <tr><td style="padding:2px 4px">Process</td><td style="padding:2px;color:#8b949e">Rectangle</td><td style="padding:2px;color:#66bb6a;font-family:monospace">rectangle</td></tr>
      <tr><td style="padding:2px 4px">Decision</td><td style="padding:2px;color:#8b949e">Diamond</td><td style="padding:2px;color:#66bb6a;font-family:monospace">diamond</td></tr>
      <tr><td style="padding:2px 4px">Data (I/O)</td><td style="padding:2px;color:#8b949e">Parallelogram</td><td style="padding:2px;color:#66bb6a;font-family:monospace">parallelogram</td></tr>
      <tr style="border-bottom:1px solid rgba(255,255,255,0.08)"><td style="padding:2px 4px">Arrow</td><td style="padding:2px;color:#8b949e">→ line</td><td style="padding:2px;color:#66bb6a;font-family:monospace">-></td></tr>
      <tr style="border-bottom:1px solid rgba(255,255,255,0.08)">
        <th style="text-align:left;padding:3px 4px;color:#4fc3f7">Tier 2 — Common</th><th></th><th></th>
      </tr>
      <tr><td style="padding:2px 4px">Document</td><td style="padding:2px;color:#8b949e">Wavy rect</td><td style="padding:2px;color:#66bb6a;font-family:monospace">page</td></tr>
      <tr><td style="padding:2px 4px">Database</td><td style="padding:2px;color:#8b949e">Cylinder</td><td style="padding:2px;color:#66bb6a;font-family:monospace">cylinder</td></tr>
      <tr><td style="padding:2px 4px">Subroutine</td><td style="padding:2px;color:#8b949e">Double-bar rect</td><td style="padding:2px;color:#66bb6a;font-family:monospace">step</td></tr>
      <tr><td style="padding:2px 4px">Preparation</td><td style="padding:2px;color:#8b949e">Hexagon</td><td style="padding:2px;color:#66bb6a;font-family:monospace">hexagon</td></tr>
      <tr><td style="padding:2px 4px">Connector</td><td style="padding:2px;color:#8b949e">Circle</td><td style="padding:2px;color:#66bb6a;font-family:monospace">circle</td></tr>
      <tr><td style="padding:2px 4px">Stored Data</td><td style="padding:2px;color:#8b949e">Curved rect</td><td style="padding:2px;color:#66bb6a;font-family:monospace">stored_data</td></tr>
      <tr style="border-bottom:1px solid rgba(255,255,255,0.08)">
        <th style="text-align:left;padding:3px 4px;color:#4fc3f7">Tier 3 — Specialized</th><th></th><th></th>
      </tr>
      <tr><td style="padding:2px 4px">Delay</td><td style="padding:2px;color:#8b949e">D-shape</td><td style="padding:2px;color:#66bb6a;font-family:monospace">queue</td></tr>
      <tr><td style="padding:2px 4px">Manual Input</td><td style="padding:2px;color:#8b949e">Slant-top rect</td><td style="padding:2px;color:#66bb6a;font-family:monospace">parallelogram</td></tr>
      <tr><td style="padding:2px 4px">Display</td><td style="padding:2px;color:#8b949e">Curved-left</td><td style="padding:2px;color:#66bb6a;font-family:monospace">rectangle</td></tr>
      <tr><td style="padding:2px 4px">Multi-Document</td><td style="padding:2px;color:#8b949e">Stacked pages</td><td style="padding:2px;color:#66bb6a;font-family:monospace">page+3d</td></tr>
      <tr><td style="padding:2px 4px">Off-page</td><td style="padding:2px;color:#8b949e">Pentagon</td><td style="padding:2px;color:#66bb6a;font-family:monospace">package</td></tr>
      <tr><td style="padding:2px 4px">Loop Limit</td><td style="padding:2px;color:#8b949e">Pentagon</td><td style="padding:2px;color:#66bb6a;font-family:monospace">package</td></tr>
    </table>
    <div style="margin-top:6px;color:#475569;font-size:0.6rem">Source: heflo.com/blog/flowchart-symbols</div>
  `,
};

// ══════════════════════════════════════════════════════════════════
// ── Main entry ────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
export function initSkillsHub(container: HTMLElement, registry: Registry): void {
  console.log('[SkillsHub] init', registry?.skills?.length, 'skills');

  import('d3').then((d3) => {
    const allSkills = registry.skills || [];
    if (allSkills.length === 0) return;

    const existingIds = new Set(allSkills.map(s => s.id));
    const skills = allSkills.filter(s => s.maturity_score > 0 && !s.id.endsWith('.old'));
    for (const vn of VIRTUAL_NODES) {
      if (!existingIds.has(vn.id)) skills.push(vn);
    }
    const skillMap = new Map(skills.map(s => [s.id, s]));
    const allIds = new Set(skills.map(s => s.id));

    // Detail panel close
    const detailPanel = document.getElementById('skill-detail');
    detailPanel?.querySelector('.close-btn')?.addEventListener('click', () => {
      detailPanel?.classList.remove('visible');
    });

    // ══════════════════════════════════════════════════════════════
    // ── TOP PANEL: Blade Composition Tree ─────────────────────────
    // ══════════════════════════════════════════════════════════════
    const bladeTreeIds = collectBladeTree(allIds);
    const bladeSkills = skills.filter(s => bladeTreeIds.has(s.id));
    const bladeTrackMap = new Map(BLADE_TRACKS.map(t => [t.id, t]));

    // Categorize for blade tree
    const bladeSkillTrack = new Map<string, string>();
    for (const s of bladeSkills) bladeSkillTrack.set(s.id, categorizeForBlade(s));

    // Compute levels
    const bladeLevels = computeLevels(bladeTreeIds, COMPOSITIONS);
    const bladeMaxLevel = Math.max(...bladeLevels.values(), 0);

    // Build edges
    const bladeEdges: EdgeDatum[] = [];
    for (const [parentId, childIds] of Object.entries(COMPOSITIONS)) {
      if (!bladeTreeIds.has(parentId)) continue;
      for (const childId of childIds) {
        if (bladeTreeIds.has(childId)) bladeEdges.push({ source: childId, target: parentId });
      }
    }

    // Layout
    const bladeLevelKeys: number[] = [];
    for (let l = bladeMaxLevel; l >= 0; l--) bladeLevelKeys.push(l);

    const bladeCellCounts = new Map<string, number>();
    for (const s of bladeSkills) {
      const key = `${bladeSkillTrack.get(s.id)}::${bladeLevels.get(s.id) || 0}`;
      bladeCellCounts.set(key, (bladeCellCounts.get(key) || 0) + 1);
    }

    const bladeLevelMaxOcc = new Map<number, number>();
    for (const [key, count] of bladeCellCounts) {
      const level = parseInt(key.split('::')[1]);
      bladeLevelMaxOcc.set(level, Math.max(bladeLevelMaxOcc.get(level) || 1, count));
    }

    // Compute SVG dimensions
    const bladeTopWidth = 3 * BLADE_COL_GAP;
    const invTopWidth = INV_TRACKS.length * INV_COL_GAP;
    const svgContentWidth = Math.max(bladeTopWidth, invTopWidth);
    const gutterLeft = 120;
    const svgWidth = gutterLeft + svgContentWidth + 80;
    const bladeCenterOffset = gutterLeft + (svgContentWidth - bladeTopWidth) / 2;

    function bladeTrackX(trackId: string): number {
      const t = bladeTrackMap.get(trackId);
      return bladeCenterOffset + (t?.column ?? 1) * BLADE_COL_GAP + BLADE_COL_GAP / 2;
    }

    const bladeLevelY = new Map<number, number>();
    let bladeY = 80;
    for (const level of bladeLevelKeys) {
      bladeLevelY.set(level, bladeY);
      const maxOcc = bladeLevelMaxOcc.get(level) || 1;
      bladeY += Math.max(ROW_GAP, maxOcc * SUB_ROW_H + 24);
    }
    const bladeTreeHeight = bladeY + 40;

    // Position blade nodes
    const bladeCellSlots = new Map<string, number>();
    const bladeSorted = [...bladeSkills].sort((a, b) => {
      const la = bladeLevels.get(a.id) || 0, lb = bladeLevels.get(b.id) || 0;
      if (la !== lb) return lb - la;
      return b.maturity_score - a.maturity_score;
    });

    const bladeNodes: NodeDatum[] = [];
    for (const s of bladeSorted) {
      const track = bladeSkillTrack.get(s.id) || 'engineer';
      const level = bladeLevels.get(s.id) || 0;
      const baseY = bladeLevelY.get(level) || 80;
      const key = `${track}::${level}`;
      const slot = bladeCellSlots.get(key) || 0;
      bladeCellSlots.set(key, slot + 1);

      bladeNodes.push({
        id: s.id, name: s.name, description: s.description,
        track, source: s.source,
        maturity_score: s.maturity_score, maturity_level: s.maturity_level,
        status: s.status, level,
        tags: s.tags, progress: s.progress,
        definition_of_done: s.definition_of_done,
        version: s.version, last_modified: s.last_modified,
        x: bladeTrackX(track),
        y: baseY + slot * SUB_ROW_H,
      });
    }
    const bladeNodeMap = new Map(bladeNodes.map(n => [n.id, n]));

    // ══════════════════════════════════════════════════════════════
    // ── BOTTOM PANEL: Skill Inventory ─────────────────────────────
    // ══════════════════════════════════════════════════════════════
    const invSkills = skills.filter(s => !BLADE_EXCLUDE_IDS.has(s.id) && !s.id.startsWith('blade-'));
    const invTrackMap = new Map(INV_TRACKS.map(t => [t.id, t]));
    const invGutterLeft = gutterLeft;
    const invTopY = bladeTreeHeight + 80; // gap below blade tree

    // Categorize
    const invSkillTrack = new Map<string, string>();
    for (const s of invSkills) invSkillTrack.set(s.id, categorizeOriginal(s));

    // Levels (using inventory compositions)
    const invIds = new Set(invSkills.map(s => s.id));
    const invLevels = computeLevels(invIds, INV_COMPOSITIONS);
    const invMaxLevel = Math.max(...invLevels.values(), 0);

    // Edges
    const invEdges: EdgeDatum[] = [];
    for (const [parentId, childIds] of Object.entries(INV_COMPOSITIONS)) {
      if (!invIds.has(parentId)) continue;
      for (const childId of childIds) {
        if (invIds.has(childId)) invEdges.push({ source: childId, target: parentId });
      }
    }

    // Layout
    const invLevelKeys: number[] = [];
    for (let l = invMaxLevel; l >= 0; l--) invLevelKeys.push(l);

    const invCellCounts = new Map<string, number>();
    for (const s of invSkills) {
      const key = `${invSkillTrack.get(s.id)}::${invLevels.get(s.id) || 0}`;
      invCellCounts.set(key, (invCellCounts.get(key) || 0) + 1);
    }

    const invLevelMaxOcc = new Map<number, number>();
    for (const [key, count] of invCellCounts) {
      const level = parseInt(key.split('::')[1]);
      invLevelMaxOcc.set(level, Math.max(invLevelMaxOcc.get(level) || 1, count));
    }

    function invTrackX(trackId: string): number {
      const t = invTrackMap.get(trackId);
      return invGutterLeft + (t?.column ?? 0) * INV_COL_GAP + INV_COL_GAP / 2;
    }

    const invLevelY = new Map<number, number>();
    let invY = invTopY + 50;
    for (const level of invLevelKeys) {
      invLevelY.set(level, invY);
      const maxOcc = invLevelMaxOcc.get(level) || 1;
      invY += Math.max(ROW_GAP, maxOcc * SUB_ROW_H + 24);
    }
    const totalHeight = invY + 80;

    // Position inventory nodes
    const invCellSlots = new Map<string, number>();
    const invSorted = [...invSkills].sort((a, b) => {
      const la = invLevels.get(a.id) || 0, lb = invLevels.get(b.id) || 0;
      if (la !== lb) return lb - la;
      const ca = invTrackMap.get(invSkillTrack.get(a.id) || '')?.column ?? 0;
      const cb = invTrackMap.get(invSkillTrack.get(b.id) || '')?.column ?? 0;
      if (ca !== cb) return ca - cb;
      return b.maturity_score - a.maturity_score;
    });

    const invNodes: NodeDatum[] = [];
    for (const s of invSorted) {
      const track = invSkillTrack.get(s.id) || 'business';
      const level = invLevels.get(s.id) || 0;
      const baseY = invLevelY.get(level) || invTopY;
      const key = `${track}::${level}`;
      const slot = invCellSlots.get(key) || 0;
      invCellSlots.set(key, slot + 1);

      invNodes.push({
        id: s.id, name: s.name, description: s.description,
        track, source: s.source,
        maturity_score: s.maturity_score, maturity_level: s.maturity_level,
        status: s.status, level,
        tags: s.tags, progress: s.progress,
        definition_of_done: s.definition_of_done,
        version: s.version, last_modified: s.last_modified,
        x: invTrackX(track),
        y: baseY + slot * SUB_ROW_H,
      });
    }
    const invNodeMap = new Map(invNodes.map(n => [n.id, n]));

    // ══════════════════════════════════════════════════════════════
    // ── Render SVG ────────────────────────────────────────────────
    // ══════════════════════════════════════════════════════════════
    const svg = d3.select(container)
      .append('svg')
      .attr('class', 'techtree-svg')
      .attr('width', svgWidth)
      .attr('height', totalHeight);

    const defs = svg.append('defs');
    const glowFilter = defs.append('filter')
      .attr('id', 'skill-glow')
      .attr('x', '-50%').attr('y', '-50%')
      .attr('width', '200%').attr('height', '200%');
    glowFilter.append('feGaussianBlur').attr('in', 'SourceGraphic').attr('stdDeviation', '2').attr('result', 'blur');
    glowFilter.append('feMerge').selectAll('feMergeNode')
      .data(['blur', 'SourceGraphic']).enter()
      .append('feMergeNode').attr('in', (d: string) => d);

    defs.append('marker')
      .attr('id', 'skill-arrow')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 8).attr('refY', 5)
      .attr('markerWidth', 6).attr('markerHeight', 6)
      .attr('orient', 'auto-start-reverse')
      .append('path').attr('d', 'M 0 0 L 10 5 L 0 10 Z')
      .attr('fill', 'rgba(255,255,255,0.2)');

    const g = svg.append('g');

    // ── TOP: Blade tree track headers ─────────────────────────────
    for (const track of BLADE_TRACKS) {
      const x = bladeTrackX(track.id);
      g.append('line')
        .attr('x1', x).attr('y1', 50)
        .attr('x2', x).attr('y2', bladeTreeHeight - 20)
        .attr('stroke', track.color).attr('stroke-dasharray', '3 6').attr('opacity', 0.12);
      g.append('text')
        .attr('x', x).attr('y', 40)
        .attr('fill', track.color).attr('text-anchor', 'middle')
        .attr('font-family', 'Inter, sans-serif')
        .attr('font-size', '11px').attr('font-weight', '700')
        .attr('letter-spacing', '0.15em')
        .text(track.label);
    }

    // Level labels for blade tree
    const bladeLevelLabels: Record<number, string> = {
      0: 'ATOMIC', 1: 'COMPOSITE', 2: 'ORCHESTRATOR', 3: 'META', 4: 'SYSTEM',
    };
    for (const level of bladeLevelKeys) {
      const y = bladeLevelY.get(level)!;
      g.append('text')
        .attr('x', bladeCenterOffset - 16).attr('y', y + 4)
        .attr('text-anchor', 'end').attr('fill', '#475569')
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('font-size', '10px').attr('font-weight', '600').attr('letter-spacing', '0.1em')
        .text(bladeLevelLabels[level] || `L${level}`);
    }

    // ── TOP: Blade edges ──────────────────────────────────────────
    const bladeEdgeEls = g.append('g').selectAll('.tree-edge')
      .data(bladeEdges).enter()
      .append('path')
      .attr('class', 'tree-edge')
      .attr('marker-end', 'url(#skill-arrow)')
      .attr('d', (d: EdgeDatum) => {
        const src = bladeNodeMap.get(d.source), tgt = bladeNodeMap.get(d.target);
        if (!src || !tgt) return '';
        const sx = src.x, sy = src.y - NODE_H / 2;
        const tx = tgt.x, ty = tgt.y + NODE_H / 2;
        const midY = (sy + ty) / 2;
        return `M${sx},${sy} C${sx},${midY} ${tx},${midY} ${tx},${ty}`;
      })
      .each(function(this: SVGPathElement, d: EdgeDatum) {
        const tgt = bladeNodeMap.get(d.target);
        const color = tgt ? bladeTrackMap.get(tgt.track)?.color || '#a0c8e8' : '#a0c8e8';
        d3.select(this).style('--edge-color', color);
      });

    // ── TOP: Blade nodes ──────────────────────────────────────────
    const bladeNodeEls = g.append('g').selectAll('.tree-node')
      .data(bladeNodes).enter()
      .append('g')
      .attr('class', 'tree-node')
      .attr('transform', (d: NodeDatum) => `translate(${d.x},${d.y})`)
      .each(function(this: SVGGElement, d: NodeDatum) {
        d3.select(this).style('--node-color', bladeTrackMap.get(d.track)?.color || '#888');
      });
    appendNodeGraphics(bladeNodeEls, bladeTrackMap);

    // ── SEPARATOR ─────────────────────────────────────────────────
    const sepY = bladeTreeHeight + 30;
    g.append('line')
      .attr('x1', 40).attr('y1', sepY)
      .attr('x2', svgWidth - 40).attr('y2', sepY)
      .attr('stroke', 'rgba(255,255,255,0.08)').attr('stroke-width', 1);
    g.append('text')
      .attr('x', svgWidth / 2).attr('y', sepY + 20)
      .attr('text-anchor', 'middle')
      .attr('fill', '#475569')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-size', '11px').attr('font-weight', '700')
      .attr('letter-spacing', '0.2em')
      .text('SKILL INVENTORY');

    // ── BOTTOM: Inventory track headers ───────────────────────────
    for (const track of INV_TRACKS) {
      const x = invTrackX(track.id);
      g.append('line')
        .attr('x1', x).attr('y1', invTopY + 30)
        .attr('x2', x).attr('y2', totalHeight - 60)
        .attr('stroke', track.color).attr('stroke-dasharray', '3 6').attr('opacity', 0.12);
      g.append('text')
        .attr('x', x).attr('y', invTopY + 16)
        .attr('fill', track.color).attr('text-anchor', 'middle')
        .attr('font-family', 'Inter, sans-serif')
        .attr('font-size', '11px').attr('font-weight', '700')
        .attr('letter-spacing', '0.15em')
        .text(track.label);
    }

    // ── BOTTOM: Inventory edges ───────────────────────────────────
    const invEdgeEls = g.append('g').selectAll('.tree-edge')
      .data(invEdges).enter()
      .append('path')
      .attr('class', 'tree-edge')
      .attr('marker-end', 'url(#skill-arrow)')
      .attr('d', (d: EdgeDatum) => {
        const src = invNodeMap.get(d.source), tgt = invNodeMap.get(d.target);
        if (!src || !tgt) return '';
        const sx = src.x, sy = src.y - NODE_H / 2;
        const tx = tgt.x, ty = tgt.y + NODE_H / 2;
        const midY = (sy + ty) / 2;
        return `M${sx},${sy} C${sx},${midY} ${tx},${midY} ${tx},${ty}`;
      })
      .each(function(this: SVGPathElement, d: EdgeDatum) {
        const tgt = invNodeMap.get(d.target);
        const color = tgt ? invTrackMap.get(tgt.track)?.color || '#a0c8e8' : '#a0c8e8';
        d3.select(this).style('--edge-color', color);
      });

    // ── BOTTOM: Inventory nodes ───────────────────────────────────
    const invNodeEls = g.append('g').selectAll('.tree-node')
      .data(invNodes).enter()
      .append('g')
      .attr('class', 'tree-node')
      .attr('transform', (d: NodeDatum) => `translate(${d.x},${d.y})`)
      .each(function(this: SVGGElement, d: NodeDatum) {
        d3.select(this).style('--node-color', invTrackMap.get(d.track)?.color || '#888');
      });
    appendNodeGraphics(invNodeEls, invTrackMap);

    // ── Interactions ──────────────────────────────────────────────
    const allNodeEls = d3.selectAll('.tree-node');
    const allEdgeEls = d3.selectAll('.tree-edge');

    function collectChain(nodeId: string, visited: Set<string>, compositions: Record<string, string[]>, ids: Set<string>): void {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      const children = compositions[nodeId];
      if (children) for (const c of children) if (ids.has(c)) collectChain(c, visited, compositions, ids);
      for (const [p, cs] of Object.entries(compositions)) {
        if (cs.includes(nodeId) && ids.has(p)) collectChain(p, visited, compositions, ids);
      }
    }

    // Wire click for both panels
    function wireNodeInteraction(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      nodeEls: any,
    ): void {
      nodeEls.on('click', (event: MouseEvent, d: NodeDatum) => {
        event.stopPropagation();
        showDetail(d);
      });

      nodeEls.on('mouseenter', (_: MouseEvent, d: NodeDatum) => {
        // Highlight chain in blade tree
        const bladeChain = new Set<string>();
        if (bladeTreeIds.has(d.id)) collectChain(d.id, bladeChain, COMPOSITIONS, bladeTreeIds);

        // Highlight chain in inventory
        const invChain = new Set<string>();
        if (invIds.has(d.id)) collectChain(d.id, invChain, INV_COMPOSITIONS, invIds);

        const combined = new Set([...bladeChain, ...invChain]);

        allNodeEls.classed('dimmed', function(this: SVGGElement) {
          const nd = d3.select(this).datum() as NodeDatum;
          return !combined.has(nd.id);
        });
        allNodeEls.classed('highlighted', function(this: SVGGElement) {
          const nd = d3.select(this).datum() as NodeDatum;
          return combined.has(nd.id) && nd.id !== d.id;
        });
        allEdgeEls.each(function(this: SVGPathElement) {
          const ed = d3.select(this).datum() as EdgeDatum;
          const inChain = (bladeChain.has(ed.source) && bladeChain.has(ed.target))
            || (invChain.has(ed.source) && invChain.has(ed.target));
          d3.select(this).classed('highlighted', inChain).classed('dimmed', !inChain);
        });
      });

      nodeEls.on('mouseleave', () => {
        allNodeEls.classed('dimmed', false).classed('highlighted', false);
        allEdgeEls.classed('highlighted', false).classed('dimmed', false);
      });
    }

    wireNodeInteraction(bladeNodeEls);
    wireNodeInteraction(invNodeEls);

    svg.on('click', () => {
      detailPanel?.classList.remove('visible');
      allEdgeEls.classed('highlighted', false);
    });

    // ── Track filter sidebar ──────────────────────────────────────
    const filterContainer = document.createElement('div');
    filterContainer.className = 'track-filters';
    filterContainer.style.cssText = 'position:absolute;top:12px;left:12px;display:flex;flex-direction:column;gap:3px;z-index:10';
    container.insertBefore(filterContainer, container.firstChild);

    const allTracks = [...BLADE_TRACKS, ...INV_TRACKS];
    const activeSet = new Set(allTracks.map(t => t.id));

    for (const track of allTracks) {
      const btn = document.createElement('button');
      btn.className = 'track-filter-btn active';
      btn.style.cssText = `
        display:flex;align-items:center;gap:6px;
        padding:4px 10px;border:1px solid ${track.color};
        border-radius:5px;background:rgba(13,17,23,0.95);
        color:${track.color};font-family:'JetBrains Mono',monospace;
        font-size:0.62rem;font-weight:500;letter-spacing:0.05em;
        text-transform:uppercase;cursor:pointer;transition:all 0.2s ease;
      `;
      const dot = document.createElement('span');
      dot.style.cssText = `width:7px;height:7px;border-radius:50%;background:${track.color};flex-shrink:0`;
      btn.appendChild(dot);
      btn.appendChild(document.createTextNode(track.label));
      filterContainer.appendChild(btn);

      btn.addEventListener('click', () => {
        if (activeSet.has(track.id)) {
          activeSet.delete(track.id);
          btn.style.borderColor = 'rgba(255,255,255,0.04)';
          btn.style.color = '#484f58'; dot.style.opacity = '0.3';
        } else {
          activeSet.add(track.id);
          btn.style.borderColor = track.color;
          btn.style.color = track.color; dot.style.opacity = '1';
        }
        allNodeEls.style('display', function(this: SVGGElement) {
          const nd = d3.select(this).datum() as NodeDatum;
          return activeSet.has(nd.track) ? 'block' : 'none';
        });
        allEdgeEls.style('display', function(this: SVGPathElement) {
          const ed = d3.select(this).datum() as EdgeDatum;
          const sn = bladeNodeMap.get(ed.source) || invNodeMap.get(ed.source);
          const tn = bladeNodeMap.get(ed.target) || invNodeMap.get(ed.target);
          if (!sn || !tn) return 'none';
          return activeSet.has(sn.track) && activeSet.has(tn.track) ? 'block' : 'none';
        });
      });
    }

    console.log('[SkillsHub] Rendered', bladeNodes.length, 'blade +', invNodes.length, 'inventory nodes');
  });
}
