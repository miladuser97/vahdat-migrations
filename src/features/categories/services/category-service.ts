import { Category, CategorySchema } from "../schema";
import { CATEGORY_FIXTURES } from "../data/fixtures";
import { prisma } from "@/lib/server/prisma";
import { apiClient } from "@/lib/api-client";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const CategoryListSchema = z.array(CategorySchema);

// ============================================================
// Validate کردن seo
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

function parseCategorySeo(value: Prisma.JsonValue | null): SeoMetadata | undefined {
  if (!value) return undefined;
  const result = SeoMetadataSchema.safeParse(value);
  return result.success ? result.data : undefined;
}

// ============================================================
// نگاشت Prisma → Category
// ============================================================

function mapPrismaCategoryToCategory(c: {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  order: number;
  visible: boolean;
  image: string | null;
  icon: string | null;
  color: string | null;
  showInSlider: boolean;
  seo: Prisma.JsonValue | null;
}): Category {
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    description: c.description ?? undefined,
    order: c.order,
    visible: c.visible,
    image: c.image ?? undefined,
    icon: c.icon ?? undefined,
    color: c.color ?? undefined,
    showInSlider: c.showInSlider,
    seo: parseCategorySeo(c.seo),
  };
}

// ============================================================
// getCategories — همه دسته‌بندی‌ها
// ============================================================

export async function getCategories(): Promise<Category[]> {
  const useRealApi = false;

  if (useRealApi) {
    return await apiClient("/categories", CategoryListSchema, { method: "GET" });
  }

  try {
    const categories = await prisma.category.findMany({
      where: { visible: true },
      orderBy: { order: "asc" },
    });
    return categories.map(mapPrismaCategoryToCategory);
  } catch (error) {
    console.error("Database Error - getCategories:", error);
    if (
      process.env.NODE_ENV !== "production" ||
      process.env.NEXT_PHASE === "phase-production-build"
    ) {
      return CATEGORY_FIXTURES;
    }
    throw error;
  }
}

// ============================================================
// getCategoriesForSlider — فقط دسته‌هایی که در اسلایدر نمایش داده می‌شوند
// ============================================================

export async function getCategoriesForSlider(): Promise<Category[]> {
  try {
    const categories = await prisma.category.findMany({
      where: {
        visible: true,
        showInSlider: true,
        parentId: null,
      },
      orderBy: { order: "asc" },
      take: 10,
    });
    return categories.map(mapPrismaCategoryToCategory);
  } catch (error) {
    console.error("Database Error - getCategoriesForSlider:", error);
    if (process.env.NODE_ENV !== "production") {
      return CATEGORY_FIXTURES.slice(0, 10);
    }
    throw error;
  }
}

// ============================================================
// getCategoryBySlug — یک دسته بر اساس slug
// ============================================================

export async function getCategoryBySlug(
  slug: string
): Promise<Category | undefined> {
  try {
    const cat = await prisma.category.findUnique({ where: { slug } });
    if (!cat) return undefined;
    return mapPrismaCategoryToCategory(cat);
  } catch (error) {
    console.error("Database Error - getCategoryBySlug:", error);
    if (process.env.NODE_ENV !== "production") {
      const fallback = CATEGORY_FIXTURES.find((c) => c.slug === slug);
      if (fallback) return fallback;
    }
    throw error;
  }
}