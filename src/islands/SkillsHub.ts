/**
 * Skills Hub — Interactive D3 visualization for Claude skills registry.
 * Supports: Force-directed bubble chart, Treemap, Table views.
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

const SOURCE_COLORS: Record<string, string> = {
  private: '#26c6da',
  public: '#66bb6a',
  scientific: '#ab47bc',
  local: '#ff7043',
};

const MATURITY_COLORS: Record<string, string> = {
  mature: '#4fc3f7',
  growing: '#66bb6a',
  seedling: '#ffd54f',
  empty: '#ef5350',
};

export function initSkillsHub(container: HTMLElement, registry: Registry): void {
  import('d3').then((d3) => {
    const skills = registry.skills;
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Create SVG
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('position', 'absolute')
      .style('top', '0')
      .style('left', '0');

    const g = svg.append('g');

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on('zoom', (e) => g.attr('transform', e.transform));
    svg.call(zoom);

    // ── Detail panel wiring ──────────────────────────────────────
    const detailPanel = document.getElementById('skill-detail');
    const closeBtn = detailPanel?.querySelector('.close-btn');
    closeBtn?.addEventListener('click', () => {
      if (detailPanel) detailPanel.style.display = 'none';
    });

    function showDetail(s: SkillRecord) {
      if (!detailPanel) return;
      detailPanel.style.display = 'block';
      const el = (id: string) => document.getElementById(id);
      const srcEl = el('detail-source');
      if (srcEl) {
        srcEl.textContent = s.source.toUpperCase();
        srcEl.style.background = SOURCE_COLORS[s.source] || '#888';
      }
      const nameEl = el('detail-name');
      if (nameEl) nameEl.textContent = s.name;
      const idEl = el('detail-id');
      if (idEl) idEl.textContent = s.id;
      const levelEl = el('detail-maturity-level');
      if (levelEl) {
        levelEl.textContent = s.maturity_level;
        levelEl.style.background = MATURITY_COLORS[s.maturity_level] || '#888';
        levelEl.style.color = s.maturity_level === 'seedling' ? '#000' : '#fff';
      }
      const scoreEl = el('detail-score');
      if (scoreEl) scoreEl.textContent = `Score: ${s.maturity_score}/100`;
      const descEl = el('detail-desc');
      if (descEl) descEl.textContent = s.description || '(no description)';

      // Tags
      const tagsSection = el('detail-tags-section');
      const tagsEl = el('detail-tags');
      if (tagsSection && tagsEl) {
        if (s.tags && s.tags.length > 0) {
          tagsSection.style.display = 'block';
          tagsEl.innerHTML = s.tags.map(t =>
            `<span style="display:inline-block;background:rgba(255,255,255,0.1);padding:2px 8px;border-radius:4px;margin:2px;font-size:0.75rem">${t}</span>`
          ).join('');
        } else {
          tagsSection.style.display = 'none';
        }
      }

      // Definition of done
      const dodSection = el('detail-dod-section');
      const dodEl = el('detail-dod');
      if (dodSection && dodEl) {
        if (s.definition_of_done && s.definition_of_done.length > 0) {
          dodSection.style.display = 'block';
          dodEl.innerHTML = s.definition_of_done.map(d =>
            `<div style="font-size:0.75rem;opacity:0.8;margin:2px 0">• ${d}</div>`
          ).join('');
        } else {
          dodSection.style.display = 'none';
        }
      }

      // Maturity bar
      const barEl = el('detail-maturity-bar');
      if (barEl) {
        barEl.style.width = `${s.maturity_score}%`;
        barEl.style.background = MATURITY_COLORS[s.maturity_level] || '#888';
      }
    }

    // ── Force-directed layout ────────────────────────────────────
    let currentView = 'force';

    function renderForce() {
      g.selectAll('*').remove();

      // Cluster centers
      const sources = [...new Set(skills.map(s => s.source))];
      const sourceAngle = new Map(sources.map((s, i) => [s, (i / sources.length) * Math.PI * 2 - Math.PI / 2]));

      type SimNode = SkillRecord & d3.SimulationNodeDatum;
      const simNodes: SimNode[] = skills.map(s => ({ ...s } as SimNode));

      const simulation = d3.forceSimulation(simNodes)
        .force('charge', d3.forceManyBody().strength(-2))
        .force('x', d3.forceX<SimNode>(d => {
          const angle = sourceAngle.get(d.source) || 0;
          return width / 2 + Math.cos(angle) * Math.min(width, height) * 0.25;
        }).strength(0.15))
        .force('y', d3.forceY<SimNode>(d => {
          const angle = sourceAngle.get(d.source) || 0;
          return height / 2 + Math.sin(angle) * Math.min(width, height) * 0.25;
        }).strength(0.15))
        .force('collision', d3.forceCollide<SimNode>(d =>
          radiusScale(d.maturity_score) + 1.5
        ))
        .alpha(0.8)
        .alphaDecay(0.02);

      const radiusScale = (score: number) => 5 + (score / 100) * 20;

      // Source labels
      const labelG = g.append('g').attr('class', 'source-labels');
      sources.forEach(src => {
        const angle = sourceAngle.get(src) || 0;
        const lx = width / 2 + Math.cos(angle) * Math.min(width, height) * 0.38;
        const ly = height / 2 + Math.sin(angle) * Math.min(width, height) * 0.38;
        labelG.append('text')
          .attr('x', lx)
          .attr('y', ly)
          .attr('text-anchor', 'middle')
          .attr('fill', SOURCE_COLORS[src] || '#888')
          .attr('font-size', '14px')
          .attr('font-family', 'Rajdhani, sans-serif')
          .attr('font-weight', '600')
          .attr('letter-spacing', '2px')
          .attr('opacity', 0.7)
          .text(src.toUpperCase());
      });

      // Skill bubbles
      const bubbles = g.append('g').attr('class', 'bubbles')
        .selectAll('g')
        .data(simNodes)
        .join('g')
        .style('cursor', 'pointer')
        .on('click', (_e, d) => showDetail(d));

      bubbles.append('circle')
        .attr('r', d => radiusScale(d.maturity_score))
        .attr('fill', d => MATURITY_COLORS[d.maturity_level] || '#888')
        .attr('opacity', 0.75)
        .attr('stroke', d => SOURCE_COLORS[d.source] || '#888')
        .attr('stroke-width', 1.2);

      // Glow for mature
      bubbles.filter(d => d.maturity_level === 'mature')
        .select('circle')
        .attr('filter', 'url(#glow)');

      // Labels for larger nodes
      bubbles.filter(d => d.maturity_score >= 50)
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('fill', d => d.maturity_level === 'seedling' ? '#333' : '#fff')
        .attr('font-size', d => d.maturity_score >= 75 ? '8px' : '6px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('pointer-events', 'none')
        .text(d => {
          const name = d.name.length > 12 ? d.name.slice(0, 10) + '..' : d.name;
          return name;
        });

      // Tooltip on hover
      bubbles.on('mouseenter', function(_e, d) {
        d3.select(this).select('circle')
          .transition().duration(150)
          .attr('opacity', 1)
          .attr('stroke-width', 2.5);
      }).on('mouseleave', function() {
        d3.select(this).select('circle')
          .transition().duration(150)
          .attr('opacity', 0.75)
          .attr('stroke-width', 1.2);
      });

      // SVG defs for glow
      const defs = svg.append('defs');
      const filter = defs.append('filter').attr('id', 'glow');
      filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
      const merge = filter.append('feMerge');
      merge.append('feMergeNode').attr('in', 'coloredBlur');
      merge.append('feMergeNode').attr('in', 'SourceGraphic');

      simulation.on('tick', () => {
        bubbles.attr('transform', d => `translate(${d.x},${d.y})`);
      });
    }

    // ── Treemap layout ───────────────────────────────────────────
    function renderTreemap() {
      g.selectAll('*').remove();

      const hierarchy = d3.hierarchy({
        name: 'skills',
        children: [...new Set(skills.map(s => s.source))].map(src => ({
          name: src,
          children: skills.filter(s => s.source === src).map(s => ({
            name: s.name,
            value: Math.max(s.maturity_score, 5),
            skill: s,
          })),
        })),
      }).sum(d => (d as any).value || 0);

      const treemap = d3.treemap<any>()
        .size([width - 80, height - 100])
        .padding(3)
        .paddingOuter(8)
        .round(true);

      const root = treemap(hierarchy);
      const offsetX = 40;
      const offsetY = 50;

      // Source group backgrounds
      g.selectAll('.source-bg')
        .data(root.children || [])
        .join('rect')
        .attr('class', 'source-bg')
        .attr('x', d => d.x0 + offsetX)
        .attr('y', d => d.y0 + offsetY)
        .attr('width', d => d.x1 - d.x0)
        .attr('height', d => d.y1 - d.y0)
        .attr('fill', d => SOURCE_COLORS[d.data.name] || '#888')
        .attr('opacity', 0.08)
        .attr('rx', 4);

      // Source labels
      g.selectAll('.source-label')
        .data(root.children || [])
        .join('text')
        .attr('class', 'source-label')
        .attr('x', d => d.x0 + offsetX + 6)
        .attr('y', d => d.y0 + offsetY + 14)
        .attr('fill', d => SOURCE_COLORS[d.data.name] || '#888')
        .attr('font-size', '11px')
        .attr('font-family', 'Rajdhani, sans-serif')
        .attr('font-weight', '600')
        .attr('letter-spacing', '1.5px')
        .text(d => d.data.name.toUpperCase());

      // Skill tiles
      const leaves = root.leaves();
      const tiles = g.selectAll('.tile')
        .data(leaves)
        .join('g')
        .attr('class', 'tile')
        .attr('transform', d => `translate(${d.x0 + offsetX},${d.y0 + offsetY})`)
        .style('cursor', 'pointer')
        .on('click', (_e, d) => showDetail((d.data as any).skill));

      tiles.append('rect')
        .attr('width', d => Math.max(d.x1 - d.x0, 0))
        .attr('height', d => Math.max(d.y1 - d.y0, 0))
        .attr('fill', d => {
          const skill = (d.data as any).skill as SkillRecord;
          return MATURITY_COLORS[skill.maturity_level] || '#888';
        })
        .attr('opacity', 0.65)
        .attr('rx', 2)
        .attr('stroke', 'rgba(255,255,255,0.15)')
        .attr('stroke-width', 0.5);

      // Tile labels
      tiles.filter(d => (d.x1 - d.x0) > 40 && (d.y1 - d.y0) > 16)
        .append('text')
        .attr('x', 4)
        .attr('y', 12)
        .attr('fill', d => {
          const skill = (d.data as any).skill as SkillRecord;
          return skill.maturity_level === 'seedling' ? '#333' : '#fff';
        })
        .attr('font-size', d => (d.x1 - d.x0) > 80 ? '8px' : '6px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('pointer-events', 'none')
        .text(d => {
          const maxLen = Math.floor((d.x1 - d.x0) / 5);
          const name = d.data.name;
          return name.length > maxLen ? name.slice(0, maxLen - 2) + '..' : name;
        });

      // Hover
      tiles.on('mouseenter', function() {
        d3.select(this).select('rect')
          .transition().duration(100)
          .attr('opacity', 1)
          .attr('stroke', 'rgba(255,255,255,0.5)')
          .attr('stroke-width', 1.5);
      }).on('mouseleave', function() {
        d3.select(this).select('rect')
          .transition().duration(100)
          .attr('opacity', 0.65)
          .attr('stroke', 'rgba(255,255,255,0.15)')
          .attr('stroke-width', 0.5);
      });
    }

    // ── Table view ───────────────────────────────────────────────
    function renderTable() {
      g.selectAll('*').remove();

      const sorted = [...skills].sort((a, b) => b.maturity_score - a.maturity_score);
      const rowH = 22;
      const startY = 60;
      const colX = [50, 280, 370, 450, 550, 630];

      // Header
      const headers = ['Skill', 'Source', 'Maturity', 'Score', 'Status', 'Updated'];
      headers.forEach((h, i) => {
        g.append('text')
          .attr('x', colX[i])
          .attr('y', startY - 10)
          .attr('fill', '#8b949e')
          .attr('font-size', '10px')
          .attr('font-family', 'Rajdhani, sans-serif')
          .attr('font-weight', '600')
          .attr('letter-spacing', '1px')
          .text(h.toUpperCase());
      });

      g.append('line')
        .attr('x1', 40).attr('x2', width - 40)
        .attr('y1', startY).attr('y2', startY)
        .attr('stroke', 'rgba(255,255,255,0.1)');

      // Rows
      const rows = g.selectAll('.row')
        .data(sorted.slice(0, Math.floor((height - 120) / rowH)))
        .join('g')
        .attr('class', 'row')
        .attr('transform', (_d, i) => `translate(0,${startY + 8 + i * rowH})`)
        .style('cursor', 'pointer')
        .on('click', (_e, d) => showDetail(d));

      // Hover bg
      rows.insert('rect', ':first-child')
        .attr('x', 40).attr('y', -8)
        .attr('width', width - 80).attr('height', rowH)
        .attr('fill', 'transparent')
        .attr('rx', 3);

      rows.on('mouseenter', function() {
        d3.select(this).select('rect').attr('fill', 'rgba(255,255,255,0.04)');
      }).on('mouseleave', function() {
        d3.select(this).select('rect').attr('fill', 'transparent');
      });

      // Name
      rows.append('text')
        .attr('x', colX[0]).attr('y', 4)
        .attr('fill', '#e6edf3')
        .attr('font-size', '11px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .text(d => d.name.length > 30 ? d.name.slice(0, 28) + '..' : d.name);

      // Source badge
      rows.append('rect')
        .attr('x', colX[1]).attr('y', -7)
        .attr('width', 60).attr('height', 16).attr('rx', 3)
        .attr('fill', d => SOURCE_COLORS[d.source] || '#888')
        .attr('opacity', 0.25);
      rows.append('text')
        .attr('x', colX[1] + 30).attr('y', 4)
        .attr('text-anchor', 'middle')
        .attr('fill', d => SOURCE_COLORS[d.source] || '#888')
        .attr('font-size', '9px')
        .attr('font-family', 'Rajdhani, sans-serif')
        .attr('font-weight', '600')
        .text(d => d.source);

      // Maturity bar
      rows.append('rect')
        .attr('x', colX[2]).attr('y', -4)
        .attr('width', 60).attr('height', 10).attr('rx', 2)
        .attr('fill', 'rgba(255,255,255,0.05)');
      rows.append('rect')
        .attr('x', colX[2]).attr('y', -4)
        .attr('width', d => d.maturity_score / 100 * 60)
        .attr('height', 10).attr('rx', 2)
        .attr('fill', d => MATURITY_COLORS[d.maturity_level] || '#888')
        .attr('opacity', 0.8);

      // Score
      rows.append('text')
        .attr('x', colX[3]).attr('y', 4)
        .attr('fill', '#8b949e')
        .attr('font-size', '10px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .text(d => `${d.maturity_score}`);

      // Status
      rows.append('text')
        .attr('x', colX[4]).attr('y', 4)
        .attr('fill', d => d.status === 'active' ? '#66bb6a' : '#8b949e')
        .attr('font-size', '10px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .text(d => d.status);

      // Updated
      rows.append('text')
        .attr('x', colX[5]).attr('y', 4)
        .attr('fill', '#8b949e')
        .attr('font-size', '9px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .text(d => d.last_modified);
    }

    // ── View switching ───────────────────────────────────────────
    const viewBtns = container.querySelectorAll('.icon-strip-btn[data-view]');
    viewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        viewBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const view = btn.getAttribute('data-view') || 'force';
        currentView = view;
        svg.select('defs').remove(); // Clean up filters
        if (view === 'treemap') renderTreemap();
        else if (view === 'table') renderTable();
        else renderForce();
      });
    });

    // Initial render
    renderForce();
  });
}
