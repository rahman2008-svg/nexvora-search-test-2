/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ProcessedDocument,
  FailedUrlRecord,
  DuplicateUrlRecord,
  ProcessingReport,
  ProcessingChunk,
  CategoryIndexChunk,
  ContentCategory,
  ALL_CONTENT_CATEGORIES,
} from './types.ts';
import { parseHtmlSafely } from './htmlParser.ts';
import { classifyContent } from './categoryClassifier.ts';
import { robotsChecker } from './robotsChecker.ts';
import { domainRateLimiter } from './rateLimiter.ts';
import { SAMPLE_WEBSITE_HTML } from './mockHtmlSources.ts';
import { isValidUrl, extractCleanDomain } from '../sources/urlParser.ts';
import { canonicalizeWebsiteUrl } from '../sources/canonicalizer.ts';
import { DuplicateDetector } from '../sources/duplicateDetector.ts';
import { getAppOrigin } from '../utils/url.ts';
import { SearchDocument } from '../types/search.ts';

export const CHUNK_SIZE = 6; // Manageable chunk size (e.g. 6 documents per chunk file)
export const MAX_RETRIES = 3;
export const TIMEOUT_MS = 6000;

export interface IngestionOptions {
  urls: string[];
  maxConcurrency?: number;
  skipRobotsCheck?: boolean;
}

export class ContentProcessingEngine {
  private duplicateDetector = new DuplicateDetector();
  private failedUrls: FailedUrlRecord[] = [];
  private duplicateUrls: DuplicateUrlRecord[] = [];
  private processedDocuments: ProcessedDocument[] = [];
  private chunks: ProcessingChunk[] = [];
  private categoryIndices = new Map<ContentCategory, CategoryIndexChunk>();
  private latestReport: ProcessingReport | null = null;

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.duplicateDetector.reset();
    this.failedUrls = [];
    this.duplicateUrls = [];
    this.processedDocuments = [];
    this.chunks = [];
    this.categoryIndices.clear();

