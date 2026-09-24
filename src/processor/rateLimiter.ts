/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class DomainRateLimiter {
  private lastRequestTimes = new Map<string, number>();
  private defaultDelayMs: number;

  constructor(defaultDelayMs = 300) {
    this.defaultDelayMs = defaultDelayMs;
  }

  /**
   * Waits if necessary to ensure polite rate limits for the given domain.
   */
  public async throttle(domain: string, extraDelayMs = 0): Promise<void> {
    const key = domain.toLowerCase();
    const now = Date.now();
    const lastTime = this.lastRequestTimes.get(key) || 0;
    const requiredDelay = Math.max(this.defaultDelayMs, extraDelayMs);
    const elapsed = now - lastTime;

    if (elapsed < requiredDelay) {
      const waitTime = requiredDelay - elapsed;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastRequestTimes.set(key, Date.now());
  }

  public reset(): void {
    this.lastRequestTimes.clear();
  }
}

export const domainRateLimiter = new DomainRateLimiter(200);
