import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ProductForm } from "@/features/admin/components/ProductForm";

export const metadata: Metadata = {
  title: "افزودن محصول جدید",
};

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-h2 font-semibold text-text-primary">
          افزودن محصول جدید
        </h2>
        <Link href="/admin/products">
          <Button variant="outline" size="sm">
            ← بازگشت
          </Button>
        </Link>
      </div>

      <ProductForm mode="create" />
    </div>
  );
}