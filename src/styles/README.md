# styles/

## Purpose
Home for the project's design system as it grows beyond a single
`globals.css` file — for example, design tokens (spacing, colors, font
scale) shared across the whole site.

## Where the actual tokens live (Phase 2)
To avoid duplicating values in two places, the real token values live in:
- `tailwind.config.ts` — colors, typography scale, spacing, radius,
  shadow, transition, and container-width tokens.
- `src/app/globals.css` — the raw color values (as CSS variables, for
  both light and dark themes).

This folder holds the *documentation* of that system rather than a
second copy of it.

## Typeface (Phase 5)
The project uses a single typeface, **Vazirmatn**, loaded via
`next/font/google` in `src/app/layout.tsx` (self-hosted at build time —
no CDN, no runtime request to Google) and exposed as the `sans` font via
a CSS variable (`--font-vazirmatn`).

**Why one font, not two:** the original brief suggested a second display
typeface (Estedad) for headings. Two type families were evaluated and
rejected in favor of one, because:
- Vazirmatn ships as a variable font with a full weight range
  (100–900), which is already enough to build a complete, clearly
  distinct hierarchy (see the weight guide below) without a second
  family.
- A second font means a second file to download — real, avoidable
  weight on every page load, working against "Fast" and "Performance
  First".
- Two Persian typefaces from different designers rarely share matched
  proportions (x-height, stroke contrast); pairing them well needs real
  type-design judgment, and a mismatch reads as inconsistent rather
  than premium — the opposite of "timeless" and "avoid visual noise".
- A single, well-used typeface is the more restrained, calmer choice,
  which matches this project's stated design philosophy better than an
  extra font would.

## Typography guide
Tailwind's `fontSize` scale (in `tailwind.config.ts`) sets font size,
line-height, and letter-spacing together. It cannot carry font-weight,
so pair each size with a weight utility — refined in Phase 5 for a
clearer hierarchy:

| Token          | Weight         | Example usage                          |
|----------------|----------------|------------------------------------------|
| `text-display` | `font-bold`    | Page hero titles                          |
| `text-h1`      | `font-bold`    | Page titles                                |
| `text-h2`      | `font-semibold`| Section titles                             |
| `text-h3`      | `font-semibold`| Sub-section / card titles                  |
| `text-h4`      | `font-medium`  | Small headings (Logo is a deliberate       |
|                |                | exception, using `font-semibold` — a       |
|                |                | logotype is a brand mark, not a regular    |
|                |                | heading)                                   |
| `text-body-lg` | `font-normal`  | Intro paragraphs                           |
| `text-body`    | `font-normal`  | Default body text                          |
| `text-body-sm` | `font-normal`/`font-medium` | Secondary text; `font-medium` for nav/active links |
| `text-caption` | `font-normal`  | Fine print, labels                         |
| Buttons/nav    | `font-medium`  | Baked into `Button`'s base styles           |

**Letter-spacing note:** only `display`/`h1` carry a small negative
letter-spacing (`-0.01em`), and only `caption` carries a small positive
one. Persian is a joined, cursive script — adding letter-spacing to
body or navigation text would break letterforms apart and hurt
readability, so none of the other sizes use it. This is a deliberate
omission, not an oversight.

## Icon & social-image files (Phase 5)
`src/app/icon.tsx`, `apple-icon.tsx`, and `opengraph-image.tsx` use
Next's built-in `ImageResponse` (via `next/og`) to generate real image
files at build/request time — no external image tool or package. They
use a single-letter typographic monogram ("ت", the first letter of
تحریرینو) since there is no designed graphical logo yet; inventing one
would be a fake asset. These three files hardcode hex colors matching
the real primary/background tokens — a documented, necessary exception,
since `ImageResponse` renders in an isolated context with no access to
Tailwind/CSS variables.

The Open Graph image deliberately does **not** render the full joined
Persian wordmark ("تحریرینو") as text, because Satori (the engine behind
`ImageResponse`) has known gaps in Arabic-script shaping for connected
letters, and this can't be verified without a live build. It reuses the
same safe single-letter monogram plus a Latin transliteration instead.

## Color system summary
Semantic tokens (background, surface, border, text-primary, text-secondary,
primary, secondary, accent, muted, success, warning, error, info) are
defined as CSS variables in `globals.css` under `:root` (light) and
`.dark` (dark, navy — never pure black), then exposed as Tailwind color
utilities in `tailwind.config.ts`. Components must always use these
utilities (e.g. `bg-primary`, `text-text-secondary`) and never a raw hex
value. The only exceptions are the `themeColor` viewport metadata and
the icon/OG image files above, both of which require literal values by
platform/API design.

## What should NOT be placed here
- Component-specific styles (keep those next to their component).
- A second, duplicate copy of token values already defined in
  `tailwind.config.ts` / `globals.css`.
