import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { getAdminReviewsAction } from "@/lib/server/admin-actions";
import { getAuthenticatedUser } from "@/lib/server/auth-utils";
import { AdminReviewsTable } from "@/features/admin/components/AdminReviewsTable";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "مدیریت نظرات",
};

export default async function AdminReviewsPage() {
  const [result, currentUser] = await Promise.all([
    getAdminReviewsAction(),
    getAuthenticatedUser(),
  ]);

  if (!result.success) {
    return (
      <Card>
        <p className="text-body-sm text-error">
          {result.error || "بارگذاری نظرات با خطا مواجه شد."}
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-lg">
      <div>
        <h2 className="text-h4 font-bold text-text-primary mb-2">مدیریت نظرات</h2>
        <p className="text-body-sm text-text-secondary">
          تأیید، لغو تأیید و حذف نظرات کاربران
        </p>
      </div>

      <AdminReviewsTable
        initialReviews={result.data}
        currentUserRole={currentUser?.role || "customer"}
      />
    </div>
  );
}