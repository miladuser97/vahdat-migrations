import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAdminProductsAction,
  updateProductAction,
  updateOrderStatusAction,
  getAdminDashboardStatsAction,
} from "../server/admin-actions";
import { prisma } from "../server/prisma";
import { requireAdmin, requirePermission } from "../server/auth-utils";
import { notifyOrderShipped, notifyOrderDelivered } from "../notification-boundary";

vi.mock("../notification-boundary", () => ({
  notifyOrderShipped: vi.fn().mockResolvedValue({ status: "sent", success: true, attempts: 1 }),
  notifyOrderDelivered: vi.fn().mockResolvedValue({ status: "sent", success: true, attempts: 1 }),
}));

vi.mock("../server/prisma", () => ({
  prisma: {
    product: {
      count: vi.fn().mockResolvedValue(0),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    order: {
      count: vi.fn().mockResolvedValue(0),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("../server/auth-utils", () => ({
  requireAdmin: vi.fn(),
  requirePermission: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Admin actions — authorization is enforced server-side, not just by the caller (Phase 4)", () => {
  it("getAdminProductsAction fails closed when requirePermission rejects (no admin session)", async () => {
    (requirePermission as any).mockRejectedValue(new Error("FORBIDDEN"));

    const result = await getAdminProductsAction();

    expect(result.success).toBe(false);
    expect(requirePermission).toHaveBeenCalledWith("manage_products");
    // The permission check must happen before any product data is touched.
    expect(prisma.product.findMany).not.toHaveBeenCalled();
  });

  it("getAdminProductsAction returns data once manage_products is granted", async () => {
    (requirePermission as any).mockResolvedValue({ id: "admin1", role: "admin" });
    (prisma.product.findMany as any).mockResolvedValue([
      { id: "p1", slug: "s1", title: "T", price: { toString: () => "100" } as any, currency: "تومان", inventoryCount: 5, isEnabled: true, createdAt: new Date(), updatedAt: new Date() },
    ]);

    const result = await getAdminProductsAction();

    expect(result.success).toBe(true);
    expect(result.data?.[0].title).toBe("T");
  });

  it("updateProductAction rejects a negative price even with a granted permission", async () => {
    (requirePermission as any).mockResolvedValue({ id: "admin1", role: "admin" });

    const result = await updateProductAction("p1", { price: -10 });

    expect(result.success).toBe(false);
    expect(prisma.product.update).not.toHaveBeenCalled();
  });

  it("updateProductAction fails closed without manage_products permission", async () => {
    (requirePermission as any).mockRejectedValue(new Error("FORBIDDEN"));

    const result = await updateProductAction("p1", { price: 100 });

    expect(result.success).toBe(false);
    expect(prisma.product.update).not.toHaveBeenCalled();
  });

  it("updateOrderStatusAction rejects setting status to 'paid' — only the ZarinPal callback may do that", async () => {
    (requirePermission as any).mockResolvedValue({ id: "admin1", role: "admin" });

    const result = await updateOrderStatusAction("o1", "paid");

    expect(result.success).toBe(false);
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  it("updateOrderStatusAction rejects advancing an order that was never paid", async () => {
    (requirePermission as any).mockResolvedValue({ id: "admin1", role: "admin" });
    (prisma.order.findUnique as any).mockResolvedValue({ id: "o1", status: "pending_payment" });

    const result = await updateOrderStatusAction("o1", "processing");

    expect(result.success).toBe(false);
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  it("updateOrderStatusAction allows advancing a paid order to processing", async () => {
    (requirePermission as any).mockResolvedValue({ id: "admin1", role: "admin" });
    (prisma.order.findUnique as any).mockResolvedValue({ id: "o1", status: "paid" });
    (prisma.order.update as any).mockResolvedValue({
      id: "o1",
      orderNumber: 1,
      status: "processing",
      totalAmount: { toString: () => "1000" },
      currency: "تومان",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await updateOrderStatusAction("o1", "processing");

    expect(result.success).toBe(true);
    expect(prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { status: "processing" },
    }));
  });

  it("updateOrderStatusAction notifies the customer when moving to 'shipped' (Phase 5)", async () => {
    (requirePermission as any).mockResolvedValue({ id: "admin1", role: "admin" });
    (prisma.order.findUnique as any).mockResolvedValue({
      id: "o1",
      status: "paid",
      customerInformation: JSON.stringify({ mobileNumber: "09120001122" }),
    });
    (prisma.order.update as any).mockResolvedValue({
      id: "o1",
      orderNumber: 1,
      status: "shipped",
      totalAmount: { toString: () => "1000" },
      currency: "تومان",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await updateOrderStatusAction("o1", "shipped");

    expect(result.success).toBe(true);
    expect(notifyOrderShipped).toHaveBeenCalledWith("09120001122", "o1");
    expect(notifyOrderDelivered).not.toHaveBeenCalled();
  });

  it("updateOrderStatusAction does not notify for a plain 'processing' transition", async () => {
    (requirePermission as any).mockResolvedValue({ id: "admin1", role: "admin" });
    (prisma.order.findUnique as any).mockResolvedValue({
      id: "o1",
      status: "paid",
      customerInformation: JSON.stringify({ mobileNumber: "09120001122" }),
    });
    (prisma.order.update as any).mockResolvedValue({
      id: "o1",
      orderNumber: 1,
      status: "processing",
      totalAmount: { toString: () => "1000" },
      currency: "تومان",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await updateOrderStatusAction("o1", "processing");

    expect(notifyOrderShipped).not.toHaveBeenCalled();
    expect(notifyOrderDelivered).not.toHaveBeenCalled();
  });

  it("updateOrderStatusAction still succeeds even if the notification call fails (separate concerns)", async () => {
    (requirePermission as any).mockResolvedValue({ id: "admin1", role: "admin" });
    (prisma.order.findUnique as any).mockResolvedValue({
      id: "o1",
      status: "paid",
      customerInformation: JSON.stringify({ mobileNumber: "09120001122" }),
    });
    (prisma.order.update as any).mockResolvedValue({
      id: "o1",
      orderNumber: 1,
      status: "delivered",
      totalAmount: { toString: () => "1000" },
      currency: "تومان",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    (notifyOrderDelivered as any).mockRejectedValueOnce(new Error("network down"));

    const result = await updateOrderStatusAction("o1", "delivered");

    expect(result.success).toBe(true);
    expect(result.data?.status).toBe("delivered");
  });

  it("getAdminDashboardStatsAction fails closed when requireAdmin rejects", async () => {
    (requireAdmin as any).mockRejectedValue(new Error("FORBIDDEN"));

    const result = await getAdminDashboardStatsAction();

    expect(result.success).toBe(false);
    expect(prisma.product.count).not.toHaveBeenCalled();
  });
});
