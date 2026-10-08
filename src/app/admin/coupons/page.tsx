import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { getAdminCouponsAction } from "@/lib/server/admin-actions";
import { getAuthenticatedUser } from "@/lib/server/auth-utils";
import { AdminCouponsTable } from "@/features/admin/components/AdminCouponsTable";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "مدیریت کوپن‌ها",
};

export default async function AdminCouponsPage() {
  const [result, currentUser] = await Promise.all([
    getAdminCouponsAction(),
    getAuthenticatedUser(),
  ]);

  if (!result.success) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <p className="text-body-sm text-error">
            {result.error || "بارگذاری کوپن‌ها با خطا مواجه شد."}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-h2 font-semibold text-text-primary">
            مدیریت کوپن‌ها
          </h2>
          <p className="text-body-sm text-text-secondary mt-1">
            ایجاد، ویرایش، فعال/غیرفعال و حذف کوپن‌های تخفیف
          </p>
        </div>
      </div>

      <AdminCouponsTable
        initialCoupons={result.data}
        currentUserRole={currentUser?.role || "customer"}
      />
    </div>
  );
}