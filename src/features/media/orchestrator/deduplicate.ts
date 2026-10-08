// src/features/media/orchestrator/deduplicate.ts
// حذف تکراری — Stage 2: فقط بر اساس URL نرمال‌شده

import type { NormalizedSearchResult } from "../types";

/**
 * Stage 2: dedup فقط بر اساس normalizedUrl
 * Stage آینده: checksum, perceptualHash
 */
export function deduplicateResults(
  results: NormalizedSearchResult[]
): NormalizedSearchResult[] {
  const seen = new Set<string>();
  const unique: NormalizedSearchResult[] = [];

  for (const r of results) {
    const key = r.normalizedUrl;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(r);
  }

  return unique;
}