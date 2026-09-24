/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SearchDocument, DocumentCategory, TimeFilter, SortOrder } from '../types/search.ts';
import { tokenize, highlightTerms } from './tokenizer.ts';

export interface BM25Config {
  k1?: number; // Term frequency saturation (default: 1.5)
  b?: number;  // Document length normalization (default: 0.75)
  titleWeight?: number;
  urlWeight?: number;
  tagsWeight?: number;
  bodyWeight?: number;
}

export interface SearchOptions {
  category?: DocumentCategory;
  timeFilter?: TimeFilter;
  sortBy?: SortOrder;
  page?: number;
  pageSize?: number;
}

/**
 * Standard Okapi BM25 ranking algorithm with field boosting and passage snippet extraction.
 * Extensible for multi-source ingestion (web, GitHub, docs, research).
 */
export class BM25Index {
  private k1: number;
  private b: number;
  private titleWeight: number;
  private urlWeight: number;
  private tagsWeight: number;
  private bodyWeight: number;

  private documents: Map<string, SearchDocument> = new Map();
  // term -> Map<docId, frequency>
  private invertedIndex: Map<string, Map<string, number>> = new Map();
  // term -> document frequency (count of docs containing term)
  private docFrequency: Map<string, number> = new Map();
  // docId -> token length
  private docLengths: Map<string, number> = new Map();
  private totalDocLength = 0;
  private avgDocLength = 0;

  constructor(config: BM25Config = {}) {
    this.k1 = config.k1 ?? 1.5;
    this.b = config.b ?? 0.75;
    this.titleWeight = config.titleWeight ?? 3.5;
    this.urlWeight = config.urlWeight ?? 2.0;
    this.tagsWeight = config.tagsWeight ?? 2.2;
    this.bodyWeight = config.bodyWeight ?? 1.0;
  }

