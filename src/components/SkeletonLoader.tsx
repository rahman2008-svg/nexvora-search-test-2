/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const SkeletonLoader: React.FC = () => {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="w-36 h-3 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="w-14 h-4 rounded-full bg-slate-100 dark:bg-slate-850 ml-auto" />
          </div>
          <div className="w-3/4 h-5 rounded bg-slate-200 dark:bg-slate-800 mb-3" />
          <div className="space-y-2 mb-4">
            <div className="w-full h-3.5 rounded bg-slate-100 dark:bg-slate-850" />
            <div className="w-5/6 h-3.5 rounded bg-slate-100 dark:bg-slate-850" />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60">
            <div className="w-20 h-3 rounded bg-slate-100 dark:bg-slate-850" />
            <div className="w-16 h-3 rounded bg-slate-100 dark:bg-slate-850" />
          </div>
        </div>
      ))}
    </div>
  );
};
