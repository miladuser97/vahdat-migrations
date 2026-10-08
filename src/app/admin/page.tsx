import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getAdminDashboardStatsAction } from "@/lib/server/admin-actions";
import { toPersianDigits } from "@/utils/text-utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "پیشخوان مدیریت",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "پیش‌نویس",
  pending_payment: "در انتظار پرداخت",
  paid: "پرداخت‌شده",
  processing: "در حال پردازش",
  shipped: "ارسال‌شده",
  delivered: "تحویل‌شده",
  cancelled: "لغوشده",
  payment_failed: "پرداخت ناموفق",
};

const STATUS_VARIANTS: Record<string, "default" | "success" | "warning" | "destructive" | "info"> = {
  draft: "default",
  pending_payment: "warning",
  paid: "success",
  processing: "info",
  shipped: "info",
  delivered: "success",
  cancelled: "destructive",
  payment_failed: "destructive",
};

const ROLE_LABELS: Record<string, string> = {
  customer: "مشتری",
  staff: "کارمند",
  admin: "مدیر",
  super_admin: "مدیر ارشد",
};

export default async function AdminPage() {
  const result = await getAdminDashboardStatsAction();

  if (!result.success) {
    return (
      <Card>
        <p className="text-body-sm text-error">
          {result.error || "بارگذاری آمار با خطا مواجه شد."}
        </p>
      </Card>
    );
  }

  const { stats, recentOrders, recentUsers, topProducts, monthlySales } = result.data;

  const mainStats = [
    { label: "درآمد کل", value: `${toPersianDigits(stats.totalRevenue.toLocaleString("en-US"))} تومان`, color: "text-success" },
    { label: "درآمد این ماه", value: `${toPersianDigits(stats.monthlyRevenue.toLocaleString("en-US"))} تومان`, color: "text-brand-600" },
    { label: "کل سفارش‌ها", value: toPersianDigits(stats.orderCount), color: "" },
    { label: "کاربران", value: toPersianDigits(stats.userCount), color: "" },
  ];

  const subStats = [
    { label: "محصولات فعال", value: stats.productCount },
    { label: "محصولات غیرفعال", value: stats.disabledProductCount },
    { label: "موجودی کم (≤۵)", value: stats.lowStockCount },
    { label: "در انتظار پرداخت", value: stats.pendingOrderCount },
    { label: "پرداخت‌شده", value: stats.paidOrderCount },
    { label: "ارسال‌شده", value: stats.shippedOrderCount },
    { label: "تحویل‌شده", value: stats.deliveredOrderCount },
    { label: "نظرات در انتظار", value: stats.pendingReviewCount },
    { label: "کوپن‌های فعال", value: stats.activeCouponCount },
    { label: "تعمیرات در انتظار", value: stats.pendingRepairCount },
  ];

  const adminLinks = [
    { label: "📦 مدیریت محصولات", href: "/admin/products" },
    { label: "📂 مدیریت دسته‌بندی‌ها", href: "/admin/categories" },
    { label: "📋 مدیریت سفارش‌ها", href: "/admin/orders" },
    { label: "👥 مدیریت کاربران", href: "/admin/users" },
    { label: "🎟️ مدیریت کوپن‌ها", href: "/admin/coupons" },
    { label: "💬 مدیریت نظرات", href: "/admin/reviews" },
    { label: "🔧 درخواست‌های تعمیر", href: "/admin/repair" },
    { label: "⚙️ تنظیمات سایت", href: "/admin/settings" },
  ];

  function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="flex flex-col gap-xl">
      {/* ========================================== */}
      {/* آمار اصلی */}
      {/* ========================================== */}
      <div className="grid gap-md sm:grid-cols-2 lg:grid-cols-4">
        {mainStats.map((stat) => (
          <Card key={stat.label} className="flex flex-col gap-xs">
            <span className="text-caption text-text-secondary">{stat.label}</span>
            <span className={`text-h4 font-bold fa-num ${stat.color || "text-text-primary"}`}>
              {stat.value}
            </span>
          </Card>
        ))}
      </div>

      {/* ========================================== */}
      {/* آمار فرعی */}
      {/* ========================================== */}
      <div>
        <h3 className="text-h4 font-semibold text-text-primary mb-4">آمار تفصیلی</h3>
        <div className="grid gap-sm sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {subStats.map((stat) => (
            <Card key={stat.label} className="flex flex-col gap-xs">
              <span className="text-caption text-text-secondary">{stat.label}</span>
              <span className="text-h5 font-bold text-text-primary fa-num">
                {toPersianDigits(stat.value)}
              </span>
            </Card>
          ))}
        </div>
      </div>

      {/* ========================================== */}
      {/* دسترسی سریع */}
      {/* ========================================== */}
      <div>
        <h3 className="text-h4 font-semibold text-text-primary mb-4">دسترسی سریع</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {adminLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="p-4 hover:border-brand-300 hover:shadow-md transition-all duration-200">
                <p className="text-body font-medium text-text-primary">{link.label}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* ========================================== */}
      {/* فروش ۶ ماه اخیر */}
      {/* ========================================== */}
      {monthlySales.length > 0 && (
        <div>
          <h3 className="text-h4 font-semibold text-text-primary mb-4">فروش ۶ ماه اخیر</h3>
          <Card className="flex flex-col gap-sm">
            {monthlySales.map((month) => {
              const maxRevenue = Math.max(...monthlySales.map((m) => m.revenue), 1);
              const widthPercent = (month.revenue / maxRevenue) * 100;
              return (
                <div key={month.month} className="flex items-center gap-sm">
                  <span className="text-caption text-text-secondary w-16 shrink-0">
                    {month.monthLabel}
                  </span>
                  <div className="flex-1 bg-muted rounded-full h-6 relative overflow-hidden">
                    <div
                      className="bg-brand-600 h-full transition-all duration-500"
                      style={{ width: `${widthPercent}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-caption font-medium text-text-primary fa-num">
                      {toPersianDigits(month.orderCount)} سفارش — {toPersianDigits(month.revenue.toLocaleString("en-US"))} تومان
                    </span>
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      )}

      {/* ========================================== */}
      {/* محصولات پرفروش */}
      {/* ========================================== */}
      {topProducts.length > 0 && (
        <div>
          <h3 className="text-h4 font-semibold text-text-primary mb-4">پرفروش‌ترین محصولات</h3>
          <Card className="flex flex-col gap-sm">
            {topProducts.map((product, index) => (
              <div
                key={product.id}
                className="flex items-center justify-between gap-sm py-2 border-b border-border/50 last:border-0"
              >
                <div className="flex items-center gap-sm min-w-0">
                  <span className="text-h5 font-bold text-brand-600 w-6 shrink-0 fa-num">
                    {toPersianDigits(index + 1)}
                  </span>
                  <Link
                    href={`/products/${product.slug}`}
                    className="text-body-sm font-medium text-text-primary hover:text-brand-600 transition-colors truncate"
                    target="_blank"
                  >
                    {product.title}
                  </Link>
                </div>
                <div className="flex items-center gap-md shrink-0">
                  <span className="text-caption text-text-secondary fa-num">
                    {toPersianDigits(product.totalSold)} فروش
                  </span>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* ========================================== */}
      {/* سفارش‌ها و کاربران اخیر */}
      {/* ========================================== */}
      <div className="grid gap-lg lg:grid-cols-2">
        {/* سفارش‌های اخیر */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-h4 font-semibold text-text-primary">آخرین سفارش‌ها</h3>
            <Link href="/admin/orders" className="text-caption text-brand-600 hover:underline">
              مشاهده همه
            </Link>
          </div>
          <Card className="flex flex-col gap-sm">
            {recentOrders.length === 0 ? (
              <p className="text-body-sm text-text-secondary text-center py-md">
                سفارشی ثبت نشده است.
              </p>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between gap-sm py-2 border-b border-border/50 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-body-sm font-medium text-text-primary fa-num">
                      #{toPersianDigits(order.orderNumber)}
                    </p>
                    <p className="text-caption text-text-secondary truncate">
                      {order.customerName}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-xs shrink-0">
                    <Badge variant={STATUS_VARIANTS[order.status] || "default"}>
                      {STATUS_LABELS[order.status] || order.status}
                    </Badge>
                    <span className="text-caption text-text-secondary fa-num">
                      {toPersianDigits(order.totalAmount.toLocaleString("en-US"))} تومان
                    </span>
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>

        {/* کاربران اخیر */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-h4 font-semibold text-text-primary">آخرین کاربران</h3>
            <Link href="/admin/users" className="text-caption text-brand-600 hover:underline">
              مشاهده همه
            </Link>
          </div>
          <Card className="flex flex-col gap-sm">
            {recentUsers.length === 0 ? (
              <p className="text-body-sm text-text-secondary text-center py-md">
                کاربری ثبت نشده است.
              </p>
            ) : (
              recentUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-sm py-2 border-b border-border/50 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-body-sm font-medium text-text-primary">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="text-caption text-text-secondary fa-num" dir="ltr">
                      {u.mobileNumber}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-xs shrink-0">
                    <Badge variant="default">{ROLE_LABELS[u.role] || u.role}</Badge>
                    <span className="text-caption text-text-muted fa-num">
                      {formatDate(u.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}