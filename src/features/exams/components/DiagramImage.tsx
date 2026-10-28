// ── A notes diagram that stays readable ───────────────────────────────────────
// Wide diagrams used to be squeezed into the text column until their labels
// were ~7px. Here a diagram shows at its natural size, never below 80% of it:
// when that is wider than the column it scrolls sideways, and a click opens
// the full-size SVG in a new tab.
import { useRef, useState } from 'react';
import { Maximize2 } from 'lucide-react';

const MIN_SCALE = 0.8;

export function DiagramImage({ src, alt }: { src: string; alt: string }) {
  const [natural, setNatural] = useState<number | null>(null);
  const [wide, setWide] = useState(false);
  const frame = useRef<HTMLSpanElement>(null);
  const width = natural ? `min(${natural}px, max(100%, ${Math.round(natural * MIN_SCALE)}px))` : '100%';
  const onLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const w = e.currentTarget.naturalWidth;
    setNatural(w);
    setWide(!!frame.current && w * MIN_SCALE > frame.current.clientWidth + 4);
  };
  return (
    <span className="notes-diagram not-prose block my-7">
      <span ref={frame} className="block overflow-x-auto rounded-xl border border-slate-700/40 bg-[#0e1a2d]">
        <a href={src} target="_blank" rel="noopener noreferrer" className="block mx-auto" style={{ width }} title="Open the diagram full size">
          <img src={src} alt={alt} loading="lazy" onLoad={onLoad}
            className="block w-full h-auto !m-0 !border-0 !shadow-none !rounded-none" style={{ maxWidth: 'none' }} />
        </a>
      </span>
      <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
        {wide && <span>Wide diagram: scroll sideways to see all of it.</span>}
        <a href={src} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-slate-400 hover:text-white no-underline">
          <Maximize2 size={12} aria-hidden="true" /> Open full size
        </a>
      </span>
    </span>
  );
}
