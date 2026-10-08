import { render, screen } from "@testing-library/react";
import OrdersHistoryPage from "../page";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getUserOrdersAction } from "@/lib/server/commerce-actions";

// Phase 6: OrdersHistoryPage now fetches real data via
// getUserOrdersAction instead of always rendering a static empty
// state — mocked here at that boundary (same action
// commerce-actions.ts already ownership-scopes and Phase 2 already
// tests independently; this file only tests what the page does with
// its result). Note this is an async Server Component: React Testing
// Library's render() does not resolve an async component's promise on
// its own, so each test awaits the component function directly first,
// per the standard workaround for testing Next.js async Server
// Components with RTL.
vi.mock("@/lib/server/commerce-actions", () => ({
  getUserOrdersAction: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("OrdersHistoryPage (Phase 6)", () => {
  it("renders the empty state when the customer has no orders", async () => {
    vi.mocked(getUserOrdersAction).mockResolvedValue({ success: true, orders: [] });

    render(await OrdersHistoryPage());

    expect(screen.getByText(/هیچ سفارشی ثبت نکرده‌اید/i)).toBeDefined();
    expect(screen.getByText(/مشاهده‌ی محصولات/i)).toBeDefined();
  });

  it("renders an error state when the fetch fails, rather than a false empty state", async () => {
    vi.mocked(getUserOrdersAction).mockResolvedValue({ success: false, error: "خطا در اتصال." });

    render(await OrdersHistoryPage());

    expect(screen.getByText("خطا در اتصال.")).toBeDefined();
    // Must NOT claim "no orders" when the real reason is a fetch failure.
    expect(screen.queryByText(/هیچ سفارشی ثبت نکرده‌اید/i)).toBeNull();
  });

  it("renders real order data when orders exist", async () => {
    vi.mocked(getUserOrdersAction).mockResolvedValue({
      success: true,
      orders: [
        {
          id: "order_1",
          orderNumber: 1042,
          status: "paid",
          totalAmount: { toString: () => "250000" },
          currency: "تومان",
          createdAt: new Date("2025-01-01"),
          items: [{ quantity: 2 }, { quantity: 1 }],
        },
      ],
    });

    render(await OrdersHistoryPage());

    expect(screen.getByText((_, element) => element?.textContent?.startsWith("سفارش #") ?? false)).toBeTruthy();
    expect(screen.queryByText(/هیچ سفارشی ثبت نکرده‌اید/i)).toBeNull();
  });
});
