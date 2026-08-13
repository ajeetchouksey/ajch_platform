import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GitPullRequest, ExternalLink, Info, ChevronRight, GraduationCap, Newspaper, Wrench, Lock, BookMarked, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { GithubLogin } from '@/components/GithubLogin';

// ── Static exam + domain whitelist ────────────────────────────────────────
// Hardcoded — never derived from URL params or user input (AppSec constraint)
const EXAM_DOMAINS: Record<string, { label: string; domains: { id: number; label: string }[] }> = {
  ccaf: {
    label: 'CCA-F',
    domains: [
      { id: 1, label: 'Domain 1 — Agentic Architecture' },
      { id: 2, label: 'Domain 2 — Claude Code & Configuration' },
      { id: 3, label: 'Domain 3 — Prompt Engineering' },
      { id: 4, label: 'Domain 4 — Tool Design & MCP' },
      { id: 5, label: 'Domain 5 — Context Management' },
    ],
  },
  ab100: {
    label: 'AB-100',
    domains: [
      { id: 1, label: 'Domain 1 — Plan AI Solutions' },
      { id: 2, label: 'Domain 2 — Design Agentic Systems' },
      { id: 3, label: 'Domain 3 — Monitor & Test' },
      { id: 4, label: 'Domain 4 — Lifecycle & Responsible AI' },
    ],
  },
  ghbp: {
    label: 'GitHub Best Practices',
    domains: [
      { id: 1, label: 'Domain 1 — Branch Management' },
      { id: 2, label: 'Domain 2 — Actions & CI/CD' },
      { id: 3, label: 'Domain 3 — Repo Governance' },
    ],
  },
};

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

const BLOG_CATEGORIES = ['Agentic AI', 'Prompt Engineering', 'MCP & Tools', 'LLM Architecture', 'DevOps & CI/CD', 'Career & Certs', 'Other'];
const TOOL_CATEGORIES = ['Exam Prep', 'Token / Cost', 'Prompt', 'Context / RAG', 'MCP / Schema', 'Other'];

const REPO = 'ajeetchouksey/ajch_platform';
const ISSUE_URL = `https://github.com/${REPO}/issues/new`;

// ── Shared helpers ────────────────────────────────────────────────────────
function openIssue(title: string, body: string, label: string) {
  const params = new URLSearchParams({ title, body, labels: label });
  window.open(`${ISSUE_URL}?${params.toString()}`, '_blank', 'noopener,noreferrer');
}

// ── Types ─────────────────────────────────────────────────────────────────
interface FormState {
  examId: string;
  domainId: string;
  difficulty: string;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  answer: '' | '0' | '1' | '2' | '3';
  explanation: string;
  tags: string;
  source: string;
}

const EMPTY: FormState = {
  examId: 'ccaf',
  domainId: '1',
  difficulty: 'medium',
  text: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  answer: '',
  explanation: '',
  tags: '',
  source: '',
};

// ── Helpers ────────────────────────────────────────────────────────────────
const ANSWER_LABELS = ['A', 'B', 'C', 'D'];

