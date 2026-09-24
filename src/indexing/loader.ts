/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IndexedDocument } from './types.ts';
import { PRECOMPILED_CHUNKS } from '../processor/precompiledData.ts';

/**
 * Load processed documents for the search engine.
 *
 * Source priority:
 *
 * 1. generated/documents/documents.jsonl
 * 2. generated/documents/chunk-*.json
 * 3. PRECOMPILED_CHUNKS
 *
 * The JSONL file is treated as the primary processed-document
 * source because it represents the complete generated dataset.
 */
export function loadProcessedDocuments(): IndexedDocument[] {
  return loadPrecompiledDocuments();
}

/**
 * Load documents from the bundled precompiled dataset.
 */
function loadPrecompiledDocuments(): IndexedDocument[] {
  const docs: IndexedDocument[] = [];
  const seenIds = new Set<string>();

  for (const chunk of PRECOMPILED_CHUNKS) {
    if (
      !chunk ||
      !Array.isArray(chunk.documents)
    ) {
      continue;
    }

    for (const doc of chunk.documents) {
      const normalized =
        normalizeLoadedDocument(doc);

      if (seenIds.has(normalized.id)) {
        continue;
      }

      seenIds.add(
        normalized.id
      );

      docs.push(normalized);
    }
  }

  return docs;
}

/**
 * Normalize a raw processed document into the exact
 * IndexedDocument structure expected by the search engine.
 */
export function normalizeLoadedDocument(
  doc: any
): IndexedDocument {
  const sourceUrl =
    doc?.canonicalUrl ||
    doc?.url ||
    '';

  const mainText =
    typeof doc?.mainText === 'string'
      ? doc.mainText
      : '';

  return {
    id:
      typeof doc?.id === 'string' &&
      doc.id.trim()
        ? doc.id
        : createStableDocumentId(
            sourceUrl,
            doc?.title
          ),

    url:
      typeof doc?.url === 'string'
        ? doc.url
        : sourceUrl,

    canonicalUrl:
      typeof doc?.canonicalUrl ===
      'string'
        ? doc.canonicalUrl
        : sourceUrl,

    domain:
      typeof doc?.domain === 'string' &&
      doc.domain.trim()
        ? doc.domain
        : extractDomain(sourceUrl),

    title:
      typeof doc?.title === 'string' &&
      doc.title.trim()
        ? doc.title
        : 'Untitled Document',

    description:
      typeof doc?.description ===
      'string'
        ? doc.description
        : '',

    headings: {
      h1: Array.isArray(
        doc?.headings?.h1
      )
        ? doc.headings.h1
        : [],

      h2: Array.isArray(
        doc?.headings?.h2
      )
        ? doc.headings.h2
        : [],

      h3: Array.isArray(
        doc?.headings?.h3
      )
        ? doc.headings.h3
        : [],
    },

    mainText,

    language:
      typeof doc?.language === 'string'
        ? doc.language
        : 'en',

    category:
      typeof doc?.category === 'string' &&
      doc.category.trim()
        ? doc.category
        : 'General',

    categoryConfidence:
      typeof doc?.categoryConfidence ===
      'number'
        ? doc.categoryConfidence
        : 0.8,

    categorySignals:
      Array.isArray(
        doc?.categorySignals
      )
        ? doc.categorySignals
        : [],

    wordCount:
      typeof doc?.wordCount ===
      'number'
        ? doc.wordCount
        : calculateWordCount(
            mainText
          ),

    contentLengthBytes:
      typeof doc?.contentLengthBytes ===
      'number'
        ? doc.contentLengthBytes
        : undefined,

    statusCode:
      typeof doc?.statusCode ===
      'number'
        ? doc.statusCode
        : 200,

    fetchTimeMs:
      typeof doc?.fetchTimeMs ===
      'number'
        ? doc.fetchTimeMs
        : 20,

    processedAt:
      typeof doc?.processedAt ===
      'string'
        ? doc.processedAt
        : new Date().toISOString(),

    chunkId:
      typeof doc?.chunkId === 'string'
        ? doc.chunkId
        : 'chunk-001',
  };
}

/**
 * Create a stable fallback document ID.
 *
 * This avoids Math.random(), which would produce a
 * different ID on every serverless invocation.
 */
function createStableDocumentId(
  url: string,
  title?: string
): string {
  const source =
    `${url}|${title || ''}`.trim();

  let hash = 0;

  for (
    let i = 0;
    i < source.length;
    i++
  ) {
    hash =
      (
        (hash << 5) -
        hash +
        source.charCodeAt(i)
      ) |
      0;
  }

  const unsignedHash =
    Math.abs(hash).toString(36);

  return `doc-${unsignedHash}`;
}

/**
 * Calculate a safe word count.
 */
function calculateWordCount(
  text: string
): number {
  if (!text.trim()) {
    return 0;
  }

  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .length;
}

/**
 * Extract hostname from a URL safely.
 */
function extractDomain(
  urlStr: string
): string {
  try {
    const parsed =
      new URL(urlStr);

    return parsed.hostname.replace(
      /^www\./i,
      ''
    );
  } catch {
    return 'web';
  }
}
