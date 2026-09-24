/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ContentCategory = 
  | 'Education'
  | 'Programming'
  | 'Technology'
  | 'Science'
  | 'News'
  | 'Business'
  | 'Sports'
  | 'Entertainment'
  | 'Health'
  | 'Travel'
  | 'General';

export const ALL_CONTENT_CATEGORIES: ContentCategory[] = [
  'Education',
  'Programming',
  'Technology',
  'Science',
  'News',
  'Business',
  'Sports',
  'Entertainment',
  'Health',
  'Travel',
  'General',
];

export type ProcessingStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'skipped_robots'
  | 'size_exceeded';

export interface ExtractedHeadings {
  h1: string[];
  h2: string[];
  h3: string[];
}

export interface CategoryClassification {
  category: ContentCategory;
  confidenceScore: number; // 0.0 to 1.0
  matchedSignals: string[];
  scoreBreakdown: Record<ContentCategory, number>;
}

export interface ProcessedDocument {
  id: string;
  url: string;
  canonicalUrl: string;
  domain: string;
  title: string;
  description: string;
  headings: ExtractedHeadings;
  mainText: string;
  language: string;
  category: ContentCategory;
  categoryConfidence: number;
  categorySignals: string[];
  contentLengthBytes: number;
  wordCount: number;
  statusCode: number;
  fetchTimeMs: number;
  processedAt: string;
  chunkId: string;
  retryCount: number;
}

export interface FailedUrlRecord {
  url: string;
  domain: string;
  errorReason: string;
  httpStatus?: number;
  failedAt: string;
  attemptsMade: number;
  willRetry: boolean;
}

export interface DuplicateUrlRecord {
  url: string;
  canonicalUrl: string;
  domain: string;
  duplicateOf: string;
  reason: string;
  detectedAt: string;
}

export interface RobotsCheckResult {
  allowed: boolean;
  crawlDelayMs?: number;
  reason?: string;
}

export interface ProcessingChunk {
  chunkId: string;
  filename: string;
  documentCount: number;
  totalBytes: number;
  createdAt: string;
  documents: ProcessedDocument[];
}

export interface CategoryIndexChunk {
  category: ContentCategory;
  documentCount: number;
  updatedAt: string;
  documentIds: string[];
  items: Array<{
    id: string;
    title: string;
    canonicalUrl: string;
    domain: string;
    description: string;
    confidence: number;
  }>;
}

export interface ProcessingReport {
  reportId: string;
  generatedAt: string;
  deploymentOrigin: string;
  summary: {
    totalUrlsQueued: number;
    successfullyProcessed: number;
    failedUrlsCount: number;
    skippedRobotsCount: number;
    duplicateUrlsIgnored: number;
    totalChunksGenerated: number;
    totalExtractedBytes: number;
    averageFetchTimeMs: number;
  };
  categoryDistribution: Record<ContentCategory, number>;
  chunks: Array<{
    chunkId: string;
    path: string;
    count: number;
  }>;
  failedUrls: FailedUrlRecord[];
}
