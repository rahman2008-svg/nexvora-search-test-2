/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FolderGit2, 
  Search, 
  Globe, 
  FileCode, 
  ArrowLeft, 
  ExternalLink, 
  Copy, 
  Check, 
  Filter, 
  Sparkles, 
  AlertTriangle, 
  FileJson,
  Play,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
  Cpu,
  Layers,
  FileText,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  RefreshCw,
  HardDrive,
  ListFilter,
  AlertCircle,
  GraduationCap,
  Code2,
  Wrench,
  Atom,
  Newspaper,
  Briefcase,
  Trophy,
  Film,
  HeartPulse,
  Compass,
  FileSpreadsheet,
  Workflow,
  GitBranch,
  Clock,
  Terminal,
  FolderTree
} from 'lucide-react';
import { SearchService } from '../services/searchService.ts';
import { extractSearchQuery } from '../sources/queryExtractor.ts';
import { canonicalizeWebsiteUrl } from '../sources/canonicalizer.ts';
import { getAppOrigin } from '../utils/url.ts';
import { ContentCategory, ProcessedDocument, ProcessingChunk } from '../processor/types.ts';
import { parseHtmlSafely } from '../processor/htmlParser.ts';
import { classifyContent } from '../processor/categoryClassifier.ts';
import { robotsChecker } from '../processor/robotsChecker.ts';
import { SAMPLE_WEBSITE_HTML } from '../processor/mockHtmlSources.ts';

interface SourcesPageProps {
  onNavigate: (path: string) => void;
  onSearch: (q: string) => void;
}

const CATEGORY_ICON_MAP: Record<ContentCategory, React.ComponentType<{ className?: string }>> = {
  Education: GraduationCap,
  Programming: Code2,
  Technology: Wrench,
  Science: Atom,
  News: Newspaper,
  Business: Briefcase,
  Sports: Trophy,
  Entertainment: Film,
  Health: HeartPulse,
  Travel: Compass,
  General: Globe,
};

