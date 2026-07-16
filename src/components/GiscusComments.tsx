import { useEffect, useRef } from 'react';

// ── Giscus config ─────────────────────────────────────────────────────────────
// Public identifiers for the public ajeetchouksey/ajch_platform repo.
const REPO = 'ajeetchouksey/ajch_platform';
const REPO_ID = 'R_kgDOSkXkfg';

/** All available Giscus discussion categories, keyed by usage context. */
export const GISCUS_CATEGORIES = { // eslint-disable-line react-refresh/only-export-components
  'field-notes': { category: 'Field Notes', categoryId: 'DIC_kwDOSkXkfs4C-Vst' }, // blog posts
  'skill-up':    { category: 'Skill Up',    categoryId: 'DIC_kwDOSkXkfs4C-Vs0' }, // study notes / exams
  'tools':       { category: 'Tools',       categoryId: 'DIC_kwDOSkXkfs4C-Vs7' }, // tools page
  'general':     { category: 'General',     categoryId: 'DIC_kwDOSkXkfs4C9mk2' }, // fallback
  'q-and-a':     { category: 'Q&A',         categoryId: 'DIC_kwDOSkXkfs4C9mk3' }, // Q&A threads
  'ideas':       { category: 'Ideas',       categoryId: 'DIC_kwDOSkXkfs4C9mk4' }, // feature ideas
} as const;

export type GiscusContext = keyof typeof GISCUS_CATEGORIES;

interface GiscusCommentsProps {
  /** Post/note slug — used as effect dependency to force remount on SPA navigation */
  slug: string;
  /** Which Discussions category to use. Defaults to 'field-notes' (blog posts). */
  context?: GiscusContext;
}

/**
 * Giscus comment widget backed by GitHub Discussions.
 * Injects the Giscus client script via the safe createElement+setAttribute
 * pattern (never innerHTML). Re-mounts automatically when `slug` changes.
 */
export default function GiscusComments({ slug: _slug, context = 'field-notes' }: GiscusCommentsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const { category, categoryId } = GISCUS_CATEGORIES[context];

    // Clear any previous mount (e.g. back-navigation to another post)
    container.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    // All setAttribute calls use values from the GISCUS_CATEGORIES constant map — no user-controlled values
    script.setAttribute('data-repo', REPO);
    script.setAttribute('data-repo-id', REPO_ID);
    script.setAttribute('data-category', category);
    script.setAttribute('data-category-id', categoryId);
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '1');
    script.setAttribute('data-input-position', 'top');
    script.setAttribute('data-theme', 'transparent_dark');
    script.setAttribute('data-lang', 'en');
    script.setAttribute('data-loading', 'lazy');
    script.crossOrigin = 'anonymous';
    script.async = true;

    container.appendChild(script);

    return () => {
      container.innerHTML = '';
    };
  }, [_slug, context]); // re-inject on every post/context change

  return (
    <div
      ref={containerRef}
      className="giscus"
      style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid rgba(71,85,105,0.18)' }}
    />
  );
}
