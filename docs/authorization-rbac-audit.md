# Authorization / RBAC / IDOR Audit Report

## 1. Action Authorization Matrix

| Action | Required Role | IDOR Protection | Server Authority |
|---|---|---|---|
| `loginAction` | Public | N/A | YES |
| `logoutAction` | Public | N/A | YES |
| `updateProfileAction` | User | `getAuthenticatedUser()` | YES |
| `addAddressAction` | User | `user.id` from Session | YES |
| `createOrderAction` | Public/Guest | Linked to Session if present | YES |

## 2. Systemic Verifications
*   **Source of Truth**: All sensitive actions now use the server-side session store as the source of truth for `userId`. Client-supplied IDs are ignored for ownership-sensitive operations.
*   **RBAC**: `requireAdmin` utility is available in `auth-utils.ts` but not yet integrated into the catalog management (Catalog is currently static/fixture based).
*   **Admin Access**: No admin routes are currently active in production; all admin logic is architecturally ready but hidden behind feature flags.

## 3. Findings
*   **Minor Risk**: Guest checkout doesn't verify the mobile number uniqueness before order creation. This is standard but could be abused for spam orders.
*   **Improvement**: Added `userId` linking to `createOrderAction` in Phase 177 to ensure authenticated users see their orders in their history.

## 4. Audit Verdict
**PASSED (RC1)** - IDOR vulnerabilities in account and commerce actions are resolved.
