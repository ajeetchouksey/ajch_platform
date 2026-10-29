// ── Due flashcards inside a session ───────────────────────────────────────────
import { useEffect, useState } from 'react';
import { loadNoteForExam } from '@/lib/content-loader';
import { buildNoteCards, dueIds, getQuestionCards, rate, type Flashcard, type Rating } from '@/lib/flashcards';
import type { ExamConfig } from '@/types/content';
import { FlashCard } from '../FlashCard';

export function CardsStep({ exam, count, onDone }: { exam: ExamConfig; count: number; onDone: (knew: number, total: number) => void }) {
  const [deck, setDeck] = useState<Flashcard[] | null>(null);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [knew, setKnew] = useState(0);

  useEffect(() => {
    let alive = true;
    Promise.all(exam.domains.map((d) => loadNoteForExam(exam.id, d.id).then((md) => buildNoteCards(exam.id, d.id, md)).catch(() => [] as Flashcard[])))
      .then((notes) => {
        if (!alive) return;
        const byId = new Map([...getQuestionCards(exam.id), ...notes.flat()].map((c) => [c.id, c]));
        setDeck(dueIds(exam.id).map((id) => byId.get(id)).filter((c): c is Flashcard => !!c).slice(0, count));
      });
    return () => { alive = false; };
  }, [exam, count]);

  if (deck === null) return <div className="glass-card rounded-2xl h-72 animate-pulse" aria-busy="true" />;
  if (!deck.length) {
    return (
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <p className="text-sm text-slate-300">No cards are due any more. Nice.</p>
        <button type="button" onClick={() => onDone(0, 0)} className="min-h-11 px-4 rounded-xl bg-brand-indigo text-white text-sm font-semibold">Next step</button>
      </div>
    );
  }

  const card = deck[i];
  const onRate = (r: Rating) => {
    rate(exam.id, card.id, r);
    const k = knew + (r === 'again' ? 0 : 1);
    setKnew(k);
    if (i + 1 >= deck.length) { onDone(k, deck.length); return; }
    setI(i + 1); setFlipped(false);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400">Card {i + 1} of {deck.length} · {knew} known so far</p>
      <FlashCard examId={exam.id} card={card} flipped={flipped} onFlip={() => setFlipped((f) => !f)} onRate={onRate} />
    </div>
  );
}
