import { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { loadNoteForExam, loadExamRegistry } from '../lib/content-loader';
import type { DomainConfig } from '../types/content';

const MermaidDiagram = lazy(() => import('../components/MermaidDiagram'));

export default function Notes() {
  const { examId = 'ccaf' } = useParams<{ examId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const domain = Number(searchParams.get('d')) || 1;
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [examDomains, setExamDomains] = useState<DomainConfig[]>([]);

  useEffect(() => {
    loadExamRegistry().then((r) => {
      const exam = r.exams.find((e) => e.id === examId);
      if (exam) setExamDomains(exam.domains);
    }).catch(() => {});
  }, [examId]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    loadNoteForExam(examId, domain)
      .then((md) => { setContent(md); setLoading(false); })
      .catch((e: unknown) => { setError(String(e)); setLoading(false); });
  }, [examId, domain]);

  const currentDomainConfig = examDomains.find((d) => d.id === domain);

  return (
    <div>
      {/* Domain identity header */}
      {currentDomainConfig && (
        <div className="flex items-center gap-3 pb-5 mb-5 border-b border-slate-800/70">
          <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700/50 flex items-center justify-center shrink-0">
            <span className="text-violet-400 font-mono font-bold text-sm">D{domain}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
              Domain {domain} of {examDomains.length}
            </p>
            <h2 className="text-base font-semibold text-white truncate">{currentDomainConfig.title}</h2>
          </div>
          <span className="hidden sm:block text-xs font-mono text-slate-500 bg-slate-800/60 border border-slate-700/40 px-2.5 py-1 rounded-full">
            {currentDomainConfig.weight}% of exam
          </span>
        </div>
      )}

      {/* Mobile-only domain tabs (sidebar handles desktop) */}
      <div className="flex flex-wrap gap-2 mb-6 lg:hidden">
        {examDomains.map((d) => (
          <button
            key={d.id}
            onClick={() => setSearchParams({ d: String(d.id) })}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              domain === d.id
                ? 'bg-violet-700 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <span className="font-mono text-xs mr-1">D{d.id}</span>
            <span className="hidden sm:inline">{d.title}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <article className="min-w-0">
        {loading && (
          <div className="text-slate-500 text-sm animate-pulse">Loading notes…</div>
        )}
        {error && (
          <div className="text-rose-400 text-sm">Failed to load: {error}</div>
        )}
        {!loading && !error && (
          <div className="prose prose-invert max-w-none prose-headings:text-white prose-a:text-violet-400 prose-code:text-violet-300 prose-pre:bg-slate-900/70 prose-pre:border prose-pre:border-slate-700/50 prose-pre:rounded-xl prose-pre:text-sm prose-pre:leading-relaxed prose-blockquote:border-violet-500 prose-blockquote:text-slate-400 prose-p:text-[0.9375rem] prose-p:leading-7">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-mermaid/.exec(className || '');
                  if (match) {
                    return (
                      <Suspense fallback={<div className="text-slate-500 text-xs animate-pulse p-4">Loading diagram…</div>}>
                        <MermaidDiagram chart={String(children)} />
                      </Suspense>
                    );
                  }
                  // Inline vs block code
                  const isBlock = className?.startsWith('language-');
                  if (isBlock) {
                    return (
                      <code className={`${className} block`} {...props}>
                        {children}
                      </code>
                    );
                  }
                  return <code className={className} {...props}>{children}</code>;
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </article>
    </div>
  );
}
