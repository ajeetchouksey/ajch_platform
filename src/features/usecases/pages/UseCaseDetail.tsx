import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Lightbulb,
  BookOpen,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import {
  loadUseCaseById,
  type AnyUseCase,
  type FeaturedUseCase,
} from '@/lib/content-loader';
import { useMeta } from '@/lib/useMeta';
import { GlassCard, Badge, SectionHeader } from '@/components/ui';
import {
  PATTERN_LABEL,
  PATTERN_BADGE,
  VERTICAL_LABEL,
  VERTICAL_ACCENT,
} from '../usecases-constants';

function isFeatured(u: AnyUseCase): u is FeaturedUseCase {
  return 'problem' in u;
}

export default function UseCaseDetail() {
  const { id } = useParams<{ id: string }>();
  const [uc, setUc] = useState<AnyUseCase | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    loadUseCaseById(id)
      .then((u) => {
        if (!u) setError('Use case not found.');
        else setUc(u);
      })
      .catch(() => setError('Could not load use case.'));
  }, [id]);

  useMeta({
    title: uc ? `${uc.title} · AI Use Cases · Aarya` : 'AI Use Cases · Aarya',
    description:
      uc && isFeatured(uc)
        ? (uc as FeaturedUseCase).problem
        : 'Enterprise AI use case from Aarya — My AI Learning Hub.',
  });

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-rose-300 text-sm">{error}</p>
        <Link to="/usecases" className="mt-4 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200">
          <ArrowLeft size={12} /> Back to Use Cases
        </Link>
      </div>
    );
  }

  if (!uc) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-xs text-slate-500">Loading…</p>
      </div>
    );
  }

  const featured = isFeatured(uc) ? uc : null;
  const accent = VERTICAL_ACCENT[uc.vertical] ?? 'slate';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Back link */}
      <Link
        to="/usecases"
        className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 mb-6 transition-colors"
      >
        <ArrowLeft size={12} /> All Use Cases
      </Link>

      {/* Header */}
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <Badge
          label={VERTICAL_LABEL[uc.vertical] ?? uc.vertical}
          variant={accent}
          size="xs"
          uppercase
        />
        {uc.patterns.map((p) => (
          <Badge
            key={p}
            label={PATTERN_LABEL[p] ?? p}
            variant={PATTERN_BADGE[p] ?? 'slate'}
            size="xs"
          />
        ))}
      </div>

      <SectionHeader
        title={uc.title}
        as="h1"
        className="mb-6"
      />

      {/* Featured content */}
      {featured && (
        <div className="space-y-6">
          {/* Problem / Solution / Who */}
          <GlassCard accent={accent} border="border-slate-700/40" className="p-6">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Problem</p>
                <p className="text-sm text-slate-300 leading-relaxed">{featured.problem}</p>
              </div>

              {featured.solution && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Solution</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{featured.solution}</p>
                </div>
              )}

              {featured.whoItsFor && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Who It's For</p>
                  <p className="text-sm text-slate-400">{featured.whoItsFor}</p>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Workflow steps */}
          {featured.workflowSteps && featured.workflowSteps.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <CheckCircle2 size={14} className="text-blue-400" />
                Workflow Steps
              </h2>
              <ol className="space-y-2">
                {featured.workflowSteps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-300">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-semibold text-slate-400 inline-flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Key insights */}
          {featured.keyInsights && (
            <GlassCard
              accent="amber"
              border="border-amber-500/20"
              className="p-5"
            >
              <div className="flex gap-3">
                <Lightbulb size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-amber-500/80 mb-1">Key Insight</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{featured.keyInsights}</p>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Related exams */}
          {featured.relatedExams && featured.relatedExams.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <BookOpen size={14} className="text-violet-400" />
                Related Exam Domains
              </h2>
              <div className="space-y-2">
                {featured.relatedExams.map((re, i) => (
                  <Link
                    key={i}
                    to={`/skillup/${re.exam}`}
                    className="flex items-start gap-3 group"
                  >
                    <GlassCard
                      accent="violet"
                      border="border-slate-700/40"
                      className="p-3 w-full transition-colors group-hover:border-violet-500/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <Badge label={re.exam.toUpperCase()} variant="violet" size="xs" uppercase />
                            <span className="text-[10px] text-slate-500">Domain {re.domain}</span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">{re.why}</p>
                        </div>
                        <ChevronRight size={12} className="text-slate-600 group-hover:text-violet-400 mt-1 flex-shrink-0 transition-colors" />
                      </div>
                    </GlassCard>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Related interview questions */}
          {featured.relatedInterviewQs && featured.relatedInterviewQs.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <MessageSquare size={14} className="text-blue-400" />
                Related Interview Questions
              </h2>
              <div className="flex flex-wrap gap-2">
                {featured.relatedInterviewQs.map((qid) => (
                  <Link
                    key={qid}
                    to={`/interview/q/${qid}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 hover:border-blue-500/40 hover:text-blue-300 transition-colors"
                  >
                    {qid}
                    <ChevronRight size={11} />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Catalog-only fallback */}
      {!featured && (
        <GlassCard accent={accent} border="border-slate-700/40" className="p-6">
          <p className="text-sm text-slate-400">
            Full details for this use case are coming in a future update. Check back soon.
          </p>
          <Link
            to="/usecases"
            className="mt-4 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft size={11} /> Browse all use cases
          </Link>
        </GlassCard>
      )}

      {/* Source attribution */}
      <p className="mt-10 text-xs text-slate-600">
        Source: Stack AI — AI Agents: 100+ Use Cases Transforming Enterprises
      </p>
    </div>
  );
}
