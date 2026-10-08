# Tahririno — Phase 3 Report: Authentication UI (Login / Register / Session UX)

**Scope:** Authentication UI only, per explicit instruction. Payment, Checkout, and Inventory code from Phase 2 were not modified, with one narrow exception noted below (a missing import in `auth-actions.ts` that was a direct blocking dependency, not a Phase-2-area file).

---

## 1. Executive Summary

Before this phase, Tahririno had a real, working authentication backend — bcrypt password hashing (cost 12), hashed session tokens, brute-force lockout, timing-safe comparison — and a real `AuthContext` already correctly wired to that backend and already mounted at the root layout. None of it was reachable: there was no `/login` or `/register` page anywhere in the app, `/account` hardcoded `isAuthenticated = false` regardless of session state, the Header had no account link, and there was no logout control anywhere in the UI. `getCurrentUserAction` (used by `AuthContext` on every page load) also contained a bug — it called `getAuthenticatedUser()` without importing it, a `ReferenceError` waiting to happen the first time that code path executed.

This phase builds the missing UI layer and fixes that one bug. No password hashing, session hashing, brute-force logic, or validation rule was rewritten — this phase only adds callers for code that already existed and had none.

**What this report cannot claim:** as in Phase 2, nothing here has been confirmed by an actual compiler or test run — this sandbox still has no network access (`npm install` still fails with `403 Forbidden`). Every claim below is the result of manual, file-by-file, call-site tracing, not a build.

---

## 2. Objectives of This Phase

Restated from your instruction:
1. Connect the existing authentication backend to the frontend, without replacing or rewriting it.
2. Build Login and Register pages using the existing server actions, validation, session management, and password/session hashing.
3. Implement: login page, register page, logout flow, auth-aware navigation, session-aware account page, proper redirects, form validation, loading states, error handling, success feedback, mobile-responsive RTL UI.
4. Verify `loginAction`/`registerAction`/`logoutAction` are actually reachable, `AuthContext` reflects the real user, the Account page no longer uses placeholder state, feature flags stay consistent, and no authentication logic is duplicated.
5. Introduce no mock authentication and weaken no existing security control.

---

## 3. Every Issue Found (Pre-Phase-3 State)

| # | Issue | Where | Severity |
|---|-------|-------|----------|
| P3-1 | `getCurrentUserAction()` calls `getAuthenticatedUser()`, which was never imported into the file. Every call to this action (which `AuthContext` makes on mount, on every page) would throw `ReferenceError: getAuthenticatedUser is not defined`. | `auth-actions.ts` | **Critical** — a live bug in already-"verified" code, not just an unreachability problem |
| P3-2 | No `/login` or `/register` route existed anywhere in `src/app`. `loginAction`/`registerAction` had zero UI callers. | (missing) | **Critical** |
| P3-3 | `/account` hardcoded `const isAuthenticated = false` and rendered a disabled "ورود / ثبت‌نام (به‌زودی)" button — a real, working login/register system existed one directory over and was never linked to. | `account/page.tsx` | **Critical** |
| P3-4 | `/account/profile`, `/account/orders`, `/account/addresses` had no authentication check of their own at all — they rendered their (placeholder) content regardless of session state, while the sibling `/account` page pretended no one could ever be logged in. Inconsistent, and not actually gated. | `account/layout.tsx` + subpages | High |
| P3-5 | No logout control existed anywhere in the UI. `logoutAction`/`AuthContext.logout` had zero callers. | (missing) | High |
| P3-6 | The Header had no account/login link and did not read auth state at all. | `Header.tsx` | High |
| P3-7 | `account.authentication` feature flag was `false` despite the backend being fully implemented — the flag was gating a real feature as if it were vaporware. | `config/features.ts` | Medium |
| P3-8 | `AuthContext.tsx`'s own doc comment claimed it was "fixture-based for dev" — false; it already called the real server actions. `features/account/types.ts`'s `User` type comment called itself a "placeholder for future authentication integration" — also false by the time it was written, and doubly false now. | `AuthContext.tsx`, `types.ts` | Low — misleading, not a functional bug |
| P3-9 | `AccountPage.test.tsx` asserted the old hardcoded-`disabled` unauthenticated button — a test actively encoding the broken behavior as correct. | `account/__tests__/AccountPage.test.tsx` | Low — test debt, not a runtime issue |

