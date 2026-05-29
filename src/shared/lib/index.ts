/**
 * shared/lib — canonical import path for all shared library utilities.
 *
 * Usage:  import { useAuth } from '@/shared/lib/auth';
 *         import { loadBlogManifest } from '@/shared/lib/content-loader';
 *
 * Implementation files live in src/lib/ during incremental migration.
 * TODO: move implementation files into src/shared/lib/ directly.
 */

export * from '@/lib/analytics';
export * from '@/lib/content-loader';
export * from '@/lib/gist-sync';
export * from '@/lib/github-stats';
export * from '@/lib/storage';
export * from '@/lib/tokenizer';
export * from '@/lib/useProgressSync';
// Note: auth uses a React context — import it directly:
// import { AuthProvider, useAuth } from '@/shared/lib/auth';
export * from '@/lib/auth';
