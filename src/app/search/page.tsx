import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { buttonVariants } from "@/components/ui/button-variants";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { SearchBar } from "@/components/shared/SearchBar";
import { ProductGrid } from "@/features/products/components/ProductGrid";
import { getProducts, type ProductQuery } from "@/features/products/services/product-service";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "جستجو",
  description: "جستجوی محصولات در موبایل وحدت",
};

interface Props {
  searchParams: Promise<{
    q?: string;
  }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;

  const query: ProductQuery = {
    search: q,
  };

  const products = await getProducts(query);

  const hasSearch = q && q.trim().length > 0;

  return (
    <Container>
      <Breadcrumb
        items={[
          { label: "خانه", href: "/" },
          { label: "جستجو" },
        ]}
        className="mb-md sm:mb-lg"
      />

      <PageHeader title="جستجو" />

      <Section>
        <div className="mb-md max-w-xl">
          <SearchBar
            placeholder="جستجو در محصولات..."
            defaultValue={q || ""}
          />
        </div>

        <div className="mt-md">
          {hasSearch && (
            <p className="mb-md text-sm text-text-secondary">
              نتایج جستجو برای: <strong className="text-text-primary">&quot;{q}&quot;</strong>
            </p>
          )}

          <ProductGrid
            products={products}
            emptyMessage={
              hasSearch
                ? "محصولی با این جستجو یافت نشد."
                : "کلمه مورد نظر خود را جستجو کنید."
            }
            emptyAction={
              hasSearch ? (
                <Link href="/products" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  مشاهده همه محصولات
                </Link>
              ) : undefined
            }
          />
        </div>
      </Section>
    </Container>
  );
}