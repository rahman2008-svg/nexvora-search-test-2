/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SearchDocument } from '../types/search.ts';
import { BM25Index } from './bm25.ts';

/**
 * Interface for ingestion pipelines in later phases (e.g. GitHub repos, RSS feeds, web crawlers).
 */
export interface IndexDataSource {
  name: string;
  fetchDocuments(): Promise<SearchDocument[]>;
}

export class SearchPipeline {
  private index: BM25Index;
  private sources: IndexDataSource[] = [];
  private isInitialized = false;

  constructor(indexInstance?: BM25Index) {
    this.index = indexInstance || new BM25Index();
  }

  public registerSource(source: IndexDataSource): void {
    this.sources.push(source);
  }

  public async syncAllSources(): Promise<number> {
    let totalAdded = 0;
    for (const source of this.sources) {
      try {
        const docs = await source.fetchDocuments();
        this.index.addDocuments(docs);
        totalAdded += docs.length;
      } catch (err) {
        console.error(`Failed to ingest from source ${source.name}:`, err);
      }
    }
    return totalAdded;
  }

  public getIndex(): BM25Index {
    return this.index;
  }
}
