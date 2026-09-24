/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class DuplicateDetector {
  private seenKeys = new Map<string, string>(); // canonicalKey -> originalId

  /**
   * Clears the cache
   */
  public reset(): void {
    this.seenKeys.clear();
  }

  /**
   * Checks if a canonical key has been seen before.
   * If seen, returns { isDuplicate: true, duplicateOfId: string }.
   * If new, registers it and returns { isDuplicate: false }.
   */
  public checkAndRegister(canonicalKey: string, id: string): { isDuplicate: boolean; duplicateOfId?: string } {
    const cleanKey = canonicalKey.trim().toLowerCase();

    if (this.seenKeys.has(cleanKey)) {
      return {
        isDuplicate: true,
        duplicateOfId: this.seenKeys.get(cleanKey)
      };
    }

    this.seenKeys.set(cleanKey, id);
    return {
      isDuplicate: false
    };
  }

  public has(canonicalKey: string): boolean {
    return this.seenKeys.has(canonicalKey.trim().toLowerCase());
  }

  public size(): number {
    return this.seenKeys.size;
  }
}
