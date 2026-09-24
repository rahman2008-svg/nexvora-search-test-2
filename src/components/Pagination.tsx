/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <nav
      role="navigation"
      aria-label="Pagination Navigation"
      className="flex items-center justify-center gap-1.5 sm:gap-2 my-8 pt-6 border-t border-slate-200/80 dark:border-slate-800/80"
    >
      {/* Previous Button */}
      <button
        onClick={handlePrev}
        disabled={currentPage <= 1}
        aria-label="Previous Page"
        className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Previous</span>
      </button>

      {/* Numbered Page Buttons */}
      <div className="flex items-center gap-1">
        {getPageNumbers().map((p, index) => {
          if (p === '...') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-2 py-1 text-slate-400 dark:text-slate-600 font-mono text-sm select-none"
              >
                ...
              </span>
            );
          }

          const pageNum = p as number;
          const isActive = pageNum === currentPage;

          return (
            <button
              key={`page-${pageNum}`}
              onClick={() => {
                onPageChange(pageNum);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              aria-current={isActive ? 'page' : undefined}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {pageNum}
            </button>
          );
        })}
      </div>

      {/* Next Button */}
      <button
        onClick={handleNext}
        disabled={currentPage >= totalPages}
        aria-label="Next Page"
        className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
};
