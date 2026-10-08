// ============================================================
// نقش‌های کاربری
// ============================================================
export const ROLES = {
  CUSTOMER: "customer",
  ADMIN: "admin",
  SUPER_ADMIN: "super_admin",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// ============================================================
// بررسی ادمین بودن
// ============================================================
export function isAdmin(role: string): boolean {
  return role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;
}

// ============================================================
// بررسی Super Admin بودن
// ============================================================
export function isSuperAdmin(role: string): boolean {
  return role === ROLES.SUPER_ADMIN;
}

// ============================================================
// بررسی دسترسی
// ============================================================
export function hasAccess(userRole: string, requiredRole: Role): boolean {
  const roleHierarchy: Record<Role, number> = {
    customer: 1,
    admin: 2,
    super_admin: 3,
  };

  const userLevel = roleHierarchy[userRole as Role] ?? 0;
  const requiredLevel = roleHierarchy[requiredRole];

  return userLevel >= requiredLevel;
}