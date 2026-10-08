import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { getAllMediaAction } from "@/lib/server/media-actions";
import { getAuthenticatedUser } from "@/lib/server/auth-utils";
import { AdminMediaLibrary } from "@/features/admin/components/AdminMediaLibrary";

export const dynamic = "force-dynamic";
export const preferredRegion = "sin1";
export const maxDuration = 30;

export const metadata: Metadata = {
  title: "کتابخانه‌ی عکس",
};

export default async function AdminMediaPage() {
  const [result, currentUser] = await Promise.all([
    getAllMediaAction(),
    getAuthenticatedUser(),
  ]);

  if (!result.success) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <p className="text-body-sm text-error">
            {result.error || "بارگذاری آرشیو عکس با خطا مواجه شد."}
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
            کتابخانه‌ی عکس
          </h2>
          <p className="text-body-sm text-text-secondary mt-1">
            آرشیو کامل عکس‌ها — جستجو، آپلود، و استفاده‌ی مجدد
          </p>
        </div>
      </div>

      <AdminMediaLibrary
        initialMedia={result.data}
        currentUserRole={currentUser?.role || "customer"}
      />
    </div>
  );
}