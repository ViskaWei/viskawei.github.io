import type { SkillRecord } from './types';
import { getProgressPercent, getProgressLevel } from './types';

interface Props {
  skill: SkillRecord;
}

const GATE_ICONS: Record<string, string> = {
  readme: 'description',
  examples: 'school',
  tests: 'science',
  references: 'library_books',
  standard_compliance: 'verified',
};

export default function GatePanel({ skill }: Props) {
  const pct = getProgressPercent(skill);
  const level = getProgressLevel(pct);
  const gateEntries = Object.entries(skill.gates);
  const hasBlocker = gateEntries.some(([, v]) => v === 'fail');

  return (
    <div className="gate-panel">
      {/* Progress */}
      <div className="gate-panel-section">
        <h4 className="gate-panel-heading">Progress</h4>
        <div className="gate-panel-progress">
          <div className="progress-bar" style={{ height: '8px' }}>
            <div
              className={`progress-bar-fill progress-bar-fill--${level}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="gate-panel-pct">{pct}%</span>
        </div>
      </div>

      {/* Gates Grid */}
      <div className="gate-panel-section">
        <h4 className="gate-panel-heading">
          Quality Gates
          {hasBlocker && <span className="gate-blocker-warn">Blocked</span>}
        </h4>
        <div className="gate-grid">
          {gateEntries.map(([key, val]) => (
            <div key={key} className={`gate-badge gate-badge--${val}`}>
              <span className="gate-badge-icon">
                {val === 'pass' ? '\u2713' : val === 'fail' ? '\u2717' : '\u2014'}
              </span>
              <span className="gate-badge-label">{key.replace(/_/g, ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Definition of Done */}
      {skill.definition_of_done && skill.definition_of_done.length > 0 && (
        <div className="gate-panel-section">
          <h4 className="gate-panel-heading">Definition of Done</h4>
          <ul className="checklist">
            {skill.definition_of_done.map((item, i) => {
              const isDone = skill.todos.some(t => t.text === item && t.done);
              return (
                <li key={i} className="checklist-item">
                  <span className={isDone ? 'checklist-check' : 'checklist-uncheck'}>
                    {isDone ? '\u2713' : '\u25CB'}
                  </span>
                  {item}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Body Checklist */}
      {skill.todos && skill.todos.length > 0 && (
        <div className="gate-panel-section" id="todo">
          <h4 className="gate-panel-heading">
            Checklist ({skill.checklist_done}/{skill.checklist_total})
          </h4>
          <ul className="checklist">
            {skill.todos.map((todo, i) => (
              <li key={i} className="checklist-item">
                <span className={todo.done ? 'checklist-check' : 'checklist-uncheck'}>
                  {todo.done ? '\u2713' : '\u25CB'}
                </span>
                <span className="checklist-section">{todo.section}</span>
                {todo.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Workflow Phases */}
      {skill.workflow_phases && skill.workflow_phases.length > 0 && (
        <div className="gate-panel-section">
          <h4 className="gate-panel-heading">Workflow Phases</h4>
          <ol className="workflow-phases">
            {skill.workflow_phases.map((phase, i) => (
              <li key={i} className="workflow-phase">{phase}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
