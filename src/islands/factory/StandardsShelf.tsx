import type { StandardRecord } from './types';

interface Props {
  standards: StandardRecord[];
}

export default function StandardsShelf({ standards }: Props) {
  if (standards.length === 0) {
    return (
      <div className="standards-shelf">
        <div className="todo-empty">No standards defined yet</div>
      </div>
    );
  }

  return (
    <div className="standards-shelf">
      {standards.map(std => (
        <a key={std.id} className="standard-card" href={`/standards/${std.id}`}>
          <div className="standard-preview">
            {std.preview_content ? (
              <pre>{std.preview_content.slice(0, 300)}</pre>
            ) : (
              <div className="standard-preview-placeholder">
                {(std.preview_type || std.category || 'MD').toUpperCase()}
              </div>
            )}
          </div>
          <div className="standard-card-title">{std.title}</div>
          <div className="standard-card-meta">
            <span className="standard-category-badge">{std.category}</span>
            <span className="standard-usage-badge">
              {std.skill_count ?? 0} skill{(std.skill_count ?? 0) !== 1 ? 's' : ''}
            </span>
          </div>
          {std.version !== 'auto' && (
            <div className="standard-version">v{std.version}</div>
          )}
        </a>
      ))}
    </div>
  );
}
