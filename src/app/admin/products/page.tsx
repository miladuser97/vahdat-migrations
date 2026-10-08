import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getAdminProductsAction } from "@/lib/server/admin-actions";
import { getAuthenticatedUser } from "@/lib/server/auth-utils";
import { AdminProductsTable } from "@/features/admin/components/AdminProductsTable";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "مدیریت محصولات",
};

export default async function AdminProductsPage() {
  const [result, user] = await Promise.all([
    getAdminProductsAction(),
    getAuthenticatedUser(),
  ]);

  if (!result.success) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <p className="text-body-sm text-error">
            {result.error || "بارگذاری محصولات با خطا مواجه شد."}
          </p>
        </Card>
      </div>
    );
  }

  const currentUserRole = user?.role || "customer";

  return (
    <div className="space-y-6">
      {/* ✅ هدر با دکمه‌ی افزودن */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-h2 font-semibold text-text-primary">
          مدیریت محصولات
        </h2>
        <Link href="/admin/products/new">
          <Button variant="default" size="sm">
            + افزودن محصول جدید
          </Button>
        </Link>
      </div>

      <AdminProductsTable
        initialProducts={result.data}
        currentUserRole={currentUserRole}
      />
    </div>
  );
}