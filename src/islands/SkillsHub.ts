/**
 * Skills Hub — Interactive D3 visualization with treemap + force-directed views.
 * Renders Claude AI skills from the skills registry with maturity-based coloring
 * and source-based clustering.
 */

interface SkillEntry {
  id: string;
  name: string;
  description: string | null;
  source: string;
  version: string | null;
  maturity_score: number;
  maturity_level: string;
  status: string;
  last_modified: string;
  has_skill_md: boolean;
  word_count: number;
  has_scripts: boolean;
  has_references: boolean;
  has_assets: boolean;
  file_count: number;
  allowed_tools: string[] | null;
  has_hooks: boolean;
  tags: string[];
  category: string | null;
  progress: number | null;
  definition_of_done: string[] | null;
}

interface SkillsRegistry {
  generated_at: string;
  total_skills: number;
  summary: {
    by_source: Record<string, number>;
    by_maturity: Record<string, number>;
    by_status: Record<string, number>;
  };
  skills: SkillEntry[];
}

// ── Color schemes ────────────────────────────────────────────────

const MATURITY_COLORS: Record<string, string> = {
  mature: '#4fc3f7',
  growing: '#66bb6a',
  seedling: '#ffd54f',
  empty: '#ef5350',
};

const SOURCE_COLORS: Record<string, string> = {
  private: '#ab47bc',
  public: '#26c6da',
  scientific: '#66bb6a',
  local: '#ff7043',
};

function maturityColor(level: string): string {
  return MATURITY_COLORS[level] || '#888';
}

function sourceColor(source: string): string {
  return SOURCE_COLORS[source] || '#888';
}

// ── Main entry point ─────────────────────────────────────────────

