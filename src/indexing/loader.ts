/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IndexedDocument } from './types.ts';
import { PRECOMPILED_CHUNKS } from '../processor/precompiledData.ts';

/**
 * Loads processed documents from generated/documents/
 * Uses fs/path in Node.js runtime, falls back to PRECOMPILED_CHUNKS in browser.
 */
export function loadProcessedDocuments(): IndexedDocument[] {
  // If running in Node.js server environment, read live from generated/documents
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
      const getModule = (process as any).getBuiltinModule;
      const fs = getModule ? getModule('fs') : null;
      const path = getModule ? getModule('path') : null;
      if (!fs || !path) throw new Error('fs or path not available');
      const docsDir = path.resolve(process.cwd(), 'generated', 'documents');

      if (fs.existsSync(docsDir)) {
        const files = fs.readdirSync(docsDir);
        const docs: IndexedDocument[] = [];
        const seenIds = new Set<string>();

        // Prefer chunk-*.json files
        const chunkFiles = files.filter((f: string) => f.startsWith('chunk-') && f.endsWith('.json')).sort();
        
        if (chunkFiles.length > 0) {
          for (const chunkFile of chunkFiles) {
            const filePath = path.join(docsDir, chunkFile);
            const content = fs.readFileSync(filePath, 'utf-8');
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed.documents)) {
              for (const doc of parsed.documents) {
                if (!seenIds.has(doc.id)) {
                  seenIds.add(doc.id);
                  docs.push(normalizeLoadedDocument(doc));
                }
              }
            }
          }
          if (docs.length > 0) {
            return docs;
          }
        }

        // Fallback to documents.jsonl
        const jsonlPath = path.join(docsDir, 'documents.jsonl');
        if (fs.existsSync(jsonlPath)) {
          const lines = fs.readFileSync(jsonlPath, 'utf-8').trim().split('\n');
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const doc = JSON.parse(line);
              if (!seenIds.has(doc.id)) {
                seenIds.add(doc.id);
                docs.push(normalizeLoadedDocument(doc));
              }
            } catch (e) {
              // skip malformed line
            }
          }
          if (docs.length > 0) {
            return docs;
          }
        }
      }
    } catch (err) {
      console.warn('Node.js fs load from generated/documents failed, using precompiled fallback:', err);
    }
  }

  // Precompiled fallback (works in both browser & Node)
  const docs: IndexedDocument[] = [];
  const seenIds = new Set<string>();

  for (const chunk of PRECOMPILED_CHUNKS) {
    if (chunk && Array.isArray(chunk.documents)) {
      for (const doc of chunk.documents) {
        if (!seenIds.has(doc.id)) {
          seenIds.add(doc.id);
          docs.push(normalizeLoadedDocument(doc));
        }
      }
    }
  }

  return docs;
}

export function normalizeLoadedDocument(doc: any): IndexedDocument {
  return {
    id: doc.id || `doc-${Math.random().toString(36).slice(2, 9)}`,
    url: doc.url || doc.canonicalUrl || '',
    canonicalUrl: doc.canonicalUrl || doc.url || '',
    domain: doc.domain || extractDomain(doc.canonicalUrl || doc.url || ''),
    title: doc.title || 'Untitled Document',
    description: doc.description || '',
    headings: {
      h1: Array.isArray(doc.headings?.h1) ? doc.headings.h1 : [],
      h2: Array.isArray(doc.headings?.h2) ? doc.headings.h2 : [],
      h3: Array.isArray(doc.headings?.h3) ? doc.headings.h3 : [],
    },
    mainText: doc.mainText || '',
    language: doc.language || 'en',
    category: doc.category || 'General',
    categoryConfidence: typeof doc.categoryConfidence === 'number' ? doc.categoryConfidence : 0.8,
    categorySignals: Array.isArray(doc.categorySignals) ? doc.categorySignals : [],
    wordCount: doc.wordCount || (doc.mainText ? doc.mainText.split(/\s+/).length : 0),
    contentLengthBytes: doc.contentLengthBytes,
    statusCode: doc.statusCode || 200,
    fetchTimeMs: doc.fetchTimeMs || 20,
    processedAt: doc.processedAt || new Date().toISOString(),
    chunkId: doc.chunkId || 'chunk-001',
  };
}

function extractDomain(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return 'web';
  }
}
