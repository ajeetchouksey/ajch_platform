import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, X, ZoomIn, ZoomOut } from 'lucide-react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#6d28d9',
    primaryTextColor: '#e2e8f0',
    primaryBorderColor: '#7c3aed',
    lineColor: '#64748b',
    secondaryColor: '#162236',
    tertiaryColor: '#0e1a2d',
    background: '#0e1a2d',
    mainBkg: '#1a2a42',
    nodeBorder: '#7c3aed',
    clusterBkg: '#111f35',
    titleColor: '#e2e8f0',
    edgeLabelBackground: '#162236',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: '14px',
  },
  flowchart: { curve: 'basis', padding: 20, useMaxWidth: true },
  sequence: { actorMargin: 50, messageMargin: 40, useMaxWidth: true },
});

let idCounter = 0;

/**
 * Mermaid v11 appends a *visible* temporary `<div id="d{id}">` to `document.body`
 * to measure the diagram before returning the SVG string. That element sits in the
 * normal page flow for a few hundred ms and flashes at the bottom of the content.
 * Rendering into a hidden, off-screen sandbox keeps the measurement invisible.
 * `visibility: hidden` (not `display: none`) preserves layout so text can be measured.
 */
let _sandbox: HTMLElement | null = null;
function getSandbox(): HTMLElement {
  if (_sandbox && document.body.contains(_sandbox)) return _sandbox;
  const el = document.createElement('div');
  el.setAttribute('aria-hidden', 'true');
  el.style.position = 'absolute';
  el.style.top = '-9999px';
  el.style.left = '-9999px';
  el.style.width = '900px';
  el.style.visibility = 'hidden';
  el.style.pointerEvents = 'none';
  document.body.appendChild(el);
  _sandbox = el;
  return el;
}

/** Strip fixed dimensions from Mermaid SVG so it scales with its container */
function patchSvgFluid(raw: string): string {
  return raw
    .replace(/(<svg\b[^>]*?)\s+width="[^"]*"/, '$1 width="100%"')
    .replace(/(<svg\b[^>]*?)\s+height="[^"]*"/, '$1')
    .replace(/\bmax-width\s*:\s*[\d.]+px/g, 'max-width:100%')
    // Only replace standalone `width:Npx` — NOT `stroke-width:Npx` or `max-width:Npx`
    .replace(/(?<![a-zA-Z-])width\s*:\s*[\d.]+px/g, 'width:100%');
}

