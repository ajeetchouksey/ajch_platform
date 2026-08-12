import { Star } from 'lucide-react';
import { useState } from 'react';

interface ContentStarProps {
  contentId: string;
}

function storageKey(id: string) {
  return `aarya_star_${id}`;
}

export function ContentStar({ contentId }: ContentStarProps) {
  // lazy initializer reads localStorage once on mount — no effect needed
  const [starred, setStarred] = useState(() =>
    localStorage.getItem(storageKey(contentId)) === '1'
  );

  const toggle = () => {
    const next = !starred;
    setStarred(next);
    if (next) {
      localStorage.setItem(storageKey(contentId), '1');
    } else {
      localStorage.removeItem(storageKey(contentId));
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={starred ? 'Remove star' : 'Star this content'}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
        starred
          ? 'bg-amber-700/30 text-amber-300'
          : 'bg-slate-800 text-slate-300 hover:bg-amber-700/20 hover:text-amber-300'
      }`}
    >
      <Star
        size={14}
        className={`transition-all ${starred ? 'fill-amber-400 text-amber-400 scale-110' : ''}`}
      />
      {starred ? 'Starred!' : 'Star this'}
    </button>
  );
}
