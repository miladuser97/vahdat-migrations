// src/features/media/providers/registry.ts
// ثبت همه Providerها
// اضافه کردن Provider جدید فقط اینجا

import type { MediaProviderDriver } from "./types";
import { customUrlProvider } from "./drivers/custom-url";

export const MEDIA_PROVIDERS: MediaProviderDriver[] = [
  customUrlProvider,
];

/**
 * پیدا کردن یه Provider بر اساس slug
 */
export function getProviderBySlug(
  slug: string
): MediaProviderDriver | undefined {
  return MEDIA_PROVIDERS.find((p) => p.slug === slug);
}

/**
 * فقط Providerهایی که capability search دارن
 */
export function getSearchableProviders(
  onlySlugs?: string[]
): MediaProviderDriver[] {
  return MEDIA_PROVIDERS.filter((p) => {
    if (!p.capabilities.search) return false;
    if (onlySlugs && onlySlugs.length > 0 && !onlySlugs.includes(p.slug)) {
      return false;
    }
    return true;
  });
}

/**
 * لیست slug همه Providerها (برای UI)
 */
export function getAllProviderSlugs(): string[] {
  return MEDIA_PROVIDERS.map((p) => p.slug);
}