# features/categories/

## Purpose
The categories feature: everything specific to product categories.

## Current contents (Phase 14)
- `types.ts` — the `Category` type, now supporting `parentId`,
  `children`, `icon`, `image`, `order`, `visible`, and `seo`. No real
  category data exists yet; this only prepares the shape for when real
  categories (from a future API/database) arrive.
- `temporary-categories.ts` — the temporary, static list of 6 category
  groupings (Paper, Office Supplies, etc.), each with a `slug`. Shared
  by the homepage's "Category Shortcuts" section and the `/categories`
  listing page so the list is defined once, not duplicated (a
  duplication caught during the Phase 12 self-review before it was
  introduced). Still not real database-backed categories.
- `components/CategoryCardSkeleton.tsx` — a pure-CSS skeleton shaped
  like `CategoryShortcut`, used by `src/app/categories/loading.tsx`
  instead of generic pulse rows (same reasoning as Phase 11's
  `ProductCardSkeleton`).
- `config.ts` — `CATEGORY_DETAILS_FEATURES`, a single feature flag
  (`showProductGrid`, currently `false`) marking where the category
  details page (`/categories/[slug]`) will switch from an honest empty
  state to a real product grid once category-product data exists. Not
  wired to any admin UI yet — see the file's own doc comment.

## What should NOT be placed here
- Real category instances/fake sample data. `temporary-categories.ts`
  is clearly named and documented as temporary/placeholder, not real
  data — see the Phase 6 and Phase 12 reports for why.
