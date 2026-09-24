/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { IndexedDocument } from './types.ts';
import { normalizeLoadedDocument } from './loader.ts';

/**
 * Server-only loader for Vercel/Node runtimes.
 *
 * Loads the complete generated corpus from:
 * generated/documents/documents.jsonl
 *
 * Falls back to chunk files when JSONL is unavailable.
 */
export function loadServerDocuments(): IndexedDocument[] {
  const docsDir = resolve(process.cwd(), 'generated', 'documents');

  if (!existsSync(docsDir)) {
    throw new Error(`Generated documents directory not found: ${docsDir}`);
  }

  const jsonlPath = join(docsDir, 'documents.jsonl');

  if (existsSync(jsonlPath)) {
    const content = readFileSync(jsonlPath, 'utf-8');
    const docs: IndexedDocument[] = [];
    const seenIds = new Set<string>();

    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();

      if (!trimmed) {
        continue;
      }

      try {
        const parsed = JSON.parse(trimmed);

        if (!parsed || typeof parsed !== 'object') {
          continue;
        }

        const normalized = normalizeLoadedDocument(parsed);

        if (seenIds.has(normalized.id)) {
          continue;
        }

        seenIds.add(normalized.id);
        docs.push(normalized);
      } catch {
        // Ignore malformed lines.
      }
    }

    if (docs.length > 0) {
      return docs;
    }
  }

  const files = readdirSync(docsDir)
    .filter(
      (file) => file.startsWith('chunk-') && file.endsWith('.json')
    )
    .sort();

  const docs: IndexedDocument[] = [];
  const seenIds = new Set<string>();

  for (const chunkFile of files) {
    try {
      const parsed = JSON.parse(
        readFileSync(join(docsDir, chunkFile), 'utf-8')
      );

      if (!parsed || !Array.isArray(parsed.documents)) {
        continue;
      }

      for (const doc of parsed.documents) {
        const normalized = normalizeLoadedDocument(doc);

        if (seenIds.has(normalized.id)) {
          continue;
        }

        seenIds.add(normalized.id);
        docs.push(normalized);
      }
    } catch {
      // Skip malformed chunks.
    }
  }

  if (docs.length === 0) {
    throw new Error('No generated documents could be loaded.');
  }

  return docs;
}
