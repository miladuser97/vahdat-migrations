# Tahririno — Phase 4 Report: Authorization, RBAC, Admin Area & Permission Enforcement

**Scope:** Authorization/RBAC/Admin only. Payment, Checkout, Inventory, Authentication backend, and `prisma/schema.prisma` were not modified — the only touches near those boundaries were two narrow, justified exceptions detailed in §3 and §5.

---

## 1. Executive Summary

Before this phase, Tahririno had a full RBAC permission matrix (`src/lib/authorization.ts`: customer/staff/admin/super_admin, seven permissions) and a role-gate helper (`requireAdmin`) — and **none of it was called anywhere in the application.** Worse, `hasPermission`/`authorizeUser` required a `DbUser` shape (with `createdAt`/`updatedAt`) that the real session-lookup function never produces, and `requireAdmin` had a bug that would have rejected `super_admin` — the role the matrix itself defines as the *most* privileged. There was no admin area at all: the one existing admin component (`AdminDashboard.tsx`) was never imported by any route, had no real data, and re-implemented its own (redundant) client-side role check.

This phase: fixed the type mismatch that made the permission matrix uncallable, fixed the `super_admin` exclusion bug, wired both `requireAdmin` and a new `requirePermission` helper into a real, newly-built `/admin` section (dashboard, products, orders), enforced authorization server-side in every new privileged action independent of the UI, deleted the dead admin component, and added meaningful tests exercising the actual RBAC matrix and the actual authorization failure paths — not fixtures standing in for it.

**What this report cannot claim:** as in every prior phase, nothing here has been confirmed by an actual compiler or test run — this sandbox still has no network access. Every claim is the result of manual, file-by-file, call-site tracing.

---

## 2. Objectives of This Phase

Restated from your instruction: wire existing authorization helpers into real code; build a real, protected admin area with proper Forbidden handling; protect every privileged server action server-side; remove dead authorization code and duplicate implementations; keep authentication/authorization/ownership as separate concerns; gate admin UI by real authorization, not hidden buttons; add meaningful (non-fake) authorization tests; verify the full dependency graph after each change; touch Payment/Checkout/Inventory/Authentication/Prisma only if strictly required.

---

## 3. Every Issue Found