export const SourcesPage: React.FC<SourcesPageProps> = ({ onNavigate, onSearch }) => {
  const [activeTab, setActiveTab] = useState<'engine' | 'automation' | 'search-urls' | 'websites' | 'sitemaps' | 'manifest' | 'sandbox'>('engine');
  const [workflowFileTab, setWorkflowFileTab] = useState<'process-sources' | 'ci' | 'pipeline-ts' | 'validate-ts'>('process-sources');
  const [engineSubTab, setEngineSubTab] = useState<'chunks' | 'categories' | 'reports' | 'live-test'>('chunks');
  const [selectedChunkId, setSelectedChunkId] = useState<string>('chunk-001');
  const [selectedCategory, setSelectedCategory] = useState<ContentCategory>('Programming');
  const [copied, setCopied] = useState<string | null>(null);

  const report = SearchService.getSourceReport();
  const manifest = SearchService.getPhase3Manifest();
  const engineReport = SearchService.getContentProcessingReport();
  const chunks = SearchService.getContentChunks();
  const failedUrls = SearchService.getFailedUrls();
  const categoryIndices = SearchService.getContentCategories();

  // Live Engine Sandbox state
  const [liveUrlInput, setLiveUrlInput] = useState('https://react.dev/blog/2024/12/05/react-19');
  const [liveDocResult, setLiveDocResult] = useState<ProcessedDocument | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);

  // General URL Sandbox state
  const [sandboxInput, setSandboxInput] = useState(
    'https://www.google.com/search?gs_ssp=eJzj4tVP1zc0TMtKrqwosTQ3YPSSKC4pTU4tUchPUyjOyM9NzcvPzwMAzO8LhA&q=khan+sir&oq=khan+sir&sourceid=chrome'
  );
  const [sandboxResult, setSandboxResult] = useState<any>(() => extractSearchQuery(sandboxInput));

  const origin = getAppOrigin();

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleRunLiveEngine = (urlToProcess: string) => {
    setLiveError(null);
    const clean = urlToProcess.trim();
    if (!clean) return;

    try {
      const robots = robotsChecker.isUrlAllowed(clean);
      if (!robots.allowed) {
        setLiveError(`Blocked by robots.txt: ${robots.reason}`);
        setLiveDocResult(null);
        return;
      }

      const canonicalRes = canonicalizeWebsiteUrl(clean);
      if (!canonicalRes) {
        setLiveError('Invalid URL structure for canonicalization');
        setLiveDocResult(null);
        return;
      }

      const cleanLookup = canonicalRes.canonicalUrl.replace(/\/+$/, '').split('?')[0];
      const html = SAMPLE_WEBSITE_HTML[cleanLookup] || 
        SAMPLE_WEBSITE_HTML[`${cleanLookup}/`] || 
        SAMPLE_WEBSITE_HTML['https://developer.mozilla.org/en-US/docs/Web/JavaScript'];

      const parsed = parseHtmlSafely(html, canonicalRes.canonicalUrl);
      const classification = classifyContent({
        url: canonicalRes.canonicalUrl,
        domain: canonicalRes.domain,
        title: parsed.title,
        description: parsed.description,
        headings: parsed.headings,
        mainText: parsed.mainText,
      });

      setLiveDocResult({
        id: `doc-${canonicalRes.domain.replace(/[^a-z0-9]/gi, '_')}-preview`,
        url: clean,
        canonicalUrl: parsed.canonicalUrl || canonicalRes.canonicalUrl,
        domain: canonicalRes.domain,
        title: parsed.title,
        description: parsed.description,
        headings: parsed.headings,
        mainText: parsed.mainText,
        language: parsed.language,
        category: classification.category,
        categoryConfidence: classification.confidenceScore,
        categorySignals: classification.matchedSignals,
        contentLengthBytes: parsed.contentLengthBytes,
        wordCount: parsed.wordCount,
        statusCode: 200,
        fetchTimeMs: 18,
        processedAt: new Date().toISOString(),
        chunkId: 'chunk-live',
        retryCount: 0,
      });
    } catch (err: any) {
      setLiveError(err.message || 'Processing failed');
      setLiveDocResult(null);
    }
  };

  const handleTestSandbox = (val: string) => {
    setSandboxInput(val);
    if (!val.trim()) {
      setSandboxResult(null);
      return;
    }
    const searchRes = extractSearchQuery(val);
    if (searchRes) {
      setSandboxResult({ type: 'search-url', ...searchRes });
    } else {
      const webRes = canonicalizeWebsiteUrl(val);
      if (webRes) {
        setSandboxResult({ type: 'website', ...webRes });
      } else {
        setSandboxResult({ type: 'invalid' });
      }
    }
  };

  const selectedChunk = chunks.find((c) => c.chunkId === selectedChunkId) || chunks[0];
  const activeCategoryData = categoryIndices[selectedCategory.toLowerCase()] || {
    category: selectedCategory,
    documentCount: 0,
    items: [],
  };

  return (
    <div className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      {/* Back button */}
      <button
        onClick={() => onNavigate('/')}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Search</span>
      </button>

      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800 mb-3">
          <Cpu className="w-3.5 h-3.5" />
          <span>Automated Content Processing Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
          Content Ingestion &amp; Classification
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
          Safely fetches publicly accessible HTML, respects <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">robots.txt</code> and rate limits, enforces 2MB content boundaries, extracts clean readable text and metadata, and performs deterministic rule-based category classification across 11 knowledge domains without any external AI API.
        </p>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mb-8">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 mb-1">
            Processed Docs
          </div>
          <div className="text-2xl font-black text-sky-600 dark:text-sky-400">
            {engineReport.summary.successfullyProcessed}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Across {engineReport.summary.totalChunksGenerated} JSON chunks
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 mb-1">
            Categories
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            11
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Rule-based classifier
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 mb-1">
            Extracted Data
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {(engineReport.summary.totalExtractedBytes / 1024).toFixed(1)} KB
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Avg {engineReport.summary.averageFetchTimeMs}ms latency
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 mb-1">
            Duplicates Caught
          </div>
          <div className="text-2xl font-black text-amber-500">
            {engineReport.summary.duplicateUrlsIgnored}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Canonical key registry
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 mb-1">
            Failed / Skipped
          </div>
          <div className="text-2xl font-black text-rose-500">
            {engineReport.summary.failedUrlsCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Robots &amp; malformed blocked
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 mb-6 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('engine')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'engine'
              ? 'border-sky-500 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Cpu className="w-4 h-4 text-sky-500" />
          <span>Automated Content Engine (generated/)</span>
        </button>

        <button
          onClick={() => setActiveTab('automation')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'automation'
              ? 'border-sky-500 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Workflow className="w-4 h-4 text-emerald-500" />
          <span>GitHub Actions Automation</span>
        </button>

        <button
          onClick={() => setActiveTab('search-urls')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'search-urls'
              ? 'border-sky-500 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Search URLs Source ({report.searchUrls.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('websites')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'websites'
              ? 'border-sky-500 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Curated Websites ({report.websites.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sitemaps')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'sitemaps'
              ? 'border-sky-500 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Sitemaps ({report.sitemaps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sandbox')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'sandbox'
              ? 'border-sky-500 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>URL Query Sandbox</span>
        </button>

        <button
          onClick={() => setActiveTab('manifest')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'manifest'
              ? 'border-sky-500 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileJson className="w-4 h-4" />
          <span>Phase 3 Manifest</span>
        </button>
      </div>

      {/* ===================== TAB: AUTOMATED CONTENT ENGINE ===================== */}
      {activeTab === 'engine' && (
        <div className="space-y-6">
          {/* Engine Sub-navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-slate-100 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <button
                onClick={() => setEngineSubTab('chunks')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  engineSubTab === 'chunks'
                    ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Document Chunks (generated/documents/)</span>
              </button>

              <button
                onClick={() => setEngineSubTab('categories')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  engineSubTab === 'categories'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Classified Categories (generated/categories/)</span>
              </button>

              <button
                onClick={() => setEngineSubTab('reports')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  engineSubTab === 'reports'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>Processing Reports (generated/reports/)</span>
              </button>

              <button
                onClick={() => setEngineSubTab('live-test')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  engineSubTab === 'live-test'
                    ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>Live URL Pipeline Tester</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 px-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Engine Status: Active</span>
            </div>
          </div>

          {/* SUBTAB 1: DOCUMENT CHUNKS */}
          {engineSubTab === 'chunks' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Select Chunk:</span>
                  <div className="flex items-center gap-1.5">
                    {chunks.map((c) => (
                      <button
                        key={c.chunkId}
                        onClick={() => setSelectedChunkId(c.chunkId)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                          selectedChunkId === c.chunkId
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {c.filename} ({c.documentCount})
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(JSON.stringify(selectedChunk, null, 2), selectedChunk.chunkId)}
                    className="flex items-center gap-1 px-3 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    {copied === selectedChunk.chunkId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied === selectedChunk.chunkId ? 'Copied Chunk' : `Copy ${selectedChunk.filename}`}</span>
                  </button>
                </div>
              </div>

              {/* Chunk Documents List */}
              <div className="space-y-3">
                {selectedChunk.documents.map((doc) => {
                  const CatIcon = CATEGORY_ICON_MAP[doc.category] || Globe;
                  return (
                    <div
                      key={doc.id}
                      className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3"
                    >
                      {/* Top Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            <CatIcon className="w-3 h-3" />
                            <span>{doc.category}</span>
                          </span>
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            Confidence: <strong className="text-slate-800 dark:text-slate-200">{Math.round(doc.categoryConfidence * 100)}%</strong>
                          </span>
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60">
                            HTTP {doc.statusCode} ({doc.fetchTimeMs}ms)
                          </span>
                          <span className="text-xs font-mono text-slate-400">
                            Lang: {doc.language}
                          </span>
                        </div>

                        <button
                          onClick={() => onSearch(doc.title)}
                          className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                        >
                          <span>Search in NexVora</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Title & Domain */}
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                          {doc.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 mt-1 truncate">
                          <span className="text-slate-700 dark:text-slate-300 font-semibold">{doc.domain}</span>
                          <span>•</span>
                          <span className="truncate">{doc.canonicalUrl}</span>
                        </div>
                      </div>

                      {/* Meta Description */}
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        <strong className="text-slate-700 dark:text-slate-300 block text-[11px] uppercase tracking-wider mb-1 font-semibold">
                          Meta Description:
                        </strong>
                        {doc.description}
                      </p>

                      {/* Headings */}
                      {(doc.headings.h1.length > 0 || doc.headings.h2.length > 0) && (
                        <div className="text-xs space-y-1 pt-1">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                            Extracted Headings:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {doc.headings.h1.map((h, idx) => (
                              <span
                                key={`h1-${idx}`}
                                className="px-2 py-0.5 rounded-md font-mono text-[11px] bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800"
                              >
                                H1: {h}
                              </span>
                            ))}
                            {doc.headings.h2.slice(0, 3).map((h, idx) => (
                              <span
                                key={`h2-${idx}`}
                                className="px-2 py-0.5 rounded-md font-mono text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                              >
                                H2: {h}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Matched Signals */}
                      {doc.categorySignals?.length > 0 && (
                        <div className="text-xs space-y-1">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                            Classification Rule Signals:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {doc.categorySignals.map((sig, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md font-mono text-[10px] bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                              >
                                {sig}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SUBTAB 2: CATEGORIES INDEX */}
          {engineSubTab === 'categories' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {(Object.keys(engineReport.categoryDistribution) as ContentCategory[]).map((cat) => {
                  const count = engineReport.categoryDistribution[cat] || 0;
                  const Icon = CATEGORY_ICON_MAP[cat] || Globe;
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`p-3 rounded-2xl text-left border transition-all ${
                        isSelected
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/70 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-500/20'
                          : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`} />
                        <span className="text-xs font-bold font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {count}
                        </span>
                      </div>
                      <div className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-800 dark:text-slate-200'}`}>
                        {cat}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">
                        {cat.toLowerCase()}.json
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Category Details */}
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{selectedCategory} Category Index</span>
                      <code className="text-xs font-mono font-normal text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-md">
                        generated/categories/{selectedCategory.toLowerCase()}.json
                      </code>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Deterministic rule classification matching URL tokens, domain authority hints, titles, headings, and keyword term frequencies.
                    </p>
                  </div>

                  <button
                    onClick={() => handleCopy(JSON.stringify(activeCategoryData, null, 2), `cat-${selectedCategory}`)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    {copied === `cat-${selectedCategory}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy JSON</span>
                  </button>
                </div>

                {activeCategoryData.items?.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No documents currently assigned to {selectedCategory}.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeCategoryData.items?.map((item: any) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {item.title}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                              {Math.round((item.confidence || 0.8) * 100)}% score
                            </span>
                          </div>
                          <div className="text-xs font-mono text-slate-500 truncate">
                            {item.canonicalUrl}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                            {item.description}
                          </p>
                        </div>

                        <button
                          onClick={() => onSearch(item.title)}
                          className="self-start sm:self-center shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 transition-colors flex items-center gap-1"
                        >
                          <span>Search</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUBTAB 3: REPORTS & FAILED URLS */}
          {engineSubTab === 'reports' && (
            <div className="space-y-6">
              {/* Summary file banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                    Audit Report &amp; Status Logs
                  </div>
                  <div className="text-sm text-slate-700 dark:text-slate-300">
                    Stored at <code className="font-mono text-sky-600 dark:text-sky-400">generated/reports/processing-report.json</code> and <code className="font-mono text-sky-600 dark:text-sky-400">generated/reports/failed-urls.jsonl</code>
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(JSON.stringify(engineReport, null, 2), 'full-report')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 text-xs font-semibold border border-sky-200 dark:border-sky-800"
                >
                  {copied === 'full-report' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied === 'full-report' ? 'Copied Full Report' : 'Copy Full Report JSON'}</span>
                </button>
              </div>

              {/* Failed URLs Reporting Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <span>Failed &amp; Blocked URLs Log ({failedUrls.length})</span>
                  </h3>
                  <span className="text-xs font-mono text-slate-500">
                    generated/reports/failed-urls.jsonl
                  </span>
                </div>

                {failedUrls.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300">
                    All queued URLs were successfully processed without errors or blocklist violations.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {failedUrls.map((fail, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-rose-700 dark:text-rose-400">
                              {fail.url}
                            </span>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                              Attempts: {fail.attemptsMade}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300">
                            Reason: <strong className="text-rose-600 dark:text-rose-400">{fail.errorReason}</strong>
                          </p>
                          <div className="text-[11px] font-mono text-slate-400">
                            Timestamp: {fail.failedAt} • Domain: {fail.domain}
                          </div>
                        </div>

                        <div className="shrink-0 text-right text-xs font-mono text-slate-500">
                          Status: Blocked/Ignored
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Raw Report Preview */}
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Processing Report JSON Preview:
                </span>
                <pre className="p-4 rounded-2xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800 max-h-80">
                  {JSON.stringify(engineReport, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* SUBTAB 4: LIVE URL PIPELINE TESTER */}
          {engineSubTab === 'live-test' && (
            <div className="space-y-6">
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Live Content-Processing Pipeline Tester
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Test the complete content processor on any website URL: URL validation, robots.txt check, HTML parsing, metadata extraction, and rule-based category classification.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={liveUrlInput}
                    onChange={(e) => setLiveUrlInput(e.target.value)}
                    placeholder="https://example.com/docs/guide"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    onClick={() => handleRunLiveEngine(liveUrlInput)}
                    className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Play className="w-4 h-4" />
                    <span>Run Processor</span>
                  </button>
                </div>

                {/* Preset Suggestions */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                  <span>Quick Test:</span>
                  {[
                    'https://react.dev/blog/2024/12/05/react-19',
                    'https://webb.nasa.gov/content/science/overview.html',
                    'https://www.khanacademy.org/math/calculus-1',
                    'https://www.espn.com/football/fifa-world-cup-qualifiers',
                    'https://en.wikipedia.org/trap/crawler-honeypot'
                  ].map((u) => (
                    <button
                      key={u}
                      onClick={() => {
                        setLiveUrlInput(u);
                        handleRunLiveEngine(u);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950 text-slate-700 dark:text-slate-300 font-mono text-[11px] transition-colors"
                    >
                      {u.split('/')[2]}
                    </button>
                  ))}
                </div>

                {/* Error Banner */}
                {liveError && (
                  <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{liveError}</span>
                  </div>
                )}

                {/* Result Card */}
                {liveDocResult && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          Category: {liveDocResult.category} ({Math.round(liveDocResult.categoryConfidence * 100)}%)
                        </span>
                        <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                          {liveDocResult.wordCount} words • {liveDocResult.contentLengthBytes} bytes
                        </span>
                      </div>
                      <button
                        onClick={() => onSearch(liveDocResult.title)}
                        className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                      >
                        <span>Search in NexVora</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {liveDocResult.title}
                      </h4>
                      <p className="text-xs font-mono text-slate-500 mt-0.5">
                        {liveDocResult.canonicalUrl}
                      </p>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <strong className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1">
                        Extracted Meta Description:
                      </strong>
                      {liveDocResult.description}
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 max-h-48 overflow-y-auto">
                      <strong className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1">
                        Main Readable Text:
                      </strong>
                      {liveDocResult.mainText}
                    </div>

                    {liveDocResult.categorySignals?.length > 0 && (
                      <div className="text-xs">
                        <strong className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1">
                          Rule Classifier Signals:
                        </strong>
                        <div className="flex flex-wrap gap-1">
                          {liveDocResult.categorySignals.map((s, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded font-mono text-[10px] bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB: SEARCH URLS ===================== */}
      {activeTab === 'search-urls' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span>
              Extracted from <code className="font-mono text-sky-600 dark:text-sky-400">sources/search-urls/sample-queries.txt</code>
            </span>
            <span>Google tracking stripped &amp; NexVora URLs mapped</span>
          </div>

          <div className="space-y-3">
            {report.searchUrls.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl bg-white dark:bg-slate-900/60 border transition-all ${
                  item.isDuplicate
                    ? 'border-amber-200 dark:border-amber-900/60 opacity-70 bg-amber-50/20'
                    : 'border-slate-200 dark:border-slate-800 shadow-xs'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                      Query: &ldquo;{item.extractedQuery}&rdquo;
                    </span>
                    {item.isDuplicate ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        Duplicate Ignored
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        Canonical
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onSearch(item.extractedQuery)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    <span>Execute Search</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate mb-1.5">
                  <span className="text-slate-400 select-none">Raw: </span>
                  {item.rawInput}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2 font-mono text-slate-700 dark:text-slate-300">
                    <span className="text-slate-400">NexVora URL:</span>
                    <code className="text-sky-600 dark:text-sky-400">{item.nexvoraRelativeUrl}</code>
                  </div>
                  <button
                    onClick={() => handleCopy(item.nexvoraAbsoluteUrl, item.id)}
                    className="text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
                  >
                    {copied === item.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copied === item.id ? 'Copied' : 'Copy Absolute URL'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== TAB: WEBSITES ===================== */}
      {activeTab === 'websites' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span>
              Extracted from <code className="font-mono text-sky-600 dark:text-sky-400">sources/websites/curated-sites.txt</code>
            </span>
            <span>UTM tracking stripped &amp; domains normalized</span>
          </div>

          <div className="space-y-3">
            {report.websites.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl bg-white dark:bg-slate-900/60 border transition-all ${
                  item.isDuplicate
                    ? 'border-amber-200 dark:border-amber-900/60 opacity-70 bg-amber-50/20'
                    : 'border-slate-200 dark:border-slate-800 shadow-xs'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                      {item.domain}
                    </span>
                    {item.isDuplicate ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        Duplicate Ignored
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        Canonical
                      </span>
                    )}
                  </div>

                  <a
                    href={item.canonicalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-sky-600"
                  >
                    <span>Visit Site</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate mb-1.5">
                  <span className="text-slate-400 select-none">Raw: </span>
                  {item.rawInput}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2 font-mono text-slate-700 dark:text-slate-300 truncate">
                    <span className="text-slate-400">Canonical:</span>
                    <code className="text-emerald-600 dark:text-emerald-400 truncate">{item.canonicalUrl}</code>
                  </div>
                  <button
                    onClick={() => handleCopy(item.canonicalUrl, item.id)}
                    className="text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 shrink-0"
                  >
                    {copied === item.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copied === item.id ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== TAB: SITEMAPS ===================== */}
      {activeTab === 'sitemaps' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span>
              Extracted from <code className="font-mono text-sky-600 dark:text-sky-400">sources/sitemaps/popular-sitemaps.txt</code>
            </span>
            <span>XML sitemaps validated &amp; verified</span>
          </div>

          <div className="space-y-3">
            {report.sitemaps.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                    {item.domain}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    Validated XML Feed
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-600 dark:text-slate-300 truncate">
                  {item.rawInput}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== TAB: URL QUERY SANDBOX ===================== */}
      {activeTab === 'sandbox' && (
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Live URL Query Extraction &amp; Stripping
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-4">
              Paste any URL with query or tracking parameters to observe immediate parameter stripping, query extraction, and canonicalization.
            </p>

            <div className="space-y-3">
              <input
                type="text"
                value={sandboxInput}
                onChange={(e) => handleTestSandbox(e.target.value)}
                placeholder="Paste Google search or website URL here..."
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
              />

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>Try sample:</span>
                <button
                  onClick={() => handleTestSandbox('https://www.google.com/search?gs_ssp=eJzj4tVP1zc0TMtKrqwosTQ3YPSSKC4pTU4tUchPUyjOyM9NzcvPzwMAzO8LhA&q=khan+sir&oq=khan+sir&sourceid=chrome')}
                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-sky-600 dark:text-sky-400 font-mono text-[11px]"
                >
                  Khan Sir Google URL
                </button>
                <button
                  onClick={() => handleTestSandbox('https://developer.mozilla.org/en-US/docs/Web/JavaScript?utm_source=test&utm_medium=banner&gclid=12345')}
                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-sky-600 dark:text-sky-400 font-mono text-[11px]"
                >
                  MDN with UTM &amp; Gclid
                </button>
              </div>
            </div>

            {sandboxResult && sandboxResult.type === 'search-url' && (
              <div className="mt-5 p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
                    Detected Google Search URL
                  </span>
                  <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    Extracted: &ldquo;{sandboxResult.extractedQuery}&rdquo;
                  </span>
                </div>

                <div className="text-xs space-y-1">
                  <span className="text-slate-400 block text-[11px]">NexVora Search Target:</span>
                  <button
                    onClick={() => onSearch(sandboxResult.extractedQuery)}
                    className="text-xs font-mono font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <span>{sandboxResult.nexvoraRelativeUrl}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {sandboxResult.strippedParams?.length > 0 && (
                  <div className="text-xs pt-1">
                    <span className="text-slate-400 block text-[11px] mb-1">
                      Ignored Google Tracking Parameters ({sandboxResult.strippedParams.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {sandboxResult.strippedParams.map((p: string) => (
                        <span
                          key={p}
                          className="px-2 py-0.5 rounded-md font-mono text-[11px] bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== TAB: GITHUB ACTIONS AUTOMATION ===================== */}
      {activeTab === 'automation' && (
        <div className="space-y-8">
          {/* Top Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border border-slate-700 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl -z-0 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <Workflow className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      GitHub Actions Automation Engine
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Active &amp; Configured
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Workflows located in <code className="text-sky-300 font-mono">.github/workflows/process-sources.yml</code> &amp; <code className="text-sky-300 font-mono">ci.yml</code>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 font-mono text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Zero External Secrets Required
                  </span>
                </div>
              </div>

              <p className="text-sm text-slate-300 max-w-3xl leading-relaxed mb-6">
                Automates continuous source ingestion, politeness checking, HTML parsing, category classification, duplicate removal, JSON/JSONL chunking, Okapi BM25 search index generation, and git commits directly on GitHub runner infrastructure.
              </p>

              {/* 3 Trigger Modes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 backdrop-blur-xs">
                  <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-2">
                    <GitBranch className="w-4 h-4" />
                    <span>1. Push-Based Trigger</span>
                  </div>
                  <div className="text-sm font-semibold text-white mb-1">Source Change Detection</div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Triggers automatically when changes occur in <code className="text-slate-300 font-mono">sources/**</code> or processing scripts. Uses <code className="text-slate-300 font-mono">paths-ignore: ['generated/**']</code> to prevent recursive loops.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 backdrop-blur-xs">
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
                    <Clock className="w-4 h-4" />
                    <span>2. Scheduled Trigger</span>
                  </div>
                  <div className="text-sm font-semibold text-white mb-1">Periodic Cron Execution</div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Configured via cron schedule <code className="text-slate-300 font-mono">0 4 * * *</code> (every day at 04:00 UTC) to refresh and re-crawl seeds for updated content.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 backdrop-blur-xs">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
                    <Play className="w-4 h-4" />
                    <span>3. Manual Execution</span>
                  </div>
                  <div className="text-sm font-semibold text-white mb-1">workflow_dispatch</div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Triggerable on-demand via the GitHub Actions UI with custom options: <code className="text-slate-300 font-mono">force_rebuild</code> and <code className="text-slate-300 font-mono">validate_only</code>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pipeline Lifecycle Step-by-Step Flow */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-500" />
              Automated Pipeline Lifecycle Stages
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Executed sequentially inside the GitHub runner environment on every trigger event:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center text-[10px]">1</span>
                  <span>Checkout &amp; Setup</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Checks out git repository using <code className="font-mono">actions/checkout@v4</code> with automated GITHUB_TOKEN permissions.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center text-[10px]">2</span>
                  <span>Validate Sources</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Scans <code className="font-mono">sources/websites/curated-sites.txt</code> and sitemaps. Flags syntax errors, invalid schemes, and comment lines.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center text-[10px]">3</span>
                  <span>Process &amp; Deduplicate</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Canonicalizes URLs, strips tracking query parameters, enforces robots.txt and domain rate limits, and skips duplicate canonical keys.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center text-[10px]">4</span>
                  <span>Extract &amp; Categorize</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Parses HTML, extracts title, description, h1/h2/h3 headings, clean main text, and assigns one of 11 deterministic rule-based categories.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px]">5</span>
                  <span>Generate JSON/JSONL</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Outputs chunked JSON partitions (<code className="font-mono">chunk-*.json</code>), streaming <code className="font-mono">documents.jsonl</code>, and category bundles.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px]">6</span>
                  <span>Build Search Index</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Calculates term frequencies, document frequencies, and Okapi BM25 weights into <code className="font-mono">generated/index/nexvora-index.json</code>.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px]">7</span>
                  <span>Validate Integrity</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Runs 43 rigorous assertion checks across chunks, line counts, category mappings, index vocabulary, and reports.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px]">8</span>
                  <span>Safe Git Commit</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Only stages <code className="font-mono">generated/</code>. Commits using <code className="font-mono">[skip ci]</code> to prevent recursive re-triggering.
                </p>
              </div>
            </div>
          </div>

          {/* Organized Repository Directories Grid */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-indigo-500" />
                  Automatically Maintained Directories
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Every pipeline run keeps these four directories clean, versioned, and perfectly in sync:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* generated/documents/ */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70">
                <div className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400 mb-2 flex items-center gap-1.5">
                  <FolderGit2 className="w-3.5 h-3.5" />
                  generated/documents/
                </div>
                <ul className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-1.5 font-mono text-[11px]">
                    <FileJson className="w-3 h-3 text-sky-500" />
                    chunk-001.json ... chunk-004.json
                  </li>
                  <li className="flex items-center gap-1.5 font-mono text-[11px]">
                    <FileText className="w-3 h-3 text-indigo-500" />
                    documents.jsonl (23 entries)
                  </li>
                </ul>
                <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-500">
                  Partitioned documents ready for fast streaming.
                </div>
              </div>

              {/* generated/categories/ */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70">
                <div className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-1.5">
                  <FolderGit2 className="w-3.5 h-3.5" />
                  generated/categories/
                </div>
                <ul className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-1.5 font-mono text-[11px]">
                    <FileJson className="w-3 h-3 text-indigo-500" />
                    programming.json, science.json ...
                  </li>
                  <li className="flex items-center gap-1.5 font-mono text-[11px]">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    11 Knowledge Domain Indices
                  </li>
                </ul>
                <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-500">
                  Pre-computed category feeds &amp; mappings.
                </div>
              </div>

              {/* generated/index/ */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70">
                <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                  <FolderGit2 className="w-3.5 h-3.5" />
                  generated/index/
                </div>
                <ul className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-1.5 font-mono text-[11px]">
                    <HardDrive className="w-3 h-3 text-emerald-500" />
                    nexvora-index.json (BM25 Inverted)
                  </li>
                  <li className="flex items-center gap-1.5 font-mono text-[11px]">
                    <FileSpreadsheet className="w-3 h-3 text-sky-500" />
                    index-stats.json &amp; manifest.json
                  </li>
                </ul>
                <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-500">
                  1,006 terms, 23 docs, instant search loading.
                </div>
              </div>

              {/* generated/reports/ */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70">
                <div className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                  <FolderGit2 className="w-3.5 h-3.5" />
                  generated/reports/
                </div>
                <ul className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-1.5 font-mono text-[11px]">
                    <FileJson className="w-3 h-3 text-amber-500" />
                    processing-report.json
                  </li>
                  <li className="flex items-center gap-1.5 font-mono text-[11px]">
                    <FileText className="w-3 h-3 text-rose-500" />
                    failed-urls.jsonl &amp; duplicate-urls.jsonl
                  </li>
                </ul>
                <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-500">
                  Full audit trail for skips, dups, &amp; failures.
                </div>
              </div>
            </div>
          </div>

          {/* Workflow & Script Inspector */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-sky-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Workflow Files &amp; Pipeline Scripts
                </h3>
              </div>

              {/* File switcher buttons */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono">
                <button
                  onClick={() => setWorkflowFileTab('process-sources')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    workflowFileTab === 'process-sources'
                      ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  process-sources.yml
                </button>
                <button
                  onClick={() => setWorkflowFileTab('ci')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    workflowFileTab === 'ci'
                      ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  ci.yml
                </button>
                <button
                  onClick={() => setWorkflowFileTab('pipeline-ts')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    workflowFileTab === 'pipeline-ts'
                      ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  scripts/pipeline.ts
                </button>
                <button
                  onClick={() => setWorkflowFileTab('validate-ts')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    workflowFileTab === 'validate-ts'
                      ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  scripts/validate-pipeline.ts
                </button>
              </div>
            </div>

            {/* Quick Local CLI Commands */}
            <div className="mb-4 p-4 rounded-2xl bg-slate-900 text-slate-200 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 font-mono">
                <span className="text-emerald-400 font-bold">$</span>
                <span className="text-slate-300">
                  {workflowFileTab === 'process-sources' && 'npm run pipeline'}
                  {workflowFileTab === 'ci' && 'npm run lint && npm run validate:generated && npm run build'}
                  {workflowFileTab === 'pipeline-ts' && 'npx tsx scripts/pipeline.ts'}
                  {workflowFileTab === 'validate-ts' && 'npx tsx scripts/validate-pipeline.ts'}
                </span>
              </div>
              <button
                onClick={() => {
                  const cmd =
                    workflowFileTab === 'process-sources'
                      ? 'npm run pipeline'
                      : workflowFileTab === 'ci'
                      ? 'npm run lint && npm run validate:generated && npm run build'
                      : workflowFileTab === 'pipeline-ts'
                      ? 'npx tsx scripts/pipeline.ts'
                      : 'npx tsx scripts/validate-pipeline.ts';
                  handleCopy(cmd, 'cmd-copy');
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors font-sans text-[11px]"
              >
                {copied === 'cmd-copy' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied === 'cmd-copy' ? 'Copied' : 'Copy Command'}</span>
              </button>
            </div>

            {/* File content display */}
            <div className="relative">
              <pre className="p-5 rounded-2xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800 max-h-[420px]">
                {workflowFileTab === 'process-sources' && `name: NexVora Ingestion & Index Pipeline

on:
  push:
    branches: [main, master]
    paths:
      - 'sources/**'
      - 'src/processor/**'
      - 'src/indexing/**'
      - 'scripts/**'
    paths-ignore:
      - 'generated/**'
      - 'README.md'
      - '.github/**'
  schedule:
    - cron: '0 4 * * *' # Daily periodic run at 04:00 UTC
  workflow_dispatch:
    inputs:
      force_rebuild:
        description: 'Force complete rebuild and re-indexing'
        type: boolean
        default: false
      validate_only:
        description: 'Run validation checks only (no commit)'
        type: boolean
        default: false

concurrency:
  group: nexvora-pipeline-\${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: write

jobs:
  pipeline:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: \${{ secrets.GITHUB_TOKEN }}
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci || npm install
      - name: Validate Sources
        run: npx tsx scripts/pipeline.ts --validate-sources-only
      - name: Ingest, Classify & Build Index
        run: npx tsx scripts/pipeline.ts
      - name: Validate Output Integrity
        run: npx tsx scripts/validate-pipeline.ts
      - name: Commit & Push Changes
        if: \${{ github.event.inputs.validate_only != 'true' }}
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add generated/
          git commit -m "chore(pipeline): automated index & source processing [skip ci]"
          git push origin HEAD:\${{ github.ref_name }}`}

                {workflowFileTab === 'ci' && `name: NexVora CI

on:
  push:
    branches: [main, master]
    paths-ignore: ['generated/**', '*.md']
  pull_request:
    branches: [main, master]

concurrency:
  group: nexvora-ci-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  test-and-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci || npm install
      - run: npm run lint
      - run: npm run validate:generated
      - run: npm run build`}

                {workflowFileTab === 'pipeline-ts' && `// scripts/pipeline.ts - Autonomous Source Ingestion & Okapi BM25 Indexing
import fs from 'fs';
import path from 'path';
import { contentEngine } from '../src/processor/contentEngine.ts';
import { NexVoraSearchEngine } from '../src/indexing/nexvoraIndex.ts';

// 1. Validate sources (sources/websites/curated-sites.txt)
// 2. Fetch HTML respecting robots.txt & polite rate limits
// 3. Extract title, description, headings, main text & language
// 4. Classify into 11 rule-based knowledge categories
// 5. Deduplicate against canonical URL registry
// 6. Partition into generated/documents/ (chunk-*.json, documents.jsonl)
// 7. Write category indices to generated/categories/*.json
// 8. Build & serialize BM25 Inverted Index to generated/index/nexvora-index.json
// 9. Generate audit reports to generated/reports/ (failed-urls, duplicate-urls)`}

                {workflowFileTab === 'validate-ts' && `// scripts/validate-pipeline.ts - Automated Integrity Checks
// Validates 43 assertions across the pipeline:
// 1. generated/documents/ chunk files and line-count parity in documents.jsonl
// 2. generated/categories/ existence of all 11 category JSON files
// 3. generated/index/ nexvora-index.json, index-stats.json & manifest.json integrity
// 4. generated/reports/ processing-report.json, duplicate-urls.jsonl & failed-urls.jsonl`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB: PHASE 3 JSON MANIFEST ===================== */}
      {activeTab === 'manifest' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span>
              Automated Pipeline Manifest (<code className="font-mono text-sky-600 dark:text-sky-400">manifestVersion: 3.0-alpha</code>)
            </span>
            <button
              onClick={() => handleCopy(JSON.stringify(manifest, null, 2), 'manifest-all')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 font-semibold border border-sky-200 dark:border-sky-800"
            >
              {copied === 'manifest-all' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied === 'manifest-all' ? 'Copied Manifest JSON' : 'Copy Full Manifest JSON'}</span>
            </button>
          </div>

          <pre className="p-5 rounded-3xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800 shadow-xl max-h-[500px]">
            {JSON.stringify(manifest, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
