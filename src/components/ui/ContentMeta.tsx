import { VersionTag } from './VersionTag';

// ─── Props ───────────────────────────────────────────────────────────────────
interface ContentMetaProps {
  /** Pre-formatted string, e.g. "Published Aug 24, 2026". Component does no date math. */
  publishedLabel?: string;
  /** Pre-formatted string, e.g. "Updated Aug 25, 2026". */
  updatedLabel?: string;
  /** Optional version, e.g. "1.0.0" — rendered via the shared VersionTag pill (non-highlighted). */
  versionTag?: string;
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────
/**
 * Secondary provenance line for content pages (blog posts, use-case detail
 * pages, exam study notes) — e.g. "Published Aug 24, 2026 · Updated Aug 25, 2026".
 * Renders nothing if no provenance data is supplied.
 */
export function ContentMeta({ publishedLabel, updatedLabel, versionTag, className = '' }: ContentMetaProps) {
  if (!publishedLabel && !updatedLabel && !versionTag) return null;

  return (
    <div
      className={[
        'inline-flex items-center gap-1.5 text-[10px] text-slate-500',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {(publishedLabel || updatedLabel) && (
        <span>
          {publishedLabel}
          {publishedLabel && updatedLabel && <span className="mx-1 text-slate-600">·</span>}
          {updatedLabel}
        </span>
      )}
      {versionTag && <VersionTag version={versionTag} />}
    </div>
  );
}
