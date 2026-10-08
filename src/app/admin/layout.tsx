import type { ReactNode } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { getAuthenticatedUser } from "@/lib/server/auth-utils";

export const dynamic = "force-dynamic";

const ADMIN_MENU_ITEMS = [
  { label: "پیشخوان", href: "/admin" },
  { label: "محصولات", href: "/admin/products" },
  { label: "دسته‌بندی‌ها", href: "/admin/categories" },
  { label: "📸 کتابخانه‌ی عکس", href: "/admin/media" },
  { label: "سفارش‌ها", href: "/admin/orders" },
  { label: "کاربران", href: "/admin/users" },
  { label: "کوپن‌ها", href: "/admin/coupons" },
  { label: "نظرات", href: "/admin/reviews" },
  { label: "تعمیرات", href: "/admin/repair" },
  { label: "تنظیمات", href: "/admin/settings" },
];

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getAuthenticatedUser();

  // ⚠️ اگه کاربر لاگین نیست یا ادمین نیست،
  // درخواست به صفحه‌ی لاگین ریدایرکت می‌شه (توسط میدل‌ور یا خود صفحات ادمین)
  if (!user) {
    return <>{children}</>;
  }

  const isAdminTier =
    user.role === "admin" || user.role === "super_admin";

  if (!isAdminTier) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <p className="text-body text-error">
            دسترسی به پنل مدیریت مجاز نیست.
          </p>
        </Card>
      </div>
    );
  }

  const roleLabel =
    user.role === "super_admin" ? "مدیر ارشد" : "مدیر";

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-lg py-lg sm:py-xl">
        {/* هدر */}
        <div className="flex flex-col gap-xs border-b border-border pb-md">
          <h1 className="text-h3 font-bold text-text-primary">
            مدیریت فروشگاه
          </h1>
          <p className="text-body-sm text-text-secondary">
            {user.firstName} {user.lastName} ({roleLabel})
          </p>
        </div>

        <div className="flex flex-col gap-lg lg:flex-row">
          {/* منوی کناری */}
          <aside className="w-full lg:w-56 lg:shrink-0">
            <nav className="flex flex-row gap-xs overflow-x-auto rounded-md border border-border bg-surface p-sm lg:flex-col lg:overflow-visible">
              {ADMIN_MENU_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="shrink-0 rounded px-md py-sm text-body-sm font-medium text-text-secondary transition-colors hover:bg-muted hover:text-text-primary whitespace-nowrap"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          {/* محتوای اصلی */}
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}