/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DocumentCategory = 
  | 'all'
  | 'web'
  | 'tech'
  | 'knowledge'
  | 'news'
  | 'opensource'
  | 'docs'
  | 'tools'
  | 'education'
  | 'programming'
  | 'science'
  | 'business'
  | 'sports'
  | 'entertainment'
  | 'health'
  | 'travel';

export type TimeFilter = 'all' | 'day' | 'week' | 'month' | 'year';

export type SortOrder = 'relevance' | 'date';

export interface DocumentRelevanceInfo {
  finalScore: number;
  bm25Score: number;
  exactMatchBoost: number;
  titleBoost: number;
  urlBoost: number;
  descriptionBoost: number;
  categoryBoost: number;
  matchedFields?: string[];
  matchedTerms?: string[];
}

export interface SearchDocument {
  id: string;
  title: string;
  url: string;
  displayUrl: string;
  snippet: string;
  bodyText: string;
  category: DocumentCategory;
  tags: string[];
  publishedDate?: string;
  authorOrOrg?: string;
  sourceType?: 'web' | 'github' | 'documentation' | 'article' | 'research';
  score?: number;
  relevance?: DocumentRelevanceInfo;
  highlightedSnippet?: string;
  highlightedTitle?: string;
}

export interface QuickAnswer {
  type: 'calculation' | 'definition' | 'code' | 'converter' | 'fact' | 'http_status';
  title: string;
  content: string;
  subtext?: string;
  sourceName?: string;
  sourceUrl?: string;
  badge?: string;
}

export interface SearchQuery {
  q: string;
  category?: DocumentCategory;
  page?: number;
  pageSize?: number;
  timeFilter?: TimeFilter;
  sortBy?: SortOrder;
}

export interface SearchResponse {
  results: SearchDocument[];
  totalResults: number;
  page: number;
  pageSize: number;
  totalPages: number;
  query: string;
  tookMs: number;
  quickAnswer?: QuickAnswer | null;
  relatedSearches: string[];
  correctedQuery?: string;
}

export interface SuggestionItem {
  id: string;
  text: string;
  type: 'query' | 'recent' | 'trending';
  category?: DocumentCategory;
}
