import { useState } from 'react';
import type { SkillRecord } from './types';
import FactoryBoard from './FactoryBoard';
import FamilyBoard from './FamilyBoard';

interface Props {
  skills: SkillRecord[];
}

type Tab = 'timeline' | 'families';

export default function BoardTabs({ skills }: Props) {
  const [active, setActive] = useState<Tab>('timeline');

  return (
    <div>
      <div className="board-tabs">
        <button
          className={`board-tab ${active === 'timeline' ? 'board-tab--active' : ''}`}
          onClick={() => setActive('timeline')}
        >
          Timeline
        </button>
        <button
          className={`board-tab ${active === 'families' ? 'board-tab--active' : ''}`}
          onClick={() => setActive('families')}
        >
          Families
        </button>
      </div>
      {active === 'timeline' ? (
        <FactoryBoard skills={skills} />
      ) : (
        <FamilyBoard skills={skills} />
      )}
    </div>
  );
}
