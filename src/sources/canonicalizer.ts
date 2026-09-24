/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseUrlSafely } from './urlParser.ts';

// Tracking parameters commonly appended to web links
export const WEB_TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'fbclid',
  'gclid',
  'dclid',
  'msclkid',
  'ref',
  'ref_src',
  'mc_eid',
  'yclid',
  '_hsenc',
  '_hsmi',
  'zanpid'
]);

export interface CanonicalUrlResult {
  canonicalUrl: string;
  hostname: string;
  domain: string;
  path: string;
  strippedParams: string[];
}

/**
 * Normalizes and canonicalizes direct website URLs.
 */
export function canonicalizeWebsiteUrl(rawUrl: string): CanonicalUrlResult | null {
  const parsed = parseUrlSafely(rawUrl);
  if (!parsed) return null;

  const strippedParams: string[] = [];
  const searchParams = new URLSearchParams(parsed.search);

  // Strip tracking parameters
  for (const [key] of Array.from(searchParams.entries())) {
    const lowerKey = key.toLowerCase();
    if (WEB_TRACKING_PARAMS.has(lowerKey) || lowerKey.startsWith('utm_')) {
      strippedParams.push(key);
      searchParams.delete(key);
    }
  }

  // Sort remaining query params deterministically
  searchParams.sort();

  // Normalize hostname
  const hostname = parsed.hostname.toLowerCase();
  const domain = hostname.replace(/^www\./, '');

  // Normalize path: collapse multi slashes, remove trailing slash if not root
  let path = parsed.pathname.replace(/\/+/g, '/');
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }

  // Reconstruct canonical URL
  const searchString = searchParams.toString();
  const canonicalUrl = `${parsed.protocol}//${hostname}${path}${searchString ? `?${searchString}` : ''}`;

  return {
    canonicalUrl,
    hostname,
    domain,
    path,
    strippedParams
  };
}

/**
 * Canonicalizes a sitemap URL.
 */
export function canonicalizeSitemapUrl(rawUrl: string): { canonicalUrl: string; domain: string; isXml: boolean } | null {
  const parsed = parseUrlSafely(rawUrl);
  if (!parsed) return null;

  const hostname = parsed.hostname.toLowerCase();
  const domain = hostname.replace(/^www\./, '');
  let path = parsed.pathname.replace(/\/+/g, '/');

  const canonicalUrl = `${parsed.protocol}//${hostname}${path}`;
  const isXml = path.toLowerCase().endsWith('.xml');

  return {
    canonicalUrl,
    domain,
    isXml
  };
}
