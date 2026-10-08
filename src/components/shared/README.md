# components/shared/

## Purpose
Reusable components that combine multiple `ui/` pieces and are used
across several features or pages, while still being generic (e.g. an
EmptyState, a ConfirmDialog, a Pagination control).

## Allowed contents
- Composite components with no business logic, used in more than one
  place.

## Current contents (Phase 12.5)

`LoadingState.tsx` (built in Phase 7) was removed in the Phase 12.5
cleanup sprint: the Architecture Review found it had zero real
consumers — both places that once used it (`products/loading.tsx`,
`categories/loading.tsx`) had already been migrated to shape-matched
skeletons (`ProductCardSkeleton`, `CategoryCardSkeleton`) in Phases 11
and 12, and nobody removed the now-unused original. If a future page
needs a generic (non-card-shaped) loading skeleton, recreate a small
component for that real need rather than assuming this gap should be
filled preemptively.

- `Logo.tsx` — the brand wordmark ("تحریرینو"). Pure display component,
  no link or logic of its own; wrap it in a `<Link>` where a clickable
  logo is needed (see `components/layout/Header.tsx`).
- `Breadcrumb.tsx` — displays a trail of items. Pure UI: renders plain
  `<a>` tags, with no routing awareness (no next/link). Now used on the
  product/category detail placeholder pages, with a non-link final item
  rather than a fabricated product/category name.
- `SearchBar.tsx` — UI-only search input (disabled by default; no
  search logic yet, since there is no product data to search). Also
  supports a `loading` state (CSS spinner), a UI-only `onClear` button,
  and a visual-only `suggestions` dropdown (Phase 12; no call site
  passes it yet, so it renders nothing and needs no open/close
  interaction logic) — all ready for real search to be wired in later
  without another API change.
- `CategoryShortcut.tsx` — navigational card (icon + title + optional
  description) linking to a category-like page. Used on the homepage
  with a temporary, static list of category groupings (not real
  database-backed categories); all currently link to `/categories`, not
  invented slugs.
- `CustomerGroupCard.tsx` — icon + title card for a customer segment
  (used on the homepage with the real segments from the project brief:
  schools, offices, etc. — not invented data).
- `EmptyState.tsx` — icon + title + optional description/action, for
  honestly telling the user there is nothing here yet. Used by
  `ProductGrid` and the product details page's "related products" area.
- `ErrorState.tsx` — a friendly, accessible ("role=alert") error
  message with an optional action. Connected via the root
  `src/app/error.tsx`.
- `PlaceholderBlock.tsx` — an honest inline note that running content
  (not a whole list) isn't finalized yet — used throughout About,
  Business, Privacy, and Terms. Distinct from `EmptyState`, which is
  for empty lists/collections with an icon and optional action.
- `ContactCard.tsx` — icon + label + value card for one contact method
  (phone, email, address, hours). Used on the Contact page.
- `FAQItem.tsx` — a single collapsible question/answer built from
  native `<details>`/`<summary>` — no JavaScript, fully accessible.
- `FAQList.tsx` — renders a list of `FAQItem`s, optionally grouped by
  category. (A separate "FAQCategory" component was considered and
  folded in here instead — see the Phase 9 report.)

## What should NOT be placed here
- Components used by only one feature (put those in
  `src/features/<feature>/` once that feature exists).
- Business logic of any kind.

