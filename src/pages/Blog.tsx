import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, User, Tag, Search, X } from 'lucide-react';
import { loadBlogManifest } from '../lib/content-loader';
import type { BlogPostMeta } from '../types/content';

function SkeletonCard() {
  return (
    <div className="glass-card rounded-lg p-5 animate-pulse">
      <div className="h-5 bg-slate-700 rounded w-3/4 mb-3" />
      <div className="h-3 bg-slate-800 rounded w-full mb-2" />
      <div className="h-3 bg-slate-800 rounded w-2/3 mb-4" />
      <div className="flex gap-3">
        <div className="h-3 bg-slate-800 rounded w-16" />
        <div className="h-3 bg-slate-800 rounded w-20" />
        <div className="h-3 bg-slate-800 rounded w-14" />
      </div>
    </div>
  );
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPostMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCards, setVisibleCards] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    loadBlogManifest()
      .then((manifest) => {
        const published = manifest.posts.filter((p) => !p.draft);
        setPosts(published);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const slug = entry.target.getAttribute('data-slug');
            if (slug) {
              setVisibleCards((prev) => new Set([...prev, slug]));
            }
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );
    return () => observerRef.current?.disconnect();
  }, []);

  const filteredPosts = posts.filter((post) => {
    if (selectedTag && !post.tags.includes(selectedTag)) return false;
    if (selectedCategory && post.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const allTags = [...new Set(posts.flatMap((p) => p.tags))];
  const allCategories = [...new Set(posts.map((p) => p.category))];
  const hasFilters = !!(selectedTag || selectedCategory || searchQuery);

  const clearFilters = () => {
    setSelectedTag(null);
    setSelectedCategory(null);
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <div className="h-7 bg-slate-700 rounded w-24 mb-3 animate-pulse" />
          <div className="h-4 bg-slate-800 rounded w-96 animate-pulse" />
        </div>
        <div className="grid gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Blog</h1>
        <p className="text-slate-400 text-sm">
          Articles on AI architecture, prompt engineering patterns, and lessons from building production AI systems.
        </p>
      </div>

      {/* Search + Filters */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                selectedCategory === cat
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20 scale-105'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
          {allTags.slice(0, 6).map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`px-2.5 py-1 rounded-full text-xs transition-all duration-200 ${
                selectedTag === tag
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 scale-105'
                  : 'bg-slate-800/50 text-slate-500 hover:text-slate-300 hover:bg-slate-800'
              }`}
            >
              #{tag}
            </button>
          ))}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-1 rounded-full text-xs text-rose-400 bg-rose-950/30 hover:bg-rose-900/40 transition-all"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4 text-xs text-slate-500">
        {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'}
        {hasFilters && ' matching filters'}
      </div>

      {/* Posts Grid */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500 text-sm mb-2">No posts found.</p>
          {hasFilters && (
            <button onClick={clearFilters} className="text-violet-400 text-sm hover:underline">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPosts.map((post, idx) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              data-slug={post.slug}
              ref={(el) => { if (el && observerRef.current) observerRef.current.observe(el); }}
              className={`block glass-card glass-sheen glass-edge rounded-lg p-5 hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/5 hover:-translate-y-0.5 transition-all duration-300 group ${
                visibleCards.has(post.slug) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: `${idx * 80}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {post.category && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-400 bg-violet-950/50 px-2 py-0.5 rounded">
                        {post.category}
                      </span>
                    )}
                    {post.featured && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded">
                        Featured
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-semibold text-white group-hover:text-violet-300 transition-colors duration-200 mb-2 line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-slate-400 text-sm mb-3 line-clamp-2">{post.excerpt}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <User size={12} />
                      {post.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {post.readingTime} min read
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-0.5 text-[11px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded group-hover:bg-slate-700 transition-colors"
                      >
                        <Tag size={9} />
                        {tag}
                      </span>
                    ))}
                    {post.tags.length > 3 && (
                      <span className="text-[11px] text-slate-600">+{post.tags.length - 3}</span>
                    )}
                  </div>
                </div>
                <div className="hidden sm:flex items-center text-slate-600 group-hover:text-violet-400 transition-all duration-300 group-hover:translate-x-1">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}