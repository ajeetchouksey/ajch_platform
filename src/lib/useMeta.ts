/**
 * useMeta — Issue #61
 * Lightweight SEO meta hook using native DOM APIs.
 * Zero new dependencies — no react-helmet-async.
 *
 * Usage:
 *   useMeta({ title: 'Page Title', description: '...', ogImage: '...' });
 *
 * Sets/updates:
 *   document.title
 *   <meta name="description">
 *   <meta property="og:title">
 *   <meta property="og:description">
 *   <meta property="og:url">
 *   <meta property="og:image">   (if provided)
 *   <meta property="twitter:card">
 *   <meta property="twitter:title">
 *   <meta property="twitter:description">
 */
import { useEffect, useRef } from 'react';

export interface MetaOptions {
  title?: string;
  description?: string;
  ogImage?: string;
  /** Defaults to window.location.href */
  canonicalUrl?: string;
}

const SITE_NAME = 'Aarya — My AI Learning Hub';
const DEFAULT_OG_IMAGE = 'https://aaryaai.dev/og-default.png';

/** Upsert a <meta> tag in <head>. Returns the element so callers can restore it. */
function upsertMeta(selector: string, attr: string, value: string): HTMLMetaElement {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    const [key, val] = attr.split('=');
    el.setAttribute(key, val.replace(/^"|"$/g, ''));
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
  return el;
}

export function useMeta({ title, description, ogImage, canonicalUrl }: MetaOptions) {
  const prevTitleRef = useRef<string>(document.title);

  useEffect(() => {
    const prev = document.title;
    prevTitleRef.current = prev;

    const pageTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    const pageDesc  = description ?? `Sharpen your AI and platform engineering skills on ${SITE_NAME}.`;
    const pageUrl   = canonicalUrl ?? window.location.href;
    const pageImage = ogImage ?? DEFAULT_OG_IMAGE;

    // ── document.title ──────────────────────────────────────────────────────
    document.title = pageTitle;

    // ── <meta name="description"> ───────────────────────────────────────────
    upsertMeta('meta[name="description"]',             'name="description"',         pageDesc);

    // ── Open Graph ──────────────────────────────────────────────────────────
    upsertMeta('meta[property="og:title"]',            'property="og:title"',        pageTitle);
    upsertMeta('meta[property="og:description"]',      'property="og:description"',  pageDesc);
    upsertMeta('meta[property="og:url"]',              'property="og:url"',          pageUrl);
    upsertMeta('meta[property="og:image"]',            'property="og:image"',        pageImage);
    upsertMeta('meta[property="og:site_name"]',        'property="og:site_name"',    SITE_NAME);
    upsertMeta('meta[property="og:type"]',             'property="og:type"',         'website');

    // ── Twitter / X card ────────────────────────────────────────────────────
    upsertMeta('meta[name="twitter:card"]',            'name="twitter:card"',        'summary_large_image');
    upsertMeta('meta[name="twitter:title"]',           'name="twitter:title"',       pageTitle);
    upsertMeta('meta[name="twitter:description"]',     'name="twitter:description"', pageDesc);
    upsertMeta('meta[name="twitter:image"]',           'name="twitter:image"',       pageImage);

    // ── Cleanup: restore previous title on unmount ───────────────────────────
    return () => {
      document.title = prevTitleRef.current;
    };
  }, [title, description, ogImage, canonicalUrl]);
}
