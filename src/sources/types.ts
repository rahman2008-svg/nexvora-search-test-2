/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SourceType = 'search-url' | 'website' | 'sitemap';

export interface ProcessedSearchQuery {
  id: string;
  sourceType: 'search-url';
  rawInput: string;
  detectedEngine: 'google' | 'generic';
  extractedQuery: string;       // e.g. "khan sir"
  normalizedQuery: string;      // lowercase, trimmed, single spaces (for deduplication)
  encodedQuery: string;         // e.g. "khan+sir"
  nexvoraRelativeUrl: string;   // e.g. "/search?q=khan+sir"
  nexvoraAbsoluteUrl: string;   // e.g. "https://domain/search?q=khan+sir"
  strippedParams: string[];     // e.g. ["gs_ssp", "oq", "client", "sourceid", "gs_lcrp"]
  isDuplicate: boolean;
  duplicateOfId?: string;
  canonicalKey: string;
  createdAt: string;
}

export interface ProcessedWebsite {
  id: string;
  sourceType: 'website';
  rawInput: string;
  canonicalUrl: string;
  domain: string;
  hostname: string;
  path: string;
  titleHint?: string;
  strippedParams: string[];     // e.g. ["utm_source", "utm_medium", "ref"]
  isDuplicate: boolean;
  duplicateOfId?: string;
  canonicalKey: string;
  createdAt: string;
}

export interface ProcessedSitemap {
  id: string;
  sourceType: 'sitemap';
  rawInput: string;
  canonicalUrl: string;
  domain: string;
  isXml: boolean;
  isDuplicate: boolean;
  duplicateOfId?: string;
  canonicalKey: string;
  createdAt: string;
}

export interface ProcessingError {
  rawInput: string;
  sourceType: SourceType;
  reason: string;
}

export interface SourceProcessingReport {
  timestamp: string;
  deploymentOrigin: string;
  stats: {
    totalRawLines: number;
    searchUrlsProcessed: number;
    websitesProcessed: number;
    sitemapsProcessed: number;
    uniqueQueries: number;
    uniqueWebsites: number;
    uniqueSitemaps: number;
    duplicateCount: number;
    invalidCount: number;
  };
  searchUrls: ProcessedSearchQuery[];
  websites: ProcessedWebsite[];
  sitemaps: ProcessedSitemap[];
  errors: ProcessingError[];
}

/**
 * Clean structured manifest format ready for Phase 3 automated indexing & crawler ingestion
 */
export interface Phase3StructuredManifest {
  manifestVersion: '3.0-alpha';
  generatedAt: string;
  deploymentOrigin: string;
  crawlTargets: {
    queriesToHarvest: Array<{
      query: string;
      nexvoraSearchUrl: string;
      priority: number;
    }>;
    directWebsitesToCrawl: Array<{
      url: string;
      domain: string;
      priority: number;
    }>;
    sitemapsToDiscover: Array<{
      sitemapUrl: string;
      domain: string;
      expectedFormat: 'xml';
    }>;
  };
}
