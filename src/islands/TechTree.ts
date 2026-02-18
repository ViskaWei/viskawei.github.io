/**
 * Stellaris-style Tech Tree
 * Fixed grid layout — columns by sub-track, rows by year+semester.
 * Reverse chronological order (most recent at top).
 * Pan-only navigation, no zoom.
 */

import type { CourseNode, ProjectNode, Track, NodeType } from '../data/techtree';

// ── Layout constants ──────────────────────────────────────────
const NODE_W = 200;
const NODE_H = 64;
const PROJECT_R = 28;
const COL_GAP = 240;
const ROW_GAP = 100;
const GUTTER_LEFT = 310;  // 120 base + 190 sidebar offset
const GUTTER_TOP = 120;     // extra room for branch + sub-track headers
const PADDING_BOTTOM = 80;

const SEMESTER_ORDER: Record<string, number> = { Fall: 0, Spring: 1, Summer: 2 };

const INST_SHORT: Record<string, string> = {
  Berkeley: 'UCB',
  UChicago: 'UChi',
  JHU: 'JHU',
};

// Branch grouping for headers
const BRANCHES: { id: string; label: string; tracks: string[] }[] = [
  { id: 'engineering', label: 'ENGINEERING', tracks: ['ai', 'ml', 'algorithms', 'systems'] },
  { id: 'core', label: 'CORE', tracks: ['physics', 'math'] },
  { id: 'society', label: 'SOCIETY', tracks: ['business', 'social'] },
];

