import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Clock, Tag, Search, X, ChevronDown, ChevronUp,
  ArrowRight, LayoutList, Layers, CheckCircle2, BookOpen,
} from 'lucide-react';
import { loadBlogManifest } from '../lib/content-loader';
import type { BlogPostMeta } from '../types/content';

// ── Category palette ─────────────────────────────────────────────────────────
const CAT_PALETTE: Record<string, { color: string; bg: string; border: string }> = {
  Azure:            { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.30)' },
  DevOps:           { color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.30)' },
  Cloud:            { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',  border: 'rgba(6,182,212,0.30)'  },
  'AI Architecture':{ color: '#a78bfa', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.30)' },
  Opinions:         { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.30)' },
};
const defaultPalette = { color: '#64748b', bg: 'rgba(30,41,59,0.5)', border: 'rgba(71,85,105,0.25)' };

// ── Read tracking ────────────────────────────────────────────────────────────
const STORAGE_KEY = 'blog:read';
function getReadSlugs(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as string[]); }
  catch { return new Set(); }
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-2xl p-5 animate-pulse"
      style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(71,85,105,0.15)' }}>
      <div className="h-2 rounded-full bg-slate-800 w-16 mb-3" />
      <div className="h-5 bg-slate-700 rounded-lg w-3/4 mb-2" />
      <div className="h-3 bg-slate-800 rounded w-full mb-1" />
      <div className="h-3 bg-slate-800 rounded w-2/3 mb-4" />
      <div className="flex gap-2">
        <div className="h-2.5 bg-slate-800 rounded w-14" />
        <div className="h-2.5 bg-slate-800 rounded w-16" />
      </div>
    </div>
  );
}

