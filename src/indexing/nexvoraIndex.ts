/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  IndexedDocument,
  DocumentPosting,
  TermPostingRecord,
  SearchEngineOptions,
  QuerySearchParams,
  SearchEngineResponse,
  SearchResultItem,
  SerializedIndex,
} from './types.ts';
import { normalizeText, tokenize, highlightTerms } from './tokenizer.ts';
import {
  computeDocumentRelevance,
  filterDuplicateResults,
  extractRelevantSnippet,
  ScoredCandidate,
} from './rankingEngine.ts';
import { SuggestionsEngine } from './suggestions.ts';
import { loadProcessedDocuments } from './loader.ts';

/**
 * NexVora Search Engine: High-performance in-memory BM25 Inverted Index & Ranking Engine.
 * Operates independently from any frontend UI or external database.
 */
export class NexVoraSearchEngine {
  private k1: number;
  private b: number;
  private titleWeight: number;
  private urlWeight: number;
  private descriptionWeight: number;
  private headingsWeight: number;
  private bodyWeight: number;

  // Document catalog: docId -> document
  private documents: Map<string, IndexedDocument> = new Map();

  // Inverted Index: term -> TermPostingRecord
  private invertedIndex: Map<string, TermPostingRecord> = new Map();

  // Document length tracking
  private docLengths: Map<string, number> = new Map();
  private totalDocLength = 0;
  private avgDocLength = 0;

  // Query suggestions subsystem
  private suggestionsEngine: SuggestionsEngine = new SuggestionsEngine();

  constructor(options: SearchEngineOptions = {}) {
    this.k1 = options.k1 ?? 1.4;
    this.b = options.b ?? 0.75;
    this.titleWeight = options.titleWeight ?? 3.5;
    this.urlWeight = options.urlWeight ?? 2.5;
    this.descriptionWeight = options.descriptionWeight ?? 2.0;
    this.headingsWeight = options.headingsWeight ?? 2.0;
    this.bodyWeight = options.bodyWeight ?? 1.0;
  }

  /**
   * Initializes the engine by loading processed documents from generated/documents/
   */
  public initializeFromStorage(): { documentsLoaded: number; termsIndexed: number } {
    const docs = loadProcessedDocuments();
    this.buildIndex(docs);
    return {
      documentsLoaded: this.documents.size,
      termsIndexed: this.invertedIndex.size,
    };
  }

  /**
   * Builds the inverted index from a collection of documents
   */
  public buildIndex(docs: IndexedDocument[]): void {
    this.clear();

    for (const doc of docs) {
      this.indexDocument(doc);
    }

    // Recompute IDF values for all terms with Okapi smoothing
    this.recomputeAllIDFs();

    // Rebuild suggestions
    this.suggestionsEngine.build(Array.from(this.documents.values()), this.invertedIndex);
  }

