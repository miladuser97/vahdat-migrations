# utils/

## Purpose
Small, pure helper functions with no business meaning — for example,
capitalizing a string, clamping a number, or combining class names.
"Pure" means: given the same input, always returns the same output, and
does not depend on business rules.

## Allowed contents
- Small, generic, framework-agnostic helper functions.

## What should NOT be placed here
- Business logic (for example, "how tax is calculated" is a business
  rule, not a pure helper — that belongs in `src/services/` or
  `src/features/` once it exists).
- Anything that fetches data (use `src/services/`).

## Current contents (Phase 8)
- `cn.ts` — joins class name fragments, skipping falsy values. Used by
  every component in `src/components/` that accepts a `className` prop.
- `form-utils.ts` — generic form helpers: `buildDescribedBy` (used by
  `FormField` to wire `aria-describedby`) and `clampNumber`.
- `validation.ts` — generic, package-free validation checks: `required`,
  `isEmail`, `minLength`, `maxLength`, `isPhone`. Pure boolean checks
  only — deciding the error message shown is left to the caller (e.g.
  via `FormMessage`).

## Note on `src/lib/`
`src/lib/` (created in Phase 0) was kept open for the same kind of
framework-agnostic helpers as a placeholder. Now that real code exists,
`src/utils/` is the decided home for pure helpers going forward —
`src/lib/` remains empty and reserved for a different future purpose
(e.g. third-party client setup) rather than pure helpers, to avoid the
two folders splitting the same responsibility.
