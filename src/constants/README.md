# constants/

This folder is reserved for fixed values used across the project — things
like site name, supported languages, or route paths — so they are written
once and reused everywhere, instead of being copy-pasted in many files.

## Current contents (Phase 12.5)
- `messages.ts` — `STORE_NOT_READY_MESSAGE`, the shared "این بخش پس از
  افزودن محصولات تکمیل خواهد شد." copy. Extracted during the Phase 12.5
  cleanup sprint: the same literal string was repeated across 7 files
  (product/category pages and components) instead of having one source
  of truth.
