/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { QuickAnswer } from '../types/search.ts';

const HTTP_CODES: Record<string, { title: string; desc: string }> = {
  '200': { title: '200 OK', desc: 'Standard response for successful HTTP requests.' },
  '201': { title: '201 Created', desc: 'The request has succeeded and a new resource has been created.' },
  '204': { title: '204 No Content', desc: 'The server successfully processed the request, but is not returning any content.' },
  '301': { title: '301 Moved Permanently', desc: 'This and all future requests should be directed to the given URI.' },
  '302': { title: '302 Found', desc: 'Tells the client to look at (browse to) another URL temporarily.' },
  '304': { title: '304 Not Modified', desc: 'Indicates that the resource has not been modified since the version specified in request headers.' },
  '400': { title: '400 Bad Request', desc: 'The server cannot or will not process the request due to client error.' },
  '401': { title: '401 Unauthorized', desc: 'Similar to 403 Forbidden, but specifically for use when authentication is required and has failed or not yet been provided.' },
  '403': { title: '403 Forbidden', desc: 'The request contained valid data and was understood by the server, but the server is refusing action.' },
  '404': { title: '404 Not Found', desc: 'The requested resource could not be found but may be available in the future.' },
  '429': { title: '429 Too Many Requests', desc: 'The user has sent too many requests in a given amount of time (rate limiting).' },
  '500': { title: '500 Internal Server Error', desc: 'A generic error message, given when an unexpected condition was encountered.' },
  '502': { title: '502 Bad Gateway', desc: 'The server was acting as a gateway or proxy and received an invalid response from the upstream server.' },
  '503': { title: '503 Service Unavailable', desc: 'The server cannot handle the request (because it is overloaded or down for maintenance).' }
};

export function resolveQuickAnswer(query: string): QuickAnswer | null {
  const clean = query.trim().toLowerCase();

  // 1. Math calculation check (safe evaluation)
  const mathRegex = /^[\d\s+\-*/().%^]+$/;
  if (mathRegex.test(clean) && /[\d]/.test(clean) && /[+\-*/^%]/.test(clean)) {
    try {
      // Clean up power operator
      const sanitized = clean.replace(/\^/g, '**');
      // Evaluate simple safe math expression using Function
      const result = new Function(`return (${sanitized});`)();
      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        return {
          type: 'calculation',
          title: `Result: ${result.toLocaleString('en-US', { maximumFractionDigits: 6 })}`,
          content: `${query} = ${result}`,
          badge: 'Calculator',
          sourceName: 'NexVora Compute'
        };
      }
    } catch {
      // not a valid math expression
    }
  }

  // Percentage calculator: e.g. "15% of 250"
  const percentMatch = clean.match(/^(\d+(?:\.\d+)?)\s*%\s*(?:of)\s*(\d+(?:\.\d+)?)$/);
  if (percentMatch) {
    const p = parseFloat(percentMatch[1]);
    const total = parseFloat(percentMatch[2]);
    const val = (p / 100) * total;
    return {
      type: 'calculation',
      title: `${val.toLocaleString()}`,
      content: `${p}% of ${total} is ${val}`,
      badge: 'Percentage',
      sourceName: 'NexVora Compute'
    };
  }

  // 2. HTTP Status Code check
  const httpMatch = clean.match(/(?:http|status|error)?\s*([1-5]\d\d)(?:\s*(?:code|error|status|ok|not found))?/);
  if (httpMatch && HTTP_CODES[httpMatch[1]]) {
    const code = httpMatch[1];
    const info = HTTP_CODES[code];
    return {
      type: 'http_status',
      title: `HTTP ${info.title}`,
      content: info.desc,
      badge: 'HTTP Protocol Reference',
      sourceName: 'RFC 9110 / MDN Web Docs',
      sourceUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status'
    };
  }

  // 3. Unit conversions (e.g. "100 km to miles", "32 c to f")
  const kmMatch = clean.match(/^(\d+(?:\.\d+)?)\s*(?:km|kilometers?)\s*(?:to|in)\s*(?:miles?|mi)$/);
  if (kmMatch) {
    const km = parseFloat(kmMatch[1]);
    const miles = km * 0.621371;
    return {
      type: 'converter',
      title: `${miles.toFixed(2)} Miles`,
      content: `${km} kilometers is approximately ${miles.toFixed(2)} miles`,
      badge: 'Unit Converter',
      sourceName: 'Metric Conversion'
    };
  }

  const cToFMatch = clean.match(/^(\d+(?:\.\d+)?)\s*(?:c|celsius)\s*(?:to|in)\s*(?:f|fahrenheit)$/);
  if (cToFMatch) {
    const c = parseFloat(cToFMatch[1]);
    const f = (c * 9/5) + 32;
    return {
      type: 'converter',
      title: `${f.toFixed(1)} °F`,
      content: `${c} °C equals ${f.toFixed(1)} °F`,
      badge: 'Temperature Converter'
    };
  }

  // 4. Quick definitions & profile lookups
  if (clean === 'khan sir' || clean === 'khan gs research centre' || clean === 'who is khan sir') {
    return {
      type: 'definition',
      title: 'Khan Sir (Khan GS Research Centre)',
      content: 'Renowned Indian educator and founder of Khan GS Research Centre in Patna, Bihar. Known for simplifying complex general studies, science, map reading, and current affairs topics for students preparing for competitive examinations.',
      subtext: 'Subject Specialization: General Studies, Current Affairs, World Geography, History',
      badge: 'Knowledge Profile',
      sourceName: 'NexVora GitHub Sources Index',
      sourceUrl: '/sources'
    };
  }

  if (clean === 'bm25' || clean === 'okapi bm25' || clean === 'what is bm25') {
    return {
      type: 'definition',
      title: 'Okapi BM25 Ranking Formula',
      content: 'A bag-of-words retrieval function that ranks a set of documents based on the query terms appearing in each document, regardless of their inter-relationship. Widely used in Lucene, Elasticsearch, and NexVora.',
      subtext: 'Formula: IDF(q) * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (docLen / avgdl)))',
      badge: 'Information Retrieval',
      sourceName: 'Wikipedia',
      sourceUrl: 'https://en.wikipedia.org/wiki/Okapi_BM25'
    };
  }

  return null;
}
