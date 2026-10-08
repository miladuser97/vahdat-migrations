import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { Pagination } from "@/components/ui/Pagination";
import { buttonVariants } from "@/components/ui/button-variants";
import { AutoBreadcrumb } from "@/components/shared/AutoBreadcrumb";
import { CatalogSearch } from "@/features/products/components/CatalogSearch";
import { CatalogFilters } from "@/features/products/components/CatalogFilters";
import { CatalogSort } from "@/features/products/components/CatalogSort";
import { FilterSidebar } from "@/features/products/components/FilterSidebar";
import { FilterDrawer } from "@/features/products/components/FilterDrawer";
import { ActiveFilters } from "@/features/products/components/ActiveFilters";
import { ProductGrid } from "@/features/products/components/ProductGrid";
import { getProducts, getBrands, getProductsCount, type ProductQuery } from "@/features/products/services/product-service";
import { getCategories } from "@/features/categories/services/category-service";
import { SITE_FEATURES } from "@/config/features";
import { STORE_NOT_READY_MESSAGE } from "@/constants/messages";
import type { Product } from "@/features/products/types";
import type { Category } from "@/features/categories/types";

export const revalidate = 60;

const PAGE_SIZE = 24;

interface Props {
  searchParams: Promise<{
    q?: string;
    category?: string;
    brand?: string;
    sort?: string;
    page?: string;
  }>;
}

export const metadata: Metadata = {
  title: "محصولات",
  description: "مشاهده و انتخاب بهترین گوشی‌های موبایل، لوازم جانبی و تجهیزات دیجیتال در موبایل وحدت",
  alternates: {
    canonical: "/products",
  },
};

const recentSearches: string[] = [];
const popularSearches: string[] = [];
const searchSuggestions = SITE_FEATURES.products.searchSuggestions.enabled
  ? [...recentSearches, ...popularSearches]
  : [];
const savedFilterPresets: { key: string; label: string }[] = [];

export default async function ProductsPage({ searchParams }: Props) {
  try {
    const { q, category, brand, sort, page } = await searchParams;

    const currentPage = Number(page) || 1;
    const skip = (currentPage - 1) * PAGE_SIZE;

    const query: ProductQuery = {
      search: q,
      category,
      brand,
      sort: sort as ProductQuery["sort"],
      skip,
      take: PAGE_SIZE,
    };

    let products: Product[] = [];
    let totalCount = 0;
    let categories: Category[] = [];
    let brands: string[] = [];

    try {
      products = await getProducts(query);
    } catch (productError) {
      console.error("Error fetching products:", productError);
      products = [];
    }

    try {
      totalCount = await getProductsCount({
        search: q,
        category,
        brand,
      });
    } catch (countError) {
      console.error("Error fetching product count:", countError);
      totalCount = products.length;
    }

    try {
      categories = await getCategories();
    } catch (catError) {
      console.error("Error fetching categories:", catError);
      categories = [];
    }

    try {
      brands = await getBrands();
    } catch (brandError) {
      console.error("Error fetching brands:", brandError);
      brands = [];
    }

    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    const activeFilters: { key: string; label: string }[] = [];
    if (category) {
      const cat = categories.find((c) => c.slug === category);
      activeFilters.push({ key: "category", label: `دسته‌بندی: ${cat?.title || category}` });
    }
    if (brand) activeFilters.push({ key: "brand", label: `برند: ${brand}` });
    if (q) activeFilters.push({ key: "search", label: `جستجو: ${q}` });

    const hasActiveFilters = activeFilters.length > 0;

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "محصولات موبایل وحدت",
      description: "مشاهده و انتخاب بهترین گوشی‌های موبایل، لوازم جانبی و تجهیزات دیجیتال در موبایل وحدت",
    };

    const getPaginationUrl = (page: number) => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (category) params.set("category", category);
      if (brand) params.set("brand", brand);
      if (sort) params.set("sort", sort);
      params.set("page", String(page));
      return `/products?${params.toString()}`;
    };

    return (
      <Container>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />

        <div className="pt-md sm:pt-lg">
          <AutoBreadcrumb />
        </div>

        <PageHeader title="محصولات" />

        <Section>
          <CatalogSearch
            placeholder="جستجو در محصولات"
            suggestions={searchSuggestions.length > 0 ? searchSuggestions : undefined}
          />
        </Section>

        <Section>
          <div className="flex flex-col gap-lg lg:flex-row lg:items-start lg:gap-xl">
            <aside className="hidden lg:sticky lg:top-lg lg:block lg:w-64 lg:shrink-0">
              {SITE_FEATURES.products.savedFilters.enabled && savedFilterPresets.length > 0 && (
                <div className="mb-md flex flex-wrap gap-xs" aria-label="فیلترهای ذخیره‌شده">
                  {savedFilterPresets.map((preset) => (
                    <span
                      key={preset.key}
                      className="rounded-full border border-border px-sm py-xs text-body-sm text-text-secondary"
                    >
                      {preset.label}
                    </span>
                  ))}
                </div>
              )}
              <FilterSidebar
                activeCount={activeFilters.length}
                customFilters={
                  SITE_FEATURES.products.filters.enabled ? (
                    <CatalogFilters categories={categories} brands={brands} />
                  ) : undefined
                }
              />
            </aside>

            <div className="flex min-w-0 flex-1 flex-col gap-md">
              <FilterDrawer
                activeCount={activeFilters.length}
                customFilters={
                  SITE_FEATURES.products.filters.enabled ? (
                    <CatalogFilters categories={categories} brands={brands} />
                  ) : undefined
                }
              />

              <CatalogSort resultCount={products.length} />

              <ActiveFilters filters={activeFilters} />

              <ProductGrid
                products={products}
                emptyMessage={
                  hasActiveFilters
                    ? "با این فیلترها محصولی یافت نشد."
                    : STORE_NOT_READY_MESSAGE
                }
                emptyAction={
                  hasActiveFilters ? (
                    <Link
                      href="/products"
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      پاک کردن فیلترها
                    </Link>
                  ) : undefined
                }
              />

              {totalPages > 1 && (
                <div className="border-t border-border pt-md">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    getHref={getPaginationUrl}
                  />
                </div>
              )}
            </div>
          </div>
        </Section>
      </Container>
    );
  } catch (error) {
    console.error("ProductsPage Error:", error);

    return (
      <Container>
        <div className="pt-md sm:pt-lg">
          <AutoBreadcrumb />
        </div>
        <PageHeader title="محصولات" />
        <Section>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-6xl mb-4">🔧</div>
            <h3 className="text-h3 font-semibold text-text-primary mb-2">
              مشکلی در بارگذاری محصولات پیش آمد
            </h3>
            <p className="text-text-secondary mb-6 max-w-md">
              لطفاً چند لحظه دیگر دوباره تلاش کنید.
            </p>
            <Link
              href="/products"
              className={buttonVariants({
                variant: "default",
                size: "md",
              })}
            >
              تلاش دوباره
            </Link>
          </div>
        </Section>
      </Container>
    );
  }
}