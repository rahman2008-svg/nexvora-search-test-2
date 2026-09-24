/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { ALL_CONTENT_CATEGORIES } from '../src/processor/types.ts';

const ROOT_DIR = process.cwd();
const GENERATED_DIR = path.join(ROOT_DIR, 'generated');
const DOCS_DIR = path.join(GENERATED_DIR, 'documents');
const CATS_DIR = path.join(GENERATED_DIR, 'categories');
const INDEX_DIR = path.join(GENERATED_DIR, 'index');
const REPORTS_DIR = path.join(GENERATED_DIR, 'reports');

let totalErrors = 0;
let totalChecks = 0;

function assert(condition: boolean, passMessage: string, failMessage: string) {
  totalChecks++;
  if (condition) {
    console.log(`  ✓ ${passMessage}`);
  } else {
    totalErrors++;
    console.error(`  ✗ FAIL: ${failMessage}`);
  }
}

export function validatePipelineOutputs() {
  console.log('\n======================================================');
  console.log('   NEXVORA PIPELINE GENERATED OUTPUTS VALIDATION');
  console.log('======================================================\n');

  // 1. Verify generated/documents/
  console.log('[1/4] Validating generated/documents/...');
  assert(fs.existsSync(DOCS_DIR), 'Directory generated/documents/ exists', 'Directory generated/documents/ is missing!');

  if (fs.existsSync(DOCS_DIR)) {
    const docFiles = fs.readdirSync(DOCS_DIR);
    const chunkFiles = docFiles.filter((f) => f.startsWith('chunk-') && f.endsWith('.json'));
    assert(chunkFiles.length > 0, `Found ${chunkFiles.length} document chunk files`, 'No chunk files found in generated/documents/');

    let totalChunkDocs = 0;
    for (const chunkFile of chunkFiles) {
      try {
        const raw = fs.readFileSync(path.join(DOCS_DIR, chunkFile), 'utf-8');
        const parsed = JSON.parse(raw);
        assert(Array.isArray(parsed.documents), `${chunkFile} has valid documents array (${parsed.documents?.length} docs)`, `${chunkFile} missing documents array`);
        totalChunkDocs += parsed.documents?.length || 0;
      } catch (err: any) {
        assert(false, '', `Failed to parse ${chunkFile}: ${err.message}`);
      }
    }

    const jsonlPath = path.join(DOCS_DIR, 'documents.jsonl');
    assert(fs.existsSync(jsonlPath), 'documents.jsonl exists', 'documents.jsonl is missing');
    if (fs.existsSync(jsonlPath)) {
      const lines = fs.readFileSync(jsonlPath, 'utf-8').trim().split('\n').filter(Boolean);
      assert(lines.length === totalChunkDocs, `documents.jsonl line count (${lines.length}) matches chunk documents total (${totalChunkDocs})`, `Line count mismatch: ${lines.length} vs ${totalChunkDocs}`);
    }
  }

  // 2. Verify generated/categories/
  console.log('\n[2/4] Validating generated/categories/...');
  assert(fs.existsSync(CATS_DIR), 'Directory generated/categories/ exists', 'Directory generated/categories/ is missing');

  if (fs.existsSync(CATS_DIR)) {
    for (const cat of ALL_CONTENT_CATEGORIES) {
      const catFile = path.join(CATS_DIR, `${cat.toLowerCase()}.json`);
      const exists = fs.existsSync(catFile);
      assert(exists, `Category file exists: ${cat.toLowerCase()}.json`, `Missing category file: ${cat.toLowerCase()}.json`);
      if (exists) {
        try {
          const content = JSON.parse(fs.readFileSync(catFile, 'utf-8'));
          assert(content.category === cat, `Category key matches for ${cat}`, `Category key mismatch for ${cat}`);
        } catch (e: any) {
          assert(false, '', `Failed to parse ${catFile}: ${e.message}`);
        }
      }
    }
  }

  // 3. Verify generated/index/
  console.log('\n[3/4] Validating generated/index/...');
  assert(fs.existsSync(INDEX_DIR), 'Directory generated/index/ exists', 'Directory generated/index/ is missing');

  if (fs.existsSync(INDEX_DIR)) {
    const indexPath = path.join(INDEX_DIR, 'nexvora-index.json');
    assert(fs.existsSync(indexPath), 'nexvora-index.json exists', 'nexvora-index.json is missing');

    if (fs.existsSync(indexPath)) {
      try {
        const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
        assert(indexData.totalDocuments > 0, `Index contains ${indexData.totalDocuments} indexed documents`, 'Index has 0 documents');
        assert(indexData.totalTerms > 0, `Index contains ${indexData.totalTerms} inverted terms`, 'Index has 0 terms');
        assert(typeof indexData.invertedIndex === 'object', 'Inverted index structure verified', 'Inverted index structure invalid');
      } catch (e: any) {
        assert(false, '', `Failed to parse nexvora-index.json: ${e.message}`);
      }
    }

    const statsPath = path.join(INDEX_DIR, 'index-stats.json');
    assert(fs.existsSync(statsPath), 'index-stats.json exists', 'index-stats.json is missing');

    const manifestPath = path.join(INDEX_DIR, 'manifest.json');
    assert(fs.existsSync(manifestPath), 'manifest.json exists', 'manifest.json is missing');
  }

  // 4. Verify generated/reports/
  console.log('\n[4/4] Validating generated/reports/...');
  assert(fs.existsSync(REPORTS_DIR), 'Directory generated/reports/ exists', 'Directory generated/reports/ is missing');

  if (fs.existsSync(REPORTS_DIR)) {
    const reportPath = path.join(REPORTS_DIR, 'processing-report.json');
    assert(fs.existsSync(reportPath), 'processing-report.json exists', 'processing-report.json is missing');

    const distPath = path.join(REPORTS_DIR, 'category-distribution.json');
    assert(fs.existsSync(distPath), 'category-distribution.json exists', 'category-distribution.json is missing');

    const failedPath = path.join(REPORTS_DIR, 'failed-urls.jsonl');
    assert(fs.existsSync(failedPath), 'failed-urls.jsonl exists', 'failed-urls.jsonl is missing');

    const dupPath = path.join(REPORTS_DIR, 'duplicate-urls.jsonl');
    assert(fs.existsSync(dupPath), 'duplicate-urls.jsonl exists', 'duplicate-urls.jsonl is missing');
  }

  console.log('\n======================================================');
  if (totalErrors === 0) {
    console.log(`✓ ALL ${totalChecks} VALIDATION CHECKS PASSED PERFECTLY!`);
    console.log('======================================================\n');
    return true;
  } else {
    console.error(`✗ VALIDATION FAILED WITH ${totalErrors} ERROR(S) OUT OF ${totalChecks} CHECKS.`);
    console.log('======================================================\n');
    return false;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const success = validatePipelineOutputs();
  process.exit(success ? 0 : 1);
}
