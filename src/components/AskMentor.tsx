import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui';
import { callMentorChat, loadMentorChat, saveMentorChat } from '@/lib/mentor-api';

export interface AskMentorContext {
  source: 'notes' | 'study-plan' | 'quiz-review';
  examId: string;
  examTitle: string;
  domainTitle?: string;
  weakDomains?: { title: string; pct: number }[];
}

interface AskMentorProps {
  context: AskMentorContext;
  variant: 'icon' | 'row';
  /** Controlled open state — omit to keep the component's default
   *  uncontrolled behavior (internal toggle on trigger click). Pass both
   *  `open` and `onOpenChange` together to drive this panel from an
   *  external trigger (e.g. a floating "explain this" button). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** A user-selected passage — seeds a fresh default question leading with
   *  it whenever it changes, without clobbering an in-progress edit on
   *  unrelated re-renders. */
  initialSelectedText?: string;
  /** Quick-fill question chips shown above the textarea (Study Plan's
   *  per-session shortcuts). Omit for a plain textarea with no chips. */
  shortcutChips?: string[];
  /** When provided (Study Plan's per-day session cards), the last answer
   *  persists to localStorage keyed on `examId`+`day` and survives a reload.
   *  Omit for a one-off, non-persisted ask (Notes.tsx, Quiz.tsx). */
  day?: number;
}

/** A sensible starting question for the mentor: selectedText > weakDomains >
 * domainTitle > generic, in that priority order. */
function buildDefaultQuestion(context: AskMentorContext, selectedText?: string): string {
  if (selectedText) {
    const excerpt = selectedText.length > 160 ? `${selectedText.slice(0, 160)}...` : selectedText;
    return `Explain this in the context of the ${context.examTitle} exam: "${excerpt}"`;
  }
  if (context.weakDomains && context.weakDomains.length > 0) {
    const top = context.weakDomains.slice(0, 3).map((d) => d.title).join(', ');
    return `I'm weakest in ${top} — what should I focus on first and why?`;
  }
  if (context.domainTitle) {
    return `Why is ${context.domainTitle} important and what are the most likely exam questions?`;
  }
  return `What should I focus on to prepare for the ${context.examTitle} exam?`;
}

export function AskMentor({ context, variant, open: openProp, onOpenChange, initialSelectedText, shortcutChips, day }: AskMentorProps) {
  const isControlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? openProp : internalOpen;
  const setOpen = (updater: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof updater === 'function' ? (updater as (prev: boolean) => boolean)(open) : updater;
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const defaultQuestion = buildDefaultQuestion(context, initialSelectedText);
  const [question, setQuestion] = useState(defaultQuestion);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(() => (day !== undefined ? loadMentorChat(context.examId, day) : null));
  const [error, setError] = useState<string | null>(null);

  // A newly selected passage seeds a fresh question and clears any previous
  // answer. Deliberately keyed only on initialSelectedText (not `context`) so
  // it doesn't fire — and clobber an in-progress edit — on unrelated
  // re-renders of the icon/row trigger usages, which never pass this prop at
  // all. Recomputed during render per React's "adjusting state when a prop
  // changes" pattern, to avoid an extra render.
  const [prevSelectedText, setPrevSelectedText] = useState(initialSelectedText);
  if (initialSelectedText !== prevSelectedText) {
    setPrevSelectedText(initialSelectedText);
    if (initialSelectedText) {
      setQuestion(buildDefaultQuestion(context, initialSelectedText));
      setAnswer(null);
      setError(null);
    }
  }

  const ask = useCallback(async () => {
    if (!question.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await callMentorChat(context.examId, context.domainTitle ?? context.examTitle, question);
      setAnswer(resp);
      if (day !== undefined) saveMentorChat(context.examId, day, resp);
    } catch {
      setError('Mentor is unavailable right now — please try again shortly.');
    } finally {
      setLoading(false);
    }
  }, [context.examId, context.domainTitle, context.examTitle, question, loading, day]);

  const clear = () => {
    setAnswer(null);
    setQuestion(defaultQuestion);
    if (day !== undefined) saveMentorChat(context.examId, day, '');
  };

  return (
    <div>
      {/* Trigger */}
      {variant === 'icon' ? (
        <Button
          variant="outline"
          size="sm"
          icon={Sparkles}
          onClick={() => setOpen((o) => !o)}
          title="Ask Mentor — ask a question about this"
        />
      ) : (
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/20 transition-colors border-t border-slate-800/60"
          aria-expanded={open}
        >
          <Sparkles size={12} className="text-violet-400 shrink-0" />
          <span className="font-medium">Ask Mentor</span>
          {open ? <ChevronDown size={12} className="ml-auto" /> : <ChevronRight size={12} className="ml-auto" />}
        </button>
      )}

      {/* Disclosure panel */}
      {open && (
        <div className="px-4 pb-4 pt-3 space-y-3">
          {shortcutChips && shortcutChips.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {shortcutChips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => setQuestion(chip)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    question === chip
                      ? 'bg-violet-600 border-violet-500 text-white'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-violet-500/50 hover:text-slate-200'
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
          )}
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value.substring(0, 300))}
            rows={3}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder-slate-600 resize-none focus:outline-none focus:ring-1 focus:ring-violet-500/50"
            placeholder="Ask the mentor anything about this..."
          />
          <div className="flex items-center gap-2">
            <button
              onClick={ask}
              disabled={loading || !question.trim()}
              className="btn-primary text-xs px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <span className="animate-spin inline-block w-3 h-3 border border-white border-t-transparent rounded-full" />
                  Asking…
                </>
              ) : (
                <>
                  <Sparkles size={11} />
                  Ask
                </>
              )}
            </button>
            {answer && (
              <button onClick={clear} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                Clear
              </button>
            )}
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          {answer && !error && (
            <div className="prose prose-invert prose-xs max-w-none text-slate-300 [&>p]:text-xs [&>p]:leading-relaxed [&>ul]:text-xs [&>ul]:leading-relaxed bg-slate-800/40 rounded-lg p-3">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{answer}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
