/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { QuickAnswer } from '../types/search.ts';
import { Calculator, BookOpen, Terminal, Sparkles, ExternalLink } from 'lucide-react';

interface QuickAnswerCardProps {
  answer: QuickAnswer;
}

export const QuickAnswerCard: React.FC<QuickAnswerCardProps> = ({ answer }) => {
  const getIcon = () => {
    switch (answer.type) {
      case 'calculation':
        return <Calculator className="w-5 h-5 text-indigo-500" />;
      case 'http_status':
      case 'code':
        return <Terminal className="w-5 h-5 text-emerald-500" />;
      case 'definition':
      default:
        return <Sparkles className="w-5 h-5 text-amber-500" />;
    }
  };

  return (
    <div className="p-4 sm:p-5 mb-5 rounded-2xl bg-gradient-to-br from-sky-50/80 via-white to-indigo-50/40 dark:from-slate-900 dark:via-slate-900/90 dark:to-indigo-950/30 border border-sky-200/80 dark:border-sky-800/60 shadow-xs">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
            {getIcon()}
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
              {answer.badge || 'Instant Answer'}
            </span>
          </div>
        </div>

        {answer.sourceUrl && (
          <a
            href={answer.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-sky-600 dark:hover:text-sky-400"
          >
            <span>{answer.sourceName || 'Source'}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-1">
        {answer.title}
      </h3>

      <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
        {answer.content}
      </p>

      {answer.subtext && (
        <p className="text-xs font-mono mt-2 p-2 rounded-lg bg-white/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
          {answer.subtext}
        </p>
      )}
    </div>
  );
};
