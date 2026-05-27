import { useEffect, useRef, useState } from 'react';
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
    <div
      ref={containerRef}
      className="my-6 flex justify-center overflow-x-auto rounded-xl border border-violet-900/30 bg-gradient-to-br from-slate-900/60 to-slate-900/80 backdrop-blur-sm p-6 shadow-inner shadow-black/20"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
