/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { SearchDocument } from '../types/search.ts';
import { X, ExternalLink, Globe, Tag, Calendar, User, Copy, Check } from 'lucide-react';

interface PreviewModalProps {
  document: SearchDocument | null;
  onClose: () => void;
  onNavigateInternal?: (path: string) => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  document,
  onClose,
  onNavigateInternal,
}) => {
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!document) return null;

  const isInternal = document.url.startsWith('/');
  const absoluteUrl = isInternal ? `${window.location.origin}${document.url}` : document.url;

  const handleCopy = () => {
    navigator.clipboard.writeText(absoluteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenSource = () => {
    if (isInternal && onNavigateInternal) {
      onClose();
      onNavigateInternal(document.url);
    } else {
      window.open(document.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-200 dark:border-slate-800 gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-sky-600 dark:text-sky-400">
                {document.displayUrl}
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {document.category}
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
              {document.title}
            </h3>
          </div>

          <button
            onClick={onClose}
            aria-label="Close preview"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Main Snippet */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Summary
            </h4>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-base">
              {document.snippet}
            </p>
          </div>

          {/* Deep Index Passage */}
          {document.bodyText && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Indexed Content Passage
              </h4>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                {document.bodyText}
              </div>
            </div>
          )}

          {/* Metadata badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {document.publishedDate && (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Indexed Date: {document.publishedDate}</span>
              </div>
            )}
            {document.authorOrOrg && (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <User className="w-4 h-4 text-slate-400" />
                <span>Source: {document.authorOrOrg}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {document.tags.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                <Tag className="w-3.5 h-3.5" />
                <span>Index Keywords</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {document.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Copied URL</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span>Copy Source URL</span>
              </>
            )}
          </button>

          <button
            onClick={handleOpenSource}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 transition-colors shadow-xs"
          >
            <span>Visit Web Resource</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
