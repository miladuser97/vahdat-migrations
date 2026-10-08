import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireAuth, requireAdmin, requirePermission } from "../server/auth-utils";
import { prisma } from "../server/prisma";

vi.mock("../server/prisma", () => ({
  prisma: {
    session: {
      findUnique: vi.fn(),
    },
  },
}));

const mockCookieGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockReturnValue({
    get: (...args: unknown[]) => mockCookieGet(...args),
  }),
}));

function mockSessionUser(role: string) {
  mockCookieGet.mockReturnValue({ value: "raw_token" });
  (prisma.session.findUnique as any).mockResolvedValue({
    expiresAt: new Date(Date.now() + 60_000),
    user: { id: "u1", firstName: "F", lastName: "L", mobileNumber: "0912", role },
  });
}

function mockNoSession() {
  mockCookieGet.mockReturnValue(undefined);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requireAuth (Phase 4)", () => {
  it("throws UNAUTHORIZED when there is no session", async () => {
    mockNoSession();
    await expect(requireAuth()).rejects.toThrow("UNAUTHORIZED");
  });

  it("returns the session user when authenticated", async () => {
    mockSessionUser("customer");
    const user = await requireAuth();
    expect(user.id).toBe("u1");
  });
});

describe("requireAdmin (Phase 4 — fixes the pre-existing super_admin exclusion bug)", () => {
  it("throws UNAUTHORIZED when there is no session at all", async () => {
    mockNoSession();
    await expect(requireAdmin()).rejects.toThrow("UNAUTHORIZED");
  });

  it("throws FORBIDDEN for an authenticated customer", async () => {
    mockSessionUser("customer");
    await expect(requireAdmin()).rejects.toThrow("FORBIDDEN");
  });

  it("allows an authenticated admin", async () => {
    mockSessionUser("admin");
    await expect(requireAdmin()).resolves.toMatchObject({ role: "admin" });
  });

  it("allows an authenticated super_admin (this was the bug: previously rejected)", async () => {
    mockSessionUser("super_admin");
    await expect(requireAdmin()).resolves.toMatchObject({ role: "super_admin" });
  });
});

describe("requirePermission (Phase 4 — RBAC matrix wired to a real session user)", () => {
  it("throws FORBIDDEN when the role lacks the permission", async () => {
    mockSessionUser("customer");
    await expect(requirePermission("manage_products")).rejects.toThrow("FORBIDDEN");
  });

  it("allows a role that has the permission via the matrix (staff -> manage_orders)", async () => {
    mockSessionUser("staff");
    await expect(requirePermission("manage_orders")).resolves.toMatchObject({ role: "staff" });
  });

  it("denies a role that has some but not all admin permissions (staff -> manage_users)", async () => {
    mockSessionUser("staff");
    await expect(requirePermission("manage_users")).rejects.toThrow("FORBIDDEN");
  });

  it("allows admin for manage_users", async () => {
    mockSessionUser("admin");
    await expect(requirePermission("manage_users")).resolves.toMatchObject({ role: "admin" });
  });
});
