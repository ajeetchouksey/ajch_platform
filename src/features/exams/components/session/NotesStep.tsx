// ── One notes section inside a session, then its quick check ──────────────────
import { useEffect, useMemo, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { markLessonRead } from '@/lib/storage';
import { loadNoteForExam } from '@/lib/content-loader';
import { matchQuestionsToSections, noteSections } from '@/lib/section-match';
import { getResumeState, resumeLabel, setResumeState } from '@/lib/study-tracker';
import { plainText } from '@/lib/flashcards';
import type { Question } from '@/types/content';
import { SectionCheck } from '../SectionCheck';
import { LessonBody } from '../notes/LessonBody';

export function NotesStep({ examId, domain, heading, bank, onDone }: {
  examId: string; domain: number; heading?: string; bank: Question[]; onDone: () => void;
}) {
  const [md, setMd] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    loadNoteForExam(examId, domain).then((t) => { if (alive) setMd(t); }).catch(() => { if (alive) setMd(''); });
    return () => { alive = false; };
  }, [examId, domain]);

  // The section to read: the one asked for, else the one after where they left off, else the first.
  const [picked] = useState(() => ({ heading, resume: resumeLabel(getResumeState(examId)) }));
  const section = useMemo(() => {
    if (!md) return null;
    const secs = noteSections(md);
    if (!secs.length) return null;
    const norm = (s: string) => plainText(s).toLowerCase();
    if (picked.heading) {
      const hit = secs.find((s) => norm(s.heading) === norm(picked.heading!));
      if (hit) return { ...hit, index: secs.indexOf(hit), total: secs.length, next: secs[secs.indexOf(hit) + 1] };
    }
    const at = picked.resume ? secs.findIndex((s) => norm(s.heading) === norm(picked.resume!)) : -1;
    const idx = at >= 0 && at + 1 < secs.length ? at + 1 : 0;
    return { ...secs[idx], index: idx, total: secs.length, next: secs[idx + 1] };
  }, [md, picked]);
  const checks = useMemo(
    () => (md && section ? matchQuestionsToSections(md, bank.filter((q) => q.domain === domain)).get(section.heading) ?? [] : []),
    [md, section, bank, domain],
  );

  const finish = () => {
    if (section) markLessonRead(examId, domain, section.heading);
    if (section) setResumeState(examId, { domainId: domain, sectionTitle: plainText(section.next?.heading ?? section.heading), ts: Date.now() });
    onDone();
  };

  if (md === null) return <div className="glass-card rounded-2xl h-64 animate-pulse" aria-busy="true" />;
  if (!section) {
    return (
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <p className="text-sm text-slate-300">These notes couldn't be loaded right now.</p>
        <button type="button" onClick={onDone} className="min-h-11 px-4 rounded-xl bg-brand-indigo text-white text-sm font-semibold">Skip to the next step</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-400 flex items-center gap-1.5">
        <BookOpen size={13} aria-hidden="true" /> Domain {domain} · section {section.index + 1} of {section.total}
      </p>
      <LessonBody heading={section.heading} body={section.body} diagrams={false} />
      {checks.length > 0 && <SectionCheck examId={examId} domain={domain} heading={section.heading} candidates={checks} markdown={md} />}
      <div className="sticky bottom-3 z-10 sm:static flex gap-2 rounded-2xl sm:rounded-none bg-slate-950/95 sm:bg-transparent p-2 sm:p-0 shadow-lg sm:shadow-none">
        <button type="button" onClick={finish} className="flex-1 sm:flex-none min-h-12 px-6 rounded-xl bg-brand-indigo hover:bg-brand-indigo-deep text-white text-sm font-semibold">
          Done reading
        </button>
      </div>
    </div>
  );
}
