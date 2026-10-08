import { describe, it, expect, vi, beforeEach } from "vitest";
import { createOrderAction } from "../server/commerce-actions";

// Mock Prisma
vi.mock("../server/prisma", () => {
  return {
    prisma: {
      product: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      order: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn((cb) => cb({
        order: { create: vi.fn().mockResolvedValue({ id: "order_123" }) },
        product: { update: vi.fn().mockImplementation(() => {
          // Success case for qty 2 — deliberately ignores the update
          // args (which product/quantity), since this mock always
          // returns the same fixed success payload regardless of input.
          return { id: "p1", price: 100, title: "P1", isEnabled: true };
        }) }
      })),
    },
  };
});

import { prisma } from "../server/prisma";

describe("E2E Commerce Critical Path", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgresql://localhost:5432";
    process.env.AUTH_SECRET = "32charslongsecretformockingpurpose";
  });

  it("creates an order after server-side validation", async () => {
    const mockProduct = { id: "p1", title: "P1", price: 100, inventoryCount: 10, isEnabled: true };
    
    (prisma.product.findUnique as any).mockResolvedValue(mockProduct);
    (prisma.product.update as any).mockResolvedValue(mockProduct);
    (prisma.order.create as any).mockResolvedValue({ id: "order_123" });

    const checkoutData = {
      customerInformation: { firstName: "A", lastName: "B", mobileNumber: "123" },
      address: { province: "P", city: "C", streetAddress: "S" }
    };
    
    const cartItems = [{ productId: "p1", quantity: 2, title: "P1" }];

    const result = await createOrderAction(checkoutData, cartItems);
    
    expect(result.success).toBe(true);
    // Narrow via `if` (the `expect` above doesn't narrow types) so
    // `result.orderId`/`result.totalAmount` are valid against
    // CreateOrderResult's discriminated union — see commerce-actions.ts's
    // Phase 8 doc comment.
    if (result.success) {
      expect(result.orderId).toBeDefined();
      expect(result.totalAmount).toBe(200);
    }
  });

  it("fails if inventory is insufficient", async () => {
    (prisma.$transaction as any).mockImplementationOnce((cb: any) => cb({
      product: { update: vi.fn().mockRejectedValue(new Error("موجودی کافی نیست")) }
    }));

    const result = await createOrderAction({ customerInformation: {}, address: {} }, [{ productId: "p1", quantity: 5, title: "P1" }]);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("موجودی");
    }
  });
});
