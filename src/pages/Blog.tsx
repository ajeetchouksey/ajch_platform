import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Tag, Search, X, ChevronDown, ChevronUp, ArrowRight, LayoutList, Layers } from 'lucide-react';
import { loadBlogManifest } from '../lib/content-loader';
import type { BlogPostMeta } from '../types/content';

const CAT_COLOR: Record<string, string> = {
  Azure: 'text-blue-400 bg-blue-950/50',
  DevOps: 'text-emerald-400 bg-emerald-950/50',
  Cloud: 'text-cyan-400 bg-cyan-950/50',
  'AI Architecture': 'text-violet-400 bg-violet-950/50',
  Opinions: 'text-amber-400 bg-amber-950/50',
};

function SkeletonCard() {
  return (
    <div className="glass-card rounded-lg p-5 animate-pulse">
      <div className="h-5 bg-slate-700 rounded w-3/4 mb-3" />
      <div className="h-3 bg-slate-800 rounded w-full mb-2" />
      <div className="h-3 bg-slate-800 rounded w-2/3 mb-4" />
      <div className="flex gap-3">
        <div className="h-3 bg-slate-800 rounded w-16" />
        <div className="h-3 bg-slate-800 rounded w-20" />
      </div>
    </div>
  );
}

function HeroCard({ post }: { post: BlogPostMeta }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="block glass-card glass-sheen glass-edge rounded-xl p-6 sm:p-8 mb-6 border border-violet-800/30 hover:border-violet-500/50 hover:shadow-xl hover:shadow-violet-500/10 hover:-translate-y-0.5 transition-all duration-300 group"
    >
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {post.featured && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded">Featured</span>
        )}
        {post.category && (
          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${CAT_COLOR[post.category] ?? 'text-slate-400 bg-slate-800'}`}>{post.category}</span>
        )}
        <span className="ml-auto text-xs text-slate-500 flex items-center gap-1">
          <Calendar size={11} />
          {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>
      <h2 className="text-2xl font-bold text-white group-hover:text-violet-300 transition-colors mb-3 leading-tight">{post.title}</h2>
      <p className="text-slate-400 text-sm mb-4 leading-relaxed line-clamp-3">{post.excerpt}</p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {post.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="text-[11px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">#{tag}</span>
          ))}
          {post.tags.length > 4 && <span className="text-[11px] text-slate-600">+{post.tags.length - 4}</span>}
        </div>
        <span className="flex items-center gap-1 text-xs text-slate-500"><Clock size={11} /> {post.readingTime} min read</span>
      </div>
      <div className="mt-4 flex items-center gap-1 text-sm font-medium text-violet-400 group-hover:gap-2 transition-all">
        Read article <ArrowRight size={14} />
      </div>
    </Link>
  );
}

function PostCard({ post, idx, onTagClick, showYear }: { post: BlogPostMeta; idx: number; onTagClick: (t: string) => void; showYear: boolean }) {
  const [visible, setVisible] = useState(false);
  const cardRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.05, rootMargin: '60px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const catColor = CAT_COLOR[post.category] ?? 'text-slate-400 bg-slate-800';
  const dateStr = new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(showYear ? { year: 'numeric' } : {}) });

  return (
    <Link
      ref={cardRef}
      to={`/blog/${post.slug}`}
      className={`block glass-card glass-sheen glass-edge rounded-lg p-4 hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/5 hover:-translate-y-0.5 transition-all duration-300 group ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{ transitionDelay: `${idx * 40}ms` }}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${catColor}`}>{post.category}</span>
          <h2 className="text-sm font-semibold text-white group-hover:text-violet-300 transition-colors duration-200 mt-1.5 mb-1 line-clamp-2 leading-snug">{post.title}</h2>
          <p className="text-slate-500 text-xs mb-2 line-clamp-2 leading-relaxed">{post.excerpt}</p>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 mb-2">
            <span className="flex items-center gap-0.5"><Calendar size={10} />{dateStr}</span>
            <span className="flex items-center gap-0.5"><Clock size={10} />{post.readingTime} min</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {post.tags.slice(0, 3).map((tag) => (
              <button key={tag} onClick={(e) => { e.preventDefault(); onTagClick(tag); }}
                className="inline-flex items-center gap-0.5 text-[10px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded hover:bg-slate-700 hover:text-slate-300 transition-colors">
                <Tag size={8} />{tag}
              </button>
            ))}
            {post.tags.length > 3 && <span className="text-[10px] text-slate-700">+{post.tags.length - 3}</span>}
          </div>
        </div>
        <div className="hidden sm:flex items-center text-slate-700 group-hover:text-violet-400 transition-all duration-300 group-hover:translate-x-1 flex-shrink-0 pt-1">
          <ArrowRight size={14} />
        </div>
      </div>
    </Link>
  );
}

type ViewMode = 'timeline' | 'category';
const PAGE_SIZE = 12;

export default function Blog() {
  const [posts, setPosts] = useState<BlogPostMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [showAllTags, setShowAllTags] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadBlogManifest()
      .then((manifest) => { setPosts(manifest.posts.filter((p) => !p.draft)); setLoading(false); })
      .catch(() => setLoading(false));
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
      return p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q));
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

  const clearFilters = () => { setSelectedTag(null); setSelectedCategory(null); setSearchQuery(''); setPage(1); };
  const handleTagClick = (t: string) => { setSelectedTag((prev) => prev === t ? null : t); setPage(1); };

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <div className="h-7 bg-slate-700 rounded w-24 mb-2 animate-pulse" />
          <div className="h-3 bg-slate-800 rounded w-56 animate-pulse" />
        </div>
        <div className="glass-card rounded-xl p-8 mb-6 animate-pulse">
          <div className="h-6 bg-slate-700 rounded w-2/3 mb-3" />
          <div className="h-4 bg-slate-800 rounded w-full mb-2" />
          <div className="h-4 bg-slate-800 rounded w-3/4" />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <p className="page-eyebrow">Field Notes</p>
        <h1 className="text-2xl font-bold tracking-tight mb-1"><span className="heading-gradient">Blog</span></h1>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>{posts.length} posts</span>
          <span className="text-slate-700">·</span>
          <span>{dateRange}</span>
          <span className="text-slate-700">·</span>
          <span>{allCategories.length} categories</span>
          <span className="text-slate-700">·</span>
          <span>{tagCounts.length} tags</span>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input type="text" placeholder="Search posts…" value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          className="w-full pl-9 pr-9 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"><X size={14} /></button>
        )}
      </div>

      {/* Category pills + tag toggle + view toggle */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {allCategories.map((cat) => (
          <button key={cat} onClick={() => { setSelectedCategory(selectedCategory === cat ? null : cat); setPage(1); }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${selectedCategory === cat ? `${CAT_COLOR[cat] ?? 'text-slate-400 bg-slate-800'} scale-105` : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}>
            {cat}
          </button>
        ))}
        <button onClick={() => setShowAllTags(!showAllTags)}
          className={`px-3 py-1 rounded-full text-xs transition-all flex items-center gap-1 ${showAllTags || selectedTag ? 'bg-emerald-900/60 text-emerald-400 border border-emerald-700/50' : 'bg-slate-800/50 text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}>
          <Tag size={11} />{selectedTag ? `#${selectedTag}` : 'Tags'}{showAllTags ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </button>
        {hasFilters && (
          <button onClick={clearFilters} className="px-3 py-1 rounded-full text-xs text-rose-400 bg-rose-950/30 hover:bg-rose-900/40 transition-all">Clear all</button>
        )}
        <div className="ml-auto flex items-center gap-0.5 bg-slate-800/60 rounded-lg p-0.5">
          <button onClick={() => setViewMode('timeline')} title="Timeline"
            className={`p-1.5 rounded transition-all ${viewMode === 'timeline' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            <LayoutList size={14} />
          </button>
          <button onClick={() => setViewMode('category')} title="By category"
            className={`p-1.5 rounded transition-all ${viewMode === 'category' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            <Layers size={14} />
          </button>
        </div>
      </div>

      {/* Tag cloud — collapsed by default */}
      {showAllTags && (
        <div className="mb-5 flex flex-wrap gap-1.5 items-center">
          {tagCounts.map(([tag, count]) => (
            <button key={tag} onClick={() => handleTagClick(tag)}
              className={`px-2 py-0.5 rounded-full text-[11px] transition-all duration-200 flex items-center gap-1 ${selectedTag === tag ? 'bg-emerald-600 text-white scale-105' : 'bg-slate-800/50 text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}>
              #{tag}<span className={`text-[9px] font-bold ${selectedTag === tag ? 'opacity-80' : 'opacity-40'}`}>{count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Result count */}
      <div className="mb-4 text-xs text-slate-500">
        {hasFilters
          ? `Showing ${filteredPosts.length} of ${posts.length} posts${searchQuery ? ` for "${searchQuery}"` : ''}`
          : `${posts.length} posts · showing ${Math.min(page * PAGE_SIZE + (heroPost ? 1 : 0), posts.length)}`}
      </div>

      {/* Hero */}
      {heroPost && !hasFilters && <HeroCard post={heroPost} />}

      {/* Posts */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500 text-sm mb-2">No posts found.</p>
          {hasFilters && <button onClick={clearFilters} className="text-violet-400 text-sm hover:underline">Clear filters</button>}
        </div>
      ) : viewMode === 'timeline' ? (
        <div className="space-y-8">
          {allYears.filter((y) => postsByYear[y]?.length).map((year) => (
            <div key={year}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-lg font-bold text-slate-300">{year}</span>
                <div className="flex-1 h-px bg-slate-800" />
                <span className="text-xs text-slate-600">{postsByYear[year].length} posts</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {postsByYear[year].map((post, idx) => (
                  <PostCard key={post.slug} post={post} idx={idx} onTagClick={handleTagClick} showYear={false} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {allCategories.filter((c) => postsByCategory[c]?.length).map((cat) => (
            <div key={cat}>
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${CAT_COLOR[cat] ?? 'text-slate-400 bg-slate-800'}`}>{cat}</span>
                <div className="flex-1 h-px bg-slate-800" />
                <span className="text-xs text-slate-600">{postsByCategory[cat].length} posts</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {postsByCategory[cat].map((post, idx) => (
                  <PostCard key={post.slug} post={post} idx={idx} onTagClick={handleTagClick} showYear />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {!hasFilters && bodyPosts.length > page * PAGE_SIZE && (
        <div className="mt-8 text-center">
          <button onClick={() => setPage((p) => p + 1)}
            className="px-6 py-2 rounded-lg text-sm font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all border border-slate-700 hover:border-slate-600">
            Load {Math.min(PAGE_SIZE, bodyPosts.length - page * PAGE_SIZE)} more posts
          </button>
          <p className="text-xs text-slate-600 mt-2">Showing {Math.min(page * PAGE_SIZE, bodyPosts.length)} of {bodyPosts.length} posts</p>
        </div>
      )}
    </div>
  );
}