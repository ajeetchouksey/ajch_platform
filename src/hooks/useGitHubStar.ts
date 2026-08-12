import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';

const REPO = 'ajeetchouksey/ajch_platform';
const GH_API = 'https://api.github.com';

export function useGitHubStar() {
  const { token } = useAuth();
  const [isStarred, setIsStarred] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`${GH_API}/user/starred/${REPO}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    }).then(res => {
      if (res.status === 204) setIsStarred(true);
    }).catch(() => {});
  }, [token]);

  const starRepo = async () => {
    if (!token || isStarred || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`${GH_API}/user/starred/${REPO}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
      });
      if (res.status === 204) setIsStarred(true);
    } finally {
      setLoading(false);
    }
  };

  return { isStarred, loading, starRepo };
}
