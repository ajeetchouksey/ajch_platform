/**
 * KeywordHighlight.tsx
 * Inline keyword highlighting for platform content (blogs, notes, pathways, docs).
 *
 * Exports:
 *  - applyHighlighting(children)     — processes React children, wrapping matched terms
 *  - KeywordHighlightToggle          — toggle button component
 *
 * Security: uses pure JSX spans (no dangerouslySetInnerHTML). Regex is built
 * from a static dictionary with all metacharacters escaped.
 */
/* eslint-disable react-refresh/only-export-components */

import React, { useState, useRef } from 'react';
import { getKeywordRegex, getKeywordMap, CATEGORY_STYLE, type KeywordCategory } from '@/lib/keywords';

// ── Keyword tooltip ───────────────────────────────────────────────────────────

/** Approximate tooltip height in px used to detect vertical viewport overflow. */
const TOOLTIP_HEIGHT_ESTIMATE = 110;
/** Maximum tooltip width — shrinks on very narrow screens. */
const TOOLTIP_MAX_W = 280;
/** Min px gap from each screen edge. */
const EDGE_MARGIN = 8;

interface TooltipProps {
  term: string;
  category: KeywordCategory;
  description?: string;
}

interface TooltipLayout {
  flipped: boolean;      // open below instead of above
  tipLeft: number;       // px offset from mark's left edge
  caretLeft: number;     // px offset within the tooltip for the caret
  tipWidth: number;      // resolved max-width (capped to viewport)
}

function KeywordMark({ term, category, description }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [layout, setLayout] = useState<TooltipLayout | null>(null);
  const markRef = useRef<HTMLElement>(null);
  const style = CATEGORY_STYLE[category];

  const handleShow = () => {
    if (markRef.current) {
      const rect = markRef.current.getBoundingClientRect();
      const vw = window.innerWidth;

      // ── Vertical flip ──────────────────────────────────────────────────────
      const header = document.querySelector('header');
      const headerBottom = header ? header.getBoundingClientRect().bottom : 64;
      const flipped = rect.top < headerBottom + TOOLTIP_HEIGHT_ESTIMATE + 8;

      // ── Horizontal clamping ────────────────────────────────────────────────
      // Effective tooltip width: never wider than viewport minus both margins
      const tipWidth = Math.min(TOOLTIP_MAX_W, vw - EDGE_MARGIN * 2);
      const markCenterX = rect.left + rect.width / 2;

      // Ideal: centre the tooltip on the mark
      const idealLeft = markCenterX - tipWidth / 2;
      // Clamp so neither edge escapes the viewport
      const clampedLeft = Math.max(EDGE_MARGIN, Math.min(vw - tipWidth - EDGE_MARGIN, idealLeft));
      // Convert to mark-relative offset (tooltip is absolutely positioned inside mark)
      const tipLeft = clampedLeft - rect.left;

      // ── Caret: always points at mark centre ───────────────────────────────
      const caretLeft = Math.max(12, Math.min(tipWidth - 16, rect.width / 2 - tipLeft));

      setLayout({ flipped, tipLeft, caretLeft, tipWidth });
    }
    setVisible(true);
  };

  const tipPos: React.CSSProperties = layout?.flipped
    ? { top: 'calc(100% + 8px)', bottom: 'auto' }
    : { bottom: 'calc(100% + 8px)', top: 'auto' };

  const caretBorder: React.CSSProperties = layout?.flipped
    ? { borderTop: `1px solid ${style.border}`, borderLeft: `1px solid ${style.border}`, borderBottom: 'none', borderRight: 'none', top: '-5px', bottom: 'auto' }
    : { borderBottom: `1px solid ${style.border}`, borderRight: `1px solid ${style.border}`, borderTop: 'none', borderLeft: 'none', bottom: '-5px', top: 'auto' };

  return (
    <mark
      ref={markRef as React.RefObject<HTMLElement>}
      style={{
        position: 'relative',
        display: 'inline-block',
        verticalAlign: 'baseline',
        background: style.bg,
        color: style.color,
        borderRadius: '3px',
        padding: '0 3px',
        fontWeight: 600,
        cursor: 'help',
        textDecorationLine: 'underline',
        textDecorationStyle: 'dotted',
        textDecorationColor: style.color,
        textUnderlineOffset: '2px',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={handleShow}
      onMouseLeave={() => setVisible(false)}
      onFocus={handleShow}
      onBlur={() => setVisible(false)}
      aria-label={`${term} — ${CATEGORY_STYLE[category].label}`}
    >
      {term}

      {visible && layout && (
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            ...tipPos,
            left: `${layout.tipLeft}px`,
            zIndex: 60,
            background: 'rgba(9,18,36,0.98)',
            border: `1px solid ${style.border}`,
            borderRadius: '10px',
            padding: '8px 12px',
            width: `${layout.tipWidth}px`,
            maxWidth: `${layout.tipWidth}px`,
            // Reset inherited white-space:nowrap from <mark> so text wraps
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            pointerEvents: 'none',
            boxShadow: '0 8px 32px rgba(0,0,0,0.60)',
            backdropFilter: 'blur(8px)',
            color: '#94a3b8',
            fontWeight: 400,
            fontSize: '12px',
            lineHeight: 1.5,
            textDecorationLine: 'none',
            cursor: 'default',
          } as React.CSSProperties}
        >
          {/* Category badge */}
          <span
            style={{
              display: 'inline-block',
              fontSize: '9px',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              color: style.color,
              background: style.bg,
              border: `1px solid ${style.border}`,
              borderRadius: '4px',
              padding: '1px 6px',
              marginBottom: description ? '6px' : 0,
            }}
          >
            {CATEGORY_STYLE[category].label}
          </span>

          {/* Description */}
          {description && (
            <span
              style={{
                display: 'block',
                fontSize: '11.5px',
                color: '#94a3b8',
                lineHeight: 1.55,
              }}
            >
              {description}
            </span>
          )}

          {/* Caret — always points at the mark centre */}
          <span
            style={{
              position: 'absolute',
              left: `${layout.caretLeft}px`,
              transform: 'rotate(45deg)',
              width: '9px',
              height: '9px',
              background: 'rgba(9,18,36,0.98)',
              ...caretBorder,
            }}
          />
        </span>
      )}
    </mark>
  );
}

