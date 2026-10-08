import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { OrderDetailActions } from "../OrderDetailActions";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("@/lib/server/commerce-actions", () => ({
  cancelOrderAction: vi.fn(),
}));
vi.mock("@/features/checkout/services/checkout-submission", () => ({
  initiatePaymentForOrder: vi.fn(),
}));

describe("OrderDetailActions (Phase 6)", () => {
  it("shows both 'pay' and 'cancel' for a pending_payment order", () => {
    render(<OrderDetailActions orderId="o1" status="pending_payment" />);
    expect(screen.getByText("تکمیل پرداخت")).toBeDefined();
    expect(screen.getByText("لغو سفارش")).toBeDefined();
  });

  it("shows only 'pay' (not 'cancel') for a payment_failed order", () => {
    render(<OrderDetailActions orderId="o1" status="payment_failed" />);
    expect(screen.getByText("تکمیل پرداخت")).toBeDefined();
    expect(screen.queryByText("لغو سفارش")).toBeNull();
  });

  it("shows neither action for a paid order — never offers to re-pay or cancel an already-paid order", () => {
    const { container } = render(<OrderDetailActions orderId="o1" status="paid" />);
    expect(screen.queryByText("تکمیل پرداخت")).toBeNull();
    expect(screen.queryByText("لغو سفارش")).toBeNull();
    expect(container.firstChild).toBeNull();
  });

  it("shows neither action for a delivered order", () => {
    render(<OrderDetailActions orderId="o1" status="delivered" />);
    expect(screen.queryByText("تکمیل پرداخت")).toBeNull();
    expect(screen.queryByText("لغو سفارش")).toBeNull();
  });

  it("shows neither action for a cancelled order", () => {
    render(<OrderDetailActions orderId="o1" status="cancelled" />);
    expect(screen.queryByText("تکمیل پرداخت")).toBeNull();
    expect(screen.queryByText("لغو سفارش")).toBeNull();
  });
});
