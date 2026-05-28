import { useEffect, useRef, useState } from 'react';
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
    fontSize: '13px',
  },
  flowchart: { curve: 'basis', padding: 20 },
  sequence: { actorMargin: 50, messageMargin: 40 },
});

let idCounter = 0;

export default function MermaidDiagram({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [zoom, setZoom] = useState(1);

  function closeModal() {
    setExpanded(false);
    setZoom(1);
  }

  useEffect(() => {
    const id = `mermaid-${idCounter++}`;
    mermaid
      .render(id, chart.trim())
      .then(({ svg }) => {
        setSvg(svg);
        setError(null);
      })
      .catch((err) => {
        setError(String(err));
      });
  }, [chart]);

  if (error) {
    return (
      <pre className="text-xs text-rose-400 bg-slate-900 rounded p-3 overflow-x-auto">
        {chart}
      </pre>
    );
  }

  return (
    <>
      <div className="relative group my-6">
        <div
          ref={containerRef}
          className="flex justify-center overflow-x-auto rounded-xl border border-violet-900/30 bg-gradient-to-br from-slate-900/60 to-slate-900/80 backdrop-blur-sm p-6 shadow-inner shadow-black/20"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <button
          onClick={() => setExpanded(true)}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] font-medium text-slate-400 hover:text-violet-300 bg-slate-800/90 border border-slate-700 rounded px-2 py-1 transition-all duration-200"
          title="Expand diagram"
        >
          <Maximize2 size={10} />
          Expand
        </button>
      </div>

      {expanded && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="relative w-full max-w-6xl max-h-[90vh] bg-slate-900 rounded-2xl border border-slate-700/50 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Toolbar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setZoom(z => Math.max(0.25, +(z - 0.25).toFixed(2)))}
                  disabled={zoom <= 0.25}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Zoom out"
                >
                  <ZoomOut size={14} />
                </button>
                <span className="text-xs text-slate-400 tabular-nums w-11 text-center select-none">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom(z => Math.min(4, +(z + 0.25).toFixed(2)))}
                  disabled={zoom >= 4}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Zoom in"
                >
                  <ZoomIn size={14} />
                </button>
                <button
                  onClick={() => setZoom(1)}
                  className="ml-1 px-2 py-1 text-[10px] font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  title="Reset to 100%"
                >
                  1:1
                </button>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                title="Close"
              >
                <X size={14} />
              </button>
            </div>

            {/* Zoomable diagram */}
            <div className="overflow-auto flex-1 flex items-start justify-center p-8">
              <div
                style={{ zoom } as React.CSSProperties}
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
