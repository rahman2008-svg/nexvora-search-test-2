/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IndexedDocument, RelevanceScoreBreakdown, SearchResultItem } from './types.ts';
import { normalizeText, tokenize, highlightTerms } from './tokenizer.ts';

// Category keyword dictionary for category intent detection
const CATEGORY_INTENT_KEYWORDS: Record<string, string[]> = {
  education: ['learn', 'tutorial', 'course', 'math', 'calculus', 'academy', 'lecture', 'school', 'study', 'student'],
  programming: ['code', 'programming', 'developer', 'javascript', 'python', 'react', 'git', 'rust', 'api', 'framework', 'syntax', 'function'],
  technology: ['tech', 'software', 'hardware', 'ai', 'computer', 'cloud', 'linux', 'server', 'database', 'network'],
  science: ['science', 'nasa', 'astronomy', 'physics', 'telescope', 'space', 'biology', 'quantum', 'chemistry', 'research'],
  news: ['news', 'report', 'breaking', 'article', 'daily', 'press', 'headline'],
  business: ['business', 'market', 'finance', 'company', 'startup', 'economy', 'invest', 'stock'],
  sports: ['sport', 'football', 'fifa', 'score', 'match', 'cup', 'league', 'team', 'athlete'],
  entertainment: ['movie', 'music', 'game', 'film', 'entertainment', 'show', 'theater', 'video'],
  health: ['health', 'medical', 'medicine', 'doctor', 'disease', 'wellness', 'fitness', 'diet', 'nutrition'],
  travel: ['travel', 'flight', 'hotel', 'destination', 'tour', 'vacation', 'trip', 'visit'],
};

export interface ScoredCandidate {
  doc: IndexedDocument;
  bm25Score: number;
  exactMatchBoost: number;
  titleBoost: number;
  urlBoost: number;
  descriptionBoost: number;
  categoryBoost: number;
  finalScore: number;
  matchedFields: ('title' | 'url' | 'description' | 'headings' | 'body')[];
  matchedTerms: string[];
}

/**
 * Calculates comprehensive relevance signals and final ranking score for a document.
 */