  /**
   * Add a single document to the index
   */
  public addDocument(doc: SearchDocument): void {
    if (this.documents.has(doc.id)) {
      this.removeDocument(doc.id);
    }

    this.documents.set(doc.id, doc);

    const titleTokens = tokenize(doc.title, true);
    const urlTokens = tokenize(doc.url.replace(/https?:\/\//, ''), true);
    const tagsTokens = tokenize(doc.tags.join(' '), true);
    const bodyTokens = tokenize(doc.bodyText || doc.snippet, true);

    const docTermFreqs = new Map<string, number>();

    // Weight terms by field
    const addWeightedTokens = (tokens: string[], weight: number) => {
      for (const token of tokens) {
        const current = docTermFreqs.get(token) || 0;
        docTermFreqs.set(token, current + weight);
      }
    };

    addWeightedTokens(titleTokens, this.titleWeight);
    addWeightedTokens(urlTokens, this.urlWeight);
    addWeightedTokens(tagsTokens, this.tagsWeight);
    addWeightedTokens(bodyTokens, this.bodyWeight);

    const docLength = titleTokens.length + urlTokens.length + tagsTokens.length + bodyTokens.length;
    this.docLengths.set(doc.id, docLength);
    this.totalDocLength += docLength;

    for (const [term, freq] of docTermFreqs.entries()) {
      if (!this.invertedIndex.has(term)) {
        this.invertedIndex.set(term, new Map());
      }
      this.invertedIndex.get(term)!.set(doc.id, freq);

      const currentDf = this.docFrequency.get(term) || 0;
      this.docFrequency.set(term, currentDf + 1);
    }

    this.updateAvgDocLength();
  }

  /**
   * Bulk add documents
   */
  public addDocuments(docs: SearchDocument[]): void {
    for (const doc of docs) {
      this.addDocument(doc);
    }
  }

  /**
   * Remove a document from the index
   */
  public removeDocument(docId: string): void {
    if (!this.documents.has(docId)) return;

    const oldLength = this.docLengths.get(docId) || 0;
    this.totalDocLength -= oldLength;
    this.docLengths.delete(docId);
    this.documents.delete(docId);

    for (const [term, postingList] of this.invertedIndex.entries()) {
      if (postingList.has(docId)) {
        postingList.delete(docId);
        const currentDf = this.docFrequency.get(term) || 1;
        if (currentDf <= 1) {
          this.docFrequency.delete(term);
          this.invertedIndex.delete(term);
        } else {
          this.docFrequency.set(term, currentDf - 1);
        }
      }
    }

    this.updateAvgDocLength();
  }

  private updateAvgDocLength(): void {
    const n = this.documents.size;
    this.avgDocLength = n > 0 ? this.totalDocLength / n : 0;
  }

  /**
   * Calculate Inverse Document Frequency (IDF) with Okapi smoothing
   */
  private computeIDF(term: string): number {
    const N = this.documents.size;
    const n = this.docFrequency.get(term) || 0;
    // Smoothed BM25 IDF
    return Math.max(0.1, Math.log((N - n + 0.5) / (n + 0.5) + 1));
  }

  /**
   * Search the index using BM25 ranking
   */
  public search(rawQuery: string, options: SearchOptions = {}): {
    results: SearchDocument[];
    total: number;
    queryTerms: string[];
  } {
    const trimmedQuery = rawQuery.trim();
    if (!trimmedQuery) {
      return { results: [], total: 0, queryTerms: [] };
    }

    const queryTokens = tokenize(trimmedQuery, true);
    if (queryTokens.length === 0) {
      return { results: [], total: 0, queryTerms: [] };
    }

    const scores = new Map<string, number>();
    const queryLower = trimmedQuery.toLowerCase();

    // 1. Calculate BM25 score for each document containing any query token
    for (const token of queryTokens) {
      const postingList = this.invertedIndex.get(token);
      const idf = this.computeIDF(token);

      if (postingList) {
        for (const [docId, tf] of postingList.entries()) {
          const docLength = this.docLengths.get(docId) || this.avgDocLength;
          // BM25 term score formula:
          // IDF * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (docLen / avgdl)))
          const numerator = tf * (this.k1 + 1);
          const denominator = tf + this.k1 * (1 - this.b + this.b * (docLength / (this.avgDocLength || 1)));
          const termScore = idf * (numerator / denominator);

          scores.set(docId, (scores.get(docId) || 0) + termScore);
        }
      }

      // Check prefix/substring matches for partial query typing
      for (const [indexedTerm, termPostings] of this.invertedIndex.entries()) {
        if (indexedTerm !== token && indexedTerm.startsWith(token) && token.length >= 3) {
          const prefixIdf = this.computeIDF(indexedTerm) * 0.45;
          for (const [docId, tf] of termPostings.entries()) {
            const docLength = this.docLengths.get(docId) || this.avgDocLength;
            const termScore = prefixIdf * (tf / (tf + this.k1 * (1 - this.b + this.b * (docLength / (this.avgDocLength || 1)))));
            scores.set(docId, (scores.get(docId) || 0) + termScore);
          }
        }
      }
    }

    // 2. Extra relevance boosts (exact phrase match, title match, tag match)
    for (const [docId, currentScore] of scores.entries()) {
      const doc = this.documents.get(docId);
      if (!doc) continue;

      let boost = 1.0;
      const titleLower = doc.title.toLowerCase();
      const snippetLower = doc.snippet.toLowerCase();
      const bodyLower = (doc.bodyText || '').toLowerCase();

      // Exact phrase match in title: strong boost
      if (titleLower.includes(queryLower)) {
        boost += 2.5;
      }
      // Exact phrase in snippet or body
      if (snippetLower.includes(queryLower) || bodyLower.includes(queryLower)) {
        boost += 1.2;
      }
      // Exact tag match
      if (doc.tags.some(t => t.toLowerCase() === queryLower)) {
        boost += 1.8;
      }

      // Multiply boost
      scores.set(docId, currentScore * boost);
    }

    // 3. Filter by category, time, etc.
    let matchedDocIds = Array.from(scores.keys()).filter(docId => {
      const doc = this.documents.get(docId);
      if (!doc) return false;

      // Category filter
      if (options.category && options.category !== 'all') {
        if (doc.category !== options.category) {
          return false;
        }
      }

      return true;
    });

    // 4. Sort results
    if (options.sortBy === 'date') {
      matchedDocIds.sort((a, b) => {
        const docA = this.documents.get(a)!;
        const docB = this.documents.get(b)!;
        const dateA = docA.publishedDate ? new Date(docA.publishedDate).getTime() : 0;
        const dateB = docB.publishedDate ? new Date(docB.publishedDate).getTime() : 0;
        return dateB - dateA;
      });
    } else {
      // Relevance (BM25 score descending)
      matchedDocIds.sort((a, b) => (scores.get(b) || 0) - (scores.get(a) || 0));
    }

    const total = matchedDocIds.length;

    // 5. Pagination
    const page = Math.max(1, options.page || 1);
    const pageSize = options.pageSize || 10;
    const startIndex = (page - 1) * pageSize;
    const paginatedIds = matchedDocIds.slice(startIndex, startIndex + pageSize);

    // 6. Enrich with snippets and highlights
    const results: SearchDocument[] = paginatedIds.map(id => {
      const doc = this.documents.get(id)!;
      const score = scores.get(id) || 0;
      
      const snippet = this.extractRelevantPassage(doc, queryTokens);
      const highlightedSnippet = highlightTerms(snippet, queryTokens);
      const highlightedTitle = highlightTerms(doc.title, queryTokens);

      return {
        ...doc,
        snippet,
        score,
        highlightedSnippet,
        highlightedTitle,
      };
    });

    return {
      results,
      total,
      queryTerms: queryTokens,
    };
  }

  /**
   * Find the most relevant text passage for snippet display
   */
  private extractRelevantPassage(doc: SearchDocument, queryTokens: string[]): string {
    const fullText = (doc.snippet + ' ' + (doc.bodyText || '')).trim();
    if (!fullText) return doc.snippet;

    // Split into sentences
    const sentences = fullText.split(/(?<=[.!?])\s+/);
    if (sentences.length <= 1) return fullText.slice(0, 240);

    let bestSentenceIdx = 0;
    let maxMatches = -1;

    sentences.forEach((sentence, idx) => {
      const sLower = sentence.toLowerCase();
      let matchCount = 0;
      for (const token of queryTokens) {
        if (sLower.includes(token.toLowerCase())) {
          matchCount++;
        }
      }
      if (matchCount > maxMatches) {
        maxMatches = matchCount;
        bestSentenceIdx = idx;
      }
    });

    // Combine adjacent sentences if short
    const selectedSentences = [sentences[bestSentenceIdx]];
    if (selectedSentences[0].length < 140 && bestSentenceIdx + 1 < sentences.length) {
      selectedSentences.push(sentences[bestSentenceIdx + 1]);
    }
    const combined = selectedSentences.join(' ');
    return combined.length > 280 ? combined.slice(0, 277) + '...' : combined;
  }

  /**
   * Get search suggestions based on prefix match in index
   */
  public getSuggestions(prefix: string, limit = 6): string[] {
    const clean = prefix.trim().toLowerCase();
    if (!clean || clean.length < 1) return [];

    const candidates = new Set<string>();

    // 1. Check title matches
    for (const doc of this.documents.values()) {
      const titleLower = doc.title.toLowerCase();
      if (titleLower.startsWith(clean)) {
        candidates.add(doc.title);
      }
      // Check tags
      for (const tag of doc.tags) {
        if (tag.toLowerCase().startsWith(clean)) {
          candidates.add(tag);
        }
      }
      if (candidates.size >= limit) break;
    }

    // 2. Check indexed terms
    if (candidates.size < limit) {
      for (const term of this.invertedIndex.keys()) {
        if (term.startsWith(clean) && term.length > clean.length) {
          candidates.add(term);
          if (candidates.size >= limit) break;
        }
      }
    }

    return Array.from(candidates).slice(0, limit);
  }

  public getStats() {
    return {
      totalDocuments: this.documents.size,
      totalTerms: this.invertedIndex.size,
      avgDocLength: Math.round(this.avgDocLength),
    };
  }
}
