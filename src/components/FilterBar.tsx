/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DocumentCategory, TimeFilter, SortOrder } from '../types/search.ts';
import { 
  Globe, 
  Code2, 
  BookOpen, 
  Newspaper, 
  GitBranch, 
  FileText, 
  Clock, 
  SlidersHorizontal,
  Wrench,
  GraduationCap,
  Atom,
  Briefcase,
  Trophy,
  Film,
  HeartPulse,
  Compass
} from 'lucide-react';

interface FilterBarProps {
  activeCategory: DocumentCategory;
  onSelectCategory: (cat: DocumentCategory) => void;
  timeFilter: TimeFilter;
  onChangeTimeFilter: (time: TimeFilter) => void;
  sortBy: SortOrder;
  onChangeSortBy: (sort: SortOrder) => void;
}

const CATEGORIES: { id: DocumentCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'all', label: 'All', icon: Globe },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'programming', label: 'Programming', icon: Code2 },
  { id: 'tech', label: 'Tech & Dev', icon: Wrench },
  { id: 'science', label: 'Science', icon: Atom },
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'business', label: 'Business', icon: Briefcase },
  { id: 'sports', label: 'Sports', icon: Trophy },
  { id: 'entertainment', label: 'Entertainment', icon: Film },
  { id: 'health', label: 'Health', icon: HeartPulse },
  { id: 'travel', label: 'Travel', icon: Compass },
  { id: 'knowledge', label: 'Knowledge', icon: BookOpen },
  { id: 'opensource', label: 'Open Source', icon: GitBranch },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  activeCategory,
  onSelectCategory,
  timeFilter,
  onChangeTimeFilter,
  sortBy,
  onChangeSortBy,
}) => {
  return (
    <div className="w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold border border-sky-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-sky-500 dark:text-sky-400' : 'text-slate-400'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sub-filters: Time and Sorting */}
        <div className="flex items-center gap-3 self-end sm:self-center text-xs">
          {/* Time range */}
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={timeFilter}
              onChange={(e) => onChangeTimeFilter(e.target.value as TimeFilter)}
              className="bg-transparent border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
            >
              <option value="all" className="dark:bg-slate-900">Any time</option>
              <option value="day" className="dark:bg-slate-900">Past 24 hours</option>
              <option value="week" className="dark:bg-slate-900">Past week</option>
              <option value="month" className="dark:bg-slate-900">Past month</option>
              <option value="year" className="dark:bg-slate-900">Past year</option>
            </select>
          </div>

          {/* Sort order */}
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => onChangeSortBy(e.target.value as SortOrder)}
              className="bg-transparent border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
            >
              <option value="relevance" className="dark:bg-slate-900">Relevance</option>
              <option value="date" className="dark:bg-slate-900">Date</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
