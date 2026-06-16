import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ShieldCheck, TrendingUp, Brain, Zap,
  ArrowRight, Clock, Users,
  BookOpen, BarChart2,
} from 'lucide-react';
import { useMeta } from '@/lib/useMeta';

// ── Track metadata ─────────────────────────────────────────────────────────────
const TRACK_META = {
  safety: {
    label: 'AI Safety & Responsibility',
    audience: 'Teens 13–18',
    description:
      'Learn how AI is used in scams, deepfakes, and disinformation — and how to stay safe and responsible online.',
    color: '#38bdf8',
    bg: 'rgba(56,189,248,0.08)',
    border: 'rgba(56,189,248,0.22)',
    icon: ShieldCheck,
  },
  applied: {
    label: 'Applied AI for Practitioners',
    audience: 'Finance & Data Professionals',
    description:
      'Practical AI skills for financial modeling, data storytelling, forecasting, and workflow automation.',
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.08)',
    border: 'rgba(251,191,36,0.22)',
    icon: TrendingUp,
  },
  ethics: {
    label: 'AI Ethics & Bias',
    audience: 'Students 16+',
    description:
      'Understand algorithmic bias, fairness in ML, and how governance frameworks keep AI accountable.',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.08)',
    border: 'rgba(167,139,250,0.22)',
    icon: Brain,
  },
  productivity: {
    label: 'AI Productivity',
    audience: 'Students & Professionals',
    description:
      'Use AI as a force multiplier for studying, writing, automation, and prompt engineering.',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.22)',
    icon: Zap,
  },
} as const;

type TrackId = keyof typeof TRACK_META;

// ── Static mock articles ──────────────────────────────────────────────────────
const MOCK_ARTICLES: Record<
  TrackId,
  Array<{
    slug: string;
    title: string;
    excerpt: string;
    tags: string[];
    readingTime: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    date: string;
  }>
> = {
  safety: [
    {
      slug: 'ai-scam-awareness',
      title: 'How Scammers Use AI (And How to Spot It)',
      excerpt:
        'AI-generated voice clones, deepfake videos, and automated phishing emails are changing how scams work. Here is what to watch for and how to protect yourself.',
      tags: ['scams', 'digital-safety', 'deepfakes'],
      readingTime: 5,
      difficulty: 'beginner',
      date: '2026-06-10',
    },
    {
      slug: 'responsible-ai-guide',
      title: 'Responsible AI: What It Means for You',
      excerpt:
        'Responsibility in AI is not just for engineers — it starts with how you search, share, and trust information online.',
      tags: ['responsible-ai', 'digital-literacy'],
      readingTime: 4,
      difficulty: 'beginner',
      date: '2026-06-12',
    },
    {
      slug: 'deepfakes-and-disinformation',
      title: 'Deepfakes, Disinformation & Digital Literacy',
      excerpt:
        'AI-generated media is now indistinguishable from real content. Understanding how deepfakes are made is the first step to spotting them.',
      tags: ['deepfakes', 'disinformation', 'media-literacy'],
      readingTime: 6,
      difficulty: 'intermediate',
      date: '2026-06-14',
    },
  ],
  applied: [
    {
      slug: 'financial-forecasting-with-ai',
      title: 'Financial Forecasting with AI: A Practical Guide',
      excerpt:
        'How to use regression models and LLMs to predict cash flow, budget variances, and market trends — without a data science degree.',
      tags: ['finance', 'forecasting', 'applied-ai'],
      readingTime: 8,
      difficulty: 'intermediate',
      date: '2026-06-10',
    },
    {
      slug: 'ai-for-data-storytelling',
      title: 'AI-Powered Data Storytelling',
      excerpt:
        'Turning raw numbers into a clear narrative is where most analysts struggle. AI closes that gap faster than any BI tool.',
      tags: ['data', 'storytelling', 'dashboards'],
      readingTime: 7,
      difficulty: 'intermediate',
      date: '2026-06-12',
    },
    {
      slug: 'automating-reports-with-llms',
      title: 'Automating Reports with LLMs',
      excerpt:
        'Monthly reporting cycles that take days can be compressed to hours using structured prompts and LLM pipelines.',
      tags: ['automation', 'llm', 'productivity'],
      readingTime: 6,
      difficulty: 'intermediate',
      date: '2026-06-14',
    },
  ],
  ethics: [
    {
      slug: 'bias-in-ai-systems',
      title: 'Bias in AI Systems: How It Happens',
      excerpt:
        'Algorithmic bias is not a bug — it is a feature of how models learn from human-generated data. Understanding the sources changes how you build and use AI.',
      tags: ['bias', 'fairness', 'ml'],
      readingTime: 6,
      difficulty: 'beginner',
      date: '2026-06-10',
    },
    {
      slug: 'fairness-in-ml',
      title: 'Fairness in Machine Learning',
      excerpt:
        'There are at least seven definitions of "fairness" in ML — and they contradict each other. Here is how to navigate them in real projects.',
      tags: ['fairness', 'ethics', 'ml'],
      readingTime: 7,
      difficulty: 'intermediate',
      date: '2026-06-12',
    },
    {
      slug: 'ai-governance-for-students',
      title: 'AI Governance Frameworks for Students',
      excerpt:
        'EU AI Act, NIST AI RMF, OECD Principles — the governance landscape is dense. This guide maps it clearly for newcomers.',
      tags: ['governance', 'policy', 'ai-act'],
      readingTime: 5,
      difficulty: 'intermediate',
      date: '2026-06-14',
    },
  ],
  productivity: [
    {
      slug: 'ai-study-assistant',
      title: 'AI as Your Study Assistant',
      excerpt:
        'Summarise papers, generate practice questions, build study schedules — LLMs are the study tool that adapts to you, not the other way around.',
      tags: ['studying', 'llm', 'education'],
      readingTime: 4,
      difficulty: 'beginner',
      date: '2026-06-10',
    },
    {
      slug: 'automating-workflows-with-ai',
      title: 'Automating Repetitive Workflows with AI',
      excerpt:
        'Identifying which workflows are worth automating — and building the right prompts to do it reliably without hallucinations breaking the chain.',
      tags: ['automation', 'workflows', 'prompting'],
      readingTime: 6,
      difficulty: 'intermediate',
      date: '2026-06-12',
    },
    {
      slug: 'prompt-engineering-for-productivity',
      title: 'Prompt Engineering for Productivity',
      excerpt:
        'The prompts that save the most time are not clever one-liners — they are structured, consistent, and reusable across contexts.',
      tags: ['prompts', 'prompt-engineering', 'productivity'],
      readingTime: 5,
      difficulty: 'beginner',
      date: '2026-06-14',
    },
  ],
};

