/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, ArrowRight, Clock, TrendingUp, Sparkles } from 'lucide-react';
import { SearchService } from '../services/searchService.ts';
import { SuggestionItem } from '../types/search.ts';

interface SearchBoxProps {
  initialValue?: string;
  onSearch: (query: string) => void;
  size?: 'large' | 'compact';
  autoFocus?: boolean;
  placeholder?: string;
}

export const SearchBox: React.FC<SearchBoxProps> = ({
  initialValue = '',
  onSearch,
  size = 'large',
  autoFocus = false,
  placeholder = 'Search independent web, dev docs, open source...',
}) => {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal state when initialValue changes from outside
  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  // Update suggestions when query changes
  useEffect(() => {
    if (isOpen) {
      const items = SearchService.getSuggestions(query);
      setSuggestions(items);
      setSelectedIndex(-1);
    }
  }, [query, isOpen]);

  // Global keyboard shortcut to focus search box: '/' or 'Ctrl+K' / 'Cmd+K'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '/' && document.activeElement !== inputRef.current) ||
          ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetQuery = selectedIndex >= 0 && suggestions[selectedIndex]
      ? suggestions[selectedIndex].text
      : query;

    if (targetQuery.trim()) {
      setIsOpen(false);
      inputRef.current?.blur();
      onSearch(targetQuery.trim());
    }
  };

  const handleSelectSuggestion = (text: string) => {
    setQuery(text);
    setIsOpen(false);
    onSearch(text.trim());
  };

  const handleRemoveRecent = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    SearchService.removeRecentSearch(text);
    setSuggestions(prev => prev.filter(s => s.text !== text));
  };

  const handleClear = () => {
    setQuery('');
    setSelectedIndex(-1);
    inputRef.current?.focus();
    const items = SearchService.getSuggestions('');
    setSuggestions(items);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const isLarge = size === 'large';

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative w-full group">
        <div
          className={`relative flex items-center w-full transition-all duration-200 rounded-2xl ${
            isLarge
              ? 'h-14 sm:h-16 px-4 sm:px-5 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700/80 shadow-lg shadow-slate-200/50 dark:shadow-slate-950/50 focus-within:border-sky-500 dark:focus-within:border-sky-400 focus-within:ring-4 focus-within:ring-sky-500/20'
              : 'h-11 px-3.5 bg-slate-100/90 dark:bg-slate-900/90 border border-slate-300/80 dark:border-slate-700/80 focus-within:border-sky-500 dark:focus-within:border-sky-400 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-2 focus-within:ring-sky-500/20'
          }`}
        >
          {/* Search Icon */}
          <Search
            className={`shrink-0 text-slate-400 dark:text-slate-500 group-focus-within:text-sky-500 dark:group-focus-within:text-sky-400 transition-colors ${
              isLarge ? 'w-6 h-6 mr-3' : 'w-4 h-4 mr-2.5'
            }`}
          />

          {/* Search Input */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            autoFocus={autoFocus}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => {
              setIsOpen(true);
              const items = SearchService.getSuggestions(query);
              setSuggestions(items);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            aria-label="Search"
            autoComplete="off"
            spellCheck="false"
            className={`w-full bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none font-normal ${
              isLarge ? 'text-lg sm:text-xl' : 'text-sm'
            }`}
          />

          {/* Clear Button */}
          {query && (
            <button
              type="button"
              onClick={handleClear}
              title="Clear search"
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors mr-1"
            >
              <X className={isLarge ? 'w-5 h-5' : 'w-4 h-4'} />
            </button>
          )}

          {/* Keyboard shortcut hint (only in large mode when empty) */}
          {isLarge && !query && (
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950/60 mr-2 select-none">
              <span>/</span>
            </div>
          )}

          {/* Submit Search Button */}
          {isLarge ? (
            <button
              type="submit"
              className="hidden sm:flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 active:scale-[0.98] transition-all shadow-md shadow-sky-600/25 shrink-0"
            >
              <span>Search</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              aria-label="Submit search"
              className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* Autocomplete / Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-900/10 dark:shadow-slate-950/50 overflow-hidden py-2 backdrop-blur-xl animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-1.5 flex items-center justify-between text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase border-b border-slate-100 dark:border-slate-800/60 mb-1">
            <span>Suggestions & History</span>
            <span className="text-[10px] font-mono font-normal">↑↓ to navigate</span>
          </div>

          <ul role="listbox" className="max-h-80 overflow-y-auto">
            {suggestions.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <li
                  key={item.id}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => handleSelectSuggestion(item.text)}
                  className={`px-4 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-100'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {item.type === 'recent' ? (
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : item.type === 'trending' ? (
                      <TrendingUp className="w-4 h-4 text-indigo-500 shrink-0" />
                    ) : (
                      <Search className="w-4 h-4 text-sky-500 shrink-0" />
                    )}

                    <span className="truncate text-sm font-medium">
                      {item.text}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.type === 'recent' && (
                      <button
                        type="button"
                        onClick={(e) => handleRemoveRecent(e, item.text)}
                        title="Remove from history"
                        className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {item.type === 'trending' && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                        Trending
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
