import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { getAdminUsersAction } from "@/lib/server/admin-actions";
import { getAuthenticatedUser } from "@/lib/server/auth-utils";
import { AdminUsersTable } from "@/features/admin/components/AdminUsersTable";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "مدیریت کاربران",
};

export default async function AdminUsersPage() {
  const [result, currentUser] = await Promise.all([
    getAdminUsersAction(),
    getAuthenticatedUser(),
  ]);

  if (!result.success) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <p className="text-body-sm text-error">
            {result.error || "بارگذاری کاربران با خطا مواجه شد."}
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
            مدیریت کاربران
          </h2>
          <p className="text-body-sm text-text-secondary mt-1">
            لیست کاربران، جستجو، فیلتر، تغییر نقش، فعال/غیرفعال و حذف
          </p>
        </div>
      </div>

      <AdminUsersTable
        initialUsers={result.data}
        currentUserRole={currentUser?.role || "customer"}
        currentUserId={currentUser?.id || ""}
      />
    </div>
  );
}