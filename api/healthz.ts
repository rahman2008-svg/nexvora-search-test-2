/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export default function handler(_req: any, res: any) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store');
  return res.status(200).json({
    status: 'ok',
    engine: 'NexVora Search BM25',
    time: new Date().toISOString(),
  });
}
