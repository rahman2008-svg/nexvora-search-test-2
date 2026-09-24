/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SearchQuery, SearchResponse, SearchDocument, SuggestionItem, DocumentCategory } from '../types/search.ts';
import { nexvoraEngine } from '../indexing/nexvoraIndex.ts';
import { resolveQuickAnswer } from './quickAnswers.ts';
import { sourceProcessor, SourceProcessingReport, Phase3StructuredManifest } from '../sources/index.ts';
import { PRECOMPILED_CHUNKS, PRECOMPILED_REPORT, PRECOMPILED_FAILED_URLS, PRECOMPILED_CATEGORIES } from '../processor/precompiledData.ts';
import { ProcessingReport, ProcessingChunk, FailedUrlRecord, CategoryIndexChunk } from '../processor/types.ts';

const RECENT_SEARCHES_KEY = 'nexvora_recent_searches';

// Current source report
let currentSourceReport: SourceProcessingReport = sourceProcessor.processAll({});

export class SearchService {
  /**
   * Main search endpoint logic:
   * First tries the backend REST API: GET /api/search?q={query}&page={page}&pageSize={pageSize}&category={category}
   * Falls back smoothly to the in-memory NexVora indexing & ranking engine if network/API is unavailable.
   */
  public static async executeSearch(query: SearchQuery): Promise<SearchResponse> {
    const startTime = performance.now();
    const cleanQuery = (query.q || '').trim();

    if (!cleanQuery) {
      return {
        results: [],
        totalResults: 0,
        page: 1,
        pageSize: query.pageSize || 10,
        totalPages: 0,
        query: '',
        tookMs: 0,
        quickAnswer: null,
        relatedSearches: [],
      };
    }

    // Save to local recent searches if in browser
    this.saveRecentSearch(cleanQuery);

    const pageSize = Math.min(50, Math.max(1, query.pageSize || 10));
    const page = Math.max(1, query.page || 1);
    const category = query.category && query.category !== 'all' ? query.category : undefined;
    const sortBy = query.sortBy || 'relevance';

    let apiResponse: any = null;

    // In browser, attempt to fetch from GET /api/search
    if (typeof window !== 'undefined' && typeof fetch === 'function') {
      try {
        const params = new URLSearchParams({
          q: cleanQuery,
          page: String(page),
          pageSize: String(pageSize),
          sortBy,
        });
        if (category) {
          params.set('category', category);
        }

        const res = await fetch(`/api/search?${params.toString()}`);
        if (res.ok) {
          apiResponse = await res.json();
        }
      } catch (err) {
        // Fallback to local engine
        apiResponse = null;
      }
    }

    // If API response not available, query the in-memory NexVora Search Engine
    if (!apiResponse) {
      apiResponse = nexvoraEngine.search({
        query: cleanQuery,
        page,
        pageSize,
        category,
        sortBy,
      });
    }

    const tookMs = Math.round((performance.now() - startTime) * 100) / 100;

    // Convert results to SearchDocument[] format
    const results: SearchDocument[] = (apiResponse.results || []).map((item: any) => {
      let mappedCat: DocumentCategory = 'web';
      const cLower = String(item.category || '').toLowerCase();
      if (['education', 'programming', 'science', 'news', 'business', 'sports', 'entertainment', 'health', 'travel', 'tech', 'docs', 'tools', 'opensource', 'knowledge'].includes(cLower)) {
        mappedCat = cLower as DocumentCategory;
      }

      return {
        id: item.id,
        title: item.title,
        url: item.url,
        displayUrl: item.displayUrl || `${item.domain || 'web'} › ${mappedCat}`,
        snippet: item.snippet,
        bodyText: item.bodyText || item.snippet,
        category: mappedCat,
        tags: [mappedCat, item.domain].filter(Boolean),
        publishedDate: item.publishedDate,
        authorOrOrg: item.authorOrOrg || item.domain,
        sourceType: item.sourceType || 'web',
        score: item.relevance?.finalScore ?? item.score ?? 1.0,
        relevance: item.relevance,
        highlightedTitle: item.highlightedTitle || item.title,
        highlightedSnippet: item.highlightedSnippet || item.snippet,
      };
    });

    // Resolve instant answer
    const quickAnswer = page === 1 ? resolveQuickAnswer(cleanQuery) : null;

    return {
      results,
      totalResults: apiResponse.totalResults || results.length,
      page: apiResponse.page || page,
      pageSize: apiResponse.pageSize || pageSize,
      totalPages: apiResponse.totalPages || Math.ceil((apiResponse.totalResults || results.length) / pageSize),
      query: cleanQuery,
      tookMs: apiResponse.executionTimeMs || tookMs,
      quickAnswer,
      relatedSearches: apiResponse.relatedSearches || [],
    };
  }

