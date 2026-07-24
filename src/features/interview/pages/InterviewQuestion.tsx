import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, AlertTriangle, CheckCircle2, Lightbulb, Target, MessageCircleQuestion, Sparkles, GitGraph, Building2,
} from 'lucide-react';
import MermaidDiagram from '@/components/MermaidDiagram';
import {
  loadInterviewBank, loadInterviewCompetencies, loadResolvedPackItems,
  type InterviewBankItem, type InterviewCompetency, type InterviewAddendum,
} from '@/lib/content-loader';
import { useMeta } from '@/lib/useMeta';
import { GlassCard, Badge, type BadgeVariant } from '@/components/ui';

const TYPE_VARIANT: Record<string, BadgeVariant> = {
  technical: 'blue', behavioral: 'emerald', 'system-design': 'amber',
};
const DIFF_VARIANT: Record<string, BadgeVariant> = {
  mid: 'slate', senior: 'violet', principal: 'purple',
};

/** Strip ```lang fenced markers so the worked example renders cleanly in a <pre>. */
function stripFences(text: string): string {
  return text.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trimEnd();
}

function Section({ icon: Icon, title, children, accent }: {
  icon: React.ElementType; title: string; children: React.ReactNode; accent?: string;
}) {
  return (
    <section className="mt-6">
      <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: accent ?? '#a78bfa' }}>
        <Icon size={13} /> {title}
      </h2>
      {children}
    </section>
  );
}