export default function MermaidDiagram({ chart, caption }: { chart: string; caption?: string }) {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const inlineRef = useRef<HTMLDivElement>(null);

  function openModal() { setZoom(1); setPan({ x: 0, y: 0 }); setExpanded(true); }
  function closeModal() { setExpanded(false); setZoom(1); setPan({ x: 0, y: 0 }); }
  function resetView() { setZoom(1); setPan({ x: 0, y: 0 }); }
  function fitView() { setZoom(0.8); setPan({ x: 0, y: 0 }); }

  // Escape closes modal
  useEffect(() => {
    if (!expanded) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [expanded]);

  // Render chart — cancel stale renders on chart change or unmount
  useEffect(() => {
    let cancelled = false;
    const id = `mermaid-${idCounter++}`;
    // Render into a hidden off-screen sandbox so Mermaid's temporary measurement
    // element never flashes in the visible page flow.
    mermaid.render(id, chart.trim(), getSandbox())
      .then(({ svg: rawSvg }) => {
        // Belt-and-suspenders: remove any orphan Mermaid leaves behind (id + d-prefixed)
        document.getElementById(id)?.remove();
        document.getElementById(`d${id}`)?.remove();
        if (cancelled) return;
        setSvg(patchSvgFluid(rawSvg));
        setError(null);
      })
      .catch(err => {
        document.getElementById(id)?.remove();
        document.getElementById(`d${id}`)?.remove();
        if (cancelled) return;
        setError(String(err));
      });
    return () => { cancelled = true; };
  }, [chart]);

  // Patch inline SVG DOM after insertion (belt-and-suspenders)
  useEffect(() => {
    const el = inlineRef.current?.querySelector('svg');
    if (!el) return;
    el.setAttribute('width', '100%');
    el.removeAttribute('height');
    el.style.maxWidth = '100%';
    el.style.height = 'auto';
    el.style.display = 'block';
  }, [svg]);

  // Scroll-to-zoom inside modal
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom(z => Math.min(5, Math.max(0.15, parseFloat((z + delta).toFixed(2)))));
  }, []);

  // Drag-to-pan
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setPan(p => ({ x: p.x + dx, y: p.y + dy }));
  }, [isDragging]);

  const stopDrag = useCallback(() => setIsDragging(false), []);

  if (error) {
    return (
      <>
        {caption && <p className="text-xs text-slate-500 mb-1">{caption}</p>}
        <pre className="text-xs text-rose-400 bg-slate-900/80 rounded-xl border border-rose-900/40 p-4 overflow-x-auto my-4 leading-relaxed">
          {chart}
        </pre>
      </>
    );
  }

  // Reserve layout space while Mermaid renders — prevents the height-jump flicker
  if (!svg) {
    return (
      <div
        className="my-6 rounded-xl border border-violet-900/20 bg-slate-900/50 flex items-center justify-center"
        style={{ minHeight: '180px' }}
        aria-label={caption ? `Loading diagram: ${caption}` : 'Loading diagram…'}
      >
        <div className="flex items-center gap-2 text-[11px] text-slate-600">
          <span className="w-3 h-3 rounded-full border-2 border-violet-600/40 border-t-violet-400 animate-spin" />
          Loading diagram…
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Diagram caption — visible for sighted users, role="img" + aria-label carries the same claim for screen readers ── */}
      {caption && <p className="text-xs font-medium text-slate-400 mb-2">{caption}</p>}

      {/* ── Inline diagram card ─────────────────────────────────────────────── */}
      <div className="relative group my-6 rounded-xl border border-violet-900/30 bg-gradient-to-br from-slate-900/60 to-slate-900/80 shadow-inner shadow-black/20 overflow-hidden">
        <div
          ref={inlineRef}
          className="overflow-x-auto p-4 sm:p-6 [&>svg]:w-full [&>svg]:max-w-full [&>svg]:h-auto [&>svg]:block"
          style={{ animation: 'fadeIn 200ms ease' }}
          role={caption ? 'img' : undefined}
          aria-label={caption}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        {/* Expand button – visible on hover */}
        <button
          onClick={openModal}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex items-center gap-1.5 text-[11px] font-semibold text-slate-300 hover:text-violet-200 bg-slate-800/95 border border-slate-700/80 rounded-lg px-2.5 py-1.5 transition-all duration-200 shadow z-10"
          title="Expand diagram"
        >
          <Maximize2 size={11} />
          Expand
        </button>
      </div>

      {/* ── Expanded modal ──────────────────────────────────────────────────── */}
      {expanded && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/92 backdrop-blur-md flex items-center justify-center p-3"
          onClick={closeModal}
        >
          <div
            className="relative w-full max-w-[96vw] max-h-[92vh] bg-slate-950 rounded-2xl border border-slate-700/50 flex flex-col shadow-2xl overflow-hidden"
            style={{ height: 'min(92vh, 800px)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-800/80 bg-slate-900/90 shrink-0">
              <div className="flex items-center gap-1.5">
                {/* Zoom out */}
                <button
                  onClick={() => setZoom(z => Math.max(0.15, parseFloat((z - 0.1).toFixed(2))))}
                  className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  title="Zoom out"
                >
                  <ZoomOut size={14} />
                </button>

                {/* Zoom level */}
                <span className="text-xs text-slate-300 tabular-nums w-12 text-center font-mono select-none bg-slate-800/60 rounded px-1 py-0.5">
                  {Math.round(zoom * 100)}%
                </span>

                {/* Zoom in */}
                <button
                  onClick={() => setZoom(z => Math.min(5, parseFloat((z + 0.1).toFixed(2))))}
                  className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  title="Zoom in"
                >
                  <ZoomIn size={14} />
                </button>

                <div className="w-px h-4 bg-slate-700/80 mx-0.5" />

                {/* Reset */}
                <button
                  onClick={resetView}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  title="Reset to 100%"
                >
                  1:1
                </button>

                {/* Fit */}
                <button
                  onClick={fitView}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-slate-800 hover:bg-violet-900/60 text-slate-400 hover:text-violet-200 transition-colors"
                  title="Fit to view"
                >
                  Fit
                </button>

                <span className="ml-3 text-[10px] text-slate-600 select-none hidden sm:block">
                  Scroll to zoom · Drag to pan · Esc to close
                </span>
              </div>

              {/* Close */}
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 transition-colors"
                title="Close (Esc)"
              >
                <X size={15} />
              </button>
            </div>

            {/* Pan + zoom canvas */}
            <div
              className="flex-1 overflow-hidden relative"
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              onWheel={handleWheel}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={stopDrag}
              onMouseLeave={stopDrag}
            >
              {/* Subtle grid background */}
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.04]"
                style={{
                  backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />

              {/* Transformable diagram wrapper */}
              <div
                className="absolute inset-0 flex items-center justify-center"
              >
                <div
                  className="[&>svg]:block [&>svg]:max-w-none [&>svg]:h-auto"
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: 'center center',
                    transition: isDragging ? 'none' : 'transform 0.12s ease-out',
                    willChange: 'transform',
                    minWidth: '320px',
                  }}
                  role={caption ? 'img' : undefined}
                  aria-label={caption}
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
