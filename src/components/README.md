# components/

This folder holds reusable pieces of user interface (UI) — things like buttons,
cards, input fields, headers, and footers.

Rule for later phases: a component should not know about business logic
(like "how much does this product cost"). It should only know how to display
things it is given. This keeps components reusable across the whole site
(store pages, admin pages, account pages, etc.) for years to come.
Feature-specific components belong in `src/features/<feature>/` instead,
once features exist.

## Subfolders

- `ui/` — the smallest, most generic building blocks (e.g. Button, Input,
  Badge). No business meaning, no page-specific logic.
- `layout/` — structural pieces used to arrange a page (e.g. Header,
  Footer, Sidebar, PageContainer). Concerned with page structure, not with
  what data is shown.
- `shared/` — reusable components that combine multiple `ui/` pieces and
  are used across several features/pages, but are still generic (e.g. a
  reusable EmptyState or ConfirmDialog). If a component is only used by
  one feature, it belongs in that feature's folder instead, not here.

No components have been created yet in any subfolder — only the structure
is prepared.
