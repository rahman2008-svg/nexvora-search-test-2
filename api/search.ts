/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { nexvoraEngine } from '../src/indexing/nexvoraIndex.ts';

// Cache in-memory initialization across warm serverless invocations
let isInitialized = false;

function ensureEngineLoaded() {
  if (!isInitialized) {
    try {
      nexvoraEngine.initializeFromStorage();
      isInitialized = true;
    } catch {
      // Fallback: engine self-initializes on search
      isInitialized = true;
    }
  }
}

export default async function handler(req: any, res: any) {
  // Support CORS if accessed externally
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    ensureEngineLoaded();

    const rawQuery = String(req.query?.q || '').trim();
    const query = rawQuery.slice(0, 200);

    const pageNum = parseInt(String(req.query?.page || '1'), 10);
    const page = isNaN(pageNum) || pageNum < 1 ? 1 : Math.min(pageNum, 1000);

    const pageSizeNum = parseInt(String(req.query?.pageSize || '10'), 10);
    const pageSize = isNaN(pageSizeNum) || pageSizeNum < 1 ? 10 : Math.min(pageSizeNum, 50);

    const category = typeof req.query?.category === 'string' && req.query.category !== 'all' ? req.query.category : undefined;
    const sortBy = req.query?.sortBy === 'date' ? 'date' : 'relevance';

    const searchResponse = nexvoraEngine.search({
      query,
      page,
      pageSize,
      category,
      sortBy,
    });

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(searchResponse);
  } catch (error: any) {
    return res.status(500).json({
      error: 'Search engine processing error',
      message: error?.message || 'Internal error',
      results: [],
      totalResults: 0,
      page: 1,
      pageSize: 10,
    });
  }
}
