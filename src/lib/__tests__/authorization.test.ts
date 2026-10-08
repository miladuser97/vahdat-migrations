import { describe, it, expect } from "vitest";
import { hasPermission } from "../authorization";
import { DbUser } from "@/types/database";

describe("RBAC Authorization", () => {
  const customer: DbUser = {
    id: "u1",
    firstName: "C",
    lastName: "U",
    mobileNumber: "1",
    role: "customer",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const admin: DbUser = {
    id: "u2",
    firstName: "A",
    lastName: "D",
    mobileNumber: "2",
    role: "admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("denies customer access to manage_config", () => {
    expect(hasPermission(customer, "manage_config")).toBe(false);
  });

  it("grants admin access to manage_config", () => {
    expect(hasPermission(admin, "manage_config")).toBe(true);
  });

  it("grants staff access to manage_products and manage_orders but not manage_users/manage_config", () => {
    const staff = { role: "staff" as const };
    expect(hasPermission(staff, "manage_products")).toBe(true);
    expect(hasPermission(staff, "manage_orders")).toBe(true);
    expect(hasPermission(staff, "manage_users")).toBe(false);
    expect(hasPermission(staff, "manage_config")).toBe(false);
  });

  it("grants super_admin the same permissions as admin", () => {
    const superAdmin = { role: "super_admin" as const };
    expect(hasPermission(superAdmin, "manage_config")).toBe(true);
    expect(hasPermission(superAdmin, "manage_users")).toBe(true);
    expect(hasPermission(superAdmin, "manage_orders")).toBe(true);
  });

  // ✅ اصلاح P1: حذف as any
  it("denies an unrecognized role every permission", () => {
    const unknown: { role: string } = { role: "not_a_real_role" };
    expect(hasPermission(unknown, "view_products")).toBe(false);
  });

  it("accepts the lightweight session-user shape", () => {
    const sessionShapedUser = { id: "u3", firstName: "S", lastName: "U", mobileNumber: "3", role: "admin" as const };
    expect(hasPermission(sessionShapedUser, "manage_products")).toBe(true);
  });
});