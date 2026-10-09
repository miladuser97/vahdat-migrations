// src/features/media/services/media-search-service.ts
// ⚠️ Server-only: اتصال searchMedia + Candidate Service
//
// این لایه بالاتره:
//   searchMedia() → NormalizedSearchResult[]
//         ↓
//   createCandidates() → MediaCandidate[]
//
// نکته: orchestrator/search.ts نباید Prisma import کنه.
//       این فایل مسئول persistence هست.

import "server-only";

import { searchMedia } from "../orchestrator/search";
import type {
  ProviderSearchQuery,
  SearchMediaOptions,
} from "../types";
import {
  createCandidates,
  toCreateCandidateInput,
} from "./candidate-service";
import type { CreateCandidatesResult } from "./candidate-service";
import { logger } from "@/lib/logger";

// ============================================================
// ورودی
// ============================================================
export interface SearchAndPersistInput {
  query: ProviderSearchQuery;
  options?: SearchMediaOptions;
}

export interface SearchAndPersistResult {
  // نتایج search خام (قبل از persist)
  searchResults: number;
  // نتایج persist شده
  created: CreateCandidatesResult["created"];
  duplicates: CreateCandidatesResult["duplicates"];
  errors: CreateCandidatesResult["errors"];
  // خطاهای provider
  providerErrors: Array<{
    providerSlug: string;
    providerName: string;
    error: string;
  }>;
}

// ============================================================
// searchAndPersistCandidates
// ============================================================
export async function searchAndPersistCandidates(
  input: SearchAndPersistInput
): Promise<SearchAndPersistResult> {
  const { query, options } = input;

  logger.info("[MediaSearch] Starting", {
    productId: query.productId,
    providerSlugs: options?.providerSlugs,
  });

  // ۱. اجرای search
  const searchResponse = await searchMedia(query, options);

  logger.info("[MediaSearch] Search completed", {
    resultsCount: searchResponse.results.length,
    errorsCount: searchResponse.providerErrors.length,
  });

  // ۲. تبدیل به ورودی Candidate
  const candidateInputs = searchResponse.results.map((result) =>
    toCreateCandidateInput(result, query.productId)
  );

  // ۳. Persist
  const persistResult =
    candidateInputs.length > 0
      ? await createCandidates(candidateInputs)
      : { created: [], duplicates: [], errors: [] };

  logger.info("[MediaSearch] Persist completed", {
    created: persistResult.created.length,
    duplicates: persistResult.duplicates.length,
    errors: persistResult.errors.length,
  });

  return {
    searchResults: searchResponse.results.length,
    created: persistResult.created,
    duplicates: persistResult.duplicates,
    errors: persistResult.errors,
    providerErrors: searchResponse.providerErrors,
  };
}