  /**
   * Get search suggestions combining recent searches, trending items, and indexed terms/queries
   */
  public static getSuggestions(prefix: string): SuggestionItem[] {
    const clean = prefix.trim().toLowerCase();
    const suggestions: SuggestionItem[] = [];

    // If query is empty, show recent searches and trending
    if (!clean) {
      const recents = this.getRecentSearches().slice(0, 4);
      for (const r of recents) {
        suggestions.push({
          id: `recent-${r}`,
          text: r,
          type: 'recent',
        });
      }

      const trending = ['javascript mdn', 'react 19 features', 'python tutorial', 'nasa space science'];
      for (const t of trending) {
        if (!recents.includes(t)) {
          suggestions.push({
            id: `trending-${t}`,
            text: t,
            type: 'trending',
          });
        }
      }
      return suggestions.slice(0, 6);
    }

    // 1. Matches from recent searches
    const recents = this.getRecentSearches();
    const matchingRecents = recents.filter(r => r.toLowerCase().startsWith(clean) && r.toLowerCase() !== clean);
    for (const r of matchingRecents) {
      suggestions.push({
        id: `recent-${r}`,
        text: r,
        type: 'recent',
      });
    }

    // 2. Matches from NexVora indexing engine (terms, titles, domains, categories)
    const engineSuggestions = nexvoraEngine.getSuggestions(clean, 6);
    for (const s of engineSuggestions) {
      if (!suggestions.some(existing => existing.text.toLowerCase() === s.text.toLowerCase())) {
        suggestions.push({
          id: s.id,
          text: s.text,
          type: 'query',
          category: s.category as any,
        });
      }
    }

    return suggestions.slice(0, 8);
  }

  public static getRecentSearches(): string[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  public static saveRecentSearch(query: string): void {
    if (typeof window === 'undefined') return;
    const clean = query.trim();
    if (!clean || clean.length < 2) return;

    try {
      const list = this.getRecentSearches().filter(q => q.toLowerCase() !== clean.toLowerCase());
      list.unshift(clean);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(list.slice(0, 10)));
    } catch {
      // ignore
    }
  }

  public static removeRecentSearch(query: string): void {
    if (typeof window === 'undefined') return;
    try {
      const list = this.getRecentSearches().filter(q => q !== query);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  }

  public static clearRecentSearches(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // ignore
    }
  }

  public static getIndexStats() {
    return {
      ...nexvoraEngine.getStats(),
      sources: currentSourceReport.stats,
    };
  }

  public static getSourceReport(): SourceProcessingReport {
    return currentSourceReport;
  }

  public static getPhase3Manifest(): Phase3StructuredManifest {
    return sourceProcessor.generatePhase3Manifest(currentSourceReport);
  }

  public static reprocessSources(customData?: {
    searchUrls?: string[];
    websites?: string[];
    sitemaps?: string[];
  }): SourceProcessingReport {
    currentSourceReport = sourceProcessor.processAll(customData || {});
    return currentSourceReport;
  }

  public static getContentProcessingReport(): ProcessingReport {
    return PRECOMPILED_REPORT;
  }

  public static getContentChunks(): ProcessingChunk[] {
    return PRECOMPILED_CHUNKS;
  }

  public static getFailedUrls(): FailedUrlRecord[] {
    return PRECOMPILED_FAILED_URLS;
  }

  public static getContentCategories(): Record<string, CategoryIndexChunk> {
    return PRECOMPILED_CATEGORIES;
  }
}