const DIFFICULTY_STYLE = {
  beginner:     { label: 'Beginner',     color: '#10b981', bg: 'rgba(16,185,129,0.10)',  border: 'rgba(16,185,129,0.25)'  },
  intermediate: { label: 'Intermediate', color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)' },
  advanced:     { label: 'Advanced',     color: '#f43f5e', bg: 'rgba(244,63,94,0.10)',  border: 'rgba(244,63,94,0.25)'  },
};

// ── Article card (hybrid SkillUp + Blog style) ────────────────────────────────
function ArticleCard({
  article,
  track,
  trackMeta,
  idx,
}: {
  article: (typeof MOCK_ARTICLES.safety)[0];
  track: string;
  trackMeta: (typeof TRACK_META)[TrackId];
  idx: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const diff = DIFFICULTY_STYLE[article.difficulty];
  const { color: trackColor, border: trackBorder } = trackMeta;

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.05, rootMargin: '50px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className={`group relative rounded-2xl overflow-hidden transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{
        background: 'rgba(8,15,30,0.97)',
        border: '1px solid rgba(71,85,105,0.20)',
        transitionDelay: `${Math.min(idx, 8) * 80}ms`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.border = `1px solid ${trackBorder}`;
        (e.currentTarget as HTMLElement).style.boxShadow = `0 16px 56px -16px ${trackColor}22`;
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.border = '1px solid rgba(71,85,105,0.20)';
        (e.currentTarget as HTMLElement).style.boxShadow = '';
        (e.currentTarget as HTMLElement).style.transform = '';
      }}
    >
      {/* Top accent line — fades in on hover like SkillUp */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-50 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, ${trackColor}, transparent 70%)` }}
      />

      {/* Ambient corner glow (SkillUp pattern) */}
      <div
        className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${trackColor}18 0%, transparent 70%)` }}
      />

      <div className="relative p-5 sm:p-6">

        {/* ── Top row: difficulty badge + date (Blog-style meta) */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span
            className="text-[9px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-lg"
            style={{ color: diff.color, background: diff.bg, border: `1px solid ${diff.border}` }}
          >
            {diff.label}
          </span>
          <span className="text-[10px] text-slate-600 ml-auto">
            {new Date(article.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        {/* ── Title (Blog-style, hover colour shift) */}
        <h3
          className="text-lg font-black text-white leading-snug mb-2 transition-colors duration-200"
          style={{ letterSpacing: '-0.01em' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#e2e8f0')}
        >
          {article.title}
        </h3>

        {/* ── Excerpt (Blog-style) */}
        <p className="text-sm text-slate-400 leading-relaxed mb-5 line-clamp-2">
          {article.excerpt}
        </p>

        {/* ── Stats row (SkillUp pattern) */}
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 mb-5 text-[12px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <Clock size={11} style={{ color: trackColor }} />
            <span className="text-white font-bold">{article.readingTime}</span> min read
          </span>
          <span className="flex items-center gap-1.5">
            <BarChart2 size={11} style={{ color: trackColor }} />
            <span className="text-white font-bold capitalize">{article.difficulty}</span>
          </span>
        </div>

        {/* ── Tags (Blog-style pills) */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'rgba(15,23,42,0.8)', color: '#64748b', border: '1px solid rgba(71,85,105,0.18)' }}
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* ── CTA button (SkillUp-style gradient button) */}
        <Link
          to={`/horizons/${track}/${article.slug}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${trackColor}, ${trackColor}cc)`,
            border: `1px solid ${trackBorder}`,
            boxShadow: `0 4px 16px -4px ${trackColor}30`,
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px -6px ${trackColor}50`)}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px -4px ${trackColor}30`)}
        >
          <BookOpen size={13} /> Read article <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function PathwayTrack() {
  const { track } = useParams<{ track: string }>();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);

  const trackId = (track ?? 'safety') as TrackId;
  const meta = TRACK_META[trackId] ?? TRACK_META.safety;
  const articles = MOCK_ARTICLES[trackId] ?? [];
  const Icon = meta.icon;

  useMeta({
    title: `${meta.label} — Horizons`,
    description: meta.description,
  });

  return (
    <div className="space-y-10 max-w-4xl mx-auto">

      {/*━━━━ TRACK HEADER */}
      <section
        className={`transition-all duration-700 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(15,23,42,0.95)', border: `1px solid ${meta.border}` }}
        >
          <div
            className="h-[2px] w-full"
            style={{ background: `linear-gradient(90deg, ${meta.color}, transparent)` }}
          />
          <div className="p-6 flex flex-col sm:flex-row items-start gap-5">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: meta.bg,
                border: `2px solid ${meta.color}`,
                boxShadow: `0 0 24px -8px ${meta.color}50`,
              }}
            >
              <Icon size={22} style={{ color: meta.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-full"
                  style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}
                >
                  <Users size={8} /> {meta.audience}
                </span>
                <span className="text-[10px] text-slate-600">
                  {articles.length} articles
                </span>
              </div>
              <h1 className="text-2xl font-black text-white mb-2">{meta.label}</h1>
              <p className="text-sm text-slate-400 leading-relaxed">{meta.description}</p>
            </div>
          </div>
        </div>
      </section>

      {/*━━━━ ARTICLES */}
      <section
        className={`transition-all duration-700 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
        style={{ transitionDelay: '80ms' }}
      >
        <p
          className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-4"
        >
          {articles.length} article{articles.length !== 1 ? 's' : ''}
        </p>
        <div className="space-y-4">
          {articles.map((article, idx) => (
            <ArticleCard
              key={article.slug}
              article={article}
              track={trackId}
              trackMeta={meta}
              idx={idx}
            />
          ))}
        </div>
      </section>

      {/*━━━━ ALL PATHWAYS LINK */}
      <section
        className={`transition-all duration-700 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
        style={{ transitionDelay: '200ms' }}
      >
        <div
          className="rounded-2xl p-5 flex items-center justify-between gap-4"
          style={{ background: 'rgba(15,23,42,0.60)', border: '1px solid rgba(71,85,105,0.18)' }}
        >
          <p className="text-sm text-slate-400">
            Want to explore a different audience track?
          </p>
          <Link
            to="/horizons"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all hover:-translate-y-0.5"
            style={{
              color: meta.color,
              background: meta.bg,
              border: `1px solid ${meta.border}`,
            }}
          >
            All Horizons <ArrowRight size={13} />
          </Link>
        </div>
      </section>

    </div>
  );
}
