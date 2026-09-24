/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ContentCategory, CategoryClassification, ALL_CONTENT_CATEGORIES, ExtractedHeadings } from './types.ts';

interface CategoryRules {
  keywords: string[];
  urlPatterns: RegExp[];
  domainHints: string[];
}

const CATEGORY_DICTIONARY: Record<ContentCategory, CategoryRules> = {
  Programming: {
    keywords: [
      'programming', 'code', 'coding', 'typescript', 'javascript', 'python', 'rust',
      'golang', 'c++', 'java', 'react', 'vue', 'svelte', 'compiler', 'function',
      'syntax', 'debugging', 'algorithm', 'repository', 'github', 'npm', 'vite',
      'framework', 'library', 'api', 'sdk', 'backend', 'frontend', 'async', 'promise',
      'json', 'git', 'commit', 'pull request', 'bug fix', 'developer', 'refactor',
      'object-oriented', 'functional programming', 'variable', 'class', 'interface',
      'package', 'bundler', 'runtime', 'node.js', 'bun', 'cargo', 'pip'
    ],
    urlPatterns: [
      /\/docs\//i, /\/guide\//i, /\/api\//i, /\/code\//i, /\/developer/i,
      /\/programming/i, /\/react/i, /\/javascript/i, /\/rust/i, /\/python/i,
      /\/github\.com\//i, /\/repo/i
    ],
    domainHints: [
      'github.com', 'developer.mozilla.org', 'react.dev', 'rust-lang.org',
      'vite.dev', 'bun.sh', 'npmjs.com', 'stackoverflow.com', 'gitlab.com'
    ]
  },

  Technology: {
    keywords: [
      'technology', 'hardware', 'software', 'cloud', 'server', 'computing',
      'infrastructure', 'kubernetes', 'docker', 'container', 'linux', 'kernel',
      'database', 'sql', 'sqlite', 'postgres', 'network', 'protocol', 'security',
      'encryption', 'operating system', 'microservices', 'devops', 'cpu', 'gpu',
      'semiconductor', 'datacenter', 'cybersecurity', 'firewall', 'virtualization',
      'architecture', 'bm25', 'indexing', 'search engine', 'distributed system'
    ],
    urlPatterns: [
      /\/tech/i, /\/infrastructure/i, /\/cloud/i, /\/system/i, /\/architecture/i,
      /\/docker/i, /\/kubernetes/i, /\/security/i, /\/linux/i, /\/database/i
    ],
    domainHints: [
      'kubernetes.io', 'docker.com', 'kernel.org', 'sqlite.org', 'signal.org',
      'cloudflare.com', 'aws.amazon.com', 'linux.org', 'wired.com', 'arstechnica.com'
    ]
  },

  Science: {
    keywords: [
      'science', 'physics', 'astronomy', 'biology', 'chemistry', 'quantum',
      'cosmos', 'space', 'telescope', 'nasa', 'astrophysics', 'research',
      'laboratory', 'peer-reviewed', 'genetics', 'dna', 'molecule', 'atom',
      'gravity', 'galaxy', 'experiment', 'scientist', 'scientific', 'universe',
      'james webb', 'jwst', 'hubble', 'evolution', 'ecology', 'particle'
    ],
    urlPatterns: [
      /\/science/i, /\/space/i, /\/research/i, /\/physics/i, /\/astronomy/i,
      /\/biology/i, /\/nature/i, /\/arxiv/i
    ],
    domainHints: [
      'nasa.gov', 'nature.com', 'science.org', 'arxiv.org', 'scientificamerican.com',
      'space.com', 'cern.ch', 'eso.org'
    ]
  },

  Education: {
    keywords: [
      'education', 'course', 'university', 'college', 'student', 'tutorial',
      'learn', 'teaching', 'syllabus', 'lecture', 'academy', 'professor',
      'school', 'study', 'curriculum', 'exam', 'degrees', 'textbook',
      'khan academy', 'khan sir', 'upsc', 'coaching', 'educator', 'quiz',
      'classroom', 'academic', 'scholarship', 'pedagogy', 'training'
    ],
    urlPatterns: [
      /\/learn/i, /\/tutorial/i, /\/course/i, /\/edu/i, /\/education/i,
      /\/academy/i, /\/lecture/i, /\/study/i, /\/curriculum/i
    ],
    domainHints: [
      '.edu', 'coursera.org', 'khanacademy.org', 'edx.org', 'mit.edu',
      'stanford.edu', 'harvard.edu', 'udemy.com'
    ]
  },

  News: {
    keywords: [
      'news', 'breaking', 'report', 'journalist', 'gazette', 'dispatch',
      'investigation', 'correspondent', 'headlines', 'editorial', 'press',
      'coverage', 'current affairs', 'bulletin', 'daily', 'times',
      'journalism', 'spokesperson', 'politics', 'diplomacy', 'alert'
    ],
    urlPatterns: [
      /\/news\//i, /\/breaking\//i, /\/world\//i, /\/politics\//i, /\/report\//i
    ],
    domainHints: [
      'reuters.com', 'apnews.com', 'bbc.com', 'cnn.com', 'theguardian.com',
      'nytimes.com', 'bloomberg.com', 'aljazeera.com'
    ]
  },

  Business: {
    keywords: [
      'business', 'market', 'stocks', 'enterprise', 'revenue', 'earnings',
      'finance', 'investment', 'valuation', 'startup', 'venture capital',
      'economy', 'gdp', 'inflation', 'quarterly', 'investor', 'equity',
      'b2b', 'management', 'merger', 'acquisition', 'commercial', 'corporate'
    ],
    urlPatterns: [
      /\/business/i, /\/finance/i, /\/markets/i, /\/economy/i, /\/investor/i
    ],
    domainHints: [
      'bloomberg.com', 'forbes.com', 'wsj.com', 'ft.com', 'investopedia.com'
    ]
  },

  Sports: {
    keywords: [
      'sports', 'football', 'soccer', 'basketball', 'baseball', 'cricket',
      'tournament', 'championship', 'olympics', 'match', 'score', 'athlete',
      'stadium', 'league', 'premier league', 'nba', 'fifa', 'coach', 'team',
      'tennis', 'grand slam', 'formula 1', 'f1', 'race', 'player'
    ],
    urlPatterns: [
      /\/sports/i, /\/football/i, /\/soccer/i, /\/scores/i, /\/olympics/i
    ],
    domainHints: [
      'espn.com', 'fifa.com', 'nba.com', 'formula1.com', 'skysports.com'
    ]
  },

  Entertainment: {
    keywords: [
      'entertainment', 'movie', 'film', 'cinema', 'music', 'album',
      'concert', 'actor', 'actress', 'director', 'hollywood', 'series',
      'streaming', 'gaming', 'video game', 'box office', 'festival', 'trailer',
      'theater', 'celebrity', 'comic', 'anime', 'animation'
    ],
    urlPatterns: [
      /\/entertainment/i, /\/movies/i, /\/film/i, /\/music/i, /\/gaming/i
    ],
    domainHints: [
      'imdb.com', 'rottentomatoes.com', 'ign.com', 'variety.com', 'billboard.com'
    ]
  },

  Health: {
    keywords: [
      'health', 'medical', 'medicine', 'patient', 'clinical', 'disease',
      'doctor', 'hospital', 'therapy', 'wellness', 'diagnosis', 'symptom',
      'nutrition', 'diet', 'fitness', 'vaccine', 'pharma', 'mental health',
      'cardiology', 'surgery', 'healthcare', 'treatment', 'virus'
    ],
    urlPatterns: [
      /\/health/i, /\/medical/i, /\/wellness/i, /\/clinical/i, /\/disease/i
    ],
    domainHints: [
      'nih.gov', 'who.int', 'cdc.gov', 'mayoclinic.org', 'webmd.com', 'healthline.com'
    ]
  },

  Travel: {
    keywords: [
      'travel', 'flight', 'hotel', 'resort', 'destination', 'tourism',
      'airline', 'visa', 'itinerary', 'trip', 'vacation', 'backpack',
      'attractions', 'hostel', 'sightseeing', 'luggage', 'passport',
      'cruise', 'island', 'traveler', 'journey'
    ],
    urlPatterns: [
      /\/travel/i, /\/destination/i, /\/tourism/i, /\/hotels/i, /\/flights/i
    ],
    domainHints: [
      'tripadvisor.com', 'lonelyplanet.com', 'booking.com', 'airbnb.com', 'expedia.com'
    ]
  },

  General: {
    keywords: [
      'overview', 'about', 'introduction', 'welcome', 'general', 'portal',
      'directory', 'index', 'reference', 'encyclopedia', 'resource'
    ],
    urlPatterns: [
      /\/about/i, /\/index/i, /\/portal/i
    ],
    domainHints: [
      'wikipedia.org'
    ]
  }
};

