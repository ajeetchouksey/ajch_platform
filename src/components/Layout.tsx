import { NavLink, useLocation, useSearchParams, Link } from 'react-router-dom';
import { BookOpen, Brain, Layers, BarChart2, Home, Menu, X, Cpu, GraduationCap, Newspaper, Wrench, Tag, FolderOpen, ChevronRight, Users } from 'lucide-react';
import { useState, useEffect, type ReactNode } from 'react';
import { GithubLogin } from './GithubLogin';
import { StarRepo } from './StarRepo';
import { loadBlogManifest } from '../lib/content-loader';
import { useAuth } from '../lib/auth';
import type { BlogPostMeta } from '../types/content';

const platformLinks = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/exams', label: 'Exams', icon: GraduationCap },
  { to: '/blog', label: 'Blog', icon: Newspaper },
  { to: '/tools', label: 'Tools', icon: Wrench },
  { to: '/team', label: 'Team', icon: Users },
];

const ccafLinks = [
  { to: '/exams/ccaf', label: 'Overview', icon: GraduationCap, end: true },
  { to: '/exams/ccaf/quiz', label: 'Quiz', icon: Brain },
  { to: '/exams/ccaf/notes', label: 'Study Notes', icon: BookOpen },
  { to: '/exams/ccaf/scenarios', label: 'Scenarios', icon: Layers },
  { to: '/exams/ccaf/progress', label: 'Progress', icon: BarChart2 },
];

const domainLinks = [
  { id: 1, label: 'D1: Agentic Architecture', color: 'bg-violet-500' },
  { id: 2, label: 'D2: Claude Code Config', color: 'bg-blue-500' },
  { id: 3, label: 'D3: Prompt Engineering', color: 'bg-emerald-500' },
  { id: 4, label: 'D4: Tool Design & MCP', color: 'bg-amber-500' },
  { id: 5, label: 'D5: Context Management', color: 'bg-rose-500' },
];

