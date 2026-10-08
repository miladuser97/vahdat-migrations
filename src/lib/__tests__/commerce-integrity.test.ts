import { describe, it, expect, vi, beforeEach } from "vitest";
import { startPaymentAction, handlePaymentCallbackAction } from "../server/commerce-actions";
import { prisma } from "../server/prisma";

vi.mock("../server/prisma", () => ({
  prisma: {
    order: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    paymentAttempt: {
      create: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(prisma)),
  }
}));

vi.mock("../server/auth-utils", () => ({
  getAuthenticatedUser: vi.fn().mockResolvedValue({ id: "user_123" }),
}));

vi.mock("../payment-boundary", () => ({
  initiatePayment: vi.fn().mockResolvedValue({ id: "auth_token_123", paymentUrl: "http://bank.ir" }),
  verifyPayment: vi.fn().mockResolvedValue({ success: true, transactionId: "trans_123" }),
}));

vi.mock("../notification-boundary", () => ({
  notifyOrderSuccess: vi.fn().mockResolvedValue({ status: "sent", success: true, attempts: 1, messageId: "test" }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.order.updateMany as any).mockResolvedValue({ count: 1 });
});

describe("Commerce Integrity & Payment flow", () => {
  it("prevents IDOR in startPaymentAction", async () => {
    (prisma.order.findUnique as any).mockResolvedValue({ id: "order_1", userId: "other_user", status: "pending_payment" });

    const result = await startPaymentAction("order_1");
    expect(result.success).toBe(false);
    // Narrow via `if` (the `expect` above doesn't narrow types) so
    // `result.error` is valid against StartPaymentResult's
    // discriminated union — see commerce-actions.ts's Phase 8 doc
    // comment on why these result types are discriminated unions now.
    if (!result.success) {
      expect(result.error).toContain("دسترسی");
    }
  });

  it("refuses to start a new payment for an already-paid order", async () => {
    (prisma.order.findUnique as any).mockResolvedValue({ id: "order_1", userId: "user_123", status: "paid" });

    const result = await startPaymentAction("order_1");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("قبلاً پرداخت شده");
    }
  });

  it("refuses to start a new payment for a cancelled/expired order", async () => {
    (prisma.order.findUnique as any).mockResolvedValue({ id: "order_1", userId: "user_123", status: "cancelled" });

    const result = await startPaymentAction("order_1");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("لغو شده یا منقضی شده");
    }
  });

  it("verifies authority in handlePaymentCallbackAction", async () => {
    (prisma.order.findUnique as any).mockResolvedValue({ 
      id: "order_1", 
      paymentAuthority: "valid_token",
      totalAmount: 1000,
      status: "pending_payment"
    });

    const result = await handlePaymentCallbackAction({ orderId: "order_1", token: "invalid_token" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("نامعتبر");
    }
  });

  it("marks order as paid on successful verification, via an atomic conditional update", async () => {
    (prisma.order.findUnique as any).mockResolvedValue({ 
      id: "order_1", 
      paymentAuthority: "token_123",
      totalAmount: 1000,
      status: "pending_payment",
      customerInformation: JSON.stringify({ mobileNumber: "0912" })
    });

    const result = await handlePaymentCallbackAction({ orderId: "order_1", token: "token_123" });
    expect(result.success).toBe(true);
    expect(prisma.order.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: "order_1",
        status: { in: ["pending_payment", "payment_failed"] },
      }),
      data: { status: "paid" },
    }));
    expect(prisma.paymentAttempt.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "success", transactionId: "trans_123" }),
    }));
  });

  it("is idempotent for a duplicate callback on an already-paid order (no re-verification side effects)", async () => {
    (prisma.order.findUnique as any).mockResolvedValue({
      id: "order_1",
      paymentAuthority: "token_123",
      totalAmount: 1000,
      status: "paid",
      customerInformation: JSON.stringify({ mobileNumber: "0912" }),
    });

    const result = await handlePaymentCallbackAction({ orderId: "order_1", token: "token_123" });
    expect(result.success).toBe(true);
    expect(result.code).toBe("ALREADY_PAID");
    expect(prisma.order.updateMany).not.toHaveBeenCalled();
    expect(prisma.paymentAttempt.create).not.toHaveBeenCalled();
  });

  it("never marks a cancelled order as paid, even if the gateway verifies successfully", async () => {
    (prisma.order.findUnique as any).mockResolvedValue({
      id: "order_1",
      paymentAuthority: "token_123",
      totalAmount: 1000,
      status: "cancelled",
      customerInformation: JSON.stringify({ mobileNumber: "0912" }),
    });

    const result = await handlePaymentCallbackAction({ orderId: "order_1", token: "token_123" });
    expect(result.success).toBe(false);
    expect(result.code).toBe("ORDER_NOT_PAYABLE_FUNDS_CAPTURED");
    expect(prisma.order.updateMany).not.toHaveBeenCalled();
    // A record is still kept for manual reconciliation, but the order itself is untouched.
    expect(prisma.paymentAttempt.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "requires_manual_review" }),
    }));
  });

  it("treats a concurrent/duplicate reconciliation race as already-paid (updateMany count 0)", async () => {
    (prisma.order.findUnique as any).mockResolvedValue({
      id: "order_1",
      paymentAuthority: "token_123",
      totalAmount: 1000,
      status: "pending_payment",
      customerInformation: JSON.stringify({ mobileNumber: "0912" }),
    });
    (prisma.order.updateMany as any).mockResolvedValue({ count: 0 });

    const result = await handlePaymentCallbackAction({ orderId: "order_1", token: "token_123" });
    expect(result.success).toBe(true);
    expect(result.code).toBe("ALREADY_PAID");
    expect(prisma.paymentAttempt.create).not.toHaveBeenCalled();
  });
});
