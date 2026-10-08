import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import AccountPage from "../page";
import { AccountLayoutClient } from "@/features/account/components/AccountLayoutClient";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/account",
  useSearchParams: () => new URLSearchParams(),
}));

// AuthContext's `useAuth` is mocked per-test below so these tests
// exercise the real gating component (AccountLayoutClient) against
// each session state, without hitting cookies()/prisma.
const mockUseAuth = vi.fn();
vi.mock("@/features/account/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

describe("AccountLayoutClient - session gating (Phase 3)", () => {
  it("shows a loading state while the session is being checked", () => {
    mockUseAuth.mockReturnValue({ user: null, status: "loading", logout: vi.fn() });
    render(<AccountLayoutClient>محتوا</AccountLayoutClient>);

    expect(screen.getByText(/بررسی نشست/i)).toBeDefined();
  });

  it("shows the unauthenticated prompt (with a real, enabled login link) when there is no session", () => {
    mockUseAuth.mockReturnValue({ user: null, status: "unauthenticated", logout: vi.fn() });
    render(<AccountLayoutClient>محتوا</AccountLayoutClient>);

    expect(screen.getByText(/وارد نشده‌اید/i)).toBeDefined();
    const loginLink = screen.getByText(/ورود \/ ثبت‌نام/i).closest("a");
    expect(loginLink).not.toBeNull();
    expect(loginLink?.getAttribute("href")).toContain("/login");
    // The old placeholder rendered this as a disabled <button>; it must
    // now be a real, enabled link.
    expect(loginLink?.hasAttribute("disabled")).toBe(false);
  });

  it("renders the account sidebar and children once authenticated", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "u1", firstName: "سارا", lastName: "احمدی", mobileNumber: "09120001122", role: "customer" },
      status: "authenticated",
      logout: vi.fn(),
    });
    render(<AccountLayoutClient>محتوای پیشخوان</AccountLayoutClient>);

    expect(screen.getByText("محتوای پیشخوان")).toBeDefined();
    expect(screen.getByText("سفارش‌ها")).toBeDefined();
    expect(screen.getByText(/خروج از حساب/i)).toBeDefined();
  });
});

describe("AccountPage - authenticated dashboard content (Phase 3)", () => {
  it("greets the signed-in user by first name", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "u1", firstName: "سارا", lastName: "احمدی", mobileNumber: "09120001122", role: "customer" },
      status: "authenticated",
      logout: vi.fn(),
    });
    render(<AccountPage />);

    expect(screen.getByText(/خوش آمدید، سارا/)).toBeDefined();
  });
});
