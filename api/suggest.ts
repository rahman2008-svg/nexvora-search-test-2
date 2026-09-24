/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { nexvoraEngine } from '../src/indexing/nexvoraIndex.ts';

let isInitialized = false;

function ensureEngineLoaded() {
  if (!isInitialized) {
    try {
      nexvoraEngine.initializeFromStorage();
      isInitialized = true;
    } catch {
      isInitialized = true;
    }
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    ensureEngineLoaded();

    const rawQuery = String(req.query?.q || '').trim();
    const query = rawQuery.slice(0, 100);

    const limitNum = parseInt(String(req.query?.limit || '6'), 10);
    const limit = isNaN(limitNum) || limitNum < 1 ? 6 : Math.min(limitNum, 10);

    const suggestions = nexvoraEngine.getSuggestions(query, limit);

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600');
    return res.status(200).json({
      query,
      suggestions,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Suggestions processing error',
      query: String(req.query?.q || ''),
      suggestions: [],
    });
  }
}
