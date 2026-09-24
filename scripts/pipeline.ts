/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { contentEngine } from '../src/processor/contentEngine.ts';
import { ALL_CONTENT_CATEGORIES, ContentCategory } from '../src/processor/types.ts';
import { NexVoraSearchEngine } from '../src/indexing/nexvoraIndex.ts';
import { normalizeLoadedDocument } from '../src/indexing/loader.ts';
import { isValidUrl, extractCleanDomain } from '../src/sources/urlParser.ts';

const ROOT_DIR = process.cwd();
const SOURCES_DIR = path.join(ROOT_DIR, 'sources');
const GENERATED_DIR = path.join(ROOT_DIR, 'generated');
const DOCS_DIR = path.join(GENERATED_DIR, 'documents');
const CATS_DIR = path.join(GENERATED_DIR, 'categories');
const INDEX_DIR = path.join(GENERATED_DIR, 'index');
const REPORTS_DIR = path.join(GENERATED_DIR, 'reports');

interface PipelineOptions {
  forceRebuild?: boolean;
  validateSourcesOnly?: boolean;
  indexOnly?: boolean;
  quiet?: boolean;
}

function logStep(stepNum: number, title: string) {
  console.log(`\n======================================================`);
  console.log(`[STEP ${stepNum}] ${title}`);
  console.log(`======================================================`);
}

function logInfo(message: string) {
  console.log(`  ℹ  ${message}`);
}

function logSuccess(message: string) {
  console.log(`  ✓  ${message}`);
}

function logWarning(message: string) {
  console.log(`  ⚠  ${message}`);
}

function logError(message: string) {
  console.error(`  ✗  ${message}`);
}

/**
 * Step 1: Validate Source Files & Extract Target Seed URLs
 */