**Confirmed as already correct (verified, not rebuilt):**
- `loginAction`: bcrypt compare, dummy-hash timing-attack mitigation, 5-attempt/15-minute lockout, session token generated via `crypto.randomUUID()` and stored **hashed** (`sha256`) in the `Session` table, raw token set as an `httpOnly`/`secure`(prod)/`sameSite=lax` cookie.
- `registerAction`: bcrypt hash at cost 12, mobile/email uniqueness check before insert.
- `logoutAction`: deletes the session row by hashed token, clears the cookie.
- `getAuthenticatedUser`/`requireAuth`/`requireAdmin` (`auth-utils.ts`): hashes the cookie token before lookup, checks expiry.
- `LoginSchema`/`RegisterSchema` (`auth-service.ts`): real zod validation (mobile regex, 8-char minimum password, email format).
- `AuthContext.tsx`: already called the real `loginAction`/`logoutAction`/`getCurrentUserAction` — the "fixture-based" comment (P3-8) was inaccurate, not the implementation.
- `AuthContext` was already mounted at the root layout (`src/app/layout.tsx`), wrapping the whole app.

---

## 4. Root Cause Analysis

- **P3-1** is a straightforward missing-import bug, almost certainly introduced when `getAuthenticatedUser` was factored out into `auth-utils.ts` at some point without updating every caller.
- **P3-2, P3-3, P3-5, P3-6** share the same root cause identified in Phase 1 and Phase 2 for the payment flow: backend and frontend were built in different, disconnected passes, and nothing ever went back to connect them once the backend existed. The `account.authentication` feature flag (P3-7) being `false` is consistent with this — it reads as the flag having been turned off *because* the frontend wasn't built yet, then never revisited once the backend was.
- **P3-4** is a consequence of the guard living only in `account/page.tsx` (and even there, being fake) — nothing centralized the auth requirement for the whole `/account/*` tree.
- **P3-8, P3-9** are stale artifacts of P3-2/P3-3 having been true for a long time — the comments and the test were accurate descriptions of the code at some point in its history and were never updated when they stopped being true.

---

## 5. Every Code Change Made

