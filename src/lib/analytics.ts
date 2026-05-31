/**
 * Analytics helpers — GA4 (Issue #14).
 * Requires VITE_GA_MEASUREMENT_ID env var.
 * Cookieless mode: storage 'none', anonymize_ip — no consent banner needed.
 */

// Stub types kept for interface compatibility — will be populated by GA4 (Issue #14)
export interface TotalStats   { total: number; totalToday: number; }
export interface PageStat     { path: string; title: string; count: number; }
export interface LocationStat { location: string; count: number; }
export interface HitsByDay    { day: string; count: number; }

export function isAnalyticsConfigured(): boolean {
  return !!import.meta.env.VITE_GA_MEASUREMENT_ID;
}
