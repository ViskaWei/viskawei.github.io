import { useEffect, useCallback } from 'react';
import type { SkillRecord } from './types';
import { getProgressPercent, getProgressLevel, relativeTime } from './types';

interface Props {
  skill: SkillRecord | null;
  onClose: () => void;
}

export default function SkillDrawer({ skill, onClose }: Props) {
  const isOpen = skill !== null;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  const pct = skill ? getProgressPercent(skill) : 0;
  const level = skill ? getProgressLevel(pct) : 'low';

  return (
    <>
      <div
        className={`skill-drawer-overlay ${isOpen ? 'skill-drawer-overlay--open' : ''}`}
        onClick={onClose}
      />
      <div className={`skill-drawer ${isOpen ? 'skill-drawer--open' : ''}`}>
        {skill && (
          <>
            <button className="drawer-close-btn" onClick={onClose} aria-label="Close">
              &times;
            </button>

            <span className={`status-chip status-chip--${skill.status}`}>
              {skill.status.replace('_', ' ')}
            </span>

            <h2 className="drawer-title">{skill.name}</h2>
            <div className="drawer-id">{skill.id}</div>
            <div className="drawer-meta">
              <span>Source: {skill.source}</span>
              <span>Updated: {relativeTime(skill.last_modified)}</span>
            </div>

            {skill.description && (
              <p className="drawer-desc">{skill.description}</p>
            )}

            {/* Progress */}
            <div className="drawer-section">
              <div className="drawer-section-label">Progress</div>
              <div className="progress-bar" style={{ height: '6px' }}>
                <div
                  className={`progress-bar-fill progress-bar-fill--${level}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="drawer-pct">{pct}%</div>
            </div>

            {/* Gates */}
            <div className="drawer-section">
              <div className="drawer-section-label">Gates</div>
              <div className="gate-dots" style={{ gap: '6px' }}>
                {Object.entries(skill.gates).map(([key, val]) => (
                  <span
                    key={key}
                    className={`gate-dot gate-dot--${val}`}
                    title={`${key}: ${val}`}
                    style={{ width: '12px', height: '12px' }}
                  />
                ))}
              </div>
            </div>

            {/* Standards */}
            {skill.standards.length > 0 && (
              <div className="drawer-section">
                <div className="drawer-section-label">Standards</div>
                <div className="drawer-badges">
                  {skill.standards.map(std => (
                    <a key={std} href={`/standards/${std}`} className="standard-usage-badge">
                      {std}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {skill.tags.length > 0 && (
              <div className="drawer-section">
                <div className="drawer-section-label">Tags</div>
                <div className="drawer-badges">
                  {skill.tags.map(tag => (
                    <span key={tag} className="skill-card-tag">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            <a href={`/skills/${skill.id}`} className="drawer-detail-link">
              View Details &rarr;
            </a>
          </>
        )}
      </div>
    </>
  );
}