function buildIssueBody(f: FormState, author: string): string {
  const exam = EXAM_DOMAINS[f.examId];
  const domainObj = exam?.domains.find((d) => String(d.id) === f.domainId);
  const optionLines = [f.optionA, f.optionB, f.optionC, f.optionD]
    .map((o, i) => `- **${ANSWER_LABELS[i]})** ${o}`)
    .join('\n');
  const correctLabel = f.answer !== '' ? ANSWER_LABELS[Number(f.answer)] : '?';

  const jsonBlock = f.answer !== ''
    ? `\n<details>\n<summary>JSON snippet</summary>\n\n\`\`\`json\n${JSON.stringify(
        {
          id: '',
          domain: Number(f.domainId),
          text: f.text,
          options: [f.optionA, f.optionB, f.optionC, f.optionD],
          answer: Number(f.answer),
          explanation: f.explanation,
          tags: f.tags.split(',').map((t) => t.trim()).filter(Boolean),
          difficulty: f.difficulty,
        },
        null,
        2
      )}\n\`\`\`\n</details>`
    : '';

  return [
    '## Question Submission',
    '',
    `| Field | Value |`,
    `|---|---|`,
    `| **Submitted by** | @${author} |`,
    `| **Exam** | ${exam?.label ?? f.examId} |`,
    `| **Domain** | ${domainObj?.label ?? f.domainId} |`,
    `| **Difficulty** | ${f.difficulty} |`,
    `| **Tags** | ${f.tags || '—'} |`,
    `| **Source** | ${f.source || '—'} |`,
    '',
    '### Question Text',
    '',
    f.text,
    '',
    '### Options',
    '',
    optionLines,
    '',
    '### Correct Answer',
    '',
    `**${correctLabel}** — ${f.explanation}`,
    jsonBlock,
    '',
    '---',
    '',
    '### Checklist',
    '- [ ] Maps to a real domain objective',
    '- [ ] Exactly one unambiguous correct answer',
    '- [ ] Distractors are plausible',
    '- [ ] Explanation includes a source/reference link',
    '- [ ] No copyrighted text reproduced verbatim',
  ].join('\n');
}

function openDraftPR(f: FormState, author: string) {
  const exam = EXAM_DOMAINS[f.examId];
  const title = `[Question] ${exam?.label} D${f.domainId} — ${f.text.slice(0, 60)}${f.text.length > 60 ? '…' : ''}`;
  const body = buildIssueBody(f, author);
  const params = new URLSearchParams({
    title,
    body,
    labels: 'question-submission',
  });
  // All user input is encoded by URLSearchParams (encodeURIComponent internally).
  // Base URL is a hardcoded constant — no user-controlled host/path.
  window.open(`${ISSUE_URL}?${params.toString()}`, '_blank', 'noopener,noreferrer');
}

// ── Shared style constants ─────────────────────────────────────────────────
const labelCls = 'text-xs font-semibold text-slate-400 uppercase tracking-wide';
const inputCls = 'w-full rounded-lg px-3 py-2 text-sm text-slate-200 bg-slate-900 border border-slate-700 focus:outline-none focus:border-violet-500';
const selectCls = inputCls;
const textareaCls = `${inputCls} resize-none`;

function SubmitRow({ canSubmit }: { canSubmit: boolean }) {
  return (
    <div className="flex items-center gap-4 pt-2">
      <button type="submit" disabled={!canSubmit} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all" style={{ background: canSubmit ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${canSubmit ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.08)'}`, color: canSubmit ? '#c4b5fd' : '#475569', cursor: canSubmit ? 'pointer' : 'not-allowed' }}>
        <GitPullRequest size={15} />
        Open Draft Issue on GitHub
        <ChevronRight size={13} />
      </button>
      {!canSubmit && <span className="text-xs text-slate-600">Fill in required fields to continue.</span>}
    </div>
  );
}

// ── Tab: Blog ─────────────────────────────────────────────────────────────
interface BlogRequest {
  title: string; category: string; summary: string; audience: string; whyNow: string; references: string;
}
const EMPTY_BR: BlogRequest = { title: '', category: BLOG_CATEGORIES[0], summary: '', audience: '', whyNow: '', references: '' };

