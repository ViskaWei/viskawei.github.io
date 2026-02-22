import type { SkillRecord } from './types';
import { getProgressPercent, getProgressLevel, relativeTime } from './types';

interface Props {
  skill: SkillRecord;
  onClick?: () => void;
}

export default function SkillCard({ skill, onClick }: Props) {
  const pct = getProgressPercent(skill);
  const level = getProgressLevel(pct);
  const gateEntries = Object.entries(skill.gates);

  return (
    <div className="skill-card" onClick={onClick} role="button" tabIndex={0}>
      <div className="skill-card-header">
        <span className={`status-chip status-chip--${skill.status}`}>
          {skill.status.replace('_', ' ')}
        </span>
        <span className="skill-card-time">{relativeTime(skill.last_modified)}</span>
      </div>
      <div className="skill-card-title">{skill.name}</div>
      {skill.description && (
        <div className="skill-card-desc">
          {skill.description.length > 80
            ? skill.description.slice(0, 80) + '...'
            : skill.description}
        </div>
      )}
      <div className="skill-card-footer">
        <div className="progress-bar">
          <div
            className={`progress-bar-fill progress-bar-fill--${level}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="gate-dots">
          {gateEntries.map(([key, val]) => (
            <span
              key={key}
              className={`gate-dot gate-dot--${val}`}
              title={`${key}: ${val}`}
            />
          ))}
        </div>
      </div>
      {skill.tags.length > 0 && (
        <div className="skill-card-tags">
          {skill.tags.slice(0, 3).map(tag => (
            <span key={tag} className="skill-card-tag">{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}
