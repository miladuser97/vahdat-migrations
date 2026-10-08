import { Product, ProductSchema } from "../schema";
import { PRODUCT_FIXTURES } from "../data/fixtures";
import { normalizePersian } from "@/utils/text-utils";
import { expandPersianQuery } from "@/utils/persian-to-english";
import { apiClient } from "@/lib/api-client";
import { prisma } from "@/lib/server/prisma";
import { getEnv } from "@/config/env";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// ============================================================
// Query Types
// ============================================================

export interface ProductQuery {
  search?: string;
  category?: string;
  brand?: string;
  sort?: "price_asc" | "price_desc" | "title_asc" | "title_desc" | "newest" | "rating";
  page?: number;
  pageSize?: number;
  skip?: number;
  take?: number;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  isDiscounted?: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  isUsed?: boolean;
  isTechnoTime?: boolean;
  cpu?: string;
  ram?: string;
  storage?: string;
  screen?: string;
  gpu?: string;
}

export interface ProductCountQuery {
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  isDiscounted?: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  isUsed?: boolean;
}

const ProductListSchema = z.array(ProductSchema);

// ============================================================
// Parse images
// ============================================================

const ProductImageSchema = z.object({
  url: z.string(),
  alt: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

const ProductImagesSchema = z.array(ProductImageSchema);
type ImageRef = z.infer<typeof ProductImageSchema>;

function parseProductImages(value: Prisma.JsonValue | null): ImageRef[] {
  if (!value) return [];
  const result = ProductImagesSchema.safeParse(value);
  return result.success ? result.data : [];
}

// ============================================================
// Parse images از ProductMedia
// ============================================================

type MediaImageRelation = {
  isPrimary: boolean;
  displayOrder: number;
  media: {
    url: string;
    altText: string | null;
    width: number | null;
    height: number | null;
  };
};

function parseMediaImages(
  productMedia: MediaImageRelation[] | undefined
): ImageRef[] {
  if (!productMedia || productMedia.length === 0) return [];

  return productMedia
    .filter((pm) => pm.media && pm.media.url)
    .sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      return a.displayOrder - b.displayOrder;
    })
    .map((pm) => ({
      url: pm.media.url,
      alt: pm.media.altText ?? undefined,
      width: pm.media.width ?? undefined,
      height: pm.media.height ?? undefined,
    }));
}

// ============================================================
// Parse attributes
// ============================================================

const ProductAttributesSchema = z.record(z.string(), z.string());

function parseProductAttributes(
  value: Prisma.JsonValue | null
): Record<string, string> | undefined {
  if (!value) return undefined;
  const result = ProductAttributesSchema.safeParse(value);
  return result.success ? result.data : undefined;
}

// ============================================================
// Parse seo
// ============================================================

const SeoMetadataSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  canonical: z.string().optional(),
  ogImage: z.string().optional(),
  ogType: z.string().optional(),
});

type SeoMetadata = z.infer<typeof SeoMetadataSchema>;

function parseProductSeo(
  value: Prisma.JsonValue | null
): SeoMetadata | undefined {
  if (!value) return undefined;
  const result = SeoMetadataSchema.safeParse(value);
  return result.success ? result.data : undefined;
}

// ============================================================
// Map Prisma → Product
// ============================================================

