/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { SearchResultsPage } from './pages/SearchResultsPage.tsx';
import { AboutPage } from './pages/AboutPage.tsx';
import { PrivacyPage } from './pages/PrivacyPage.tsx';
import { SourcesPage } from './pages/SourcesPage.tsx';
import { SearchBox } from './components/SearchBox.tsx';
import { DocumentCategory } from './types/search.ts';
import { buildSearchUrl } from './utils/url.ts';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [query, setQuery] = useState<string>('');
  const [category, setCategory] = useState<DocumentCategory>('all');
  const [page, setPage] = useState<number>(1);

  // Sync internal state with browser URL
  const parseCurrentLocation = () => {
    if (typeof window === 'undefined') return;

    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const qParam = searchParams.get('q') || '';
    const catParam = (searchParams.get('category') as DocumentCategory) || 'all';
    const pageParam = parseInt(searchParams.get('page') || '1', 10);

    // If query parameter is present even on root or /search, route to search
    if (qParam || pathname === '/search') {
      setCurrentPath('/search');
      setQuery(qParam);
      setCategory(catParam);
      setPage(isNaN(pageParam) ? 1 : pageParam);
      document.title = qParam ? `${qParam} – NexVora Search` : 'NexVora Search – Fast, Independent Web Search';
    } else if (pathname === '/sources') {
      setCurrentPath('/sources');
      document.title = 'Sources Ingestion – NexVora Search';
    } else if (pathname === '/about') {
      setCurrentPath('/about');
      document.title = 'About – NexVora Search';
    } else if (pathname === '/privacy') {
      setCurrentPath('/privacy');
      document.title = 'Privacy Policy – NexVora Search';
    } else {
      setCurrentPath('/');
      document.title = 'NexVora Search – Fast, Independent Web Search';
    }
  };

  useEffect(() => {
    parseCurrentLocation();

    const handlePopState = () => {
      parseCurrentLocation();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Internal navigation router
  const navigate = (path: string, options: { replace?: boolean } = {}) => {
    if (path.startsWith('/search')) {
      const url = new URL(path, window.location.origin);
      const q = url.searchParams.get('q') || '';
      const cat = (url.searchParams.get('category') as DocumentCategory) || 'all';
      const p = parseInt(url.searchParams.get('page') || '1', 10);

      setQuery(q);
      setCategory(cat);
      setPage(p);
      setCurrentPath('/search');

      if (options.replace) {
        window.history.replaceState({}, '', path);
      } else {
        window.history.pushState({}, '', path);
      }
      document.title = q ? `${q} – NexVora Search` : 'NexVora Search';
    } else {
      setCurrentPath(path);
      if (options.replace) {
        window.history.replaceState({}, '', path);
      } else {
        window.history.pushState({}, '', path);
      }

      if (path === '/sources') {
        document.title = 'Sources Ingestion – NexVora Search';
      } else if (path === '/about') {
        document.title = 'About – NexVora Search';
      } else if (path === '/privacy') {
        document.title = 'Privacy Policy – NexVora Search';
      } else {
        document.title = 'NexVora Search – Fast, Independent Web Search';
      }
    }

    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleSearchSubmit = (newQuery: string, newPage = 1, newCategory = category) => {
    const clean = newQuery.trim();
    if (!clean) return;

    const url = buildSearchUrl(clean, newPage, newCategory);
    navigate(url);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Navigation Header */}
      <Header
        currentPath={currentPath}
        onNavigate={navigate}
        showSearchBar={currentPath === '/search'}
        searchBarSlot={
          currentPath === '/search' ? (
            <SearchBox
              size="compact"
              initialValue={query}
              onSearch={(q) => handleSearchSubmit(q, 1, category)}
              placeholder="Search NexVora index..."
            />
          ) : undefined
        }
      />

      {/* Main Page Content Router */}
      <div className="flex-1 flex flex-col">
        {currentPath === '/search' ? (
          <SearchResultsPage
            initialQuery={query}
            initialCategory={category}
            initialPage={page}
            onSearchChange={(q, p = 1, cat = 'all') => {
              handleSearchSubmit(q, p, cat);
            }}
            onNavigateInternal={navigate}
          />
        ) : currentPath === '/sources' ? (
          <SourcesPage
            onNavigate={navigate}
            onSearch={(q) => handleSearchSubmit(q, 1, 'all')}
          />
        ) : currentPath === '/about' ? (
          <AboutPage
            onNavigate={navigate}
            onSearch={(q) => handleSearchSubmit(q, 1, 'all')}
          />
        ) : currentPath === '/privacy' ? (
          <PrivacyPage onNavigate={navigate} />
        ) : (
          <HomePage
            onSearch={(q) => handleSearchSubmit(q, 1, 'all')}
            onNavigate={navigate}
          />
        )}
      </div>

      {/* Persistent Global Footer */}
      <Footer onNavigate={navigate} />
    </div>
  );
}
