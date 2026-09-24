/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Dynamically resolves the current deployment origin.
 * Works uniformly on localhost, preview deployments, custom domains, or production.
 */
export function getAppOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  // Fallback for SSR, serverless or build-time evaluation
  if (typeof process !== 'undefined') {
    if (process.env?.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`.replace(/\/$/, '');
    }
    if (process.env?.APP_URL) {
      return process.env.APP_URL.replace(/\/$/, '');
    }
  }
  return '';
}

/**
 * Builds an internal search URL under the current domain.
 * Example: /search?q=machine+learning&page=1
 */
export function buildSearchUrl(query: string, page = 1, category = 'all'): string {
  const params = new URLSearchParams();
  if (query.trim()) {
    params.set('q', query.trim());
  }
  if (page > 1) {
    params.set('page', page.toString());
  }
  if (category && category !== 'all') {
    params.set('category', category);
  }
  const queryString = params.toString();
  return queryString ? `/search?${queryString}` : '/';
}

/**
 * Returns full absolute URL for sharing or metadata based on current origin.
 */
export function getAbsoluteUrl(path: string): string {
  const origin = getAppOrigin();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${normalizedPath}`;
}
