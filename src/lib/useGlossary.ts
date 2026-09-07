import { useEffect, useState } from 'react';
import { loadGlossaryMap } from './content-loader';
import type { GlossaryTermEntry } from './glossary';

/**
 * The precomputed key-term store (public/content/glossary.json), keyed by
 * each term's exact display casing. Returns null while loading — callers
 * (GlossaryTerm's markdown `code()` renderers) simply render plain code
 * spans until it resolves, then start rendering tooltips once populated.
 */
export function useGlossary(): Map<string, GlossaryTermEntry> | null {
  const [map, setMap] = useState<Map<string, GlossaryTermEntry> | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadGlossaryMap()
      .then((m) => { if (!cancelled) setMap(m); })
      .catch(() => { if (!cancelled) setMap(new Map()); });
    return () => { cancelled = true; };
  }, []);

  return map;
}
