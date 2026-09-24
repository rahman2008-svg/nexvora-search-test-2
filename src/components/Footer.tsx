/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Shield, Sparkles, Database, FileText, Globe } from 'lucide-react';
import { getAppOrigin } from '../utils/url.ts';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const origin = getAppOrigin();

  return (
    <footer className="w-full mt-auto border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/50 text-xs text-slate-500 dark:text-slate-400 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-200/60 dark:border-slate-800/60">
          {/* Mission statement & origin */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              NexVora Search
            </span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <Shield className="w-3.5 h-3.5" />
              Independent Index & Zero Telemetry
            </span>
            {origin && (
              <>
                <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
                <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-xs">
                  {origin}
                </span>
              </>
            )}
          </div>

          {/* Core specs pill */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60 font-mono text-[11px]">
              <Database className="w-3 h-3" />
              BM25 Probabilistic Ranking
            </span>
          </div>
        </div>

        {/* Links row */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 dark:text-slate-500 text-center sm:text-left">
            &copy; {new Date().getFullYear()} NexVora. An independent, privacy-first search engine.
          </p>

          <nav className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 font-medium">
            <button
              onClick={() => onNavigate('/')}
              className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              Search
            </button>
            <button
              onClick={() => onNavigate('/sources')}
              className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              Sources
            </button>
            <button
              onClick={() => onNavigate('/about')}
              className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              About
            </button>
            <button
              onClick={() => onNavigate('/privacy')}
              className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              Privacy Policy
            </button>
            <a
              href="/robots.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors flex items-center gap-1"
            >
              <FileText className="w-3 h-3" />
              <span>robots.txt</span>
            </a>
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors flex items-center gap-1"
            >
              <Globe className="w-3 h-3" />
              <span>sitemap.xml</span>
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
};
