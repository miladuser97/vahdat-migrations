import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { EmptyState } from "@/components/shared/EmptyState";
import { AutoBreadcrumb } from "@/components/shared/AutoBreadcrumb";
import { buttonVariants } from "@/components/ui/button-variants";
import { getCategoryBySlug } from "@/features/categories/services/category-service";
import { getProducts, getBrands, getProductsCount, type ProductQuery } from "@/features/products/services/product-service";
import { CatalogSort } from "@/features/products/components/CatalogSort";
import { CatalogSearch } from "@/features/products/components/CatalogSearch";
import { CatalogFilters } from "@/features/products/components/CatalogFilters";
import { LaptopFilters } from "@/features/products/components/LaptopFilters";
import { FilterSidebar } from "@/features/products/components/FilterSidebar";
import { FilterDrawer } from "@/features/products/components/FilterDrawer";
import { ActiveFilters } from "@/features/products/components/ActiveFilters";
import { ProductGrid } from "@/features/products/components/ProductGrid";
import { Pagination } from "@/components/ui/Pagination";
import { SITE_FEATURES } from "@/config/features";
import { STORE_NOT_READY_MESSAGE } from "@/constants/messages";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    q?: string;
    brand?: string;
    sort?: string;
    page?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    cpu?: string;
    ram?: string;
    storage?: string;
    screen?: string;
    gpu?: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return {
      title: "دسته‌بندی یافت نشد",
      description: STORE_NOT_READY_MESSAGE,
    };
  }

  return {
    title: category.title,
    description: category.description || STORE_NOT_READY_MESSAGE,
  };
}

export default async function CategoryDetailsPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const {
    q,
    brand,
    sort,
    page,
    minPrice,
    maxPrice,
    inStock,
    cpu,
    ram,
    storage,
    screen,
    gpu,
  } = await searchParams;

  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const currentPage = Number(page) || 1;
  const skip = (currentPage - 1) * PAGE_SIZE;

  const query: ProductQuery = {
    category: slug,
    search: q,
    brand,
    sort: sort as ProductQuery["sort"],
    skip,
    take: PAGE_SIZE,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    inStock: inStock === "true",
    cpu,
    ram,
    storage,
    screen,
    gpu,
  };

  const [products, totalCount, brands] = await Promise.all([
    getProducts(query),
    getProductsCount({ category: slug, search: q, brand }),
    getBrands(),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const activeFilters: { key: string; label: string }[] = [];
  if (brand) activeFilters.push({ key: "brand", label: `برند: ${brand}` });
  if (q) activeFilters.push({ key: "search", label: `جستجو: ${q}` });
  if (minPrice) activeFilters.push({ key: "minPrice", label: `از ${minPrice} تومان` });
  if (maxPrice) activeFilters.push({ key: "maxPrice", label: `تا ${maxPrice} تومان` });
  if (inStock === "true") activeFilters.push({ key: "inStock", label: "فقط موجود" });
  if (cpu) activeFilters.push({ key: "cpu", label: `پردازنده: ${cpu}` });
  if (ram) activeFilters.push({ key: "ram", label: `رم: ${ram}` });
  if (storage) activeFilters.push({ key: "storage", label: `حافظه: ${storage}` });
  if (screen) activeFilters.push({ key: "screen", label: `صفحه‌نمایش: ${screen}` });
  if (gpu) activeFilters.push({ key: "gpu", label: `گرافیک: ${gpu}` });

  const hasActiveFilters = activeFilters.length > 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.title,
    description: category.description,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "خانه", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "دسته‌بندی‌ها", item: `${SITE_URL}/categories` },
        { "@type": "ListItem", position: 3, name: category.title },
      ],
    },
  };

  const getPaginationUrl = (pageNum: number) => {
    const searchParamsObj = new URLSearchParams();
    if (q) searchParamsObj.set("q", q);
    if (brand) searchParamsObj.set("brand", brand);
    if (sort) searchParamsObj.set("sort", sort);
    if (minPrice) searchParamsObj.set("minPrice", minPrice);
    if (maxPrice) searchParamsObj.set("maxPrice", maxPrice);
    if (inStock) searchParamsObj.set("inStock", inStock);
    if (cpu) searchParamsObj.set("cpu", cpu);
    if (ram) searchParamsObj.set("ram", ram);
    if (storage) searchParamsObj.set("storage", storage);
    if (screen) searchParamsObj.set("screen", screen);
    if (gpu) searchParamsObj.set("gpu", gpu);
    searchParamsObj.set("page", String(pageNum));
    return `/categories/${slug}?${searchParamsObj.toString()}`;
  };

  const filterContent = (
    <div className="flex flex-col gap-md">
      <CatalogFilters categories={[]} brands={brands} />
      {slug === "laptops" && <LaptopFilters />}
    </div>
  );

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

      <PageHeader
        title={category.title}
        description={category.description}
      />

      <Section>
        <CatalogSearch placeholder={`جستجو در ${category.title}...`} />
      </Section>

      <Section>
        <div className="flex flex-col gap-lg lg:flex-row lg:items-start lg:gap-xl">
          <aside className="hidden lg:sticky lg:top-20 lg:block lg:w-64 lg:shrink-0">
            <FilterSidebar
              activeCount={activeFilters.length}
              customFilters={filterContent}
            />
          </aside>

          <div className="flex min-w-0 flex-1 flex-col gap-md">
            <FilterDrawer
              activeCount={activeFilters.length}
              customFilters={filterContent}
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
                    href={`/categories/${slug}`}
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
}