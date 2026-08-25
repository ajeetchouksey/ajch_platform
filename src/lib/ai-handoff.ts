// ── AI Handoff ─────────────────────────────────────────────────────────────────
// Composes a study-help prompt from in-app context and hands it off to an
// external AI chat tool (ChatGPT, Claude, Gemini) via a copy/open flow.
//
// SECURITY: composeHandoffPrompt() must never include the authenticated user's
// email, GitHub username, or any other PII. It only reads from HandoffContext —
// never import src/lib/auth.tsx into this file.

export type AiToolId = 'chatgpt' | 'claude' | 'gemini';
export interface AiTool { id: AiToolId; label: string; url: string; }
export const AI_TOOLS: AiTool[] = [
  { id: 'chatgpt', label: 'ChatGPT', url: 'https://chat.openai.com/' },
  { id: 'claude', label: 'Claude', url: 'https://claude.ai/new' },
  { id: 'gemini', label: 'Gemini', url: 'https://gemini.google.com/app' },
];

export interface HandoffContext {
  source: 'notes' | 'study-plan' | 'quiz-review';
  examTitle: string;
  domainTitle?: string;
  weakDomains?: { title: string; pct: number }[];
  noteExcerpt?: string;
}

const NOTE_EXCERPT_MAX_CHARS = 400;

export function composeHandoffPrompt(ctx: HandoffContext): string {
  const paragraphs: string[] = [];

  const opening = ctx.domainTitle
    ? `I'm studying for the ${ctx.examTitle} exam, specifically the "${ctx.domainTitle}" domain.`
    : `I'm studying for the ${ctx.examTitle} exam.`;
  paragraphs.push(opening);

  if (ctx.source === 'notes') {
    if (ctx.noteExcerpt) {
      const excerpt = ctx.noteExcerpt.length > NOTE_EXCERPT_MAX_CHARS
        ? `${ctx.noteExcerpt.slice(0, NOTE_EXCERPT_MAX_CHARS)}...`
        : ctx.noteExcerpt;
      paragraphs.push(`Here are my study notes:\n"${excerpt}"`);
      paragraphs.push('Can you explain this in simpler terms and then quiz me on it with a few follow-up questions to check my understanding?');
    }
  } else if (ctx.source === 'study-plan') {
    if (ctx.weakDomains && ctx.weakDomains.length > 0) {
      const list = ctx.weakDomains.map((d) => `- ${d.title}: ${d.pct}%`).join('\n');
      paragraphs.push(`Based on my quiz history, these are my weakest areas:\n${list}`);
      paragraphs.push('Can you put together a focused study plan with clear explanations targeting these weak areas?');
    }
  } else if (ctx.source === 'quiz-review') {
    if (ctx.weakDomains && ctx.weakDomains.length > 0) {
      const list = ctx.weakDomains.map((d) => `- ${d.title}: ${d.pct}%`).join('\n');
      paragraphs.push(`After reviewing my recent quiz results, I'm weakest in:\n${list}`);
      paragraphs.push('Can you give me some practice questions or a deeper explanation focused specifically on these weak domains?');
    }
  }

  paragraphs.push('Please help me understand and prepare for the exam on this topic.');

  return paragraphs.join('\n\n');
}

const PREF_KEY = 'ai_handoff_preferred_tool';
export function getPreferredAiTool(): AiToolId | null {
  try {
    const v = localStorage.getItem(PREF_KEY);
    return (v === 'chatgpt' || v === 'claude' || v === 'gemini') ? v : null;
  } catch { return null; }
}
export function setPreferredAiTool(id: AiToolId): void {
  try { localStorage.setItem(PREF_KEY, id); } catch { /* noop */ }
}

// TEST SPEC:
// - composeHandoffPrompt: source='notes' with noteExcerpt present includes quoted excerpt + quiz-me ask
// - composeHandoffPrompt: source='notes' with no noteExcerpt still returns opening + generic closing ask
// - composeHandoffPrompt: noteExcerpt longer than 400 chars is truncated with trailing "..."
// - composeHandoffPrompt: source='study-plan' with weakDomains lists each domain title+pct and asks for a focused plan
// - composeHandoffPrompt: source='study-plan' with empty/undefined weakDomains omits the weak-domain paragraph
// - composeHandoffPrompt: source='quiz-review' with weakDomains lists domains and asks for practice questions
// - composeHandoffPrompt: domainTitle present vs absent changes opening sentence
// - composeHandoffPrompt: never includes any field not present on HandoffContext (no PII leakage)
// - getPreferredAiTool: returns null when localStorage empty, throws-safe (private browsing), invalid stored value → null
// - getPreferredAiTool: returns stored value when one of 'chatgpt'|'claude'|'gemini'
// - setPreferredAiTool: writes value, swallows localStorage write errors silently
