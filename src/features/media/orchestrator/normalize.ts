// src/features/media/orchestrator/normalize.ts
// یکسان‌سازی نتایج از Providerهای مختلف

import type {
  ProviderSearchResult,
  NormalizedSearchResult,
} from "../types";

/**
 * نرمال‌سازی یه URL:
 *  - trim
 *  - حذف fragment (#...)
 *  - lowercase scheme + host
 */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return url.trim();
  }
}

/**
 * تبدیل ProviderSearchResult → NormalizedSearchResult
 */
export function normalizeResult(
  result: ProviderSearchResult,
  providerSlug: string,
  providerName: string
): NormalizedSearchResult {
  return {
    ...result,
    providerSlug,
    providerName,
    sourceUrl: normalizeUrl(result.sourceUrl),
    previewUrl: normalizeUrl(result.previewUrl),
    downloadUrl: result.downloadUrl
      ? normalizeUrl(result.downloadUrl)
      : undefined,
    normalizedUrl: normalizeUrl(result.sourceUrl),
  };
}

/**
 * نرمال‌سازی گروهی
 */
export function normalizeResults(
  results: ProviderSearchResult[],
  providerSlug: string,
  providerName: string
): NormalizedSearchResult[] {
  return results.map((r) => normalizeResult(r, providerSlug, providerName));
}