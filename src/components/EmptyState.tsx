/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SearchX, Lightbulb, Compass, RotateCcw } from 'lucide-react';

interface EmptyStateProps {
  query: string;
  onSelectQuery: (q: string) => void;
  onReset: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  query,
  onSelectQuery,
  onReset,
}) => {
  const suggestedQueries = [
    'BM25 algorithm',
    'React 19',
    'Linux kernel git',
    'Rust memory safety',
    'Docker containerization',
    'SQLite internals',
    'HTTP status codes',
  ];

  return (
    <div className="py-12 px-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-center max-w-2xl mx-auto shadow-xs">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center mx-auto mb-4 text-amber-500">
        <SearchX className="w-7 h-7" />
      </div>

      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
        No matches found for &ldquo;<span className="text-sky-600 dark:text-sky-400">{query}</span>&rdquo;
      </h3>

      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto leading-relaxed">
        Our independent BM25 index didn&rsquo;t find an exact match. Try adjusting your terms or exploring the curated topics below.
      </p>

      {/* Helpful Search Tips */}
      <div className="text-left bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span>Search Tips</span>
        </div>
        <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside">
          <li>Ensure all words are spelled correctly.</li>
          <li>Try broader keywords (e.g. &ldquo;Linux&rdquo; instead of &ldquo;Linux VFS inode allocation&rdquo;).</li>
          <li>Remove special punctuation or filters that might restrict results.</li>
        </ul>
      </div>

      {/* Suggested Topic Buttons */}
      <div className="mb-6">
        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">
          <Compass className="w-3.5 h-3.5 text-sky-500" />
          <span>Try searching for:</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {suggestedQueries.map((item) => (
            <button
              key={item}
              onClick={() => onSelectQuery(item)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/50 hover:text-sky-600 dark:hover:text-sky-400 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onReset}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <RotateCcw className="w-4 h-4" />
        <span>Reset Search</span>
      </button>
    </div>
  );
};
