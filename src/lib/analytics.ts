/**
 * GoatCounter analytics helpers.
 * Requires VITE_GOAT_SITE and optionally VITE_GOAT_TOKEN env vars.
 * Docs: https://www.goatcounter.com/help/api
 */

const SITE = import.meta.env.VITE_GOAT_SITE as string | undefined;
const TOKEN = import.meta.env.VITE_GOAT_TOKEN as string | undefined;

function apiUrl(path: string): string {
  if (!SITE) throw new Error('VITE_GOAT_SITE not configured');
  return `https://${SITE}.goatcounter.com/api/v0${path}`;
}

function headers(): HeadersInit {
  if (!TOKEN) throw new Error('VITE_GOAT_TOKEN not configured');
  return {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  };
}

export interface TotalStats {
  total: number;
  totalToday: number;
}

export interface PageStat {
  path: string;
  title: string;
  count: number;
}

export interface LocationStat {
  location: string;
  count: number;
}

export interface HitsByDay {
  day: string;
  count: number;
}

export async function fetchTotalHits(): Promise<TotalStats> {
  try {
    const res = await fetch(apiUrl('/stats/total'), { headers: headers() });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();
    return { total: data.total ?? 0, totalToday: data.total_utc ?? 0 };
  } catch {
    return { total: 0, totalToday: 0 };
  }
}

export async function fetchTopPages(limit = 10): Promise<PageStat[]> {
  try {
    const res = await fetch(apiUrl(`/stats/pages?limit=${limit}`), { headers: headers() });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();
    return (data.pages || []).map((p: { path: string; title: string; count: number }) => ({
      path: p.path,
      title: p.title || p.path,
      count: p.count,
    }));
  } catch {
    return [];
  }
}

export async function fetchLocations(): Promise<LocationStat[]> {
  try {
    const res = await fetch(apiUrl('/stats/locations'), { headers: headers() });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();
    return (data.locations || []).slice(0, 15).map((l: { location: string; count: number }) => ({
      location: l.location,
      count: l.count,
    }));
  } catch {
    return [];
  }
}

export async function fetchHitsByDay(days = 30): Promise<HitsByDay[]> {
  try {
    const res = await fetch(apiUrl(`/stats/hits?days=${days}`), { headers: headers() });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();
    return (data.days || []).map((d: { day: string; count: number }) => ({
      day: d.day,
      count: d.count,
    }));
  } catch {
    return [];
  }
}

export function isAnalyticsConfigured(): boolean {
  return !!(SITE && TOKEN);
}
