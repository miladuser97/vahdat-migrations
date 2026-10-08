// src/features/media/types.ts
// تایپ‌های مشترک برای سیستم media

export interface MediaImageRef {
    url: string;
    alt?: string;
    width?: number;
    height?: number;
  }
  
  export type MediaProviderCapability = {
    search: boolean;
    bulk: boolean;
    license: boolean;
    requiresApiKey: boolean;
  };
  
  export type MediaLicenseInfo = {
    type?: string;
    url?: string;
    attribution?: string;
  };
  
  export interface ProviderSearchQuery {
    productId: string;
    title?: string;
    brand?: string;
    model?: string;
    color?: string;
    ean?: string;
    mpn?: string;
    categoryHint?: string;
  }
  
  export interface ProviderSearchResult {
    sourceId?: string;
    sourceUrl: string;
    previewUrl: string;
    downloadUrl?: string;
    title?: string;
    creator?: string;
    width?: number;
    height?: number;
    mimeType?: string;
    license?: MediaLicenseInfo;
    colorHint?: string;
    modelHint?: string;
    relevanceHint?: number;
    raw?: Record<string, unknown>;
  }
  
  export interface NormalizedSearchResult extends ProviderSearchResult {
    providerSlug: string;
    providerName: string;
    normalizedUrl: string;
  }
  
  export interface SearchMediaOptions {
    providerSlugs?: string[];
    timeoutMs?: number;
  }
  
  export interface SearchMediaResponse {
    results: NormalizedSearchResult[];
    providerErrors: Array<{
      providerSlug: string;
      providerName: string;
      error: string;
    }>;
  }