// ── Text splitter ─────────────────────────────────────────────────────────────

/**
 * Splits a plain text string into an array of React nodes where keyword
 * occurrences are replaced by <KeywordMark> elements.
 */
export function splitWithKeywords(text: string): React.ReactNode[] {
  const regex = getKeywordRegex();
  const kwMap = getKeywordMap();
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  // Reset stateful lastIndex from any prior call (regex flag: g)
  regex.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    // match[1] is the captured keyword (group 1 inside the pattern)
    const matchedText = match[1] ?? match[0];
    const matchStart = match.index + match[0].indexOf(matchedText);

    if (matchStart > lastIndex) {
      parts.push(text.slice(lastIndex, matchStart));
    }

    // Lookup matched text; if not found, try stripping trailing 's' (plural fallback)
    let kw = kwMap.get(matchedText.toLowerCase());
    if (!kw && matchedText.endsWith('s')) {
      kw = kwMap.get(matchedText.slice(0, -1).toLowerCase());
    }
    if (kw) {
      parts.push(
        <KeywordMark
          key={`kw-${matchStart}`}
          term={matchedText}
          category={kw.category}
          description={kw.description}
        />,
      );
    } else {
      parts.push(matchedText);
    }

    lastIndex = matchStart + matchedText.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

// ── Children processor ────────────────────────────────────────────────────────

/**
 * Walks the immediate children of a block element (p, li, blockquote).
 * Plain string children are split and keyword-highlighted.
 * React element children (strong, em, a, code, etc.) are left as-is —
 * code spans are intentionally excluded from highlighting.
 */
export function applyHighlighting(children: React.ReactNode): React.ReactNode {
  if (typeof children === 'string') {
    const parts = splitWithKeywords(children);
    // If no keywords found, return the original string to avoid unnecessary wrapping
    if (parts.length === 1 && typeof parts[0] === 'string') return children;
    return <>{parts}</>;
  }

  if (Array.isArray(children)) {
    let changed = false;
    const mapped = (children as React.ReactNode[]).map((child, i) => {
      if (typeof child === 'string') {
        const parts = splitWithKeywords(child);
        if (parts.length === 1 && typeof parts[0] === 'string') return child;
        changed = true;
        return <React.Fragment key={i}>{parts}</React.Fragment>;
      }
      return child;
    });
    return changed ? mapped : children;
  }

  return children;
}

// ── Toggle button ─────────────────────────────────────────────────────────────

interface ToggleProps {
  enabled: boolean;
  onToggle: () => void;
  className?: string;
}

export function KeywordHighlightToggle({ enabled, onToggle, className }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={enabled ? 'Disable keyword highlighting' : 'Highlight technical keywords'}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '10px',
        fontWeight: 700,
        padding: '3px 9px',
        borderRadius: '7px',
        border: `1px solid ${enabled ? 'rgba(167,139,250,0.45)' : 'rgba(71,85,105,0.28)'}`,
        background: enabled ? 'rgba(167,139,250,0.13)' : 'rgba(15,23,42,0.70)',
        color: enabled ? '#a78bfa' : '#64748b',
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        letterSpacing: '0.02em',
        userSelect: 'none',
      }}
    >
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="5"
          cy="5"
          r="4"
          stroke={enabled ? '#a78bfa' : '#64748b'}
          strokeWidth="1.2"
        />
        {enabled && (
          <circle cx="5" cy="5" r="2" fill="#a78bfa" />
        )}
      </svg>
      {enabled ? 'Terms on' : 'Terms off'}
    </button>
  );
}