  /**
   * Add and index an individual document
   */
  public indexDocument(doc: IndexedDocument): void {
    if (this.documents.has(doc.id)) {
      this.removeDocument(doc.id);
    }

    this.documents.set(doc.id, doc);

    // 1. Tokenize each field separately with normalization & stop-word handling
    const titleTokens = tokenize(doc.title, true);
    const urlTokens = tokenize(doc.canonicalUrl.replace(/^https?:\/\//i, ''), true);
    const descTokens = tokenize(doc.description, true);
    const headingsTokens = tokenize([
      ...doc.headings.h1,
      ...doc.headings.h2,
      ...doc.headings.h3,
    ].join(' '), true);
    const bodyTokens = tokenize(doc.mainText, true);

    const docLength = titleTokens.length + urlTokens.length + descTokens.length + headingsTokens.length + bodyTokens.length;
    this.docLengths.set(doc.id, docLength);
    this.totalDocLength += docLength;
    this.avgDocLength = this.documents.size > 0 ? this.totalDocLength / this.documents.size : 0;

    // 2. Count Term Frequencies (TF) per field
    const fieldTfs: Record<string, {
      title: number;
      url: number;
      description: number;
      headings: number;
      body: number;
    }> = {};

    const registerTokens = (tokens: string[], field: 'title' | 'url' | 'description' | 'headings' | 'body') => {
      for (const token of tokens) {
        if (!fieldTfs[token]) {
          fieldTfs[token] = { title: 0, url: 0, description: 0, headings: 0, body: 0 };
        }
        fieldTfs[token][field]++;
      }
    };

    registerTokens(titleTokens, 'title');
    registerTokens(urlTokens, 'url');
    registerTokens(descTokens, 'description');
    registerTokens(headingsTokens, 'headings');
    registerTokens(bodyTokens, 'body');

    // 3. Register postings in inverted index
    for (const [term, freqObj] of Object.entries(fieldTfs)) {
      const rawTf = freqObj.title + freqObj.url + freqObj.description + freqObj.headings + freqObj.body;
      const weightedTf =
        (freqObj.title * this.titleWeight) +
        (freqObj.url * this.urlWeight) +
        (freqObj.description * this.descriptionWeight) +
        (freqObj.headings * this.headingsWeight) +
        (freqObj.body * this.bodyWeight);

      let record = this.invertedIndex.get(term);
      if (!record) {
        record = {
          term,
          docFrequency: 0,
          idf: 0,
          postings: {},
        };
        this.invertedIndex.set(term, record);
      }

      record.postings[doc.id] = {
        docId: doc.id,
        tf: rawTf,
        fieldFrequencies: freqObj,
        weightedTf,
      };
      record.docFrequency = Object.keys(record.postings).length;
    }
  }

  /**
   * Remove a document from the index
   */
  public removeDocument(docId: string): void {
    if (!this.documents.has(docId)) return;

    const oldLen = this.docLengths.get(docId) || 0;
    this.totalDocLength -= oldLen;
    this.docLengths.delete(docId);
    this.documents.delete(docId);
    this.avgDocLength = this.documents.size > 0 ? this.totalDocLength / this.documents.size : 0;

    for (const [term, record] of this.invertedIndex.entries()) {
      if (record.postings[docId]) {
        delete record.postings[docId];
        record.docFrequency = Object.keys(record.postings).length;
        if (record.docFrequency === 0) {
          this.invertedIndex.delete(term);
        } else {
          record.idf = this.computeIDF(record.docFrequency);
        }
      }
    }
  }

  /**
   * Clear the entire index
   */
  public clear(): void {
    this.documents.clear();
    this.invertedIndex.clear();
    this.docLengths.clear();
    this.totalDocLength = 0;
    this.avgDocLength = 0;
  }

  /**
   * Recomputes IDF for all terms using the standard Okapi BM25 formula:
   * IDF(t) = ln(1 + (N - df + 0.5) / (df + 0.5))
   */
  private recomputeAllIDFs(): void {
    for (const record of this.invertedIndex.values()) {
      record.idf = this.computeIDF(record.docFrequency);
    }
  }

  private computeIDF(df: number): number {
    const N = this.documents.size;
    if (N === 0) return 0;
    // Smoothed BM25 formula, floored at 0.1 to avoid negative scores for frequent terms
    const rawIdf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
    return Math.max(0.1, rawIdf);
  }

  /**
   * Execute search with BM25 relevance scoring and multi-signal ranking.
   * Includes pagination and safe memory limits.
   */
  public search(params: QuerySearchParams): SearchEngineResponse {
    const startTime = performance.now();
    const rawQuery = (params.query || '').trim();

    // Safe limits
    const safePage = Math.max(1, Math.min(1000, Number(params.page) || 1));
    const safePageSize = Math.max(1, Math.min(50, Number(params.pageSize) || 10)); // Maximum 50 items per page

    if (!rawQuery) {
      return {
        query: '',
        page: safePage,
        pageSize: safePageSize,
        totalResults: 0,
        totalPages: 0,
        executionTimeMs: 0,
        results: [],
        relatedSearches: [],
      };
    }

    // Tokenize query with stop-word handling
    const queryTokens = tokenize(rawQuery, true);
    if (queryTokens.length === 0) {
      return {
        query: rawQuery,
        page: safePage,
        pageSize: safePageSize,
        totalResults: 0,
        totalPages: 0,
        executionTimeMs: 0,
        results: [],
        relatedSearches: [],
      };
    }

    // 1. Identify Candidate Documents and Calculate Base BM25 Scores
    // docId -> base BM25 score
    const candidateBm25Scores = new Map<string, number>();

    for (const token of queryTokens) {
      const record = this.invertedIndex.get(token);
      if (record) {
        const idf = record.idf;
        for (const [docId, posting] of Object.entries(record.postings)) {
          const docLen = this.docLengths.get(docId) || this.avgDocLength;
          // Okapi BM25 formula:
          // score = IDF * (weightedTf * (k1 + 1)) / (weightedTf + k1 * (1 - b + b * (docLen / avgDocLen)))
          const numerator = posting.weightedTf * (this.k1 + 1);
          const denominator = posting.weightedTf + this.k1 * (1 - this.b + this.b * (docLen / (this.avgDocLength || 1)));
          const termScore = idf * (numerator / Math.max(0.001, denominator));

          candidateBm25Scores.set(docId, (candidateBm25Scores.get(docId) || 0) + termScore);
        }
      }

      // Check partial/prefix matches in inverted index for prefix typing (min length 3)
      if (token.length >= 3) {
        for (const [idxTerm, idxRecord] of this.invertedIndex.entries()) {
          if (idxTerm !== token && idxTerm.startsWith(token)) {
            const prefixIdf = idxRecord.idf * 0.4;
            for (const [docId, posting] of Object.entries(idxRecord.postings)) {
              const docLen = this.docLengths.get(docId) || this.avgDocLength;
              const numerator = posting.weightedTf * (this.k1 + 1);
              const denominator = posting.weightedTf + this.k1 * (1 - this.b + this.b * (docLen / (this.avgDocLength || 1)));
              const termScore = prefixIdf * (numerator / Math.max(0.001, denominator));
              candidateBm25Scores.set(docId, (candidateBm25Scores.get(docId) || 0) + termScore);
            }
          }
        }
      }
    }

    // Also scan titles/urls directly for exact query substring matches even if rare terms
    const normQuery = normalizeText(rawQuery);
    for (const [docId, doc] of this.documents.entries()) {
      if (!candidateBm25Scores.has(docId)) {
        const tNorm = normalizeText(doc.title);
        const uNorm = normalizeText(doc.canonicalUrl);
        if (tNorm.includes(normQuery) || uNorm.includes(normQuery)) {
          candidateBm25Scores.set(docId, 1.5);
        }
      }
    }

    // 2. Compute Full Relevance Signals & Additional Boosts for Each Candidate
    const scoredCandidates: ScoredCandidate[] = [];

    for (const [docId, baseBm25] of candidateBm25Scores.entries()) {
      const doc = this.documents.get(docId);
      if (!doc) continue;

      // Category filter check if specified
      if (params.category && params.category !== 'all') {
        if (doc.category.toLowerCase() !== params.category.toLowerCase()) {
          continue;
        }
      }

      const scored = computeDocumentRelevance(
        doc,
        rawQuery,
        queryTokens,
        baseBm25,
        params.category
      );
      scoredCandidates.push(scored);
    }

    // 3. Duplicate Result Filtering
    const dedupedCandidates = filterDuplicateResults(scoredCandidates);

    // 4. Sort Candidates
    if (params.sortBy === 'date') {
      dedupedCandidates.sort((a, b) => {
        const dateA = a.doc.processedAt ? new Date(a.doc.processedAt).getTime() : 0;
        const dateB = b.doc.processedAt ? new Date(b.doc.processedAt).getTime() : 0;
        return dateB - dateA;
      });
    } else {
      // Relevance descending by finalScore
      dedupedCandidates.sort((a, b) => b.finalScore - a.finalScore);
    }

    const totalResults = dedupedCandidates.length;
    const totalPages = Math.ceil(totalResults / safePageSize);

    // 5. Safe Pagination: Slice only the requested page into memory
    const startIndex = (safePage - 1) * safePageSize;
    const pageCandidates = dedupedCandidates.slice(startIndex, startIndex + safePageSize);

    // 6. Format Structured Results with snippet extraction and highlighting
    const results: SearchResultItem[] = pageCandidates.map((c) => {
      const snippet = extractRelevantSnippet(c.doc, queryTokens);
      const highlightedSnippet = highlightTerms(snippet, queryTokens);
      const highlightedTitle = highlightTerms(c.doc.title, queryTokens);

      return {
        id: c.doc.id,
        title: c.doc.title,
        url: c.doc.canonicalUrl || c.doc.url,
        displayUrl: `${c.doc.domain} › ${c.doc.category.toLowerCase()}`,
        snippet,
        category: c.doc.category,
        relevance: {
          finalScore: c.finalScore,
          bm25Score: c.bm25Score,
          exactMatchBoost: c.exactMatchBoost,
          titleBoost: c.titleBoost,
          urlBoost: c.urlBoost,
          descriptionBoost: c.descriptionBoost,
          categoryBoost: c.categoryBoost,
          matchedFields: c.matchedFields,
          matchedTerms: c.matchedTerms,
        },
        highlightedTitle,
        highlightedSnippet,
        matchedTerms: c.matchedTerms,
        domain: c.doc.domain,
        publishedDate: c.doc.processedAt ? c.doc.processedAt.split('T')[0] : undefined,
        authorOrOrg: c.doc.domain,
        sourceType: 'web',
        wordCount: c.doc.wordCount,
      };
    });

    const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

    // 7. Generate contextual related searches
    const relatedSearches = this.generateRelatedSearches(rawQuery, results);

    return {
      query: rawQuery,
      page: safePage,
      pageSize: safePageSize,
      totalResults,
      totalPages,
      executionTimeMs,
      results,
      relatedSearches,
    };
  }

  /**
   * Get search suggestions for a prefix
   */
  public getSuggestions(query: string, limit = 6) {
    const safeLimit = Math.max(1, Math.min(10, limit));
    return this.suggestionsEngine.getSuggestions(query, safeLimit);
  }

  /**
   * Generate related searches based on matched document titles and query terms
   */
  private generateRelatedSearches(query: string, results: SearchResultItem[]): string[] {
    const qLower = query.toLowerCase();
    const related = new Set<string>();

    for (const r of results.slice(0, 4)) {
      const words = r.title.replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 3);
      if (words.length > 0) {
        const candidate = `${query} ${words[0].toLowerCase()}`;
        if (candidate !== qLower && candidate.length < 35) {
          related.add(candidate);
        }
      }
      if (r.category && r.category !== 'General') {
        const catQuery = `${query} ${r.category.toLowerCase()}`;
        if (catQuery !== qLower) {
          related.add(catQuery);
        }
      }
    }

    return Array.from(related).slice(0, 4);
  }

  /**
   * Export the index into a serialized JSON structure independent of the frontend
   */
  public exportIndex(): SerializedIndex {
    const docsObj: Record<string, IndexedDocument> = {};
    for (const [id, doc] of this.documents.entries()) {
      docsObj[id] = doc;
    }

    const docLengthsObj: Record<string, number> = {};
    for (const [id, len] of this.docLengths.entries()) {
      docLengthsObj[id] = len;
    }

    const invObj: Record<string, { df: number; idf: number; postings: Record<string, DocumentPosting> }> = {};
    for (const [term, record] of this.invertedIndex.entries()) {
      invObj[term] = {
        df: record.docFrequency,
        idf: record.idf,
        postings: record.postings,
      };
    }

    return {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      totalDocuments: this.documents.size,
      avgDocLength: Math.round(this.avgDocLength),
      totalTerms: this.invertedIndex.size,
      lexicon: Array.from(this.invertedIndex.keys()),
      documents: docsObj,
      docLengths: docLengthsObj,
      invertedIndex: invObj,
    };
  }

  /**
   * Import an exported serialized index
   */
  public importIndex(data: SerializedIndex): void {
    this.clear();
    this.totalDocLength = 0;

    for (const [id, doc] of Object.entries(data.documents)) {
      this.documents.set(id, doc);
      const len = data.docLengths[id] || 0;
      this.docLengths.set(id, len);
      this.totalDocLength += len;
    }

    this.avgDocLength = this.documents.size > 0 ? this.totalDocLength / this.documents.size : 0;

    for (const [term, record] of Object.entries(data.invertedIndex)) {
      this.invertedIndex.set(term, {
        term,
        docFrequency: record.df,
        idf: record.idf,
        postings: record.postings,
      });
    }

    this.suggestionsEngine.build(Array.from(this.documents.values()), this.invertedIndex);
  }

  /**
   * Return index statistics
   */
  public getStats() {
    const categoryCounts: Record<string, number> = {};
    for (const doc of this.documents.values()) {
      categoryCounts[doc.category] = (categoryCounts[doc.category] || 0) + 1;
    }

    return {
      totalDocuments: this.documents.size,
      totalTerms: this.invertedIndex.size,
      avgDocLength: Math.round(this.avgDocLength),
      totalDocLength: this.totalDocLength,
      categories: categoryCounts,
    };
  }
}

// Global Singleton instance for server or in-memory retrieval
export const nexvoraEngine = new NexVoraSearchEngine();
nexvoraEngine.initializeFromStorage();
