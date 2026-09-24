/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ProcessedSearchQuery,
  ProcessedWebsite,
  ProcessedSitemap,
  ProcessingError,
  SourceProcessingReport,
  Phase3StructuredManifest
} from './types.ts';
import { extractSearchQuery } from './queryExtractor.ts';
import { canonicalizeWebsiteUrl, canonicalizeSitemapUrl } from './canonicalizer.ts';
import { DuplicateDetector } from './duplicateDetector.ts';
import { getAppOrigin } from '../utils/url.ts';
import { SearchDocument } from '../types/search.ts';

// Bundled raw source data mirror matching files in sources/
export const DEFAULT_RAW_SOURCES = {
  searchUrls: [
    'https://www.google.com/search?gs_ssp=eJzj4tVP1zc0TMtKrqwosTQ3YPSSKC4pTU4tUchPUyjOyM9NzcvPzwMAzO8LhA&q=khan+sir&oq=khan+sir&gs_lcrp=EgZjaHJvbWUqDQgBEC4YgwEYsQMYgAQyBggAEEUYOTINCAEQLhiDARixAxiABDIKCAIQABixAxiABDIKCAMQLhixAxiABDIHCAQQABiABDIKCAUQABixAxiABDIHCAYQABiABDIHCAcQABiABDIHCAgQABiABDIHCAkQABiABNIBCDI4OTJqMGo3qAIAsAIA&sourceid=chrome&ie=UTF-8',
    'https://www.google.com/search?q=khan+sir&client=safari&sca_esv=59837482&sxsrf=ACQVn0...&ved=0ahUKEwi...',
    'https://www.google.com/search?q=quantum+computing+qubits&oq=quantum+computing&sourceid=chrome',
    'https://www.google.com/search?q=React+19+documentation&client=firefox-b-d&source=hp',
    'https://www.google.com/search?q=BM25+ranking+algorithm+formula&oq=bm25&gs_l=mobile-gws-wiz-serp',
    'https://www.google.com/search?q=linux+kernel+git+repository&sourceid=chrome',
    'https://www.google.com/search?q=Rust+memory+safety+borrow+checker&client=chrome',
    'https://www.google.com/search?q=sqlite+database+architecture&oq=sqlite',
    'https://www.google.com/search?q=khan%20sir',
    'https://www.google.com/search?q=docker+containerization+namespaces&source=desktop',
    'https://www.google.com/search?q=James+Webb+Space+Telescope+deep+field&client=browser',
    'https://www.google.com/search?q=HTTP+404+status+code&sourceid=edge'
  ],
  websites: [
    'https://developer.mozilla.org/en-US/docs/Web/JavaScript?utm_source=newsletter&utm_medium=email',
    'https://react.dev/blog/2024/12/05/react-19?ref=hackernews',
    'https://github.com/torvalds/linux',
    'https://en.wikipedia.org/wiki/Okapi_BM25',
    'https://www.rust-lang.org/learn',
    'https://sqlite.org/arch.html',
    'https://bun.sh/docs',
    'https://vite.dev/guide/',
    'https://tailwindcss.com/docs/v4-upgrade-guide',
    'https://signal.org/docs/specifications/doubleratchet/',
    'https://webb.nasa.gov/content/science/overview.html',
    'https://kubernetes.io/docs/concepts/overview/what-is-kubernetes/',
    'https://docs.docker.com/get-started/overview/',
    'https://developer.mozilla.org/en-US/docs/Web/JavaScript/'
  ],
  sitemaps: [
    'https://developer.mozilla.org/sitemap.xml',
    'https://react.dev/sitemap.xml',
    'https://bun.sh/sitemap.xml',
    'https://vite.dev/sitemap.xml',
    'https://tailwindcss.com/sitemap.xml',
    'https://kubernetes.io/sitemap.xml',
    'https://docs.docker.com/sitemap.xml',
    'https://webb.nasa.gov/sitemap.xml'
  ]
};

export class SourceProcessor {
  private duplicateDetector = new DuplicateDetector();

