# features/products/

## Purpose
The products feature: everything specific to displaying products.

## Current contents (Phase 21)
- `types.ts` — the `Product` type, now with the full set of optional
  fields (SKU, brand, images, price, discount, currency, stock status,
  attributes, tags, dimensions, timestamps, SEO). No real product data
  exists yet; this only prepares the shape components expect once real
  data (from a future API/database) arrives.
- `components/ProductCard.tsx` — a single product summary, composed
  from `ProductImage` + `Price` + `StockBadge` + `ProductActions`
  rather than re-implementing that presentation itself. Not rendered
  with real data anywhere yet, but wired into `ProductGrid` so it stays
  type-checked.
- `components/ProductGrid.tsx` — responsive layout for a list of
  products, or the shared `EmptyState` when there are none (always true
  right now). Phase 17: also accepts an optional `emptyAction`,
  forwarded to `EmptyState`'s own `action` prop — used by
  `/products` to offer a "clear filters" link once real filtering
  exists; both existing call sites (products listing, related
  products) are unaffected since it's optional.
- `components/ProductFilters.tsx` — UI-only filter controls (category,
  brand, price, availability). Every control is disabled; there is no
  filtering logic yet. Phase 11: restructured from a horizontal grid
  into a vertical stack of `FilterSection` groups (used inside both
  `FilterSidebar` and `FilterDrawer`), and the "sorting" field was
  removed — it duplicated the sort control already in `ProductToolbar`.
- `components/FilterSection.tsx` — a titled group within the filter
  panel; the internal composition unit `ProductFilters` is built from.
- `components/FilterSidebar.tsx` — desktop-only layout wrapper around
  `ProductFilters` (persistent side column). Phase 17: accepts an
  optional `activeCount`, shown as a badge next to the heading — no
  call site passes a nonzero value yet.
- `components/FilterDrawer.tsx` — mobile-only disclosure trigger+panel
  around the same `ProductFilters` (so desktop and mobile never
  diverge). One of the few Client Components in the project — real
  open/close interactive state, same pattern as `Header`'s
  `MobileMenu`. Phase 17: same optional `activeCount` badge as
  `FilterSidebar`, shown on the trigger button.
- `components/ActiveFilters.tsx` — removable filter chips; renders
  nothing when empty (always true right now, since no real filtering
  exists). Phase 17: also accepts an optional `onClearAll`, rendered
  as a "پاک کردن همه" link only when there's more than one filter —
  same forwarded-handler convention as `onRemove`, not wired from any
  call site yet.
- `components/ProductToolbar.tsx` — UI-only listing toolbar (result
  count, sort — now with realistic option labels, still disabled —
  and grid/list view switch).
- `components/ProductCardSkeleton.tsx` — a pure-CSS, ProductCard-shaped
  skeleton (image + title + price rows), used by
  `src/app/products/loading.tsx` instead of generic pulse rows.
- `components/ProductImage.tsx` — a product's primary image with a
  fallback, plus an optional thumbnail strip when more than one image
  is provided. (Phase 10: this now covers what a separate
  "ProductGallery" component would have done — see the Phase 10 report
  for why a duplicate wasn't created.)
- `components/Price.tsx` — presentation-only price display (regular,
  discount, percentage, currency, or "unavailable"). Does no math of
  its own.
- `components/StockBadge.tsx` — presentation-only stock badge (in
  stock, low stock, out of stock, coming soon, discontinued), built on
  the existing `Badge` component.
- `components/ProductMeta.tsx` — SKU/brand/category/tags/attributes as
  a definition list, automatically hiding any field that isn't present.
- `components/ProductActions.tsx` — UI-only favorite/compare buttons.
  `compact` mode for `ProductCard`; full mode for the product details
  page. Completes the "reserved area" comments left in ProductCard
  since Phase 6/7. Phase 15: the full mode also carries a
  `PRODUCT_FEATURES.showAddToCartAction`-gated primary button. Phase
  21: that button now calls the real `useCart().addItem` (added in
  Phase 20) — genuinely functional, not a placeholder — but only
  renders when both the flag is on AND an optional `product` prop is
  given; no current caller has both (product details page has no
  product data; ProductCard's compact mode has no primary-action slot
  for it), so it stays invisible today. Now a Client Component (needs
  `useCart`), the same small leaf-level boundary as `FilterDrawer`.
- `components/ProductCard.tsx` — Phase 21: now passes its `product`
  through to `ProductActions` (data-flow preparation for cart
  integration — compact mode doesn't use it yet, but the prop now
  flows correctly should that change).
- `config.ts` — `PRODUCT_FEATURES`, feature flags for parts of the
  product experience that depend on data this project doesn't have
  yet: `showAddToCartAction` (Phase 15); `showRelatedProducts` /
  `showRecentlyViewed` / `showCompareProducts` / `showProductFAQ`
  (Phase 16); and `showSearchSuggestions` / `showRecentSearches` /
  `showPopularSearches` / `showSavedFilters` (Phase 17, wired in
  `src/app/products/page.tsx`). All currently `false`. Not wired to
  any admin UI yet — see the file's own doc comment.
- `components/RelatedProductsSection.tsx` — a titled Section wrapping
  `ProductGrid` (reusing its existing empty-state handling, including
  the "no results" message via `ProductGrid`'s existing `emptyMessage`
  prop — no separate "no filter results" component was needed), for
  "related products" on the product details page and any future
  titled product-collection block.

- `services/product-service.ts` — The **Data Access Boundary**. All
  product retrieval (listing and single product) must go through this
  service rather than importing fixtures directly. This prepares the
  app for future API integration.
- `data/fixtures.ts` — Contains realistic development-only product
  data. Labeled as "Honest Incompleteness" to avoid pretending it's a
  production backend.

## What should NOT be placed here
- Backend API logic (fetch/axios calls directly in components).
- Persistence logic.
- Price calculation or business rules (taxes, shipping).
- Authentication logic.
