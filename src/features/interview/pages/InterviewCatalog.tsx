import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, MapPin, ArrowRight, Layers } from 'lucide-react';
import { loadInterviewIndex, type InterviewRoleSummary } from '@/lib/content-loader';
import { useMeta } from '@/lib/useMeta';
import { GlassCard, Badge, SectionHeader } from '@/components/ui';

export default function InterviewCatalog() {
  useMeta({
    title: 'Interview Prep · Aarya',
    description: 'Detailed, role-specific interview preparation packs built from real job descriptions — technical, behavioural, and system-design questions with worked examples.',
  });

  const [roles, setRoles] = useState<InterviewRoleSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInterviewIndex()
      .then((idx) => setRoles(idx.roles))
      .catch(() => setError('Could not load interview packs.'));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <SectionHeader
        icon={Briefcase}
        badge="Interview Prep"
        title="Get interview-ready, one JD at a time"
        subtitle="Each pack turns a real job description into detailed Q&A — technical, behavioural, and system-design — with real scenarios, worked examples, and use cases."
      />

      {error && (
        <p className="mt-8 text-sm text-rose-300">{error}</p>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {roles.map((role) => (
          <Link key={role.id} to={`/interview/${role.id}`} className="block group">
            <GlassCard
              accent={role.accentColor ?? 'violet'}
              className="p-6 h-full transition-transform duration-300 group-hover:-translate-y-1"
              border="border-slate-700/40"
            >
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg"
                  style={{ background: 'rgba(139,92,246,0.12)' }}
                >
                  <Briefcase size={17} className="text-violet-300" />
                </span>
                {role.available
                  ? <Badge label="Available" variant="green" size="xs" uppercase />
                  : <Badge label="Coming soon" variant="slate" size="xs" uppercase />}
              </div>

              <h3 className="text-lg font-semibold text-slate-100 leading-snug">
                {role.title}
              </h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed line-clamp-3">
                {role.description}
              </p>

              {role.industry && (
                <div className="mt-3">
                  <Badge label={role.industry.label} variant="violet" size="xs" />
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Layers size={12} /> {role.questionCount} questions
                </span>
                <span className="inline-flex items-center gap-1">
                  {role.seniority}
                </span>
                {role.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={12} /> {role.location}
                  </span>
                )}
              </div>

              <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-violet-300 group-hover:gap-2.5 transition-all">
                Open pack <ArrowRight size={14} />
              </div>
            </GlassCard>
          </Link>
        ))}

        {roles.length === 0 && !error && (
          <p className="text-sm text-slate-500">Loading interview packs…</p>
        )}
      </div>
    </div>
  );
}
