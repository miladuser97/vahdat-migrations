import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { getAllRepairRequestsAction } from "@/lib/server/repair-actions";
import { AdminRepairTable } from "@/features/admin/components/AdminRepairTable";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "مدیریت درخواست‌های تعمیر",
};

export default async function AdminRepairPage() {
  const result = await getAllRepairRequestsAction();

  if (!result.success) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <p className="text-body-sm text-error">
            {result.error || "بارگذاری درخواست‌ها با خطا مواجه شد."}
          </p>
        </Card>
      </div>
    );
  }

  if (!result.data) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <p className="text-body-sm text-text-secondary">
            درخواستی یافت نشد.
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
            مدیریت درخواست‌های تعمیر
          </h2>
          <p className="text-body-sm text-text-secondary mt-1">
            جستجو، فیلتر، ویرایش وضعیت، هزینه و یادداشت درخواست‌های تعمیر
          </p>
        </div>
      </div>

      <AdminRepairTable initialRequests={result.data} />
    </div>
  );
}