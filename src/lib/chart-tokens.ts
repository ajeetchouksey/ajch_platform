// ── Chart / data-viz color tokens ────────────────────────────────────────
// ajch_food_for_thoughts#50 (IDEA-0017 Epic #49) — the single source of
// truth for chart/data-mark colors. Before this file, every hand-rolled
// chart (Monitoring's Sparkline/HBarChart/DonutChart/KpiCard, Progress.tsx's
// domain bars, etc.) either hardcoded its own hex per call site or reused
// GlassCard.tsx's ACCENT gradient tokens — which were never validated for
// categorical (series-identity) use and in fact FAIL colorblind safety:
// violet and blue, this app's two most-common accent colors, scored
// OKLab ΔE 0.3 apart for a deuteranope (target >=8) and 10.2 for normal
// vision (floor 15) — see the Epic for the full evidence.
//
// GlassCard.ACCENT is a separate, still-valid system for a different job —
// decorative card-border gradients, not data-mark color — and is untouched
// here; this file exists for the "which color does series N get" question
// specifically, per the dataviz skill's four-jobs taxonomy (categorical /
// ordinal / sequential / diverging / status).
//
// Derived and validated (not hand-picked) via the dataviz skill's
// snap-to-passing workflow — every value below is OKLCH-constructed and
// re-checked with node validate_palette.js:
//
//   node validate_palette.js \
//     "#8b61e3,#00a5cb,#008444,#be8800,#eb5169,#b2339f,#4a8fc7" --mode dark
//
//   [PASS] Lightness band       all 7 inside L 0.48-0.67
//   [PASS] Chroma floor         all 7 >= 0.10
//   [WARN] CVD separation       worst adjacent rose<->amber ΔE 7.3 (deutan) —
//                               floor band (6-8), legal WITH secondary
//                               encoding: every consumer of these tokens
//                               MUST also render an icon and/or text label,
//                               never color alone (already this app's
//                               convention — see CATEGORICAL_LABEL/ICON
//                               below and src/lib/content-types.ts).
//   [PASS] Normal-vision floor  worst adjacent ΔE 16.8 (clear of the 15 floor)
//   [PASS] Contrast vs surface  all 7 >= 3:1
//
// Validated against --mode dark only — this app has no light mode today
// (see IDEA-0017's open questions). The token names below are structured by
// role so a future light-mode value can be added per-key without touching
// any consumer.
//
// The app is always-dark (src/index.css sets a fixed dark background), so
// there is exactly one value per role today, not a light/dark pair.

/** Categorical (series-identity) palette — 7 named slots, fixed order, never cycled. */
export const CATEGORICAL = {
  violet:  '#8b61e3',
  blue:    '#00a5cb',
  emerald: '#008444',
  amber:   '#be8800',
  rose:    '#eb5169',
  purple:  '#b2339f',
  slate:   '#4a8fc7',
} as const;

export type CategoricalKey = keyof typeof CATEGORICAL;

/**
 * Status (state) palette — good/warning/critical. Deliberately reuses the
 * existing Tailwind emerald-400/amber-400/rose-400 values already load-
 * bearing across the app for pass/warn/fail text (e.g. Progress.tsx,
 * Quiz.tsx's review cards) rather than introducing new ones: the
 * colorblind-safety failure was specific to the CATEGORICAL slots above,
 * not these — re-validated here for real (WCAG text contrast vs this app's
 * actual dark surface #0b1220, not assumed):
 *
 *   good     #34d399  9.74:1
 *   warning  #fbbf24  11.22:1
 *   critical #fb7185  6.96:1
 *
 * Per the dataviz method's collision rule: status never follows the
 * categorical theme and is always paired with an icon + label, never color
 * alone — a status color must never be reused for "series 4".
 */
export const STATUS = {
  good: '#34d399',
  warning: '#fbbf24',
  critical: '#fb7185',
} as const;

export type StatusKey = keyof typeof STATUS;