// ── Hero card ─────────────────────────────────────────────────────────────────
function HeroCard({ post, isRead }: { post: BlogPostMeta; isRead: boolean }) {
  const pal = CAT_PALETTE[post.category] ?? defaultPalette;
  return (
    <Link to={`/blog/${post.slug}`}
      className="group block mb-6 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{
        background: `linear-gradient(135deg, ${pal.bg.replace('0.12', '0.18')} 0%, rgba(15,23,42,0.98) 70%)`,
        border: `1px solid ${pal.border}`,
        boxShadow: `0 0 60px -20px ${pal.color}25`,
      }}>
      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {post.featured && (
            <span className="text-[9px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-lg"
              style={{ color: '#fbbf24', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)' }}>
              ★ Featured
            </span>
          )}
          {post.category && (
            <span className="text-[9px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-lg"
              style={{ color: pal.color, background: pal.bg, border: `1px solid ${pal.border}` }}>
              {post.category}
            </span>
          )}
          {isRead && (
            <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-lg"
              style={{ color: '#34d399', background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.25)' }}>
              <CheckCircle2 size={9} /> Read
            </span>
          )}
          <span className="text-[11px] text-slate-500 flex items-center gap-1 ml-auto">
            <Calendar size={10} />
            {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight mb-3 transition-colors duration-200 group-hover:text-violet-200">
          {post.title}
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-5 max-w-2xl line-clamp-3">{post.excerpt}</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {post.tags.slice(0, 5).map((tag) => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md"
                style={{ background: 'rgba(30,41,59,0.8)', color: '#64748b', border: '1px solid rgba(71,85,105,0.20)' }}>
                #{tag}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Clock size={11} /> {post.readingTime} min read
            </span>
            <span className="flex items-center gap-1 text-sm font-bold transition-all duration-200 group-hover:gap-2"
              style={{ color: pal.color }}>
              Read article <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Post card ─────────────────────────────────────────────────────────────────
function PostCard({
  post, idx, onTagClick, showYear, isRead,
}: {
  post: BlogPostMeta; idx: number; onTagClick: (t: string) => void; showYear: boolean; isRead: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const cardRef = useRef<HTMLAnchorElement>(null);
  const pal = CAT_PALETTE[post.category] ?? defaultPalette;

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

  const dateStr = new Date(post.date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', ...(showYear ? { year: 'numeric' } : {}),
  });

  return (
    <Link
      ref={cardRef}
      to={`/blog/${post.slug}`}
      className={`group relative block rounded-2xl overflow-hidden transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(71,85,105,0.20)', transitionDelay: `${idx * 35}ms` }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = pal.border;
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
        (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px -8px ${pal.color}20`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(71,85,105,0.20)';
        (e.currentTarget as HTMLElement).style.transform = '';
        (e.currentTarget as HTMLElement).style.boxShadow = '';
      }}
    >
      {/* Category accent bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, ${pal.color}, transparent)` }} />

      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[9px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-lg"
            style={{ color: pal.color, background: pal.bg, border: `1px solid ${pal.border}` }}>
            {post.category}
          </span>
          {isRead && (
            <span className="flex items-center gap-0.5 text-[9px] font-bold ml-auto" style={{ color: '#34d399' }}>
              <CheckCircle2 size={9} /> Read
            </span>
          )}
        </div>

        <h2 className="text-sm font-bold text-white leading-snug mb-2 line-clamp-2 transition-colors duration-200 group-hover:text-violet-200">
          {post.title}
        </h2>
        <p className="text-slate-500 text-xs leading-relaxed mb-3 line-clamp-2">{post.excerpt}</p>

        <div className="flex items-center gap-3 text-[11px] text-slate-600 mb-3">
          <span className="flex items-center gap-1"><Calendar size={10} />{dateStr}</span>
          <span className="flex items-center gap-1"><Clock size={10} />{post.readingTime} min</span>
        </div>

        <div className="flex flex-wrap gap-1">
          {post.tags.slice(0, 3).map((tag) => (
            <button key={tag} onClick={(e) => { e.preventDefault(); onTagClick(tag); }}
              className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md transition-colors"
              style={{ background: 'rgba(30,41,59,0.8)', color: '#475569', border: '1px solid rgba(71,85,105,0.20)' }}>
              <Tag size={8} />{tag}
            </button>
          ))}
          {post.tags.length > 3 && <span className="text-[10px] text-slate-700">+{post.tags.length - 3}</span>}
        </div>

        <div className="flex justify-end mt-2">
          <ArrowRight size={13}
            className="text-slate-700 transition-all duration-200 group-hover:text-violet-400 group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
type ViewMode = 'timeline' | 'category';
const PAGE_SIZE = 12;

export default function Blog() {
  const [posts, setPosts] = useState<BlogPostMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [readSlugs, setReadSlugs] = useState<Set<string>>(new Set());
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [showAllTags, setShowAllTags] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setReadSlugs(getReadSlugs());
    loadBlogManifest()
      .then((m) => { setPosts(m.posts.filter((p) => !p.draft)); setLoading(false); })
      .catch(() => setLoading(false));
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const allCategories = useMemo(() => [...new Set(posts.map((p) => p.category))], [posts]);
  const tagCounts = useMemo(() => {
    const c: Record<string, number> = {};
    posts.forEach((p) => p.tags.forEach((t) => { c[t] = (c[t] ?? 0) + 1; }));
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }, [posts]);
  const allYears = useMemo(() => {
    const ys = [...new Set(posts.map((p) => new Date(p.date).getFullYear()))];
    return ys.sort((a, b) => b - a);
  }, [posts]);
  const dateRange = useMemo(() => {
    if (!posts.length) return '';
    const ys = posts.map((p) => new Date(p.date).getFullYear());
    const min = Math.min(...ys), max = Math.max(...ys);
    return min === max ? `${min}` : `${min}–${max}`;
  }, [posts]);

  const hasFilters = !!(selectedTag || selectedCategory || searchQuery);
  const filteredPosts = useMemo(() => posts.filter((p) => {
    if (selectedTag && !p.tags.includes(selectedTag)) return false;
    if (selectedCategory && p.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q));
    }
    return true;
  }), [posts, selectedTag, selectedCategory, searchQuery]);

  const heroPost = useMemo(() => hasFilters ? null : (posts.find((p) => p.featured) ?? posts[0] ?? null), [posts, hasFilters]);
  const bodyPosts = useMemo(() => heroPost ? filteredPosts.filter((p) => p.slug !== heroPost.slug) : filteredPosts, [filteredPosts, heroPost]);
  const pagedPosts = useMemo(() => hasFilters ? bodyPosts : bodyPosts.slice(0, page * PAGE_SIZE), [bodyPosts, page, hasFilters]);
  const postsByYear = useMemo(() => {
    const m: Record<number, BlogPostMeta[]> = {};
    pagedPosts.forEach((p) => { const y = new Date(p.date).getFullYear(); (m[y] ??= []).push(p); });
    return m;
  }, [pagedPosts]);
  const postsByCategory = useMemo(() => {
    const m: Record<string, BlogPostMeta[]> = {};
    pagedPosts.forEach((p) => { (m[p.category] ??= []).push(p); });
    return m;
  }, [pagedPosts]);

  const readCount = useMemo(() => posts.filter(p => readSlugs.has(p.slug)).length, [posts, readSlugs]);
  const clearFilters = () => { setSelectedTag(null); setSelectedCategory(null); setSearchQuery(''); setPage(1); };
  const handleTagClick = (t: string) => { setSelectedTag((prev) => prev === t ? null : t); setPage(1); };

  if (loading) {
    return (
      <div>
        <div className="relative rounded-2xl mb-6 px-6 py-8 animate-pulse"
          style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(71,85,105,0.15)' }}>
          <div className="h-3 bg-slate-800 rounded w-20 mb-3" />
          <div className="h-10 bg-slate-700 rounded-lg w-48 mb-3" />
          <div className="h-4 bg-slate-800 rounded w-80 mb-5" />
          <div className="flex gap-5">
            {[0, 1, 2, 3].map(i => <div key={i} className="h-6 bg-slate-800 rounded w-16" />)}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Page header ── */}
      <div
        className={`relative pb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        style={{ borderBottom: '1px solid rgba(71,85,105,0.10)' }}
      >
        <div className="absolute -top-12 -left-20 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)' }} />

        <div className="relative z-10 lg:max-w-[75%]">
          <span
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full mb-4"
            style={{ color: '#a78bfa', background: 'rgba(139,92,246,0.10)', border: '1px solid rgba(139,92,246,0.25)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Practitioner Writing
          </span>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-[1.06] mb-4">
            Field{' '}
            <span style={{ background: 'linear-gradient(100deg, #a78bfa 0%, #38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Notes
            </span>.
          </h1>

          <p className="text-sm text-slate-400 leading-relaxed mb-6">
            Architecture decisions, field notes, and patterns from building AI systems in production. No padding. No filler.
          </p>

          {/* Inline stats row */}
          {!loading && posts.length > 0 && (
            <div className="flex flex-wrap items-center text-xs">
              {[
                { value: posts.length,        label: 'articles',   color: '#a78bfa' },
                { value: dateRange,            label: 'span',       color: '#38bdf8' },
                { value: allCategories.length, label: 'categories', color: '#10b981' },
                { value: tagCounts.length,     label: 'tags',       color: '#f59e0b' },
              ].map(({ value, label, color }, i) => (
                <div key={label} className="flex items-center">
                  {i > 0 && <span className="mx-3.5" style={{ color: 'rgba(71,85,105,0.40)' }}>|</span>}
                  <span className="font-black" style={{ color }}>{value}</span>
                  <span className="text-slate-600 ml-1.5">{label}</span>
                </div>
              ))}
              {readCount > 0 && (
                <div className="flex items-center">
                  <span className="mx-3.5" style={{ color: 'rgba(71,85,105,0.40)' }}>|</span>
                  <BookOpen size={10} style={{ color: '#34d399' }} className="mr-1" />
                  <span className="font-black" style={{ color: '#34d399' }}>{readCount}</span>
                  <span className="text-slate-600 ml-1.5">read</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Search ───────────────────────────────────────────────────────────── */}
      <div className="mb-4 relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input type="text" placeholder="Search posts, tags, topics…" value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          className="w-full pl-10 pr-9 py-2.5 rounded-xl text-sm text-white placeholder-slate-600 transition-all focus:outline-none"
          style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(71,85,105,0.25)' }}
          onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'rgba(139,92,246,0.45)'; }}
          onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'rgba(71,85,105,0.25)'; }}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── Filter bar ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {allCategories.map((cat) => {
          const isActive = selectedCategory === cat;
          const { color } = CAT_PALETTE[cat] ?? defaultPalette;
          return (
            <button key={cat}
              onClick={() => { setSelectedCategory(selectedCategory === cat ? null : cat); setPage(1); }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200"
              style={isActive
                ? { background: `${color}1a`, border: `1px solid ${color}50`, color }
                : { background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(71,85,105,0.20)', color: '#64748b' }}>
              {cat}
            </button>
          );
        })}
        <button onClick={() => setShowAllTags(!showAllTags)}
          className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          style={showAllTags || selectedTag
            ? { background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.30)', color: '#34d399' }
            : { background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(71,85,105,0.20)', color: '#64748b' }}>
          <Tag size={11} />
          {selectedTag ? `#${selectedTag}` : 'Tags'}
          {showAllTags ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </button>
        {hasFilters && (
          <button onClick={clearFilters}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={{ background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.25)', color: '#fb7185' }}>
            Clear all
          </button>
        )}
        <div className="ml-auto flex items-center gap-0.5 rounded-xl p-0.5"
          style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(71,85,105,0.20)' }}>
          {(['timeline', 'category'] as const).map((m) => (
            <button key={m} onClick={() => setViewMode(m)}
              title={m === 'timeline' ? 'Timeline view' : 'Category view'}
              className="p-1.5 rounded-lg transition-all"
              style={viewMode === m ? { background: '#7c3aed', color: 'white' } : { color: '#475569' }}>
              {m === 'timeline' ? <LayoutList size={14} /> : <Layers size={14} />}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tag cloud ────────────────────────────────────────────────────────── */}
      {showAllTags && (
        <div className="mb-5 flex flex-wrap gap-1.5">
          {tagCounts.map(([tag, count]) => (
            <button key={tag} onClick={() => handleTagClick(tag)}
              className="px-2 py-0.5 rounded-lg text-[11px] transition-all flex items-center gap-1"
              style={selectedTag === tag
                ? { background: 'rgba(16,185,129,0.18)', border: '1px solid rgba(16,185,129,0.35)', color: '#34d399' }
                : { background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(71,85,105,0.18)', color: '#475569' }}>
              #{tag}<span className="text-[9px] font-bold opacity-50">{count}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Count line ───────────────────────────────────────────────────────── */}
      <div className="mb-4 text-xs text-slate-600">
        {hasFilters
          ? `Showing ${filteredPosts.length} of ${posts.length} posts${searchQuery ? ` for "${searchQuery}"` : ''}`
          : `${posts.length} posts · showing ${Math.min(page * PAGE_SIZE + (heroPost ? 1 : 0), posts.length)}`}
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      {heroPost && !hasFilters && <HeroCard post={heroPost} isRead={readSlugs.has(heroPost.slug)} />}

      {/* ── Posts ────────────────────────────────────────────────────────────── */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-16 rounded-2xl"
          style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(71,85,105,0.15)' }}>
          <p className="text-slate-500 text-sm mb-3">No posts found.</p>
          {hasFilters && (
            <button onClick={clearFilters}
              className="text-xs px-4 py-2 rounded-xl font-bold transition-all"
              style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: '#a78bfa' }}>
              Clear filters
            </button>
          )}
        </div>
      ) : viewMode === 'timeline' ? (
        <div className="space-y-10">
          {allYears.filter((y) => postsByYear[y]?.length).map((year) => (
            <div key={year}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-lg font-black text-slate-300">{year}</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(71,85,105,0.20)' }} />
                <span className="text-xs text-slate-600">{postsByYear[year].length} posts</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {postsByYear[year].map((post, idx) => (
                  <PostCard key={post.slug} post={post} idx={idx}
                    onTagClick={handleTagClick} showYear={false}
                    isRead={readSlugs.has(post.slug)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-10">
          {allCategories.filter((c) => postsByCategory[c]?.length).map((cat) => {
            const { color } = CAT_PALETTE[cat] ?? defaultPalette;
            return (
              <div key={cat}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-lg"
                    style={{ color, background: `${color}15`, border: `1px solid ${color}35` }}>
                    {cat}
                  </span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(71,85,105,0.20)' }} />
                  <span className="text-xs text-slate-600">{postsByCategory[cat].length} posts</span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {postsByCategory[cat].map((post, idx) => (
                    <PostCard key={post.slug} post={post} idx={idx}
                      onTagClick={handleTagClick} showYear
                      isRead={readSlugs.has(post.slug)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Load more ────────────────────────────────────────────────────────── */}
      {!hasFilters && bodyPosts.length > page * PAGE_SIZE && (
        <div className="mt-10 flex flex-col items-center gap-2">
          <button onClick={() => setPage((p) => p + 1)}
            className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: '#a78bfa' }}>
            Load {Math.min(PAGE_SIZE, bodyPosts.length - page * PAGE_SIZE)} more posts
          </button>
          <p className="text-xs text-slate-600">
            {Math.min(page * PAGE_SIZE, bodyPosts.length)} of {bodyPosts.length} posts
          </p>
        </div>
      )}
    </div>
  );
}