### `src/lib/server/auth-actions.ts`
- Added `import { getAuthenticatedUser } from "./auth-utils";` — fixes the `ReferenceError` in `getCurrentUserAction` (P3-1). This was the one edit in this phase to a file outside the account/auth-UI area proper, and it was a direct, blocking dependency: `AuthContext.refreshSession()` (called on every page load) cannot work without it.
- Removed an unused `import { z } from "zod"` (pre-existing dead import, unrelated to any logic — cleaned up while already verifying this file's imports).
- No change to any hashing, session, lockout, or validation logic in this file.

### `src/config/features.ts`
- `account.authentication.enabled` flipped from `false` to `true` — the flag now accurately reflects that authentication is implemented. Verified this doesn't trip `validateFeatureConfig`'s existing conflict rules (none reference `authentication`).

### `src/features/account/validation.ts` — **new file**
- `validateLoginFields`/`validateRegisterFields`: derive per-field error messages from `LoginSchema`/`RegisterSchema` (imported from the existing `auth-service.ts`, not redefined) via `.safeParse(...).error.issues`. No validation rule is defined here — this file only decides how to surface the *existing* schema's errors per-field for the forms.
- `confirmPasswordError`: a client-only equality check (password vs. confirm-password) — not a schema rule, since the server never sees a `confirmPassword` field.

### `src/features/account/components/LoginForm.tsx` — **new file**
- Client Component. Mobile number + password fields, built from the existing `FormField`/`FormGroup`/`Input` primitives (same pattern as `CustomerInformationSection.tsx`). Field-level errors from `validateLoginFields`, shown after blur or after a submit attempt.
- Calls `useAuth().login(...)` — the existing context method, not a new auth call. Loading state is local (`isSubmitting`), separate from the context's own `status`, so the initial silent session check on page load doesn't visually disable the form.
- Redirects via `router.replace(...)` to `?redirect=` (if present) or `/account` once `status === "authenticated"`. Also redirects immediately if the user is already authenticated when visiting `/login` directly.
- Displays `useAuth().error` (the real error string `loginAction` returns — e.g. lockout message, wrong-credentials message) — never a fabricated message.

### `src/features/account/components/RegisterForm.tsx` — **new file**
- Client Component. First/last name, mobile, optional email, password, confirm-password. Field errors from `validateRegisterFields` + `confirmPasswordError`.
- Calls `register(...)` from `src/services/auth-service.ts` (the existing wrapper over `registerAction`). On success, calls `useAuth().login(...)` with the same credentials to start a real session immediately (since `registerAction` itself only creates the user row and does not log them in — verified by reading the function; it never touches `cookies()` or `Session`).
- If auto-login doesn't result in an authenticated session, shows a "your account was created, please log in" message with a link to `/login` — never claims a session exists when it doesn't.
- Same redirect and already-authenticated handling as `LoginForm`.

### `src/features/account/components/AccountLayoutClient.tsx` — **new file**
- Client Component. The single auth gate for all of `/account/*`, replacing the previous hardcoded-`false` check that only existed (fake) on the dashboard page and didn't exist at all on the subpages (P3-3, P3-4). Reads `useAuth().status`:
  - `"loading"` → a lightweight "checking session" message.
  - anything else non-authenticated (`"unauthenticated"`, `"expired"`, `"error"`) → the friendly prompt (now with a real, enabled `/login?redirect=<current path>` link, replacing the old disabled button) and a link home.
  - `"authenticated"` → renders `PageHeader` + `AccountSidebar` + `children` (moved here from `account/layout.tsx`).

### `src/features/account/components/AccountDashboard.tsx` — **new file**
- Client Component. The actual dashboard body — greets the user by first name (from `useAuth().user`), links to orders/addresses, shows the account's mobile number. Does not re-check authentication itself (that's `AccountLayoutClient`'s job now — not duplicated here).

### `src/features/account/components/AccountSidebar.tsx`
- Added a "خروج از حساب" (log out) button at the bottom of the existing nav list. Calls `useAuth().logout()` (the existing context method, itself calling `logoutAction`) then `router.push("/")`. This is the one previously-unreachable `logoutAction` call path (P3-5), now reachable.

### `src/app/account/layout.tsx`
- Reduced to a thin Server Component shell: `Container` + `<AccountLayoutClient>{children}</AccountLayoutClient>`. The `PageHeader`/sidebar/two-column layout that used to live here unconditionally now lives inside `AccountLayoutClient`, rendered only once authenticated.

### `src/app/account/page.tsx`
- Replaced the hardcoded `isAuthenticated = false` block entirely. Now just renders `<AccountDashboard />` — the auth check moved to the layout (P3-3 fixed; the duplication that would result from checking auth in both places was avoided by moving the check up, not copying it down).

### `src/app/login/page.tsx`, `src/app/register/page.tsx` — **new files**
- Thin Server Components (keep `metadata` exportable) wrapping `<LoginForm />`/`<RegisterForm />` in `<Suspense>` (required for `useSearchParams()` in the App Router — same pattern already used for `PaymentResultBanner` in Phase 2).

### `src/components/layout/Header.tsx`
- Added `useAuth()` and `SITE_FEATURES.navigation.headerAccount.enabled` (an existing flag that was already `true` but read by nothing). Desktop: an account icon-link next to the theme toggle — `/login` labeled "ورود" when signed out, `/account` labeled with the user's first name when signed in. Mobile: the same link appended to the items passed into the existing `MobileMenu` component (no changes to `MobileMenu` itself).

### `src/components/ui/icons.tsx`
- Added `UserIcon` (account nav) and `LogoutIcon` (sidebar logout button), following the exact style/pattern of the existing `CartIcon`.

### `src/features/account/AuthContext.tsx`, `src/features/account/types.ts`
- Corrected the stale/inaccurate doc comments (P3-8) — no behavioral change in either file.

### `src/app/account/__tests__/AccountPage.test.tsx`
- Rewritten (P3-9) to test the new architecture: three cases against `AccountLayoutClient` (loading / unauthenticated-with-real-enabled-login-link / authenticated-with-sidebar-and-logout), and one case against `AccountPage` (greets the signed-in user by name). Mocks `@/features/account/AuthContext`'s `useAuth` directly rather than hitting `cookies()`/`prisma`, consistent with how `brute-force.test.ts`/`server-actions.test.ts` mock at the boundary they're testing.

---

## 6. Every Modified File (Full List)

1. `src/lib/server/auth-actions.ts`
2. `src/config/features.ts`
3. `src/features/account/components/AccountSidebar.tsx`
4. `src/app/account/layout.tsx`
5. `src/app/account/page.tsx`
6. `src/components/layout/Header.tsx`
7. `src/components/ui/icons.tsx`
8. `src/features/account/AuthContext.tsx`
9. `src/features/account/types.ts`
10. `src/app/account/__tests__/AccountPage.test.tsx`

## 7. New Files Created

1. `src/app/login/page.tsx`
2. `src/app/register/page.tsx`
3. `src/features/account/validation.ts`
4. `src/features/account/components/LoginForm.tsx`
5. `src/features/account/components/RegisterForm.tsx`
6. `src/features/account/components/AccountLayoutClient.tsx`
7. `src/features/account/components/AccountDashboard.tsx`
8. `docs/phase-3-report.md` (this report)

## 8. Deleted Files

None.

## 9. Database/Schema Changes

**None.** `prisma/schema.prisma` was not read or modified this phase (the `User`/`Session` models were already inspected in Phase 1 and found adequate for this work — `firstName`, `lastName`, `mobileNumber`, `email`, `role`, `loginAttempts`, `lockoutUntil` all already existed and needed no changes).

## 10. Security Improvements

This phase's job was UI wiring, not backend hardening, so there are no *new* security mechanisms introduced — but two things are worth stating plainly:
- **Fixed a real bug that would have broken session verification at runtime** (P3-1) — without the missing import, `getCurrentUserAction` would throw on every call, which (depending on how that exception propagated) risked either crashing the auth check or, if swallowed somewhere, silently failing closed. Either way, it was not a safe or working state.
- **No security control was weakened.** bcrypt (cost 12), session-token hashing at rest, the dummy-hash timing mitigation, and the 5-attempt/15-minute lockout in `loginAction` are byte-for-byte unchanged. Confirmed by inspection — the only edit to `auth-actions.ts` was the one added import line and the one removed unused import line.
- The new client-side `validateLoginFields`/`validateRegisterFields` are **UX only** — they reuse the same zod schemas the server already authoritatively re-validates against inside `loginAction`/`registerAction`. Nothing about server-side validation changed or was bypassed.

## 11. Architecture Improvements

- Centralized the `/account/*` authentication gate into one component (`AccountLayoutClient`) instead of it being (incorrectly) per-page or absent — this is the concrete fix for "no authentication logic duplicated."
- Introduced `features/account/validation.ts` as the same kind of per-feature validation module the checkout feature already has (`features/checkout/validation.ts`), keeping the codebase's existing convention rather than inventing a new one.
- `AccountDashboard`/`AccountLayoutClient` split mirrors the existing `checkout/page.tsx` → `CheckoutView` pattern (thin Server Component for `metadata`, Client Component for interactive/context-dependent content) already established in Phase 2 — not a new pattern.

## 12. Validation and Verification Performed

**What I actually did:**
- Read `auth-actions.ts`, `auth-utils.ts`, `auth-service.ts`, `AuthContext.tsx`, the whole `account/` app directory, `AccountSidebar.tsx`, `types.ts`, `features.ts`, and the `User`/`Session` Prisma models in full before writing any code.
- Traced reachability of all four target functions by `grep`-searching the entire `src` tree (see §12a below).
- Confirmed `AuthProvider` is already mounted at the root layout, so every new component using `useAuth()` has a valid provider in the real app (not just in tests).
- Cross-checked every UI primitive used (`FormField`, `FormGroup`, `Input`, `FormMessage`, `Card`, `Button`/`buttonVariants`, `PageHeader`) against its actual prop signature by reading the component source, not from memory.
- Confirmed the Tailwind spacing token `2xl` used on the new pages exists in `tailwind.config.ts`.
- Searched for and confirmed **zero** remaining references to the old "ورود / ثبت‌نام (به‌زودی)" placeholder text or `isAuthenticated = false` pattern anywhere in `src`.
- Searched for any other test file rendering `Header` or an account-layout page directly that might break from the new `useAuth()` dependency — found none.
- Ran a simple static unused-import scan across every new/edited file (a small Node script counting identifier occurrences) — found one pre-existing unused import (`z` in `auth-actions.ts`, not introduced by this phase) and removed it; found nothing else.

**§12a — Reachability confirmed by direct trace:**
- `loginAction` ← `auth-service.login` ← `AuthContext.login` ← `LoginForm.handleSubmit` — **reachable**.
- `registerAction` ← `auth-service.register` ← `RegisterForm.handleSubmit` — **reachable**.
- `logoutAction` ← `auth-service.logout` ← `AuthContext.logout` ← `AccountSidebar.handleLogout` — **reachable**.
- `getCurrentUserAction` ← `AuthContext.refreshSession` (on mount, every page, via the root-mounted `AuthProvider`) — **reachable**, and now import-error-free.

**What I did not do, and cannot do in this environment:**
- No `npm install`, `tsc`, `vitest`, or `next build` — same network limitation as Phase 1 and Phase 2. Nothing here has been compiler- or test-runner-verified.

## 13. Tests Executed and Their Results

**None were executed.** `src/app/account/__tests__/AccountPage.test.tsx` was rewritten to test the new architecture (three `AccountLayoutClient` states + one `AccountPage` greeting case), but has not been run. As in Phase 2, this represents my best manual reasoning about correctness, not a verified pass. The three pre-existing auth backend tests (`server-actions.test.ts`, `brute-force.test.ts`) were not modified and should be unaffected — they test `loginAction` directly and don't touch anything changed this phase — but this too is untested, not confirmed.

## 14. Remaining Issues

1. **No compiler/test verification** of any change this phase (see §12–13) — same standing limitation as Phases 1–2.
2. **`/account/profile`, `/account/orders`, `/account/addresses` remain placeholder content** — they are now correctly *gated* behind real authentication (via `AccountLayoutClient`), but their bodies still say "این بخش... تکمیل خواهد شد" / show empty states regardless of the real signed-in user's actual orders/addresses. Building those out was explicitly not this phase's objective (Login/Register/Session UX only) and was deliberately left alone.
3. **No route-level (middleware) protection** — the auth gate is a client-side React check in `AccountLayoutClient`. This is not a security hole (every server action that returns real data, e.g. `getUserOrdersAction`/`getOrderAction` from Phase 1/2, already does its own server-side `getAuthenticatedUser`/ownership check), but it does mean the `/account/*` page shell itself briefly renders before the client-side check resolves, and there's no `middleware.ts` redirecting unauthenticated requests at the edge. No `middleware.ts` exists anywhere in this project; introducing one would be a new architectural pattern, not something this phase's scope asked for.
4. **Guest checkout is unaffected** — Phase 2's checkout flow still creates guest orders (`userId: null`) regardless of whether the customer is logged in. This phase did not connect authentication to checkout (not in scope), so a logged-in customer's orders are not yet automatically associated with their account at purchase time. This is a real product gap worth flagging for a future phase.
5. **`updateProfileAction`** (flagged in Phase 1 as a no-op stub) is still a no-op stub — the new Profile page displays nothing from it since Profile page content wasn't rebuilt this phase; out of scope.
6. **Notifications remain fake** — unrelated to this phase, unchanged since Phase 1/2.

## 15. Risks

- **Unverified code risk**, as in every prior phase — no compile/test run. The most likely failure points if any: the generic `<K extends keyof FormState>` helper in `RegisterForm.tsx`, and the `useAuth`/`useSearchParams`/`useRouter` mock wiring in the rewritten test file.
- **Brief unauthenticated-shell flash**: because the auth gate is client-side, a signed-out visitor navigating directly to `/account/orders` will briefly see the "checking session" state before the real prompt renders, rather than being redirected before any account-shell HTML is sent. Cosmetic, not a data-exposure risk (no data is fetched or rendered before the check resolves).
- **Auto-login-after-register edge case**: if `registerAction` succeeds but the immediately-following `login()` call fails for a reason unrelated to the credentials just used (e.g. a transient DB error), the person sees "your account was created, please log in" rather than the specific underlying error. This trades a small amount of diagnostic detail for not showing a scary error after a successful signup — a deliberate UX choice, flagged here so it's a known, not hidden, tradeoff.

## 16. Recommendations

1. Run `npm install && npx tsc --noEmit && npm test && npm run build` in a networked environment — this is the standing highest-priority follow-up across all three phases now.
2. Consider a future phase to associate orders with the logged-in user at checkout time (pass `userId` into `createOrderAction` when a session exists) and to build out the Orders/Addresses/Profile pages against real data — natural next steps now that authentication actually works.
3. Consider `middleware.ts`-based route protection for `/account/*` as defense-in-depth, if/when the account section grows to include anything more sensitive than what's already independently protected server-side.

## 17. Production/Staging Impact

- This is a **behavior-changing** release: customers can now actually register and log in, where before the button was inert. `account.authentication` is now `true` — deploying this makes `/login` and `/register` live.
- No environment variables or infrastructure changes are required — this phase used only what already existed (`DATABASE_URL`, the existing `User`/`Session` tables).
- As with Phase 2, I would not recommend deploying without first running this through a real build/test pipeline, since nothing here has been compiler-verified.

## 18. Git-Style Changelog

```
[Phase 3] Authentication UI: connect existing login/register/session backend to the frontend

fix(auth-actions): add missing getAuthenticatedUser import — getCurrentUserAction
                    would ReferenceError on every call without it
chore(auth-actions): remove unused zod import

feat(config/features): enable account.authentication now that it's implemented

feat(account/validation): add validateLoginFields/validateRegisterFields/confirmPasswordError,
                           deriving field errors from the existing LoginSchema/RegisterSchema

feat(account): add LoginForm — real loginAction-backed login screen with field validation,
               loading state, error display, redirect-on-success
feat(account): add RegisterForm — real registerAction-backed signup with auto-login on success
feat(app/login, app/register): new pages wrapping the above forms

feat(account): add AccountLayoutClient — centralizes the /account/* auth gate
                (previously fake on the dashboard, absent on every subpage)
feat(account): add AccountDashboard — real, session-aware dashboard content
                (replaces hardcoded isAuthenticated = false)
refactor(account/layout, account/page): delegate to AccountLayoutClient/AccountDashboard

feat(AccountSidebar): add reachable logout button (logoutAction had zero callers before this)

feat(Header): add auth-aware account nav link (desktop icon-link + mobile menu entry),
              gated by the existing navigation.headerAccount feature flag
feat(icons): add UserIcon, LogoutIcon

docs(AuthContext, account/types): correct stale "fixture-based"/"placeholder" comments —
                                   no behavioral change

test(AccountPage): rewrite to test the new AccountLayoutClient gating states and the
                    authenticated AccountDashboard greeting, instead of the old
                    hardcoded-disabled-button behavior

docs: add Phase 3 report (this file)
```

## 19. Final Verdict

**PASS WITH NOTES**

Rationale: every objective in §2 was implemented, traced end-to-end by hand, and is internally consistent (no orphaned imports, no duplicated auth logic, no weakened security control found on inspection). It is not an unqualified **PASS** for the same reason as Phases 1 and 2: nothing has been confirmed by an actual compiler or test run in this environment. It is not a **FAIL** because the implementation is complete against the stated scope, reuses the existing backend without rewriting it, and every known gap (placeholder subpages, no middleware, guest-checkout/account linkage) is explicitly named rather than hidden.

**Condition for upgrading to PASS:** run the build/type-check/test suite in a networked environment and confirm no errors — the same condition as Phases 1 and 2, now compounding across three unverified phases. I'd recommend this happen before any further phase, not just before deployment.
