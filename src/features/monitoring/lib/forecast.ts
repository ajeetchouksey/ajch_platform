/**
 * Lightweight client-side trend/forecast for the Overview daily series.
 * At the scale of an internal single-owner dashboard (~120-200 daily rows),
 * a trailing-N-day linear regression — fit on a 7-day trailing average to
 * cancel out weekday/weekend seasonality, then projected forward — is the
 * right level of sophistication. No backend ML pipeline or stats library
 * needed.
 */

export interface SeriesPoint {
  date: string; // YYYY-MM-DD
  value: number;
}

export interface ForecastResult {
  /** Projected continuation of the series, starting the day after the last real point. */
  projectedPoints: SeriesPoint[];
  /** Week-over-week growth rate, e.g. 0.12 = +12%. Null if fewer than 14 points. */
  growthRateWoW: number | null;
  /** Month-over-month growth rate. Null if fewer than 60 points. */
  growthRateMoM: number | null;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * 7-day trailing average, one output value per input point once enough
 * history exists (fewer than 7 prior points → average of what's available).
 * A raw day-to-day fit is noisy for web traffic — weekday vs. weekend swings
 * can dominate a short window and produce a misleading slope depending on
 * which day-of-week the window happens to start/end on. Smoothing first
 * fits the underlying trend, not the weekly seasonality.
 */
function trailingWeeklyAverage(points: SeriesPoint[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < points.length; i++) {
    const start = Math.max(0, i - 6);
    const window = points.slice(start, i + 1);
    out.push(window.reduce((a, p) => a + p.value, 0) / window.length);
  }
  return out;
}

/** Ordinary least-squares slope/intercept over the trailing `windowSize` smoothed points (or all, if fewer). */
function trailingLinearFit(points: SeriesPoint[], windowSize: number): { slope: number; intercept: number } {
  const smoothed = trailingWeeklyAverage(points).slice(-windowSize);
  const n = smoothed.length;
  if (n < 2) return { slope: 0, intercept: smoothed[0] ?? points[points.length - 1]?.value ?? 0 };

  const xs = smoothed.map((_, i) => i);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = smoothed.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (smoothed[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;
  return { slope, intercept };
}

function sumLastNDays(points: SeriesPoint[], n: number, offset = 0): number | null {
  const end = points.length - offset;
  const start = end - n;
  if (start < 0) return null;
  return points.slice(start, end).reduce((a, p) => a + p.value, 0);
}

/**
 * @param points Chronologically ordered series (oldest first), one point per day, no gaps.
 * @param projectDays How many days forward to project. Defaults to 30.
 * @param fitWindow How many trailing days to fit the trend line on. Defaults to 14 —
 *   long enough to smooth day-of-week noise, short enough to track a real recent shift.
 */
export function forecast(points: SeriesPoint[], projectDays = 30, fitWindow = 14): ForecastResult {
  if (points.length < 2) {
    return { projectedPoints: [], growthRateWoW: null, growthRateMoM: null };
  }

  const { slope, intercept } = trailingLinearFit(points, fitWindow);
  const windowLength = Math.min(fitWindow, points.length);
  const lastDate = points[points.length - 1].date;

  const projectedPoints: SeriesPoint[] = [];
  for (let i = 1; i <= projectDays; i++) {
    const value = Math.max(0, intercept + slope * (windowLength - 1 + i));
    projectedPoints.push({ date: addDays(lastDate, i), value: Math.round(value) });
  }

  const thisWeek = sumLastNDays(points, 7, 0);
  const lastWeek = sumLastNDays(points, 7, 7);
  const growthRateWoW = thisWeek !== null && lastWeek !== null && lastWeek > 0
    ? (thisWeek - lastWeek) / lastWeek
    : null;

  const thisMonth = sumLastNDays(points, 30, 0);
  const lastMonth = sumLastNDays(points, 30, 30);
  const growthRateMoM = thisMonth !== null && lastMonth !== null && lastMonth > 0
    ? (thisMonth - lastMonth) / lastMonth
    : null;

  return { projectedPoints, growthRateWoW, growthRateMoM };
}