export function computeDocumentRelevance(
  doc: IndexedDocument,
  rawQuery: string,
  queryTokens: string[],
  baseBm25Score: number,
  filterCategory?: string
): ScoredCandidate {
  const normQuery = normalizeText(rawQuery);
  const titleNorm = normalizeText(doc.title);
  const descNorm = normalizeText(doc.description);
  const urlNorm = normalizeText(doc.canonicalUrl.replace(/^https?:\/\//i, ''));
  const domainNorm = normalizeText(doc.domain);
  const bodyNorm = normalizeText(doc.mainText.slice(0, 2000));
  const headingsNorm = normalizeText([
    ...doc.headings.h1,
    ...doc.headings.h2,
    ...doc.headings.h3
  ].join(' '));

  const matchedFields = new Set<'title' | 'url' | 'description' | 'headings' | 'body'>();
  const matchedTermsSet = new Set<string>();

  // Check matched query tokens per field
  for (const token of queryTokens) {
    let matchedInDoc = false;
    if (titleNorm.includes(token)) {
      matchedFields.add('title');
      matchedInDoc = true;
    }
    if (urlNorm.includes(token) || domainNorm.includes(token)) {
      matchedFields.add('url');
      matchedInDoc = true;
    }
    if (descNorm.includes(token)) {
      matchedFields.add('description');
      matchedInDoc = true;
    }
    if (headingsNorm.includes(token)) {
      matchedFields.add('headings');
      matchedInDoc = true;
    }
    if (bodyNorm.includes(token)) {
      matchedFields.add('body');
      matchedInDoc = true;
    }
    if (matchedInDoc) {
      matchedTermsSet.add(token);
    }
  }

  // 1. EXACT QUERY MATCHING
  let exactMatchBoost = 0;
  if (normQuery.length > 2) {
    if (titleNorm.includes(normQuery)) {
      exactMatchBoost += 4.0;
      matchedFields.add('title');
    }
    if (urlNorm.includes(normQuery)) {
      exactMatchBoost += 2.5;
      matchedFields.add('url');
    }
    if (descNorm.includes(normQuery)) {
      exactMatchBoost += 2.0;
      matchedFields.add('description');
    }
    if (bodyNorm.includes(normQuery)) {
      exactMatchBoost += 1.5;
      matchedFields.add('body');
    }
  }

  // 2. TITLE-MATCH BOOST
  let titleBoost = 0;
  if (titleNorm.startsWith(normQuery)) {
    titleBoost += 2.0; // Starts with query
  } else if (titleNorm.includes(normQuery)) {
    titleBoost += 1.5;
  }
  // Check if all tokens appear in title
  const allTokensInTitle = queryTokens.length > 1 && queryTokens.every(t => titleNorm.includes(t));
  if (allTokensInTitle) {
    titleBoost += 1.8;
  }
  // Title field frequency contribution
  let titleTokenCount = 0;
  for (const t of queryTokens) {
    if (titleNorm.includes(t)) titleTokenCount++;
  }
  titleBoost += (titleTokenCount / Math.max(1, queryTokens.length)) * 1.5;

  // 3. URL-MATCH BOOST
  let urlBoost = 0;
  // Domain match (e.g. "react" in "react.dev", "mdn" in "developer.mozilla.org")
  if (domainNorm.includes(normQuery) || queryTokens.some(t => domainNorm.includes(t))) {
    urlBoost += 2.2;
  }
  // Path slug match
  if (urlNorm.includes(normQuery) || queryTokens.some(t => urlNorm.includes(t))) {
    urlBoost += 1.4;
  }

  // 4. DESCRIPTION-MATCH BOOST
  let descriptionBoost = 0;
  if (descNorm.includes(normQuery)) {
    descriptionBoost += 1.8;
  } else {
    let descTokenCount = 0;
    for (const t of queryTokens) {
      if (descNorm.includes(t)) descTokenCount++;
    }
    descriptionBoost += (descTokenCount / Math.max(1, queryTokens.length)) * 1.2;
  }

  // 5. CATEGORY RELEVANCE
  let categoryBoost = 0;
  const docCatLower = doc.category.toLowerCase();

  // If user selected this category filter explicitly
  if (filterCategory && filterCategory.toLowerCase() === docCatLower) {
    categoryBoost += 2.0;
  }

  // If query contains intent keywords matching document's category
  const categoryKeywords = CATEGORY_INTENT_KEYWORDS[docCatLower] || [];
  let categoryKeywordMatches = 0;
  for (const kw of categoryKeywords) {
    if (normQuery.includes(kw) || queryTokens.includes(kw)) {
      categoryKeywordMatches++;
    }
  }
  if (categoryKeywordMatches > 0) {
    categoryBoost += Math.min(2.5, categoryKeywordMatches * 1.2) * (doc.categoryConfidence || 0.8);
  }

  // Check if doc category signals directly match query tokens
  if (doc.categorySignals) {
    for (const sig of doc.categorySignals) {
      const sigClean = sig.toLowerCase();
      if (queryTokens.some(t => sigClean.includes(t))) {
        categoryBoost += 0.8;
        break;
      }
    }
  }

  // 6. FINAL RANKING SCORE CALCULATION
  // Base BM25 provides the foundation.
  // Weighted additional relevance signals act as a multiplier and additive boost.
  const boostMultiplier = 1 + (titleBoost * 0.4) + (urlBoost * 0.3) + (descriptionBoost * 0.25) + (categoryBoost * 0.2);
  const additiveBonus = exactMatchBoost * 1.5;
  const finalScore = Math.max(0.1, (baseBm25Score * boostMultiplier) + additiveBonus);

  return {
    doc,
    bm25Score: Math.round(baseBm25Score * 100) / 100,
    exactMatchBoost: Math.round(exactMatchBoost * 100) / 100,
    titleBoost: Math.round(titleBoost * 100) / 100,
    urlBoost: Math.round(urlBoost * 100) / 100,
    descriptionBoost: Math.round(descriptionBoost * 100) / 100,
    categoryBoost: Math.round(categoryBoost * 100) / 100,
    finalScore: Math.round(finalScore * 100) / 100,
    matchedFields: Array.from(matchedFields),
    matchedTerms: Array.from(matchedTermsSet),
  };
}

/**
 * Filter duplicates:
 * 1. Normalize URLs (remove tracking params, lowercase host, trailing slash).
 * 2. Group by canonical key & normalized title + domain.
 * 3. Keep the single highest ranking document from each duplicate cluster.
 */
export function filterDuplicateResults(candidates: ScoredCandidate[]): ScoredCandidate[] {
  const seenCanonicalUrls = new Set<string>();
  const seenTitleFingerprints = new Set<string>();
  const deduped: ScoredCandidate[] = [];

  for (const candidate of candidates) {
    const doc = candidate.doc;
    
    // Canonical URL key
    const canonicalKey = normalizeUrlKey(doc.canonicalUrl || doc.url);
    if (seenCanonicalUrls.has(canonicalKey)) {
      continue;
    }

    // Title + Domain fingerprint
    const titleClean = normalizeText(doc.title).replace(/[\s\-_|].*$/, ''); // first primary phrase
    const titleFingerprint = `${doc.domain}::${titleClean}`;
    if (titleClean.length > 6 && seenTitleFingerprints.has(titleFingerprint)) {
      continue;
    }

    seenCanonicalUrls.add(canonicalKey);
    seenTitleFingerprints.add(titleFingerprint);
    deduped.push(candidate);
  }

  return deduped;
}

function normalizeUrlKey(urlStr: string): string {
  try {
    const url = new URL(urlStr);
    return `${url.hostname.toLowerCase()}${url.pathname.replace(/\/+$/, '').toLowerCase()}`;
  } catch {
    return urlStr.replace(/^https?:\/\//i, '').replace(/\/+$/, '').toLowerCase();
  }
}

/**
 * Extract relevant snippet with matching terms and context window
 */
export function extractRelevantSnippet(
  doc: IndexedDocument,
  queryTokens: string[]
): string {
  const primaryDesc = (doc.description || '').trim();
  const body = (doc.mainText || '').trim();
  
  if (!body) return primaryDesc.slice(0, 240);

  const sentences = body.split(/(?<=[.!?])\s+/);
  if (sentences.length <= 1) {
    return (primaryDesc || body).slice(0, 240);
  }

  let bestIdx = 0;
  let maxScore = -1;

  sentences.forEach((sentence, idx) => {
    const sNorm = normalizeText(sentence);
    let matchScore = 0;
    for (const token of queryTokens) {
      if (sNorm.includes(token)) {
        matchScore += 2;
      }
    }
    if (matchScore > maxScore) {
      maxScore = matchScore;
      bestIdx = idx;
    }
  });

  // If description has good match or sentence score is 0, prefer description
  if (maxScore <= 0 && primaryDesc) {
    return primaryDesc.length > 240 ? primaryDesc.slice(0, 237) + '...' : primaryDesc;
  }

  const selected = [sentences[bestIdx]];
  if (selected[0].length < 130 && bestIdx + 1 < sentences.length) {
    selected.push(sentences[bestIdx + 1]);
  }

  const combined = selected.join(' ');
  return combined.length > 260 ? combined.slice(0, 257) + '...' : combined;
}
