import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getProfileAction,
  updateProfileAction,
  getAddressesAction,
  addAddressAction,
  updateAddressAction,
  setDefaultAddressAction,
  deleteAddressAction,
} from "../server/account-actions";
import { prisma } from "../server/prisma";
import { getAuthenticatedUser } from "../server/auth-utils";

vi.mock("../server/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    address: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn((ops: any) => Promise.all(ops)),
  },
}));

vi.mock("../server/auth-utils", () => ({
  getAuthenticatedUser: vi.fn(),
}));

vi.mock("../notification-boundary", () => ({
  notifyPasswordChanged: vi.fn().mockResolvedValue({ status: "sent", success: true, attempts: 1 }),
}));

const AUTH_USER = { id: "user_1", firstName: "علی", lastName: "رضایی", mobileNumber: "09120001122", role: "customer" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getProfileAction (Phase 6)", () => {
  it("fails closed when there is no session", async () => {
    (getAuthenticatedUser as any).mockResolvedValue(null);
    const result = await getProfileAction();
    expect(result.success).toBe(false);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("returns the full profile, including email, for the authenticated user", async () => {
    (getAuthenticatedUser as any).mockResolvedValue(AUTH_USER);
    (prisma.user.findUnique as any).mockResolvedValue({
      id: "user_1",
      firstName: "علی",
      lastName: "رضایی",
      mobileNumber: "09120001122",
      email: "ali@example.com",
      role: "customer",
      createdAt: new Date(),
    });

    const result = await getProfileAction();

    expect(result.success).toBe(true);
    expect(result.data?.email).toBe("ali@example.com");
    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "user_1" } })
    );
  });
});

