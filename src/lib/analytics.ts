/**
 * Analytics helpers — GA4 (Issue #14).
 * Requires VITE_GA_MEASUREMENT_ID env var.
 * Cookieless mode: storage 'none', client_storage 'none' — no consent banner needed.
 */

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (command: string, target: unknown, params?: Record<string, unknown>) => void;
  }
}

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

/** Call once at app startup (before React renders) to load the GA4 script. */
export function initGA(): void {
  if (!GA_ID) return;

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag(command, target, params) {
    window.dataLayer.push(params !== undefined ? [command, target, params] : [command, target]);
  };
  window.gtag('js', new Date() as unknown as string);
  window.gtag('config', GA_ID, { anonymize_ip: true, storage: 'none', client_storage: 'none' });

  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);
}

/** Call on every route change to record a page_view hit. */
export function trackPageView(path: string): void {
  if (!GA_ID || typeof window.gtag !== 'function') return;
  window.gtag('config', GA_ID, { page_path: path });
}

/** Generic event tracker for custom interactions. */
export function trackEvent(name: string, params?: Record<string, string | number>): void {
  if (!GA_ID || typeof window.gtag !== 'function') return;
  window.gtag('event', name, params);
}

export function isAnalyticsConfigured(): boolean {
  return !!GA_ID;
}

// Stub types kept for interface compatibility (previously used by GoatCounter views)
export interface TotalStats   { total: number; totalToday: number; }
export interface PageStat     { path: string; title: string; count: number; }
export interface LocationStat { location: string; count: number; }
export interface HitsByDay    { day: string; count: number; }
