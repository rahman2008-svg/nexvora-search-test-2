/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Reusable URL parsing & validation utility.
 */

export function isValidUrl(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  const trimmed = input.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return Boolean(parsed.hostname && parsed.protocol.startsWith('http'));
  } catch {
    return false;
  }
}

export function parseUrlSafely(input: string): URL | null {
  if (!isValidUrl(input)) return null;
  try {
    return new URL(input.trim());
  } catch {
    return null;
  }
}

/**
 * Identifies if a URL is a Google Search URL.
 * Recognizes google.com, google.co.in, google.co.uk, google.de, etc.
 * and search endpoints (/search, /webhp, /url).
 */
export function isGoogleSearchUrl(url: URL | string): boolean {
  const parsed = typeof url === 'string' ? parseUrlSafely(url) : url;
  if (!parsed) return false;

  const hostname = parsed.hostname.toLowerCase();
  const isGoogleDomain = 
    hostname === 'google.com' ||
    hostname.endsWith('.google.com') ||
    hostname.includes('google.co.') ||
    /^www\.google\.[a-z]{2,4}$/.test(hostname) ||
    hostname === 'google.org';

  if (!isGoogleDomain) return false;

  const pathname = parsed.pathname.toLowerCase();
  return (
    pathname === '/search' ||
    pathname.startsWith('/search') ||
    pathname === '/webhp' ||
    pathname === '/url'
  );
}

/**
 * Identifies if a URL points to a sitemap XML or sitemap index.
 */
export function isSitemapUrl(url: URL | string): boolean {
  const parsed = typeof url === 'string' ? parseUrlSafely(url) : url;
  if (!parsed) return false;

  const pathname = parsed.pathname.toLowerCase();
  return (
    pathname.endsWith('sitemap.xml') ||
    pathname.endsWith('sitemap_index.xml') ||
    pathname.endsWith('sitemap.txt') ||
    pathname.includes('sitemap')
  );
}

/**
 * Extracts clean domain name from URL (without www).
 */
export function extractCleanDomain(url: URL | string): string {
  const parsed = typeof url === 'string' ? parseUrlSafely(url) : url;
  if (!parsed) return '';
  return parsed.hostname.toLowerCase().replace(/^www\./, '');
}
