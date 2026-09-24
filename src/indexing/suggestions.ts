/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EngineSuggestion, IndexedDocument, TermPostingRecord } from './types.ts';
import { normalizeText, ENGLISH_STOP_WORDS } from './tokenizer.ts';

export class SuggestionsEngine {
  private titleSuggestions: { title: string; lower: string; docId: string; category: string }[] = [];
  private domainSuggestions: { domain: string; lower: string }[] = [];
  private termSuggestions: { term: string; df: number }[] = [];
  private categorySuggestions: { category: string; lower: string }[] = [];

  constructor() {}

  /**
   * Build suggestion indexes from document catalog and inverted index terms
   */
  public build(
    documents: IndexedDocument[],
    invertedIndex: Map<string, TermPostingRecord>
  ): void {
    const titlesSet = new Set<string>();
    const domainsSet = new Set<string>();
    const categoriesSet = new Set<string>();

    this.titleSuggestions = [];
    this.domainSuggestions = [];
    this.categorySuggestions = [];

    for (const doc of documents) {
      // Titles
      if (doc.title && !titlesSet.has(doc.title)) {
        titlesSet.add(doc.title);
        this.titleSuggestions.push({
          title: doc.title,
          lower: normalizeText(doc.title),
          docId: doc.id,
          category: doc.category,
        });
      }

      // Domain
      if (doc.domain && !domainsSet.has(doc.domain)) {
        domainsSet.add(doc.domain);
        this.domainSuggestions.push({
          domain: doc.domain,
          lower: doc.domain.toLowerCase(),
        });
      }

      // Category
      if (doc.category && !categoriesSet.has(doc.category)) {
        categoriesSet.add(doc.category);
        this.categorySuggestions.push({
          category: doc.category,
          lower: doc.category.toLowerCase(),
        });
      }
    }

    // Inverted Index terms sorted by Document Frequency
    const termList: { term: string; df: number }[] = [];
    for (const [term, record] of invertedIndex.entries()) {
      if (term.length > 2 && !ENGLISH_STOP_WORDS.has(term)) {
        termList.push({ term, df: record.docFrequency });
      }
    }
    termList.sort((a, b) => b.df - a.df);
    this.termSuggestions = termList;
  }

  /**
   * Return ranked suggestions for prefix
   */
  public getSuggestions(query: string, limit = 6): EngineSuggestion[] {
    const clean = normalizeText(query);
    if (!clean) {
      // Default trending starters when no input
      const starters: EngineSuggestion[] = [
        { id: 's-start-1', text: 'JavaScript MDN Docs', type: 'query' },
        { id: 's-start-2', text: 'React 19 Release', type: 'query' },
        { id: 's-start-3', text: 'Python Tutorial', type: 'query' },
        { id: 's-start-4', text: 'NASA Space Science', type: 'query' },
        { id: 's-start-5', text: 'FIFA Football', type: 'query' },
      ];
      return starters.slice(0, limit);
    }

    const suggestions: EngineSuggestion[] = [];
    const seenTexts = new Set<string>();

    const addSuggestion = (s: EngineSuggestion) => {
      const lower = s.text.toLowerCase();
      if (!seenTexts.has(lower) && suggestions.length < limit) {
        seenTexts.add(lower);
        suggestions.push(s);
      }
    };

    // 1. Direct title prefix matches
    for (const item of this.titleSuggestions) {
      if (item.lower.startsWith(clean)) {
        addSuggestion({
          id: `title-${item.docId}`,
          text: item.title,
          type: 'title',
          category: item.category,
        });
      }
      if (suggestions.length >= limit) return suggestions;
    }

    // 2. Title substring matches
    for (const item of this.titleSuggestions) {
      if (item.lower.includes(clean) && !item.lower.startsWith(clean)) {
        addSuggestion({
          id: `title-sub-${item.docId}`,
          text: item.title,
          type: 'title',
          category: item.category,
        });
      }
      if (suggestions.length >= limit) return suggestions;
    }

    // 3. Domain prefix matches
    for (const item of this.domainSuggestions) {
      if (item.lower.startsWith(clean)) {
        addSuggestion({
          id: `domain-${item.domain}`,
          text: item.domain,
          type: 'domain',
        });
      }
      if (suggestions.length >= limit) return suggestions;
    }

    // 4. Inverted index term matches (highest DF first)
    for (const item of this.termSuggestions) {
      if (item.term.startsWith(clean) && item.term !== clean) {
        addSuggestion({
          id: `term-${item.term}`,
          text: item.term,
          type: 'query',
        });
      }
      if (suggestions.length >= limit) return suggestions;
    }

    // 5. Category matches
    for (const item of this.categorySuggestions) {
      if (item.lower.startsWith(clean)) {
        addSuggestion({
          id: `cat-${item.category}`,
          text: `${item.category} category`,
          type: 'category',
          category: item.category,
        });
      }
      if (suggestions.length >= limit) return suggestions;
    }

    return suggestions;
  }
}
