// ── Flashcards: spaced review of cards built from the notes + missed questions ─
// A session is the cards due now, then up to NEW_PER_SESSION cards never seen.
// Scheduling lives in lib/flashcards.ts; this page only runs the session.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Brain, CheckCircle2, Layers, RotateCcw } from 'lucide-react';
import { loadExamRegistry, loadNoteForExam } from '@/lib/content-loader';
import { buildNoteCards, getCardStates, getQuestionCards, rate, type Flashcard, type Rating } from '@/lib/flashcards';
import { FlashCard } from '../components/FlashCard';

const KEY_RATING: Record<string, Rating> = { '1': 'again', '2': 'hard', '3': 'good' };
import { recordStudyDay } from '@/lib/study-tracker';
import type { ExamConfig } from '@/types/content';

const NEW_PER_SESSION = 10;

function buildDeck(examId: string, cards: Flashcard[], domain: number | null): string[] {
  const states = getCardStates(examId);
  const now = Date.now();
  const pool = cards.filter((c) => domain === null || c.domain === domain);
  const due = pool.filter((c) => states[c.id] && states[c.id].due <= now).sort((a, b) => states[a.id].due - states[b.id].due);
  const fresh = pool.filter((c) => !states[c.id]).slice(0, NEW_PER_SESSION);
  return [...due, ...fresh].map((c) => c.id);
}

