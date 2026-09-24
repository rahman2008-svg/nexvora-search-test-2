/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { searchRouter } from './src/api/searchRouter.ts';
import { nexvoraEngine } from './src/indexing/nexvoraIndex.ts';
import { loadServerDocuments } from './src/indexing/serverLoader.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Initialize Search Engine from generated server-side documents.
  try {
    const documents = loadServerDocuments();
    nexvoraEngine.buildIndex(documents);

    const stats = nexvoraEngine.getStats();

    console.log(
      `[NexVora Engine] Initialized: ${stats.totalDocuments} documents, ${stats.totalTerms} indexed terms.`
    );
  } catch (err) {
    console.error(
      '[NexVora Engine] Storage initialization error:',
      err
    );
  }

  // Mount Search API Routes
  app.use('/api', searchRouter);

  // API health check
  app.get('/api/healthz', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      engine: 'NexVora Search BM25',
      time: new Date().toISOString(),
    });
  });

  // Legacy health endpoint
  app.get('/healthz', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      engine: 'NexVora Search BM25',
      time: new Date().toISOString(),
    });
  });

  // Dynamic robots.txt using current request origin
  app.get('/robots.txt', (req: Request, res: Response) => {
    const proto =
      (req.headers['x-forwarded-proto'] as string) ||
      req.protocol ||
      'https';

    const host = req.get('host') || 'localhost:3000';
    const origin = `${proto}://${host}`;

    res.setHeader(
      'Content-Type',
      'text/plain; charset=utf-8'
    );

    res.setHeader(
      'Cache-Control',
      'public, max-age=86400'
    );

    res.send(`# NexVora Search Independent Web Indexer
User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${origin}/sitemap.xml
`);
  });

  // Dynamic sitemap.xml using current request origin
  app.get('/sitemap.xml', (req: Request, res: Response) => {
    const proto =
      (req.headers['x-forwarded-proto'] as string) ||
      req.protocol ||
      'https';

    const host = req.get('host') || 'localhost:3000';
    const origin = `${proto}://${host}`;

    res.setHeader(
      'Content-Type',
      'application/xml; charset=utf-8'
    );

    res.setHeader(
      'Cache-Control',
      'public, max-age=86400'
    );

    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${origin}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${origin}/search</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${origin}/sources</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${origin}/about</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${origin}/privacy</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`);
  });

  // Setup Vite dev server or static production files
  if (!isProd) {
    const { createServer: createViteServer } =
      await import('vite');

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');

    app.use(express.static(distPath));

    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(
        path.resolve(distPath, 'index.html')
      );
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `[NexVora Engine] Server listening on http://0.0.0.0:${PORT}`
    );
  });
}

startServer().catch((err) => {
  console.error(
    '[NexVora Server] Fatal error starting server:',
    err
  );

  process.exit(1);
});
