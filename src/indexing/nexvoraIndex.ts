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

import {
  normalizeText,
  tokenize,
  highlightTerms,
} from './tokenizer.ts';

import {
  computeDocumentRelevance,
  filterDuplicateResults,
  extractRelevantSnippet,
  ScoredCandidate,
} from './rankingEngine.ts';

import { SuggestionsEngine } from './suggestions.ts';
import { loadProcessedDocuments } from './loader.ts';

/**
 * NexVora Search Engine
 *
 * High-performance in-memory BM25 inverted index and ranking engine.
 *
 * Architecture:
 *   generated/documents/
 *          ↓
 *   loadProcessedDocuments()
 *          ↓
 *   NexVoraSearchEngine
 *          ↓
 *   BM25 inverted index
 *          ↓
 *   relevance ranking
 *
 * No external search engine or AI API is required.
 */
export class NexVoraSearchEngine {
  private k1: number;
  private b: number;

  private titleWeight: number;
  private urlWeight: number;
  private descriptionWeight: number;
  private headingsWeight: number;
  private bodyWeight: number;

  /**
   * Document catalog:
   * docId -> document
   */
  private documents: Map<string, IndexedDocument> = new Map();

  /**
   * Inverted index:
   * term -> posting record
   */
  private invertedIndex: Map<string, TermPostingRecord> = new Map();

  /**
   * Document length information.
   */
  private docLengths: Map<string, number> = new Map();

  private totalDocLength = 0;
  private avgDocLength = 0;

  /**
   * Query suggestion subsystem.
   */
  private suggestionsEngine = new SuggestionsEngine();

  /**
   * Prevent unnecessary repeated initialization.
   */
  private initialized = false;

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
   * Initialize the search engine from processed documents.
   *
   * This operation is idempotent:
   * repeated calls do not rebuild the index unless force=true.
   */
  public initializeFromStorage(
    force = false
  ): { documentsLoaded: number; termsIndexed: number } {
    if (this.initialized && !force) {
      return {
        documentsLoaded: this.documents.size,
        termsIndexed: this.invertedIndex.size,
      };
    }

    const docs = loadProcessedDocuments();

    this.buildIndex(docs);

    this.initialized = true;

    return {
      documentsLoaded: this.documents.size,
      termsIndexed: this.invertedIndex.size,
    };
  }

  /**
   * Build the complete inverted index.
   */
  public buildIndex(docs: IndexedDocument[]): void {
    this.clear();

    if (!Array.isArray(docs) || docs.length === 0) {
      this.initialized = true;
      return;
    }

    for (const doc of docs) {
      if (!doc || !doc.id) {
        continue;
      }

      this.indexDocument(doc);
    }

    /**
     * Compute IDF only after every document has
     * been inserted into the index.
     */
    this.recomputeAllIDFs();

    /**
     * Rebuild autocomplete/suggestion data.
     */
    this.suggestionsEngine.build(
      Array.from(this.documents.values()),
      this.invertedIndex
    );

    this.initialized = true;
  }