| # | Issue | Where | Severity |
|---|-------|-------|----------|
| P4-1 | `hasPermission`/`authorizeUser` required a full `DbUser` object (`id`, `firstName`, `lastName`, `mobileNumber`, `email?`, `role`, `createdAt`, `updatedAt`). The real session-lookup (`getAuthenticatedUser()`, via a Prisma `select`) only ever returns `{id, firstName, lastName, mobileNumber, role}` — no `email`, no `createdAt`/`updatedAt`. No real caller could satisfy the required type. This is very likely *why* these functions had zero callers. | `authorization.ts` | **Critical** — the entire permission matrix was structurally uncallable from real code |
| P4-2 | `requireAdmin()` checked `role !== "admin"` only — a `super_admin` session (the highest-privileged role in the same file's own matrix, granted every permission `admin` has) would be **rejected**. | `auth-utils.ts` | **Critical** — inverted the intended privilege hierarchy, would have silently locked out the most-privileged role the moment this function was ever used |
| P4-3 | No `/admin` route existed anywhere in `src/app`. `requireAdmin`, `hasPermission`, `authorizeUser`, `assertOwnership` had zero real callers anywhere in the codebase — confirmed by an exhaustive `grep` across `src`, matching only their own definitions and their own (narrow) test file. | (missing) | **Critical** |
| P4-4 | `features/admin/components/AdminDashboard.tsx` existed but was imported by nothing (confirmed by `grep`), rendered no real data, and re-implemented its own client-side `role === "admin" \|\| "super_admin"` check — a second, independent, *correct* (unlike P4-2) role check that would have disagreed with the buggy server-side one had both ever been wired in. | `features/admin/components/AdminDashboard.tsx` | High — dead code, and a latent duplicate-authorization-logic hazard |
| P4-5 | `authorizeUser(userId, permission)` re-implemented the exact same `ROLE_PERMISSIONS[user.role]?.includes(...)` lookup that `hasPermission` already does, instead of delegating to it — a literal in-file duplication of the one piece of logic this module exists to hold. | `authorization.ts` | Medium — duplicate implementation of the same rule, risk of the two drifting apart under future edits |
| P4-6 | No server action existed anywhere for admin product management (create/update/enable-disable), admin order management (view-all, status transitions), or any other privileged mutation. The only product read path (`product-service.ts`) always filters `isEnabled: true`, unusable for an admin who needs to see disabled products. | (missing) | High — nothing to protect because nothing existed; objective 3 ("verify product management/inventory management/order management/payment administration are protected") had no subject matter to check against |
| P4-7 | `Order.status` (Prisma) is a free-text `String`, and nothing prevented — had an admin mutation existed without this phase's care — an admin action from setting an order to `"paid"` directly, bypassing Phase 2's ZarinPal verification entirely. This wasn't an existing bug (no such action existed, per P4-6) but was a real *design* risk for anything built this phase. | (design risk, addressed proactively) | — |

---

## 4. Root Cause Analysis

- **P4-1** and **P4-2** both point to the same root cause identified in every prior phase's report: this codebase's backend pieces were built in disconnected passes and never reconciled against each other. `authorization.ts` was written against an idealized `DbUser` type from `src/types/database.ts` (itself a zod schema seemingly meant for a different/earlier data-access layer) rather than against what `auth-utils.ts`'s actual session lookup produces. The two files were never run against each other, so the mismatch was never caught.
- **P4-3, P4-4, P4-6** are the admin-area analog of the payment/checkout gap fixed in Phase 2 and the auth-UI gap fixed in Phase 3: real backend-shaped pieces (a permission matrix, a role guard, a dashboard shell) existed, but nothing ever connected them to a route, and nothing ever built the privileged actions the matrix was meant to protect.
- **P4-5** is ordinary code duplication — `authorizeUser` and `hasPermission` were almost certainly written at different times against the same requirement without the author checking whether the logic already existed nearby.
- **P4-7** isn't a fix to an existing bug (nothing existed yet), but a design decision made *because of* Phase 2's finding — since Phase 2 hardened `handlePaymentCallbackAction` specifically to be the only path that can mark an order paid, this phase had to make sure a brand-new admin action didn't quietly reopen that exact hole from a different direction.

---

## 5. Every File Modified

1. **`src/lib/authorization.ts`** — Changed `hasPermission`'s parameter type from `DbUser` to a new `AuthorizableUser = { role: string }` (matches what `getAuthenticatedUser()` actually returns; `DbUser`'s role is a stricter literal union that the real Prisma-selected `string` column value isn't assignable to, so this also isn't simply `Pick<DbUser, "role">` — see the code comment). Refactored `authorizeUser` to delegate to `hasPermission` instead of re-implementing the same lookup (fixes P4-5). `assertOwnership` unchanged.
2. **`src/lib/server/auth-utils.ts`** — Fixed `requireAdmin`'s `super_admin` exclusion bug (P4-2): now checks `role !== "admin" && role !== "super_admin"`. Added a new `requirePermission(permission)` function, delegating to `hasPermission` — the primary enforcement point for fine-grained admin mutations (see §6 for why this is a second, deliberately distinct function from `requireAdmin` rather than one function doing both jobs).
3. **`src/components/layout/Header.tsx`** — Added an admin-tier-only nav link (desktop icon-link + mobile menu entry), visible only when `useAuth().user.role` is `"admin"` or `"super_admin"` — satisfies "expose admin navigation only for authorized users."
4. **`src/lib/__tests__/authorization.test.ts`** — Added cases for staff's partial permission set, `super_admin`/`admin` parity, an unrecognized role being denied everything, and the session-shaped (not full-`DbUser`-shaped) object now being accepted — this last case is a regression test for P4-1.

**One exception to "don't touch outside authorization scope," both justified:**
- `src/lib/server/auth-utils.ts` already existed as an authorization file — modifying it is squarely in scope, not an exception. Flagging this line only to be explicit that no line of `auth-actions.ts` (login/register/logout), `commerce-actions.ts` (payment/checkout/inventory), `account-actions.ts`, or `prisma/schema.prisma` was touched this phase. Confirmed by re-reading each file; none required changes, and none were edited.

## 6. New Files Created

