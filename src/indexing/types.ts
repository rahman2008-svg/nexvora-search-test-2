/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface IndexedDocument {
  id: string;
  url: string;
  canonicalUrl: string;
  domain: string;
  title: string;
  description: string;
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  mainText: string;
  language: string;
  category: string;
  categoryConfidence: number;
  categorySignals: string[];
  wordCount: number;
  contentLengthBytes?: number;
  statusCode?: number;
  fetchTimeMs?: number;
  processedAt: string;
  chunkId: string;
}

export interface DocumentPosting {
  docId: string;
  tf: number; // total raw frequency in document
  fieldFrequencies: {
    title: number;
    url: number;
    description: number;
    headings: number;
    body: number;
  };
  weightedTf: number;
  positions?: number[];
}

export interface TermPostingRecord {
  term: string;
  docFrequency: number; // DF(t)
  idf: number; // IDF(t)
  postings: Record<string, DocumentPosting>; // docId -> posting
}

export interface RelevanceScoreBreakdown {
  finalScore: number;
  bm25Score: number;
  exactMatchBoost: number;
  titleBoost: number;
  urlBoost: number;
  descriptionBoost: number;
  categoryBoost: number;
  matchedFields: ('title' | 'url' | 'description' | 'headings' | 'body')[];
  matchedTerms: string[];
}

export interface SearchResultItem {
  id: string;
  title: string;
  url: string;
  displayUrl: string;
  snippet: string;
  category: string;
  relevance: RelevanceScoreBreakdown;
  highlightedTitle: string;
  highlightedSnippet: string;
  matchedTerms: string[];
  domain: string;
  publishedDate?: string;
  authorOrOrg?: string;
  sourceType?: string;
  wordCount?: number;
}

export interface SerializedIndex {
  version: string;
  createdAt: string;
  totalDocuments: number;
  avgDocLength: number;
  totalTerms: number;
  lexicon: string[];
  documents: Record<string, IndexedDocument>;
  docLengths: Record<string, number>;
  invertedIndex: Record<string, {
    df: number;
    idf: number;
    postings: Record<string, DocumentPosting>;
  }>;
}

export interface SearchEngineOptions {
  k1?: number; // BM25 term frequency saturation (default 1.4)
  b?: number;  // BM25 document length normalization (default 0.75)
  titleWeight?: number;       // default 3.5
  urlWeight?: number;         // default 2.5
  descriptionWeight?: number; // default 2.0
  headingsWeight?: number;    // default 2.0
  bodyWeight?: number;        // default 1.0
  exactMatchMultiplier?: number;
}

export interface QuerySearchParams {
  query: string;
  category?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'relevance' | 'date';
  timeFilter?: string;
}

export interface SearchEngineResponse {
  query: string;
  page: number;
  pageSize: number;
  totalResults: number;
  totalPages: number;
  executionTimeMs: number;
  results: SearchResultItem[];
  quickAnswer?: any | null;
  relatedSearches: string[];
}

export interface EngineSuggestion {
  id: string;
  text: string;
  type: 'query' | 'title' | 'domain' | 'category' | 'recent' | 'trending';
  category?: string;
  score?: number;
}
