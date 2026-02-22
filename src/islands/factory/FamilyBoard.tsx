import { useState, useMemo } from 'react';
import type { SkillRecord } from './types';
import SkillCard from './SkillCard';
import SkillDrawer from './SkillDrawer';

interface Props {
  skills: SkillRecord[];
}

interface Family {
  name: string;
  displayName: string;
  items: SkillRecord[];
  accent: string;
}

const FAMILY_ACCENTS = [
  '#2563EB', '#7c5cbf', '#059669', '#D97706', '#DC2626',
  '#0891B2', '#7C3AED', '#DB2777', '#65A30D', '#EA580C',
];

function buildFamilies(skills: SkillRecord[]): Family[] {
  const ids = skills.map(s => s.id);

  // Step 1: Find root families — IDs where another ID starts with root + "-"
  const roots: string[] = [];
  for (const id of ids) {
    if (ids.some(other => other !== id && other.startsWith(id + '-'))) {
      roots.push(id);
    }
  }
  // Sort longest-first to avoid partial matches
  roots.sort((a, b) => b.length - a.length);

  // Step 2: Assign each skill to a family
  const familyMap: Record<string, SkillRecord[]> = {};

  for (const skill of skills) {
    let assigned = false;

    // Check: is this skill a root itself, or starts with root + "-"?
    for (const root of roots) {
      if (skill.id === root || skill.id.startsWith(root + '-')) {
        if (!familyMap[root]) familyMap[root] = [];
        familyMap[root].push(skill);
        assigned = true;
        break;
      }
    }

    // Check: does skill ID contain a root as a word? (e.g. "audit-flowchart")
    if (!assigned) {
      for (const root of roots) {
        if (skill.id.includes('-' + root) || skill.id.includes(root + '-')) {
          if (!familyMap[root]) familyMap[root] = [];
          familyMap[root].push(skill);
          assigned = true;
          break;
        }
      }
    }

    // Fallback: Independent
    if (!assigned) {
      if (!familyMap['__independent__']) familyMap['__independent__'] = [];
      familyMap['__independent__'].push(skill);
    }
  }

  // Step 3: Build sorted family array (largest first)
  const families: Family[] = [];
  const sortedKeys = Object.keys(familyMap)
    .filter(k => k !== '__independent__')
    .sort((a, b) => (familyMap[b]?.length ?? 0) - (familyMap[a]?.length ?? 0));

  for (let i = 0; i < sortedKeys.length; i++) {
    const key = sortedKeys[i];
    families.push({
      name: key,
      displayName: key.charAt(0).toUpperCase() + key.slice(1),
      items: familyMap[key],
      accent: FAMILY_ACCENTS[i % FAMILY_ACCENTS.length],
    });
  }

  // Independent always last
  if (familyMap['__independent__']?.length) {
    families.push({
      name: '__independent__',
      displayName: 'Independent',
      items: familyMap['__independent__'],
      accent: '#6B7280',
    });
  }

  return families;
}

export default function FamilyBoard({ skills }: Props) {
  const [selected, setSelected] = useState<SkillRecord | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    __independent__: true,
  });

  const families = useMemo(() => buildFamilies(skills), [skills]);

  const toggle = (name: string) =>
    setCollapsed(prev => ({ ...prev, [name]: !prev[name] }));

  return (
    <>
      <div className="family-board">
        {families.map(family => (
          <div key={family.name} className="family-group">
            <div
              className="family-header"
              onClick={() => toggle(family.name)}
              role="button"
              tabIndex={0}
            >
              <div className="family-header-left">
                <span className="tunnel-accent" style={{ background: family.accent }} />
                <span className="family-name">{family.displayName}</span>
                <span className="family-count" style={{ color: family.accent }}>
                  {family.items.length}
                </span>
              </div>
              <span className="family-toggle">
                {collapsed[family.name] ? '+' : '\u2212'}
              </span>
            </div>
            {!collapsed[family.name] && (
              <div className="tunnel-track">
                {family.items.map(skill => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    onClick={() => setSelected(skill)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <SkillDrawer skill={selected} onClose={() => setSelected(null)} />
    </>
  );
}
