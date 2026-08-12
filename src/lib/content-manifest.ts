export interface ContentManifestEntry {
  repo?: string;
  sha?: string;
  baseUrl?: string;
  schemaVersion?: number | string;
  promotedAt?: string;
}

export interface ContentManifestFile {
  [vertical: string]: ContentManifestEntry;
}

export const CONTENT_MANIFEST: Record<string, ContentManifestEntry> = {};
let _manifestPromise: Promise<Record<string, ContentManifestEntry>> | null = null;

export async function loadContentManifest(): Promise<Record<string, ContentManifestEntry>> {
  const manifestPath = '/content-manifest.json';

  try {
    const response = await fetch(manifestPath, { cache: 'no-store' });
    if (!response.ok) {
      return CONTENT_MANIFEST;
    }

    const content = await response.json() as unknown;
    if (!content || typeof content !== 'object') {
      return CONTENT_MANIFEST;
    }

    const parsed = content as Record<string, unknown>;
    Object.keys(parsed).forEach((vertical) => {
      const entry = parsed[vertical];
      if (!entry || typeof entry !== 'object') return;
      const value = entry as Record<string, unknown>;
      const repo = typeof value.repo === 'string' ? value.repo : undefined;
      const sha = typeof value.sha === 'string' ? value.sha : undefined;
      const baseUrl = typeof value.baseUrl === 'string' ? value.baseUrl : undefined;
      const schemaVersion = value.schemaVersion;
      const promotedAt = typeof value.promotedAt === 'string' ? value.promotedAt : undefined;
      CONTENT_MANIFEST[vertical] = {
        repo,
        sha,
        baseUrl,
        schemaVersion: schemaVersion as number | string | undefined,
        promotedAt,
      };
    });
  } catch {
    // Graceful fallback: keep working from local public/content in single-repo mode.
  }

  return CONTENT_MANIFEST;
}

export async function ensureContentManifestLoaded(): Promise<Record<string, ContentManifestEntry>> {
  if (!_manifestPromise) {
    _manifestPromise = loadContentManifest();
  }
  return _manifestPromise;
}

if (typeof window !== 'undefined') {
  void ensureContentManifestLoaded();
}

export const SUPPORTED_SCHEMA_VERSIONS = new Set<number>([1]);

export function verticalFromContentPath(path: string): string | null {
  const normalized = path.replace(/\\/g, '/').replace(/^\/+/, '');
  const match = normalized.match(/^content\/([^/]+)/);
  return match ? match[1] : null;
}

export function extractSchemaVersion(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    const direct = Number(trimmed);
    if (Number.isFinite(direct) && Number.isInteger(direct)) {
      return direct;
    }

    const match = trimmed.match(/(\d+)/);
    if (match) {
      return Number(match[1]);
    }
  }

  return null;
}

function getBaseUrl(): string {
  const envBase = typeof import.meta !== 'undefined' ? (import.meta.env as { BASE_URL?: string } | undefined)?.BASE_URL : undefined;
  return envBase && envBase !== '/' ? envBase.replace(/\/$/, '') + '/' : '/';
}

export function contentBase(vertical: string): string {
  const entry = CONTENT_MANIFEST[vertical];

  if (entry?.repo && entry.sha) {
    const baseUrl = entry.baseUrl?.replace(/\/$/, '') ?? 'https://cdn.jsdelivr.net/gh';
    return `${baseUrl}/${entry.repo}@${entry.sha}/`;
  }

  return `${getBaseUrl()}content/${vertical}/`;
}

export function validateSchemaCompatibility(vertical: string | null, payload: unknown): void {
  if (!payload || typeof payload !== 'object') return;

  const obj = payload as Record<string, unknown>;
  const schemaValue = obj.schemaVersion ?? obj.schema;
  if (schemaValue === undefined || schemaValue === null) return;

  const version = extractSchemaVersion(schemaValue);
  if (version === null) {
    throw new Error(`Unsupported schema declaration for ${vertical ?? 'content'}: ${String(schemaValue)}`);
  }

  if (!SUPPORTED_SCHEMA_VERSIONS.has(version)) {
    throw new Error(
      `Unsupported schema version ${version} for ${vertical ?? 'content'}; supported versions: ${[...SUPPORTED_SCHEMA_VERSIONS].join(', ')}`,
    );
  }
}

export function resolveContentUrl(path: string): string {
  const normalized = path.replace(/\\/g, '/').replace(/^\/+/, '').replace(/^\.?\//, '');
  const safePath = normalized.startsWith('content/') ? normalized : `content/${normalized}`;

  const segments = safePath.split('/');
  const vertical = segments[1];
  const entry = vertical ? CONTENT_MANIFEST[vertical] : undefined;

  if (entry?.repo && entry.sha) {
    const baseUrl = entry.baseUrl?.replace(/\/$/, '') ?? 'https://cdn.jsdelivr.net/gh';
    return `${baseUrl}/${entry.repo}@${entry.sha}/${safePath}`;
  }

  const base = getBaseUrl();
  return `${base}${safePath}`;
}
