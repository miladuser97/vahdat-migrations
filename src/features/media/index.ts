// src/features/media/index.ts
// نقطه‌ی ورود مشترک

export * from "./types";
export { MEDIA_PROVIDERS, getProviderBySlug, getSearchableProviders, getAllProviderSlugs } from "./providers/registry";
export { searchMedia } from "./orchestrator/search";