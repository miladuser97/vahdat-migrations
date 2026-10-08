// src/features/media/orchestrator/score.ts
// ⚠️ Stage 2: فقط skeleton
// پیاده‌سازی واقعی در Stage بعدی

import type { NormalizedSearchResult } from "../types";

export interface ScoredResult extends NormalizedSearchResult {
  relevanceScore: number;
  qualityScore: number;
  finalScore: number;
}

/**
 * Stage 2: فقط pass-through با score صفر
 * Stage آینده: relevance + quality
 */
export function scoreResults(
  results: NormalizedSearchResult[]
): ScoredResult[] {
  return results.map((r) => ({
    ...r,
    relevanceScore: 0,
    qualityScore: 0,
    finalScore: 0,
  }));
}