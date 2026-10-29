// ── Match bank questions to notes sections ────────────────────────────────────
// Note section numbers don't follow the official objective ids, so questions
// are matched by keyword overlap (IDF-weighted, heading words count triple).
import { plainText } from '@/lib/flashcards';
import type { Question } from '@/types/content';

/** How many questions a section's inline check asks. */
export const CHECKS_PER_SECTION = 2;

const SKIP = /overview|golden rule|cheat ?sheet|exam traps?$|question patterns|deep dive|summary|takeaways|quick reference|glossary/i;
const STOP = new Set('about above after again against also among because been before being below between both cannot could does doing down during each from further have having here into itself just more most must need only other over same should some such than that their them then there these they this those through under until very want what when where which while will with within would your yours using used uses user users company organisation organization team best following least option options choose scenario'.split(' '));

function tokens(text: string): string[] {
  return plainText(text).toLowerCase().match(/[a-z][a-z0-9-]{3,}/g)?.filter((w) => !STOP.has(w)) ?? [];
}

/** A note's study sections (`## ` blocks), minus overview/cheat-sheet style ones. */
export function noteSections(markdown: string): { heading: string; body: string }[] {
  return markdown.split(/^## +/m).slice(1).map((sec) => {
    const nl = sec.indexOf('\n');
    return { heading: (nl === -1 ? sec : sec.slice(0, nl)).replace(/`[^`]*`/g, '').trim(), body: nl === -1 ? '' : sec.slice(nl + 1) };
  }).filter((s) => s.heading && !SKIP.test(plainText(s.heading)));
}

/** `## ` heading text (as the notes TOC shows it) → candidate questions, best match first. */
export function matchQuestionsToSections(markdown: string, questions: Question[], limit = 6): Map<string, Question[]> {
  const out = new Map<string, Question[]>();
  if (!questions.length) return out;
  const text = markdown.replace(/```[\s\S]*?```/g, '');
  const sections = text.split(/^## +/m).slice(1).map((sec) => {
    const nl = sec.indexOf('\n');
    const heading = (nl === -1 ? sec : sec.slice(0, nl)).replace(/`[^`]*`/g, '').trim();
    return { heading, head: new Set(tokens(heading)), body: new Set(tokens(nl === -1 ? '' : sec.slice(nl + 1))) };
  }).filter((s) => s.heading && !SKIP.test(plainText(s.heading)));
  if (!sections.length) return out;

  // Inverse document frequency over sections, so words every section uses don't decide the match.
  const df = new Map<string, number>();
  for (const s of sections) for (const w of new Set([...s.head, ...s.body])) df.set(w, (df.get(w) ?? 0) + 1);
  const idf = (w: string) => Math.log((sections.length + 1) / ((df.get(w) ?? 0) + 0.5));

  // Each question goes to its single best section; each section keeps its top scorers.
  const scored = new Map<number, { q: Question; score: number }[]>();
  for (const q of questions) {
    const qt = new Set(tokens(`${q.question} ${q.options.join(' ')} ${q.tags.join(' ')}`));
    let best = -1; let bestScore = 0;
    sections.forEach((s, i) => {
      let score = 0;
      for (const w of qt) score += ((s.head.has(w) ? 3 : 0) + (s.body.has(w) ? 1 : 0)) * idf(w);
      if (score > bestScore) { bestScore = score; best = i; }
    });
    if (best >= 0 && bestScore >= 4) scored.set(best, [...(scored.get(best) ?? []), { q, score: bestScore }]);
  }
  for (const [i, list] of scored) {
    out.set(sections[i].heading, list.sort((a, b) => b.score - a.score).slice(0, limit).map((x) => x.q));
  }
  return out;
}
