// src/features/media/providers/types.ts
import type {
    MediaProviderCapability,
    ProviderSearchQuery,
    ProviderSearchResult,
  } from "../types";
  
  export interface MediaProviderDriver {
    slug: string;
    name: string;
    description: string;
    capabilities: MediaProviderCapability;
    search(query: ProviderSearchQuery): Promise<ProviderSearchResult[]>;
  }