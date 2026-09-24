/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from 'express';
import { nexvoraEngine } from '../indexing/nexvoraIndex.ts';

export const searchRouter = Router();

/**
 * GET /api/search?q={query}&page={page}&pageSize={pageSize}&category={category}&sortBy={sortBy}
 * Returns structured search results with BM25 + relevance scores, snippets, and pagination.
 */
searchRouter.get('/search', (req: Request, res: Response) => {
  try {
    const rawQuery = String(req.query.q || '').trim();
    // Safe limit: truncate query to 200 chars
    const query = rawQuery.slice(0, 200);

    // Safe limits: validate & clamp pagination
    const pageNum = parseInt(String(req.query.page || '1'), 10);
    const page = isNaN(pageNum) || pageNum < 1 ? 1 : Math.min(pageNum, 1000);

    const pageSizeNum = parseInt(String(req.query.pageSize || '10'), 10);
    // Enforce safe memory limit: max 50 documents per page response
    const pageSize = isNaN(pageSizeNum) || pageSizeNum < 1 ? 10 : Math.min(pageSizeNum, 50);

    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const sortBy = req.query.sortBy === 'date' ? 'date' : 'relevance';

    const searchResponse = nexvoraEngine.search({
      query,
      page,
      pageSize,
      category,
      sortBy,
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.status(200).json(searchResponse);
  } catch (error: any) {
    console.error('Error handling /api/search:', error);
    return res.status(500).json({
      error: 'Search engine processing error',
      message: error.message || 'Internal error',
      results: [],
      totalResults: 0,
      page: 1,
      pageSize: 10,
    });
  }
});

/**
 * GET /api/suggest?q={query}&limit={limit}
 * Returns search suggestions based on indexed queries, terms, and titles.
 */
searchRouter.get('/suggest', (req: Request, res: Response) => {
  try {
    const rawQuery = String(req.query.q || '').trim();
    const query = rawQuery.slice(0, 100);

    const limitNum = parseInt(String(req.query.limit || '6'), 10);
    const limit = isNaN(limitNum) || limitNum < 1 ? 6 : Math.min(limitNum, 10);

    const suggestions = nexvoraEngine.getSuggestions(query, limit);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=120');
    return res.status(200).json({
      query,
      suggestions,
    });
  } catch (error: any) {
    console.error('Error handling /api/suggest:', error);
    return res.status(500).json({
      error: 'Suggestions error',
      query: String(req.query.q || ''),
      suggestions: [],
    });
  }
});

/**
 * GET /api/index/stats
 * Returns index stats (documents count, total terms, average doc length).
 */
searchRouter.get('/index/stats', (_req: Request, res: Response) => {
  try {
    const stats = nexvoraEngine.getStats();
    return res.status(200).json({
      status: 'healthy',
      engine: 'NexVora Okapi BM25 Inverted Index',
      version: '1.0.0',
      stats,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/index/export
 * Exports independent serialized index JSON schema.
 */
searchRouter.get('/index/export', (_req: Request, res: Response) => {
  try {
    const serialized = nexvoraEngine.exportIndex();
    res.setHeader('Content-Disposition', 'attachment; filename="nexvora-index.json"');
    return res.status(200).json(serialized);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});
