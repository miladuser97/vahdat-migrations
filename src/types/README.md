# types/

This folder is reserved for shared TypeScript type definitions — shapes
of data that many parts of the project need to agree on, but that don't
belong to one specific feature (feature-specific types, like `Product`,
live in `src/features/<feature>/types.ts` instead).

## Current contents (Phase 7)
- `seo.ts` — `SeoMetadata`/`SeoImage`, a shared contract any feature can
  attach to its own entities (used by `Product.seo` and `Category.seo`).
  Types only — no implementation, not wired into any page's actual
  metadata yet.
- `media.ts` — `ImageRef`, a minimal shared image shape reused by both
  `Product` (images/thumbnail) and `Category` (icon/image), so the two
  features don't each invent a slightly different image type.

