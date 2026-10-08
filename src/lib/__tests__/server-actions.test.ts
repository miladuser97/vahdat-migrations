import { describe, it, expect, vi, beforeEach } from "vitest";
import { loginAction } from "../server/auth-actions";
import bcrypt from "bcryptjs";

// Mock Prisma
vi.mock("../server/prisma", () => {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
      },
    },
  };
});

import { prisma } from "../server/prisma";

describe("Server Auth Actions", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgresql://localhost:5432";
    process.env.AUTH_SECRET = "32charslongsecretformockingpurpose";
  });

  it("should fail with invalid credentials (wrong user)", async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    const result = await loginAction({
      mobileNumber: "09331234567",
      password: "wrongpassword",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("اشتباه");
    }
  });

  it("should succeed with valid credentials", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      id: "user_1",
      firstName: "امیر",
      lastName: "رضایی",
      mobileNumber: "09127809720",
      password: "mocked_password",
      role: "admin",
      createdAt: new Date(),
    });

    // Manually mock bcrypt.compare to return true for this test
    vi.spyOn(bcrypt, "compare").mockResolvedValue(true as never);

    const result = await loginAction({
      mobileNumber: "09127809720",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });
});