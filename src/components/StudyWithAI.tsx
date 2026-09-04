import { useState } from 'react';
import { ChevronDown, ChevronRight, Sparkles, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui';
import { AI_TOOLS, composeHandoffPrompt, getPreferredAiTool, setPreferredAiTool } from '@/lib/ai-handoff';
import type { HandoffContext, AiToolId } from '@/lib/ai-handoff';
import { copyToClipboard } from '@/lib/clipboard';

interface StudyWithAIProps {
  context: HandoffContext;
  variant: 'icon' | 'row';
  /** Controlled open state — omit to keep the component's default
   *  uncontrolled behavior (internal toggle on trigger click). Pass both
   *  `open` and `onOpenChange` together to drive this panel from an
   *  external trigger (e.g. a floating "explain this" button). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** A user-selected excerpt to seed the prompt with. Recomposes the
   *  prompt (leading with this excerpt) whenever it changes, without
   *  clobbering in-progress edits on unrelated re-renders. */
  initialSelectedText?: string;
}

export function StudyWithAI({ context, variant, open: openProp, onOpenChange, initialSelectedText }: StudyWithAIProps) {
  const isControlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? openProp : internalOpen;
  const setOpen = (updater: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof updater === 'function' ? (updater as (prev: boolean) => boolean)(open) : updater;
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };
  const [promptText, setPromptText] = useState(() => (
    initialSelectedText ? composeHandoffPrompt({ ...context, selectedText: initialSelectedText }) : composeHandoffPrompt(context)
  ));
  const [copied, setCopied] = useState(false);
  const [preferred, setPreferred] = useState<AiToolId | null>(() => getPreferredAiTool());

  // Recompose the prompt when a new selection comes in from an external
  // trigger. Deliberately keyed only on initialSelectedText (not `context`)
  // so it doesn't fire — and clobber a user's in-progress edit — on
  // unrelated re-renders of the icon/row trigger usages, which never pass
  // this prop at all. Recomputed during render (not an effect) per React's
  // "adjusting state when a prop changes" pattern, to avoid an extra render.
  const [prevSelectedText, setPrevSelectedText] = useState(initialSelectedText);
  if (initialSelectedText !== prevSelectedText) {
    setPrevSelectedText(initialSelectedText);
    if (initialSelectedText) {
      setPromptText(composeHandoffPrompt({ ...context, selectedText: initialSelectedText }));
    }
  }

  const handleCopy = async () => {
    const ok = await copyToClipboard(promptText);
    setCopied(ok);
    if (ok) setTimeout(() => setCopied(false), 2000);
  };

  const handleToolClick = (id: AiToolId) => {
    void copyToClipboard(promptText);
    setPreferredAiTool(id);
    setPreferred(id);
    // no preventDefault — anchor's href+target="_blank" handles navigation
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
          title="Study with AI — compose a prompt for ChatGPT, Claude, Gemini, or Microsoft Copilot"
        />
      ) : (
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/20 transition-colors border-t border-slate-800/60"
          aria-expanded={open}
        >
          <Sparkles size={12} className="text-violet-400 shrink-0" />
          <span className="font-medium">Study with AI</span>
          {open ? <ChevronDown size={12} className="ml-auto" /> : <ChevronRight size={12} className="ml-auto" />}
        </button>
      )}

      {/* Disclosure panel */}
      {open && (
        <div className="px-4 pb-4 pt-3 space-y-3">
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            rows={5}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder-slate-600 resize-none focus:outline-none focus:ring-1 focus:ring-violet-500/50"
          />
          <button
            onClick={handleCopy}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-1.5"
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? 'Copied!' : 'Copy prompt'}
          </button>
          <div className="flex gap-2">
            {AI_TOOLS.map((tool) => (
              <a
                key={tool.id}
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleToolClick(tool.id)}
                className={`flex-1 flex items-center justify-center gap-2 text-xs font-semibold py-2.5 rounded-xl transition-all hover:scale-[1.02] ${
                  preferred === tool.id
                    ? 'ring-1 ring-violet-500/60 bg-violet-500/15 border border-violet-500/40 text-violet-200'
                    : 'bg-slate-800/60 border border-slate-700/60 text-slate-300'
                }`}
              >
                {tool.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
