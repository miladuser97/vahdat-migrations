import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProductForm } from "@/features/admin/components/ProductForm";
import { getProductByIdAction } from "@/lib/server/admin-actions";

export const metadata: Metadata = {
  title: "ویرایش محصول",
};

export const dynamic = "force-dynamic";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const result = await getProductByIdAction(id);

  if (!result.success) {
    if (result.error === "محصول یافت نشد.") {
      notFound();
    }
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <p className="text-body-sm text-error">
            {result.error || "بارگذاری محصول با خطا مواجه شد."}
          </p>
          <Link href="/admin/products">
            <Button variant="outline" size="sm" className="mt-4">
              ← بازگشت
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const { id: productId, ...initialData } = result.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-h2 font-semibold text-text-primary">
            ویرایش محصول
          </h2>
          <p className="text-body-sm text-text-secondary mt-1">
            {initialData.title}
          </p>
        </div>
        <Link href="/admin/products">
          <Button variant="outline" size="sm">
            ← بازگشت
          </Button>
        </Link>
      </div>

      <ProductForm mode="edit" productId={productId} initialData={initialData} />
    </div>
  );
}