  /**
   * Add and index one document.
   */
  public indexDocument(doc: IndexedDocument): void {
    if (!doc || !doc.id) {
      return;
    }

    if (this.documents.has(doc.id)) {
      this.removeDocument(doc.id);
    }

    this.documents.set(doc.id, doc);

    /**
     * Tokenize each field separately.
     *
     * `true` enables the tokenizer's normalisation/
     * stop-word behaviour.
     */
    const titleTokens = tokenize(doc.title || '', true);

    const urlTokens = tokenize(
      (doc.canonicalUrl || doc.url || '').replace(
        /^https?:\/\//i,
        ''
      ),
      true
    );

    const descriptionTokens = tokenize(
      doc.description || '',
      true
    );

    const headingsTokens = tokenize(
      [
        ...(doc.headings?.h1 || []),
        ...(doc.headings?.h2 || []),
        ...(doc.headings?.h3 || []),
      ].join(' '),
      true
    );

    const bodyTokens = tokenize(
      doc.mainText || '',
      true
    );

    /**
     * Document length.
     *
     * All fields contribute to document length.
     */
    const docLength =
      titleTokens.length +
      urlTokens.length +
      descriptionTokens.length +
      headingsTokens.length +
      bodyTokens.length;

    this.docLengths.set(doc.id, docLength);

    this.totalDocLength += docLength;

    this.avgDocLength =
      this.documents.size > 0
        ? this.totalDocLength / this.documents.size
        : 0;

    /**
     * Term frequencies per field.
     */
    const fieldTfs: Record<
      string,
      {
        title: number;
        url: number;
        description: number;
        headings: number;
        body: number;
      }
    > = {};

    const registerTokens = (
      tokens: string[],
      field:
        | 'title'
        | 'url'
        | 'description'
        | 'headings'
        | 'body'
    ) => {
      for (const token of tokens) {
        if (!token) continue;

        if (!fieldTfs[token]) {
          fieldTfs[token] = {
            title: 0,
            url: 0,
            description: 0,
            headings: 0,
            body: 0,
          };
        }

        fieldTfs[token][field]++;
      }
    };

    registerTokens(titleTokens, 'title');
    registerTokens(urlTokens, 'url');
    registerTokens(descriptionTokens, 'description');
    registerTokens(headingsTokens, 'headings');
    registerTokens(bodyTokens, 'body');

    /**
     * Register every term in the inverted index.
     */
    for (const [term, freqObj] of Object.entries(fieldTfs)) {
      const rawTf =
        freqObj.title +
        freqObj.url +
        freqObj.description +
        freqObj.headings +
        freqObj.body;

      const weightedTf =
        freqObj.title * this.titleWeight +
        freqObj.url * this.urlWeight +
        freqObj.description * this.descriptionWeight +
        freqObj.headings * this.headingsWeight +
        freqObj.body * this.bodyWeight;

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

      const posting: DocumentPosting = {
        docId: doc.id,
        tf: rawTf,
        fieldFrequencies: freqObj,
        weightedTf,
      };

      record.postings[doc.id] = posting;

      record.docFrequency = Object.keys(
        record.postings
      ).length;
    }
  }

  /**
   * Remove a document from the index.
   */
  public removeDocument(docId: string): void {
    if (!this.documents.has(docId)) {
      return;
    }

    const oldLength = this.docLengths.get(docId) || 0;

    this.totalDocLength -= oldLength;

    this.docLengths.delete(docId);
    this.documents.delete(docId);

    this.avgDocLength =
      this.documents.size > 0
        ? this.totalDocLength / this.documents.size
        : 0;

    for (const [term, record] of this.invertedIndex.entries()) {
      if (!record.postings[docId]) {
        continue;
      }

      delete record.postings[docId];

      record.docFrequency = Object.keys(
        record.postings
      ).length;

      if (record.docFrequency === 0) {
        this.invertedIndex.delete(term);
      } else {
        record.idf = this.computeIDF(
          record.docFrequency
        );
      }
    }
  }

  /**
   * Clear the complete in-memory index.
   */
  public clear(): void {
    this.documents.clear();
    this.invertedIndex.clear();
    this.docLengths.clear();

    this.totalDocLength = 0;
    this.avgDocLength = 0;

    this.initialized = false;
  }

  /**
   * Recompute IDF for every term.
   */
  private recomputeAllIDFs(): void {
    for (const record of this.invertedIndex.values()) {
      record.idf = this.computeIDF(
        record.docFrequency
      );
    }
  }

  /**
   * Smoothed Okapi BM25 IDF.
   *
   * IDF(t) =
   * ln(1 + (N - df + 0.5) / (df + 0.5))
   */
  private computeIDF(df: number): number {
    const N = this.documents.size;

    if (N <= 0 || df <= 0) {
      return 0;
    }

    const rawIdf = Math.log(
      1 +
        (N - df + 0.5) /
          (df + 0.5)
    );

    /**
     * Keep very common terms useful instead of
     * allowing their score to collapse to zero.
     */
    return Math.max(0.1, rawIdf);
  }

  /**
   * Calculate BM25 score for one posting.
   */
  private calculateTermScore(
    record: TermPostingRecord,
    posting: DocumentPosting,
    docLength: number
  ): number {
    const avgLength =
      this.avgDocLength || 1;

    const normalizedLength =
      docLength / avgLength;

    const numerator =
      posting.weightedTf *
      (this.k1 + 1);

    const denominator =
      posting.weightedTf +
      this.k1 *
        (
          1 -
          this.b +
          this.b * normalizedLength
        );

    return (
      record.idf *
      (
        numerator /
        Math.max(0.001, denominator)
      )
    );
  }

