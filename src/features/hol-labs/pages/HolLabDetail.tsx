import { useEffect, useState, lazy, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ListChecks,
  Target,
  Lightbulb,
  ClipboardCheck,
  Trash2,
  DollarSign,
  BookOpen,
  Newspaper,
  Building2,
  ChevronRight,
  Clock,
  GitGraph,
} from 'lucide-react';
const MermaidDiagram = lazy(() => import('@/components/MermaidDiagram'));
import { loadHolLabById, type HolLab } from '@/lib/content-loader';
import { useMeta } from '@/lib/useMeta';
import { useRelationships } from '@/lib/useRelationships';
import { GlassCard, Badge, SectionHeader } from '@/components/ui';
import ComputedRelatedList from '@/components/ComputedRelatedList';
import { DOMAIN_LABELS, DOMAIN_ACCENT, COST_TIER_VARIANT, COST_TIER_LABEL, RELATION_LABEL } from '../hol-labs-constants';

export default function HolLabDetail() {
  const { id } = useParams<{ id: string }>();
  const [lab, setLab] = useState<HolLab | null>(null);
  const [error, setError] = useState<string | null>(null);
  const computedRelated = useRelationships(id ? `lab/${id}` : undefined);

  useEffect(() => {
    if (!id) return;
    loadHolLabById(id)
      .then(setLab)
      .catch(() => setError('Could not load this lab.'));
  }, [id]);

  useMeta({
    title: lab ? `${lab.title} · HOL Labs · Aarya` : 'HOL Labs · Aarya',
    description: lab?.problemStatement ?? 'Guided, hands-on lab from Aarya — My AI Learning Hub.',
  });

  if (error) {
    return (
      <div className="max-w-5xl xl:max-w-6xl mx-auto px-4 py-16 text-center">
        <p className="text-rose-300 text-sm">{error}</p>
        <Link to="/hol-labs" className="mt-4 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200">
          <ArrowLeft size={12} /> Back to HOL Labs
        </Link>
      </div>
    );
  }

  if (!lab) {
    return (
      <div className="max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 py-10 animate-pulse">
        <div className="h-3 w-24 rounded bg-slate-800 mb-8" />
        <div className="flex gap-2 mb-3">
          <div className="h-5 w-20 rounded-full bg-slate-800" />
          <div className="h-5 w-16 rounded-full bg-slate-800" />
        </div>
        <div className="h-7 w-2/3 rounded bg-slate-800 mb-6" />
        <div className="rounded-xl border border-slate-800 p-6 space-y-3 mb-6">
          <div className="h-4 w-full rounded bg-slate-800" />
          <div className="h-4 w-5/6 rounded bg-slate-800" />
        </div>
      </div>
    );
  }

  const accent = DOMAIN_ACCENT[lab.domain] ?? 'slate';
  const hasRelations = lab.relatedExams.length > 0 || lab.relatedBlogPosts.length > 0
    || lab.relatedUseCases.length > 0 || lab.relatedLabs.length > 0 || computedRelated.length > 0;

  return (
    <div className="max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <Link
        to="/hol-labs"
        className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 mb-6 transition-colors"
      >
        <ArrowLeft size={12} /> All HOL Labs
      </Link>

      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <Badge label={DOMAIN_LABELS[lab.domain] ?? lab.domain} variant={accent} size="xs" uppercase />
        <Badge label={lab.difficulty} variant="slate" size="xs" />
        <Badge label={COST_TIER_LABEL[lab.costEstimate.tier]} variant={COST_TIER_VARIANT[lab.costEstimate.tier]} size="xs" />
        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 ml-1">
          <Clock size={11} /> {lab.estimatedMinutes} min
        </span>
      </div>

      <SectionHeader title={lab.title} as="h1" className="mb-6" />

      <div className="flex flex-col xl:flex-row gap-6 xl:gap-8 items-start">
        {/* ── Left: main content ──────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* Problem / Approach */}
          <GlassCard accent={accent} border="border-slate-700/40" className="p-6">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">The Problem</p>
                <p className="text-sm text-slate-300 leading-relaxed">{lab.problemStatement}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Why This Approach</p>
                <p className="text-sm text-slate-300 leading-relaxed">{lab.approachRationale}</p>
              </div>
            </div>
          </GlassCard>

          {/* Cost — always visible up front, not buried */}
          <div
            className="rounded-xl p-4 flex items-start gap-3"
            style={{ background: 'rgba(15,23,42,0.70)', border: '1px solid rgba(52,211,153,0.20)' }}
          >
            <DollarSign size={15} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-semibold text-emerald-300 mb-1">
                {COST_TIER_LABEL[lab.costEstimate.tier]}
                {lab.costEstimate.monthlyEstimateUSD > 0 && ` — ~$${lab.costEstimate.monthlyEstimateUSD}/mo if left running`}
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">{lab.costEstimate.freeTierNotes}</p>
            </div>
          </div>

          {/* Flow diagram — optional, only when the lab's flow genuinely benefits from a picture */}
          {lab.mermaidDiagram && (
            <div>
              <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <GitGraph size={14} className="text-violet-400" />
                Flow
              </h2>
              <GlassCard accent="violet" border="border-slate-700/40" className="p-4">
                <Suspense fallback={
                  <div className="rounded-xl border border-violet-900/20 bg-slate-900/50 flex items-center justify-center" style={{ minHeight: '180px' }}>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="w-3 h-3 rounded-full border-2 border-violet-600/40 border-t-violet-400 animate-spin" />
                      Loading diagram…
                    </div>
                  </div>
                }>
                  <MermaidDiagram chart={lab.mermaidDiagram} />
                </Suspense>
              </GlassCard>
            </div>
          )}

          {/* Prerequisites */}
          <div>
            <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <ListChecks size={14} className="text-sky-400" />
              Prerequisites
            </h2>
            <ul className="space-y-2">
              {lab.prerequisites.map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-sm text-slate-300 leading-relaxed">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-sky-500/60 shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {/* Learning objectives */}
          <div>
            <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <Target size={14} className="text-violet-400" />
              Learning Objectives
            </h2>
            <ul className="space-y-2">
              {lab.learningObjectives.map((o) => (
                <li key={o} className="flex items-start gap-2.5 text-sm text-slate-300 leading-relaxed">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-violet-500/60 shrink-0" />
                  {o}
                </li>
              ))}
            </ul>
          </div>

          {/* Steps */}
          <div>
            <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <ListChecks size={14} className="text-amber-400" />
              Steps
            </h2>
            <div className="space-y-4">
              {lab.steps.map((step) => (
                <GlassCard key={step.order} accent="slate" border="border-slate-700/40" className="p-5">
                  <div className="flex items-start gap-3 mb-2">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-[11px] font-semibold text-slate-300 inline-flex items-center justify-center mt-0.5">
                      {step.order}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-100 leading-snug mt-0.5">{step.title}</h3>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed ml-9 mb-2">{step.instructions}</p>
                  <div className="ml-9 flex gap-2 mb-2">
                    <Lightbulb size={13} className="text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-400 leading-relaxed">
                      <span className="text-amber-300 font-semibold">Why it matters: </span>
                      {step.whyItMatters}
                    </p>
                  </div>
                  {step.code && (
                    <pre className="ml-9 bg-slate-900/80 border border-slate-800 rounded-lg p-3 text-xs overflow-x-auto mb-2">
                      <code className="text-slate-300">{step.code.snippet}</code>
                    </pre>
                  )}
                  <div className="ml-9 flex gap-2">
                    <ClipboardCheck size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-400 leading-relaxed">
                      <span className="text-emerald-300 font-semibold">Expected result: </span>
                      {step.expectedResult}
                    </p>
                  </div>
                  {lab.conceptChecks.filter((c) => c.afterStep === step.order).map((c) => (
                    <details key={c.question} className="ml-9 mt-3 text-xs bg-slate-800/40 rounded-lg p-3 border border-slate-700/40">
                      <summary className="cursor-pointer text-slate-300 font-medium">Concept check: {c.question}</summary>
                      <p className="mt-2 text-slate-400 leading-relaxed">{c.answer}</p>
                    </details>
                  ))}
                </GlassCard>
              ))}
            </div>
          </div>

          {/* Validation checklist */}
          <div>
            <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <ClipboardCheck size={14} className="text-emerald-400" />
              Validation Checklist
            </h2>
            <ul className="space-y-2">
              {lab.validationChecklist.map((v) => (
                <li key={v} className="flex items-start gap-2.5 text-sm text-slate-300 leading-relaxed">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500/60 shrink-0" />
                  {v}
                </li>
              ))}
            </ul>
          </div>

          {/* Cleanup */}
          <div>
            <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <Trash2 size={14} className="text-rose-400" />
              Cleanup
            </h2>
            <ul className="space-y-2">
              {lab.cleanup.map((c) => (
                <li key={c} className="flex items-start gap-2.5 text-sm text-slate-300 leading-relaxed">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-500/60 shrink-0" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Right sidebar ────────────────────────────────────────────── */}
        {hasRelations && (
          <div className="w-full xl:w-72 2xl:w-80 shrink-0 space-y-5 xl:sticky xl:top-4 self-start">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              How This Lab Connects
            </h2>

            {lab.relatedExams.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <BookOpen size={12} className="text-violet-400" /> Exam Domain
                </p>
                <div className="space-y-2">
                  {lab.relatedExams.map((r) => (
                    <Link key={r.exam} to={`/skillup/${r.exam}`} className="flex items-start gap-3 group">
                      <GlassCard accent="violet" border="border-slate-700/40" className="p-3 w-full transition-colors group-hover:border-violet-500/40">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              <Badge label={r.exam.toUpperCase()} variant="violet" size="xs" uppercase />
                              <span className="text-[10px] text-slate-500">Domain {r.domain}</span>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">{r.why}</p>
                          </div>
                          <ChevronRight size={12} className="text-slate-600 group-hover:text-violet-400 mt-1 flex-shrink-0 transition-colors" />
                        </div>
                      </GlassCard>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {lab.relatedBlogPosts.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Newspaper size={12} className="text-blue-400" /> Blog Posts
                </p>
                <div className="space-y-2">
                  {lab.relatedBlogPosts.map((r) => (
                    <Link key={r.slug} to={`/blog/${r.slug}`} className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/40 hover:bg-slate-800/80 transition-all group">
                      <ChevronRight size={13} className="text-blue-400 mt-0.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      <p className="text-xs text-slate-400 leading-relaxed">{r.why}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {lab.relatedUseCases.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Building2 size={12} className="text-emerald-400" /> Use Cases
                </p>
                <div className="space-y-2">
                  {lab.relatedUseCases.map((r) => (
                    <Link key={r.id} to={`/usecases/${r.id}`} className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-emerald-500/40 hover:bg-slate-800/80 transition-all group">
                      <ChevronRight size={13} className="text-emerald-400 mt-0.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      <p className="text-xs text-slate-400 leading-relaxed">{r.why}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {lab.relatedLabs.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  Other Labs
                </p>
                <div className="space-y-2">
                  {lab.relatedLabs.map((r) => (
                    <Link key={r.id} to={`/hol-labs/${r.id}`} className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-amber-500/40 hover:bg-slate-800/80 transition-all group">
                      <ChevronRight size={13} className="text-amber-400 mt-0.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-200 leading-snug">{RELATION_LABEL[r.relation]}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{r.why}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <ComputedRelatedList edges={computedRelated} />
          </div>
        )}
      </div>
    </div>
  );
}
