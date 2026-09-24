/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(false);

  useEffect(() => {
    // Check initial preference from localStorage or system theme
    const stored = localStorage.getItem('nexvora_theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (stored === 'dark' || (!stored && systemPrefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('nexvora_theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('nexvora_theme', 'dark');
      setIsDark(true);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle theme"
      className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800/80 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/50"
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-amber-400 hover:rotate-45 transition-transform" />
      ) : (
        <Moon className="w-5 h-5 text-slate-700 hover:-rotate-12 transition-transform" />
      )}
    </button>
  );
};