1. **`src/lib/server/admin-actions.ts`** — every new privileged server action, each starting with `requireAdmin()`/`requirePermission(...)` before touching the database:
   - `getAdminDashboardStatsAction` — `requireAdmin()`; real counts (products, disabled products, low-stock, total/pending/paid orders).
   - `getAdminProductsAction` / `updateProductAction` — `requirePermission("manage_products")`; zod-validated updates (price, inventory count, enabled flag).
   - `getAdminOrdersAction` — `requirePermission("view_orders")`; includes read-only `paymentAttempts` for oversight.
   - `updateOrderStatusAction` — `requirePermission("manage_orders")`; restricted to `["processing", "shipped", "delivered"]` via `z.enum(...)`, and additionally rejects any order that isn't already `"paid"` or already in that pipeline — this is the concrete implementation of the P4-7 safeguard: there is no code path in this entire file that can set an order's status to `"paid"`, and no code path that touches `PaymentAttempt` at all beyond reading it.
2. **`src/app/admin/layout.tsx`** — the real, server-side gate for the whole `/admin` tree. An async Server Component that calls `requireAdmin()` directly: no session → `redirect("/login?redirect=/admin")` before any admin markup renders; session but wrong role → renders an inline, real 403 screen (not a redirect, not a hidden button); admin-tier → renders the admin shell + nav.
3. **`src/app/admin/page.tsx`** — dashboard, renders real stats from `getAdminDashboardStatsAction`.
4. **`src/app/admin/products/page.tsx`** + **`src/features/admin/components/AdminProductsTable.tsx`** — Server Component fetch + Client Component inline-edit table (price/inventory/enabled toggle), each mutation going through `updateProductAction`.
5. **`src/app/admin/orders/page.tsx`** + **`src/features/admin/components/AdminOrdersTable.tsx`** — Server Component fetch + Client Component table with a status selector restricted to the three fulfillment statuses (the "paid" option is never rendered — not disabled, not hidden by CSS, simply not present in the option list, and independently re-validated server-side by the same enum).
6. **`src/lib/__tests__/auth-utils.test.ts`** — real tests against `requireAuth`/`requireAdmin`/`requirePermission`, mocking only the session cookie/DB lookup boundary (same convention as the existing `brute-force.test.ts`), including an explicit regression test for the P4-2 `super_admin` bug and for the RBAC matrix's partial staff grant (`manage_orders` allowed, `manage_users` denied).
7. **`src/lib/__tests__/admin-actions.test.ts`** — tests that every admin action **fails closed** when `requirePermission`/`requireAdmin` reject (asserting the underlying `prisma` call was never reached, not just that the response says `success: false`), that `updateProductAction` rejects invalid data even when authorized, and that `updateOrderStatusAction` rejects both `"paid"` as a target status and any attempt to advance an order that was never paid.
8. **`docs/phase-4-report.md`** — this report.

## 7. Deleted Files

