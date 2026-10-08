# services/

## Purpose
The future data and integration layer of the app: calling APIs, running
Server Actions, talking to external systems (payment providers, shipping
providers, email, etc.), and other business services that fetch or send
data.

## Allowed contents
- Functions that fetch/send data (once a database or API exists).
- Wrappers around third-party integrations.
- Server Actions.

## What should NOT be placed here
- UI code or anything that renders on screen.
- Pure formatting/math helpers with no data-fetching involved (use
  `src/utils/`).
- No API, database, or external integration exists yet — this folder is
  intentionally empty in Phase 0.5.