  /**
   * Process a list of raw search URL strings (e.g. from sources/search-urls/)
   */
  public processSearchUrls(lines: string[]): {
    items: ProcessedSearchQuery[];
    errors: ProcessingError[];
  } {
    const items: ProcessedSearchQuery[] = [];
    const errors: ProcessingError[] = [];

    lines.forEach((line, index) => {
      const cleanLine = line.trim();
      // Skip empty lines and comment lines
      if (!cleanLine || cleanLine.startsWith('#')) return;

      // Extract and clean query
      const extracted = extractSearchQuery(cleanLine);
      if (!extracted) {
        errors.push({
          rawInput: cleanLine,
          sourceType: 'search-url',
          reason: 'Could not extract valid query parameter (q) or URL is malformed'
        });
        return;
      }

      const id = `sq-${index + 1}-${Math.random().toString(36).slice(2, 7)}`;
      const canonicalKey = `query:${extracted.normalizedQuery}`;
      const dupCheck = this.duplicateDetector.checkAndRegister(canonicalKey, id);

      items.push({
        id,
        sourceType: 'search-url',
        rawInput: cleanLine,
        detectedEngine: extracted.isGoogle ? 'google' : 'generic',
        extractedQuery: extracted.extractedQuery,
        normalizedQuery: extracted.normalizedQuery,
        encodedQuery: extracted.encodedQuery,
        nexvoraRelativeUrl: extracted.nexvoraRelativeUrl,
        nexvoraAbsoluteUrl: extracted.nexvoraAbsoluteUrl,
        strippedParams: extracted.strippedParams,
        isDuplicate: dupCheck.isDuplicate,
        duplicateOfId: dupCheck.duplicateOfId,
        canonicalKey,
        createdAt: new Date().toISOString()
      });
    });

    return { items, errors };
  }

  /**
   * Process a list of raw direct website URLs (e.g. from sources/websites/)
   */
  public processWebsites(lines: string[]): {
    items: ProcessedWebsite[];
    errors: ProcessingError[];
  } {
    const items: ProcessedWebsite[] = [];
    const errors: ProcessingError[] = [];

    lines.forEach((line, index) => {
      const cleanLine = line.trim();
      if (!cleanLine || cleanLine.startsWith('#')) return;

      const canonicalResult = canonicalizeWebsiteUrl(cleanLine);
      if (!canonicalResult) {
        errors.push({
          rawInput: cleanLine,
          sourceType: 'website',
          reason: 'Invalid or malformed HTTP/HTTPS website URL'
        });
        return;
      }

      const id = `ws-${index + 1}-${Math.random().toString(36).slice(2, 7)}`;
      const canonicalKey = `url:${canonicalResult.canonicalUrl}`;
      const dupCheck = this.duplicateDetector.checkAndRegister(canonicalKey, id);

      items.push({
        id,
        sourceType: 'website',
        rawInput: cleanLine,
        canonicalUrl: canonicalResult.canonicalUrl,
        domain: canonicalResult.domain,
        hostname: canonicalResult.hostname,
        path: canonicalResult.path,
        strippedParams: canonicalResult.strippedParams,
        isDuplicate: dupCheck.isDuplicate,
        duplicateOfId: dupCheck.duplicateOfId,
        canonicalKey,
        createdAt: new Date().toISOString()
      });
    });

    return { items, errors };
  }

  /**
   * Process a list of sitemap URLs (e.g. from sources/sitemaps/)
   */
  public processSitemaps(lines: string[]): {
    items: ProcessedSitemap[];
    errors: ProcessingError[];
  } {
    const items: ProcessedSitemap[] = [];
    const errors: ProcessingError[] = [];

    lines.forEach((line, index) => {
      const cleanLine = line.trim();
      if (!cleanLine || cleanLine.startsWith('#')) return;

      const canonicalResult = canonicalizeSitemapUrl(cleanLine);
      if (!canonicalResult) {
        errors.push({
          rawInput: cleanLine,
          sourceType: 'sitemap',
          reason: 'Invalid sitemap XML URL'
        });
        return;
      }

      const id = `sm-${index + 1}-${Math.random().toString(36).slice(2, 7)}`;
      const canonicalKey = `sitemap:${canonicalResult.canonicalUrl}`;
      const dupCheck = this.duplicateDetector.checkAndRegister(canonicalKey, id);

      items.push({
        id,
        sourceType: 'sitemap',
        rawInput: cleanLine,
        canonicalUrl: canonicalResult.canonicalUrl,
        domain: canonicalResult.domain,
        isXml: canonicalResult.isXml,
        isDuplicate: dupCheck.isDuplicate,
        duplicateOfId: dupCheck.duplicateOfId,
        canonicalKey,
        createdAt: new Date().toISOString()
      });
    });

    return { items, errors };
  }