function BlogTab({ authorName }: { authorName: string }) {
  const [f, setF] = useState<BlogRequest>(EMPTY_BR);
  const [submitted, setSubmitted] = useState(false);
  const set = (k: keyof BlogRequest, v: string) => setF(p => ({ ...p, [k]: v }));

  const canSubmit =
    f.title.trim().length >= 10 &&
    f.summary.trim().length >= 50 &&
    f.audience.trim().length >= 5 &&
    f.whyNow.trim().length >= 20;

  function handleSubmit() {
    const body = [
      '## Blog Post Request', '',
      '| Field | Value |', '|---|---|',
      `| **Submitted by** | @${authorName} |`,
      `| **Proposed Title** | ${f.title} |`,
      `| **Category** | ${f.category} |`,
      '', '### Summary', '', f.summary,
      '', '### Target Audience', '', f.audience,
      '', '### Why Now', '', f.whyNow,
      ...(f.references ? ['', '### References', '', f.references] : []),
      '', '---', '',
      '**Maintainer checklist:**',
      '- [ ] Topic not covered by existing posts',
      '- [ ] Fits platform content scope',
      '- [ ] Add label `status:approved` to approve — contributor will be guided to create a branch in the blog repo',
    ].join('\n');
    openIssue(`[Blog Request] ${f.title}`, body, 'contribution-request');
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-2xl p-8 text-center space-y-5" style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)' }}>
        <CheckCircle2 size={36} className="mx-auto text-emerald-400" />
        <div>
          <p className="text-white font-semibold text-lg">Request opened on GitHub</p>
          <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">Complete the issue in the GitHub tab that just opened. A maintainer will review and approve your proposal.</p>
        </div>
        <div className="rounded-xl p-4 text-left space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-xs font-semibold text-slate-300 mb-2">Once approved, you will:</p>
          <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside">
            <li>Receive a comment on your issue with instructions</li>
            <li>Create a branch in the blog repo: <code className="text-slate-300">blog/your-slug</code></li>
            <li>Write your post and open a PR referencing the issue number</li>
            <li>PR passes CI validation → merge → post goes live</li>
          </ol>
        </div>
        <button type="button" onClick={() => { setF(EMPTY_BR); setSubmitted(false); }}
          className="text-xs px-4 py-2 rounded-xl transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
          Submit another proposal
        </button>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={e => { e.preventDefault(); if (canSubmit) handleSubmit(); }}>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="space-y-1.5 block sm:col-span-2">
          <span className={labelCls}>Proposed Title <span className="normal-case text-slate-600">(working title)</span></span>
          <input type="text" placeholder="e.g. Why Most Agentic Loops Fail at Step 3" className={inputCls} value={f.title} onChange={e => set('title', e.target.value)} maxLength={120} />
        </label>
        <label className="space-y-1.5 block">
          <span className={labelCls}>Category</span>
          <select className={selectCls} value={f.category} onChange={e => set('category', e.target.value)}>
            {BLOG_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="space-y-1.5 block">
          <span className={labelCls}>Target Audience</span>
          <input type="text" placeholder="e.g. AI engineers building production agents" className={inputCls} value={f.audience} onChange={e => set('audience', e.target.value)} maxLength={200} />
        </label>
        <label className="space-y-1.5 block sm:col-span-2">
          <span className={labelCls}>Summary <span className="normal-case text-slate-600">(key points and reader takeaway)</span></span>
          <textarea rows={4} className={textareaCls} placeholder="Describe the concept, what it covers, and what the reader will take away..." value={f.summary} onChange={e => set('summary', e.target.value)} maxLength={1000} />
        </label>
        <label className="space-y-1.5 block sm:col-span-2">
          <span className={labelCls}>Why Now</span>
          <textarea rows={2} className={textareaCls} placeholder="Why is this timely? What gap does it fill in the current content?" value={f.whyNow} onChange={e => set('whyNow', e.target.value)} maxLength={500} />
        </label>
        <label className="space-y-1.5 block sm:col-span-2">
          <span className={labelCls}>References <span className="normal-case text-slate-600">(optional)</span></span>
          <input type="text" placeholder="Links, papers, or docs you'll draw from" className={inputCls} value={f.references} onChange={e => set('references', e.target.value)} maxLength={500} />
        </label>
      </div>
      <div className="flex items-center gap-4 pt-2">
        <button type="submit" disabled={!canSubmit}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ background: canSubmit ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${canSubmit ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.08)'}`, color: canSubmit ? '#c4b5fd' : '#475569', cursor: canSubmit ? 'pointer' : 'not-allowed' }}>
          <GitPullRequest size={15} />
          Propose Post
          <ChevronRight size={13} />
        </button>
        {!canSubmit && <span className="text-xs text-slate-600">Fill in all required fields to continue.</span>}
      </div>
      <p className="text-xs text-slate-600">Opens a pre-filled GitHub issue for maintainer approval. No post is written until approved.</p>
    </form>
  );
}

// ── Tab: Tool ─────────────────────────────────────────────────────────────
interface ToolForm { name: string; category: string; problem: string; description: string; techNotes: string; references: string; }
const EMPTY_T: ToolForm = { name: '', category: TOOL_CATEGORIES[0], problem: '', description: '', techNotes: '', references: '' };

function ToolTab() {
  const [f, setF] = useState<ToolForm>(EMPTY_T);
  const set = (k: keyof ToolForm, v: string) => setF(p => ({ ...p, [k]: v }));
  const canSubmit = f.name.trim().length >= 3 && f.problem.trim().length >= 20;

  function submit() {
    const body = [
      '## Tool Suggestion', '',
      '| Field | Value |', '|---|---|',
      `| **Tool Name** | ${f.name} |`, `| **Category** | ${f.category} |`, '',
      '### Problem it solves', '', f.problem, '',
      f.description ? `### How it works\n\n${f.description}\n` : '',
      f.techNotes ? `### Technical Notes\n\n${f.techNotes}\n` : '',
      f.references ? `### References / Similar tools\n\n${f.references}\n` : '',
      '---',
      '- [ ] Useful to AI practitioners / cert learners on this platform',
      '- [ ] Not a duplicate of an existing tool',
      '- [ ] Technical feasibility considered',
    ].join('\n');
    openIssue(`[Tool] ${f.name} — ${f.problem.slice(0, 60)}`, body, 'tool-suggestion');
  }

  return (
    <form className="space-y-5" onSubmit={e => { e.preventDefault(); if (canSubmit) submit(); }}>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="space-y-1.5 block">
          <span className={labelCls}>Tool Name</span>
          <input type="text" placeholder="e.g. Prompt Diff Viewer" className={inputCls} value={f.name} onChange={e => set('name', e.target.value)} />
        </label>
        <label className="space-y-1.5 block">
          <span className={labelCls}>Category</span>
          <select className={selectCls} value={f.category} onChange={e => set('category', e.target.value)}>
            {TOOL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
      </div>
      <label className="space-y-1.5 block">
        <span className={labelCls}>Problem it solves</span>
        <textarea rows={3} placeholder="What pain point does this tool address for AI practitioners?" className={textareaCls} value={f.problem} onChange={e => set('problem', e.target.value)} />
      </label>
      <label className="space-y-1.5 block">
        <span className={labelCls}>How it works <span className="normal-case text-slate-600">(optional)</span></span>
        <textarea rows={3} placeholder="Describe the expected UX / behaviour…" className={textareaCls} value={f.description} onChange={e => set('description', e.target.value)} />
      </label>
      <label className="space-y-1.5 block">
        <span className={labelCls}>Technical notes <span className="normal-case text-slate-600">(APIs, libraries)</span></span>
        <textarea rows={2} placeholder="Uses the Tokenizers API, runs client-side…" className={textareaCls} value={f.techNotes} onChange={e => set('techNotes', e.target.value)} />
      </label>
      <label className="space-y-1.5 block">
        <span className={labelCls}>References / Similar tools</span>
        <textarea rows={2} placeholder="https://…" className={textareaCls} value={f.references} onChange={e => set('references', e.target.value)} />
      </label>
      <SubmitRow canSubmit={canSubmit} />
    </form>
  );
}

// ── Tab: Course proposal ───────────────────────────────────────────────────
const CERT_BODIES = ['Anthropic', 'GitHub', 'OpenAI', 'Microsoft', 'Google', 'AWS', 'Hashicorp', 'Linux Foundation', 'Other'];
interface CourseForm { name: string; certBody: string; examUrl: string; rationale: string; domains: string; references: string; }
const EMPTY_C: CourseForm = { name: '', certBody: CERT_BODIES[0], examUrl: '', rationale: '', domains: '', references: '' };

function CourseTab({ authorName }: { authorName: string }) {
  const [f, setF] = useState<CourseForm>(EMPTY_C);
  const set = (k: keyof CourseForm, v: string) => setF(p => ({ ...p, [k]: v }));
  const canSubmit = f.name.trim().length >= 5 && f.examUrl.trim().startsWith('https://') && f.rationale.trim().length >= 50;

  function submit() {
    const body = [
      '## New Course / Exam Proposal', '',
      `| Field | Value |`, `|---|---|`,
      `| **Proposed by** | @${authorName} |`,
      `| **Exam Name** | ${f.name} |`,
      `| **Certification Body** | ${f.certBody} |`,
      `| **Official URL** | ${f.examUrl} |`, '',
      '### Why this certification matters', '', f.rationale, '',
      f.domains ? `### Domain / Topic Outline\n\n${f.domains}\n` : '',
      f.references ? `### References\n\n${f.references}\n` : '',
      '---',
      '- [ ] Official exam page confirmed to exist',
      '- [ ] Audience overlap with current platform users',
      '- [ ] At least one contributor willing to draft initial content',
    ].join('\n');
    openIssue(`[Course] ${f.name} — ${f.certBody}`, body, 'course-proposal');
  }

  return (
    <form className="space-y-5" onSubmit={e => { e.preventDefault(); if (canSubmit) submit(); }}>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="space-y-1.5 block sm:col-span-2">
          <span className={labelCls}>Exam / Course Name</span>
          <input type="text" placeholder="e.g. GitHub Foundations Certification" className={inputCls} value={f.name} onChange={e => set('name', e.target.value)} />
        </label>
        <label className="space-y-1.5 block">
          <span className={labelCls}>Certification Body</span>
          <select className={selectCls} value={f.certBody} onChange={e => set('certBody', e.target.value)}>
            {CERT_BODIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="space-y-1.5 block">
          <span className={labelCls}>Official Exam URL</span>
          <input type="url" placeholder="https://certification.github.com/…" className={inputCls} value={f.examUrl} onChange={e => set('examUrl', e.target.value)} />
        </label>
      </div>
      <label className="space-y-1.5 block">
        <span className={labelCls}>Why this cert matters</span>
        <textarea rows={3} placeholder="Who should take it and why does it matter for AI practitioners or DevOps engineers?" className={textareaCls} value={f.rationale} onChange={e => set('rationale', e.target.value)} />
      </label>
      <label className="space-y-1.5 block">
        <span className={labelCls}>Domain / Topic Outline <span className="normal-case text-slate-600">(optional)</span></span>
        <textarea rows={3} placeholder="D1: Repository Management&#10;D2: Collaboration&#10;D3: Modern Development" className={textareaCls} value={f.domains} onChange={e => set('domains', e.target.value)} />
      </label>
      <label className="space-y-1.5 block">
        <span className={labelCls}>References <span className="normal-case text-slate-600">(study guides, syllabi)</span></span>
        <textarea rows={2} placeholder="https://…" className={textareaCls} value={f.references} onChange={e => set('references', e.target.value)} />
      </label>
      <SubmitRow canSubmit={canSubmit} />
    </form>
  );
}

// ── Tab definitions ────────────────────────────────────────────────────────
type TabId = 'question' | 'blog' | 'tool' | 'course';
const TABS: { id: TabId; label: string; icon: typeof GraduationCap; color: string; hint: string }[] = [
  { id: 'question', label: 'Exam Question', icon: GraduationCap, color: '#34d399', hint: 'Add a practice MCQ to an exam domain' },
  { id: 'blog',     label: 'Blog Post',     icon: Newspaper,    color: '#a78bfa', hint: 'Propose a post for review' },
  { id: 'tool',     label: 'Tool Idea',     icon: Wrench,       color: '#60a5fa', hint: 'Suggest a new AI tool' },
  { id: 'course',   label: 'New Course',    icon: BookMarked,   color: '#fb923c', hint: 'Propose a new exam to add' },
];

// ── Main component ─────────────────────────────────────────────────────────
export default function Contribute() {
  const [tab, setTab] = useState<TabId>('question');
  const [mounted, setMounted] = useState(false);
  const { user, isLoading } = useAuth();
  useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);
  const activeTab = TABS.find(t => t.id === tab)!;
  const authorName = user ? (user.name ?? user.login) : '';

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center h-48">
        <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 transition-all duration-500" style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(8px)', willChange: 'opacity, transform' }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#a78bfa' }}>Community</p>
          <h1 className="text-2xl font-bold text-white mt-1">Contribute</h1>
        </div>
        <div className="rounded-2xl p-8 text-center space-y-5" style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)' }}>
          <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)' }}>
            <Lock size={22} className="text-violet-400" />
          </div>
          <div>
            <p className="text-white font-semibold text-lg">Sign in to contribute</p>
            <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">Submit exam questions, write blog posts, or propose tools. Your GitHub identity is used to credit contributions.</p>
          </div>
          <div className="flex justify-center">
            <GithubLogin />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 transition-all duration-500" style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(8px)', willChange: 'opacity, transform' }}>
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#a78bfa' }}>Community</p>
        <h1 className="text-2xl font-bold text-white mt-1">Contribute</h1>
        <p className="text-slate-400 text-sm mt-1">Submit an exam question, propose a blog post, or suggest a new tool. All submissions open a pre-filled GitHub issue for maintainer review.</p>
      </div>

      {/* Tab switcher */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {TABS.map(({ id, label, icon: Icon, color, hint }) => (
          <button key={id} type="button" onClick={() => setTab(id)} className="flex flex-col gap-1.5 p-3 rounded-xl text-left transition-all" style={{ background: tab === id ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${tab === id ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)'}` }}>
            <Icon size={16} style={{ color: tab === id ? color : '#475569' }} />
            <span className="text-xs font-semibold" style={{ color: tab === id ? '#e2e8f0' : '#64748b' }}>{label}</span>
            <span className="text-[11px] leading-tight" style={{ color: tab === id ? '#94a3b8' : '#334155' }}>{hint}</span>
          </button>
        ))}
      </div>

      {/* Info banner */}
      <div className="flex gap-3 rounded-xl p-4 text-sm text-slate-300" style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)' }}>
        <Info size={16} className="shrink-0 mt-0.5 text-violet-400" />
        <div>
          Submissions are reviewed by maintainers. Read the{' '}
          <a href={`https://github.com/${REPO}/blob/main/.github/CONTRIBUTING.md`} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline inline-flex items-center gap-1">
            contribution guide <ExternalLink size={11} />
          </a>{' '}
          before submitting. Questions also need to satisfy the <Link to="/docs" className="text-violet-400 hover:underline">content schema</Link>.
        </div>
      </div>

      {/* Active tab label */}
      <div className="flex items-center gap-2 pb-1 border-b border-slate-800">
        <activeTab.icon size={14} style={{ color: activeTab.color }} />
        <span className="text-sm font-semibold text-slate-300">{activeTab.label}</span>
      </div>

      {/* Forms */}
      {tab === 'question' && <QuestionTabForm authorName={authorName} />}
      {tab === 'blog'     && <BlogTab authorName={authorName} />}
      {tab === 'tool'     && <ToolTab />}
      {tab === 'course'   && <CourseTab authorName={authorName} />}

      {/* Footer */}
      <p className="text-xs text-slate-600 border-t border-slate-800 pt-4">
        Clicking "Open Draft Issue" opens GitHub in a new tab. No data is sent to our servers.{' '}
        <a href={`https://github.com/${REPO}/blob/main/.github/CONTRIBUTING.md`} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-violet-400 transition-colors">
          Read the contribution guide ↗
        </a>
      </p>
    </div>
  );
}
function QuestionTabForm({ authorName }: { authorName: string }) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const set = (key: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));
  const domains = EXAM_DOMAINS[form.examId]?.domains ?? [];
  const canSubmit =
    form.text.trim().length >= 10 &&
    form.optionA.trim().length > 0 &&
    form.optionB.trim().length > 0 &&
    form.optionC.trim().length > 0 &&
    form.optionD.trim().length > 0 &&
    form.answer !== '' &&
    form.explanation.trim().length >= 10;

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) openDraftPR(form, authorName);
      }}
    >
        {/* Exam + Domain */}
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Exam</span>
            <select
              className="w-full rounded-lg px-3 py-2 text-sm text-slate-200 bg-slate-900 border border-slate-700 focus:outline-none focus:border-violet-500"
              value={form.examId}
              onChange={(e) => {
                const id = e.target.value;
                // Reset domainId when exam changes
                const firstDomain = EXAM_DOMAINS[id]?.domains[0]?.id ?? 1;
                setForm((prev) => ({ ...prev, examId: id, domainId: String(firstDomain) }));
              }}
            >
              {Object.entries(EXAM_DOMAINS).map(([id, { label }]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Domain</span>
            <select
              className="w-full rounded-lg px-3 py-2 text-sm text-slate-200 bg-slate-900 border border-slate-700 focus:outline-none focus:border-violet-500"
              value={form.domainId}
              onChange={(e) => set('domainId', e.target.value)}
            >
              {domains.map((d) => (
                <option key={d.id} value={String(d.id)}>{d.label}</option>
              ))}
            </select>
          </label>
        </div>

        {/* Difficulty */}
        <label className="space-y-1.5 block">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Difficulty</span>
          <div className="flex gap-3">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => set('difficulty', d)}
                className="px-3 py-1.5 rounded-lg text-sm capitalize transition-colors"
                style={{
                  background: form.difficulty === d ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${form.difficulty === d ? 'rgba(167,139,250,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  color: form.difficulty === d ? '#c4b5fd' : '#94a3b8',
                }}
              >
                {d}
              </button>
            ))}
          </div>
        </label>

        {/* Question text */}
        <label className="space-y-1.5 block">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Question</span>
          <textarea
            rows={3}
            placeholder="Which of the following best describes…"
            className="w-full rounded-lg px-3 py-2 text-sm text-slate-200 bg-slate-900 border border-slate-700 focus:outline-none focus:border-violet-500 resize-none"
            value={form.text}
            onChange={(e) => set('text', e.target.value)}
          />
        </label>

        {/* Options */}
        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
            Options — select the correct answer
          </legend>
          {(['optionA', 'optionB', 'optionC', 'optionD'] as const).map((key, idx) => (
            <div key={key} className="flex items-center gap-3">
              <input
                type="radio"
                name="correct"
                value={String(idx)}
                checked={form.answer === String(idx)}
                onChange={() => set('answer', String(idx))}
                className="accent-violet-500 shrink-0 w-4 h-4"
              />
              <span className="text-xs font-bold text-slate-500 w-4 shrink-0">{ANSWER_LABELS[idx]}</span>
              <input
                type="text"
                placeholder={`Option ${ANSWER_LABELS[idx]}`}
                className="flex-1 rounded-lg px-3 py-2 text-sm text-slate-200 bg-slate-900 border border-slate-700 focus:outline-none focus:border-violet-500"
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
              />
            </div>
          ))}
          <p className="text-xs text-slate-600">Select the radio button next to the correct answer.</p>
        </fieldset>

        {/* Explanation */}
        <label className="space-y-1.5 block">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Explanation</span>
          <textarea
            rows={3}
            placeholder="Explain why the correct answer is right and why the distractors are wrong…"
            className="w-full rounded-lg px-3 py-2 text-sm text-slate-200 bg-slate-900 border border-slate-700 focus:outline-none focus:border-violet-500 resize-none"
            value={form.explanation}
            onChange={(e) => set('explanation', e.target.value)}
          />
        </label>

        {/* Tags + Source */}
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="space-y-1.5 block">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Tags <span className="normal-case text-slate-600">(comma-separated)</span>
            </span>
            <input
              type="text"
              placeholder="tool-use, mcp, agentic"
              className="w-full rounded-lg px-3 py-2 text-sm text-slate-200 bg-slate-900 border border-slate-700 focus:outline-none focus:border-violet-500"
              value={form.tags}
              onChange={(e) => set('tags', e.target.value)}
            />
          </label>

          <label className="space-y-1.5 block">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Source / Reference URL</span>
            <input
              type="url"
              placeholder="https://docs.anthropic.com/…"
              className="w-full rounded-lg px-3 py-2 text-sm text-slate-200 bg-slate-900 border border-slate-700 focus:outline-none focus:border-violet-500"
              value={form.source}
              onChange={(e) => set('source', e.target.value)}
            />
          </label>
        </div>

        <SubmitRow canSubmit={canSubmit} />
      </form>
  );
}
