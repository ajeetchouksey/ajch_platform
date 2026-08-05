import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, ArrowRight } from 'lucide-react';
import { loadInterviewIndex, type InterviewRoleSummary } from '@/lib/content-loader';
import { useMeta } from '@/lib/useMeta';
import { GlassCard, Badge, SectionHeader } from '@/components/ui';

const SKILL_GROUPS = ['All', 'AI Core', 'Engineering', 'Governance', 'Domain', 'Leadership'] as const;
type SkillGroup = (typeof SKILL_GROUPS)[number];

export default function InterviewCatalog() {
  useMeta({
    title: 'Role Prep · Aarya',
    description: 'Skill-focused interview preparation packs built from real job descriptions — technical, behavioural, and system-design questions with worked examples.',
  });

  const [roles, setRoles] = useState<InterviewRoleSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<SkillGroup>('All');

  useEffect(() => {
    loadInterviewIndex()
      .then((idx) => setRoles(idx.roles))
      .catch(() => setError('Could not load role packs.'));
  }, []);

  const visible =
    activeGroup === 'All'
      ? roles
      : roles.filter(
          (r) =>
            r.skillGroup === activeGroup ||
            r.topSkills?.some((s) => s.group === activeGroup),
        );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <SectionHeader
        icon={Briefcase}
        badge="Role Prep"
        title="Prepare by skill, not by job title"
        subtitle="Each pack turns a real JD into deep Q&A — technical, behavioural, and system-design. Filter by the skill area you want to strengthen."
      />

      <div className="mt-8 flex flex-wrap gap-2">
        {SKILL_GROUPS.map((g) => (
          <button
            key={g}
            onClick={() => setActiveGroup(g)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeGroup === g
                ? 'bg-violet-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {error && <p className="mt-8 text-sm text-rose-300">{error}</p>}

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {visible.map((role) => (
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
                {role.available ? (
                  <Badge label="Available" variant="green" size="xs" uppercase />
                ) : (
                  <Badge label="Coming soon" variant="slate" size="xs" uppercase />
                )}
              </div>

              <h3 className="text-lg font-semibold text-slate-100 leading-snug">{role.title}</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed line-clamp-2">
                {role.description}
              </p>

              {role.topSkills && role.topSkills.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {role.topSkills.map((skill) => (
                    <span
                      key={skill.id}
                      className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-700/60 text-slate-300"
                    >
                      {skill.label}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-violet-300 group-hover:gap-2.5 transition-all">
                Open pack <ArrowRight size={14} />
              </div>
            </GlassCard>
          </Link>
        ))}

        {visible.length === 0 && !error && (
          <p className="col-span-2 text-sm text-slate-500">
            No packs match this skill area yet.
          </p>
        )}
      </div>
    </div>
  );
}
