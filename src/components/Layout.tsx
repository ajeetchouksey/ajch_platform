import { NavLink, useLocation, useSearchParams, Link } from 'react-router-dom';
import { BookOpen, Brain, Layers, BarChart2, Home, Menu, X, Cpu, GraduationCap, Newspaper, Wrench, FolderOpen, Users, LineChart, Hash, Eye, Server, Terminal, BookMarked, Search, GitPullRequest, CalendarDays } from 'lucide-react';
import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { GithubLogin } from './GithubLogin';
import { StarRepo } from './StarRepo';
import SearchModal from './SearchModal';
import { Breadcrumb, Badge, VersionTag, type BreadcrumbItem } from './ui';
import { loadBlogManifest, loadExamRegistry } from '@/lib/content-loader';
import { EXAM_SCHEMES } from '@/types/content';
import type { BlogPostMeta, ExamConfig } from '@/types/content';
import { SubscribeForm } from './SubscribeForm';

const platformLinks = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/skillup', label: 'Skill Up', icon: GraduationCap },
  { to: '/blog', label: 'Field Notes', icon: Newspaper },
  { to: '/tools', label: 'Tools', icon: Wrench },
  { to: '/docs', label: 'Docs', icon: BookOpen },
  { to: '/contribute', label: 'Contribute', icon: GitPullRequest },
  { to: '/team', label: 'Team', icon: Users },
  { to: '/dashboard', label: 'Dashboard', icon: BarChart2, sidebarOnly: true },
  { to: '/analytics', label: 'Analytics', icon: LineChart, sidebarOnly: true },
];

const footerLinks = [
  { href: '/subscribe', label: 'Subscribe', external: false },
  { href: '/dashboard', label: 'Dashboard', external: false },
  { href: 'https://github.com/ajeetchouksey/ajch_platform', label: 'GitHub', external: true },
  { href: 'https://github.com/ajeetchouksey/ajch_platform/discussions', label: 'Discussions', external: true },
  { href: 'https://github.com/ajeetchouksey/ajch_platform/issues', label: 'Issues', external: true },
  { href: 'https://github.com/ajeetchouksey/ajch_platform/blob/main/LICENSE', label: 'License', external: true },
];

function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  // Full label map — URL segment → human label
  const labelMap: Record<string, string> = {
    // Platform sections
    exams:      'Skill Up',
    skillup:    'Skill Up',
    blog:       'Field Notes',
    tools:      'Tools',
    docs:       'Docs',
    learn:      'Learning Hub',
    team:       'Team',
    analytics:  'Analytics',
    maintainer: 'Maintainer',
    profile:    'Profile',
    dashboard:  'Dashboard',
    contribute: 'Contribute',
    progress:   'Progress',
    // Exam IDs
    ccaf:       'CCA-F',
    ab100:      'AB-100',
    ghbp:       'GitHub Best Practices',
    // Exam sub-sections
    quiz:       'Quiz',
    notes:      'Notes',
    scenarios:  'Scenarios',
    // Tool routes
    'token-counter':         'Token Counter',
    'context-visualizer':   'Context Visualizer',
    'mcp-scaffold':          'MCP Scaffold',
    'rag-chunk-visualizer': 'RAG Chunk Visualizer',
    'prompt-tester':         'Prompt Tester',
    'prompt-library':        'Prompt Library',
    'system-prompt-builder': 'System Prompt Builder',
    'tool-schema-builder':   'Tool Schema Builder',
    'model-cost-calc':       'Model Cost Calc',
    // Team / misc
    v2: 'V2',
  };

  const toTitle = (seg: string) =>
    labelMap[seg] ?? seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const items: BreadcrumbItem[] = [];
  let path = '';
  for (let i = 0; i < segments.length; i++) {
    path += `/${segments[i]}`;
    items.push({
      label: toTitle(segments[i]),
      to: i < segments.length - 1 ? path : undefined,
    });
  }

  return <Breadcrumb items={items} />;
}

