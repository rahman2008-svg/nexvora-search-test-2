/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  EyeOff, 
  Trash2, 
  ArrowLeft, 
  Cookie, 
  Server, 
  Check 
} from 'lucide-react';
import { SearchService } from '../services/searchService.ts';

interface PrivacyPageProps {
  onNavigate: (path: string) => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onNavigate }) => {
  const [cleared, setCleared] = React.useState(false);

  const handleClearHistory = () => {
    SearchService.clearRecentSearches();
    setCleared(true);
    setTimeout(() => setCleared(false), 2500);
  };

  return (
    <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      {/* Back navigation */}
      <button
        onClick={() => onNavigate('/')}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Search</span>
      </button>

      {/* Header */}
      <div className="mb-10 text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 mb-4">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Strict Zero-Telemetry Privacy Commitment</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
          NexVora Privacy Statement
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
          We don&rsquo;t track you. We don&rsquo;t store your search queries on our servers. We don&rsquo;t build psychological advertising profiles. Period.
        </p>
      </div>

      <div className="space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed text-sm sm:text-base">
        {/* Key Guarantees Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs">
            <EyeOff className="w-6 h-6 text-emerald-500 mb-3" />
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">
              Zero Logging
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              We do not record your IP address, device fingerprints, or search terms to central databases.
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs">
            <Cookie className="w-6 h-6 text-sky-500 mb-3" />
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">
              No Tracking Cookies
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              We never drop third-party advertising tracking cookies or canvas fingerprinting scripts.
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs">
            <Lock className="w-6 h-6 text-indigo-500 mb-3" />
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">
              Client Sovereignty
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Recent search suggestions are stored exclusively on your own device via browser localStorage.
            </p>
          </div>
        </div>

        {/* Local Storage Control */}
        <section className="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center justify-between">
            <span>Manage Your Local Device Search Data</span>
            <Trash2 className="w-5 h-5 text-rose-500" />
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Recent search suggestions shown in the search bar are stored in your device&rsquo;s browser memory for convenience. They never touch a remote server. You can purge them at any time:
          </p>

          <button
            onClick={handleClearHistory}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/80 transition-colors"
          >
            {cleared ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Local Search History Cleared!</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 text-rose-500" />
                <span>Clear Local Search History Now</span>
              </>
            )}
          </button>
        </section>

        {/* Third-Party Independence */}
        <section className="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <Server className="w-5 h-5 text-slate-500" />
            <span>Independent Infrastructure Guarantee</span>
          </h2>
          <p className="text-sm leading-relaxed mb-3">
            NexVora does not redirect or forward your queries to Google, Bing, Yahoo, Yandex, or advertising aggregators. When you click an external web result, you navigate directly to the target destination without interstitial redirect trackers or click-measuring referral pings.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            For technical questions regarding our privacy architecture, consult our documentation or open an issue on our open source repository.
          </p>
        </section>
      </div>
    </div>
  );
};
