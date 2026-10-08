import { describe, it, expect, vi, beforeEach } from "vitest";
import { loginAction } from "../server/auth-actions";
import { prisma } from "../server/prisma";

vi.mock("../server/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    session: {
      create: vi.fn(),
    }
  }
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockReturnValue({
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  })
}));

describe("Brute Force Protection", () => {
  beforeEach(() => {
    // Phase 7: `beforeEach` was previously imported but never called —
    // resetting mocks between tests here is a real correctness
    // improvement (not just satisfying a linter), since without it
    // mock call history from one test could leak into assertions in
    // another as more cases are added to this file.
    vi.clearAllMocks();
  });

  it("locks out user after 5 failed attempts", async () => {
    const mockUser = {
      id: "u1",
      mobileNumber: "09120001122",
      password: "hashed_password",
      loginAttempts: 4,
      lockoutUntil: null,
    };

    (prisma.user.findUnique as any).mockResolvedValue(mockUser);
    
    // Simulate failed login
    const result = await loginAction({ mobileNumber: "09120001122", password: "wrong_password" });
    
    expect(result.success).toBe(false);
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        loginAttempts: 5,
        lockoutUntil: expect.any(Date)
      })
    }));
  });

  it("prevents login if lockout is active", async () => {
    const mockUser = {
      id: "u1",
      mobileNumber: "09120001122",
      password: "hashed_password",
      loginAttempts: 5,
      lockoutUntil: new Date(Date.now() + 10000), // In the future
    };

    (prisma.user.findUnique as any).mockResolvedValue(mockUser);
    
    const result = await loginAction({ mobileNumber: "09120001122", password: "any_password" });
    
    expect(result.success).toBe(false);
    // Narrow via `if` so `result.error` is valid against LoginResult's
    // discriminated union (see auth-actions.ts's Phase 8 doc comment).
    if (!result.success) {
      expect(result.error).toContain("مسدود");
    }
  });
});