export default function InterviewQuestion() {
  const { id = '' } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const roleId = params.get('role');

  const [item, setItem] = useState<InterviewBankItem | null>(null);
  const [competencies, setCompetencies] = useState<InterviewCompetency[]>([]);
  const [addendum, setAddendum] = useState<InterviewAddendum | null>(null);
  const [error, setError] = useState<string | null>(null);

  useMeta({
    title: item ? `${item.question.slice(0, 60)}… · Interview Prep` : 'Interview Prep',
    description: item?.detailedAnswer?.summary,
  });

  useEffect(() => {
    Promise.all([loadInterviewBank(), loadInterviewCompetencies()])
      .then(([bank, comps]) => {
        const found = bank.find((q) => q.id === id) ?? null;
        setItem(found);
        setCompetencies(comps);
        if (!found) setError('Question not found.');
      })
      .catch(() => setError('Could not load this question.'));
  }, [id]);

  useEffect(() => {
    if (!roleId) return;
    loadResolvedPackItems(roleId)
      .then((its) => {
        const match = its.find((q) => q.id === id);
        if (match?.addendum) setAddendum(match.addendum);
      })
      .catch(() => {});
  }, [roleId, id]);

  const compTitle = useMemo(() => {
    const m = new Map(competencies.map((c) => [c.id, c.title]));
    return (cid: string) => m.get(cid) ?? cid;
  }, [competencies]);

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-sm text-rose-300">{error}</p>
        <Link to="/interview" className="mt-4 inline-flex items-center gap-1 text-sm text-violet-300">
          <ArrowLeft size={14} /> Back to Interview Prep
        </Link>
      </div>
    );
  }

  if (!item) {
    return <div className="max-w-3xl mx-auto px-4 py-16 text-sm text-slate-500">Loading…</div>;
  }

  const da = item.detailedAnswer;
  const backHref = roleId ? `/interview/${roleId}` : '/interview';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link to={backHref} className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 mb-6">
        <ArrowLeft size={13} /> Back to pack
      </Link>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Badge label={item.type} variant={TYPE_VARIANT[item.type] ?? 'slate'} size="xs" uppercase />
        <Badge label={item.difficulty} variant={DIFF_VARIANT[item.difficulty] ?? 'slate'} size="xs" />
        <span className="text-[11px] text-slate-500">{compTitle(item.competency)}</span>
      </div>

      <h1 className="text-xl font-bold text-slate-100 leading-snug">{item.question}</h1>

      {/* Summary callout */}
      <GlassCard accent="violet" className="p-4 mt-5" border="border-violet-500/30">
        <div className="flex items-start gap-2">
          <Sparkles size={15} className="text-violet-300 mt-0.5 shrink-0" />
          <p className="text-sm text-slate-200 leading-relaxed">{da.summary}</p>
        </div>
      </GlassCard>

      {/* Diagram */}
      {da && item.diagram && (
        <Section icon={GitGraph} title={item.diagram.caption} accent="#38bdf8">
          <div className="mt-1 rounded-xl overflow-hidden" style={{ background: 'rgba(10,15,25,0.7)', border: '1px solid rgba(255,255,255,0.07)', padding: '1rem' }}>
            <MermaidDiagram chart={item.diagram.chart} />
          </div>
        </Section>
      )}

      {/* Role delta */}
      {addendum && (
        <GlassCard accent="amber" className="p-4 mt-4" border="border-amber-500/30">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-300 mb-1">
            Additional for this role
          </h2>
          {addendum.whyForThisRole && <p className="text-sm text-slate-200 leading-relaxed">{addendum.whyForThisRole}</p>}
          {addendum.additionalContext && <p className="mt-2 text-sm text-slate-300 leading-relaxed">{addendum.additionalContext}</p>}
          {addendum.industryAngle && (
            <div className="mt-3 pt-3 border-t border-amber-500/20">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-300/80">Industry angle</span>
              <p className="mt-1 text-sm text-slate-300 leading-relaxed">{addendum.industryAngle}</p>
            </div>
          )}
        </GlassCard>
      )}

      {/* Deep dive */}
      <Section icon={Lightbulb} title="Deep dive">
        <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
          {da.deepDive.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </Section>

      {/* Real scenario */}
      <Section icon={Target} title="Real scenario" accent="#34d399">
        <p className="text-sm text-slate-300 leading-relaxed">{da.realScenario}</p>
      </Section>

      {/* Worked example */}
      <Section icon={CheckCircle2} title="Worked example" accent="#60a5fa">
        <pre
          className="text-xs text-slate-200 leading-relaxed overflow-x-auto p-4 rounded-xl whitespace-pre-wrap"
          style={{ background: 'rgba(15,17,23,0.95)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {stripFences(da.workedExample)}
        </pre>
      </Section>

      {/* Use cases */}
      <Section icon={Sparkles} title="Use cases">
        <ul className="space-y-1.5">
          {da.useCases.map((u, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
              <span className="text-violet-400 mt-1">•</span> {u}
            </li>
          ))}
        </ul>
      </Section>

      {/* Tradeoffs */}
      <Section icon={Target} title="Tradeoffs" accent="#fbbf24">
        <ul className="space-y-1.5">
          {da.tradeoffs.map((t, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
              <span className="text-amber-400 mt-1">•</span> {t}
            </li>
          ))}
        </ul>
      </Section>

      {/* Anti-patterns */}
      <Section icon={AlertTriangle} title="Anti-patterns" accent="#fb7185">
        <ul className="space-y-1.5">
          {da.antiPatterns.map((a, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
              <span className="text-rose-400 mt-1">✗</span> {a}
            </li>
          ))}
        </ul>
      </Section>

      {/* What the interviewer scores */}
      <Section icon={Target} title="What the interviewer is scoring">
        <p className="text-sm text-slate-300 leading-relaxed">{item.explanation}</p>
      </Section>

      {/* Follow-ups */}
      {(item.followUps.length > 0 || addendum?.extraFollowUps?.length) && (
        <Section icon={MessageCircleQuestion} title="Likely follow-ups" accent="#60a5fa">
          <div className="space-y-3">
            {[...item.followUps, ...(addendum?.extraFollowUps ?? [])].map((f, i) => (
              <div key={i}>
                <p className="text-sm font-medium text-slate-200">{f.q}</p>
                <p className="text-sm text-slate-400 mt-0.5">{f.a}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Red flags */}
      <Section icon={AlertTriangle} title="Red flags" accent="#fb7185">
        <ul className="space-y-1.5">
          {item.redFlags.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
              <AlertTriangle size={13} className="text-rose-400 mt-0.5 shrink-0" /> {r}
            </li>
          ))}
        </ul>
      </Section>

      {/* Real-world use cases */}
      {item.relatedUseCases && item.relatedUseCases.length > 0 && (
        <Section icon={Building2} title="Real-World Examples" accent="#34d399">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {item.relatedUseCases.map((uc) => (
              <Link
                key={uc.id}
                to={`/usecases/${uc.id}`}
                className="flex items-start gap-2 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-emerald-500/40 hover:bg-slate-800/80 transition-all group"
              >
                <Building2 size={13} className="text-emerald-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-200 leading-snug">{uc.label}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{uc.vertical}</p>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* Tags */}
      <div className="mt-8 flex flex-wrap gap-1.5">
        {item.tags.map((t) => <Badge key={t} label={`#${t}`} variant="slate" size="xs" />)}
      </div>
    </div>
  );
}
