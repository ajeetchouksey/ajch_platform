import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Calendar, Clock, User, Tag, Share2, Check, Maximize2, Minimize2 } from 'lucide-react';
import { loadBlogPost, loadBlogManifest } from '../lib/content-loader';
import type { BlogPostMeta } from '../types/content';

const MermaidDiagram = lazy(() => import('../components/MermaidDiagram'));

function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0;
      setProgress(Math.min(scrolled, 100));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5">
      <div
        className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// ─── ExpandablePre ────────────────────────────────────────────────────────────
const MAX_CODE_HEIGHT = 320;

function ExpandablePre({ children }: { children: React.ReactNode }) {
  const preRef = useRef<HTMLPreElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    if (preRef.current) {
      setOverflows(preRef.current.scrollHeight > MAX_CODE_HEIGHT);
    }
  }, []);

  return (
    <div className="relative group my-5">
      <div className={!expanded && overflows ? 'max-h-80 overflow-hidden relative' : 'relative'}>
        <pre
          ref={preRef}
          className="bg-slate-950/80 border border-slate-700/50 rounded-xl p-5 text-sm overflow-x-auto text-slate-200 leading-relaxed"
        >
          {children}
        </pre>
        {!expanded && overflows && (
          <div className="absolute bottom-0 inset-x-0 h-14 bg-gradient-to-t from-slate-950/90 to-transparent rounded-b-xl pointer-events-none" />
        )}
      </div>
      {overflows && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="absolute bottom-2 right-3 flex items-center gap-1 text-[10px] font-medium text-slate-400 hover:text-violet-300 bg-slate-800 border border-slate-700 rounded px-2 py-1 transition-colors z-10"
        >
          {expanded ? <><Minimize2 size={10} /> Collapse</> : <><Maximize2 size={10} /> Expand</>}
        </button>
      )}
    </div>
  );
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [content, setContent] = useState('');
  const [meta, setMeta] = useState<BlogPostMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);
  const articleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    setVisible(false);

    Promise.all([loadBlogPost(slug), loadBlogManifest()])
      .then(([md, manifest]) => {
        const stripped = md.replace(/^---[\s\S]*?---\n*/, '');
        setContent(stripped);
        const post = manifest.posts.find((p) => p.slug === slug) || null;
        setMeta(post);
        setLoading(false);
        setTimeout(() => setVisible(true), 50);
      })
      .catch((e: unknown) => {
        setError(String(e));
        setLoading(false);
      });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback — ignore
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-slate-800 rounded w-24 mb-6" />
        <div className="h-8 bg-slate-700 rounded w-3/4 mb-4" />
        <div className="flex gap-4 mb-8">
          <div className="h-4 bg-slate-800 rounded w-24" />
          <div className="h-4 bg-slate-800 rounded w-28" />
          <div className="h-4 bg-slate-800 rounded w-20" />
        </div>
        <div className="space-y-3">
          <div className="h-3 bg-slate-800 rounded w-full" />
          <div className="h-3 bg-slate-800 rounded w-full" />
          <div className="h-3 bg-slate-800 rounded w-5/6" />
          <div className="h-3 bg-slate-800 rounded w-full" />
          <div className="h-3 bg-slate-800 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="text-rose-400 text-lg mb-2">Article not found</div>
        <p className="text-slate-500 text-sm mb-4">{error}</p>
        <Link to="/blog" className="text-violet-400 hover:underline text-sm">
          ← Back to blog
        </Link>
      </div>
    );
  }

  return (
    <div className={`max-w-3xl mx-auto transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <ReadingProgress />

      <Link
        to="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-violet-300 hover:-translate-x-0.5 transition-all mb-6"
      >
        <ArrowLeft size={14} />
        Back to blog
      </Link>

      {meta && (
        <header className="mb-8 pb-6 border-b border-slate-800">
          {meta.category && (
            <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-violet-400 bg-violet-950/50 px-2 py-0.5 rounded mb-3">
              {meta.category}
            </span>
          )}
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-4 leading-tight">{meta.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-4">
            <span className="flex items-center gap-1.5">
              <User size={14} />
              {meta.author}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              {new Date(meta.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} />
              {meta.readingTime} min read
            </span>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-slate-500 hover:text-violet-300 transition-colors ml-auto"
              title="Copy link"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
              <span className="text-xs">{copied ? 'Copied!' : 'Share'}</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {meta.tags.map((tag) => (
              <Link
                key={tag}
                to={`/blog?tag=${tag}`}
                className="inline-flex items-center gap-1 text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full hover:bg-slate-700 hover:text-white transition-colors"
              >
                <Tag size={10} />
                {tag}
              </Link>
            ))}
          </div>
        </header>
      )}

      <article
        ref={articleRef}
        className="prose prose-invert prose-base max-w-none
          prose-headings:text-white prose-headings:scroll-mt-20 prose-headings:font-bold
          prose-p:text-slate-300 prose-p:leading-8
          prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline
          prose-code:text-violet-300 prose-code:bg-slate-800/70 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
          prose-pre:bg-transparent prose-pre:p-0 prose-pre:border-0 prose-pre:shadow-none
          prose-blockquote:border-violet-500 prose-blockquote:text-slate-400 prose-blockquote:bg-slate-900/50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
          prose-li:marker:text-violet-500 prose-hr:border-slate-700
          prose-strong:text-slate-100 prose-img:rounded-xl"
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          children={content}
          components={{
            pre({ children }) {
              // Detect mermaid blocks and render without pre wrapper
              const nodes = React.Children.toArray(children);
              const mermaidNode = nodes.find(
                (n): n is React.ReactElement =>
                  React.isValidElement(n) &&
                  typeof (n.props as { className?: string }).className === 'string' &&
                  ((n.props as { className?: string }).className ?? '').includes('language-mermaid')
              );
              if (mermaidNode) {
                const el = mermaidNode as React.ReactElement<{ children?: React.ReactNode }>;
                return (
                  <Suspense fallback={<div className="text-slate-500 text-xs animate-pulse p-4 border border-slate-700 rounded">Loading diagram...</div>}>
                    <MermaidDiagram chart={String(el.props.children ?? '')} />
                  </Suspense>
                );
              }
              return <ExpandablePre>{children}</ExpandablePre>;
            },
            code({ className, children, ...props }) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
          }}
        />
      </article>

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <Link
            to="/blog"
            className="text-sm text-slate-400 hover:text-violet-300 transition-colors"
          >
            ← All posts
          </Link>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-sm text-slate-500 hover:text-white transition-colors"
          >
            Back to top ↑
          </button>
        </div>
      </footer>
    </div>
  );
}