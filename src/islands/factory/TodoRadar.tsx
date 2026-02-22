import type { TodoItem } from './types';
import { relativeTime } from './types';

interface Props {
  todos: TodoItem[];
}

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

export default function TodoRadar({ todos }: Props) {
  const sorted = [...todos]
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
    .slice(0, 7);

  if (sorted.length === 0) {
    return (
      <div className="todo-radar">
        <div className="todo-empty">No pending TODOs</div>
      </div>
    );
  }

  return (
    <div className="todo-radar">
      {sorted.map((todo, i) => (
        <a
          key={`${todo.skill_id}-${i}`}
          className={`todo-item todo-item--${todo.priority}`}
          href={`/skills/${todo.skill_id}#todo`}
        >
          <span className="todo-skill-badge">{todo.skill_name}</span>
          <span className="todo-text">{todo.text}</span>
          <span className="todo-age">{relativeTime(todo.skill_updated_at)}</span>
        </a>
      ))}
    </div>
  );
}
