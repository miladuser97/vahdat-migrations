// src/features/media/orchestrator/search.ts
// مدیریت جستجو روی همه Providerها

import {
  getSearchableProviders,
} from "../providers/registry";
import type {
  ProviderSearchQuery,
  SearchMediaOptions,
  SearchMediaResponse,
  NormalizedSearchResult,
} from "../types";
import { normalizeResults } from "./normalize";
import { deduplicateResults } from "./deduplicate";

/**
 * جستجو در همه Providerهای فعال
 *
 * - خطای یه Provider باعث fail کل search نمی‌شه
 * - نتایج normalize + deduplicate می‌شن
 * - هیچ DB write انجام نمی‌شه
 */
export async function searchMedia(
  query: ProviderSearchQuery,
  options: SearchMediaOptions = {}
): Promise<SearchMediaResponse> {
  const providers = getSearchableProviders(options.providerSlugs);

  const allResults: NormalizedSearchResult[] = [];
  const providerErrors: SearchMediaResponse["providerErrors"] = [];

  for (const provider of providers) {
    try {
      const raw = await provider.search(query);
      const normalized = normalizeResults(
        raw,
        provider.slug,
        provider.name
      );
      allResults.push(...normalized);
    } catch (error) {
      providerErrors.push({
        providerSlug: provider.slug,
        providerName: provider.name,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const unique = deduplicateResults(allResults);

  return {
    results: unique,
    providerErrors,
  };
}