import { createPortal } from 'react-dom';
import { GlassCard } from './GlassCard';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Styles the confirm action as destructive (red) instead of the default brand accent */
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Themed replacement for `window.confirm` — the app's one reusable
 *  confirmation dialog, so a destructive action never breaks out into a
 *  native browser prompt. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  // Rendered via a portal to document.body — routed page content sits inside
  // Layout.tsx's `animate-[fadeIn_..._both]` wrapper, which (per its keyframes
  // touching `transform`) leaves a non-`none` computed transform in place even
  // after the animation ends. That silently turns any descendant `fixed`
  // element into one positioned relative to that wrapper instead of the
  // viewport — the same escape hatch already used by MermaidDiagram's and
  // Layout's own modal/dropdown portals.
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={onCancel}
    >
      {/* stopPropagation via a plain wrapper — GlassCard's onClick prop has no event param */}
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm">
        <GlassCard accent={danger ? 'rose' : 'violet'} className="p-5">
          <h2 id="confirm-dialog-title" className="text-base font-semibold text-white mb-1.5">
            {title}
          </h2>
          <p className="text-sm text-slate-400 mb-5">{description}</p>
          <div className="flex justify-end gap-2.5">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              {cancelLabel}
            </Button>
            <Button variant={danger ? 'danger' : 'primary'} size="sm" onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>,
    document.body,
  );
}
