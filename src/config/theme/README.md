# config/theme/

## Purpose
Future theme-related settings — e.g. color palette definitions, spacing
scale, supported modes (light/dark) — that a future Theme Provider
(`src/providers/`) will read from.

## Allowed contents
- Plain configuration objects/values describing the theme.

## What should NOT be placed here
- Actual CSS (use `src/styles/`).
- React components (use `src/providers/` or `src/components/`).
- Nothing has been implemented yet — structure only.
