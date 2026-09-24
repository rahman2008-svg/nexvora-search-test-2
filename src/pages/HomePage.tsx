/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Logo } from '../components/Logo.tsx';
import { SearchBox } from '../components/SearchBox.tsx';
import { 
  ShieldCheck, 
  Zap, 
  Database, 
  Compass, 
  Sparkles, 
  GitBranch, 
  BookOpen, 
  Code2, 
  ArrowRight,
  Shuffle
} from 'lucide-react';
import { SearchService } from '../services/searchService.ts';

interface HomePageProps {
  onSearch: (query: string) => void;
  onNavigate: (path: string) => void;
}

const FEATURED_TOPICS = [
  { label: 'BM25 Algorithm', query: 'BM25 algorithm ranking' },
  { label: 'React 19 Features', query: 'React 19 architecture' },
  { label: 'Linux Kernel Git', query: 'Linux kernel git repository' },
  { label: 'Rust Memory Safety', query: 'Rust memory safety borrow checker' },
  { label: 'Signal Encryption', query: 'Signal protocol double ratchet' },
  { label: 'SQLite Architecture', query: 'SQLite database internals' },
  { label: 'HTTP 404 Status', query: 'http 404' },
];

export const HomePage: React.FC<HomePageProps> = ({ onSearch, onNavigate }) => {
  const stats = SearchService.getIndexStats();

  const handleFeelingLucky = () => {
    const randomTopic = FEATURED_TOPICS[Math.floor(Math.random() * FEATURED_TOPICS.length)];
    onSearch(randomTopic.query);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-10 sm:py-16 max-w-5xl mx-auto w-full">
      {/* Central Brand Emblem */}
      <div className="flex flex-col items-center text-center mb-8 sm:mb-10 group cursor-default">
        <Logo size="xl" showTagline={false} />
        <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-lg font-normal">
          The independent, privacy-first web index. Pure relevancy, zero profiling.
        </p>
      </div>

      {/* Main Search Input Box */}
      <div className="w-full max-w-2xl mb-5">
        <SearchBox
          size="large"
          autoFocus={true}
          onSearch={onSearch}
          placeholder="Search documentation, open source, articles, or calculate..."
        />
      </div>

      {/* Search Buttons row */}
      <div className="flex items-center gap-3 mb-8">
        <button
          type="button"
          onClick={() => {
            const input = document.querySelector('input[type="text"]') as HTMLInputElement;
            if (input && input.value.trim()) {
              onSearch(input.value.trim());
            } else {
              onSearch('BM25');
            }
          }}
          className="px-5 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200/80 dark:hover:bg-slate-750 border border-slate-200/80 dark:border-slate-700/80 shadow-xs transition-colors"
        >
          NexVora Search
        </button>

        <button
          type="button"
          onClick={handleFeelingLucky}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200/80 dark:hover:bg-slate-750 border border-slate-200/80 dark:border-slate-700/80 shadow-xs transition-colors"
        >
          <Shuffle className="w-3.5 h-3.5 text-indigo-500" />
          <span>I&rsquo;m Feeling Lucky</span>
        </button>
      </div>

      {/* Quick Explore Chips */}
      <div className="w-full max-w-2xl mb-12">
        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 mb-2.5">
          <Sparkles className="w-3.5 h-3.5 text-sky-500" />
          <span>EXPLORE INDEX TOPICS</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {FEATURED_TOPICS.map((topic) => (
            <button
              key={topic.label}
              onClick={() => onSearch(topic.query)}
              className="px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-400 dark:hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400 shadow-xs transition-all"
            >
              {topic.label}
            </button>
          ))}
        </div>
      </div>

      {/* Three Pillars: Independent, Private, BM25 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 w-full max-w-4xl pt-6 border-t border-slate-200/70 dark:border-slate-800/70">
        {/* Pillar 1 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3 border border-sky-100 dark:border-sky-900">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">
            BM25 Ranking Core
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Deterministic probabilistic relevance scoring with document length normalization and zero commercial ad bidding.
          </p>
        </div>

        {/* Pillar 2 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 border border-emerald-100 dark:border-emerald-900">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">
            Zero Tracking Ever
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Your searches remain strictly private. No cross-site profiling, no telemetry beacons, and no sold search histories.
          </p>
        </div>

        {/* Pillar 3 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 border border-indigo-100 dark:border-indigo-900">
            <GitBranch className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">
            Phase 1 Foundation
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Clean architectural separation for upcoming automatic processing, GitHub ingestion, and scalable web indexing.
          </p>
        </div>
      </div>

      {/* Live Index Status Banner */}
      <div className="mt-8 flex items-center gap-3 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Index active: {stats.totalDocuments} primary documents &bull; {stats.totalTerms} distinct tokens indexed</span>
      </div>
    </div>
  );
};