export async function initSkillsHub(
  container: HTMLElement,
  registry: SkillsRegistry,
): Promise<void> {
  const d3 = await import('d3');

  // ── Update HUD counters ──────────────────────────────────────
  const setCount = (id: string, val: number) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(val);
  };

  setCount('total-count', registry.total_skills);
  setCount('mature-count', registry.summary.by_maturity.mature || 0);
  setCount('growing-count', registry.summary.by_maturity.growing || 0);
  setCount('seedling-count', registry.summary.by_maturity.seedling || 0);
  setCount('empty-count', registry.summary.by_maturity.empty || 0);

  // ── SVG setup ────────────────────────────────────────────────
  const rect = container.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  const svg = d3.select(container)
    .append('svg')
    .attr('class', 'galaxy-svg')
    .attr('width', width)
    .attr('height', height);

  const defs = svg.append('defs');

  // Glow filter for nodes
  const glowFilter = defs.append('filter')
    .attr('id', 'skills-glow')
    .attr('x', '-100%').attr('y', '-100%')
    .attr('width', '300%').attr('height', '300%');
  glowFilter.append('feGaussianBlur')
    .attr('in', 'SourceGraphic').attr('stdDeviation', '4').attr('result', 'blur');
  const glowMerge = glowFilter.append('feMerge');
  glowMerge.append('feMergeNode').attr('in', 'blur');
  glowMerge.append('feMergeNode').attr('in', 'SourceGraphic');

  const mainGroup = svg.append('g').attr('class', 'skills-main-group');

  // ── State ────────────────────────────────────────────────────
  let currentView: 'treemap' | 'force' = 'treemap';
  let currentFilter = 'all';
  let activeSkills = [...registry.skills];

  // ── Detail panel references ──────────────────────────────────
  const detailPanel = document.getElementById('skill-detail') as HTMLElement | null;
  const skillNameEl = document.getElementById('skill-name');
  const skillSourceEl = document.getElementById('skill-source');
  const skillMaturityEl = document.getElementById('skill-maturity');
  const skillVersionEl = document.getElementById('skill-version');
  const skillDescEl = document.getElementById('skill-description');
  const skillTagsSection = document.getElementById('skill-tags-section');
  const skillTagsEl = document.getElementById('skill-tags');
  const skillToolsSection = document.getElementById('skill-tools-section');
  const skillToolsEl = document.getElementById('skill-tools');
  const skillMaturityBar = document.getElementById('skill-maturity-bar');
  const skillScoreEl = document.getElementById('skill-score');

  function showDetail(skill: SkillEntry) {
    if (!detailPanel) return;

    const color = maturityColor(skill.maturity_level);
    detailPanel.style.setProperty('--detail-color', color);

    if (skillNameEl) skillNameEl.textContent = skill.name;
    if (skillSourceEl) skillSourceEl.textContent = `> ${skill.source.toUpperCase()}`;
    if (skillMaturityEl) {
      skillMaturityEl.textContent = skill.maturity_level;
      skillMaturityEl.style.background = color;
      skillMaturityEl.style.color = '#0a0a14';
    }
    if (skillVersionEl) skillVersionEl.textContent = skill.version ? `v${skill.version}` : '';
    if (skillDescEl) skillDescEl.textContent = skill.description || '';

    // Tags
    if (skillTagsSection && skillTagsEl) {
      if (skill.tags && skill.tags.length > 0) {
        skillTagsSection.style.display = 'block';
        skillTagsEl.innerHTML = '';
        for (const tag of skill.tags) {
          const chip = document.createElement('div');
          chip.className = 'detail-prereq-item';
          chip.textContent = tag;
          skillTagsEl.appendChild(chip);
        }
      } else {
        skillTagsSection.style.display = 'none';
      }
    }

    // Tools
    if (skillToolsSection && skillToolsEl) {
      if (skill.allowed_tools && skill.allowed_tools.length > 0) {
        skillToolsSection.style.display = 'block';
        skillToolsEl.innerHTML = '';
        for (const tool of skill.allowed_tools) {
          const chip = document.createElement('div');
          chip.className = 'detail-related-item';
          chip.textContent = tool;
          skillToolsEl.appendChild(chip);
        }
      } else {
        skillToolsSection.style.display = 'none';
      }
    }

    // Maturity bar
    if (skillMaturityBar) {
      skillMaturityBar.style.width = `${skill.maturity_score}%`;
      skillMaturityBar.style.background = color;
    }
    if (skillScoreEl) {
      skillScoreEl.textContent = `${skill.maturity_score}%`;
    }

    detailPanel.classList.add('visible');
  }

  function hideDetail() {
    if (detailPanel) detailPanel.classList.remove('visible');
  }

  // Close button
  detailPanel?.querySelector('.close-btn')?.addEventListener('click', hideDetail);

  // ── Zoom behavior ────────────────────────────────────────────
  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.5, 4])
    .on('zoom', (event) => {
      mainGroup.attr('transform', event.transform.toString());
    });

  svg.call(zoom);

  // ── Treemap View ─────────────────────────────────────────────

  function renderTreemap(skills: SkillEntry[]) {
    mainGroup.selectAll('*').remove();

    // Reset zoom for treemap
    svg.call(zoom.transform, d3.zoomIdentity);

    if (skills.length === 0) {
      mainGroup.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', 'rgba(255,255,255,0.3)')
        .attr('font-size', '14px')
        .text('No skills match the current filter.');
      return;
    }

    // Build hierarchy: root -> sources -> skills
    const sourceGroups = new Map<string, SkillEntry[]>();
    for (const s of skills) {
      const group = sourceGroups.get(s.source) || [];
      group.push(s);
      sourceGroups.set(s.source, group);
    }

    const hierarchyData = {
      name: 'root',
      children: Array.from(sourceGroups.entries()).map(([source, entries]) => ({
        name: source,
        children: entries.map(e => ({
          name: e.name,
          value: Math.max(10, e.maturity_score),
          skill: e,
        })),
      })),
    };

    const root = d3.hierarchy(hierarchyData)
      .sum((d: any) => d.value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const margin = 40;
    const treemapLayout = d3.treemap<any>()
      .size([width - margin * 2, height - margin * 2])
      .padding(4)
      .round(true);

    treemapLayout(root);

    const leaves = root.leaves();

    // Draw rectangles
    const cells = mainGroup.selectAll('.skill-cell')
      .data(leaves)
      .enter()
      .append('g')
      .attr('class', 'skill-cell')
      .attr('transform', (d: any) => `translate(${d.x0 + margin},${d.y0 + margin})`);

    cells.append('rect')
      .attr('width', (d: any) => Math.max(0, d.x1 - d.x0))
      .attr('height', (d: any) => Math.max(0, d.y1 - d.y0))
      .attr('fill', (d: any) => {
        const skill = d.data.skill as SkillEntry | undefined;
        return skill ? maturityColor(skill.maturity_level) : '#333';
      })
      .attr('fill-opacity', 0.2)
      .attr('stroke', (d: any) => {
        const skill = d.data.skill as SkillEntry | undefined;
        return skill ? maturityColor(skill.maturity_level) : '#444';
      })
      .attr('stroke-opacity', 0.5)
      .attr('stroke-width', 1)
      .attr('rx', 4)
      .attr('ry', 4);

    // Labels
    cells.append('text')
      .attr('x', 6)
      .attr('y', 16)
      .attr('fill', 'rgba(255,255,255,0.85)')
      .attr('font-size', (d: any) => {
        const w = d.x1 - d.x0;
        return w < 80 ? '8px' : w < 140 ? '10px' : '12px';
      })
      .attr('font-family', "'Rajdhani', 'Inter', sans-serif")
      .attr('font-weight', '600')
      .text((d: any) => {
        const w = d.x1 - d.x0;
        const name = d.data.name;
        const maxChars = Math.floor(w / 7);
        return name.length > maxChars ? name.slice(0, maxChars - 1) + '\u2026' : name;
      });

    // Source label (smaller)
    cells.append('text')
      .attr('x', 6)
      .attr('y', 30)
      .attr('fill', (d: any) => {
        const skill = d.data.skill as SkillEntry | undefined;
        return skill ? sourceColor(skill.source) : 'rgba(255,255,255,0.3)';
      })
      .attr('font-size', '8px')
      .attr('font-family', "'JetBrains Mono', monospace")
      .attr('letter-spacing', '0.05em')
      .text((d: any) => {
        const h = d.y1 - d.y0;
        if (h < 40) return '';
        const skill = d.data.skill as SkillEntry | undefined;
        return skill ? skill.source.toUpperCase() : '';
      });

    // Maturity score
    cells.append('text')
      .attr('x', (d: any) => d.x1 - d.x0 - 6)
      .attr('y', 16)
      .attr('text-anchor', 'end')
      .attr('fill', 'rgba(255,255,255,0.4)')
      .attr('font-size', '9px')
      .attr('font-family', "'JetBrains Mono', monospace")
      .text((d: any) => {
        const w = d.x1 - d.x0;
        if (w < 60) return '';
        const skill = d.data.skill as SkillEntry | undefined;
        return skill ? `${skill.maturity_score}%` : '';
      });

    // Interactions
    cells.on('mouseenter', function(this: SVGGElement, _event: MouseEvent, d: any) {
      const skill = d.data.skill as SkillEntry | undefined;
      if (!skill) return;
      d3.select(this).select('rect')
        .attr('fill-opacity', 0.4)
        .attr('stroke-opacity', 1)
        .attr('stroke-width', 2);
      showDetail(skill);
    });

    cells.on('mouseleave', function(this: SVGGElement) {
      d3.select(this).select('rect')
        .attr('fill-opacity', 0.2)
        .attr('stroke-opacity', 0.5)
        .attr('stroke-width', 1);
    });

    cells.on('click', (_event: MouseEvent, d: any) => {
      const skill = d.data.skill as SkillEntry | undefined;
      if (skill) showDetail(skill);
    });
  }

  // ── Force-directed View ──────────────────────────────────────

  function renderForce(skills: SkillEntry[]) {
    mainGroup.selectAll('*').remove();

    // Reset zoom for force view
    svg.call(zoom.transform, d3.zoomIdentity);

    if (skills.length === 0) {
      mainGroup.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', 'rgba(255,255,255,0.3)')
        .attr('font-size', '14px')
        .text('No skills match the current filter.');
      return;
    }

    // Compute cluster centers by source
    const sources = Array.from(new Set(skills.map(s => s.source)));
    const sourceCenters = new Map<string, { x: number; y: number }>();
    sources.forEach((src, i) => {
      const angle = (Math.PI * 2 * i) / sources.length - Math.PI / 2;
      const dist = Math.min(width, height) * 0.2;
      sourceCenters.set(src, {
        x: width / 2 + Math.cos(angle) * dist,
        y: height / 2 + Math.sin(angle) * dist,
      });
    });

    // Build simulation nodes
    interface SimNode extends d3.SimulationNodeDatum {
      skill: SkillEntry;
      r: number;
    }

    const simNodes: SimNode[] = skills.map(s => ({
      skill: s,
      r: Math.max(8, s.maturity_score / 4),
      x: (sourceCenters.get(s.source)?.x || width / 2) + (Math.random() - 0.5) * 50,
      y: (sourceCenters.get(s.source)?.y || height / 2) + (Math.random() - 0.5) * 50,
    }));

    const simulation = d3.forceSimulation(simNodes)
      .force('charge', d3.forceManyBody().strength(-80))
      .force('collide', d3.forceCollide<SimNode>((d) => d.r + 4))
      .force('x', d3.forceX<SimNode>((d) => sourceCenters.get(d.skill.source)?.x || width / 2).strength(0.3))
      .force('y', d3.forceY<SimNode>((d) => sourceCenters.get(d.skill.source)?.y || height / 2).strength(0.3))
      .stop();

    // Run simulation
    for (let i = 0; i < 200; i++) simulation.tick();

    // Source labels
    for (const [src, center] of sourceCenters) {
      mainGroup.append('text')
        .attr('class', 'cluster-label-text')
        .attr('x', center.x)
        .attr('y', center.y - Math.min(width, height) * 0.15)
        .attr('text-anchor', 'middle')
        .attr('fill', sourceColor(src))
        .attr('font-size', '11px')
        .attr('font-weight', '400')
        .attr('letter-spacing', '0.15em')
        .attr('opacity', 0.5)
        .text(src.toUpperCase());
    }

    // Draw nodes
    const nodeGroups = mainGroup.selectAll('.skill-node')
      .data(simNodes)
      .enter()
      .append('g')
      .attr('class', 'skill-node')
      .attr('transform', (d: SimNode) => `translate(${d.x},${d.y})`);

    // Glow halo
    nodeGroups.append('circle')
      .attr('r', (d: SimNode) => d.r * 2)
      .attr('fill', (d: SimNode) => maturityColor(d.skill.maturity_level))
      .attr('fill-opacity', 0.05);

    // Main circle
    nodeGroups.append('circle')
      .attr('class', 'skill-circle')
      .attr('r', (d: SimNode) => d.r)
      .attr('fill', (d: SimNode) => maturityColor(d.skill.maturity_level))
      .attr('fill-opacity', 0.6)
      .attr('stroke', (d: SimNode) => maturityColor(d.skill.maturity_level))
      .attr('stroke-opacity', 0.8)
      .attr('stroke-width', 1.5)
      .style('filter', 'url(#skills-glow)');

    // White center dot
    nodeGroups.append('circle')
      .attr('r', (d: SimNode) => Math.max(2, d.r * 0.3))
      .attr('fill', '#ffffff')
      .attr('opacity', 0.7);

    // Labels
    nodeGroups.append('text')
      .attr('y', (d: SimNode) => d.r + 14)
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255,255,255,0.7)')
      .attr('font-size', '9px')
      .attr('font-family', "'Rajdhani', 'Inter', sans-serif")
      .attr('font-weight', '600')
      .text((d: SimNode) => {
        const name = d.skill.name;
        return name.length > 16 ? name.slice(0, 14) + '\u2026' : name;
      });

    // Interactions
    nodeGroups.on('mouseenter', function(this: SVGGElement, _event: MouseEvent, d: SimNode) {
      d3.select(this).select('.skill-circle')
        .attr('fill-opacity', 0.9)
        .attr('stroke-width', 2.5);
      showDetail(d.skill);
    });

    nodeGroups.on('mouseleave', function(this: SVGGElement) {
      d3.select(this).select('.skill-circle')
        .attr('fill-opacity', 0.6)
        .attr('stroke-width', 1.5);
    });

    nodeGroups.on('click', (_event: MouseEvent, d: SimNode) => {
      showDetail(d.skill);
    });
  }

  // ── Render the active view ───────────────────────────────────

  function render() {
    if (currentView === 'treemap') {
      renderTreemap(activeSkills);
    } else {
      renderForce(activeSkills);
    }
  }

  // ── Initial render ───────────────────────────────────────────
  render();

  // ── View toggle buttons ──────────────────────────────────────
  const btnTreemap = document.getElementById('btn-treemap');
  const btnForce = document.getElementById('btn-force');
  const viewToggle = document.getElementById('view-toggle');

  btnTreemap?.addEventListener('click', () => {
    if (currentView === 'treemap') return;
    currentView = 'treemap';
    btnTreemap.classList.add('active');
    btnForce?.classList.remove('active');
    render();
  });

  btnForce?.addEventListener('click', () => {
    if (currentView === 'force') return;
    currentView = 'force';
    btnForce.classList.add('active');
    btnTreemap?.classList.remove('active');
    render();
  });

  viewToggle?.addEventListener('click', () => {
    if (currentView === 'treemap') {
      currentView = 'force';
      btnForce?.classList.add('active');
      btnTreemap?.classList.remove('active');
    } else {
      currentView = 'treemap';
      btnTreemap?.classList.add('active');
      btnForce?.classList.remove('active');
    }
    render();
  });

  // ── Source filter ────────────────────────────────────────────
  const filterBtns = container.querySelectorAll('.icon-strip-btn[data-source]');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const source = (btn as HTMLElement).dataset.source!;
      currentFilter = source;

      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      if (source === 'all') {
        activeSkills = [...registry.skills];
      } else {
        activeSkills = registry.skills.filter(s => s.source === source);
      }

      hideDetail();
      render();
    });
  });

  // ── Zoom controls ────────────────────────────────────────────
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
    svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
  });

  // ── Click on SVG background to close detail ──────────────────
  svg.on('click', () => {
    hideDetail();
  });

  // ── Resize handler ───────────────────────────────────────────
  window.addEventListener('resize', () => {
    const newRect = container.getBoundingClientRect();
    const nw = newRect.width;
    const nh = newRect.height;
    svg.attr('width', nw).attr('height', nh);
    // Re-render would need full recalculation; skip for now
  });
}
