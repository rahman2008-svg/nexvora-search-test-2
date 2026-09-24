/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseUrlSafely, isGoogleSearchUrl } from './urlParser.ts';
import { getAppOrigin } from '../utils/url.ts';

// Known tracking and volatile Google Search query parameters to ignore
export const GOOGLE_TRACKING_PARAMS = new Set([
  'gs_ssp',
  'oq',
  'client',
  'sourceid',
  'gs_lcrp',
  'gs_l',
  'sclient',
  'source',
  'ved',
  'ei',
  'sca_esv',
  'sxsrf',
  'bih',
  'biw',
  'dpr',
  'sa',
  'ie',
  'oe',
  'uact',
  'bav',
  'bvm',
  'pws',
  'tbm',
  'hl',
  'gl',
  'safe',
  'tbs'
]);

export interface QueryExtractionResult {
  rawQuery: string;
  extractedQuery: string;
  normalizedQuery: string;
  encodedQuery: string;
  nexvoraRelativeUrl: string;
  nexvoraAbsoluteUrl: string;
  strippedParams: string[];
  isGoogle: boolean;
}

/**
 * Normalizes query string:
 * - Decodes URL encodings (%20, %2B, etc.)
 * - Converts '+' to spaces
 * - Strips non-printable characters
 * - Collapses multiple spaces into a single space
 * - Trims edges
 */
export function normalizeQueryString(raw: string): string {
  if (!raw) return '';

  // Replace + with space before URL decoding
  let decoded = raw.replace(/\+/g, ' ');
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // If malformed URI sequence, keep raw
  }

  // Remove control chars, normalize whitespace to single space, trim
  return decoded
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts and cleans the search query from a Google Search URL or generic search URL.
 */
export function extractSearchQuery(rawUrl: string): QueryExtractionResult | null {
  const parsed = parseUrlSafely(rawUrl);
  if (!parsed) return null;

  const isGoogle = isGoogleSearchUrl(parsed);
  const searchParams = parsed.searchParams;

  // Detect which tracking parameters are present in this URL
  const strippedParams: string[] = [];
  for (const key of searchParams.keys()) {
    const keyLower = key.toLowerCase();
    if (GOOGLE_TRACKING_PARAMS.has(keyLower) || keyLower.startsWith('utm_')) {
      strippedParams.push(key);
    }
  }

  // Extract 'q' parameter specifically (Google's primary query param)
  let rawQuery = searchParams.get('q');
  
  // Fallback if 'q' isn't used (e.g. 'as_q' or 'query')
  if (!rawQuery) {
    rawQuery = searchParams.get('as_q') || searchParams.get('query') || '';
  }

  if (!rawQuery) {
    return null;
  }

  const cleanedQuery = normalizeQueryString(rawQuery);
  if (!cleanedQuery) {
    return null;
  }

  // Form URL encoded query with '+' for spaces (standard query parameter format)
  // e.g. "khan sir" -> "khan+sir"
  const encodedQuery = encodeURIComponent(cleanedQuery).replace(/%20/g, '+');

  // NexVora relative and dynamic deployment absolute URL
  const nexvoraRelativeUrl = `/search?q=${encodedQuery}`;
  const origin = getAppOrigin();
  const nexvoraAbsoluteUrl = origin ? `${origin}${nexvoraRelativeUrl}` : nexvoraRelativeUrl;

  return {
    rawQuery,
    extractedQuery: cleanedQuery,
    normalizedQuery: cleanedQuery.toLowerCase(),
    encodedQuery,
    nexvoraRelativeUrl,
    nexvoraAbsoluteUrl,
    strippedParams,
    isGoogle
  };
}
