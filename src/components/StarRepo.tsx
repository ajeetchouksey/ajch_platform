import { Star } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useGitHubStar } from '@/hooks/useGitHubStar';

const REPO = 'ajeetchouksey/ajch_platform';

export function StarRepo() {
  const { token } = useAuth();
  const { isStarred, loading, starRepo } = useGitHubStar();

  const handleStar = () => {
    if (token) {
      void starRepo();
    } else {
      window.open(`https://github.com/${REPO}`, '_blank', 'noopener');
    }
  };

  return (
    <button
      onClick={handleStar}
      disabled={loading || isStarred}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
        isStarred
          ? 'bg-amber-700/30 text-amber-300 cursor-default'
          : 'bg-slate-800 text-slate-300 hover:bg-amber-700/20 hover:text-amber-300'
      }`}
      title={token ? 'Star this repo on GitHub' : 'Open repo on GitHub to star it'}
    >
      <Star size={14} className={isStarred ? 'fill-amber-400 text-amber-400' : ''} />
      {loading ? '...' : isStarred ? 'Starred!' : 'Rate this'}
    </button>
  );
}