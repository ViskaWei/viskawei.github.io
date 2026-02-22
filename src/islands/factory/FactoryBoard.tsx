import { useState, useMemo } from 'react';
import type { SkillRecord } from './types';
import SkillCard from './SkillCard';
import SkillDrawer from './SkillDrawer';

interface Props {
  skills: SkillRecord[];
}

interface Tunnel {
  key: string;
  label: string;
  sublabel: string;
  items: SkillRecord[];
  accent: string;
}

function getTimeBucket(dateStr: string): string {
  if (!dateStr || dateStr === 'unknown') return 'archive';
  try {
    const now = new Date();
    const d = new Date(dateStr);
    const days = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 7) return 'this_week';
    if (days <= 14) return 'last_week';
    if (days <= 30) return 'this_month';
    if (days <= 60) return 'last_month';
    return 'archive';
  } catch {
    return 'archive';
  }
}

const TUNNEL_DEFS = [
  { key: 'this_week',  label: 'This Week',  sublabel: 'Active now',          accent: '#2563EB' },
  { key: 'last_week',  label: 'Last Week',  sublabel: '7–14 days ago',       accent: '#7c5cbf' },
  { key: 'this_month', label: 'This Month', sublabel: '2–4 weeks ago',       accent: '#059669' },
  { key: 'last_month', label: 'Last Month', sublabel: '1–2 months ago',      accent: '#D97706' },
  { key: 'archive',    label: 'Archive',    sublabel: 'Older & undated',     accent: '#6B7280' },
];

export default function FactoryBoard({ skills }: Props) {
  const [selected, setSelected] = useState<SkillRecord | null>(null);

  const tunnels: Tunnel[] = useMemo(() => {
    // Bucket skills by time
    const buckets: Record<string, SkillRecord[]> = {};
    for (const def of TUNNEL_DEFS) buckets[def.key] = [];

    for (const skill of skills) {
      const bucket = getTimeBucket(skill.last_modified);
      buckets[bucket].push(skill);
    }

    // Sort within each bucket: newest first
    for (const key of Object.keys(buckets)) {
      buckets[key].sort((a, b) => {
        const da = a.last_modified || '';
        const db = b.last_modified || '';
        return db.localeCompare(da);
      });
    }

    return TUNNEL_DEFS
      .map(def => ({
        ...def,
        items: buckets[def.key],
      }))
      .filter(t => t.items.length > 0);
  }, [skills]);

  return (
    <>
      <div className="tunnel-board">
        {tunnels.map((tunnel, i) => (
          <div key={tunnel.key} className={`tunnel ${i === 0 ? 'tunnel--highlight' : ''}`}>
            <div className="tunnel-header">
              <div className="tunnel-header-left">
                <span className="tunnel-accent" style={{ background: tunnel.accent }} />
                <span className="tunnel-label">{tunnel.label}</span>
                <span className="tunnel-sublabel">{tunnel.sublabel}</span>
              </div>
              <span className="tunnel-count" style={{ color: tunnel.accent }}>
                {tunnel.items.length}
              </span>
            </div>
            <div className="tunnel-track">
              {tunnel.items.map(skill => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  onClick={() => setSelected(skill)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <SkillDrawer skill={selected} onClose={() => setSelected(null)} />
    </>
  );
}