describe("updateProfileAction (Phase 6 — previously a no-op stub)", () => {
  beforeEach(() => {
    (getAuthenticatedUser as any).mockResolvedValue(AUTH_USER);
  });

  it("rejects an invalid first name and never touches the database", async () => {
    const result = await updateProfileAction({ firstName: "ع", lastName: "رضایی", email: "" });
    expect(result.success).toBe(false);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("rejects an email already used by a different account", async () => {
    (prisma.user.findFirst as any).mockResolvedValue({ id: "someone_else" });

    const result = await updateProfileAction({ firstName: "علی", lastName: "رضایی", email: "taken@example.com" });

    expect(result.success).toBe(false);
    expect(result.error).toContain("قبلاً");
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("actually updates the user and returns the new profile — this is the fix for the old no-op stub", async () => {
    (prisma.user.findFirst as any).mockResolvedValue(null);
    (prisma.user.update as any).mockResolvedValue({
      id: "user_1",
      firstName: "علی‌رضا",
      lastName: "رضایی",
      mobileNumber: "09120001122",
      email: "ali@example.com",
      role: "customer",
      createdAt: new Date(),
    });

    const result = await updateProfileAction({ firstName: "علی‌رضا", lastName: "رضایی", email: "ali@example.com" });

    expect(result.success).toBe(true);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user_1" },
        data: expect.objectContaining({ firstName: "علی‌رضا" }),
      })
    );
    expect(result.data?.firstName).toBe("علی‌رضا");
  });

  it("ignores a mobileNumber field in the input — mobile is not editable through this action", async () => {
    (prisma.user.findFirst as any).mockResolvedValue(null);
    (prisma.user.update as any).mockResolvedValue({
      id: "user_1",
      firstName: "علی",
      lastName: "رضایی",
      mobileNumber: "09120001122",
      email: "",
      role: "customer",
      createdAt: new Date(),
    });

    await updateProfileAction({ firstName: "علی", lastName: "رضایی", email: "", mobileNumber: "09999999999" });

    const updateCall = (prisma.user.update as any).mock.calls[0][0];
    expect(updateCall.data.mobileNumber).toBeUndefined();
  });
});

describe("Addresses (Phase 6)", () => {
  beforeEach(() => {
    (getAuthenticatedUser as any).mockResolvedValue(AUTH_USER);
  });

  it("getAddressesAction fails closed without a session", async () => {
    (getAuthenticatedUser as any).mockResolvedValue(null);
    const result = await getAddressesAction();
    expect(result.success).toBe(false);
    expect(prisma.address.findMany).not.toHaveBeenCalled();
  });

  it("addAddressAction rejects a missing title", async () => {
    const result = await addAddressAction({ province: "تهران", city: "تهران", streetAddress: "خیابان..." });
    expect(result.success).toBe(false);
    expect(prisma.address.create).not.toHaveBeenCalled();
  });

  it("addAddressAction makes the first saved address the default automatically", async () => {
    (prisma.address.count as any).mockResolvedValue(0);
    (prisma.address.create as any).mockResolvedValue({ id: "addr_1" });

    await addAddressAction({ title: "خانه", province: "تهران", city: "تهران", streetAddress: "خیابان..." });

    expect(prisma.address.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ isDefault: true }) })
    );
  });

  it("addAddressAction does not default a second address", async () => {
    (prisma.address.count as any).mockResolvedValue(1);
    (prisma.address.create as any).mockResolvedValue({ id: "addr_2" });

    await addAddressAction({ title: "محل کار", province: "تهران", city: "تهران", streetAddress: "خیابان..." });

    expect(prisma.address.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ isDefault: false }) })
    );
  });

  it("updateAddressAction rejects updating an address owned by a different user (IDOR)", async () => {
    (prisma.address.findUnique as any).mockResolvedValue({ id: "addr_1", userId: "someone_else" });

    const result = await updateAddressAction("addr_1", {
      title: "خانه",
      province: "تهران",
      city: "تهران",
      streetAddress: "خیابان...",
    });

    expect(result.success).toBe(false);
    expect(prisma.address.update).not.toHaveBeenCalled();
  });

  it("updateAddressAction succeeds for the owner", async () => {
    (prisma.address.findUnique as any).mockResolvedValue({ id: "addr_1", userId: "user_1" });
    (prisma.address.update as any).mockResolvedValue({ id: "addr_1" });

    const result = await updateAddressAction("addr_1", {
      title: "خانه (جدید)",
      province: "تهران",
      city: "تهران",
      streetAddress: "خیابان...",
    });

    expect(result.success).toBe(true);
  });

  it("setDefaultAddressAction rejects a non-owned address (IDOR)", async () => {
    (prisma.address.findUnique as any).mockResolvedValue({ id: "addr_1", userId: "someone_else", isDefault: false });

    const result = await setDefaultAddressAction("addr_1");

    expect(result.success).toBe(false);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("setDefaultAddressAction unsets the previous default and sets the new one atomically", async () => {
    (prisma.address.findUnique as any).mockResolvedValue({ id: "addr_2", userId: "user_1", isDefault: false });
    (prisma.address.updateMany as any).mockResolvedValue({ count: 1 });
    (prisma.address.update as any).mockResolvedValue({ id: "addr_2" });

    const result = await setDefaultAddressAction("addr_2");

    expect(result.success).toBe(true);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.address.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user_1", isDefault: true }, data: { isDefault: false } })
    );
  });

  it("deleteAddressAction rejects deleting a non-owned address (IDOR, pre-existing behavior verified unchanged)", async () => {
    (prisma.address.findUnique as any).mockResolvedValue({ id: "addr_1", userId: "someone_else" });

    const result = await deleteAddressAction("addr_1");

    expect(result.success).toBe(false);
    expect(prisma.address.delete).not.toHaveBeenCalled();
  });

  it("deleteAddressAction promotes another address to default when the deleted one was the default", async () => {
    (prisma.address.findUnique as any).mockResolvedValue({ id: "addr_1", userId: "user_1", isDefault: true });
    (prisma.address.delete as any).mockResolvedValue({ id: "addr_1" });
    (prisma.address.findFirst as any).mockResolvedValue({ id: "addr_2" });
    (prisma.address.update as any).mockResolvedValue({ id: "addr_2", isDefault: true });

    const result = await deleteAddressAction("addr_1");

    expect(result.success).toBe(true);
    expect(prisma.address.update).toHaveBeenCalledWith({ where: { id: "addr_2" }, data: { isDefault: true } });
  });

  it("deleteAddressAction does not try to promote anything when the deleted address wasn't the default", async () => {
    (prisma.address.findUnique as any).mockResolvedValue({ id: "addr_2", userId: "user_1", isDefault: false });
    (prisma.address.delete as any).mockResolvedValue({ id: "addr_2" });

    await deleteAddressAction("addr_2");

    expect(prisma.address.findFirst).not.toHaveBeenCalled();
    expect(prisma.address.update).not.toHaveBeenCalled();
  });
});
