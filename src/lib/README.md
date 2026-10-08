# lib/

This folder is reserved for setup/configuration code for external
clients and SDKs once they exist (for example, initializing a database
client or a payment SDK) — things with a bit of setup, not plain
functions.

Pure helper functions (formatting, validation, class names, etc.) go in
`src/utils/` instead (decided in Phase 3) — `src/lib/` is not a second
home for the same kind of code.

Nothing is created here yet.
