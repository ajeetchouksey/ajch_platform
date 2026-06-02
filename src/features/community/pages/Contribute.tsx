import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GitPullRequest, ExternalLink, Info, ChevronRight } from 'lucide-react';

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

const REPO = 'ajeetchouksey/ajch_platform';
const ISSUE_URL = `https://github.com/${REPO}/issues/new`;

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

function buildIssueBody(f: FormState): string {
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

function openDraftPR(f: FormState) {
  const exam = EXAM_DOMAINS[f.examId];
  const title = `[Question] ${exam?.label} D${f.domainId} — ${f.text.slice(0, 60)}${f.text.length > 60 ? '…' : ''}`;
  const body = buildIssueBody(f);
  const params = new URLSearchParams({
    title,
    body,
    labels: 'question-submission',
  });
  // All user input is encoded by URLSearchParams (encodeURIComponent internally).
  // Base URL is a hardcoded constant — no user-controlled host/path.
  window.open(`${ISSUE_URL}?${params.toString()}`, '_blank', 'noopener,noreferrer');
}

// ── Component ──────────────────────────────────────────────────────────────
export default function Contribute() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 0);
  }, []);

  const set = (key: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const domains = EXAM_DOMAINS[form.examId]?.domains ?? [];

  const canSubmit =
    form.text.trim().length >= 10 &&
    form.optionA.trim() &&
    form.optionB.trim() &&
    form.optionC.trim() &&
    form.optionD.trim() &&
    form.answer !== '' &&
    form.explanation.trim().length >= 10;

  return (
    <div
      className="max-w-2xl mx-auto space-y-8 transition-all duration-500"
      style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(8px)' }}
    >
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#a78bfa' }}>
          Community
        </p>
        <h1 className="text-2xl font-bold text-white mt-1">Contribute a Question</h1>
        <p className="text-slate-400 text-sm mt-1">
          Help build the question bank. Your submission opens a pre-filled GitHub issue for maintainer review.
        </p>
      </div>

      {/* Info banner */}
      <div
        className="flex gap-3 rounded-xl p-4 text-sm text-slate-300"
        style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)' }}
      >
        <Info size={16} className="shrink-0 mt-0.5 text-violet-400" />
        <div>
          Submissions are reviewed against the exam blueprint. Read the{' '}
          <Link to="/docs" className="text-violet-400 hover:underline">
            content schema docs
          </Link>{' '}
          and{' '}
          <a
            href={`https://github.com/${REPO}/blob/main/.github/CONTRIBUTING.md`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-400 hover:underline inline-flex items-center gap-1"
          >
            contribution guide <ExternalLink size={11} />
          </a>{' '}
          before submitting.
        </div>
      </div>

      {/* Form */}
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) openDraftPR(form);
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

        {/* Submit */}
        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: canSubmit ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${canSubmit ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.08)'}`,
              color: canSubmit ? '#c4b5fd' : '#475569',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
            }}
          >
            <GitPullRequest size={15} />
            Open Draft Issue on GitHub
            <ChevronRight size={13} />
          </button>
          {!canSubmit && (
            <span className="text-xs text-slate-600">Fill in all required fields to continue.</span>
          )}
        </div>
      </form>

      {/* Footer note */}
      <p className="text-xs text-slate-600 border-t border-slate-800 pt-4">
        Clicking "Open Draft Issue" opens GitHub in a new tab with a pre-filled issue. No data is sent to our servers.{' '}
        <a
          href={`https://github.com/${REPO}/blob/main/.github/CONTRIBUTING.md`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-500 hover:text-violet-400 transition-colors"
        >
          Read the contribution guide ↗
        </a>
      </p>
    </div>
  );
}