function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs: { label: string; to: string }[] = [];
  const labelMap: Record<string, string> = {
    exams: 'Exams',
    ccaf: 'CCA-F',
    quiz: 'Quiz',
    notes: 'Notes',
    scenarios: 'Scenarios',
    progress: 'Progress',
    blog: 'Blog',
    tools: 'Tools',
    team: 'Team',
    maintainer: 'Maintainer',
  };

  let path = '';
  for (const seg of segments) {
    path += `/${seg}`;
    crumbs.push({ label: labelMap[seg] || seg, to: path });
  }

  return (
    <div className="flex items-center gap-1 text-xs text-slate-500 mb-4 overflow-x-auto">
      <Link to="/" className="hover:text-violet-300 transition-colors shrink-0">Home</Link>
      {crumbs.map(({ label, to }, idx) => (
        <span key={to} className="flex items-center gap-1 shrink-0">
          <ChevronRight size={10} className="text-slate-700" />
          {idx === crumbs.length - 1 ? (
            <span className="text-slate-300 font-medium">{label}</span>
          ) : (
            <Link to={to} className="hover:text-violet-300 transition-colors">{label}</Link>
          )}
        </span>
      ))}
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [blogPosts, setBlogPosts] = useState<BlogPostMeta[]>([]);
  const [pageKey, setPageKey] = useState(location.pathname);
  const { user } = useAuth();

  const isInCcaf = location.pathname.startsWith('/exams/ccaf');
  const isInBlog = location.pathname.startsWith('/blog');
  const isInTeam = location.pathname.startsWith('/team') || location.pathname.startsWith('/maintainer/team');

  useEffect(() => {
    setSidebarOpen(false);
    setPageKey(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    if (isInBlog) {
      loadBlogManifest().then((m) => setBlogPosts(m.posts.filter((p) => !p.draft))).catch(() => {});
    }
  }, [isInBlog]);

  const blogCategories = [...new Set(blogPosts.map((p) => p.category))];
  const blogTags = [...new Set(blogPosts.flatMap((p) => p.tags))];
  const recentPosts = blogPosts.slice(0, 5);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-50">
        <div className="flex items-center h-14 px-4 max-w-[1600px] mx-auto">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden mr-3 p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-200 active:scale-95"
            aria-label="Toggle sidebar"
          >
            <div className="transition-transform duration-200">
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </div>
          </button>

          <NavLink to="/" className="flex items-center gap-2.5 mr-8 group">
            <div className="relative">
              <Cpu size={22} className="text-violet-400 transition-transform duration-300 group-hover:rotate-12" />
              <div className="absolute inset-0 bg-violet-400/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <span className="font-bold text-sm tracking-wide select-none bg-gradient-to-r from-violet-300 to-violet-500 bg-clip-text text-transparent">
              AI Architect Hub
            </span>
          </NavLink>

          <nav className="hidden lg:flex items-center gap-0.5">
            {platformLinks.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={15} className={isActive ? 'text-violet-400' : ''} />
                    <span>{label}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-violet-400 to-fuchsia-400 rounded-full" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <StarRepo />
            <GithubLogin />
            {user && (
              <Link
                to="/profile"
                className="relative group"
                title="Profile"
              >
                <img
                  src={user.avatar_url}
                  alt={user.login}
                  className="w-7 h-7 rounded-full ring-1 ring-slate-700 group-hover:ring-violet-500/50 transition-all duration-200"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-900/95 backdrop-blur-md border-r border-slate-800/80
            transform transition-all duration-300 ease-out
            ${sidebarOpen ? 'translate-x-0 shadow-2xl shadow-black/50' : '-translate-x-full shadow-none'}
            lg:translate-x-0 lg:shadow-none lg:block
            top-14 pt-4 overflow-y-auto
          `}
        >
          {/* Mobile: platform nav */}
          <div className="px-4 pb-4 lg:hidden">
            <h3 className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-3">
              Platform
            </h3>
            <nav className="space-y-0.5">
              {platformLinks.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-violet-500/10 text-violet-300 border-l-2 border-violet-400 ml-0 pl-2.5'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/70 hover:translate-x-0.5'
                    }`
                  }
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* CCA-F exam navigation */}
          {isInCcaf && (
            <>
              <div className="px-4 pb-4">
                <h3 className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-3">
                  CCA-F Exam
                </h3>
                <nav className="space-y-0.5">
                  {ccafLinks.map(({ to, label, icon: Icon, end }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={end}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                          isActive
                            ? 'bg-violet-500/10 text-violet-300 border-l-2 border-violet-400 pl-2.5'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/70 hover:translate-x-0.5'
                        }`
                      }
                    >
                      <Icon size={16} />
                      <span>{label}</span>
                    </NavLink>
                  ))}
                </nav>
              </div>

              <div className="px-4 pb-4">
                <h3 className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-3">
                  Exam Domains
                </h3>
                <div className="space-y-0.5">
                  {domainLinks.map(({ id, label, color }) => {
                    const isActive = location.pathname === '/exams/ccaf/notes' && searchParams.get('d') === String(id);
                    return (
                      <Link
                        key={id}
                        to={`/exams/ccaf/notes?d=${id}`}
                        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-all duration-200 ${
                          isActive
                            ? 'bg-slate-800 text-white scale-[1.02]'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50 hover:translate-x-0.5'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${color} ${isActive ? 'ring-2 ring-offset-1 ring-offset-slate-900' : ''} transition-all`} />
                        <span>{label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="px-4 pb-4">
                <h3 className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-3">
                  Domain Weights
                </h3>
                <div className="space-y-2">
                  {[
                    { label: 'D1', pct: 27, color: 'bg-violet-500' },
                    { label: 'D2', pct: 20, color: 'bg-blue-500' },
                    { label: 'D3', pct: 20, color: 'bg-emerald-500' },
                    { label: 'D4', pct: 18, color: 'bg-amber-500' },
                    { label: 'D5', pct: 15, color: 'bg-rose-500' },
                  ].map(({ label, pct, color }) => (
                    <div key={label} className="flex items-center gap-2 group">
                      <span className="text-xs text-slate-500 w-6 font-mono group-hover:text-white transition-colors">{label}</span>
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${color} rounded-full transition-all duration-500 group-hover:brightness-125`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-slate-500 w-8 text-right font-mono group-hover:text-white transition-colors">{pct}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-4 pt-3 border-t border-slate-800/50">
                <h3 className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-3 mt-1">
                  Resources
                </h3>
                <div className="space-y-1.5 text-xs">
                  <a href="https://docs.anthropic.com" target="_blank" rel="noopener noreferrer" className="block text-slate-400 hover:text-violet-300 hover:translate-x-0.5 transition-all duration-200">Anthropic Docs ↗</a>
                  <a href="https://github.com/anthropics/anthropic-cookbook" target="_blank" rel="noopener noreferrer" className="block text-slate-400 hover:text-violet-300 hover:translate-x-0.5 transition-all duration-200">Anthropic Cookbook ↗</a>
                  <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer" className="block text-slate-400 hover:text-violet-300 hover:translate-x-0.5 transition-all duration-200">MCP Docs ↗</a>
                </div>
              </div>
            </>
          )}

          {/* Blog sidebar */}
          {isInBlog && (
            <>
              <div className="px-4 pb-4">
                <h3 className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-3">
                  Categories
                </h3>
                <nav className="space-y-0.5">
                  <Link
                    to="/blog"
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800/70 hover:translate-x-0.5 transition-all duration-200"
                  >
                    <Newspaper size={14} />
                    <span>All Posts</span>
                    <span className="ml-auto text-[10px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full">{blogPosts.length}</span>
                  </Link>
                  {blogCategories.map((cat) => (
                    <Link
                      key={cat}
                      to="/blog"
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800/70 hover:translate-x-0.5 transition-all duration-200"
                    >
                      <FolderOpen size={14} />
                      <span>{cat}</span>
                    </Link>
                  ))}
                </nav>
              </div>

              <div className="px-4 pb-4">
                <h3 className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-3">
                  Recent Posts
                </h3>
                <div className="space-y-2">
                  {recentPosts.map((post) => (
                    <Link
                      key={post.slug}
                      to={`/blog/${post.slug}`}
                      className="block text-xs text-slate-400 hover:text-violet-300 hover:translate-x-0.5 transition-all duration-200 leading-relaxed line-clamp-2"
                    >
                      {post.title}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="px-4 pb-4">
                <h3 className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-3">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {blogTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-0.5 text-[11px] bg-slate-800/70 text-slate-400 px-1.5 py-0.5 rounded hover:bg-slate-700 hover:text-white transition-all duration-200 cursor-default"
                    >
                      <Tag size={9} />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Team sidebar */}
          {isInTeam && (
            <div className="px-4 pb-4">
              <h3 className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-3">The Team</h3>
              <nav className="space-y-0.5">
                <NavLink
                  to="/team"
                  end
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                      isActive ? 'bg-violet-500/10 text-violet-300 border-l-2 border-violet-400 pl-2.5' : 'text-slate-400 hover:text-white hover:bg-slate-800/70 hover:translate-x-0.5'
                    }`
                  }
                >
                  <Users size={15} />
                  <span>Overview</span>
                </NavLink>
              </nav>
              <h3 className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mt-4 mb-2">L0 Orchestrator</h3>
              <div className="space-y-0.5 mb-3">
                {[{ label: 'Platform Orchestrator', color: 'bg-violet-400' }].map(({ label, color }) => (
                  <div key={label} className="flex items-center gap-2.5 px-3 py-1 text-xs text-slate-500">
                    <span className={`w-1.5 h-1.5 rounded-full ${color}`} /><span>{label}</span>
                  </div>
                ))}
              </div>
              <h3 className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-2">🛡️ Security Gate</h3>
              <div className="space-y-0.5 mb-3">
                <div className="flex items-center gap-2.5 px-3 py-1 text-xs text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /><span>Security &amp; Governance</span>
                </div>
              </div>
              <h3 className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-2">🎨 UX Foundation</h3>
              <div className="space-y-0.5 mb-3">
                <div className="flex items-center gap-2.5 px-3 py-1 text-xs text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" /><span>UX Foundation</span>
                </div>
              </div>
              <h3 className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-2">L1 Domain Leads</h3>
              <div className="space-y-0.5 mb-3">
                {[
                  { label: 'Platform Control', color: 'bg-blue-400' },
                  { label: 'Blog Lead', color: 'bg-emerald-400' },
                  { label: 'Exam Lead', color: 'bg-amber-400' },
                  { label: 'Study Companion', color: 'bg-rose-400' },
                ].map(({ label, color }) => (
                  <div key={label} className="flex items-center gap-2.5 px-3 py-1 text-xs text-slate-500">
                    <span className={`w-1.5 h-1.5 rounded-full ${color}`} /><span>{label}</span>
                  </div>
                ))}
              </div>
              <h3 className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-2">L2 Specialists</h3>
              <div className="space-y-0.5">
                {[
                  { label: 'Routing Agent', color: 'bg-blue-500/50' },
                  { label: 'Component Builder', color: 'bg-blue-500/50' },
                  { label: 'Content Writer', color: 'bg-emerald-500/50' },
                  { label: 'Content Publisher', color: 'bg-emerald-500/50' },
                  { label: 'Question Generator', color: 'bg-amber-500/50' },
                  { label: 'Study Notes Agent', color: 'bg-amber-500/50' },
                ].map(({ label, color }) => (
                  <div key={label} className="flex items-center gap-2.5 px-3 py-1 text-[11px] text-slate-600">
                    <span className={`w-1 h-1 rounded-full ${color}`} /><span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generic sidebar for non-exam, non-blog, non-team pages */}
          {!isInCcaf && !isInBlog && !isInTeam && (
            <div className="px-4 pb-4">
              <h3 className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-3">
                Features
              </h3>
              <nav className="space-y-0.5">
                <Link to="/exams" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800/70 hover:translate-x-0.5 transition-all duration-200">
                  <GraduationCap size={16} />
                  <span>Certification Exams</span>
                  <span className="ml-auto text-[10px] bg-violet-900/40 text-violet-300 px-1.5 py-0.5 rounded-full">1</span>
                </Link>
                <Link to="/blog" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800/70 hover:translate-x-0.5 transition-all duration-200">
                  <Newspaper size={16} />
                  <span>Blog</span>
                </Link>
                <Link to="/tools" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800/70 hover:translate-x-0.5 transition-all duration-200">
                  <Wrench size={16} />
                  <span>AI Tools</span>
                  <span className="ml-auto flex items-center gap-1 text-[10px] text-amber-400">
                    <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
                    dev
                  </span>
                </Link>
              </nav>
            </div>
          )}
        </aside>

        {/* Sidebar overlay (mobile) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden top-14 transition-opacity duration-300"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-5xl mx-auto">
            <Breadcrumbs />
            <div key={pageKey} className="animate-[fadeIn_0.3s_ease-out]">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900/80 backdrop-blur-md border-t border-slate-800/80 py-4 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Cpu size={14} className="text-violet-400" />
            <span>AI Architect Hub — by Ajeet Chouksey</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/exams" className="hover:text-violet-300 transition-colors">Exams</Link>
            <span className="text-slate-700">·</span>
            <Link to="/blog" className="hover:text-violet-300 transition-colors">Blog</Link>
            <span className="text-slate-700">·</span>
            <Link to="/tools" className="hover:text-violet-300 transition-colors">Tools</Link>
          </div>
          <a href="https://github.com/ajeetchouksey/ajch_platform" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-violet-300 transition-colors">GitHub ↗</a>
        </div>
      </footer>
    </div>
  );
}