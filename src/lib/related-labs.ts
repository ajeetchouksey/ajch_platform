import { useEffect, useState } from 'react';
import { loadHolLabsIndex, type HolLabSummary } from './content-loader';

export type RelatedLabKind = 'exam' | 'usecase' | 'blog' | 'lab';

/**
 * Reverse-link lookup: "what labs relate to this exam/usecase/blog/lab".
 * Because HolLabSummary already carries the flattened relatedXIds arrays
 * (written by hol-lab-publisher), this needs exactly one fetch of the small,
 * cached hol-labs index — no N+1 fetches against individual lab files.
 */
export function useRelatedLabs(kind: RelatedLabKind, id: string | undefined) {
  const [labs, setLabs] = useState<HolLabSummary[]>([]);

  useEffect(() => {
    if (!id) return;
    loadHolLabsIndex()
      .then((index) => {
        const matches = index.labs.filter((lab) => {
          if (kind === 'exam') return lab.relatedExamIds.includes(id);
          if (kind === 'usecase') return lab.relatedUseCaseIds.includes(id);
          if (kind === 'blog') return lab.relatedBlogSlugs.includes(id);
          return lab.relatedLabIds.includes(id);
        });
        setLabs(matches);
      })
      .catch(() => setLabs([]));
  }, [kind, id]);

  return labs;
}
