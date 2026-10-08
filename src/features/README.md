# features/

## Purpose
Home for future business modules, organized by feature instead of by file
type. Each feature (for example, later: `products`, `orders`, `accounts`)
will get its own subfolder here containing everything specific to it
(its own components, logic, and types).

## Allowed contents
- One subfolder per business feature, created only when that feature is
  actually being built.
- Inside a feature subfolder: code that is specific to that feature only.

## Current contents (Phase 6)
- `products/` — the products feature (types + reusable, currently
  data-less components). See its own README.
- `categories/` — the categories feature (types only so far). See its
  own README.

## What should NOT be placed here
- Generic/reusable UI pieces used by many features (those belong in
  `src/components/`).
- Pure helper functions with no business meaning (those belong in
  `src/utils/`).
