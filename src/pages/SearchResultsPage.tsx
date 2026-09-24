/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  SearchQuery, 
  SearchResponse, 
  SearchDocument, 
  DocumentCategory, 
  TimeFilter, 
  SortOrder 
} from '../types/search.ts';
import { SearchService } from '../services/searchService.ts';
import { ResultCard } from '../components/ResultCard.tsx';
import { QuickAnswerCard } from '../components/QuickAnswerCard.tsx';
import { Pagination } from '../components/Pagination.tsx';
import { FilterBar } from '../components/FilterBar.tsx';
import { SkeletonLoader } from '../components/SkeletonLoader.tsx';
import { EmptyState } from '../components/EmptyState.tsx';
import { PreviewModal } from '../components/PreviewModal.tsx';
import { Search, AlertCircle, Sparkles, Clock, ArrowRight } from 'lucide-react';

interface SearchResultsPageProps {
  initialQuery: string;
  initialCategory?: DocumentCategory;
  initialPage?: number;
  onSearchChange: (query: string, page?: number, category?: DocumentCategory) => void;
  onNavigateInternal: (path: string) => void;
}

export const SearchResultsPage: React.FC<SearchResultsPageProps> = ({
  initialQuery,
  initialCategory = 'all',
  initialPage = 1,
  onSearchChange,
  onNavigateInternal,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<DocumentCategory>(initialCategory);
  const [page, setPage] = useState<number>(initialPage);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [sortBy, setSortBy] = useState<SortOrder>('relevance');

  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<SearchDocument | null>(null);

  // Sync state if props change from outside (e.g. back button navigation)
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    setPage(initialPage);
  }, [initialPage]);

  // Execute search
  const performSearch = useCallback(async () => {
    if (!query.trim()) {
      setResponse(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await SearchService.executeSearch({
        q: query,
        category,
        page,
        pageSize: 10,
        timeFilter,
        sortBy,
      });

      setResponse(res);
      // Update browser document title
      document.title = `${query} – NexVora Search`;
    } catch (err: any) {
      console.error('Search query failed:', err);
      setError('An unexpected error occurred while querying the NexVora index. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [query, category, page, timeFilter, sortBy]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  const handleCategorySelect = (newCat: DocumentCategory) => {
    setCategory(newCat);
    setPage(1);
    onSearchChange(query, 1, newCat);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    onSearchChange(query, newPage, category);
  };

  const handleRelatedSearchClick = (relatedQuery: string) => {
    setQuery(relatedQuery);
    setPage(1);
    onSearchChange(relatedQuery, 1, category);
  };

  const handleReset = () => {
    setQuery('');
    setCategory('all');
    setPage(1);
    onSearchChange('', 1, 'all');
  };

  return (
    <div className="flex-1 flex flex-col w-full">
      {/* Category and Sub-filter Bar */}
      <FilterBar
        activeCategory={category}
        onSelectCategory={handleCategorySelect}
        timeFilter={timeFilter}
        onChangeTimeFilter={(tf) => {
          setTimeFilter(tf);
          setPage(1);
        }}
        sortBy={sortBy}
        onChangeSortBy={(sb) => {
          setSortBy(sb);
          setPage(1);
        }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold">{error}</p>
              <button
                onClick={performSearch}
                className="mt-2 text-xs font-semibold underline hover:no-underline"
              >
                Retry Search
              </button>
            </div>
          </div>
        )}

        {/* Results Metadata Line */}
        {!isLoading && response && (
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-5">
            <div>
              <span>
                About {response.totalResults.toLocaleString()} {response.totalResults === 1 ? 'result' : 'results'}
              </span>
              <span className="mx-1.5">&bull;</span>
              <span className="font-mono text-slate-400 dark:text-slate-500">
                ({(response.tookMs / 1000).toFixed(3)} seconds)
              </span>
            </div>

            {response.totalPages > 1 && (
              <span className="hidden sm:inline">
                Page {response.page} of {response.totalPages}
              </span>
            )}
          </div>
        )}

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Search Results Column */}
          <div className="lg:col-span-8 space-y-4">
            {isLoading ? (
              <SkeletonLoader />
            ) : response && response.results.length > 0 ? (
              <>
                {/* Instant Quick Answer Box (if triggered on page 1) */}
                {response.quickAnswer && (
                  <QuickAnswerCard answer={response.quickAnswer} />
                )}

                {/* Search Result Cards */}
                <div className="space-y-4">
                  {response.results.map((doc) => (
                    <ResultCard
                      key={doc.id}
                      document={doc}
                      onPreview={(d) => setPreviewDoc(d)}
                      onNavigateInternal={onNavigateInternal}
                    />
                  ))}
                </div>

                {/* Related Searches Section */}
                {response.relatedSearches.length > 0 && (
                  <div className="mt-8 p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                      <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                      <span>Related Inquiries</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {response.relatedSearches.map((rel) => (
                        <button
                          key={rel}
                          onClick={() => handleRelatedSearchClick(rel)}
                          className="flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-sky-950/50 hover:text-sky-600 dark:hover:text-sky-400 border border-slate-200/60 dark:border-slate-800/60 transition-colors"
                        >
                          <span className="truncate">{rel}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pagination Controls */}
                <Pagination
                  currentPage={response.page}
                  totalPages={response.totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            ) : (
              <EmptyState
                query={query}
                onSelectQuery={(q) => {
                  setQuery(q);
                  setPage(1);
                  onSearchChange(q, 1, category);
                }}
                onReset={handleReset}
              />
            )}
          </div>

          {/* Right Rail: Index Insights & Privacy Highlights */}
          <aside className="lg:col-span-4 space-y-5">
            {/* NexVora Index Guarantee Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                <span>Independent Indexing</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                NexVora operates its own probabilistic BM25 ranking algorithm. Search results are generated strictly by term frequency, document length normalization, and semantic field weights.
              </p>
              <div className="space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex items-center justify-between">
                  <span>Engine:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">NexVora BM25 v1</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Indexed Documents:</span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {SearchService.getIndexStats().totalDocuments} docs
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Inverted Index Terms:</span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {SearchService.getIndexStats().totalTerms} terms
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Algorithm:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">Okapi BM25 + Multi-Signal</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Telemetry:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Zero / None</span>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800/70 text-xs text-slate-600 dark:text-slate-400">
              <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Keyboard Shortcuts
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Focus search input</span>
                  <kbd className="px-1.5 py-0.5 font-mono text-[10px] rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    /
                  </kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span>Quick command</span>
                  <kbd className="px-1.5 py-0.5 font-mono text-[10px] rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    Ctrl + K
                  </kbd>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Document Reading Preview Modal */}
      <PreviewModal
        document={previewDoc}
        onClose={() => setPreviewDoc(null)}
        onNavigateInternal={onNavigateInternal}
      />
    </div>
  );
};