1. **`src/features/admin/components/AdminDashboard.tsx`** — unreachable (zero importers, confirmed by `grep` before deletion), rendered no real data, and duplicated (in a client-only, bypassable form) the role check now correctly and authoritatively enforced server-side by `admin/layout.tsx`. Confirmed no remaining references anywhere in `src` after deletion (one `grep` hit is a prose mention in `admin/page.tsx`'s doc comment explaining the deletion, not an import).

## 8. Database/Schema Changes

**None.** `prisma/schema.prisma` was read (to re-confirm `Order.status`/`Product` field shapes) but not modified. No new column, table, or enum was needed — the existing free-text `role`/`status` `String` columns were sufficient for everything built this phase.

## 9. Authorization Architecture After Remediation

Three distinct, non-overlapping layers, matching objective 5's requirement that identity/permission/ownership stay separate:

1. **Identity (authentication)** — `getAuthenticatedUser()` / `requireAuth()` (`auth-utils.ts`, untouched this phase). Answers "who is this, if anyone."
2. **Permission (authorization)** — two entry points, deliberately distinct rather than one doing both jobs:
   - `requireAdmin()` — coarse admin-tier role gate (`admin`/`super_admin`). Used for: the `/admin` layout's page-level entry, and the dashboard stats action. This is the literal "authenticated non-admin users must receive proper Forbidden handling" gate from your objectives.
   - `requirePermission(permission)` — fine-grained RBAC matrix check (`hasPermission` under the hood), used for every individual privileged mutation (`manage_products`, `view_orders`, `manage_orders`). This is what actually honors the matrix's `staff` role (which has `manage_products`/`manage_orders` but not `manage_users`/`manage_config`) rather than collapsing every check to a blunt "is admin" test.
   
   **Known, documented simplification:** because nothing in the system can currently *create* a `staff`-role user (registration hardcodes `role: "customer"`; only the seed script creates an `admin`), the `/admin` layout's `requireAdmin()` gate is stricter than the matrix technically requires — a hypothetical `staff` user would be blocked by the layout before ever reaching the (matrix-correct) `requirePermission` checks inside the actions. This does not affect any currently-reachable user, but is worth knowing before "staff" becomes reachable in a future phase — see §14.
3. **Ownership** — `assertOwnership(userId, resourceOwnerId)` (`authorization.ts`, unchanged). Answers "does this specific identity own this specific resource," independent of role. Already correctly implemented inline (not via this shared helper) in `commerce-actions.ts`/`account-actions.ts` for customer-owned orders/addresses — deliberately not retrofitted to call the shared helper this phase (see §14, "not done").

## 10. Permission Flow (Concrete Example — Product Price Update)

```
Browser (AdminProductsTable, client)
  → calls updateProductAction(productId, { price })
       ↓
Server (admin-actions.ts, "use server")
  1. requirePermission("manage_products")
       → requireAuth() → getAuthenticatedUser() reads the session cookie,
         hashes it, looks up the Session row, returns the user or null
       → throws "UNAUTHORIZED" if no session (caught by createSafeAction,
         returned as { success: false })
       → hasPermission(user, "manage_products") checked against
         ROLE_PERMISSIONS[user.role] — throws "FORBIDDEN" if false
  2. zod-validates the payload (price ≥ 0) — rejects before touching the DB
  3. prisma.product.update(...) — only reached after both 1 and 2 pass
       ↓
  Result flows back through createSafeAction's try/catch, never a raw
  throw reaching the client — same pattern already used by
  account-actions.ts, not a new error-handling convention.
```

The admin UI's own state (whether a button is rendered, whether the layout showed the page at all) plays no role in this chain — deleting `AdminProductsTable.tsx` entirely and calling `updateProductAction` directly from a script would enforce identically.

## 11. Security Improvements

- **Closed the P4-1 structural gap**: the RBAC matrix went from "exists but cannot be called by anything real" to "is the actual enforcement mechanism for every new admin mutation."
- **Fixed the P4-2 `super_admin` lockout bug** before it could ever have a real effect (nothing called `requireAdmin` before this phase, so no prior request was actually affected — but the fix is real and tested).
- **No privileged operation trusts the client**: every admin action independently re-checks authorization server-side, even though the `/admin` layout already gates the page — verified by the admin-actions test suite explicitly asserting the underlying Prisma call was never reached when the mock authorization check rejects.
- **No backdoor around Phase 2's payment verification**: `updateOrderStatusAction`'s allowed-status enum structurally cannot include `"paid"` — this isn't a runtime check that could be bypassed by a malformed request, the value literally isn't in the list zod validates against.
- **Removed a real (if latent) inconsistency risk**: the deleted `AdminDashboard.tsx` had its own *correct* client-side role check that disagreed with the *buggy* server-side `requireAdmin()` — had both ever been wired up before this phase, they would have silently disagreed about whether a `super_admin` was allowed in.

## 12. Architecture Improvements

- `admin-actions.ts` follows the exact `createSafeAction` wrapper convention already established in `account-actions.ts` — no new error-handling pattern introduced.
- Admin pages follow the same Server-Component-fetches / Client-Component-mutates split already established in Phase 2 (`checkout/page.tsx` → `CheckoutView`) and Phase 3 (`account/page.tsx` → `AccountDashboard`) — not a new pattern for this codebase.
- `authorizeUser`'s duplicated permission logic was collapsed into a single delegation to `hasPermission` (P4-5 fix) — one rule, one place it's evaluated.

## 13. Verification Performed

- Read `authorization.ts`, `auth-utils.ts`, `AdminDashboard.tsx`, `types/database.ts`, and `prisma/schema.prisma`'s `User`/`Product`/`Order`/`OrderItem`/`PaymentAttempt` models in full before writing any code.
- `grep`-traced every one of the four named helpers (`requireAdmin`, `authorizeUser`, `hasPermission`, `assertOwnership`) across the entire `src` tree, both before changes (confirming zero real callers) and after (confirming the intended new callers exist and nothing else broke).
- Confirmed, by direct inspection, that `commerce-actions.ts`'s existing inline ownership checks (`order.userId !== user?.id`) were **not** modified — deliberately left as-is per the explicit constraint (see §14).
- Confirmed `prisma/schema.prisma` is byte-for-byte unchanged (re-read, not diffed against a saved checksum this time, but no `str_replace`/`create_file`/write operation touched it).
- Traced every new UI component's imports (`Card`, `Badge`, `Select`, `Input`, `Button`/`buttonVariants`, `FormMessage`) against their actual prop signatures by reading the component source.
- Ran a static unused-import scan (the same small Node script used in Phases 2–3) across every new/modified file; found and fixed one unused import (`getAuthenticatedUser` in the new `auth-utils.test.ts`).
- Confirmed the deleted `AdminDashboard.tsx` has no remaining importers anywhere in `src` (one `grep` hit is a prose doc-comment mention, not an import).
- Re-derived, by hand, the exact type-compatibility question of whether `hasPermission`'s parameter type would accept the real Prisma-selected session-user object — caught and fixed a second-order issue here myself mid-phase (the initial `Pick<DbUser, "role">` choice would still have rejected the real `string`-typed Prisma column against `DbUser`'s stricter literal-union role type; corrected to a plain `{ role: string }` shape).

