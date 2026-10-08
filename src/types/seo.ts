/**
 * Shared SEO metadata shape — a common contract any feature (products,
 * categories, and future ones) can attach to its own entities. Kept
 * decoupled from Next.js's own `Metadata` type on purpose, so it can
 * also describe a future non-Next context (e.g. an API response) and
 * so a change in Next's type doesn't ripple into every feature.
 *
 * Types only — no implementation, no wiring into actual page metadata
 * yet. See src/features/products/types.ts and
 * src/features/categories/types.ts for where this is used.
 */
export interface SeoImage {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
}

export interface SeoMetadata {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  keywords?: string[];
  image?: SeoImage;
  noIndex?: boolean;
}
