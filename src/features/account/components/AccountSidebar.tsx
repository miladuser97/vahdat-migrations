"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/utils/cn";
import { useAuth } from "@/features/account/AuthContext";
import { LogoutIcon } from "@/components/ui/icons";

const NAV_ITEMS = [
  { label: "پیشخوان", href: "/account" },
  { label: "پروفایل", href: "/account/profile" },
  { label: "سفارش‌ها", href: "/account/orders" },
  { label: "آدرس‌ها", href: "/account/addresses" },
];

/**
 * AccountSidebar
 * 
 * Simple vertical navigation for the account section.
 * Highlight active link based on the current path.
 *
 * Phase 3: added the logout action here — the one reachable place a
 * signed-in customer ends their session from. Calls the existing
 * `AuthContext.logout()` (itself a thin wrapper over `logoutAction`,
 * which deletes the hashed session server-side and clears the
 * cookie) — no new logout logic, just a caller for what already
 * existed and had none.
 */
export function AccountSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <nav className="flex flex-col gap-xs rounded-md border border-border bg-surface p-sm">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "rounded px-md py-sm text-body-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-text-secondary hover:bg-muted hover:text-text-primary"
            )}
          >
            {item.label}
          </Link>
        );
      })}

      <button
        type="button"
        onClick={handleLogout}
        className="mt-xs flex items-center gap-xs rounded px-md py-sm text-body-sm font-medium text-error transition-colors hover:bg-error/10"
      >
        <LogoutIcon aria-hidden="true" className="h-4 w-4" />
        خروج از حساب
      </button>
    </nav>
  );
}
