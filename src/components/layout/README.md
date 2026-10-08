# components/layout/

## Purpose
Structural pieces used to arrange a page — Header, Footer, Sidebar,
PageContainer, and similar. These are about page structure, not content.

## Current contents (Phase 12.5)
- `Container.tsx` — reusable responsive width/padding wrapper used on
  every page.
- `Header.tsx` — sticky site header. Navigation (خانه/محصولات/
  دسته‌بندی‌ها/درباره ما/تماس با ما) with active-link highlighting,
  desktop nav, and a mobile menu toggle. Client component (needs the
  current route and toggle state).
- `MobileMenu.tsx` — the expandable mobile navigation panel Header
  opens. A plain accessible disclosure, not a modal (no backdrop, no
  focus trap, no animation library); Escape closes it.
- `Footer.tsx` — site footer, links grouped into two columns ("شرکت",
  "راهنما") now that there are 9 links across the whole site. Reserved
  (commented, not fake) areas for future social links and trust badges.
- `Section.tsx` — vertical-rhythm wrapper for a block within a page,
  with an optional title/description/actions header.
- `PageHeader.tsx` — compact, top-of-page title block for **utility**
  pages (Contact, Products, Categories) — title + description +
  actions, right-aligned.
- `PageHero.tsx` — large, centered top-of-page hero for **marketing**
  pages (Home, About, Business). A page uses one or the other, never
  both. (Deliberately not called "ContentSection"/"SectionHeading" as
  the Phase 9 brief suggested — those would have duplicated `Section`;
  see the Phase 9 report.)
- `BackgroundSection.tsx` — a full-width color band wrapping
  `Container` (tone: background/surface/muted). Extracted in the
  Phase 12.5 cleanup sprint after the Architecture Review found the
  same `<div className="bg-X"><Container>...</Container></div>`
  pairing repeated 17 times across Home, About, and Business. Used by
  all three pages now.

## What should NOT be placed here
- Small generic controls (use `components/ui/`).
- Anything tied to one specific feature (use `src/features/<feature>/`).
