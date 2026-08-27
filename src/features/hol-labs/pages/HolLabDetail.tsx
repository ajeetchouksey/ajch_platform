import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { loadHolLabById, type HolLab } from '@/lib/content-loader';
import { GlassCard, Badge, SectionHeader } from '@/components/ui';
import { COST_TIER_VARIANT, RELATION_LABEL } from '../hol-labs-constants';

export default function HolLabDetail() {
  const { id } = useParams<{ id: string }>();
  const [lab, setLab] = useState<HolLab | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    loadHolLabById(id).then(setLab).catch((e: unknown) => setError(String(e)));
  }, [id]);

  if (error) return <div className="text-red-400 text-sm">Failed to load lab: {error}</div>;
  if (!lab) return <div className="text-slate-500 text-sm">Loading lab…</div>;

  const hasRelations = lab.relatedExams.length > 0 || lab.relatedBlogPosts.length > 0
    || lab.relatedUseCases.length > 0 || lab.relatedLabs.length > 0;

  return (
    <div className="space-y-8">
      <SectionHeader title={lab.title} subtitle={lab.problemStatement} />

      <GlassCard className="p-4 space-y-2" accent="violet">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge label={lab.difficulty} variant="violet" size="xs" />
          <Badge label={lab.costEstimate.tier} variant={COST_TIER_VARIANT[lab.costEstimate.tier]} size="xs" />
          <span className="text-xs text-slate-500">{lab.estimatedMinutes} min</span>
        </div>
        <p className="text-sm text-slate-300"><strong className="text-white">Why this approach:</strong> {lab.approachRationale}</p>
        {lab.costEstimate.freeTierNotes && (
          <p className="text-xs text-slate-500">{lab.costEstimate.freeTierNotes}</p>
        )}
      </GlassCard>

      <section>
        <h2 className="text-sm font-semibold text-white mb-2">Prerequisites</h2>
        <ul className="list-disc list-inside text-sm text-slate-400 space-y-1">
          {lab.prerequisites.map((p) => <li key={p}>{p}</li>)}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-white mb-2">Learning Objectives</h2>
        <ul className="list-disc list-inside text-sm text-slate-400 space-y-1">
          {lab.learningObjectives.map((o) => <li key={o}>{o}</li>)}
        </ul>
      </section>

      <section className="space-y-6">
        <h2 className="text-sm font-semibold text-white">Steps</h2>
        {lab.steps.map((step) => (
          <GlassCard key={step.order} className="p-4 space-y-2">
            <h3 className="text-sm font-semibold text-white">{step.order}. {step.title}</h3>
            <p className="text-sm text-slate-300">{step.instructions}</p>
            <p className="text-xs text-violet-300/80"><strong>Why it matters:</strong> {step.whyItMatters}</p>
            {step.code && (
              <pre className="bg-slate-900/70 rounded-lg p-3 text-xs overflow-x-auto"><code>{step.code.snippet}</code></pre>
            )}
            <p className="text-xs text-emerald-400/80"><strong>Expected result:</strong> {step.expectedResult}</p>
            {lab.conceptChecks.filter((c) => c.afterStep === step.order).map((c) => (
              <details key={c.question} className="text-xs bg-slate-800/40 rounded-lg p-3">
                <summary className="cursor-pointer text-slate-300">Concept check: {c.question}</summary>
                <p className="mt-2 text-slate-400">{c.answer}</p>
              </details>
            ))}
          </GlassCard>
        ))}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-white mb-2">Validation Checklist</h2>
        <ul className="list-disc list-inside text-sm text-slate-400 space-y-1">
          {lab.validationChecklist.map((v) => <li key={v}>{v}</li>)}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-white mb-2">Cleanup</h2>
        <ul className="list-disc list-inside text-sm text-slate-400 space-y-1">
          {lab.cleanup.map((c) => <li key={c}>{c}</li>)}
        </ul>
      </section>

      {hasRelations && (
        <section>
          <h2 className="text-sm font-semibold text-white mb-3">How This Lab Connects</h2>
          <div className="space-y-2">
            {lab.relatedExams.map((r) => (
              <Link key={r.exam} to={`/skillup/${r.exam}`} className="block text-sm hover:opacity-80">
                <span className="text-violet-300">Exam Domain →</span>{' '}
                <span className="text-slate-300">{r.exam} (Domain {r.domain})</span>
                <span className="block text-xs text-slate-500">{r.why}</span>
              </Link>
            ))}
            {lab.relatedBlogPosts.map((r) => (
              <Link key={r.slug} to={`/blog/${r.slug}`} className="block text-sm hover:opacity-80">
                <span className="text-violet-300">Blog Post →</span>{' '}
                <span className="text-slate-300">{r.slug}</span>
                <span className="block text-xs text-slate-500">{r.why}</span>
              </Link>
            ))}
            {lab.relatedUseCases.map((r) => (
              <Link key={r.id} to={`/usecases/${r.id}`} className="block text-sm hover:opacity-80">
                <span className="text-violet-300">Use Case →</span>{' '}
                <span className="text-slate-300">{r.id}</span>
                <span className="block text-xs text-slate-500">{r.why}</span>
              </Link>
            ))}
            {lab.relatedLabs.map((r) => (
              <Link key={r.id} to={`/hol-labs/${r.id}`} className="block text-sm hover:opacity-80">
                <span className="text-violet-300">{RELATION_LABEL[r.relation]} →</span>{' '}
                <span className="text-slate-300">{r.id}</span>
                <span className="block text-xs text-slate-500">{r.why}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
