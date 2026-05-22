import { useState, useEffect, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { loadNote } from '../lib/content-loader';
import { DOMAIN_META } from '../types/content';

const MermaidDiagram = lazy(() => import('../components/MermaidDiagram'));

export default function Notes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const domain = Number(searchParams.get('d')) || 1;
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    loadNote(domain)
      .then((md) => {
        setContent(md);
        setLoading(false);
      })
      .catch((e: unknown) => {
        setError(String(e));
        setLoading(false);
      });
  }, [domain]);

  return (
    <div>
      {/* Mobile-only domain tabs (sidebar handles desktop) */}
      <div className="flex flex-wrap gap-2 mb-6 lg:hidden">
        {Object.entries(DOMAIN_META).map(([d, meta]) => (
          <button
            key={d}
            onClick={() => setSearchParams({ d })}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              domain === Number(d)
                ? 'bg-violet-700 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <span className="font-mono text-xs mr-1">D{d}</span>
            <span className="hidden sm:inline">{meta.title}</span>
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
          <div className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-a:text-violet-400 prose-code:text-violet-300 prose-pre:bg-slate-800 prose-blockquote:border-violet-500 prose-blockquote:text-slate-400">
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