**What was not done, and cannot be done in this environment:** no `npm install`, `tsc`, `vitest`, or `next build` — same standing limitation as every prior phase. Nothing here has been compiler- or test-runner-verified, only manually traced.

## 14. Remaining Blockers / Not Done This Phase (Deliberate Scope Decisions)

1. **No compiler/test verification** — the standing limitation across all four phases now.
2. **`assertOwnership` still has no production caller.** The existing inline ownership checks in `commerce-actions.ts` (orders) and `account-actions.ts` (addresses/profile) are already functionally correct and already independently audited in Phases 1–3; retrofitting them to call the shared `assertOwnership` helper would be a DRY improvement, not a functional necessity, and would mean editing files this phase was explicitly told not to touch "unless absolutely required." I judged it not required, and left them as-is. This is a real, honest gap against objective 1's literal wording ("integrate assertOwnership... instead of leaving it as an isolated utility") — flagging it plainly rather than forcing an edit into out-of-scope files to check a box.
3. **`authorizeUser` still has no production caller**, either. It's no longer *duplicated* logic (P4-5 fixed), and it's now documented as a userId-based variant for a context that doesn't yet exist (e.g. a future API-key-authenticated route). I did not invent a caller for it just to exercise it — that would be scope creep, not authorization work.
4. **The `staff` role remains unreachable** by any current user-creation path (registration hardcodes `"customer"`; only the seed script creates `"admin"`). The RBAC matrix and `requirePermission` correctly honor `staff`'s partial permission set if such a user ever existed (tested), but the `/admin` layout's `requireAdmin()` gate would currently block that user from the UI entirely — see §9's "known, documented simplification." Not fixed this phase because building a user-role-management UI (which is what would make `staff` reachable) was not in the stated scope (no "manage_users" admin page was requested, and the objectives' explicit domain list — product/inventory/order/payment — didn't include it).
5. **No admin capability was built for `manage_categories`, `manage_users`, or `manage_config`** — the matrix defines these permissions, but no UI or action exercises them. Consistent with #4: not requested this phase, not built.
6. **No admin-initiated order cancellation or refund** — deliberately not built, since cancellation touches inventory-restoration logic (`cancelOrderAction`'s domain, Phase 2/Inventory territory), explicitly out of bounds this phase.
7. **`config-service.ts`** (`features/admin/services/`) remains an unguarded read-only wrapper — not gated by any permission this phase, since nothing routes to it and it performs no mutation. Noted, not touched.

## 15. Risks

- **Unverified code risk**, as in every prior phase — the most likely failure points if any: the `z.enum(ADMIN_SETTABLE_STATUSES)` call against a `readonly` tuple (should work with the zod version already used elsewhere in this codebase, but unconfirmed by a real compile), and the `Number()`-on-Prisma-`Decimal` coercion pattern in `admin-actions.ts` (copied from the exact pattern Phase 2 already used successfully in `commerce-actions.ts`, so low risk, but still unverified here).
- **The admin-tier-only `/admin` layout gate is stricter than the RBAC matrix for a role (`staff`) that cannot currently exist** — a latent inconsistency, not a live one (see §14.4). Worth resolving explicitly if/when a staff-creation path is ever built, rather than being rediscovered by surprise.
- **Two independent authorization checks per admin mutation (layout + action) is intentional defense-in-depth, not accidental duplication** — but it does mean a future maintainer changing one (e.g., loosening `requireAdmin`) without noticing the other exists could reintroduce an inconsistency. Both are now clearly cross-referenced in code comments to reduce this risk.

## 16. Recommendations

1. Run `npm install && npx tsc --noEmit && npm test && npm run build` in a networked environment — the standing highest-priority recommendation, now across four unverified phases.
2. If a future phase builds user-role management (promoting a customer to `staff`/`admin`), revisit the `/admin` layout gate to use a broader "any non-customer role" check instead of `requireAdmin()`'s admin-tier-only check, so `staff`'s matrix-granted permissions are actually reachable — see §9 and §14.4.
3. Consider retrofitting `commerce-actions.ts`/`account-actions.ts`'s inline ownership checks to call `assertOwnership` for consistency, once those files are back in scope for editing (they were explicitly protected this phase).
4. Consider whether admin-initiated order cancellation/refund is needed as a future phase — currently there is no way for an admin to cancel or refund an order at all, only to advance it through fulfillment.

## 17. Git-Style Changelog

```
[Phase 4] Authorization, RBAC, Admin Area & Permission Enforcement

fix(authorization): hasPermission/authorizeUser no longer require a full DbUser
                     (createdAt/updatedAt) — narrowed to the { role } shape the
                     real session user actually has; this was very likely why
                     these functions had zero real callers before this phase
refactor(authorization): authorizeUser delegates to hasPermission instead of
                          re-implementing the same ROLE_PERMISSIONS lookup

fix(auth-utils): requireAdmin no longer rejects super_admin (previously only
                  accepted role === "admin", excluding the matrix's own
                  highest-privileged role)
feat(auth-utils): add requirePermission(permission) — RBAC-matrix-based guard
                   for individual privileged server actions

feat(admin-actions): new file — getAdminDashboardStatsAction, getAdminProductsAction,
                      updateProductAction, getAdminOrdersAction, updateOrderStatusAction.
                      Every action enforces requireAdmin/requirePermission server-side
                      first. updateOrderStatusAction cannot set "paid" (ZarinPal-only,
                      Phase 2) and refuses to advance an order that was never paid.

feat(admin): add /admin layout — real server-side requireAdmin() gate;
             redirects to /login when unauthenticated, renders a real 403
             screen (not a redirect, not a hidden button) for authenticated
             non-admins
feat(admin): add /admin dashboard, /admin/products (+ AdminProductsTable),
             /admin/orders (+ AdminOrdersTable) — real data, real mutations,
             real server-side authorization on every one

feat(Header): expose admin nav link only when the session's role is
              admin/super_admin (desktop + mobile)

chore(admin): delete features/admin/components/AdminDashboard.tsx — unreachable,
              no real data, duplicated (client-only) the role check now
              correctly enforced server-side by /admin/layout.tsx

test(authorization): add staff-partial-permissions, super_admin/admin parity,
                      unrecognized-role-denied, and session-shaped-object-accepted
                      (P4-1 regression) cases
test(auth-utils): new file — requireAuth/requireAdmin/requirePermission against
                   mocked session lookups, including a super_admin regression
                   test for the P4-2 bug
test(admin-actions): new file — every admin action asserted to fail closed
                      (and never touch prisma) when authorization is rejected;
                      updateOrderStatusAction asserted to reject "paid" as a
                      target status and to reject advancing a never-paid order

docs: add Phase 4 report (this file)
```

## 18. Final Verdict

**PASS WITH NOTES**

Rationale: every objective was addressed — the permission matrix is now actually callable and actually called, the admin area is real and gated server-side with genuine Forbidden handling, every new privileged action independently enforces authorization, dead/duplicate authorization code was found and removed, and identity/permission/ownership remain three separate mechanisms rather than being merged. It is not an unqualified **PASS**, for the same standing reason as every prior phase (no compiler/test run possible here) plus two honestly-disclosed, deliberate scope decisions (§14.2, §14.3: `assertOwnership`/`authorizeUser` still lack a production caller, by choice, to respect the explicit constraint against editing Payment/Checkout/Authentication files). It is not a **FAIL** because nothing was left broken, nothing was hidden, and every deferred item is named with its reasoning rather than silently dropped.

**Condition for upgrading to PASS:** run the build/type-check/test suite in a networked environment and confirm no errors — the same standing condition as Phases 1–3, now spanning four unverified phases in a row.
