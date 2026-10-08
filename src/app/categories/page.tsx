import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { InfoGrid } from "@/components/ui/InfoGrid";
import { AutoBreadcrumb } from "@/components/shared/AutoBreadcrumb";
import { CategoryShortcut } from "@/components/shared/CategoryShortcut";
import { getCategories } from "@/features/categories/services/category-service";
import { STORE_NOT_READY_MESSAGE } from "@/constants/messages";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "دسته‌بندی‌ها",
  description: STORE_NOT_READY_MESSAGE,
  alternates: {
    canonical: "/categories",
  },
};

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <Container>
      <div className="pt-md sm:pt-lg">
        <AutoBreadcrumb />
      </div>

      <PageHeader
        title="دسته‌بندی‌ها"
        description="نمونه‌ای از دسته‌بندی‌های آینده‌ی فروشگاه — فهرست نهایی پس از افزودن محصولات مشخص خواهد شد."
      />

      <InfoGrid columns={3} className="py-lg sm:py-xl md:grid-cols-3 lg:gap-lg">
        {categories.map((category) => (
          <CategoryShortcut
            key={category.slug}
            icon={category.iconComponent ? <category.iconComponent /> : undefined}
            title={category.title}
            description={category.description || ""}
            href={`/categories/${category.slug}`}
          />
        ))}
      </InfoGrid>
    </Container>
  );
}