export function validateAndLoadSources() {
  logStep(1, 'Validating Source Files & Extracting Seed URLs');

  const sourceFiles = [
    {
      name: 'Curated Websites',
      relPath: 'sources/websites/curated-sites.txt',
      type: 'websites',
    },
    {
      name: 'Sample Queries / Search URLs',
      relPath: 'sources/search-urls/sample-queries.txt',
      type: 'search-urls',
    },
    {
      name: 'Popular Sitemaps',
      relPath: 'sources/sitemaps/popular-sitemaps.txt',
      type: 'sitemaps',
    },
  ];

  const seedUrls: string[] = [];
  const sourceStats: Record<string, { totalLines: number; validUrls: number; commentsOrEmpty: number; invalidUrls: number }> = {};

  for (const src of sourceFiles) {
    const fullPath = path.join(ROOT_DIR, src.relPath);
    if (!fs.existsSync(fullPath)) {
      logWarning(`Source file not found: ${src.relPath}`);
      continue;
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n');
    let validCount = 0;
    let commentCount = 0;
    let invalidCount = 0;

    for (const rawLine of lines) {
      let line = rawLine.trim();
      if (!line || line.startsWith('#')) {
        commentCount++;
        continue;
      }

      // Strip inline comments if any
      if (line.includes(' #')) {
        line = line.split(' #')[0].trim();
      }

      if (src.type === 'websites') {
        // Collect website URLs for ingestion
        seedUrls.push(line);
        if (isValidUrl(line)) {
          validCount++;
        } else {
          invalidCount++;
        }
      } else {
        validCount++;
      }
    }

    sourceStats[src.name] = {
      totalLines: lines.length,
      validUrls: validCount,
      commentsOrEmpty: commentCount,
      invalidUrls: invalidCount,
    };

    logInfo(`${src.name} (${src.relPath}): ${validCount} entries, ${invalidCount} invalid, ${commentCount} comments/blank`);
  }

  logSuccess(`Source validation complete. Collected ${seedUrls.length} website seed entries for processing.`);
  return { seedUrls, sourceStats };
}

/**
 * Step 2 & 3: Run Ingestion, Deduplication, Metadata Extraction & Categorization
 */
export async function runIngestionPipeline(seedUrls: string[]) {
  logStep(2, 'Processing URLs, Removing Duplicates & Extracting Metadata');
  logInfo(`Executing contentEngine batch on ${seedUrls.length} input URLs...`);

  const startTime = Date.now();
  const report = await contentEngine.processBatch(seedUrls);
  const durationMs = Date.now() - startTime;

  const processedDocs = contentEngine.getProcessedDocuments();
  const chunks = contentEngine.getChunks();
  const categoryIndices = contentEngine.getCategoryIndices();
  const failedUrls = contentEngine.getFailedUrls();
  const duplicateUrls = contentEngine.getDuplicateUrls();

  logSuccess(`Ingestion finished in ${durationMs}ms:`);
  logInfo(`  • Successfully processed documents : ${processedDocs.length}`);
  logInfo(`  • Duplicate URLs ignored          : ${duplicateUrls.length}`);
  logInfo(`  • Failed or blocked URLs          : ${failedUrls.length}`);
  logInfo(`  • Partitioned JSON chunks         : ${chunks.length}`);
  logInfo(`  • Total extracted content bytes   : ${report.summary.totalExtractedBytes.toLocaleString()} bytes`);

  return {
    report,
    processedDocs,
    chunks,
    categoryIndices,
    failedUrls,
    duplicateUrls,
    durationMs,
  };
}

/**
 * Step 4: Write Generated Documents, Categories and Reports
 */
export function writeGeneratedFiles(pipelineData: Awaited<ReturnType<typeof runIngestionPipeline>>) {
  logStep(3, 'Writing Generated Documents, Categories & Reports');

  // Ensure directories exist
  [DOCS_DIR, CATS_DIR, INDEX_DIR, REPORTS_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  const { processedDocs, chunks, categoryIndices, failedUrls, duplicateUrls, report } = pipelineData;

  // 1. Write chunk-*.json files
  logInfo(`Writing ${chunks.length} document chunk files to generated/documents/...`);
  for (const chunk of chunks) {
    const chunkPath = path.join(DOCS_DIR, chunk.filename);
    fs.writeFileSync(chunkPath, JSON.stringify(chunk, null, 2), 'utf-8');
  }

  // 2. Write documents.jsonl (line-delimited JSON for high-throughput stream processing)
  logInfo('Writing documents.jsonl...');
  const jsonlPath = path.join(DOCS_DIR, 'documents.jsonl');
  const jsonlContent = processedDocs.map((doc) => JSON.stringify(doc)).join('\n') + '\n';
  fs.writeFileSync(jsonlPath, jsonlContent, 'utf-8');

  // 3. Write generated/categories/*.json
  logInfo(`Writing 11 category indices to generated/categories/...`);
  for (const cat of ALL_CONTENT_CATEGORIES) {
    const catChunk = categoryIndices.get(cat) || {
      category: cat,
      documentCount: 0,
      updatedAt: new Date().toISOString(),
      documentIds: [],
      items: [],
    };
    const catPath = path.join(CATS_DIR, `${cat.toLowerCase()}.json`);
    fs.writeFileSync(catPath, JSON.stringify(catChunk, null, 2), 'utf-8');
  }

  // 4. Write reports to generated/reports/
  logInfo('Writing processing reports & audit logs to generated/reports/...');
  
  // processing-report.json
  const reportPath = path.join(REPORTS_DIR, 'processing-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

  // category-distribution.json
  const totalDocs = processedDocs.length || 1;
  const categoryDistributionData = Object.entries(report.categoryDistribution).map(([category, count]) => ({
    category,
    count,
    percentage: Math.round((count / totalDocs) * 1000) / 10,
  }));
  const distPath = path.join(REPORTS_DIR, 'category-distribution.json');
  fs.writeFileSync(distPath, JSON.stringify(categoryDistributionData, null, 2), 'utf-8');

  // failed-urls.jsonl
  const failedJsonlPath = path.join(REPORTS_DIR, 'failed-urls.jsonl');
  const failedContent = failedUrls.map((f) => JSON.stringify(f)).join('\n') + (failedUrls.length > 0 ? '\n' : '');
  fs.writeFileSync(failedJsonlPath, failedContent, 'utf-8');

  // duplicate-urls.jsonl
  const dupJsonlPath = path.join(REPORTS_DIR, 'duplicate-urls.jsonl');
  const dupContent = duplicateUrls.map((d) => JSON.stringify(d)).join('\n') + (duplicateUrls.length > 0 ? '\n' : '');
  fs.writeFileSync(dupJsonlPath, dupContent, 'utf-8');

  logSuccess('Successfully generated and updated all documents, categories, and report files.');
}

/**
 * Step 5: Build and Serialize Okapi BM25 Search Index
 */
export function buildAndSaveSearchIndex(processedDocs: any[]) {
  logStep(4, 'Building and Serializing Okapi BM25 Search Index');

  const engine = new NexVoraSearchEngine();
  const normalizedDocs = processedDocs.map((d) => normalizeLoadedDocument(d));

  logInfo(`Indexing ${normalizedDocs.length} documents into Inverted Index...`);
  engine.buildIndex(normalizedDocs);

  const stats = engine.getStats();
  const serialized = engine.exportIndex();

  if (!fs.existsSync(INDEX_DIR)) {
    fs.mkdirSync(INDEX_DIR, { recursive: true });
  }

  // 1. Write nexvora-index.json
  const indexPath = path.join(INDEX_DIR, 'nexvora-index.json');
  fs.writeFileSync(indexPath, JSON.stringify(serialized), 'utf-8');
  const indexSizeKb = Math.round(fs.statSync(indexPath).size / 1024);

  // 2. Write index-stats.json
  const statsPath = path.join(INDEX_DIR, 'index-stats.json');
  const indexStatsPayload = {
    engine: 'NexVora Okapi BM25 Inverted Index',
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    totalDocuments: stats.totalDocuments,
    totalTerms: stats.totalTerms,
    avgDocLength: stats.avgDocLength,
    totalDocLength: stats.totalDocLength,
    categories: stats.categories,
    indexFileBytes: fs.statSync(indexPath).size,
  };
  fs.writeFileSync(statsPath, JSON.stringify(indexStatsPayload, null, 2), 'utf-8');

  // 3. Write manifest.json with file checksums
  const hash = crypto.createHash('sha256').update(JSON.stringify(serialized)).digest('hex');
  const manifestPayload = {
    generatedAt: new Date().toISOString(),
    checksumSha256: hash,
    indexFile: 'generated/index/nexvora-index.json',
    statsFile: 'generated/index/index-stats.json',
    totalDocuments: stats.totalDocuments,
    totalTerms: stats.totalTerms,
    sizeKb: indexSizeKb,
  };
  const manifestPath = path.join(INDEX_DIR, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifestPayload, null, 2), 'utf-8');

  logSuccess(`Search Index built successfully:`);
  logInfo(`  • Indexed documents : ${stats.totalDocuments}`);
  logInfo(`  • Inverted index terms : ${stats.totalTerms}`);
  logInfo(`  • Average doc length  : ${stats.avgDocLength} tokens`);
  logInfo(`  • Serialized size     : ${indexSizeKb} KB (${indexPath})`);

  return indexStatsPayload;
}

/**
 * Main Pipeline Execution
 */
export async function runPipeline(options: PipelineOptions = {}) {
  console.log(`\n======================================================`);
  console.log(`   NEXVORA SEARCH - AUTOMATED INGESTION & INDEX PIPELINE`);
  console.log(`======================================================`);
  console.log(`Started at: ${new Date().toISOString()}`);

  const startTime = Date.now();

  // Step 1: Validate Sources
  const { seedUrls, sourceStats } = validateAndLoadSources();

  if (options.validateSourcesOnly) {
    logSuccess('Validation-only flag set. Exiting without processing.');
    return;
  }

  // Step 2 & 3: Run Ingestion & Metadata Extraction
  const pipelineData = await runIngestionPipeline(seedUrls);

  // Step 4: Write Generated Documents, Categories and Reports
  writeGeneratedFiles(pipelineData);

  // Step 5: Build & Save Search Index
  const indexStats = buildAndSaveSearchIndex(pipelineData.processedDocs);

  const totalDurationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n======================================================`);
  console.log(`   PIPELINE COMPLETED SUCCESSFULLY IN ${totalDurationSec}s`);
  console.log(`======================================================`);
  console.log(`• Documents : ${indexStats.totalDocuments}`);
  console.log(`• Terms     : ${indexStats.totalTerms}`);
  console.log(`• Chunks    : ${pipelineData.chunks.length}`);
  console.log(`• Updated   : generated/documents/, generated/categories/, generated/index/, generated/reports/\n`);
}

// Execute CLI directly if invoked from command line
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const validateSourcesOnly = args.includes('--validate-sources-only');
  const indexOnly = args.includes('--index-only');
  const forceRebuild = args.includes('--force-rebuild') || args.includes('-f');

  runPipeline({ validateSourcesOnly, indexOnly, forceRebuild }).catch((err) => {
    logError(`Pipeline failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  });
}