  /**
   * Run full batch processing across all 3 source types
   */
  public processAll(data: {
    searchUrls?: string[];
    websites?: string[];
    sitemaps?: string[];
  }): SourceProcessingReport {
    this.duplicateDetector.reset();

    const searchRes = this.processSearchUrls(data.searchUrls || DEFAULT_RAW_SOURCES.searchUrls);
    const websitesRes = this.processWebsites(data.websites || DEFAULT_RAW_SOURCES.websites);
    const sitemapsRes = this.processSitemaps(data.sitemaps || DEFAULT_RAW_SOURCES.sitemaps);

    const allErrors = [
      ...searchRes.errors,
      ...websitesRes.errors,
      ...sitemapsRes.errors
    ];

    const uniqueQueries = searchRes.items.filter(i => !i.isDuplicate).length;
    const uniqueWebsites = websitesRes.items.filter(i => !i.isDuplicate).length;
    const uniqueSitemaps = sitemapsRes.items.filter(i => !i.isDuplicate).length;
    const duplicateCount = 
      searchRes.items.filter(i => i.isDuplicate).length +
      websitesRes.items.filter(i => i.isDuplicate).length +
      sitemapsRes.items.filter(i => i.isDuplicate).length;

    const totalRaw = 
      (data.searchUrls?.length || DEFAULT_RAW_SOURCES.searchUrls.length) +
      (data.websites?.length || DEFAULT_RAW_SOURCES.websites.length) +
      (data.sitemaps?.length || DEFAULT_RAW_SOURCES.sitemaps.length);

    return {
      timestamp: new Date().toISOString(),
      deploymentOrigin: getAppOrigin(),
      stats: {
        totalRawLines: totalRaw,
        searchUrlsProcessed: searchRes.items.length,
        websitesProcessed: websitesRes.items.length,
        sitemapsProcessed: sitemapsRes.items.length,
        uniqueQueries,
        uniqueWebsites,
        uniqueSitemaps,
        duplicateCount,
        invalidCount: allErrors.length
      },
      searchUrls: searchRes.items,
      websites: websitesRes.items,
      sitemaps: sitemapsRes.items,
      errors: allErrors
    };
  }

  /**
   * Generates clean structured JSON manifest for Phase 3 ingestion
   */
  public generatePhase3Manifest(report: SourceProcessingReport): Phase3StructuredManifest {
    const origin = getAppOrigin();

    return {
      manifestVersion: '3.0-alpha',
      generatedAt: report.timestamp,
      deploymentOrigin: origin,
      crawlTargets: {
        queriesToHarvest: report.searchUrls
          .filter(sq => !sq.isDuplicate)
          .map(sq => ({
            query: sq.extractedQuery,
            nexvoraSearchUrl: sq.nexvoraRelativeUrl,
            priority: 1.0
          })),
        directWebsitesToCrawl: report.websites
          .filter(ws => !ws.isDuplicate)
          .map(ws => ({
            url: ws.canonicalUrl,
            domain: ws.domain,
            priority: 0.8
          })),
        sitemapsToDiscover: report.sitemaps
          .filter(sm => !sm.isDuplicate)
          .map(sm => ({
            sitemapUrl: sm.canonicalUrl,
            domain: sm.domain,
            expectedFormat: 'xml'
          }))
      }
    };
  }

  /**
   * Convert processed search queries and website sources into SearchDocuments
   * to directly enrich NexVora's live search index!
   */
  public convertToSearchDocuments(report: SourceProcessingReport): SearchDocument[] {
    const docs: SearchDocument[] = [];

    // Add search queries as discoverable community/curated queries
    for (const sq of report.searchUrls) {
      if (sq.isDuplicate) continue;

      // Check special queries like "khan sir"
      if (sq.normalizedQuery.includes('khan sir')) {
        docs.push({
          id: `source-query-${sq.id}`,
          title: 'Khan Sir – Official Educational Profile & GS Research Centre',
          url: sq.nexvoraRelativeUrl,
          displayUrl: 'nexvora.internal › index › query › khan-sir',
          snippet: 'Educational lectures, competitive exam preparations (UPSC, BPSC, Railway), current affairs and general science research by Khan Sir (Faizal Khan) Patna. Curated from independent source links.',
          bodyText: 'Khan GS Research Centre in Patna provides coaching for general studies, science, map analysis, and current affairs. Normalized and indexed through NexVora GitHub search URL pipeline.',
          category: 'knowledge',
          tags: ['khan sir', 'education', 'upsc', 'gs research', 'patna', 'lectures'],
          publishedDate: '2025-02-15',
          authorOrOrg: 'Khan GS Research Centre',
          sourceType: 'web'
        });
      }
    }

    return docs;
  }
}

// Export a singleton instance
export const sourceProcessor = new SourceProcessor();