    for (const cat of ALL_CONTENT_CATEGORIES) {
      this.categoryIndices.set(cat, {
        category: cat,
        documentCount: 0,
        updatedAt: new Date().toISOString(),
        documentIds: [],
        items: [],
      });
    }
  }

  /**
   * Safe fetch simulator & HTTP fetcher with timeout, retry backoff, and size limits.
   */
  private async safeFetch(url: string, retryCount = 0): Promise<{ html: string; statusCode: number; fetchTimeMs: number }> {
    const startTime = Date.now();

    // Check if we have authentic sample HTML fixture for this URL
    // (Strip trailing slashes or query params for fixture matching)
    const cleanLookup = url.replace(/\/+$/, '').split('?')[0];
    if (SAMPLE_WEBSITE_HTML[cleanLookup] || SAMPLE_WEBSITE_HTML[`${cleanLookup}/`]) {
      const html = SAMPLE_WEBSITE_HTML[cleanLookup] || SAMPLE_WEBSITE_HTML[`${cleanLookup}/`];
      // Simulate real-world polite network latency (15-40ms)
      await new Promise((resolve) => setTimeout(resolve, 20 + Math.random() * 20));
      return {
        html,
        statusCode: 200,
        fetchTimeMs: Date.now() - startTime,
      };
    }

    // Otherwise perform real HTTP fetch with AbortController timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'NexVoraBot/1.0 (+https://nexvora.internal/about)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const rawHtml = await response.text();
      return {
        html: rawHtml,
        statusCode: response.status,
        fetchTimeMs: Date.now() - startTime,
      };
    } catch (err: any) {
      // Retry with exponential backoff if retries left
      if (retryCount < MAX_RETRIES - 1) {
        const backoffMs = Math.pow(2, retryCount) * 250;
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        return this.safeFetch(url, retryCount + 1);
      }
      throw err;
    }
  }

  /**
   * Process a single website URL safely
   */
  public async processUrl(rawUrl: string): Promise<ProcessedDocument | null> {
    let cleanLine = rawUrl.trim();
    if (cleanLine.includes(' #')) {
      cleanLine = cleanLine.split(' #')[0].trim();
    }
    if (!cleanLine || cleanLine.startsWith('#')) return null;

    // 1. URL Validation
    if (!isValidUrl(cleanLine)) {
      this.failedUrls.push({
        url: cleanLine,
        domain: 'unknown',
        errorReason: 'Malformed or invalid HTTP/HTTPS URL format',
        failedAt: new Date().toISOString(),
        attemptsMade: 1,
        willRetry: false,
      });
      return null;
    }

    // 2. Canonical URL Generation & Marketing Stripping
    const canonicalRes = canonicalizeWebsiteUrl(cleanLine);
    if (!canonicalRes) {
      this.failedUrls.push({
        url: cleanLine,
        domain: extractCleanDomain(cleanLine),
        errorReason: 'Unable to canonicalize website URL',
        failedAt: new Date().toISOString(),
        attemptsMade: 1,
        willRetry: false,
      });
      return null;
    }

    const canonicalUrl = canonicalRes.canonicalUrl;
    const domain = canonicalRes.domain;

    // 3. Duplicate Detection
    const canonicalKey = `doc:${canonicalUrl}`;
    const dupCheck = this.duplicateDetector.checkAndRegister(canonicalKey, canonicalUrl);
    if (dupCheck.isDuplicate) {
      this.duplicateUrls.push({
        url: cleanLine,
        canonicalUrl,
        domain,
        duplicateOf: dupCheck.duplicateOfId || canonicalUrl,
        reason: 'Duplicate canonical URL resolved from input seed',
        detectedAt: new Date().toISOString(),
      });
      return null;
    }

    // 4. Respect robots.txt
    const robotsCheck = robotsChecker.isUrlAllowed(canonicalUrl);
    if (!robotsCheck.allowed) {
      this.failedUrls.push({
        url: canonicalUrl,
        domain,
        errorReason: robotsCheck.reason || 'Blocked by robots.txt directive',
        failedAt: new Date().toISOString(),
        attemptsMade: 1,
        willRetry: false,
      });
      return null;
    }

    // 5. Polite Rate Limiting per Domain
    await domainRateLimiter.throttle(domain, robotsCheck.crawlDelayMs || 0);

    // 6. Safe Fetch with retry handling
    let fetchResult: { html: string; statusCode: number; fetchTimeMs: number };
    try {
      fetchResult = await this.safeFetch(canonicalUrl);
    } catch (err: any) {
      this.failedUrls.push({
        url: canonicalUrl,
        domain,
        errorReason: err.message || 'Network request timeout or connection refused',
        failedAt: new Date().toISOString(),
        attemptsMade: MAX_RETRIES,
        willRetry: false,
      });
      return null;
    }

    // 7. Safe HTML Parsing & Metadata Extraction
    const parsed = parseHtmlSafely(fetchResult.html, canonicalUrl);

    // 8. Rule-based Category Classifier (No AI API)
    const classification = classifyContent({
      url: canonicalUrl,
      domain,
      title: parsed.title,
      description: parsed.description,
      headings: parsed.headings,
      mainText: parsed.mainText,
    });

    const docId = `doc-${domain.replace(/[^a-z0-9]/gi, '_')}-${Math.random().toString(36).slice(2, 8)}`;
    const currentChunkIndex = Math.floor(this.processedDocuments.length / CHUNK_SIZE) + 1;
    const chunkId = `chunk-${String(currentChunkIndex).padStart(3, '0')}`;

    const doc: ProcessedDocument = {
      id: docId,
      url: cleanLine,
      canonicalUrl: parsed.canonicalUrl || canonicalUrl,
      domain,
      title: parsed.title,
      description: parsed.description,
      headings: parsed.headings,
      mainText: parsed.mainText,
      language: parsed.language,
      category: classification.category,
      categoryConfidence: classification.confidenceScore,
      categorySignals: classification.matchedSignals,
      contentLengthBytes: parsed.contentLengthBytes,
      wordCount: parsed.wordCount,
      statusCode: fetchResult.statusCode,
      fetchTimeMs: fetchResult.fetchTimeMs,
      processedAt: new Date().toISOString(),
      chunkId,
      retryCount: 0,
    };

    this.processedDocuments.push(doc);

    // Update Category Index
    const catIndex = this.categoryIndices.get(classification.category);
    if (catIndex) {
      catIndex.documentCount += 1;
      catIndex.updatedAt = new Date().toISOString();
      catIndex.documentIds.push(docId);
      catIndex.items.push({
        id: docId,
        title: doc.title,
        canonicalUrl: doc.canonicalUrl,
        domain: doc.domain,
        description: doc.description,
        confidence: doc.categoryConfidence,
      });
    }

    return doc;
  }

  /**
   * Process an array of URLs and partition results into manageable chunks.
   */
  public async processBatch(urls: string[]): Promise<ProcessingReport> {
    this.reset();

    for (const u of urls) {
      await this.processUrl(u);
    }

    // Build Chunks
    const chunks: ProcessingChunk[] = [];
    for (let i = 0; i < this.processedDocuments.length; i += CHUNK_SIZE) {
      const slice = this.processedDocuments.slice(i, i + CHUNK_SIZE);
      const chunkNumber = Math.floor(i / CHUNK_SIZE) + 1;
      const chunkId = `chunk-${String(chunkNumber).padStart(3, '0')}`;
      const totalBytes = slice.reduce((sum, d) => sum + d.contentLengthBytes, 0);

      chunks.push({
        chunkId,
        filename: `${chunkId}.json`,
        documentCount: slice.length,
        totalBytes,
        createdAt: new Date().toISOString(),
        documents: slice,
      });
    }
    this.chunks = chunks;

    // Build Category Distribution
    const categoryDistribution: Record<ContentCategory, number> = {
      Education: 0,
      Programming: 0,
      Technology: 0,
      Science: 0,
      News: 0,
      Business: 0,
      Sports: 0,
      Entertainment: 0,
      Health: 0,
      Travel: 0,
      General: 0,
    };

    for (const doc of this.processedDocuments) {
      categoryDistribution[doc.category] = (categoryDistribution[doc.category] || 0) + 1;
    }

    const totalExtractedBytes = this.processedDocuments.reduce((sum, d) => sum + d.contentLengthBytes, 0);
    const avgFetch = this.processedDocuments.length > 0
      ? Math.round(this.processedDocuments.reduce((sum, d) => sum + d.fetchTimeMs, 0) / this.processedDocuments.length)
      : 0;

    const report: ProcessingReport = {
      reportId: `report-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      deploymentOrigin: getAppOrigin(),
      summary: {
        totalUrlsQueued: urls.length,
        successfullyProcessed: this.processedDocuments.length,
        failedUrlsCount: this.failedUrls.length,
        skippedRobotsCount: this.failedUrls.filter((f) => f.errorReason.includes('robots.txt')).length,
        duplicateUrlsIgnored: this.duplicateDetector.size() - this.processedDocuments.length > 0
          ? this.duplicateDetector.size() - this.processedDocuments.length
          : 0,
        totalChunksGenerated: chunks.length,
        totalExtractedBytes,
        averageFetchTimeMs: avgFetch,
      },
      categoryDistribution,
      chunks: chunks.map((c) => ({
        chunkId: c.chunkId,
        path: `generated/documents/${c.filename}`,
        count: c.documentCount,
      })),
      failedUrls: this.failedUrls,
    };

    this.latestReport = report;
    return report;
  }

  public getProcessedDocuments(): ProcessedDocument[] {
    return this.processedDocuments;
  }

  public getChunks(): ProcessingChunk[] {
    return this.chunks;
  }

  public getCategoryIndices(): Map<ContentCategory, CategoryIndexChunk> {
    return this.categoryIndices;
  }

  public getFailedUrls(): FailedUrlRecord[] {
    return this.failedUrls;
  }

  public getDuplicateUrls(): DuplicateUrlRecord[] {
    return this.duplicateUrls;
  }

  public getLatestReport(): ProcessingReport | null {
    return this.latestReport;
  }

  /**
   * Converts processed website documents into NexVora BM25 SearchDocuments
   * so every crawled page is immediately searchable on the homepage and /search route!
   */
  public toSearchDocuments(): SearchDocument[] {
    return this.processedDocuments.map((doc) => {
      // Map ContentCategory to DocumentCategory
      let catType: any = 'web';
      switch (doc.category) {
        case 'Education': catType = 'education'; break;
        case 'Programming': catType = 'programming'; break;
        case 'Technology': catType = 'tech'; break;
        case 'Science': catType = 'science'; break;
        case 'News': catType = 'news'; break;
        case 'Business': catType = 'business'; break;
        case 'Sports': catType = 'sports'; break;
        case 'Entertainment': catType = 'entertainment'; break;
        case 'Health': catType = 'health'; break;
        case 'Travel': catType = 'travel'; break;
        default: catType = 'web'; break;
      }

      const tagSet = new Set<string>();
      tagSet.add(doc.category.toLowerCase());
      tagSet.add(doc.domain);
      doc.headings.h1.forEach((h) => tagSet.add(h.toLowerCase().slice(0, 30)));
      doc.headings.h2.forEach((h) => tagSet.add(h.toLowerCase().slice(0, 30)));
      doc.categorySignals.forEach((s) => tagSet.add(s.split(':')[1]?.replace(/\(\d+\)/, '') || s));

      return {
        id: `crawled-${doc.id}`,
        title: doc.title,
        url: doc.canonicalUrl,
        displayUrl: `${doc.domain} › ${doc.category.toLowerCase()}`,
        snippet: doc.description,
        bodyText: doc.mainText,
        category: catType,
        tags: Array.from(tagSet).filter(Boolean).slice(0, 8),
        publishedDate: doc.processedAt.split('T')[0],
        authorOrOrg: doc.domain,
        sourceType: 'web',
      };
    });
  }
}

export const contentEngine = new ContentProcessingEngine();