export function initTechTree(
  container: HTMLElement,
  courses: CourseNode[],
  projectNodes: ProjectNode[],
  tracks: Track[],
): void {
  import('d3').then((d3) => {
    const trackMap = new Map(tracks.map(t => [t.id, t]));
    const trackOrder = tracks.map(t => t.id);
    const trackCol = new Map(tracks.map(t => [t.id, t.column]));

    // ── Build semester-row keys ────────────────────────────────
    type RowKey = string;

    function makeRowKey(year: number, semester: string): RowKey {
      return `${year}-${semester}`;
    }

    // REVERSE chronological: negate so higher years sort first
    function rowSortVal(key: RowKey): number {
      const [yearStr, sem] = key.split('-');
      return -(parseInt(yearStr) * 10 + (SEMESTER_ORDER[sem] ?? 0));
    }

    const allRowKeys = new Set<RowKey>();
    for (const c of courses) {
      allRowKeys.add(makeRowKey(c.year, c.semester));
    }
    for (const p of projectNodes) {
      allRowKeys.add(makeRowKey(p.year, p.semester));
    }
    const rowKeys = Array.from(allRowKeys).sort((a, b) => rowSortVal(a) - rowSortVal(b));

    // ── Sub-row stacking within each (track, rowKey) cell ──────
    const cellOccupants = new Map<string, number>();

    function cellKey(track: string, rowKey: RowKey): string {
      return `${track}::${rowKey}`;
    }

    function getSlot(track: string, rowKey: RowKey): number {
      const key = cellKey(track, rowKey);
      const idx = cellOccupants.get(key) || 0;
      cellOccupants.set(key, idx + 1);
      return idx;
    }

    // Count occupants per cell first
    const cellCounts = new Map<string, number>();
    for (const c of courses) {
      const rk = makeRowKey(c.year, c.semester);
      const key = cellKey(c.track, rk);
      cellCounts.set(key, (cellCounts.get(key) || 0) + 1);
    }
    for (const p of projectNodes) {
      const track = p.track || 'ml';
      const rk = makeRowKey(p.year, p.semester);
      const key = cellKey(track, rk);
      cellCounts.set(key, (cellCounts.get(key) || 0) + 1);
    }

    const rowMaxOccupants = new Map<RowKey, number>();
    for (const [key, count] of cellCounts) {
      const rk = key.split('::')[1];
      rowMaxOccupants.set(rk, Math.max(rowMaxOccupants.get(rk) || 1, count));
    }

    const SUB_ROW_H = NODE_H + 24;
    const rowY = new Map<RowKey, number>();
    let cumulativeY = GUTTER_TOP + 60;
    for (const rk of rowKeys) {
      rowY.set(rk, cumulativeY);
      const maxOcc = rowMaxOccupants.get(rk) || 1;
      cumulativeY += Math.max(ROW_GAP, maxOcc * SUB_ROW_H + 28);
    }

    const totalHeight = cumulativeY + PADDING_BOTTOM;
    const totalWidth = GUTTER_LEFT + tracks.length * COL_GAP + 100;

    // ── Position helpers ──────────────────────────────────────
    function getX(track: string): number {
      const col = trackCol.get(track) ?? 0;
      return GUTTER_LEFT + col * COL_GAP + COL_GAP / 2;
    }

    function getY(track: string, rowKey: RowKey): number {
      const baseY = rowY.get(rowKey) || GUTTER_TOP;
      const slot = getSlot(track, rowKey);
      return baseY + slot * SUB_ROW_H;
    }

    // ── Build positioned node data ──────────────────────────────
    interface NodeDatum {
      id: string;
      name: string;
      code?: string;
      institution: string;
      track: string;
      grade?: string;
      year: number;
      semester: string;
      isProject: boolean;
      nodeType: NodeType;
      x: number;
      y: number;
      prerequisites?: string[];
      relatedProjects?: string[];
      relatedCourses?: string[];
      url?: string;
      venue?: string;
    }

    const positionedNodes: NodeDatum[] = [];

    const sortedCourses = [...courses].sort((a, b) => {
      const rkA = rowSortVal(makeRowKey(a.year, a.semester));
      const rkB = rowSortVal(makeRowKey(b.year, b.semester));
      if (rkA !== rkB) return rkA - rkB;
      const ca = trackCol.get(a.track) ?? 0;
      const cb = trackCol.get(b.track) ?? 0;
      if (ca !== cb) return ca - cb;
      return a.id.localeCompare(b.id);
    });

    for (const c of sortedCourses) {
      const rk = makeRowKey(c.year, c.semester);
      positionedNodes.push({
        id: c.id,
        name: c.name,
        code: c.code,
        institution: c.institution,
        track: c.track,
        grade: c.grade,
        year: c.year,
        semester: c.semester,
        isProject: false,
        nodeType: c.nodeType || 'course',
        x: getX(c.track),
        y: getY(c.track, rk),
        prerequisites: c.prerequisites,
        relatedProjects: c.relatedProjects,
      });
    }

    const sortedProjects = [...projectNodes].sort((a, b) => {
      const rkA = rowSortVal(makeRowKey(a.year, a.semester));
      const rkB = rowSortVal(makeRowKey(b.year, b.semester));
      if (rkA !== rkB) return rkA - rkB;
      return a.id.localeCompare(b.id);
    });

    for (const p of sortedProjects) {
      const track = p.track || 'ml';
      const rk = makeRowKey(p.year, p.semester);
      positionedNodes.push({
        id: p.id,
        name: p.name,
        institution: '',
        track,
        year: p.year,
        semester: p.semester,
        isProject: true,
        nodeType: p.nodeType || 'project',
        x: getX(track),
        y: getY(track, rk),
        relatedCourses: p.relatedCourses,
        url: p.url,
        venue: p.venue,
      });
    }

    const nodeMap = new Map(positionedNodes.map(n => [n.id, n]));

    // ── Build edges ─────────────────────────────────────────────
    interface LinkDatum {
      source: string;
      target: string;
      isCrossTrack: boolean;
    }

    const links: LinkDatum[] = [];

    for (const c of courses) {
      if (c.prerequisites) {
        for (const pre of c.prerequisites) {
          const srcNode = nodeMap.get(pre);
          const tgtNode = nodeMap.get(c.id);
          if (srcNode && tgtNode) {
            links.push({
              source: pre,
              target: c.id,
              isCrossTrack: srcNode.track !== tgtNode.track,
            });
          }
        }
      }
    }

    for (const p of projectNodes) {
      for (const cid of p.relatedCourses) {
        const srcNode = nodeMap.get(cid);
        const tgtNode = nodeMap.get(p.id);
        if (srcNode && tgtNode) {
          links.push({
            source: cid,
            target: p.id,
            isCrossTrack: srcNode.track !== tgtNode.track,
          });
        }
      }
    }

    // ── Create SVG (sized to full content for native scroll) ───
    const svg = d3.select(container)
      .append('svg')
      .attr('class', 'techtree-svg')
      .attr('width', totalWidth)
      .attr('height', totalHeight);

    // Defs
    const defs = svg.append('defs');

    // Soft glow filter (Stellaris-style, subtle)
    const glowFilter = defs.append('filter')
      .attr('id', 'soft-glow')
      .attr('x', '-50%').attr('y', '-50%')
      .attr('width', '200%').attr('height', '200%');
    glowFilter.append('feGaussianBlur')
      .attr('in', 'SourceGraphic')
      .attr('stdDeviation', '2')
      .attr('result', 'blur');
    glowFilter.append('feMerge')
      .selectAll('feMergeNode')
      .data(['blur', 'SourceGraphic'])
      .enter()
      .append('feMergeNode')
      .attr('in', (d: string) => d);

    // Arrow marker
    defs.append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 8)
      .attr('refY', 5)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto-start-reverse')
      .append('path')
      .attr('d', 'M 0 0 L 10 5 L 0 10 Z')
      .attr('fill', 'rgba(255,255,255,0.2)')
      .attr('class', 'tree-edge-arrow');

    // Main group (no transform — scrolling handled by container overflow)
    const g = svg.append('g');

    // ── Draw branch headers + sub-track column headers ────────
    for (const branch of BRANCHES) {
      const branchTrackObjs = branch.tracks
        .map(tid => trackMap.get(tid))
        .filter(Boolean) as Track[];
      if (branchTrackObjs.length === 0) continue;

      const firstX = getX(branchTrackObjs[0].id);
      const lastX = getX(branchTrackObjs[branchTrackObjs.length - 1].id);
      const centerX = (firstX + lastX) / 2;

      // Branch header
      g.append('text')
        .attr('class', 'branch-header')
        .attr('x', centerX)
        .attr('y', GUTTER_TOP - 30)
        .attr('text-anchor', 'middle')
        .attr('fill', '#e2e8f0')
        .attr('font-family', 'Inter, sans-serif')
        .attr('font-size', '15px')
        .attr('font-weight', '700')
        .attr('letter-spacing', '0.2em')
        .text(branch.label);

      // Branch divider lines (between branches)
      if (branch.id !== 'engineering') {
        const prevBranchLastTrack = branch.id === 'core'
          ? trackMap.get('systems')
          : trackMap.get('math');
        const currBranchFirstTrack = branchTrackObjs[0];
        if (prevBranchLastTrack && currBranchFirstTrack) {
          const divX = (getX(prevBranchLastTrack.id) + getX(currBranchFirstTrack.id)) / 2;
          g.append('line')
            .attr('x1', divX)
            .attr('y1', GUTTER_TOP - 10)
            .attr('x2', divX)
            .attr('y2', totalHeight - PADDING_BOTTOM)
            .attr('stroke', 'rgba(255,255,255,0.08)')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '6 4');
        }
      }
    }

    // Sub-track column headers + vertical guide lines
    for (const track of tracks) {
      const x = getX(track.id);

      // Vertical dashed guide line
      g.append('line')
        .attr('class', 'track-column-line')
        .attr('x1', x)
        .attr('y1', GUTTER_TOP + 40)
        .attr('x2', x)
        .attr('y2', totalHeight - PADDING_BOTTOM)
        .attr('stroke', track.color)
        .attr('stroke-dasharray', '3 6')
        .attr('opacity', 0.15);

      // Sub-track column header
      g.append('text')
        .attr('class', 'track-column-header')
        .attr('x', x)
        .attr('y', GUTTER_TOP + 10)
        .attr('fill', track.color)
        .attr('text-anchor', 'middle')
        .attr('font-family', 'Inter, sans-serif')
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .attr('letter-spacing', '0.1em')
        .text(track.label);
    }

    // ── Draw year labels + horizontal grid lines ────────────────
    const yearFirstRow = new Map<number, number>();
    for (const rk of rowKeys) {
      const year = parseInt(rk.split('-')[0]);
      const y = rowY.get(rk)!;
      if (!yearFirstRow.has(year) || y < yearFirstRow.get(year)!) {
        yearFirstRow.set(year, y);
      }
    }

    for (const [year, y] of yearFirstRow) {
      g.append('text')
        .attr('class', 'year-label')
        .attr('x', GUTTER_LEFT - 16)
        .attr('y', y + 8)
        .attr('text-anchor', 'end')
        .attr('fill', '#475569')
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('font-size', '13px')
        .attr('font-weight', '600')
        .text(year.toString());

      g.append('line')
        .attr('class', 'year-gridline')
        .attr('x1', GUTTER_LEFT)
        .attr('y1', y - 10)
        .attr('x2', totalWidth)
        .attr('y2', y - 10)
        .attr('stroke', 'rgba(255,255,255,0.05)')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '2 8');
    }

    // ── Draw edges ──────────────────────────────────────────────
    const edgeGroup = g.append('g');

    const edgeElements = edgeGroup.selectAll('.tree-edge')
      .data(links)
      .enter()
      .append('path')
      .attr('class', 'tree-edge')
      .attr('marker-end', 'url(#arrow)')
      .attr('d', (d: LinkDatum) => {
        const src = nodeMap.get(d.source);
        const tgt = nodeMap.get(d.target);
        if (!src || !tgt) return '';
        return computeEdgePath(src, tgt);
      })
      .each(function(this: SVGPathElement, d: LinkDatum) {
        const tgt = nodeMap.get(d.target);
        const color = tgt ? trackMap.get(tgt.track)?.color || '#a0c8e8' : '#a0c8e8';
        d3.select(this).style('--edge-color', color);
      });

    // Node radius by type (for edge endpoints)
    function nodeRadius(n: NodeDatum): number {
      if (!n.isProject) return NODE_H / 2;
      switch (n.nodeType) {
        case 'thesis': return 32;       // HEX_R
        case 'internship': return 28;   // PENT_R
        case 'publication': return 22;  // PUB_H / 2
        case 'repo': return 26;         // OCT_R
        default: return PROJECT_R;      // diamond
      }
    }

    function computeEdgePath(src: NodeDatum, tgt: NodeDatum): string {
      const sx = src.x;
      // Reverse chronological: source (prerequisite/older) has HIGHER y (bottom)
      // Target (dependent/newer) has LOWER y (top)
      // Edge: from top of source UP to bottom of target
      const sy = src.y - nodeRadius(src);
      const tx = tgt.x;
      const ty = tgt.y + nodeRadius(tgt);

      const midY = (sy + ty) / 2;
      return `M${sx},${sy} C${sx},${midY} ${tx},${midY} ${tx},${ty}`;
    }

    // ── Draw nodes ──────────────────────────────────────────────
    const nodeGroup = g.append('g');

    const nodeElements = nodeGroup.selectAll('.tree-node')
      .data(positionedNodes)
      .enter()
      .append('g')
      .attr('class', (d: NodeDatum) => {
        const typeClass = d.nodeType !== 'course' ? `${d.nodeType}-node` : '';
        return `tree-node ${d.isProject ? 'project-node' : ''} ${typeClass}`.trim();
      })
      .attr('transform', (d: NodeDatum) => `translate(${d.x},${d.y})`)
      .each(function(this: SVGGElement, d: NodeDatum) {
        const color = trackMap.get(d.track)?.color || '#a0c8e8';
        d3.select(this).style('--node-color', color);
      });

    // ── Course nodes (rounded rectangles) ─────────────────────
    const courseNodeEls = nodeElements.filter((d: NodeDatum) => d.nodeType === 'course');

    courseNodeEls.append('rect')
      .attr('class', 'node-bg')
      .attr('width', NODE_W)
      .attr('height', NODE_H)
      .attr('x', -NODE_W / 2)
      .attr('y', -NODE_H / 2)
      .attr('rx', 6)
      .attr('ry', 6)
      .attr('fill', 'rgba(13, 17, 23, 0.92)')
      .attr('stroke', (d: NodeDatum) => trackMap.get(d.track)?.color || '#a0c8e8')
      .attr('stroke-width', 2);

    courseNodeEls.append('text')
      .attr('class', 'node-name')
      .attr('y', -8)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e2e8f0')
      .attr('font-family', 'Inter, sans-serif')
      .attr('font-size', '13px')
      .attr('font-weight', '600')
      .text((d: NodeDatum) => {
        const name = d.name;
        return name.length > 24 ? name.slice(0, 22) + '\u2026' : name;
      });

    courseNodeEls.append('text')
      .attr('class', 'node-code')
      .attr('y', 8)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-size', '10px')
      .text((d: NodeDatum) => d.code || '');

    // Grade badge
    courseNodeEls.filter((d: NodeDatum) => !!d.grade)
      .each(function(this: SVGGElement, d: NodeDatum) {
        const grp = d3.select(this);
        const gx = NODE_W / 2 - 4;
        const gy = -NODE_H / 2 - 1;
        const badgeW = 30;
        const badgeH = 16;

        grp.append('rect')
          .attr('class', 'grade-badge')
          .attr('x', gx - badgeW)
          .attr('y', gy)
          .attr('width', badgeW)
          .attr('height', badgeH)
          .attr('rx', 4)
          .attr('fill', 'rgba(48, 209, 88, 0.12)')
          .attr('stroke', 'rgba(48, 209, 88, 0.3)')
          .attr('stroke-width', 0.5);

        grp.append('text')
          .attr('class', 'node-grade')
          .attr('x', gx - badgeW / 2)
          .attr('y', gy + badgeH / 2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('fill', '#30d158')
          .attr('font-family', 'JetBrains Mono, monospace')
          .attr('font-size', '10px')
          .attr('font-weight', '700')
          .text(d.grade!);
      });

    // Institution micro-badge
    courseNodeEls.append('text')
      .attr('class', 'node-institution')
      .attr('y', NODE_H / 2 - 5)
      .attr('text-anchor', 'middle')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-size', '9px')
      .attr('opacity', 0.5)
      .attr('fill', (d: NodeDatum) => trackMap.get(d.track)?.color || '#64748b')
      .text((d: NodeDatum) => INST_SHORT[d.institution] || d.institution);

    // ── Project nodes (diamond) ─────────────────────────────────
    const projNodeEls = nodeElements.filter((d: NodeDatum) => d.nodeType === 'project');

    projNodeEls.append('polygon')
      .attr('points', `0,${-PROJECT_R} ${PROJECT_R},0 0,${PROJECT_R} ${-PROJECT_R},0`)
      .attr('fill', (d: NodeDatum) => {
        const color = trackMap.get(d.track)?.color || '#c4b5e0';
        return hexToRgba(color, 0.15);
      })
      .attr('stroke', (d: NodeDatum) => trackMap.get(d.track)?.color || '#c4b5e0')
      .attr('stroke-width', 2);

    projNodeEls.append('text')
      .attr('class', 'node-name')
      .attr('y', 3)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e2e8f0')
      .attr('font-family', 'Inter, sans-serif')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .text((d: NodeDatum) => d.name.length > 14 ? d.name.slice(0, 12) + '\u2026' : d.name);

    // ── Thesis nodes (hexagon) ──────────────────────────────────
    const thesisNodeEls = nodeElements.filter((d: NodeDatum) => d.nodeType === 'thesis');
    const HEX_R = 32;

    thesisNodeEls.append('polygon')
      .attr('points', () => {
        const pts: string[] = [];
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 6;
          pts.push(`${HEX_R * Math.cos(angle)},${HEX_R * Math.sin(angle)}`);
        }
        return pts.join(' ');
      })
      .attr('fill', (d: NodeDatum) => hexToRgba(trackMap.get(d.track)?.color || '#c4b5e0', 0.18))
      .attr('stroke', (d: NodeDatum) => trackMap.get(d.track)?.color || '#c4b5e0')
      .attr('stroke-width', 2);

    thesisNodeEls.append('text')
      .attr('class', 'node-name')
      .attr('y', 0)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', '#e2e8f0')
      .attr('font-family', 'Inter, sans-serif')
      .attr('font-size', '9px')
      .attr('font-weight', '700')
      .text((d: NodeDatum) => d.name.length > 20 ? d.name.slice(0, 18) + '\u2026' : d.name);

    // ── Internship nodes (pentagon) ─────────────────────────────
    const internNodeEls = nodeElements.filter((d: NodeDatum) => d.nodeType === 'internship');
    const PENT_R = 28;

    internNodeEls.append('polygon')
      .attr('points', () => {
        const pts: string[] = [];
        for (let i = 0; i < 5; i++) {
          const angle = (2 * Math.PI / 5) * i - Math.PI / 2;
          pts.push(`${PENT_R * Math.cos(angle)},${PENT_R * Math.sin(angle)}`);
        }
        return pts.join(' ');
      })
      .attr('fill', (d: NodeDatum) => hexToRgba(trackMap.get(d.track)?.color || '#ff4d4d', 0.18))
      .attr('stroke', (d: NodeDatum) => trackMap.get(d.track)?.color || '#ff4d4d')
      .attr('stroke-width', 2);

    internNodeEls.append('text')
      .attr('class', 'node-name')
      .attr('y', 0)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', '#e2e8f0')
      .attr('font-family', 'Inter, sans-serif')
      .attr('font-size', '9px')
      .attr('font-weight', '700')
      .text((d: NodeDatum) => d.name.length > 20 ? d.name.slice(0, 18) + '\u2026' : d.name);

    // ── Publication nodes (document/star shape — rounded rect with accent) ──
    const pubNodeEls = nodeElements.filter((d: NodeDatum) => d.nodeType === 'publication');
    const PUB_W = 160;
    const PUB_H = 44;

    pubNodeEls.append('rect')
      .attr('width', PUB_W)
      .attr('height', PUB_H)
      .attr('x', -PUB_W / 2)
      .attr('y', -PUB_H / 2)
      .attr('rx', 12)
      .attr('ry', 12)
      .attr('fill', (d: NodeDatum) => hexToRgba(trackMap.get(d.track)?.color || '#a0c8e8', 0.12))
      .attr('stroke', (d: NodeDatum) => trackMap.get(d.track)?.color || '#a0c8e8')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '6 3');

    pubNodeEls.append('text')
      .attr('class', 'node-name')
      .attr('y', -4)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e2e8f0')
      .attr('font-family', 'Inter, sans-serif')
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .text((d: NodeDatum) => d.name.length > 24 ? d.name.slice(0, 22) + '\u2026' : d.name);

    pubNodeEls.filter((d: NodeDatum) => !!d.venue)
      .append('text')
      .attr('class', 'node-code')
      .attr('y', 10)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-size', '8px')
      .text((d: NodeDatum) => d.venue || '');

    // ── Repo nodes (octagon) ────────────────────────────────────
    const repoNodeEls = nodeElements.filter((d: NodeDatum) => d.nodeType === 'repo');
    const OCT_R = 26;

    repoNodeEls.append('polygon')
      .attr('points', () => {
        const pts: string[] = [];
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI / 4) * i - Math.PI / 8;
          pts.push(`${OCT_R * Math.cos(angle)},${OCT_R * Math.sin(angle)}`);
        }
        return pts.join(' ');
      })
      .attr('fill', (d: NodeDatum) => hexToRgba(trackMap.get(d.track)?.color || '#7fd4a8', 0.15))
      .attr('stroke', (d: NodeDatum) => trackMap.get(d.track)?.color || '#7fd4a8')
      .attr('stroke-width', 1.5);

    repoNodeEls.append('text')
      .attr('class', 'node-name')
      .attr('y', 0)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', '#e2e8f0')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-size', '8px')
      .attr('font-weight', '600')
      .text((d: NodeDatum) => {
        // Show just the repo name portion
        const parts = d.name.split('/');
        const repoName = parts.length > 1 ? parts[1] : d.name;
        return repoName.length > 16 ? repoName.slice(0, 14) + '\u2026' : repoName;
      });

    // ── Interaction: hover -> highlight prereq chain ─────────────
    function collectPrereqChain(nodeId: string, visited: Set<string>): void {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      const node = nodeMap.get(nodeId);
      if (!node) return;

      if (node.prerequisites) {
        for (const pre of node.prerequisites) {
          collectPrereqChain(pre, visited);
        }
      }

      if (node.isProject && node.relatedCourses) {
        for (const cid of node.relatedCourses) {
          collectPrereqChain(cid, visited);
        }
      }
    }

    function collectDownstreamChain(nodeId: string, visited: Set<string>): void {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      for (const c of courses) {
        if (c.prerequisites?.includes(nodeId)) {
          collectDownstreamChain(c.id, visited);
        }
      }

      for (const p of projectNodes) {
        if (p.relatedCourses.includes(nodeId)) {
          collectDownstreamChain(p.id, visited);
        }
      }
    }

    nodeElements.on('mouseenter', (_event: MouseEvent, d: NodeDatum) => {
      const chain = new Set<string>();
      collectPrereqChain(d.id, chain);
      collectDownstreamChain(d.id, chain);

      nodeElements.classed('dimmed', (n: NodeDatum) => !chain.has(n.id));
      nodeElements.classed('highlighted', (n: NodeDatum) => chain.has(n.id) && n.id !== d.id);

      edgeElements.each(function(this: SVGPathElement, l: LinkDatum) {
        const inChain = chain.has(l.source) && chain.has(l.target);
        d3.select(this)
          .classed('highlighted', inChain)
          .classed('dimmed', !inChain);

        if (inChain) {
          const tgt = nodeMap.get(l.target);
          const color = tgt ? trackMap.get(tgt.track)?.color || '#a0c8e8' : '#a0c8e8';
          d3.select(this)
            .attr('stroke', color)
            .style('--edge-color', color);
        }
      });
    });

    nodeElements.on('mouseleave', () => {
      nodeElements.classed('dimmed', false).classed('highlighted', false);
      edgeElements
        .classed('highlighted', false)
        .classed('dimmed', false)
        .attr('stroke', 'rgba(255,255,255,0.12)');
    });

    // ── Interaction: click -> detail panel ───────────────────────
    const detailPanel = container.querySelector('.detail-panel') as HTMLElement | null;

    nodeElements.on('click', (event: MouseEvent, d: NodeDatum) => {
      event.stopPropagation();
      if (!detailPanel) return;

      const track = trackMap.get(d.track);
      const color = track?.color || '#a0c8e8';

      detailPanel.style.setProperty('--track-color', color);
      detailPanel.querySelector('h3')!.textContent = d.name;

      const codeEl = detailPanel.querySelector('.detail-code') as HTMLElement;
      codeEl.textContent = d.code || (d.venue ? d.venue : '');
      codeEl.style.display = (d.code || d.venue) ? 'block' : 'none';

      const metaEl = detailPanel.querySelector('.detail-meta') as HTMLElement;
      const instBadge = metaEl.querySelector('.detail-institution-badge') as HTMLElement;
      const yearEl = metaEl.querySelector('.detail-year') as HTMLElement;

      if (d.institution) {
        instBadge.textContent = d.institution;
        instBadge.style.display = 'inline-block';
      } else {
        instBadge.style.display = 'none';
      }
      yearEl.textContent = `${d.semester} ${d.year}`;

      const gradeEl = detailPanel.querySelector('.detail-grade') as HTMLElement;
      if (d.grade) {
        gradeEl.textContent = d.grade;
        gradeEl.style.display = 'inline-block';
      } else {
        gradeEl.style.display = 'none';
      }

      // Node type badge
      const typeEl = detailPanel.querySelector('.detail-type') as HTMLElement;
      if (typeEl) {
        typeEl.textContent = d.nodeType.toUpperCase();
        typeEl.style.color = color;
        typeEl.style.display = 'block';
      }

      const trackEl = detailPanel.querySelector('.detail-track') as HTMLElement;
      trackEl.textContent = `${track?.label || d.track}`;

      // Prerequisites section
      const prereqSection = detailPanel.querySelector('.detail-prereqs') as HTMLElement;
      const prereqList = prereqSection.querySelector('.detail-list') as HTMLElement;
      prereqList.innerHTML = '';
      const prereqs = d.prerequisites || [];
      if (prereqs.length > 0) {
        prereqSection.style.display = 'block';
        prereqSection.querySelector('h4')!.textContent = 'PREREQUISITES';
        for (const preId of prereqs) {
          const preNode = nodeMap.get(preId);
          if (preNode) {
            const item = document.createElement('div');
            item.className = 'detail-prereq-item';
            item.textContent = `${preNode.code || ''} ${preNode.name}`;
            item.addEventListener('click', () => {
              const nodeEl = nodeElements.filter((n: NodeDatum) => n.id === preId);
              nodeEl.dispatch('click');
            });
            prereqList.appendChild(item);
          }
        }
      } else {
        prereqSection.style.display = 'none';
      }

      // Related projects section
      const projectSection = detailPanel.querySelector('.detail-projects') as HTMLElement;
      const projectList = projectSection.querySelector('.detail-list') as HTMLElement;
      projectList.innerHTML = '';

      const relatedProjectIds = d.relatedProjects || [];
      const referencing = projectNodes.filter(p => p.relatedCourses.includes(d.id));

      const allRelated = new Set([
        ...relatedProjectIds,
        ...referencing.map(p => p.id),
      ]);

      if (allRelated.size > 0) {
        projectSection.style.display = 'block';
        for (const projId of allRelated) {
          const projNode = nodeMap.get(projId);
          if (projNode) {
            const item = document.createElement('div');
            item.className = 'detail-related-item';
            item.textContent = projNode.name;
            item.addEventListener('click', () => {
              const nodeEl = nodeElements.filter((n: NodeDatum) => n.id === projId);
              nodeEl.dispatch('click');
            });
            projectList.appendChild(item);
          }
        }
      } else {
        projectSection.style.display = 'none';
      }

      // For project-like nodes, show related courses instead
      if (d.isProject && d.relatedCourses) {
        prereqSection.style.display = 'block';
        prereqSection.querySelector('h4')!.textContent = 'RELATED COURSES';
        prereqList.innerHTML = '';
        for (const cid of d.relatedCourses) {
          const cNode = nodeMap.get(cid);
          if (cNode) {
            const item = document.createElement('div');
            item.className = 'detail-prereq-item';
            item.textContent = `${cNode.code || ''} ${cNode.name}`;
            item.addEventListener('click', () => {
              const nodeEl = nodeElements.filter((n: NodeDatum) => n.id === cid);
              nodeEl.dispatch('click');
            });
            prereqList.appendChild(item);
          }
        }
        projectSection.style.display = 'none';
      }

      detailPanel.classList.add('visible');

      const chain = new Set<string>();
      collectPrereqChain(d.id, chain);

      edgeElements.classed('highlighted', (l: LinkDatum) => {
        return chain.has(l.source) && chain.has(l.target);
      });

      edgeElements.each(function(this: SVGPathElement, l: LinkDatum) {
        if (chain.has(l.source) && chain.has(l.target)) {
          const tgt = nodeMap.get(l.target);
          const edgeColor = tgt ? trackMap.get(tgt.track)?.color || '#a0c8e8' : '#a0c8e8';
          d3.select(this)
            .attr('stroke', edgeColor)
            .style('--edge-color', edgeColor);
        }
      });
    });

    // Close detail panel
    function closePanel(): void {
      if (!detailPanel) return;
      detailPanel.classList.remove('visible');
      edgeElements
        .classed('highlighted', false)
        .attr('stroke', 'rgba(255,255,255,0.12)');
    }

    detailPanel?.querySelector('.close-btn')?.addEventListener('click', closePanel);
    svg.on('click', closePanel);

    // ── Track filters ───────────────────────────────────────────
    const activeTracksSet = new Set(trackOrder);

    container.querySelectorAll('.track-filter-btn').forEach(btn => {
      btn.classList.add('active');
      btn.addEventListener('click', () => {
        const trackId = (btn as HTMLElement).dataset.track!;
        if (activeTracksSet.has(trackId)) {
          activeTracksSet.delete(trackId);
          btn.classList.remove('active');
        } else {
          activeTracksSet.add(trackId);
          btn.classList.add('active');
        }

        nodeElements.style('display', (d: NodeDatum) => {
          return activeTracksSet.has(d.track) ? 'block' : 'none';
        });

        edgeElements.style('display', (l: LinkDatum) => {
          const srcNode = nodeMap.get(l.source);
          const tgtNode = nodeMap.get(l.target);
          if (!srcNode || !tgtNode) return 'none';
          return activeTracksSet.has(srcNode.track) && activeTracksSet.has(tgtNode.track)
            ? 'block'
            : 'none';
        });
      });
    });

    // ── Initial scroll position ─────────────────────────────────
    // No initial transform needed — native scrolling starts at top-left
  });
}

// ── Utility ───────────────────────────────────────────────────
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