export default function Flashcards() {
  const { examId = '' } = useParams<{ examId: string }>();
  const [exam, setExam] = useState<ExamConfig | null>(null);
  const [cards, setCards] = useState<Flashcard[] | null>(null);
  const [domain, setDomain] = useState<number | null>(null);
  const [deck, setDeck] = useState<string[]>([]);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [ratings, setRatings] = useState<Record<string, Rating>>({});

  useEffect(() => {
    let alive = true;
    loadExamRegistry().then(async (r) => {
      const ex = r.exams.find((e) => e.id === examId) ?? null;
      if (!alive) return;
      setExam(ex);
      if (!ex) { setCards([]); return; }
      const notes = await Promise.all(ex.domains.map((d) =>
        loadNoteForExam(examId, d.id).then((md) => buildNoteCards(examId, d.id, md)).catch(() => [] as Flashcard[])));
      if (!alive) return;
      const all = [...getQuestionCards(examId), ...notes.flat()];
      setCards(all);
      setDeck(buildDeck(examId, all, null));
    }).catch(() => { if (alive) setCards([]); });
    return () => { alive = false; };
  }, [examId]);

  const byId = useMemo(() => new Map((cards ?? []).map((c) => [c.id, c])), [cards]);
  const card = i < deck.length ? byId.get(deck[i]) ?? null : null;
  const finished = cards !== null && deck.length > 0 && i >= deck.length;

  const restart = useCallback((d: number | null) => {
    if (!cards) return;
    setDomain(d);
    setDeck(buildDeck(examId, cards, d));
    setI(0); setFlipped(false); setRatings({});
  }, [cards, examId]);

  const onRate = useCallback((r: Rating) => {
    if (!card) return;
    rate(examId, card.id, r);
    if (i === 0) recordStudyDay(examId);
    setRatings((m) => ({ ...m, [card.id]: r }));
    setI((n) => n + 1);
    setFlipped(false);
  }, [card, examId, i]);

  const repeatMissed = () => {
    const missed = deck.filter((id) => ratings[id] === 'again');
    setDeck(missed); setI(0); setFlipped(false);
    setRatings((m) => Object.fromEntries(Object.entries(m).filter(([id]) => !missed.includes(id))));
  };

  // Keyboard: space/enter flips, 1–3 rate once the answer is showing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!card || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === ' ' && !(e.target instanceof HTMLButtonElement)) { e.preventDefault(); setFlipped((f) => !f); }
      const hit = KEY_RATING[e.key];
      if (hit && flipped) onRate(hit);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [card, flipped, onRate]);

  const counts = { again: 0, hard: 0, good: 0 } as Record<Rating, number>;
  for (const r of Object.values(ratings)) counts[r] += 1;
  const base = `/skillup/${examId}`;

  if (cards === null) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-pulse" aria-busy="true">
        <div className="h-5 w-48 bg-slate-800 rounded" />
        <div className="h-2 bg-slate-800 rounded-full" />
        <div className="glass-card rounded-2xl h-72" />
      </div>
    );
  }

  const inReview = Object.keys(getCardStates(examId)).length;
  // Only read when the deck is empty, i.e. nothing is due — so the earliest due is in the future.
  const nextDue = Object.values(getCardStates(examId)).map((s) => s.due).sort((a, b) => a - b)[0];

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link to={base} className="inline-flex items-center gap-1.5 min-h-10 text-sm text-slate-300 hover:text-white">
          <ArrowLeft size={15} aria-hidden="true" /> {exam?.shortTitle ?? 'Exam'} overview
        </Link>
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-lilac">
          Flashcards · {cards.length} cards · {inReview} in review
        </span>
      </div>

      {exam && exam.domains.length > 1 && (
        <div role="group" aria-label="Choose a domain" className="flex flex-wrap gap-2">
          {[null, ...exam.domains.map((d) => d.id)].map((d) => (
            <button
              key={d ?? 'all'}
              type="button"
              aria-pressed={domain === d}
              onClick={() => restart(d)}
              className={`min-h-9 px-3 rounded-full text-sm font-semibold border transition-colors ${
                domain === d ? 'bg-brand-indigo border-brand-indigo text-white' : 'border-slate-600/50 text-slate-300 hover:text-white hover:border-brand-lilac/50'
              }`}
            >
              {d === null ? 'All domains' : `D${d}`}
            </button>
          ))}
        </div>
      )}

      {/* ── Empty: nothing due and nothing new ──────────────────────────────── */}
      {deck.length === 0 && (
        <section className="glass-card rounded-2xl p-6 text-center space-y-3">
          <CheckCircle2 size={28} className="mx-auto text-emerald-400" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-white">{cards.length ? 'All caught up' : 'No cards yet'}</h1>
          <p className="text-sm text-slate-300">
            {cards.length
              ? nextDue ? `Your next card is due ${new Date(nextDue).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}.` : 'Nothing is due right now.'
              : 'Cards are made from the key concepts and exam traps in the notes, and from questions you get wrong.'}
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            <Link to={`${base}/quiz`} className="inline-flex items-center gap-2 min-h-11 px-4 rounded-xl bg-brand-indigo hover:bg-brand-indigo-deep text-white text-sm font-semibold">
              <Brain size={15} aria-hidden="true" /> Practise questions
            </Link>
            <Link to={`${base}/notes`} className="inline-flex items-center gap-2 min-h-11 px-4 rounded-xl border border-slate-600/50 text-slate-200 hover:text-white text-sm font-semibold">
              <BookOpen size={15} aria-hidden="true" /> Study notes
            </Link>
          </div>
        </section>
      )}

      {/* ── Review ─────────────────────────────────────────────────────────── */}
      {card && (
        <>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Card {i + 1} of {deck.length}</span>
              <span>{counts.good + counts.hard} known · {counts.again} to repeat</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-700/60 overflow-hidden" aria-hidden="true">
              <div className="h-full rounded-full bg-brand-lilac transition-all" style={{ width: `${(i / deck.length) * 100}%` }} />
            </div>
          </div>

          <FlashCard examId={examId} card={card} flipped={flipped} onFlip={() => setFlipped((f) => !f)} onRate={onRate} />
        </>
      )}

      {/* ── Summary ────────────────────────────────────────────────────────── */}
      {finished && (
        <section className="glass-card rounded-2xl p-6 space-y-5" aria-labelledby="done-h">
          <h1 id="done-h" className="text-2xl font-bold text-white">Review done</h1>
          <div className="grid grid-cols-3 gap-3">
            {([
              ['good', 'knew it', 'text-emerald-300'],
              ['hard', 'hard · back soon', 'text-amber-300'],
              ['again', 'to repeat today', 'text-rose-300'],
            ] as const).map(([r, label, cls]) => (
              <div key={r} className="rounded-xl bg-slate-800/60 border border-slate-600/25 p-3 flex flex-col gap-0.5">
                <span className={`text-2xl font-bold ${cls}`}>{counts[r]}</span>
                <span className="text-xs text-slate-400">{label}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {counts.again > 0 && (
              <button type="button" onClick={repeatMissed} className="inline-flex items-center gap-2 min-h-11 px-4 rounded-xl bg-brand-indigo hover:bg-brand-indigo-deep text-white text-sm font-semibold">
                <RotateCcw size={15} aria-hidden="true" /> Repeat the {counts.again} I missed
              </button>
            )}
            <button type="button" onClick={() => restart(domain)} className="inline-flex items-center gap-2 min-h-11 px-4 rounded-xl border border-slate-600/50 text-slate-200 hover:text-white text-sm font-semibold">
              <Layers size={15} aria-hidden="true" /> Next batch
            </button>
            <Link to={`${base}/quiz`} className="inline-flex items-center gap-2 min-h-11 px-4 rounded-xl border border-slate-600/50 text-slate-200 hover:text-white text-sm font-semibold">
              <Brain size={15} aria-hidden="true" /> Practise questions
            </Link>
            <Link to="/skillup/my-learning" className="inline-flex items-center min-h-11 px-2 text-sm text-slate-300 hover:text-white">
              Back to My learning
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