/**
 * Tokenizes text into lowercase words for fast dictionary lookup.
 */
function tokenize(text: string): string[] {
  return (text || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

/**
 * Classifies document content into one of 11 distinct categories using weighted rules.
 */
export function classifyContent(params: {
  url: string;
  domain: string;
  title: string;
  description: string;
  headings: ExtractedHeadings;
  mainText: string;
}): CategoryClassification {
  const { url, domain, title, description, headings, mainText } = params;

  // Initialize scores
  const scoreBreakdown: Record<ContentCategory, number> = {
    Education: 0,
    Programming: 0,
    Technology: 0,
    Science: 0,
    News: 0,
    Business: 0,
    Sports: 0,
    Entertainment: 0,
    Health: 0,
    Travel: 0,
    General: 0,
  };

  const matchedSignalsMap: Record<ContentCategory, Set<string>> = {
    Education: new Set(),
    Programming: new Set(),
    Technology: new Set(),
    Science: new Set(),
    News: new Set(),
    Business: new Set(),
    Sports: new Set(),
    Entertainment: new Set(),
    Health: new Set(),
    Travel: new Set(),
    General: new Set(),
  };

  const lowerUrl = url.toLowerCase();
  const lowerDomain = domain.toLowerCase();
  const lowerTitle = title.toLowerCase();
  const lowerDesc = description.toLowerCase();
  const titleTokens = tokenize(title);
  const descTokens = tokenize(description);
  const headingsText = [...headings.h1, ...headings.h2, ...headings.h3].join(' ').toLowerCase();
  const headingsTokens = tokenize(headingsText);
  const bodyTokens = tokenize(mainText.slice(0, 10000));

  // Compute term frequency bag for fast lookup
  const bodyFreq = new Map<string, number>();
  for (const t of bodyTokens) {
    bodyFreq.set(t, (bodyFreq.get(t) || 0) + 1);
  }

  // Evaluate each category rules
  for (const cat of ALL_CONTENT_CATEGORIES) {
    const rules = CATEGORY_DICTIONARY[cat];
    let score = 0;

    // 1. Domain Match (Weight: 6.0)
    for (const hint of rules.domainHints) {
      if (lowerDomain.includes(hint) || lowerDomain.endsWith(hint)) {
        score += 6.0;
        matchedSignalsMap[cat].add(`domain:${hint}`);
      }
    }

    // 2. URL Path Pattern Match (Weight: 4.5)
    for (const pat of rules.urlPatterns) {
      if (pat.test(lowerUrl)) {
        score += 4.5;
        matchedSignalsMap[cat].add(`url_pattern:${pat.source}`);
      }
    }

    // 3. Keywords in Title (Weight: 4.0 for multi-word or exact token)
    for (const kw of rules.keywords) {
      if (kw.includes(' ')) {
        if (lowerTitle.includes(kw)) {
          score += 5.0;
          matchedSignalsMap[cat].add(`title_phrase:${kw}`);
        }
      } else {
        if (titleTokens.includes(kw)) {
          score += 4.0;
          matchedSignalsMap[cat].add(`title:${kw}`);
        }
      }
    }

    // 4. Keywords in Headings (Weight: 3.0)
    for (const kw of rules.keywords) {
      if (kw.includes(' ')) {
        if (headingsText.includes(kw)) {
          score += 3.5;
          matchedSignalsMap[cat].add(`heading_phrase:${kw}`);
        }
      } else {
        if (headingsTokens.includes(kw)) {
          score += 2.5;
          matchedSignalsMap[cat].add(`heading:${kw}`);
        }
      }
    }

    // 5. Keywords in Meta Description (Weight: 2.0)
    for (const kw of rules.keywords) {
      if (kw.includes(' ')) {
        if (lowerDesc.includes(kw)) {
          score += 2.5;
          matchedSignalsMap[cat].add(`desc_phrase:${kw}`);
        }
      } else {
        if (descTokens.includes(kw)) {
          score += 2.0;
          matchedSignalsMap[cat].add(`desc:${kw}`);
        }
      }
    }

    // 6. Keywords in Body Text (Weight: 0.8 per occurrence, capped at 8 points per keyword)
    for (const kw of rules.keywords) {
      const count = bodyFreq.get(kw) || 0;
      if (count > 0) {
        const added = Math.min(count * 0.8, 8.0);
        score += added;
        if (count >= 2) {
          matchedSignalsMap[cat].add(`body:${kw}(${count})`);
        }
      }
    }

    scoreBreakdown[cat] = Math.round(score * 10) / 10;
  }

  // Find category with highest score
  let bestCategory: ContentCategory = 'General';
  let highestScore = 0;
  let secondScore = 0;

  for (const cat of ALL_CONTENT_CATEGORIES) {
    const s = scoreBreakdown[cat];
    if (s > highestScore) {
      secondScore = highestScore;
      highestScore = s;
      bestCategory = cat;
    } else if (s > secondScore) {
      secondScore = s;
    }
  }

  // If score is too low or barely distinguishable, categorize as General
  if (highestScore < 3.0) {
    bestCategory = 'General';
  }

  // Calculate confidence score (0.0 to 1.0)
  let confidenceScore = 0.5;
  if (highestScore > 0) {
    const margin = highestScore - secondScore;
    const rawConfidence = (highestScore / (highestScore + 10)) * 0.6 + (margin / (highestScore + 1)) * 0.4;
    confidenceScore = Math.min(Math.max(Math.round(rawConfidence * 100) / 100, 0.2), 0.99);
  }

  const matchedSignals = Array.from(matchedSignalsMap[bestCategory] || []).slice(0, 10);

  return {
    category: bestCategory,
    confidenceScore,
    matchedSignals,
    scoreBreakdown,
  };
}