  /**
   * Execute a search.
   */
  public search(
    params: QuerySearchParams
  ): SearchEngineResponse {
    const startTime = performance.now();

    /**
     * Make sure the engine is initialized.
     *
     * Because initialization is idempotent,
     * this does not rebuild the index on every request.
     */
    if (!this.initialized) {
      this.initializeFromStorage();
    }

    const rawQuery =
      (params.query || '').trim();

    const safePage = Math.max(
      1,
      Math.min(
        1000,
        Number(params.page) || 1
      )
    );

    const safePageSize = Math.max(
      1,
      Math.min(
        50,
        Number(params.pageSize) || 10
      )
    );

    /**
     * Empty query.
     */
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

    /**
     * Tokenize query.
     */
    const queryTokens = tokenize(
      rawQuery,
      true
    );

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

    /**
     * docId -> BM25 score
     */
    const candidateBm25Scores =
      new Map<string, number>();

    /**
     * Exact term matching.
     */
    for (const token of queryTokens) {
      if (!token) continue;

      const record =
        this.invertedIndex.get(token);

      if (record) {
        for (const [
          docId,
          posting,
        ] of Object.entries(
          record.postings
        )) {
          const docLength =
            this.docLengths.get(docId) ??
            this.avgDocLength;

          const termScore =
            this.calculateTermScore(
              record,
              posting,
              docLength
            );

          candidateBm25Scores.set(
            docId,
            (
              candidateBm25Scores.get(docId) ||
              0
            ) + termScore
          );
        }
      }

      /**
       * Prefix matching.
       *
       * Example:
       *   "pyth" -> "python"
       *
       * Prefix matches receive 40% of the
       * normal BM25 term contribution.
       */
      if (token.length >= 3) {
        for (const [
          indexTerm,
          indexRecord,
        ] of this.invertedIndex.entries()) {
          if (
            indexTerm === token ||
            !indexTerm.startsWith(token)
          ) {
            continue;
          }

          for (const [
            docId,
            posting,
          ] of Object.entries(
            indexRecord.postings
          )) {
            const docLength =
              this.docLengths.get(docId) ??
              this.avgDocLength;

            const prefixScore =
              this.calculateTermScore(
                indexRecord,
                posting,
                docLength
              ) * 0.4;

            candidateBm25Scores.set(
              docId,
              (
                candidateBm25Scores.get(docId) ||
                0
              ) + prefixScore
            );
          }
        }
      }
    }

    /**
     * Direct title/URL fallback.
     *
     * This helps exact phrase/sub-string searches
     * even when the tokenizer does not produce the
     * same term.
     */
    const normalizedQuery =
      normalizeText(rawQuery);

    if (normalizedQuery) {
      for (const [
        docId,
        doc,
      ] of this.documents.entries()) {
        if (
          candidateBm25Scores.has(docId)
        ) {
          continue;
        }

        const normalizedTitle =
          normalizeText(
            doc.title || ''
          );

        const normalizedUrl =
          normalizeText(
            doc.canonicalUrl ||
              doc.url ||
              ''
          );

        if (
          normalizedTitle.includes(
            normalizedQuery
          ) ||
          normalizedUrl.includes(
            normalizedQuery
          )
        ) {
          candidateBm25Scores.set(
            docId,
            1.5
          );
        }
      }
    }

    /**
     * Full relevance calculation.
     */
    const scoredCandidates: ScoredCandidate[] =
      [];

    for (const [
      docId,
      baseBm25,
    ] of candidateBm25Scores.entries()) {
      const doc =
        this.documents.get(docId);

      if (!doc) {
        continue;
      }

      /**
       * Category filter.
       */
      if (
        params.category &&
        params.category !== 'all'
      ) {
        if (
          doc.category.toLowerCase() !==
          params.category.toLowerCase()
        ) {
          continue;
        }
      }

      const scored =
        computeDocumentRelevance(
          doc,
          rawQuery,
          queryTokens,
          baseBm25,
          params.category
        );

      scoredCandidates.push(
        scored
      );
    }

    /**
     * Remove duplicate/near-duplicate results.
     */
    const dedupedCandidates =
      filterDuplicateResults(
        scoredCandidates
      );

    /**
     * Sort.
     */
    if (
      params.sortBy === 'date'
    ) {
      dedupedCandidates.sort(
        (a, b) => {
          const dateA =
            a.doc.processedAt
              ? new Date(
                  a.doc.processedAt
                ).getTime()
              : 0;

          const dateB =
            b.doc.processedAt
              ? new Date(
                  b.doc.processedAt
                ).getTime()
              : 0;

          return dateB - dateA;
        }
      );
    } else {
      dedupedCandidates.sort(
        (a, b) =>
          b.finalScore -
          a.finalScore
      );
    }

    const totalResults =
      dedupedCandidates.length;

    const totalPages =
      Math.ceil(
        totalResults /
          safePageSize
      );

    /**
     * Pagination.
     */
    const startIndex =
      (safePage - 1) *
      safePageSize;

    const pageCandidates =
      dedupedCandidates.slice(
        startIndex,
        startIndex +
          safePageSize
      );

    /**
     * Format search results.
     */
    const results: SearchResultItem[] =
      pageCandidates.map(
        (candidate) => {
          const snippet =
            extractRelevantSnippet(
              candidate.doc,
              queryTokens
            );

          const highlightedSnippet =
            highlightTerms(
              snippet,
              queryTokens
            );

          const highlightedTitle =
            highlightTerms(
              candidate.doc.title,
              queryTokens
            );

          return {
            id: candidate.doc.id,

            title:
              candidate.doc.title,

            url:
              candidate.doc.canonicalUrl ||
              candidate.doc.url,

            displayUrl:
              `${candidate.doc.domain} › ${candidate.doc.category.toLowerCase()}`,

            snippet,

            category:
              candidate.doc.category,

            relevance: {
              finalScore:
                candidate.finalScore,

              bm25Score:
                candidate.bm25Score,

              exactMatchBoost:
                candidate.exactMatchBoost,

              titleBoost:
                candidate.titleBoost,

              urlBoost:
                candidate.urlBoost,

              descriptionBoost:
                candidate.descriptionBoost,

              categoryBoost:
                candidate.categoryBoost,

              matchedFields:
                candidate.matchedFields,

              matchedTerms:
                candidate.matchedTerms,
            },

            highlightedTitle,

            highlightedSnippet,

            matchedTerms:
              candidate.matchedTerms,

            domain:
              candidate.doc.domain,

            publishedDate:
              candidate.doc.processedAt
                ? candidate.doc.processedAt.split(
                    'T'
                  )[0]
                : undefined,

            authorOrOrg:
              candidate.doc.domain,

            sourceType: 'web',

            wordCount:
              candidate.doc.wordCount,
          };
        }
      );

    const executionTimeMs =
      Math.round(
        (
          performance.now() -
          startTime
        ) * 100
      ) / 100;

    /**
     * Related searches.
     */
    const relatedSearches =
      this.generateRelatedSearches(
        rawQuery,
        results
      );

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
   * Search suggestions.
   */
  public getSuggestions(
    query: string,
    limit = 6
  ) {
    const safeLimit =
      Math.max(
        1,
        Math.min(10, limit)
      );

    if (!this.initialized) {
      this.initializeFromStorage();
    }

    return this.suggestionsEngine.getSuggestions(
      query,
      safeLimit
    );
  }

  /**
   * Generate related searches.
   */
  private generateRelatedSearches(
    query: string,
    results: SearchResultItem[]
  ): string[] {
    const normalizedQuery =
      query.toLowerCase();

    const related =
      new Set<string>();

    for (const result of results.slice(
      0,
      4
    )) {
      const words =
        result.title
          .replace(
            /[^\w\s]/g,
            ''
          )
          .split(/\s+/)
          .filter(
            (word) =>
              word.length > 3
          );

      if (words.length > 0) {
        const candidate =
          `${query} ${words[0].toLowerCase()}`;

        if (
          candidate !==
            normalizedQuery &&
          candidate.length < 35
        ) {
          related.add(candidate);
        }
      }

      if (
        result.category &&
        result.category !==
          'General'
      ) {
        const categoryQuery =
          `${query} ${result.category.toLowerCase()}`;

        if (
          categoryQuery !==
          normalizedQuery
        ) {
          related.add(
            categoryQuery
          );
        }
      }
    }

    return Array.from(
      related
    ).slice(0, 4);
  }

 

}

export const nexvoraEngine = new NexVoraSearchEngine();
nexvoraEngine.initializeFromStorage();
