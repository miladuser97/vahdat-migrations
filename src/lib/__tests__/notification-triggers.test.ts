import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import { registerAction } from "../server/auth-actions";
import { changePasswordAction } from "../server/account-actions";
import { notifyRegistrationWelcome, notifyPasswordChanged } from "../notification-boundary";

vi.mock("../server/prisma", () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("../notification-boundary", () => ({
  notifyRegistrationWelcome: vi.fn(),
  notifyPasswordChanged: vi.fn(),
}));

vi.mock("../server/auth-utils", () => ({
  getAuthenticatedUser: vi.fn().mockResolvedValue({ id: "u1" }),
}));

import { prisma } from "../server/prisma";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.DATABASE_URL = "postgresql://localhost:5432";
  process.env.AUTH_SECRET = "32charslongsecretformockingpurpose";
});

describe("Notification triggers wired into real business events (Phase 5)", () => {
  it("registerAction sends a welcome notification after a real user is created", async () => {
    (prisma.user.findFirst as any).mockResolvedValue(null);
    (prisma.user.create as any).mockResolvedValue({
      id: "user_1",
      firstName: "سارا",
      lastName: "احمدی",
      mobileNumber: "09120001122",
      email: null,
    });
    (notifyRegistrationWelcome as any).mockResolvedValue({
      status: "sent",
      success: true,
      attempts: 1,
    });

    const result = await registerAction({
      firstName: "سارا",
      lastName: "احمدی",
      mobileNumber: "09120001122",
      password: "a-valid-password-123",
    });

    expect(result.success).toBe(true);
    expect(notifyRegistrationWelcome).toHaveBeenCalledWith(
      "09120001122",
      "سارا"
    );
  });

  it("registerAction still reports success even if the welcome notification fails — registration and notification are separate concerns", async () => {
    (prisma.user.findFirst as any).mockResolvedValue(null);
    (prisma.user.create as any).mockResolvedValue({
      id: "user_1",
      firstName: "سارا",
      lastName: "احمدی",
      mobileNumber: "09120001122",
      email: null,
    });
    (notifyRegistrationWelcome as any).mockRejectedValue(
      new Error("provider unreachable")
    );

    const result = await registerAction({
      firstName: "سارا",
      lastName: "احمدی",
      mobileNumber: "09120001122",
      password: "a-valid-password-123",
    });

    expect(result.success).toBe(true);
    expect((result as any).userId).toBe("user_1");
  });

  it("changePasswordAction sends a security notice after the password is actually changed", async () => {
    const realHash = await bcrypt.hash("current-password", 12);
    (prisma.user.findUnique as any).mockResolvedValue({
      id: "u1",
      mobileNumber: "09120001122",
      password: realHash,
    });
    (prisma.$transaction as any).mockResolvedValue([{}, {}]);
    (notifyPasswordChanged as any).mockResolvedValue({
      status: "sent",
      success: true,
      attempts: 1,
    });

    const result = await changePasswordAction({
      currentPassword: "current-password",
      newPassword: "new-password-123",
    });

    expect(result.success).toBe(true);
    expect(notifyPasswordChanged).toHaveBeenCalledWith("09120001122");
  });

  it("changePasswordAction does not notify if the password check fails (no event occurred)", async () => {
    const realHash = await bcrypt.hash("current-password", 12);
    (prisma.user.findUnique as any).mockResolvedValue({
      id: "u1",
      mobileNumber: "09120001122",
      password: realHash,
    });

    const result = await changePasswordAction({
      currentPassword: "wrong-password",
      newPassword: "new-password-123",
    });

    expect(result.success).toBe(false);
    expect(notifyPasswordChanged).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});