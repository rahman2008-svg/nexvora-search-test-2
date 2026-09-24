/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Logo } from './Logo.tsx';
import { ThemeToggle } from './ThemeToggle.tsx';
import { Shield, Sparkles, Compass } from 'lucide-react';

interface HeaderProps {
  currentPath?: string;
  onNavigate: (path: string) => void;
  showSearchBar?: boolean;
  searchBarSlot?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  currentPath = '/',
  onNavigate,
  showSearchBar = false,
  searchBarSlot,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo and optional embedded search box */}
        <div className="flex items-center gap-6 min-w-0">
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center focus:outline-none focus:ring-2 focus:ring-sky-500 rounded-xl p-1 -ml-1 text-left"
          >
            <Logo size={showSearchBar ? 'sm' : 'md'} />
          </button>

          {/* If on search results page, display the compact search bar in the header */}
          {showSearchBar && searchBarSlot && (
            <div className="hidden sm:block flex-1 max-w-2xl min-w-[320px]">
              {searchBarSlot}
            </div>
          )}
        </div>

        {/* Right side navigation & controls */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Privacy badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60">
            <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Zero Tracking</span>
          </div>

          <nav className="flex items-center gap-1 sm:gap-2 text-sm font-medium">
            <button
              onClick={() => onNavigate('/sources')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                currentPath === '/sources'
                  ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <span>Sources</span>
            </button>
            <button
              onClick={() => onNavigate('/about')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                currentPath === '/about'
                  ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              About
            </button>
            <button
              onClick={() => onNavigate('/privacy')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                currentPath === '/privacy'
                  ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              Privacy
            </button>
          </nav>

          <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800" />

          <ThemeToggle />
        </div>
      </div>

      {/* Mobile search bar if on search page */}
      {showSearchBar && searchBarSlot && (
        <div className="sm:hidden px-4 pb-3 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
          {searchBarSlot}
        </div>
      )}
    </header>
  );
};