export default function Layout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [blogPosts, setBlogPosts] = useState<BlogPostMeta[]>([]);
  const [pageKey, setPageKey] = useState(location.pathname + location.search);
  const [currentExam, setCurrentExam] = useState<ExamConfig | null>(null);

  const examIdMatch = location.pathname.match(/^\/(?:exams|skillup)\/([^/]+)/);
  const currentExamId = examIdMatch ? examIdMatch[1] : null;
  const isInExam = Boolean(currentExamId);
  const isInBlog = location.pathname.startsWith('/blog');
  const isInTeam = location.pathname.startsWith('/team') || location.pathname.startsWith('/maintainer/team');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSidebarOpen(false);
    setPageKey(location.pathname + location.search);
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.scrollTop = 0;
  }, [location.pathname, location.search]);

  // Lock body scroll when sidebar is open on mobile (iOS Safari fix)
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  useEffect(() => {
    if (isInExam && currentExamId) {
      loadExamRegistry().then((r) => {
        setCurrentExam(r.exams.find((e) => e.id === currentExamId) ?? null);
      }).catch(() => setCurrentExam(null));
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentExam(null);
    }
  }, [currentExamId, isInExam]);

  useEffect(() => {
    if (isInBlog) {
      loadBlogManifest().then((m) => setBlogPosts(m.posts.filter((p) => !p.draft))).catch(() => {});
    }
  }, [isInBlog]);

  const blogCategories = [...new Set(blogPosts.map((p) => p.category))];

  const handleSearchKey = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      setSearchOpen((o) => !o);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleSearchKey);
    return () => document.removeEventListener('keydown', handleSearchKey);
  }, [handleSearchKey]);

  return (
    <div className="h-screen overflow-hidden flex flex-col text-slate-100">
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      {/* Navigation progress bar — restarts on every route change */}
      <div key={`np-${pageKey}`} className="nav-progress" aria-hidden="true" />
      {/* Header */}
      <header className="bg-slate-800/75 backdrop-blur-md border-b border-slate-700/60 sticky top-0 z-50 relative">
        <div className="flex items-center h-14 px-6 w-full">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden mr-3 p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-200 active:scale-95"
            aria-label="Toggle sidebar"
          >
            <div className="transition-transform duration-200">
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </div>
          </button>

          <NavLink
            to="/"
            className="flex items-center mr-4 group"
            style={{ gap: 'clamp(8px, 1.2vw, 14px)' }}
          >
            <div
              className="relative shrink-0"
              style={{ width: 'clamp(18px, 2.2vw, 28px)', height: 'clamp(18px, 2.2vw, 28px)' }}
            >
              <Cpu className="w-full h-full text-violet-400 transition-transform duration-300 group-hover:rotate-12" />
              <div className="absolute inset-0 bg-violet-400/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="flex flex-col leading-none select-none">
              <span
                className="font-extrabold tracking-wide bg-gradient-to-r from-violet-300 to-violet-500 bg-clip-text text-transparent"
                style={{ fontSize: 'clamp(15px, 1.8vw, 22px)' }}
              >
                Aarya
              </span>
              <span
                className="text-slate-500 font-medium tracking-[0.08em] mt-0.5"
                style={{ fontSize: 'clamp(9px, 0.85vw, 12px)' }}
              >
                My AI Learning Hub
              </span>
            </div>
          </NavLink>

          <nav className="hidden lg:flex items-center gap-0.5">
            {platformLinks.filter((l) => !l.sidebarOnly).map(({ to, label, icon: Icon, end }) => (
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
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all text-xs"
              aria-label="Search"
            >
              <Search size={14} />
              <span className="hidden sm:block">Search</span>
              <kbd className="hidden sm:block text-[10px] border border-slate-700 rounded px-1 py-0.5 text-slate-500">⌘K</kbd>
            </button>
            <StarRepo />
            <GithubLogin />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-900/30 backdrop-blur-xl border-r border-slate-700/20
            transform transition-all duration-300 ease-out
            ${sidebarOpen ? 'translate-x-0 shadow-2xl shadow-black/50' : '-translate-x-full shadow-none'}
            lg:translate-x-0 lg:shadow-none lg:block
            top-14 pt-4 overflow-y-auto
          `}
        >
          {/* Mobile: platform nav */}
          <div className="px-4 pb-4 lg:hidden">
            <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">
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
                        ? 'bg-violet-500/15 text-violet-200 border-l-2 border-violet-400 ml-0 pl-2.5'
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

          {/* Exam navigation — registry-driven */}
          {isInExam && currentExam && (() => {
            const scheme = EXAM_SCHEMES[currentExam.colorScheme] ?? EXAM_SCHEMES['violet'];
            const examLinks = [
              { to: `/skillup/${currentExam.id}`, label: 'Overview', icon: GraduationCap, end: true },
              { to: `/skillup/${currentExam.id}/quiz`, label: 'Quiz', icon: Brain },
              { to: `/skillup/${currentExam.id}/notes`, label: 'Study Notes', icon: BookOpen },
              { to: `/skillup/${currentExam.id}/scenarios`, label: 'Scenarios', icon: Layers },
              { to: `/skillup/${currentExam.id}/progress`, label: 'Progress', icon: BarChart2 },
              { to: `/skillup/${currentExam.id}/plan`, label: 'Study Plan', icon: CalendarDays },
            ];
            return (
              <>
                <div className="px-4 pb-4">
                  <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">
                    {currentExam.shortTitle} Exam
                  </h3>
                  <nav className="space-y-0.5">
                    {examLinks.map(({ to, label, icon: Icon, end }) => (
                      <NavLink
                        key={to}
                        to={to}
                        end={end}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                            isActive
                              ? scheme.sidebarActive
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
                  <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">
                    Exam Domains
                  </h3>
                  <div className="space-y-0.5">
                    {currentExam.domains.map((domain) => {
                      const isActive = location.pathname === `/skillup/${currentExam.id}/notes` && searchParams.get('d') === String(domain.id);
                      return (
                        <Link
                          key={domain.id}
                          to={`/skillup/${currentExam.id}/notes?d=${domain.id}`}
                          className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-all duration-200 ${
                            isActive
                              ? 'bg-slate-800/80 text-white scale-[1.02] shadow-sm'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800/50 hover:translate-x-0.5'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${domain.color} ${isActive ? 'ring-2 ring-offset-1 ring-offset-slate-900' : ''} transition-all`} />
                          <span>D{domain.id}: {domain.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div className="px-4 pb-4">
                  <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">
                    Domain Weights
                  </h3>
                  <div className="space-y-2">
                    {currentExam.domains.map((domain) => (
                      <div key={domain.id} className="flex items-center gap-2 group">
                        <span className="text-xs text-slate-500 w-6 font-mono group-hover:text-white transition-colors">D{domain.id}</span>
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full ${domain.color} rounded-full transition-all duration-500 group-hover:brightness-125`} style={{ width: `${domain.weight}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 w-8 text-right font-mono group-hover:text-white transition-colors">{domain.weight}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {currentExam.resources.length > 0 && (
                  <div className="px-4 pt-3 border-t border-slate-800/50">
                    <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3 mt-1">
                      Resources
                    </h3>
                    <div className="space-y-1.5 text-xs">
                      {currentExam.resources.map((res) => (
                        <a key={res.url} href={res.url} target="_blank" rel="noopener noreferrer" className={`block text-slate-400 ${scheme.resourceHover} hover:translate-x-0.5 transition-all duration-200`}>
                          {res.label} ↗
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}

          {/* Blog sidebar */}
          {isInBlog && (
            <div className="px-4 pb-4">
              <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Categories</h3>
              <nav className="space-y-0.5">
                <Link to="/blog" className="flex items-center justify-between px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800/70 transition-all duration-200">
                  <span className="flex items-center gap-2"><Newspaper size={13} />All Posts</span>
                  <span className="text-[10px] font-semibold bg-violet-500/15 text-violet-300 px-1.5 py-0.5 rounded-full">{blogPosts.length}</span>
                </Link>
                {blogCategories.map((cat, i) => {
                  const countColors = ['text-blue-400','text-emerald-400','text-amber-400','text-rose-400','text-fuchsia-400','text-cyan-400'];
                  return (
                  <Link key={cat} to="/blog" className="flex items-center justify-between px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800/70 transition-all duration-200">
                    <span className="flex items-center gap-2"><FolderOpen size={13} />{cat}</span>
                    <span className={`text-[10px] font-semibold ${countColors[i % countColors.length]}`}>{blogPosts.filter(p => p.category === cat).length}</span>
                  </Link>
                  );
                })}
              </nav>
            </div>
          )}

          {/* Team sidebar */}
          {isInTeam && (
            <div className="px-4 pb-4">
              <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">The Team</h3>
              <nav className="space-y-0.5 mb-3">
                <NavLink
                  to="/team"
                  end
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                      isActive ? 'bg-violet-500/15 text-violet-200 border-l-2 border-violet-400 pl-2.5' : 'text-slate-400 hover:text-white hover:bg-slate-800/70 hover:translate-x-0.5'
                    }`
                  }
                >
                  <Users size={15} />
                  <span>Overview</span>
                </NavLink>
              </nav>

              <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">L0 Dispatch</h3>
              <div className="space-y-0.5 mb-3">
                {[
                  { label: 'Staff Engineer', color: 'bg-violet-400' },
                  { label: 'Product Manager', color: 'bg-teal-400' },
                ].map(({ label, color }) => (
                  <div key={label} className="flex items-center gap-2.5 px-3 py-1 text-xs text-slate-500">
                    <span className={`w-1.5 h-1.5 rounded-full ${color}`} /><span>{label}</span>
                  </div>
                ))}
              </div>
              <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">L1 Domain Leads</h3>
              <div className="space-y-0.5 mb-3">
                {[
                  { label: 'Platform Architect', color: 'bg-blue-400' },
                  { label: 'Content Lead', color: 'bg-emerald-400' },
                  { label: 'Curriculum Engineer', color: 'bg-amber-400' },
                  { label: 'Pair Programmer', color: 'bg-rose-400' },
                ].map(({ label, color }) => (
                  <div key={label} className="flex items-center gap-2.5 px-3 py-1 text-xs text-slate-500">
                    <span className={`w-1.5 h-1.5 rounded-full ${color}`} /><span>{label}</span>
                  </div>
                ))}
              </div>
              <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Platform Foundation</h3>
              <div className="space-y-0.5">
                {[
                  { label: 'AppSec Engineer', color: 'bg-red-500/60' },
                  { label: 'Design Systems', color: 'bg-purple-500/60' },
                  { label: 'SRE', color: 'bg-orange-500/60' },
                  { label: 'DevRel', color: 'bg-pink-500/60' },
                ].map(({ label, color }) => (
                  <div key={label} className="flex items-center gap-2.5 px-3 py-1 text-[11px] text-slate-600">
                    <span className={`w-1 h-1 rounded-full ${color}`} /><span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generic sidebar for non-exam, non-blog, non-team pages */}
          {!isInExam && !isInBlog && !isInTeam && (
            <div className="px-4 pb-4">
              <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">
                Features
              </h3>
              <nav className="space-y-0.5">
                <Link to="/skillup" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800/70 hover:translate-x-0.5 transition-all duration-200">
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
                <Link to="/tools/token-counter" className="flex items-center gap-2.5 px-3 py-2 pl-8 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800/70 hover:translate-x-0.5 transition-all duration-200">
                  <Hash size={14} />
                  <span>Token Counter</span>
                </Link>
                <Link to="/tools/context-visualizer" className="flex items-center gap-2.5 px-3 py-2 pl-8 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800/70 hover:translate-x-0.5 transition-all duration-200">
                  <Eye size={14} />
                  <span>Context Visualizer</span>
                </Link>
                <Link to="/tools/mcp-scaffold" className="flex items-center gap-2.5 px-3 py-2 pl-8 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800/70 hover:translate-x-0.5 transition-all duration-200">
                  <Server size={14} />
                  <span>MCP Scaffold</span>
                </Link>
                <Link to="/tools/rag-chunk-visualizer" className="flex items-center gap-2.5 px-3 py-2 pl-8 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800/70 hover:translate-x-0.5 transition-all duration-200">
                  <Layers size={14} />
                  <span>RAG Chunks</span>
                </Link>
                <Link to="/tools/prompt-tester" className="flex items-center gap-2.5 px-3 py-2 pl-8 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800/70 hover:translate-x-0.5 transition-all duration-200">
                  <Terminal size={14} />
                  <span>Prompt Tester</span>
                </Link>
                <Link to="/tools/prompt-library" className="flex items-center gap-2.5 px-3 py-2 pl-8 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800/70 hover:translate-x-0.5 transition-all duration-200">
                  <BookMarked size={14} />
                  <span>Prompt Library</span>
                </Link>
                <Link to="/dashboard" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800/70 hover:translate-x-0.5 transition-all duration-200">
                  <BarChart2 size={16} />
                  <span>Dashboard</span>
                </Link>
                <Link to="/team" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800/70 hover:translate-x-0.5 transition-all duration-200">
                  <Users size={16} />
                  <span>Team</span>
                </Link>
              </nav>
            </div>
          )}
        </aside>

        {/* Sidebar overlay (mobile) — always rendered for smooth fade out */}
        <div
          className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden top-14 transition-opacity duration-300 ${
            sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />

        {/* Main content */}
        <main
          className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden flex flex-col"
          style={{
            background: 'radial-gradient(ellipse 120% 45% at 50% 0%, rgba(139,92,246,0.10) 0%, transparent 55%)',
            backgroundAttachment: 'fixed',
          }}
        >
          <div className="flex-1 p-4 lg:p-8">
            <div className="max-w-5xl mx-auto">
              <div key={pageKey} className="animate-[fadeIn_0.38s_cubic-bezier(0.22,1,0.36,1)_both]">
                <Breadcrumbs />
                {children}
              </div>
            </div>
          </div>

          <footer className="px-4 lg:px-8 pb-8 pt-2">
            {/* Gradient separator — matches nav active-underline style */}
            <div className="h-px bg-gradient-to-r from-transparent via-violet-500/25 to-transparent mb-8" />

            <div className="max-w-5xl mx-auto space-y-6">
              {/* Newsletter CTA — glass card matching page design language */}
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.04] backdrop-blur-sm p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white mb-0.5">Ship faster. Learn deeper.</p>
                  <p className="text-xs text-slate-500 leading-relaxed">Exam guides, AI tools &amp; engineering updates — straight to your inbox.</p>
                </div>
                <div className="shrink-0 w-full sm:w-auto">
                  {import.meta.env.VITE_CONVERTKIT_FORM_ID
                    ? <SubscribeForm compact />
                    : (
                      <Link
                        to="/subscribe"
                        className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded-lg transition-colors duration-200 whitespace-nowrap"
                      >
                        Subscribe →
                      </Link>
                    )
                  }
                </div>
              </div>

              {/* Brand + nav row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Cpu size={15} className="text-violet-400" />
                  <span className="text-sm font-extrabold tracking-wide bg-gradient-to-r from-violet-300 to-violet-500 bg-clip-text text-transparent">Aarya</span>
                  <Badge label="AI Hub" variant="violet" size="xs" />
                  <VersionTag version={__APP_VERSION__} highlight />
                </div>
                <nav className="flex flex-wrap gap-x-4 gap-y-1">
                  {footerLinks.map(({ href, label, external }) =>
                    external ? (
                      <a key={href} href={href} target="_blank" rel="noreferrer"
                        className="text-xs text-slate-500 hover:text-slate-300 transition-colors duration-200">{label}</a>
                    ) : (
                      <Link key={href} to={href}
                        className="text-xs text-slate-500 hover:text-slate-300 transition-colors duration-200">{label}</Link>
                    )
                  )}
                </nav>
              </div>

              {/* Copyright */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1">
                <p className="text-[10px] text-slate-700">© 2026 Aarya · MIT License · Built in public</p>
                <a href="https://github.com/ajeetchouksey/ajch_platform" target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[10px] text-slate-700 hover:text-slate-400 transition-colors duration-200">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                  View on GitHub
                </a>
              </div>
            </div>
          </footer>
        </main>
      </div>

    </div>
  );
}