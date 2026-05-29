import { NavLink, useLocation, useSearchParams, Link } from 'react-router-dom';
import { BookOpen, Brain, Layers, BarChart2, Home, Menu, X, Cpu, GraduationCap, Newspaper, Wrench, FolderOpen, Users, LineChart, Hash, Eye, Server, Terminal, BookMarked } from 'lucide-react';
import { useState, useEffect, type ReactNode } from 'react';
import { GithubLogin } from './GithubLogin';
import { StarRepo } from './StarRepo';
import { Breadcrumb, type BreadcrumbItem } from './ui';
import { loadBlogManifest, loadExamRegistry } from '../lib/content-loader';
import { useAuth } from '../lib/auth';
import { EXAM_SCHEMES } from '../types/content';
import type { BlogPostMeta, ExamConfig } from '../types/content';

const platformLinks = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/exams', label: 'Learn', icon: GraduationCap },
  { to: '/blog', label: 'Blog', icon: Newspaper },
  { to: '/tools', label: 'Tools', icon: Wrench },
  { to: '/docs', label: 'Docs', icon: BookOpen },
  { to: '/team', label: 'Team', icon: Users },
  { to: '/analytics', label: 'Analytics', icon: LineChart },
];

function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  // Full label map — URL segment → human label
  const labelMap: Record<string, string> = {
    // Platform sections
    exams:      'Learn',
    blog:       'Blog',
    tools:      'Tools',
    docs:       'Docs',
    team:       'Team',
    analytics:  'Analytics',
    maintainer: 'Maintainer',
    profile:    'Profile',
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
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [blogPosts, setBlogPosts] = useState<BlogPostMeta[]>([]);
  const [pageKey, setPageKey] = useState(location.pathname + location.search);
  const [currentExam, setCurrentExam] = useState<ExamConfig | null>(null);
  const { user } = useAuth();

  const examIdMatch = location.pathname.match(/^\/exams\/([^/]+)/);
  const currentExamId = examIdMatch ? examIdMatch[1] : null;
  const isInExam = Boolean(currentExamId);
  const isInBlog = location.pathname.startsWith('/blog');
  const isInTeam = location.pathname.startsWith('/team') || location.pathname.startsWith('/maintainer/team');

  useEffect(() => {
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
      setCurrentExam(null);
    }
  }, [currentExamId, isInExam]);

  useEffect(() => {
    if (isInBlog) {
      loadBlogManifest().then((m) => setBlogPosts(m.posts.filter((p) => !p.draft))).catch(() => {});
    }
  }, [isInBlog]);

  const blogCategories = [...new Set(blogPosts.map((p) => p.category))];

  return (
    <div className="min-h-screen flex flex-col text-slate-100">
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
              { to: `/exams/${currentExam.id}`, label: 'Overview', icon: GraduationCap, end: true },
              { to: `/exams/${currentExam.id}/quiz`, label: 'Quiz', icon: Brain },
              { to: `/exams/${currentExam.id}/notes`, label: 'Study Notes', icon: BookOpen },
              { to: `/exams/${currentExam.id}/scenarios`, label: 'Scenarios', icon: Layers },
              { to: `/exams/${currentExam.id}/progress`, label: 'Progress', icon: BarChart2 },
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
                      const isActive = location.pathname === `/exams/${currentExam.id}/notes` && searchParams.get('d') === String(domain.id);
                      return (
                        <Link
                          key={domain.id}
                          to={`/exams/${currentExam.id}/notes?d=${domain.id}`}
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
              <nav className="space-y-0.5">
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
              <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-4 mb-2">L0 Orchestrator</h3>
              <div className="space-y-0.5 mb-3">
                {[{ label: 'Platform Orchestrator', color: 'bg-violet-400' }].map(({ label, color }) => (
                  <div key={label} className="flex items-center gap-2.5 px-3 py-1 text-xs text-slate-500">
                    <span className={`w-1.5 h-1.5 rounded-full ${color}`} /><span>{label}</span>
                  </div>
                ))}
              </div>
              <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">🛡️ Security Gate</h3>
              <div className="space-y-0.5 mb-3">
                <div className="flex items-center gap-2.5 px-3 py-1 text-xs text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /><span>Security &amp; Governance</span>
                </div>
              </div>
              <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">🎨 UX Foundation</h3>
              <div className="space-y-0.5 mb-3">
                <div className="flex items-center gap-2.5 px-3 py-1 text-xs text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" /><span>UX Foundation</span>
                </div>
              </div>
              <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">L1 Domain Leads</h3>
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
              <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">L2 Specialists</h3>
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
          {!isInExam && !isInBlog && !isInTeam && (
            <div className="px-4 pb-4">
              <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">
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
          className="flex-1 overflow-y-auto p-4 lg:p-8"
          style={{
            background: 'radial-gradient(ellipse 120% 45% at 50% 0%, rgba(139,92,246,0.10) 0%, transparent 55%)',
            backgroundAttachment: 'fixed',
          }}
        >
          <div className="max-w-5xl mx-auto">
            <Breadcrumbs />
            <div key={pageKey} className="animate-[fadeIn_0.38s_cubic-bezier(0.22,1,0.36,1)_both]">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900/30 backdrop-blur-xl border-t border-slate-700/20 py-4 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Cpu size={14} className="text-violet-400" />
            <span>Aarya — My AI Learning Hub · by Ajeet Chouksey</span>
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