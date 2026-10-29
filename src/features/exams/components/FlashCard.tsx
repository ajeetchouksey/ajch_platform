// ── One flashcard: tap to flip, then rate by button or swipe ──────────────────
// Swipe left = didn't know, up = hard, right = knew it (only once flipped).
// On phones the rating buttons sit in a bar at the bottom, within thumb reach.
import { useRef, useState } from 'react';
import { previewInterval, type Flashcard, type Rating } from '@/lib/flashcards';
import { domainColor, tint } from '@/lib/skillup-colors';

const KIND_TAG: Record<Flashcard['kind'], string> = { concept: 'Key concept', trap: 'Exam trap', question: 'Missed question' };
// Same hues as the note blocks they come from (key concept lilac, exam trap rose); misses are review amber.
const KIND_COLOR: Record<Flashcard['kind'], string> = { concept: '#A99BFF', trap: '#fb7185', question: '#fbbf24' };

const RATINGS: { r: Rating; label: string; key: string; cls: string }[] = [
  { r: 'again', label: "Didn't know", key: '1', cls: 'border-rose-400/40 text-rose-200 hover:bg-rose-500/15' },
  { r: 'hard', label: 'Hard', key: '2', cls: 'border-amber-400/40 text-amber-200 hover:bg-amber-500/15' },
  { r: 'good', label: 'Knew it', key: '3', cls: 'border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/15' },
];

const SWIPE = 70; // px before a drag counts as a rating

export function FlashCard({ examId, card, flipped, onFlip, onRate }: {
  examId: string; card: Flashcard; flipped: boolean; onFlip: () => void; onRate: (r: Rating) => void;
}) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(false);
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const hint: Rating | null = !flipped ? null
    : drag.x > SWIPE ? 'good' : drag.x < -SWIPE ? 'again' : drag.y < -SWIPE ? 'hard' : null;
  const hintLabel = hint && RATINGS.find((x) => x.r === hint)!.label;

  const onDown = (e: React.PointerEvent) => { start.current = { x: e.clientX, y: e.clientY }; moved.current = false; setDragging(true); };
  const onMove = (e: React.PointerEvent) => {
    if (!start.current || !flipped) return;
    const dx = e.clientX - start.current.x; const dy = e.clientY - start.current.y;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) moved.current = true;
    setDrag({ x: dx, y: Math.min(0, dy) });
  };
  const onUp = () => {
    start.current = null;
    setDragging(false);
    if (hint) onRate(hint);
    setDrag({ x: 0, y: 0 });
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => { if (!moved.current) onFlip(); moved.current = false; }}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
        aria-label={flipped ? 'Show the question again' : 'Reveal the answer'}
        style={{ transform: `translate(${drag.x}px, ${drag.y}px) rotate(${drag.x / 25}deg)`, transition: dragging ? 'none' : 'transform .25s', touchAction: flipped ? 'none' : 'auto' }}
        className={`relative w-full min-h-72 rounded-2xl p-6 sm:p-8 flex flex-col gap-4 text-left border select-none transition-colors ${
          flipped
            ? 'bg-gradient-to-br from-brand-indigo/30 to-slate-800/90 border-brand-lilac/50'
            : 'bg-gradient-to-br from-slate-700/60 to-slate-800/90 border-slate-500/25 hover:border-brand-lilac/60'
        }`}
      >
        <span className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em]">
          <span style={{ color: KIND_COLOR[card.kind] }}>{KIND_TAG[card.kind]}</span>
          <span className="px-1.5 py-0.5 rounded-md normal-case tracking-normal font-bold" style={{ color: domainColor(card.domain), background: tint(domainColor(card.domain), 0.15) }}>D{card.domain}</span>
          <span className="text-slate-400">{flipped ? 'Answer' : 'Question'}</span>
        </span>
        <span aria-live="polite" className={`flex-1 text-white leading-snug ${flipped ? 'text-lg font-medium' : 'text-xl sm:text-2xl font-semibold'}`}>
          {flipped ? card.back : card.front}
        </span>
        {card.kind !== 'question' && <span className="text-xs text-slate-400">From the notes: {card.source}</span>}
        <span className="text-xs text-slate-400">
          {flipped ? 'Swipe right if you knew it, left if not, up if it was hard' : 'Tap or press Space to reveal'}
        </span>
        {hintLabel && (
          <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-bold border bg-slate-900/80 ${RATINGS.find((x) => x.r === hint)!.cls}`}>
            {hintLabel}
          </span>
        )}
      </button>

      {flipped ? (
        <div role="group" aria-label="How well did you know it?"
          className="grid grid-cols-3 gap-2 sticky bottom-3 z-10 sm:static rounded-2xl sm:rounded-none bg-[#0e1a2d]/95 sm:bg-transparent p-2 sm:p-0 shadow-lg sm:shadow-none">
          {RATINGS.map(({ r, label, key, cls }) => (
            <button
              key={r}
              type="button"
              onClick={() => onRate(r)}
              className={`min-h-14 rounded-xl border bg-slate-800/60 px-2 py-2 flex flex-col items-center justify-center gap-0.5 font-semibold text-sm transition-colors ${cls}`}
            >
              {label}
              <span className="text-[11px] font-normal text-slate-400">{previewInterval(examId, card.id, r)}<span className="hidden sm:inline"> · key {key}</span></span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-slate-400">Think of your answer, then tap the card to check it.</p>
      )}
    </div>
  );
}
