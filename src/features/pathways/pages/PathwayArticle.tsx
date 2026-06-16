import { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import {
  ShieldCheck, TrendingUp, Brain, Zap,
  Clock, Users, Tag, List, X,
} from 'lucide-react';
import { useMeta } from '@/lib/useMeta';

const MermaidDiagram = lazy(() => import('@/components/MermaidDiagram'));

// ── Track colors (same as other Pathways pages) ───────────────────────────────
const TRACK_META = {
  safety:      { label: 'AI Safety & Responsibility', audience: 'Teens 13–18',              color: '#38bdf8', bg: 'rgba(56,189,248,0.08)',   border: 'rgba(56,189,248,0.22)',   icon: ShieldCheck },
  applied:     { label: 'Applied AI for Practitioners', audience: 'Finance & Data',          color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.22)',  icon: TrendingUp  },
  ethics:      { label: 'AI Ethics & Bias',           audience: 'Students 16+',              color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.22)', icon: Brain       },
  productivity:{ label: 'AI Productivity',            audience: 'Students & Professionals',  color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.22)', icon: Zap         },
} as const;
type TrackId = keyof typeof TRACK_META;

const DIFFICULTY_STYLE = {
  beginner:     { label: 'Beginner',     color: '#10b981', bg: 'rgba(16,185,129,0.10)',  border: 'rgba(16,185,129,0.25)'  },
  intermediate: { label: 'Intermediate', color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)' },
  advanced:     { label: 'Advanced',     color: '#f43f5e', bg: 'rgba(244,63,94,0.10)',  border: 'rgba(244,63,94,0.25)'  },
};

// ── Static mock article content (Phase 2: replaced by fetch from public/content/pathways/) ──
const MOCK_ARTICLES: Record<string, {
  title: string; excerpt: string; tags: string[]; readingTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced'; date: string;
  content: string;
  related: Array<{ slug: string; title: string; track: string; trackLabel: string }>;
}> = {
  'ai-scam-awareness': {
    title: 'How Scammers Use AI (And How to Spot It)',
    excerpt: 'AI-generated voice clones, deepfake videos, and automated phishing emails are changing how scams work.',
    tags: ['scams', 'digital-safety', 'deepfakes'],
    readingTime: 5,
    difficulty: 'beginner',
    date: '2026-06-10',
    related: [
      { slug: 'responsible-ai-guide',       title: 'Responsible AI: What It Means for You',     track: 'safety',     trackLabel: 'Safety' },
      { slug: 'deepfakes-and-disinformation', title: 'Deepfakes, Disinformation & Digital Literacy', track: 'safety', trackLabel: 'Safety' },
    ],
    content: `
## Why AI Makes Scams More Dangerous

AI didn't invent scams — but it made them faster, cheaper, and much harder to spot. A scammer who once needed hours to craft a convincing email can now generate thousands of personalised messages in seconds.

Here is what has changed:

- **Voice cloning**: 3 seconds of audio is enough to clone a person's voice with modern AI models
- **Deepfake video**: Real-time face-swapping runs on a standard laptop
- **Automated phishing**: LLMs write personalised, grammatically perfect lures at scale
- **Impersonation at scale**: AI monitors your social media to craft contextually relevant messages

## How a Modern AI Scam Works

\`\`\`mermaid
flowchart LR
    A[Scammer collects\\npublic data] --> B[AI generates\\npersonalised message]
    B --> C[Victim receives\\nbelievable contact]
    C --> D{Victim responds?}
    D -- Yes --> E[Data or money stolen]
    D -- No --> F[Scammer moves to\\nnext target]
\`\`\`

## The Three Red Flags

Most AI scams share three patterns regardless of how they are delivered:

**1. Urgency pressure**

"Act now or lose access." "Your account will be suspended in 24 hours." Urgency bypasses slow, critical thinking and activates fast, reactive decision-making.

**2. Unusual payment or data request**

Legitimate organisations never ask for gift cards, crypto, or one-time passwords over an unsolicited contact — ever.

**3. Too-good or too-bad to be true**

Both extremes are designed to create emotional override — either excitement (prize won) or fear (account hacked). Emotion is the exploit.

## The Pause Protocol

The best defence is a simple three-step pause:

1. **Stop** — do not click, call back, or respond immediately
2. **Verify independently** — use a number or URL you looked up yourself, not one they gave you
3. **Ask someone** — scammers rely on isolation; talking to another person breaks the spell

## Voice Clone Red Flags

A real-time voice clone can be convincing but still shows tells:

- Slight audio artefacts or unnatural pauses
- Can't answer personal questions you'd both know (shared memories, last time you met)
- Refuses a video call or face-to-face

If something feels off, it probably is. Trust your instinct and verify through a separate channel.

## Summary

AI has industrialised scamming. The tactics are old — urgency, impersonation, trust exploitation. The scale and personalisation are new. Recognition is your first line of defence, and a 30-second pause is the most powerful tool you have.
    `.trim(),
  },
  'financial-forecasting-with-ai': {
    title: 'Financial Forecasting with AI: A Practical Guide',
    excerpt: 'How to use regression models and LLMs to predict cash flow, budget variances, and market trends.',
    tags: ['finance', 'forecasting', 'applied-ai'],
    readingTime: 8,
    difficulty: 'intermediate',
    date: '2026-06-10',
    related: [
      { slug: 'ai-for-data-storytelling',   title: 'AI-Powered Data Storytelling',    track: 'applied', trackLabel: 'Applied' },
      { slug: 'automating-reports-with-llms', title: 'Automating Reports with LLMs', track: 'applied', trackLabel: 'Applied' },
    ],
    content: `
## Why AI Changes Financial Forecasting

Traditional forecasting depends on historical averages, linear trend lines, and analyst intuition. AI doesn't replace that — it augments it. The key shift is moving from static models to adaptive ones that update as new data arrives.

## The Forecasting Stack

\`\`\`mermaid
flowchart TD
    A[Raw Financial Data\\nCSV / ERP / Spreadsheet] --> B[Data Cleaning\\n& Feature Engineering]
    B --> C[Regression Model\\nor Time-Series ML]
    C --> D[LLM Narrative Layer\\nExplains the numbers]
    D --> E[Forecast Report\\nwith Scenarios]
\`\`\`

## Step 1: Prepare Your Data

The model is only as good as the input. Before touching any AI:

- **Normalise dates** — consistent YYYY-MM-DD across all rows
- **Handle missing values** — forward-fill for sparse periods, flag for genuine gaps
- **Create lag features** — last month's revenue, 3-month rolling average, YoY delta

## Step 2: Choose Your Model

For most finance practitioners, three models cover 90% of use cases:

| Model | Best For | Complexity |
|-------|----------|------------|
| Linear Regression | Trend + seasonality, explainable | Low |
| XGBoost | Complex patterns, feature interactions | Medium |
| Prophet (Meta) | Time-series with holidays, events | Low |

Start with Prophet for monthly data — it handles seasonality natively.

## Step 3: Add an LLM Narrative Layer

Numbers without narrative don't get actioned. Use an LLM to:

- Summarise what drove the variance vs. budget
- Flag anomalies in plain English before the numbers hit the board
- Generate scenario descriptions ("If Q3 headcount grows 10%...")

\`\`\`
Prompt: "Given these monthly actuals vs. forecast: [data table], 
write a 3-bullet CFO summary highlighting the top variance drivers 
and any risks for Q4. Keep it under 100 words."
\`\`\`

## Summary

AI forecasting is not about replacing the analyst — it is about giving them better inputs faster. Start with clean data, a simple model, and an LLM narrative layer. Complexity comes later; value comes first.
    `.trim(),
  },
};

// Generic placeholder for articles not yet authored
const PLACEHOLDER_CONTENT = (title: string) => `
## Overview

This article is coming soon. The full content for **${title}** will cover the topic with practical examples, Mermaid diagrams, and real-world guidance aligned to your audience track.

## What to Expect

- Clear explanations with no assumed prior knowledge
- Visual diagrams showing how concepts connect
- Practical takeaways you can apply immediately
- Links to related articles in this track

Check back soon — or browse the other articles in this track.
`.trim();

// ── Reading progress bar ──────────────────────────────────────────────────────
function ReadingBar() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const mainEl = document.querySelector('main') as HTMLElement | null;
    const fn = () => {
      const el = mainEl;
      if (!el) return;
      const h = el.scrollHeight - el.clientHeight;
      setPct(h > 0 ? Math.min((el.scrollTop / h) * 100, 100) : 0);
    };
    const target: HTMLElement | Window = mainEl ?? window;
    target.addEventListener('scroll', fn, { passive: true });
    return () => target.removeEventListener('scroll', fn);
  }, []);
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[2px]" style={{ background: 'rgba(15,23,42,0.5)' }}>
      <div
        className="h-full transition-[width] duration-100"
        style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #f43f5e 0%, #f59e0b 50%, #10b981 100%)' }}
      />
    </div>
  );
}

