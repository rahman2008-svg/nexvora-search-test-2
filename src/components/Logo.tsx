/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showTagline = false }) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-5xl',
  };

  return (
    <div className="flex items-center gap-3 select-none">
      {/* Dynamic Geometric Vortex / Iris Emblem */}
      <div className={`relative ${iconSizes[size]} flex items-center justify-center shrink-0`}>
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-sky-600 via-indigo-500 to-cyan-400 opacity-90 blur-[2px] transition-transform group-hover:scale-105" />
        <div className="relative w-full h-full rounded-2xl bg-slate-900 border border-sky-400/40 p-1 flex items-center justify-center shadow-lg shadow-sky-500/20 overflow-hidden">
          <svg
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full transform transition-transform duration-500 group-hover:rotate-45"
          >
            <circle cx="18" cy="18" r="14" stroke="url(#paint0_linear)" strokeWidth="2.5" strokeDasharray="4 2" />
            <path
              d="M11 18L18 11L25 18L18 25Z"
              fill="url(#paint1_linear)"
              className="drop-shadow-sm"
            />
            <circle cx="18" cy="18" r="3" fill="#38BDF8" />
            <defs>
              <linearGradient id="paint0_linear" x1="4" y1="4" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="#38BDF8" />
                <stop offset="1" stopColor="#6366F1" />
              </linearGradient>
              <linearGradient id="paint1_linear" x1="11" y1="11" x2="25" y2="25" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0EA5E9" />
                <stop offset="1" stopColor="#818CF8" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-sky-950 to-slate-800 dark:from-white dark:via-sky-100 dark:to-slate-200 bg-clip-text text-transparent ${textSizes[size]}`}>
            NexVora
          </span>
          <span className={`font-medium tracking-tight text-sky-600 dark:text-sky-400 ${textSizes[size]}`}>
            Search
          </span>
        </div>
        {showTagline && (
          <span className="text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase mt-1">
            Independent Web Engine
          </span>
        )}
      </div>
    </div>
  );
};
