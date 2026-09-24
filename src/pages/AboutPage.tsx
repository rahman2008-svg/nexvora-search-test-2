/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Logo } from '../components/Logo.tsx';
import { 
  ShieldCheck, 
  Cpu, 
  GitBranch, 
  Database, 
  Terminal, 
  Layers, 
  ArrowLeft,
  Search,
  CheckCircle2
} from 'lucide-react';
import { getAppOrigin } from '../utils/url.ts';

interface AboutPageProps {
  onNavigate: (path: string) => void;
  onSearch: (q: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate, onSearch }) => {
  const origin = getAppOrigin();

  return (
    <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      {/* Back button */}
      <button
        onClick={() => onNavigate('/')}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Search</span>
      </button>

      {/* Hero Header */}
      <div className="mb-10 text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800 mb-4">
          <Cpu className="w-3.5 h-3.5" />
          <span>Independent Web Index Architecture</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
          About NexVora Search
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
          NexVora is built from the ground up as a fast, autonomous search engine. We believe search should be a direct lookup utility, not a behavioral tracking machine.
        </p>
      </div>

      {/* Mission Section */}
      <div className="prose dark:prose-invert max-w-none space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed">
        <section className="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <span>Why Build an Independent Search Engine?</span>
          </h2>
          <p className="text-sm sm:text-base leading-relaxed mb-4">
            Over 90% of global web searches are controlled by a tiny handful of advertising corporations whose algorithms prioritize sponsored listings, ad retargeting, and affiliate SEO farms over genuine technical merit.
          </p>
          <p className="text-sm sm:text-base leading-relaxed">
            NexVora offers an alternative: a clean, responsive, and privacy-preserving index with authentic technical rankings. Every search query runs on our internal index, never proxying your thoughts to Google, Bing, or third-party ad networks.
          </p>
        </section>

        {/* Technical Architecture */}
        <section className="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-sky-500" />
            <span>How NexVora Ranking Works (BM25 Core)</span>
          </h2>
          <p className="text-sm sm:text-base leading-relaxed mb-4">
            At the heart of NexVora is the <strong>Okapi BM25</strong> probabilistic information retrieval model. Instead of black-box engagement ranking that incentivizes clickbait, BM25 scores content based on term frequency ($tf$), document length normalization, and inverse document frequency ($idf$).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400">01. Term Saturation (k1)</span>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Prevents spam keyword stuffing from artificially inflating a document&rsquo;s relevance score.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400">02. Length Normalization (b)</span>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Penalizes unnaturally verbose pages while fairly rewarding concise, authoritative answers.
              </p>
            </div>
          </div>
        </section>

        {/* Multi-Phase Roadmap */}
        <section className="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-indigo-500" />
            <span>Phase 1 Architecture & Future Phases</span>
          </h2>
          <p className="text-sm sm:text-base leading-relaxed mb-4">
            Phase 1 establishes our high-speed frontend, search UX, pagination, autocomplete suggestions, instant answer resolution, and dynamic origin routing. The architecture cleanly isolates the UI components, search logic, API routes, and data ingestion pipeline.
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 dark:text-white">Phase 1 (Active):</strong> Modern web UI, sub-millisecond BM25 ranking, instant calculator/definitions, dynamic domain routing, robots.txt, and sitemap.
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <Layers className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 dark:text-white">Phase 2 (Upcoming):</strong> GitHub source ingestion, automatic README parsing, release note indexing, and technical package cataloging.
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <Terminal className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 dark:text-white">Phase 3 (Upcoming):</strong> Distributed web spider, robots policy compliance, and automated inverted index sync.
              </div>
            </div>
          </div>
        </section>

        {/* Current Origin & Domain Neutrality */}
        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900/40 text-xs text-slate-500 dark:text-slate-400 font-mono flex items-center justify-between">
          <span>Current Deployment Origin:</span>
          <span className="text-sky-600 dark:text-sky-400 font-semibold">{origin || 'Self-hosted origin'}</span>
        </div>

        {/* Call to Action */}
        <div className="text-center pt-6">
          <button
            onClick={() => onSearch('BM25')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 shadow-lg shadow-sky-600/25 transition-all"
          >
            <Search className="w-4 h-4" />
            <span>Search the NexVora Index</span>
          </button>
        </div>
      </div>
    </div>
  );
};
