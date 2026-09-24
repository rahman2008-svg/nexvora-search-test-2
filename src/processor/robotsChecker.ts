/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RobotsCheckResult } from './types.ts';

interface CachedRobotsRule {
  disallowedPrefixes: string[];
  allowedPrefixes: string[];
  crawlDelayMs: number;
  fetchedAt: number;
}

export class RobotsChecker {
  private cache = new Map<string, CachedRobotsRule>();

  /**
   * Sets or seeds known robots rules for major domains
   */
  constructor() {
    // Seed common polite rules
    this.cache.set('wikipedia.org', {
      disallowedPrefixes: ['/w/api.php', '/wiki/Special:', '/trap/'],
      allowedPrefixes: ['/wiki/'],
      crawlDelayMs: 200,
      fetchedAt: Date.now(),
    });
    this.cache.set('github.com', {
      disallowedPrefixes: ['/search', '/login', '/*/issues/new', '/*/*/archive/'],
      allowedPrefixes: ['/torvalds/linux', '/*/'],
      crawlDelayMs: 300,
      fetchedAt: Date.now(),
    });
  }

  /**
   * Parse robots.txt file text
   */
  public parseRobotsTxt(domain: string, robotsText: string): void {
    const lines = robotsText.split(/\r?\n/);
    let appliesToAll = false;
    const disallowedPrefixes: string[] = [];
    const allowedPrefixes: string[] = [];
    let crawlDelayMs = 0;

    for (const rawLine of lines) {
      const line = rawLine.replace(/#.*$/, '').trim();
      if (!line) continue;

      const [directive, ...valParts] = line.split(':');
      const val = valParts.join(':').trim();
      const dirLower = directive.trim().toLowerCase();

      if (dirLower === 'user-agent') {
        appliesToAll = val === '*' || val.toLowerCase().includes('nexvorabot');
      } else if (appliesToAll) {
        if (dirLower === 'disallow') {
          if (val) disallowedPrefixes.push(val);
        } else if (dirLower === 'allow') {
          if (val) allowedPrefixes.push(val);
        } else if (dirLower === 'crawl-delay') {
          const delaySec = parseFloat(val);
          if (!isNaN(delaySec)) crawlDelayMs = delaySec * 1000;
        }
      }
    }

    this.cache.set(domain.toLowerCase(), {
      disallowedPrefixes,
      allowedPrefixes,
      crawlDelayMs,
      fetchedAt: Date.now(),
    });
  }

  /**
   * Evaluates if a given URL is allowed by robots.txt rules
   */
  public isUrlAllowed(rawUrl: string): RobotsCheckResult {
    try {
      const parsed = new URL(rawUrl);
      const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
      const pathname = parsed.pathname;

      // Check standard blocklists (admin, private, trap)
      if (
        pathname.startsWith('/admin') ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/private') ||
        pathname.startsWith('/trap') ||
        pathname.includes('logout')
      ) {
        return {
          allowed: false,
          reason: 'Path matches standard sensitive/admin route blocklist',
        };
      }

      const rules = this.cache.get(hostname);
      if (!rules) {
        // By default, if no specific restriction, allow
        return { allowed: true, crawlDelayMs: 0 };
      }

      // Check specific allow override first
      for (const allow of rules.allowedPrefixes) {
        if (pathname.startsWith(allow)) {
          return { allowed: true, crawlDelayMs: rules.crawlDelayMs };
        }
      }

      // Check disallow rules
      for (const disallow of rules.disallowedPrefixes) {
        if (pathname.startsWith(disallow)) {
          return {
            allowed: false,
            crawlDelayMs: rules.crawlDelayMs,
            reason: `Disallowed by robots.txt directive: Disallow: ${disallow}`,
          };
        }
      }

      return { allowed: true, crawlDelayMs: rules.crawlDelayMs };
    } catch {
      return { allowed: false, reason: 'Malformed URL could not be verified by robots checker' };
    }
  }
}

export const robotsChecker = new RobotsChecker();
