// ── Skills Factory Data Types ──────────────────────────────────
// Matches manifest JSON schemas from build_manifest.ts

export interface SkillRecord {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'in_progress' | 'done' | 'deprecated' | 'active' | 'stub';
  visibility: 'public' | 'private';
  source: 'private' | 'public' | 'scientific' | 'local';
  source_path: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  standards: string[];
  inputs: string[];
  outputs: string[];
  version: string | null;
  allowed_tools: string[] | null;
  maturity_score: number;
  maturity_level: string;
  progress: { done: number; total: number };
  gates: Record<string, 'pass' | 'fail' | 'unknown'>;
  definition_of_done: string[];
  todos: TodoItem[];
  todo_count: number;
  workflow_phases: string[];
  reference_files: { name: string; title: string; word_count: number }[];
  reference_html: string;
  word_count: number;
  has_skill_md: boolean;
  file_count: number;
  has_scripts: boolean;
  has_references: boolean;
  has_assets: boolean;
  last_modified: string;
  category: string | null;
  overrides_applied: boolean;
  checklist_done: number;
  checklist_total: number;
}

export interface TodoItem {
  skill_id: string;
  skill_name: string;
  text: string;
  section: string;
  skill_status: string;
  skill_updated_at: string;
  priority: 'high' | 'medium' | 'low';
  done?: boolean;
}

export interface StandardRecord {
  id: string;
  title: string;
  category: string;
  version: string;
  source_skill: string | null;
  preview_type: string | null;
  preview_content: string;
  body_md: string;
  word_count: number;
  skill_count: number;
  skills_using: string[];
}

export interface SkillsIndex {
  generated_at: string;
  version: string;
  summary: {
    total: number;
    by_source: Record<string, number>;
    by_status: Record<string, number>;
    by_maturity: Record<string, number>;
    average_maturity_score: number;
  };
  skills: SkillRecord[];
}

export interface TodoAggregate {
  generated_at: string;
  total: number;
  items: TodoItem[];
}

// ── Status helpers ──

export const STATUS_COLUMNS = ['draft', 'in_progress', 'active', 'done', 'deprecated'] as const;

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  in_progress: 'In Progress',
  active: 'Active',
  done: 'Done',
  deprecated: 'Deprecated',
  stub: 'Stub',
};

export const STATUS_COLORS: Record<string, string> = {
  draft: '#6B7280',
  in_progress: '#2563EB',
  active: '#2563EB',
  done: '#059669',
  deprecated: '#DC2626',
  stub: '#9CA3AF',
};

export function getProgressPercent(skill: SkillRecord): number {
  const { done, total } = skill.progress;
  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}

export function getProgressLevel(pct: number): 'low' | 'mid' | 'high' {
  if (pct < 33) return 'low';
  if (pct < 66) return 'mid';
  return 'high';
}

export function getGateCount(skill: SkillRecord): { pass: number; fail: number; total: number } {
  const entries = Object.values(skill.gates);
  return {
    pass: entries.filter(v => v === 'pass').length,
    fail: entries.filter(v => v === 'fail').length,
    total: entries.length,
  };
}

export function relativeTime(dateStr: string): string {
  if (!dateStr || dateStr === 'unknown') return 'unknown';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const days = Math.floor((now - then) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}
