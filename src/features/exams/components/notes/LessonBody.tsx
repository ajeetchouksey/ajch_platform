// ── One notes section rendered on its own (lessons and session steps) ─────────
import { Children, isValidElement, lazy, Suspense } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { resolveContentUrl } from '@/lib/content-manifest';
import { plainText } from '@/lib/flashcards';
import { rehypeNoteBlocks } from '../note-blocks';
import { DiagramImage } from '../DiagramImage';
import { headingKicker, stripEmojiChildren } from '../notes-format';

const MermaidDiagram = lazy(() => import('@/components/MermaidDiagram'));

export function LessonBody({ heading, body, diagrams = true }: { heading: string; body: string; diagrams?: boolean }) {
  return (
    <article className="notes-body prose prose-invert max-w-[72ch] prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-slate-100 prose-headings:text-white prose-a:text-brand-lilac [&_img]:h-auto [&_img]:w-full [&_img]:rounded-xl">
      <h2>{plainText(heading)}</h2>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeNoteBlocks]}
        components={{
          h3({ children }) {
            const k = headingKicker(String(children));
            if (!k) return <h3>{stripEmojiChildren(children)}</h3>;
            const Icon = k.kicker.icon;
            return (
              <h3 className={`notes-kicker ${k.kicker.tone}`}>
                <span className="notes-kicker-label"><Icon size={13} aria-hidden="true" />{k.kicker.label}</span>
                {k.rest && <span className="notes-kicker-title">{k.rest}</span>}
              </h3>
            );
          },
          blockquote({ children }) { return <blockquote className="callout">{children}</blockquote>; },
          table({ children }) { return <div className="notes-table"><table>{children}</table></div>; },
          pre({ children }) {
            const first = Children.toArray(children)[0];
            const cls = isValidElement(first) ? ((first.props as { className?: string }).className ?? '') : '';
            if (diagrams && cls.includes('language-mermaid') && isValidElement(first)) {
              return (
                <Suspense fallback={<div className="my-6 h-44 rounded-xl bg-slate-900/50 animate-pulse" />}>
                  <MermaidDiagram chart={String((first.props as { children?: unknown }).children ?? '')} />
                </Suspense>
              );
            }
            return <pre>{children}</pre>;
          },
          img({ src, alt, ...props }) {
            const resolved = typeof src === 'string' ? resolveContentUrl(src) : src;
            if (typeof resolved === 'string' && /\.svg(\?|$)/i.test(resolved)) return <DiagramImage src={resolved} alt={alt ?? ''} />;
            return <img src={resolved} alt={alt ?? ''} {...props} />;
          },
        }}
      >
        {body}
      </ReactMarkdown>
    </article>
  );
}
