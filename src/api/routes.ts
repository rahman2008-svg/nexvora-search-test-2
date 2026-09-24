/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { searchRouter } from './searchRouter.ts';
import { nexvoraEngine } from '../indexing/nexvoraIndex.ts';
import { SearchQuery, SearchResponse, SuggestionItem } from '../types/search.ts';
import { SearchService } from '../services/searchService.ts';

export { searchRouter };

export interface ApiSearchQueryParams {
  q?: string;
  category?: string;
  page?: string | number;
  pageSize?: string | number;
  timeFilter?: string;
  sortBy?: string;
}

export async function handleSearchRequest(params: ApiSearchQueryParams): Promise<SearchResponse> {
  const query: SearchQuery = {
    q: params.q || '',
    category: (params.category as any) || 'all',
    page: params.page ? parseInt(String(params.page), 10) : 1,
    pageSize: params.pageSize ? parseInt(String(params.pageSize), 10) : 10,
    timeFilter: (params.timeFilter as any) || 'all',
    sortBy: (params.sortBy as any) || 'relevance',
  };

  return await SearchService.executeSearch(query);
}

export function handleSuggestionsRequest(prefix: string): { suggestions: SuggestionItem[] } {
  const suggestions = SearchService.getSuggestions(prefix);
  return { suggestions };
}

export function handleIndexStatsRequest() {
  return nexvoraEngine.getStats();
}
