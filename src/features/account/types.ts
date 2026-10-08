/**
 * User / Customer
 * 
 * Minimal type representing an authenticated customer in the system,
 * as returned by loginAction/getCurrentUserAction (see
 * src/lib/server/auth-actions.ts and auth-utils.ts).
 *
 * Phase 7: `role` is `string`, not a literal union of the four known
 * role names. The underlying Prisma column (`User.role`) is a
 * free-text `String`, not a real database enum (see
 * prisma/schema.prisma and src/lib/authorization.ts's
 * `AuthorizableUser`, fixed the same way in Phase 4) — a literal union
 * here was never structurally true of what any caller actually
 * receives, which is exactly why AuthContext.tsx previously needed
 * `as any` to assign into this type at all.
 *
 * `createdAt` is optional because the two real producers of this type
 * return different shapes by design, not by accident:
 * `getAuthenticatedUser()` (auth-utils.ts) intentionally selects a
 * minimal field set for the frequent per-request session check (no
 * `createdAt`), while `loginAction`'s one-time post-login response
 * includes it. Making the field optional reflects that truthfully
 * instead of forcing one producer to fetch a field it doesn't need, or
 * papering over the mismatch with a cast.
 *
 * `email` accepts `null` (not just `undefined`) because Prisma returns
 * `null` for nullable columns — the type now matches what the database
 * layer actually hands back.
 */
 export interface User {
  id: string;
  firstName: string;
  lastName: string;
  mobileNumber: string;
  email?: string | null;
  role: string;
  createdAt?: string;
}

/**
 * Account Navigation Item
 */
export interface AccountNavItem {
  label: string;
  href: string;
  icon?: string;
}