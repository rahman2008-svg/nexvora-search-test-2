/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Comprehensive English Stop Words list
export const ENGLISH_STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
  'any', 'are', 'aren\'t', 'as', 'at', 'be', 'because', 'been', 'before', 'being',
  'below', 'between', 'both', 'but', 'by', 'can\'t', 'cannot', 'could', 'couldn\'t',
  'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during',
  'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t',
  'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here',
  'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i',
  'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it',
  'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my',
  'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other',
  'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t',
  'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some',
  'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves',
  'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re',
  'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up',
  'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were',
  'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which',
  'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would',
  'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours',
  'yourself', 'yourselves'
]);

/**
 * Normalize raw text:
 * 1. Unicode NFKD decomposition + diacritic stripping (e.g., "café" -> "cafe")
 * 2. Lowercase conversion
 * 3. Replace non-alphanumeric separators while preserving intra-word hyphens and pluses (e.g. "c++", "react-19", "node.js")
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\w\s\-\+\.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tokenize string into clean search tokens.
 * Handles stop words cleanly: if all tokens are stop words (e.g. "to be or not to be"),
 * preserves them so retrieval doesn't return empty.
 */
export function tokenize(text: string, filterStopWords = true): string[] {
  if (!text) return [];

  const normalized = normalizeText(text);
  if (!normalized) return [];

  // Split on whitespace or punctuation boundary
  const rawTokens = normalized
    .split(/\s+/)
    .map(t => {
      // Strip leading and trailing punctuation (dots, hyphens)
      return t.replace(/^[\.\-\+]+|[\.\-\+]+$/g, '').trim();
    })
    .filter(t => t.length > 0 && !/^[\.\-]+$/.test(t));

  if (!filterStopWords) {
    return rawTokens;
  }

  const filtered = rawTokens.filter(t => !ENGLISH_STOP_WORDS.has(t) && t.length > 1);

  // If every token was filtered out as a stop word, retain the original tokens
  // so queries like "to be or not to be" or "who" still find relevant results
  if (filtered.length === 0 && rawTokens.length > 0) {
    return rawTokens.filter(t => t.length > 0);
  }

  return filtered;
}

/**
 * Extract character n-grams or sub-words for prefix and partial token matching
 */
export function extractSubTokens(text: string): string[] {
  const tokens = tokenize(text, false);
  const subTokens = new Set<string>();

  for (const token of tokens) {
    subTokens.add(token);
    // Split hyphenated or dotted tokens (e.g. "react-19" -> ["react", "19"])
    if (token.includes('-') || token.includes('.')) {
      const parts = token.split(/[\-\.]/).filter(p => p.length > 1);
      parts.forEach(p => subTokens.add(p));
    }
  }

  return Array.from(subTokens);
}

/**
 * Safe HTML highlighting for search query terms
 */
export function highlightTerms(text: string, queryTerms: string[]): string {
  if (!text || !queryTerms || queryTerms.length === 0) return text || '';

  const escapedTerms = queryTerms
    .map(t => t.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .filter(t => t.length > 1);

  if (escapedTerms.length === 0) return text;

  // Word-boundary match preferred, fallback to substring match
  const pattern = `\\b(${escapedTerms.join('|')})\\b|(${escapedTerms.join('|')})`;
  const regex = new RegExp(pattern, 'gi');

  return text.replace(regex, (match) => `<mark class="highlight">${match}</mark>`);
}
