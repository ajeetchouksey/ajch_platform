import { Star } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';

const REPO = 'ajeetchouksey/ajch_platform';

export function StarRepo() {
  const { token } = useAuth();
  const [starred, setStarred] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleStar = async () => {
    if (token) {
      setLoading(true);
      try {
        const res = await fetch(`https://api.github.com/user/starred/${REPO}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
        });
        if (res.status === 204) setStarred(true);
      } finally {
        setLoading(false);
      }
    } else {
      window.open(`https://github.com/${REPO}`, '_blank', 'noopener');
    }
  };

  return (
    <button
      onClick={handleStar}
      disabled={loading || starred}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
        starred
          ? 'bg-amber-700/30 text-amber-300 cursor-default'
          : 'bg-slate-800 text-slate-300 hover:bg-amber-700/20 hover:text-amber-300'
      }`}
      title={token ? 'Star this repo on GitHub' : 'Open repo on GitHub to star it'}
    >
      <Star size={14} className={starred ? 'fill-amber-400 text-amber-400' : ''} />
      {loading ? '...' : starred ? 'Starred!' : 'Rate this'}
    </button>
  );
}