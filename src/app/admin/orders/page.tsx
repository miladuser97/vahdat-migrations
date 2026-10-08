import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { getAdminOrdersAction } from "@/lib/server/admin-actions";
import { AdminOrdersTable } from "@/features/admin/components/AdminOrdersTable";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "مدیریت سفارش‌ها",
};

export default async function AdminOrdersPage() {
  const result = await getAdminOrdersAction();

  if (!result.success) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <p className="text-body-sm text-error">
            {result.error || "بارگذاری سفارش‌ها با خطا مواجه شد."}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-h2 font-semibold text-text-primary">
          مدیریت سفارش‌ها
        </h2>
      </div>

      <AdminOrdersTable initialOrders={result.data} />
    </div>
  );
}