import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { getAllSettingsAction } from "@/lib/server/admin-actions";
import { AdminSettingsForm } from "@/features/admin/components/AdminSettingsForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "تنظیمات سایت",
};

export default async function AdminSettingsPage() {
  const result = await getAllSettingsAction();

  if (!result.success) {
    return (
      <Card>
        <p className="text-body-sm text-error">
          {result.error || "بارگذاری تنظیمات با خطا مواجه شد."}
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-lg">
      <div>
        <h2 className="text-h4 font-bold text-text-primary mb-2">تنظیمات سایت</h2>
        <p className="text-body-sm text-text-secondary">
          فعال/غیرفعال کردن بخش‌های مختلف سایت. تغییرات بلافاصله اعمال می‌شوند.
        </p>
      </div>

      <AdminSettingsForm initialSettings={result.data} />
    </div>
  );
}