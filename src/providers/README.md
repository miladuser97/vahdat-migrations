# providers/

## Purpose
Global "wrappers" that give the whole app access to shared context — for
example, a Theme Provider (light/dark mode), a Session Provider (who is
logged in), or a Settings Provider (site-wide preferences).

## Allowed contents
- React Context Providers that wrap the whole app or large sections of it.

## Current contents (Phase 4)
- `ThemeProvider.tsx` — holds the current light/dark theme, persists the
  choice to `localStorage`, and exposes `useTheme()`. No external
  package. The very first paint's theme (before this provider mounts)
  is decided by a small inline script in the root layout, to avoid a
  flash of the wrong theme; this provider only takes over from there.

## What should NOT be placed here
- Regular UI components (use `src/components/`).
- Business logic (use `src/services/` or `src/features/`).