// ── Heading utilities ─────────────────────────────────────────────────────────
function slugify(text: string) {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
}
interface Heading { id: string; text: string; level: number }
function extractHeadings(md: string): Heading[] {
  return md.split('\n')
    .filter(l => /^#{1,3} /.test(l))
    .map(l => ({
      level: (l.match(/^(#+)/)?.[1].length ?? 1),
      text: l.replace(/^#+\s+/, '').trim(),
      id: slugify(l.replace(/^#+\s+/, '').trim()),
    }));
}

// ── Mobile TOC drawer ─────────────────────────────────────────────────────────
function MobileToc({ headings, activeId, onClose }: { headings: Heading[]; activeId: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 lg:hidden" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} />
      <div
        className="absolute bottom-0 left-0 right-0 rounded-t-2xl p-5 max-h-[72vh] overflow-y-auto"
        style={{ background: 'rgba(15,23,42,0.99)', border: '1px solid rgba(71,85,105,0.30)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-black text-white flex items-center gap-2"><List size={14} />Contents</p>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={16} /></button>
        </div>
        <nav className="space-y-1">
          {headings.map(({ id, text, level }) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={e => { e.preventDefault(); onClose(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
              className="block py-1.5 text-sm rounded-lg transition-all"
              style={{ paddingLeft: level === 3 ? '24px' : '8px', color: activeId === id ? '#a78bfa' : '#94a3b8', fontWeight: activeId === id ? 700 : 400 }}
            >
              {text}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function PathwayArticle() {
  const { track, slug } = useParams<{ track: string; slug: string }>();
  const [mounted, setMounted] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [activeId, setActiveId] = useState('');
  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);

  const trackId = (track ?? 'safety') as TrackId;
  const meta = TRACK_META[trackId] ?? TRACK_META.safety;
  const Icon = meta.icon;
  const article = MOCK_ARTICLES[slug ?? ''] ?? null;
  const diff = article ? DIFFICULTY_STYLE[article.difficulty] : DIFFICULTY_STYLE.beginner;
  const content = article ? article.content : PLACEHOLDER_CONTENT(slug ?? 'This Article');
  const headings = useMemo(() => extractHeadings(content), [content]);

  // Format raw slug into readable title when article data is missing
  const fallbackTitle = (slug ?? '')
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  const displayTitle = article?.title ?? fallbackTitle;

  useMeta({
    title: `${displayTitle} — Horizons`,
    description: article?.excerpt,
  });

  // Active heading tracking
  useEffect(() => {
    if (!headings.length) return;
    const mainEl = document.querySelector('main') as HTMLElement | null;
    const THRESHOLD = 120;
    const fn = () => {
      const passed = headings
        .map(({ id }) => ({ id, top: document.getElementById(id)?.getBoundingClientRect().top ?? Infinity }))
        .filter(({ top }) => top < THRESHOLD)
        .sort((a, b) => b.top - a.top);
      if (passed.length) setActiveId(prev => prev === passed[0].id ? prev : passed[0].id);
    };
    const target: HTMLElement | Window = mainEl ?? window;
    target.addEventListener('scroll', fn, { passive: true });
    fn();
    return () => target.removeEventListener('scroll', fn);
  }, [headings]);

  return (
    <>
      <ReadingBar />

      <div className="max-w-5xl mx-auto">



        <div className="flex gap-8">

          {/*━━━━ ARTICLE */}
          <article
            ref={articleRef}
            className={`flex-1 min-w-0 transition-all duration-700 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            {/* Article header */}
            <header className="mb-8">
              {/* Track + difficulty badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Link
                  to={`/horizons/${trackId}`}
                  className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-full transition-opacity hover:opacity-80"
                  style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}
                >
                  <Icon size={8} /> {meta.label}
                </Link>
                {article && (
                  <span
                    className="text-[9px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-full"
                    style={{ color: diff.color, background: diff.bg, border: `1px solid ${diff.border}` }}
                  >
                    {diff.label}
                  </span>
                )}
                <span
                  className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full"
                  style={{ color: '#64748b', background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(71,85,105,0.20)' }}
                >
                  <Users size={8} /> {meta.audience}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight mb-4">
                {displayTitle}
              </h1>

              {article && (
                <p className="text-base text-slate-400 leading-relaxed mb-5 max-w-2xl">
                  {article.excerpt}
                </p>
              )}

              {/* Meta row */}
              {article && (
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pb-5"
                  style={{ borderBottom: '1px solid rgba(71,85,105,0.18)' }}>
                  <span className="flex items-center gap-1.5"><Clock size={11} /> {article.readingTime} min read</span>
                  <span className="flex items-center gap-1.5">
                    {new Date(article.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                  {/* Mobile TOC toggle */}
                  <button
                    onClick={() => setShowToc(true)}
                    className="lg:hidden flex items-center gap-1 ml-auto transition-colors hover:text-slate-300"
                  >
                    <List size={11} /> Contents
                  </button>
                </div>
              )}
            </header>

            {/* Article body */}
            <div className="prose-pathways">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  h2: ({ children }) => {
                    const text = String(children);
                    const id = slugify(text);
                    return (
                      <h2
                        id={id}
                        className="text-xl font-black text-white mt-10 mb-4 scroll-mt-24"
                      >
                        {children}
                      </h2>
                    );
                  },
                  h3: ({ children }) => {
                    const text = String(children);
                    const id = slugify(text);
                    return (
                      <h3 id={id} className="text-base font-black text-white mt-8 mb-3 scroll-mt-24">
                        {children}
                      </h3>
                    );
                  },
                  p: ({ children }) => (
                    <p className="text-slate-300 leading-relaxed mb-4 text-[15px]">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="space-y-2 mb-4 pl-4">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="space-y-2 mb-4 pl-4 list-decimal list-inside text-slate-300">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-slate-300 text-[15px] leading-relaxed flex gap-2">
                      <span style={{ color: meta.color }} className="mt-1.5 shrink-0">▸</span>
                      <span>{children}</span>
                    </li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-black text-white">{children}</strong>
                  ),
                  code: ({ children, className }) => {
                    const lang = className?.replace('language-', '') ?? '';
                    if (lang === 'mermaid') {
                      return (
                        <Suspense fallback={
                          <div className="rounded-xl p-4 text-center text-slate-600 text-sm animate-pulse"
                            style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(71,85,105,0.20)' }}>
                            Loading diagram…
                          </div>
                        }>
                          <MermaidDiagram chart={String(children).trim()} />
                        </Suspense>
                      );
                    }
                    return (
                      <code
                        className="text-xs font-mono px-1.5 py-0.5 rounded-md"
                        style={{ background: 'rgba(30,41,59,0.9)', color: meta.color, border: '1px solid rgba(71,85,105,0.25)' }}
                      >
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children }) => (
                    <pre
                      className="rounded-xl p-4 sm:p-5 text-xs sm:text-sm overflow-x-auto leading-relaxed font-mono my-5"
                      style={{ background: 'rgba(2,6,23,0.98)', border: '1px solid rgba(71,85,105,0.28)', color: '#e2e8f0' }}
                    >
                      {children}
                    </pre>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote
                      className="my-5 pl-4 py-1 italic text-slate-400 text-[15px] leading-relaxed"
                      style={{ borderLeft: `3px solid ${meta.color}` }}
                    >
                      {children}
                    </blockquote>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-5 rounded-xl" style={{ border: '1px solid rgba(71,85,105,0.25)' }}>
                      <table className="w-full text-sm text-slate-300">{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead style={{ background: 'rgba(15,23,42,0.98)', borderBottom: '1px solid rgba(71,85,105,0.25)' }}>
                      {children}
                    </thead>
                  ),
                  th: ({ children }) => (
                    <th className="px-4 py-2 text-left text-[11px] font-black uppercase tracking-wider text-slate-500">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-4 py-2.5 text-slate-300 text-[13px]" style={{ borderTop: '1px solid rgba(71,85,105,0.15)' }}>
                      {children}
                    </td>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      className="underline underline-offset-2 transition-colors"
                      style={{ color: meta.color }}
                      target={href?.startsWith('http') ? '_blank' : undefined}
                      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                    >
                      {children}
                    </a>
                  ),
                  hr: () => (
                    <hr className="my-8" style={{ borderColor: 'rgba(71,85,105,0.20)' }} />
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          </article>

          {/*━━━━ SIDEBAR (desktop only) */}
          <aside className="hidden lg:flex flex-col w-[200px] xl:w-[220px] shrink-0 sticky top-4 self-start max-h-[calc(100vh-5rem)] gap-3 overflow-y-auto pb-4"
            style={{ scrollbarWidth: 'none' }}>

            {/* Track info */}
            <div className="rounded-xl p-4"
              style={{ background: 'rgba(15,23,42,0.95)', border: `1px solid ${meta.border}` }}>
              <div className="h-[2px] rounded-full mb-3" style={{ background: `linear-gradient(90deg,${meta.color},transparent)` }} />
              <Link
                to={`/horizons/${trackId}`}
                className="flex items-center gap-2 mb-3 group"
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: meta.bg, border: `1px solid ${meta.border}` }}>
                  <Icon size={13} style={{ color: meta.color }} />
                </div>
                <span className="text-[11px] font-bold transition-colors group-hover:text-white"
                  style={{ color: meta.color }}>
                  {meta.label}
                </span>
              </Link>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <Users size={9} /> {meta.audience}
              </div>
              {article && (
                <>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1.5">
                    <Clock size={9} /> {article.readingTime} min read
                  </div>
                  <span
                    className="inline-block mt-2 text-[9px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-full"
                    style={{ color: diff.color, background: diff.bg, border: `1px solid ${diff.border}` }}
                  >
                    {diff.label}
                  </span>
                </>
              )}
            </div>

            {/* TOC */}
            {headings.length > 0 && (
              <div className="rounded-xl p-4"
                style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(71,85,105,0.20)' }}>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-1.5">
                  <List size={9} /> In this article
                </p>
                <nav className="space-y-0.5">
                  {headings.map(({ id, text, level }) => {
                    const isActive = activeId === id;
                    return (
                      <a
                        key={id}
                        href={`#${id}`}
                        onClick={e => {
                          e.preventDefault();
                          document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        className="block text-[11px] leading-snug py-1 rounded-r-lg transition-all duration-200"
                        style={{
                          paddingLeft: level === 3 ? '16px' : '6px',
                          color: isActive ? meta.color : '#64748b',
                          fontWeight: isActive ? 700 : 400,
                          borderLeft: `2px solid ${isActive ? meta.color : 'transparent'}`,
                        }}
                      >
                        {text}
                      </a>
                    );
                  })}
                </nav>
              </div>
            )}

            {/* Tags */}
            {article && article.tags.length > 0 && (
              <div className="rounded-xl p-4"
                style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(71,85,105,0.20)' }}>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                  <Tag size={9} /> Tags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {article.tags.map(tag => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded-lg"
                      style={{ background: 'rgba(30,41,59,0.8)', color: '#64748b', border: '1px solid rgba(71,85,105,0.20)' }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Related articles */}
            {article && article.related.length > 0 && (
              <div className="rounded-xl p-4"
                style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(71,85,105,0.20)' }}>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">
                  Related
                </p>
                <div className="space-y-2">
                  {article.related.map(rel => (
                    <Link
                      key={rel.slug}
                      to={`/horizons/${rel.track}/${rel.slug}`}
                      className="block text-[11px] leading-snug text-slate-400 hover:text-white transition-colors py-1"
                    >
                      {rel.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Mobile TOC drawer */}
      {showToc && <MobileToc headings={headings} activeId={activeId} onClose={() => setShowToc(false)} />}
    </>
  );
}
