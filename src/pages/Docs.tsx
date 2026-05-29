import { useState, useEffect, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { BookOpen, Layers, Cpu, FileCode, Tag, Clock, FileText } from 'lucide-react';

const MermaidDiagram = lazy(() => import('../components/MermaidDiagram'));

const BASE = import.meta.env.BASE_URL;

interface DocEntry {
  id: string;
  title: string;
  description: string;
  file: string;
  icon: string;
  category: string;
}

interface DocManifest {
  schema: string;
  generated: string;
  docs: DocEntry[];
}

const ICON_MAP: Record<string, React.ElementType> = {
  Layers,
  Cpu,
  FileCode,
  Tag,
  BookOpen,
  FileText,
};

function readingTime(md: string) {
  return Math.max(1, Math.ceil(md.split(/\s+/).filter(Boolean).length / 200));
}

export default function Docs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [manifest, setManifest] = useState<DocManifest | null>(null);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const docId = searchParams.get('doc') ?? '';

  useEffect(() => {
    fetch(`${BASE}content/platform-docs/index.json`)
      .then((r) => r.json())
      .then((data: DocManifest) => setManifest(data))
      .catch(() => {});
  }, []);

  const selectedDoc =
    manifest?.docs.find((d) => d.id === docId) ?? manifest?.docs[0] ?? null;

  useEffect(() => {
    if (!selectedDoc) return;
    setLoading(true);
    setError(null);
    fetch(`${BASE}${selectedDoc.file}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load ${selectedDoc.file}: ${r.status}`);
        return r.text();
      })
      .then((md) => {
        setContent(md);
        setLoading(false);
      })
      .catch((e: unknown) => {
        setError(String(e));
        setLoading(false);
      });
  }, [selectedDoc?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const minutes = content ? readingTime(content) : null;

  function selectDoc(id: string) {
    setSearchParams({ doc: id });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: 'rgba(139,92,246,0.12)',
              border: '1px solid rgba(139,92,246,0.28)',
            }}
          >
            <BookOpen size={18} style={{ color: '#a78bfa' }} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              Platform
            </p>
            <h1 className="text-xl font-black text-white leading-tight">Documentation</h1>
          </div>
        </div>
        <p className="text-sm text-slate-500 max-w-xl leading-relaxed">
          Architecture guides, agent ecosystem reference, content schemas, and release notes for
          Aarya — My AI Learning Hub.
        </p>
      </div>

      {/* Doc selector tabs */}
      {manifest && (
        <div className="flex flex-wrap gap-2 mb-8">
          {manifest.docs.map((doc) => {
            const IconComp = ICON_MAP[doc.icon] ?? BookOpen;
            const isActive = (selectedDoc?.id ?? manifest.docs[0]?.id) === doc.id;
            return (
              <button
                key={doc.id}
                onClick={() => selectDoc(doc.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: isActive
                    ? 'rgba(139,92,246,0.15)'
                    : 'rgba(15,23,42,0.80)',
                  border: `1px solid ${
                    isActive ? 'rgba(139,92,246,0.40)' : 'rgba(71,85,105,0.25)'
                  }`,
                  color: isActive ? '#c4b5fd' : '#94a3b8',
                }}
              >
                <IconComp size={13} />
                {doc.title}
              </button>
            );
          })}
        </div>
      )}

      {/* Content panel */}
      <div
        className="rounded-2xl p-6 sm:p-8"
        style={{
          background: 'rgba(15,23,42,0.95)',
          border: '1px solid rgba(71,85,105,0.20)',
        }}
      >
        {/* Doc identity header */}
        {selectedDoc && (
          <div className="flex items-start gap-4 pb-5 mb-6 border-b border-slate-800/70">
            <div className="min-w-0">
              <h2 className="text-base font-black text-white mb-1">{selectedDoc.title}</h2>
              <p className="text-sm text-slate-500">{selectedDoc.description}</p>
              {minutes !== null && (
                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-600">
                  <Clock size={11} />
                  <span>{minutes} min read</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3 animate-pulse">
            {[100, 90, 95, 85, 92].map((w, i) => (
              <div
                key={i}
                className="h-3.5 bg-slate-800 rounded"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="text-red-400 text-sm p-4 rounded-lg bg-red-950/30 border border-red-900/30">
            Failed to load document. {error}
          </div>
        )}

        {/* Markdown render */}
        {!loading && !error && content && (
          <div className="prose prose-invert max-w-none prose-headings:text-white prose-a:text-violet-400 prose-code:text-violet-300 prose-pre:bg-slate-900/70 prose-pre:border prose-pre:border-slate-700/50 prose-pre:rounded-xl prose-pre:text-sm prose-pre:leading-relaxed prose-blockquote:border-violet-500 prose-blockquote:text-slate-400 prose-p:text-[0.9375rem] prose-p:leading-7">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-mermaid/.exec(className ?? '');
                  if (match) {
                    return (
                      <Suspense fallback={<div className="text-slate-500 text-sm py-2">Loading diagram…</div>}>
                        <MermaidDiagram chart={String(children)} />
                      </Suspense>
                    );
                  }
                  const isBlock = /language-/.test(className ?? '');
                  if (isBlock) {
                    return (
                      <pre className="overflow-x-auto">
                        <code className={`${className ?? ''} block`} {...props}>
                          {children}
                        </code>
                      </pre>
                    );
                  }
                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && !content && !selectedDoc && (
          <p className="text-slate-500 text-sm text-center py-12">
            Select a document above to get started.
          </p>
        )}
      </div>
    </div>
  );
}
