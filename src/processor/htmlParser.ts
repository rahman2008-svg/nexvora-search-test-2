/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExtractedHeadings } from './types.ts';

export const MAX_CONTENT_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB size limit

export interface ParsedHtmlResult {
  title: string;
  description: string;
  canonicalUrl: string | null;
  language: string;
  headings: ExtractedHeadings;
  mainText: string;
  contentLengthBytes: number;
  wordCount: number;
  isSizeCapped: boolean;
}

/**
 * Decodes standard HTML entities into text.
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x2F;/g, '/')
    .replace(/&#(\d+);/g, (_, dec) => {
      try {
        return String.fromCharCode(parseInt(dec, 10));
      } catch {
        return '';
      }
    });
}

/**
 * Strips HTML tags and normalizes whitespace safely.
 */
export function stripHtmlTags(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Safely parses HTML and extracts page metadata, headings, and clean readable text.
 */
export function parseHtmlSafely(rawHtml: string, pageUrl: string): ParsedHtmlResult {
  const originalBytes = new TextEncoder().encode(rawHtml).length;
  let html = rawHtml;
  let isSizeCapped = false;

  // Enforce content-size limits
  if (originalBytes > MAX_CONTENT_SIZE_BYTES) {
    isSizeCapped = true;
    html = html.slice(0, MAX_CONTENT_SIZE_BYTES);
  }

  // 1. Remove dangerous or non-content blocks (scripts, styles, svgs, iframes, comments)
  html = html
    .replace(/<!--[\s\S]*?-->/gi, ' ')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, ' ');

  // 2. Extract Title
  let title = '';
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    title = decodeHtmlEntities(stripHtmlTags(titleMatch[1]));
  }
  if (!title) {
    // Fallback to og:title
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:title["']/i);
    if (ogTitleMatch && ogTitleMatch[1]) {
      title = decodeHtmlEntities(ogTitleMatch[1].trim());
    }
  }

  // 3. Extract Meta Description
  let description = '';
  const metaDescMatch = 
    html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i) ||
    html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i) ||
    html.match(/<meta[^>]*name=["']twitter:description["'][^>]*content=["']([^"']*)["']/i);
  if (metaDescMatch && metaDescMatch[1]) {
    description = decodeHtmlEntities(metaDescMatch[1].trim());
  }

  // 4. Extract Canonical URL
  let canonicalUrl: string | null = null;
  const canonicalMatch = 
    html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i) ||
    html.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["']canonical["']/i);
  if (canonicalMatch && canonicalMatch[1]) {
    try {
      const parsed = new URL(canonicalMatch[1].trim(), pageUrl);
      canonicalUrl = parsed.toString();
    } catch {
      canonicalUrl = canonicalMatch[1].trim();
    }
  }

  // 5. Extract Language
  let language = 'en';
  const htmlLangMatch = html.match(/<html[^>]*lang=["']([^"']*)["']/i);
  if (htmlLangMatch && htmlLangMatch[1]) {
    language = htmlLangMatch[1].trim().toLowerCase().split('-')[0];
  } else {
    const metaLangMatch = html.match(/<meta[^>]*http-equiv=["']content-language["'][^>]*content=["']([^"']*)["']/i);
    if (metaLangMatch && metaLangMatch[1]) {
      language = metaLangMatch[1].trim().toLowerCase().split('-')[0];
    }
  }

  // 6. Extract Headings (h1, h2, h3)
  const headings: ExtractedHeadings = {
    h1: [],
    h2: [],
    h3: [],
  };

  const h1Matches = html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi);
  for (const m of h1Matches) {
    const clean = decodeHtmlEntities(stripHtmlTags(m[1]));
    if (clean && clean.length > 2 && !headings.h1.includes(clean)) {
      headings.h1.push(clean);
    }
  }

  const h2Matches = html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi);
  for (const m of h2Matches) {
    const clean = decodeHtmlEntities(stripHtmlTags(m[1]));
    if (clean && clean.length > 2 && !headings.h2.includes(clean)) {
      headings.h2.push(clean);
    }
  }

  const h3Matches = html.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi);
  for (const m of h3Matches) {
    const clean = decodeHtmlEntities(stripHtmlTags(m[1]));
    if (clean && clean.length > 2 && !headings.h3.includes(clean)) {
      headings.h3.push(clean);
    }
  }

  // 7. Extract Main Readable Text
  // Prioritize <main>, <article>, or content container if available
  let contentHtml = html;
  const mainBlockMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
    html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (mainBlockMatch && mainBlockMatch[1]) {
    contentHtml = mainBlockMatch[1];
  } else {
    // Strip header and footer boilerplate
    contentHtml = contentHtml
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, ' ')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, ' ')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, ' ');
  }

  // Extract paragraphs, list items, and headings
  const textChunks: string[] = [];
  const textMatches = contentHtml.matchAll(/<(?:p|li|h[1-6]|blockquote)[^>]*>([\s\S]*?)<\/(?:p|li|h[1-6]|blockquote)>/gi);
  for (const tm of textMatches) {
    const clean = decodeHtmlEntities(stripHtmlTags(tm[1]));
    if (clean.length > 20) {
      textChunks.push(clean);
    }
  }

  let mainText = textChunks.join('\n\n');
  if (!mainText || mainText.length < 50) {
    // Fallback to strip entire body
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    mainText = decodeHtmlEntities(stripHtmlTags(bodyMatch ? bodyMatch[1] : html));
  }

  // Cap readable text to reasonable length for indexing (max ~15,000 characters)
  if (mainText.length > 15000) {
    mainText = mainText.slice(0, 15000) + '...';
  }

  const words = mainText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  return {
    title: title || headings.h1[0] || 'Untitled Document',
    description: description || (mainText.slice(0, 200) + '...'),
    canonicalUrl,
    language,
    headings,
    mainText,
    contentLengthBytes: originalBytes,
    wordCount,
    isSizeCapped,
  };
}