function mapPrismaProductToProduct(p: {
  id: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  description: string | null;
  sku: string | null;
  brand: { name: string } | null;
  categorySlug: string | null;
  price: { toString(): string };
  currency: string;
  discountPrice: { toString(): string } | null;
  discountEndsAt: Date | null;
  inventoryCount: number;
  images: Prisma.JsonValue | null;
  attributes: Prisma.JsonValue | null;
  seo: Prisma.JsonValue | null;
  rating: number | null;
  reviewCount: number;
  isEnabled: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  isFastShipping: boolean;
  isTechnoTime: boolean;
  technoTimeEndsAt: Date | null;
  isUsed: boolean;
  usedCondition: string;
  usedDescription: string | null;
  warranty: string | null;
  isOriginal: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: Date;
  updatedAt: Date;
  media?: MediaImageRelation[];
}): Product {
  const mediaImages = parseMediaImages(p.media);
  const jsonImages = parseProductImages(p.images);
  const finalImages = mediaImages.length > 0 ? mediaImages : jsonImages;

  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    shortDescription: p.shortDescription ?? undefined,
    description: p.description ?? undefined,
    sku: p.sku ?? undefined,
    brand: p.brand?.name ?? undefined,
    categorySlug: p.categorySlug ?? undefined,
    price: Number(p.price),
    currency: p.currency,
    discountPrice: p.discountPrice ? Number(p.discountPrice) : undefined,
    discountEndsAt: p.discountEndsAt?.toISOString(),
    inventoryCount: p.inventoryCount,
    images: finalImages,
    attributes: parseProductAttributes(p.attributes),
    seo: parseProductSeo(p.seo),
    rating: p.rating || 0,
    reviewCount: p.reviewCount,
    isEnabled: p.isEnabled,
    isNew: p.isNew,
    isBestSeller: p.isBestSeller,
    isFastShipping: p.isFastShipping,
    isTechnoTime: p.isTechnoTime,
    technoTimeEndsAt: p.technoTimeEndsAt?.toISOString(),
    isUsed: p.isUsed,
    usedCondition: p.usedCondition as Product["usedCondition"],
    usedDescription: p.usedDescription ?? undefined,
    warranty: p.warranty ?? undefined,
    isOriginal: p.isOriginal,
    seoTitle: p.seoTitle ?? undefined,
    seoDescription: p.seoDescription ?? undefined,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

// ============================================================
// Include برای Media Library
// ============================================================

const mediaInclude = {
  media: {
    where: { status: "APPROVED" as const },
    select: {
      isPrimary: true,
      displayOrder: true,
      media: {
        select: {
          url: true,
          altText: true,
          width: true,
          height: true,
        },
      },
    },
  },
} as const;

// ============================================================
// getProducts
// ============================================================

export async function getProducts(query?: ProductQuery): Promise<Product[]> {
  const env = getEnv();
  const useRealApi = false;

  if (useRealApi) {
    return apiClient("/products", ProductListSchema, { method: "GET" });
  }

  try {
    const where: Prisma.ProductWhereInput = { isEnabled: true };

    if (query?.category) where.categorySlug = query.category;
    if (query?.brand) where.brand = { name: query.brand };
    if (query?.inStock) where.inventoryCount = { gt: 0 };
    if (query?.isNew) where.isNew = true;
    if (query?.isBestSeller) where.isBestSeller = true;
    if (query?.isUsed) where.isUsed = true;
    if (query?.isTechnoTime) where.isTechnoTime = true;
    if (query?.isDiscounted) where.discountPrice = { not: null };

    if (query?.minPrice !== undefined || query?.maxPrice !== undefined) {
      const priceFilter: Prisma.DecimalFilter = {};
      if (query.minPrice !== undefined) priceFilter.gte = query.minPrice;
      if (query.maxPrice !== undefined) priceFilter.lte = query.maxPrice;
      where.price = priceFilter;
    }

    if (query?.search && query.search.trim().length > 0) {
      const searchTerm = query.search.trim();
      const normalizedSearch = normalizePersian(searchTerm);
      const expandedQueries = expandPersianQuery(searchTerm);

      const searchConditions: Prisma.ProductWhereInput[] = [];

      for (const term of expandedQueries) {
        const normalizedTerm = normalizePersian(term);
        searchConditions.push(
          { title: { contains: normalizedTerm, mode: "insensitive" } },
          { brand: { name: { contains: normalizedTerm, mode: "insensitive" } } },
          { description: { contains: normalizedTerm, mode: "insensitive" } },
          { shortDescription: { contains: normalizedTerm, mode: "insensitive" } }
        );
      }

      searchConditions.push(
        { title: { contains: normalizedSearch, mode: "insensitive" } },
        { description: { contains: normalizedSearch, mode: "insensitive" } }
      );

      if (normalizedSearch.length > 3) {
        searchConditions.push({ sku: { contains: normalizedSearch, mode: "insensitive" } });
      }

      where.OR = searchConditions;
    }

    const attrFilters: { path: string[]; contains: string }[] = [];
    if (query?.cpu) attrFilters.push({ path: ["پردازنده"], contains: query.cpu });
    if (query?.ram) attrFilters.push({ path: ["رم"], contains: query.ram });
    if (query?.storage) attrFilters.push({ path: ["حافظه"], contains: query.storage });
    if (query?.screen) attrFilters.push({ path: ["صفحه‌نمایش"], contains: query.screen });
    if (query?.gpu) attrFilters.push({ path: ["کارت گرافیک"], contains: query.gpu });

    if (attrFilters.length > 0) {
      where.AND = attrFilters.map((filter) => ({
        attributes: {
          path: filter.path,
          string_contains: filter.contains,
        },
      }));
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput | undefined;
    if (query?.sort) {
      if (query.sort === "price_asc") orderBy = { price: "asc" };
      if (query.sort === "price_desc") orderBy = { price: "desc" };
      if (query.sort === "title_asc") orderBy = { title: "asc" };
      if (query.sort === "title_desc") orderBy = { title: "desc" };
      if (query.sort === "newest") orderBy = { createdAt: "desc" };
      if (query.sort === "rating") orderBy = { rating: "desc" };
    }

    const skip = query?.skip ?? ((query?.page || 1) - 1) * (query?.pageSize || 24);
    const take = query?.take ?? query?.pageSize ?? 24;

    const products = await prisma.product.findMany({
      where,
      orderBy,
      include: {
        brand: true,
        media: mediaInclude.media,
      },
      take,
      skip,
    });

    if (products.length > 0) {
      return products.map(mapPrismaProductToProduct);
    }

    if (env.NODE_ENV === "development") {
      return filterFixtures(PRODUCT_FIXTURES, query);
    }

    return [];
  } catch (error) {
    console.error("Database Error - getProducts:", error);
    if (env.NODE_ENV === "development") {
      return filterFixtures(PRODUCT_FIXTURES, query);
    }
    throw error;
  }
}

// ============================================================
// فیلتر Fixtures (فقط dev)
// ============================================================

function filterFixtures(fixtures: Product[], query?: ProductQuery): Product[] {
  let result = [...fixtures];

  if (query?.category) result = result.filter((p) => p.categorySlug === query.category);
  if (query?.brand) result = result.filter((p) => p.brand === query.brand);
  if (query?.minPrice !== undefined)
    result = result.filter((p) => (p.price || 0) >= query.minPrice!);
  if (query?.maxPrice !== undefined)
    result = result.filter((p) => (p.price || 0) <= query.maxPrice!);
  if (query?.isDiscounted) result = result.filter((p) => !!p.discountPrice);
  if (query?.inStock) result = result.filter((p) => (p.inventoryCount || 0) > 0);

  if (query?.search) {
    const searchTerm = query.search.trim().toLowerCase();
    const normalizedSearch = normalizePersian(searchTerm);
    result = result.filter((p) => {
      if (p.title?.toLowerCase().includes(normalizedSearch)) return true;
      if (p.brand?.toLowerCase().includes(normalizedSearch)) return true;
      if (p.description?.toLowerCase().includes(normalizedSearch)) return true;
      return false;
    });
  }

  return result;
}

// ============================================================
// getProductsCount
// ============================================================

export async function getProductsCount(
  query?: ProductCountQuery
): Promise<number> {
  try {
    const where: Prisma.ProductWhereInput = { isEnabled: true };

    if (query?.category) where.categorySlug = query.category;
    if (query?.brand) where.brand = { name: query.brand };
    if (query?.inStock) where.inventoryCount = { gt: 0 };
    if (query?.isNew) where.isNew = true;
    if (query?.isBestSeller) where.isBestSeller = true;
    if (query?.isUsed) where.isUsed = true;
    if (query?.isDiscounted) where.discountPrice = { not: null };

    if (query?.minPrice !== undefined || query?.maxPrice !== undefined) {
      const priceFilter: Prisma.DecimalFilter = {};
      if (query.minPrice !== undefined) priceFilter.gte = query.minPrice;
      if (query.maxPrice !== undefined) priceFilter.lte = query.maxPrice;
      where.price = priceFilter;
    }

    if (query?.search && query.search.trim().length > 0) {
      const normalizedSearch = normalizePersian(query.search.trim());
      where.OR = [
        { title: { contains: normalizedSearch, mode: "insensitive" } },
        { brand: { name: { contains: normalizedSearch, mode: "insensitive" } } },
        { description: { contains: normalizedSearch, mode: "insensitive" } },
        { shortDescription: { contains: normalizedSearch, mode: "insensitive" } },
      ];
    }

    return await prisma.product.count({ where });
  } catch (error) {
    console.error("Database Error - getProductsCount:", error);
    if (getEnv().NODE_ENV === "development") return PRODUCT_FIXTURES.length;
    throw error;
  }
}

// ============================================================
// getProductBySlug
// ============================================================

export async function getProductBySlug(
  slug: string
): Promise<Product | undefined> {
  try {
    const p = await prisma.product.findUnique({
      where: { slug },
      include: {
        brand: true,
        media: mediaInclude.media,
      },
    });
    if (!p) return undefined;
    return mapPrismaProductToProduct(p);
  } catch (error) {
    console.error("Database Error - getProductBySlug:", error);
    if (getEnv().NODE_ENV === "development") {
      return PRODUCT_FIXTURES.find((p) => p.slug === slug);
    }
    throw error;
  }
}

// ============================================================
// getBrands
// ============================================================

export async function getBrands(): Promise<string[]> {
  try {
    const brands = await prisma.brand.findMany({
      where: { isActive: true },
      select: { name: true },
      orderBy: { name: "asc" },
    });
    const names = brands.map((b) => b.name);

    if (names.length === 0) {
      if (getEnv().NODE_ENV === "development") {
        const fixtureBrands = PRODUCT_FIXTURES
          .map((p) => p.brand)
          .filter((b): b is string => !!b);
        return [...new Set(fixtureBrands)];
      }
      return [];
    }
    return names;
  } catch (error) {
    console.error("Database Error - getBrands:", error);
    if (getEnv().NODE_ENV === "development") {
      const fixtureBrands = PRODUCT_FIXTURES
        .map((p) => p.brand)
        .filter((b): b is string => !!b);
      return [...new Set(fixtureBrands)];
    }
    throw error;
  }
}

// ============================================================
// getPriceRange
// ============================================================

export async function getPriceRange(): Promise<{ min: number; max: number }> {
  try {
    const result = await prisma.product.aggregate({
      where: { isEnabled: true },
      _min: { price: true },
      _max: { price: true },
    });

    const min = result._min.price ? Number(result._min.price) : 0;
    const max = result._max.price ? Number(result._max.price) : 100000000;
    return { min, max };
  } catch (error) {
    console.error("Database Error - getPriceRange:", error);
    if (getEnv().NODE_ENV === "development") {
      const prices = PRODUCT_FIXTURES.map((p) => p.price || 0);
      return { min: Math.min(...prices), max: Math.max(...prices) };
    }
    throw error;
  }
}

// ============================================================
// getProductsByFilter — سکشن‌های صفحه اصلی
// ✅ اضافه شد: budget
// ============================================================

/** ✅ سقف قیمت برای بخش «اقتصادی‌ها» — ۱۰ میلیون تومان */
const BUDGET_MAX_PRICE = 10_000_000;

export async function getProductsByFilter(
  filter:
    | "newest"
    | "bestSeller"
    | "discounted"
    | "technoTime"
    | "used"
    | "laptop"
    | "phone"
    | "tablet"
    | "smartwatch"
    | "headphone"
    | "accessory"
    | "budget",
  limit = 10
): Promise<Product[]> {
  const query: ProductQuery = { take: limit };

  if (filter === "newest") query.isNew = true;
  if (filter === "bestSeller") query.isBestSeller = true;
  if (filter === "discounted") query.isDiscounted = true;
  if (filter === "technoTime") query.isTechnoTime = true;
  if (filter === "used") query.isUsed = true;

  // ✅ بخش «اقتصادی‌ها»: محصولات زیر ۱۰ میلیون
  if (filter === "budget") {
    query.maxPrice = BUDGET_MAX_PRICE;
    query.sort = "price_asc"; // ارزون‌ترین اول
  }

  // ✅ فیلترهای دسته‌بندی
  if (filter === "laptop") query.category = "laptops";
  if (filter === "phone") query.category = "smartphones";
  if (filter === "tablet") query.category = "tablets";
  if (filter === "smartwatch") query.category = "smartwatches";
  if (filter === "headphone") query.category = "headphones";
  if (filter === "accessory") query.category = "accessories";

  return getProducts(query);
}