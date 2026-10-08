"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { useAuth } from "@/features/account/AuthContext";

/**
 * AccountDashboard
 *
 * Phase 3: the real, authenticated dashboard content. By the time this
 * renders, `AccountLayoutClient` has already confirmed `status ===
 * "authenticated"` — this component does not re-check auth itself
 * (would duplicate that gate), it only reads `user` for the greeting.
 */
export function AccountDashboard() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-lg">
      <div>
        <h2 className="text-h4 font-bold text-text-primary">
          خوش آمدید{user ? `، ${user.firstName}` : ""}
        </h2>
        <p className="mt-xs text-body-sm text-text-secondary">
          از این بخش می‌توانید سفارش‌های خود را پیگیری کنید و آدرس‌های تحویل را مدیریت نمایید.
        </p>
      </div>

      <div className="grid gap-md sm:grid-cols-2">
        <Link
          href="/account/orders"
          className="flex flex-col gap-xs rounded-md border border-border p-md hover:bg-muted"
        >
          <span className="font-medium text-text-primary">سفارش‌های من</span>
          <span className="text-body-sm text-text-secondary">پیگیری وضعیت سفارش‌ها</span>
        </Link>
        <Link
          href="/account/addresses"
          className="flex flex-col gap-xs rounded-md border border-border p-md hover:bg-muted"
        >
          <span className="font-medium text-text-primary">آدرس‌های من</span>
          <span className="text-body-sm text-text-secondary">مدیریت آدرس‌های تحویل</span>
        </Link>
      </div>

      <div className="flex flex-col gap-xs rounded-md border border-border p-md">
        <span className="text-caption text-text-secondary">شماره موبایل</span>
        <span className="text-body-sm font-medium text-text-primary" dir="ltr">
          {user?.mobileNumber}
        </span>
      </div>

      <Link href="/products" className={buttonVariants({ variant: "outline" })}>
        مشاهده‌ی محصولات
      </Link>
    </div>
  );
}
