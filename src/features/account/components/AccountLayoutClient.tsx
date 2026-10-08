"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { buttonVariants } from "@/components/ui/button-variants";
import { useAuth } from "@/features/account/AuthContext";
import { AccountSidebar } from "@/features/account/components/AccountSidebar";

/**
 * AccountLayoutClient
 *
 * Phase 3: the single place that gates every `/account/*` page behind
 * a real session — previously only `/account` itself had an
 * (hardcoded-false) check, and `/account/profile`, `/account/orders`,
 * `/account/addresses` were reachable and rendered their placeholder
 * content regardless of authentication state. Centralizing the guard
 * here means none of those pages need their own auth check (avoids
 * duplicating authentication logic across four files).
 *
 * Deliberately a client component using the existing `AuthContext` —
 * not a new pattern — the same context every other authenticated UI
 * piece (Header, LoginForm, RegisterForm) already reads from.
 */
export function AccountLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <div className="py-lg sm:py-xl">
        <p className="text-body-sm text-text-secondary">در حال بررسی نشست ورود...</p>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="flex flex-col items-center justify-center gap-md py-xl text-center">
        <div className="text-4xl">👤</div>
        <h2 className="text-h4 font-bold text-text-primary">به حساب خود وارد نشده‌اید</h2>
        <p className="max-w-xs text-body-sm text-text-secondary">
          برای مشاهده‌ی پیشخوان، سفارش‌ها و مدیریت آدرس‌ها ابتدا باید وارد حساب کاربری خود شوید.
        </p>
        <div className="mt-md flex gap-sm">
          <Link
            href={`/login?redirect=${encodeURIComponent(pathname || "/account")}`}
            className={buttonVariants({ variant: "default" })}
          >
            ورود / ثبت‌نام
          </Link>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            بازگشت به فروشگاه
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-lg sm:py-xl">
      <PageHeader title="حساب کاربری" className="mb-lg" />
      <div className="flex flex-col gap-lg lg:flex-row">
        <aside className="w-full lg:w-64 lg:shrink-0">
          <AccountSidebar />
        </aside>
        <main className="min-w-0 flex-1 rounded-md border border-border bg-surface p-md sm:p-lg">
          {children}
        </main>
      </div>
    </div>
  );
}
