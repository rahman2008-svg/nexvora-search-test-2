/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SearchDocument } from '../types/search.ts';
import { ExternalLink, Copy, Check, Eye, Globe, GitBranch, FileCode, BookOpen, ShieldCheck, Activity, ChevronDown, ChevronUp, Zap } from 'lucide-react';

interface ResultCardProps {
  document: SearchDocument;
  onPreview: (doc: SearchDocument) => void;
  onNavigateInternal?: (path: string) => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  document,
  onPreview,
  onNavigateInternal,
}) => {
  const [copied, setCopied] = useState(false);
  const [showRelevance, setShowRelevance] = useState(false);

  const isInternalUrl = document.url.startsWith('/');
  const relevance = document.relevance;

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const finalUrl = isInternalUrl ? `${window.location.origin}${document.url}` : document.url;
    navigator.clipboard.writeText(finalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTitleClick = (e: React.MouseEvent) => {
    if (isInternalUrl && onNavigateInternal) {
      e.preventDefault();
      onNavigateInternal(document.url);
    }
  };

  // Select appropriate source icon
  const getSourceIcon = () => {
    switch (document.sourceType) {
      case 'github':
        return <GitBranch className="w-3.5 h-3.5 text-slate-500" />;
      case 'documentation':
        return <FileCode className="w-3.5 h-3.5 text-sky-500" />;
      case 'research':
        return <BookOpen className="w-3.5 h-3.5 text-indigo-500" />;
      default:
        return <Globe className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  // Category label styling
  const categoryStyles: Record<string, string> = {
    tech: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/50',
    programming: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50',
    education: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50',
    science: 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/50',
    opensource: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50',
    docs: 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/50',
    knowledge: 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/50',
    news: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50',
    business: 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/50',
    sports: 'bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/50',
    entertainment: 'bg-pink-50 dark:bg-pink-950/50 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800/50',
    health: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/50',
    travel: 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/50',
    web: 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800',
  };

  return (
    <article className="group relative p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 hover:border-sky-300 dark:hover:border-sky-600/60 shadow-xs hover:shadow-md transition-all duration-200">
      {/* Top domain breadcrumb + category tag */}
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
            {getSourceIcon()}
          </div>
          <span className="text-xs font-mono text-slate-600 dark:text-slate-400 truncate max-w-[280px] sm:max-w-md">
            {document.displayUrl}
          </span>
          {isInternalUrl && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.2 rounded bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
              <ShieldCheck className="w-2.5 h-2.5" />
              NexVora Direct
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* BM25 Final Score Badge */}
          {relevance && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <Zap className="w-2.5 h-2.5 text-amber-500" />
              Rank: {relevance.finalScore.toFixed(1)}
            </span>
          )}

          {/* Category Badge */}
          <span
            className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
              categoryStyles[document.category] || categoryStyles.web
            }`}
          >
            {document.category}
          </span>
        </div>
      </div>

      {/* Result Title */}
      <h2 className="text-lg sm:text-xl font-bold tracking-tight text-sky-700 dark:text-sky-400 group-hover:text-sky-800 dark:group-hover:text-sky-300 leading-snug mb-2">
        <a
          href={document.url}
          target={isInternalUrl ? undefined : '_blank'}
          rel={isInternalUrl ? undefined : 'noopener noreferrer'}
          onClick={handleTitleClick}
          className="hover:underline flex items-baseline gap-1.5"
          dangerouslySetInnerHTML={{ __html: document.highlightedTitle || document.title }}
        />
      </h2>

      {/* Snippet with highlighted match terms */}
      <p
        className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-3 mb-3.5"
        dangerouslySetInnerHTML={{ __html: document.highlightedSnippet || document.snippet }}
      />

      {/* Expanded Relevance Breakdown Panel */}
      {relevance && showRelevance && (
        <div className="mb-3.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs">
          <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-200 mb-2">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-sky-500" />
              Ranking Signals & BM25 Scoring Breakdown
            </span>
            <span className="font-mono text-sky-600 dark:text-sky-400">
              Final Score: {relevance.finalScore.toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
            <div className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-400">BM25 Base: </span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{relevance.bm25Score.toFixed(2)}</span>
            </div>
            <div className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-400">Exact Match: </span>
              <span className={`font-bold ${relevance.exactMatchBoost > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                +{relevance.exactMatchBoost.toFixed(1)}
              </span>
            </div>
            <div className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-400">Title Boost: </span>
              <span className={`font-bold ${relevance.titleBoost > 0 ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`}>
                +{relevance.titleBoost.toFixed(1)}
              </span>
            </div>
            <div className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-400">URL Boost: </span>
              <span className={`font-bold ${relevance.urlBoost > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                +{relevance.urlBoost.toFixed(1)}
              </span>
            </div>
            <div className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-400">Desc Boost: </span>
              <span className={`font-bold ${relevance.descriptionBoost > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                +{relevance.descriptionBoost.toFixed(1)}
              </span>
            </div>
            <div className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-400">Category Boost: </span>
              <span className={`font-bold ${relevance.categoryBoost > 0 ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`}>
                +{relevance.categoryBoost.toFixed(1)}
              </span>
            </div>
          </div>

          {relevance.matchedFields && relevance.matchedFields.length > 0 && (
            <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
              <span>Matched Fields:</span>
              {relevance.matchedFields.map(f => (
                <span key={f} className="px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-700/60 font-mono text-[10px]">
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer bar with meta tags and quick actions */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3">
          {document.publishedDate && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {document.publishedDate}
            </span>
          )}
          {document.authorOrOrg && (
            <span className="hidden sm:inline-block text-[11px] font-medium text-slate-500 dark:text-slate-400">
              via {document.authorOrOrg}
            </span>
          )}

          {relevance && (
            <button
              type="button"
              onClick={() => setShowRelevance(!showRelevance)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
            >
              <span>Ranking Signals</span>
              {showRelevance ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onPreview(document)}
            title="Read summary preview"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs">Preview</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            title={copied ? 'Link copied!' : 'Copy link'}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs text-emerald-600 dark:text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs">Copy</span>
              </>
            )}
          </button>

          <a
            href={document.url}
            target={isInternalUrl ? undefined : '_blank'}
            rel={isInternalUrl ? undefined : 'noopener noreferrer'}
            onClick={handleTitleClick}
            title="Open in new tab"
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </article>
  );
};
