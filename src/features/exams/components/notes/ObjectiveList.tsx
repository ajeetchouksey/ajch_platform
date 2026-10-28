// ── A domain's notes as objectives, each a short run of lessons ───────────────
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Check, Target } from 'lucide-react';
import { getLessonsRead, lessonKey } from '@/lib/storage';
import { plainText } from '@/lib/flashcards';
import type { DomainLessons, Lesson } from '@/lib/objective-sections';
import type { ObjectiveMastery } from '@/lib/objective-mastery';

const STATUS: Record<ObjectiveMastery['status'], { label: string; cls: string }> = {
  new: { label: 'Not practised', cls: 'bg-slate-500/15 text-slate-300' },
  weak: { label: 'Weak', cls: 'bg-rose-400/15 text-rose-200' },
  building: { label: 'Building', cls: 'bg-amber-400/15 text-amber-200' },
  strong: { label: 'Strong', cls: 'bg-emerald-400/15 text-emerald-200' },
};

interface Row { id: string; title: string; lessons: Lesson[]; read: boolean[]; status?: ObjectiveMastery['status'] }

export function ObjectiveList({ examId, domain, lessons, mastery, onOpen, onReadAll }: {
  examId: string;
  domain: number;
  lessons: DomainLessons;
  mastery: ObjectiveMastery[];
  onOpen: (objectiveId: string, lessonNo: number) => void;
  onReadAll: () => void;
}) {
  const rows = useMemo<Row[]>(() => {
    const seen = getLessonsRead();
    const isRead = (l: Lesson) => Boolean(seen[lessonKey(examId, domain, l.heading)]);
    const list: Row[] = lessons.objectives.map((o) => ({
      id: o.task.id,
      title: o.task.title,
      lessons: o.lessons,
      read: o.lessons.map(isRead),
      status: mastery.find((m) => m.task.id === o.task.id)?.status,
    }));
    if (lessons.other.length) list.push({ id: 'other', title: 'More topics in this domain', lessons: lessons.other, read: lessons.other.map(isRead) });
    return list;
  }, [examId, domain, lessons, mastery]);

  const all = rows.flatMap((r) => r.lessons);
  const readCount = rows.reduce((n, r) => n + r.read.filter(Boolean).length, 0);
  const totalMin = all.reduce((n, l) => n + l.minutes, 0);
  // The one "carry on" target: the first unread lesson, in objective order.
  const nextRow = rows.find((r) => r.read.some((x) => !x));

  return (
    <section aria-labelledby="objectives-h" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 id="objectives-h" className="text-xl font-semibold text-white">Learn D{domain} by objective</h2>
          <p className="text-sm text-slate-400">
            {all.length} short lessons · about {totalMin} min · {readCount} of {all.length} read
          </p>
        </div>
        {nextRow && (
          <button
            type="button"
            onClick={() => onOpen(nextRow.id, nextRow.read.findIndex((x) => !x) + 1)}
            className="inline-flex items-center gap-2 min-h-11 px-4 rounded-xl bg-brand-indigo hover:bg-brand-indigo-deep text-white text-sm font-semibold transition-colors"
          >
            {readCount ? 'Continue' : 'Start'}: {plainText(nextRow.lessons[nextRow.read.findIndex((x) => !x)].heading)}
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        )}
      </div>

      <ul className="space-y-3">
        {rows.map((r) => {
          const done = r.read.filter(Boolean).length;
          const mins = r.lessons.reduce((n, l) => n + l.minutes, 0);
          const firstUnread = r.read.findIndex((x) => !x);
          const finished = r.lessons.length > 0 && firstUnread === -1;
          const st = r.status ? STATUS[r.status] : null;
          return (
            <li key={r.id} className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-600/20 space-y-3">
              <div className="flex flex-wrap items-start gap-x-3 gap-y-1.5">
                {r.id !== 'other' && <span className="font-mono text-xs font-bold text-brand-lilac pt-1">{r.id}</span>}
                <h3 className="flex-[1_1_240px] min-w-0 text-base font-semibold text-white leading-snug">{r.title}</h3>
                {st && <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>}
              </div>

              {r.lessons.length > 0 ? (
                <>
                  <p className="text-xs text-slate-400">
                    {r.lessons.length} lesson{r.lessons.length === 1 ? '' : 's'} · ~{mins} min · {done}/{r.lessons.length} read
                  </p>
                  <ol className="flex gap-1" aria-label={`${done} of ${r.lessons.length} lessons read`}>
                    {r.lessons.map((l, i) => (
                      <li key={l.heading} className="flex-1">
                        <button
                          type="button"
                          onClick={() => onOpen(r.id, i + 1)}
                          title={plainText(l.heading)}
                          aria-label={`Lesson ${i + 1}: ${plainText(l.heading)}${r.read[i] ? ' (read)' : ''}`}
                          className={`block w-full h-2 rounded-full transition-colors ${r.read[i] ? 'bg-brand-lilac' : 'bg-slate-700/70 hover:bg-slate-500'}`}
                        />
                      </li>
                    ))}
                  </ol>
                </>
              ) : (
                <p className="text-xs text-slate-400">No notes cover this objective yet. Practise it directly.</p>
              )}

              <div className="flex flex-wrap gap-2">
                {r.lessons.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onOpen(r.id, finished ? 1 : firstUnread + 1)}
                    className={`inline-flex items-center gap-1.5 min-h-10 px-3.5 rounded-lg text-sm font-semibold transition-colors ${
                      finished ? 'border border-slate-600/50 text-slate-200 hover:border-brand-lilac/55' : 'bg-brand-indigo/90 hover:bg-brand-indigo text-white'
                    }`}
                  >
                    {finished ? <Check size={14} aria-hidden="true" /> : <BookOpen size={14} aria-hidden="true" />}
                    {finished ? 'Review' : done ? 'Continue' : 'Start'}
                  </button>
                )}
                {r.id !== 'other' && (
                  <Link
                    to={`/skillup/${examId}/quiz?task=${encodeURIComponent(r.id)}`}
                    className="inline-flex items-center gap-1.5 min-h-10 px-3.5 rounded-lg border border-slate-600/50 text-sm font-semibold text-slate-200 hover:border-brand-lilac/55 hover:text-white transition-colors"
                  >
                    <Target size={14} aria-hidden="true" /> Drill {r.id}
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <button type="button" onClick={onReadAll} className="min-h-10 text-sm text-slate-400 hover:text-white underline underline-offset-4 transition-colors">
        Prefer one page? Read all of D{domain} at once
      </button>
    </section>
  );
}
