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

/**
 * GA4 channel/device-name → CATEGORICAL slot. ajch_food_for_thoughts#52 —
 * was two file-local hardcoded hex maps inside Monitoring.tsx. The mapping
 * is semantic (nearest hue family to what each channel/device used to be:
 * "Organic Social" was pink, no pink slot exists here, so it takes rose;
 * "Email" was orange, so it takes amber), not a literal 1:1 hex carryover —
 * every value is still one of the validated CATEGORICAL slots above, in
 * fixed assignment (never cycled per the dataviz method's non-negotiable).
 */
export const CHANNEL_COLORS: Record<string, string> = {
  'Organic Search': CATEGORICAL.violet,
  'Direct': CATEGORICAL.blue,
  'Referral': CATEGORICAL.emerald,
  'Organic Social': CATEGORICAL.rose,
  'Email': CATEGORICAL.amber,
};

export const DEVICE_COLORS: Record<string, string> = {
  desktop: CATEGORICAL.violet,
  mobile: CATEGORICAL.blue,
  tablet: CATEGORICAL.emerald,
};

/**
 * Sequential (magnitude) ramp — ajch_food_for_thoughts#53. One hue (violet,
 * H=295, matching CATEGORICAL.violet for brand consistency), 5 steps,
 * monotone lightness, dark-mode anchored: low magnitude is dark and allowed
 * to recede toward the app's real surface (#0b1220), high magnitude is
 * bright. This is the "magnitude" job from the dataviz method's four-jobs
 * taxonomy — never reuse CATEGORICAL (identity) for a continuous value.
 *
 * Validated via the ordinal ramp checks (the closest fit — this repo's
 * validator has no dedicated "sequential" mode, and running the categorical
 * six-checks on a ramp fails by design per the skill's own docs):
 *
 *   node validate_palette.js \
 *     "#261d3e,#49317a,#6d47b8,#9167ea,#b492ff" --mode dark \
 *     --surface "#0b1220" --ordinal
 *
 *   [PASS] Lightness monotone   steps read light→dark
 *   [PASS] Adjacent ΔL          all gaps >= 0.06
 *   [FAIL] Light-end contrast   #261d3e at 1.18:1 vs surface — below 2:1
 *   [PASS] Single hue           hue spread 2°
 *
 * The one FAIL is expected and correct, not a defect: the light-end-contrast
 * floor is specifically an ORDINAL requirement (a discrete tier mark must
 * stay visible even at its palest step). A true SEQUENTIAL ramp's near-zero
 * step is explicitly allowed to fade into the surface — see the dataviz
 * skill's palette.md ("the lightest step means 'near zero' and is allowed to
 * recede toward the surface"). Don't "fix" this ramp to force that check to
 * pass; it would just make near-zero cells falsely read as "some value."
 */
export const SEQUENTIAL = ['#261d3e', '#49317a', '#6d47b8', '#9167ea', '#b492ff'] as const;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  const c = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

/**
 * Maps a magnitude in [0, 1] onto the SEQUENTIAL ramp, linearly interpolating
 * between the two nearest validated stops in sRGB space. A UI heat-tint, not
 * a scientific visualization — sRGB interpolation is the standard, pragmatic
 * choice here (true OKLab interpolation would over-engineer a 5-stop ramp
 * whose stops are already individually validated).
 */
export function sequentialColor(t: number): string {
  const clamped = Math.min(1, Math.max(0, Number.isFinite(t) ? t : 0));
  const steps = SEQUENTIAL.length - 1;
  const pos = clamped * steps;
  const lo = Math.floor(pos);
  const hi = Math.min(steps, lo + 1);
  const frac = pos - lo;
  if (lo === hi) return SEQUENTIAL[lo];
  const [r1, g1, b1] = hexToRgb(SEQUENTIAL[lo]);
  const [r2, g2, b2] = hexToRgb(SEQUENTIAL[hi]);
  return rgbToHex([r1 + (r2 - r1) * frac, g1 + (g2 - g1) * frac, b1 + (b2 - b1) * frac]);
}
