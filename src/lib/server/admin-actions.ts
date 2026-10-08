"use server";

import { getAuthenticatedUser } from "./auth-utils";
import { prisma } from "./prisma";
import { logger } from "../logger";
import { revalidatePath } from "next/cache";

// ============================================================
// ✅ Helpers
// ============================================================
function isAdmin(user: { role: string } | null): boolean {
  if (!user) return false;
  return user.role === "admin" || user.role === "super_admin";
}

function isSuperAdmin(user: { role: string } | null): boolean {
  if (!user) return false;
  return user.role === "super_admin";
}

// ============================================================
// Types
// ============================================================

export interface AdminProduct {
  id: string;
  slug: string;
  title: string;
  price: number;
  currency: string;
  inventoryCount: number;
  isEnabled: boolean;
}

export interface AdminOrder {
  id: string;
  orderNumber: number;
  userId: string | null;
  status: string;
  totalAmount: number;
  currency: string;
  customerInformation: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
  items: {
    id: string;
    productId: string;
    title: string;
    price: number;
    quantity: number;
  }[];
  paymentAttempts: {
    id: string;
    transactionId: string | null;
    status: string;
    amount: number;
    createdAt: Date;
  }[];
}

// ============================================================
// Product Actions
// ============================================================

export type GetAdminProductsResult =
  | { success: true; data: AdminProduct[] }
  | { success: false; error: string };

export type UpdateProductResult =
  | { success: true; data: AdminProduct }
  | { success: false; error: string };

export async function getAdminProductsAction(): Promise<GetAdminProductsResult> {
  const user = await getAuthenticatedUser();
  if (!isAdmin(user)) {
    return { success: false, error: "دسترسی غیرمجاز." };
  }

  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        price: true,
        currency: true,
        inventoryCount: true,
        isEnabled: true,
      },
    });

    return {
      success: true,
      data: products.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        price: Number(p.price),
        currency: p.currency,
        inventoryCount: p.inventoryCount,
        isEnabled: p.isEnabled,
      })),
    };
  } catch (error) {
    logger.error("[Admin:Products] Failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "خطا در بارگذاری محصولات." };
  }
}

export async function updateProductAction(
  productId: string,
  data: {
    price?: number;
    inventoryCount?: number;
    isEnabled?: boolean;
  }
): Promise<UpdateProductResult> {
  const user = await getAuthenticatedUser();
  if (!isAdmin(user)) {
    return { success: false, error: "دسترسی غیرمجاز." };
  }

  try {
    if (data.price !== undefined && data.price < 0) {
      return { success: false, error: "قیمت نمی‌تواند منفی باشد." };
    }
    if (data.inventoryCount !== undefined && (!Number.isInteger(data.inventoryCount) || data.inventoryCount < 0)) {
      return { success: false, error: "موجودی نامعتبر است." };
    }

    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing) {
      return { success: false, error: "محصول یافت نشد." };
    }

    const updateData: { price?: number; inventoryCount?: number; isEnabled?: boolean } = {};
    if (data.price !== undefined) updateData.price = data.price;
    if (data.inventoryCount !== undefined) updateData.inventoryCount = data.inventoryCount;
    if (data.isEnabled !== undefined) updateData.isEnabled = data.isEnabled;

    const updated = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      select: {
        id: true,
        slug: true,
        title: true,
        price: true,
        currency: true,
        inventoryCount: true,
        isEnabled: true,
      },
    });

    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath(`/products/${updated.slug}`);

    logger.info("[Admin:Product] Updated", { productId, updatedBy: user!.id });

    return {
      success: true,
      data: {
        id: updated.id,
        slug: updated.slug,
        title: updated.title,
        price: Number(updated.price),
        currency: updated.currency,
        inventoryCount: updated.inventoryCount,
        isEnabled: updated.isEnabled,
      },
    };
  } catch (error) {
    logger.error("[Admin:Product] Update failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "خطا در به‌روزرسانی محصول." };
  }
}

// ============================================================
// ✅ Create Product
// ============================================================

export interface ProductFormData {
  title: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  sku?: string;
  brandId?: string;
  categorySlug?: string;
  price: number;
  currency: string;
  discountPrice?: number;
  discountEndsAt?: string;
  isNew: boolean;
  isBestSeller: boolean;
  isFastShipping: boolean;
  isTechnoTime: boolean;
  technoTimeEndsAt?: string;
  isUsed: boolean;
  usedCondition?: string;
  usedDescription?: string;
  inventoryCount: number;
  isEnabled: boolean;
  warranty?: string;
  isOriginal: boolean;
  attributes?: Record<string, string>;
  images?: Array<{ url: string; alt?: string }>;
  seoTitle?: string;
  seoDescription?: string;
}

export type CreateProductResult =
  | { success: true; data: { id: string; slug: string; title: string } }
  | { success: false; error: string };

const VALID_USED_CONDITIONS = [
  "NEW",
  "USED_LIKE_NEW",
  "USED_GOOD",
  "USED_FAIR",
  "REFURBISHED",
] as const;

type UsedCondition = (typeof VALID_USED_CONDITIONS)[number];

function parseUsedCondition(value: string | undefined): UsedCondition {
  if (value && (VALID_USED_CONDITIONS as readonly string[]).includes(value)) {
    return value as UsedCondition;
  }
  return "NEW";
}

export async function createProductAction(
  data: ProductFormData
): Promise<CreateProductResult> {
  const user = await getAuthenticatedUser();
  if (!isAdmin(user)) {
    return { success: false, error: "دسترسی غیرمجاز." };
  }

  try {
    if (!data.title || data.title.trim().length < 2) {
      return { success: false, error: "عنوان محصول معتبر نیست." };
    }

    if (!data.slug || data.slug.trim().length < 2) {
      return { success: false, error: "Slug معتبر نیست." };
    }

    if (!/^[a-z0-9-]+$/.test(data.slug)) {
      return { success: false, error: "Slug فقط می‌تواند شامل حروف کوچک انگلیسی، اعداد و خط تیره باشد." };
    }

    if (data.price < 0) {
      return { success: false, error: "قیمت نمی‌تواند منفی باشد." };
    }

    if (data.inventoryCount < 0 || !Number.isInteger(data.inventoryCount)) {
      return { success: false, error: "موجودی نامعتبر است." };
    }

    const existing = await prisma.product.findUnique({
      where: { slug: data.slug },
    });
    if (existing) {
      return { success: false, error: "این slug قبلاً استفاده شده است." };
    }

    const product = await prisma.product.create({
      data: {
        title: data.title.trim(),
        slug: data.slug.trim(),
        shortDescription: data.shortDescription?.trim() || null,
        description: data.description?.trim() || null,
        sku: data.sku?.trim() || null,
        brandId: data.brandId || null,
        categorySlug: data.categorySlug || null,
        price: data.price,
        currency: data.currency || "تومان",
        discountPrice: data.discountPrice ?? null,
        discountEndsAt: data.discountEndsAt ? new Date(data.discountEndsAt) : null,
        isNew: data.isNew,
        isBestSeller: data.isBestSeller,
        isFastShipping: data.isFastShipping,
        isTechnoTime: data.isTechnoTime,
        technoTimeEndsAt: data.technoTimeEndsAt ? new Date(data.technoTimeEndsAt) : null,
        isUsed: data.isUsed,
        usedCondition: parseUsedCondition(data.usedCondition),
        usedDescription: data.usedDescription?.trim() || null,
        inventoryCount: data.inventoryCount,
        isEnabled: data.isEnabled,
        warranty: data.warranty?.trim() || null,
        isOriginal: data.isOriginal,
        attributes: data.attributes || {},
        images: data.images || [],
        seoTitle: data.seoTitle?.trim() || null,
        seoDescription: data.seoDescription?.trim() || null,
        seo: {},
      },
    });

    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath(`/products/${product.slug}`);

    logger.info("[Admin:Product] Created", { productId: product.id, createdBy: user!.id });

    return {
      success: true,
      data: { id: product.id, slug: product.slug, title: product.title },
    };
  } catch (error) {
    logger.error("[Admin:Product] Create failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "خطا در ایجاد محصول." };
  }
}

// ============================================================
// ✅ Get Product By ID (full data for edit form)
// ============================================================

export type GetProductByIdResult =
  | { success: true; data: ProductFormData & { id: string } }
  | { success: false; error: string };

export async function getProductByIdAction(
  productId: string
): Promise<GetProductByIdResult> {
  const user = await getAuthenticatedUser();
  if (!isAdmin(user)) {
    return { success: false, error: "دسترسی غیرمجاز." };
  }

  try {
    const p = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!p) {
      return { success: false, error: "محصول یافت نشد." };
    }

    const images = Array.isArray(p.images)
      ? (p.images as Array<{ url: string; alt?: string }>)
      : [];

    const attributes =
      p.attributes && typeof p.attributes === "object" && !Array.isArray(p.attributes)
        ? (p.attributes as Record<string, string>)
        : {};

    return {
      success: true,
      data: {
        id: p.id,
        title: p.title,
        slug: p.slug,
        shortDescription: p.shortDescription || undefined,
        description: p.description || undefined,
        sku: p.sku || undefined,
        brandId: p.brandId || undefined,
        categorySlug: p.categorySlug || undefined,
        price: Number(p.price),
        currency: p.currency,
        discountPrice: p.discountPrice ? Number(p.discountPrice) : undefined,
        discountEndsAt: p.discountEndsAt ? p.discountEndsAt.toISOString().slice(0, 16) : undefined,
        isNew: p.isNew,
        isBestSeller: p.isBestSeller,
        isFastShipping: p.isFastShipping,
        isTechnoTime: p.isTechnoTime,
        technoTimeEndsAt: p.technoTimeEndsAt ? p.technoTimeEndsAt.toISOString().slice(0, 16) : undefined,
        isUsed: p.isUsed,
        usedCondition: p.usedCondition as string,
        usedDescription: p.usedDescription || undefined,
        inventoryCount: p.inventoryCount,
        isEnabled: p.isEnabled,
        warranty: p.warranty || undefined,
        isOriginal: p.isOriginal,
        attributes,
        images,
        seoTitle: p.seoTitle || undefined,
        seoDescription: p.seoDescription || undefined,
      },
    };
  } catch (error) {
    logger.error("[Admin:Product] GetById failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "خطا در بارگذاری محصول." };
  }
}

// ============================================================
// ✅ Update Full Product
// ============================================================

export type UpdateFullProductResult =
  | { success: true; data: { id: string; slug: string; title: string } }
  | { success: false; error: string };

export async function updateProductFullAction(
  productId: string,
  data: ProductFormData
): Promise<UpdateFullProductResult> {
  const user = await getAuthenticatedUser();
  if (!isAdmin(user)) {
    return { success: false, error: "دسترسی غیرمجاز." };
  }

  try {
    if (!data.title || data.title.trim().length < 2) {
      return { success: false, error: "عنوان محصول معتبر نیست." };
    }

    if (!data.slug || data.slug.trim().length < 2) {
      return { success: false, error: "Slug معتبر نیست." };
    }

    if (!/^[a-z0-9-]+$/.test(data.slug)) {
      return { success: false, error: "Slug فقط می‌تواند شامل حروف کوچک انگلیسی، اعداد و خط تیره باشد." };
    }

    if (data.price < 0) {
      return { success: false, error: "قیمت نمی‌تواند منفی باشد." };
    }

    if (data.inventoryCount < 0 || !Number.isInteger(data.inventoryCount)) {
      return { success: false, error: "موجودی نامعتبر است." };
    }

    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing) {
      return { success: false, error: "محصول یافت نشد." };
    }

    const duplicateSlug = await prisma.product.findUnique({
      where: { slug: data.slug },
    });
    if (duplicateSlug && duplicateSlug.id !== productId) {
      return { success: false, error: "این slug قبلاً استفاده شده است." };
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        title: data.title.trim(),
        slug: data.slug.trim(),
        shortDescription: data.shortDescription?.trim() || null,
        description: data.description?.trim() || null,
        sku: data.sku?.trim() || null,
        brandId: data.brandId || null,
        categorySlug: data.categorySlug || null,
        price: data.price,
        currency: data.currency || "تومان",
        discountPrice: data.discountPrice ?? null,
        discountEndsAt: data.discountEndsAt ? new Date(data.discountEndsAt) : null,
        isNew: data.isNew,
        isBestSeller: data.isBestSeller,
        isFastShipping: data.isFastShipping,
        isTechnoTime: data.isTechnoTime,
        technoTimeEndsAt: data.technoTimeEndsAt ? new Date(data.technoTimeEndsAt) : null,
        isUsed: data.isUsed,
        usedCondition: parseUsedCondition(data.usedCondition),
        usedDescription: data.usedDescription?.trim() || null,
        inventoryCount: data.inventoryCount,
        isEnabled: data.isEnabled,
        warranty: data.warranty?.trim() || null,
        isOriginal: data.isOriginal,
        attributes: data.attributes || {},
        images: data.images || [],
        seoTitle: data.seoTitle?.trim() || null,
        seoDescription: data.seoDescription?.trim() || null,
      },
    });

    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath(`/products/${product.slug}`);

    logger.info("[Admin:Product] Full updated", { productId, updatedBy: user!.id });

    return {
      success: true,
      data: { id: product.id, slug: product.slug, title: product.title },
    };
  } catch (error) {
    logger.error("[Admin:Product] Full update failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "خطا در ویرایش محصول." };
  }
}

// ============================================================
// ✅ Delete Product
// ============================================================

export type DeleteProductResult =
  | { success: true; data: { id: string } }
  | { success: false; error: string };

export async function deleteProductAction(
  productId: string
): Promise<DeleteProductResult> {
  const user = await getAuthenticatedUser();
  if (!isSuperAdmin(user)) {
    return { success: false, error: "فقط مدیر ارشد می‌تواند محصولات را حذف کند." };
  }

  try {
    const existing = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        _count: { select: { orderItems: true, reviews: true } },
      },
    });

    if (!existing) {
      return { success: false, error: "محصول یافت نشد." };
    }

    if (existing._count.orderItems > 0) {
      return {
        success: false,
        error: `این محصول در ${existing._count.orderItems} سفارش استفاده شده و قابل حذف نیست. به جای حذف، آن را غیرفعال کنید.`,
      };
    }

    await prisma.$transaction([
      prisma.review.deleteMany({ where: { productId } }),
      prisma.wishlist.deleteMany({ where: { productId } }),
      prisma.compare.deleteMany({ where: { productId } }),
      prisma.productVariant.deleteMany({ where: { productId } }),
      prisma.product.delete({ where: { id: productId } }),
    ]);

    revalidatePath("/admin/products");
    revalidatePath("/products");

    logger.info("[Admin:Product] Deleted", { productId, deletedBy: user!.id });

    return { success: true, data: { id: productId } };
  } catch (error) {
    logger.error("[Admin:Product] Delete failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "خطا در حذف محصول." };
  }
}

// ============================================================
// ✅ Get Categories for Select (dropdown)
// ============================================================

export interface CategoryOption {
  id: string;
  slug: string;
  title: string;
}

export type GetCategoriesForSelectResult =
  | { success: true; data: CategoryOption[] }
  | { success: false; error: string };

export async function getCategoriesForSelectAction(): Promise<GetCategoriesForSelectResult> {
  const user = await getAuthenticatedUser();
  if (!isAdmin(user)) {
    return { success: false, error: "دسترسی غیرمجاز." };
  }

  try {
    const categories = await prisma.category.findMany({
      where: { visible: true },
      orderBy: { order: "asc" },
      select: { id: true, slug: true, title: true },
    });

    return { success: true, data: categories };
  } catch (error) {
    logger.error("[Admin:Categories] GetForSelect failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "خطا در بارگذاری دسته‌بندی‌ها." };
  }
}

// ============================================================
// ✅ Get Brands for Select (dropdown)
// ============================================================

export interface BrandOption {
  id: string;
  name: string;
}

export type GetBrandsForSelectResult =
  | { success: true; data: BrandOption[] }
  | { success: false; error: string };

export async function getBrandsForSelectAction(): Promise<GetBrandsForSelectResult> {
  const user = await getAuthenticatedUser();
  if (!isAdmin(user)) {
    return { success: false, error: "دسترسی غیرمجاز." };
  }

  try {
    const brands = await prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });

    return { success: true, data: brands };
  } catch (error) {
    logger.error("[Admin:Brands] GetForSelect failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "خطا در بارگذاری برندها." };
  }
}

// ============================================================
// Category Actions
// ============================================================

export type CreateCategoryResult =
  | { success: true; data: { id: string; slug: string; title: string } }
  | { success: false; error: string };

export async function createCategoryAction(data: {
  title: string;
  slug: string;
  description?: string;
  parentId?: string;
  order?: number;
  visible?: boolean;
}): Promise<CreateCategoryResult> {
  const user = await getAuthenticatedUser();
  if (!isAdmin(user)) {
    return { success: false, error: "دسترسی غیرمجاز." };
  }

  try {
    const existing = await prisma.category.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      return { success: false, error: "این slug قبلاً استفاده شده است." };
    }

    const category = await prisma.category.create({
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description || null,
        parentId: data.parentId || null,
        order: data.order || 0,
        visible: data.visible !== undefined ? data.visible : true,
      },
    });

    revalidatePath("/admin/categories");
    revalidatePath("/categories");

    logger.info("[Admin:Category] Created", { categoryId: category.id, createdBy: user!.id });

    return {
      success: true,
      data: {
        id: category.id,
        slug: category.slug,
        title: category.title,
      },
    };
  } catch (error) {
    logger.error("[Admin:Category] Create failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "خطا در ایجاد دسته‌بندی." };
  }
}

export type GetCategoryByIdResult =
  | { success: true; data: { id: string; title: string; slug: string; description: string | null; order: number; visible: boolean } }
  | { success: false; error: string };

export async function getCategoryByIdAction(
  categoryId: string
): Promise<GetCategoryByIdResult> {
  const user = await getAuthenticatedUser();
  if (!isAdmin(user)) {
    return { success: false, error: "دسترسی غیرمجاز." };
  }

  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        order: true,
        visible: true,
      },
    });

    if (!category) {
      return { success: false, error: "دسته‌بندی یافت نشد." };
    }

    return { success: true, data: category };
  } catch (error) {
    logger.error("[Admin:Category] GetById failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "خطا در بارگذاری دسته‌بندی." };
  }
}

export type UpdateCategoryResult =
  | { success: true; data: { id: string; slug: string; title: string } }
  | { success: false; error: string };

export async function updateCategoryAction(
  categoryId: string,
  data: {
    title: string;
    slug: string;
    description?: string;
    order?: number;
    visible?: boolean;
  }
): Promise<UpdateCategoryResult> {
  const user = await getAuthenticatedUser();
  if (!isAdmin(user)) {
    return { success: false, error: "دسترسی غیرمجاز." };
  }

  try {
    const existing = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!existing) {
      return { success: false, error: "دسته‌بندی یافت نشد." };
    }

    const duplicateSlug = await prisma.category.findUnique({
      where: { slug: data.slug },
    });

    if (duplicateSlug && duplicateSlug.id !== categoryId) {
      return { success: false, error: "این slug قبلاً استفاده شده است." };
    }

    const updated = await prisma.category.update({
      where: { id: categoryId },
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description || null,
        order: data.order ?? existing.order,
        visible: data.visible ?? existing.visible,
      },
      select: {
        id: true,
        slug: true,
        title: true,
      },
    });

    revalidatePath("/admin/categories");
    revalidatePath("/categories");
    revalidatePath(`/categories/${updated.slug}`);

    logger.info("[Admin:Category] Updated", {
      categoryId,
      updatedBy: user!.id,
    });

    return { success: true, data: updated };
  } catch (error) {
    logger.error("[Admin:Category] Update failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "خطا در ویرایش دسته‌بندی." };
  }
}

export type DeleteCategoryResult =
  | { success: true; data: { id: string } }
  | { success: false; error: string };

export async function deleteCategoryAction(
  categoryId: string
): Promise<DeleteCategoryResult> {
  const user = await getAuthenticatedUser();
  if (!isSuperAdmin(user)) {
    return { success: false, error: "فقط مدیر ارشد می‌تواند دسته‌بندی‌ها را حذف کند." };
  }

  try {
    const existing = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: { select: { children: true } },
      },
    });

    if (!existing) {
      return { success: false, error: "دسته‌بندی یافت نشد." };
    }

    if (existing._count.children > 0) {
      return {
        success: false,
        error: "این دسته‌بندی زیردسته دارد. ابتدا زیردسته‌ها را حذف یا منتقل کنید.",
      };
    }

    const productCount = await prisma.product.count({
      where: { categorySlug: existing.slug },
    });

    if (productCount > 0) {
      return {
        success: false,
        error: `این دسته‌بندی ${productCount} محصول دارد. ابتدا محصولات را منتقل یا حذف کنید.`,
      };
    }

    await prisma.category.delete({ where: { id: categoryId } });

    revalidatePath("/admin/categories");
    revalidatePath("/categories");

    logger.info("[Admin:Category] Deleted", {
      categoryId,
      deletedBy: user!.id,
    });

    return { success: true, data: { id: categoryId } };
  } catch (error) {
    logger.error("[Admin:Category] Delete failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "خطا در حذف دسته‌بندی." };
  }
}

// ============================================================
// Order Actions
// ============================================================

export type GetAdminOrdersResult =
  | { success: true; data: AdminOrder[] }
  | { success: false; error: string };

export type UpdateOrderStatusResult =
  | { success: true; data: { id: string; status: string } }
  | { success: false; error: string };

const ADMIN_SETTABLE_STATUSES = ["processing", "shipped", "delivered"];

export async function getAdminOrdersAction(): Promise<GetAdminOrdersResult> {
  const user = await getAuthenticatedUser();
  if (!isAdmin(user)) {
    return { success: false, error: "دسترسی غیرمجاز." };
  }

  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        paymentAttempts: true,
      },
    });

    return {
      success: true,
      data: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        userId: o.userId,
        status: o.status,
        totalAmount: Number(o.totalAmount),
        currency: o.currency,
        customerInformation: o.customerInformation,
        address: o.address,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
        items: o.items.map((i) => ({
          id: i.id,
          productId: i.productId,
          title: i.title,
          price: Number(i.price),
          quantity: i.quantity,
        })),
        paymentAttempts: o.paymentAttempts.map((pa) => ({
          id: pa.id,
          transactionId: pa.transactionId,
          status: pa.status,
          amount: Number(pa.amount),
          createdAt: pa.createdAt,
        })),
      })),
    };
  } catch (error) {
    logger.error("[Admin:Orders] Failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "خطا در بارگذاری سفارش‌ها." };
  }
}

export async function updateOrderStatusAction(
  orderId: string,
  status: string
): Promise<UpdateOrderStatusResult> {
  const user = await getAuthenticatedUser();
  if (!isAdmin(user)) {
    return { success: false, error: "دسترسی غیرمجاز." };
  }

  if (!ADMIN_SETTABLE_STATUSES.includes(status)) {
    return { success: false, error: "وضعیت نامعتبر است." };
  }

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return { success: false, error: "سفارش یافت نشد." };
    }

    if (order.status !== "paid" && !ADMIN_SETTABLE_STATUSES.includes(order.status)) {
      return {
        success: false,
        error: "امکان تغییر وضعیت این سفارش وجود ندارد. سفارش باید ابتدا پرداخت شود.",
      };
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      select: { id: true, status: true },
    });

    revalidatePath("/admin/orders");
    revalidatePath("/account/orders");

    logger.info("[Admin:Order] Status updated", { orderId, status, updatedBy: user!.id });

    return { success: true, data: updated };
  } catch (error) {
    logger.error("[Admin:Order] Status update failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "خطا در به‌روزرسانی وضعیت سفارش." };
  }
}

// ============================================================
// Dashboard Stats
// ============================================================

export interface AdminDashboardStats {
  productCount: number;
  disabledProductCount: number;
  lowStockCount: number;
  orderCount: number;
  pendingOrderCount: number;
  paidOrderCount: number;
  shippedOrderCount: number;
  deliveredOrderCount: number;
  totalRevenue: number;
  monthlyRevenue: number;
  userCount: number;
  activeUserCount: number;
  reviewCount: number;
  pendingReviewCount: number;
  couponCount: number;
  activeCouponCount: number;
  repairCount: number;
  pendingRepairCount: number;
}

export interface RecentOrder {
  id: string;
  orderNumber: number;
  status: string;
  totalAmount: number;
  currency: string;
  customerName: string;
  createdAt: Date;
}

export interface RecentUser {
  id: string;
  firstName: string;
  lastName: string;
  mobileNumber: string;
  role: string;
  createdAt: Date;
}

export interface TopProduct {
  id: string;
  slug: string;
  title: string;
  totalSold: number;
  revenue: number;
}

export interface MonthlySales {
  month: string;
  monthLabel: string;
  orderCount: number;
  revenue: number;
}

export type GetAdminDashboardFullResult =
  | {
      success: true;
      data: {
        stats: AdminDashboardStats;
        recentOrders: RecentOrder[];
        recentUsers: RecentUser[];
        topProducts: TopProduct[];
        monthlySales: MonthlySales[];
      };
    }
  | { success: false; error: string };

export async function getAdminDashboardStatsAction(): Promise<GetAdminDashboardFullResult> {
  const user = await getAuthenticatedUser();
  if (!isAdmin(user)) {
    return { success: false, error: "دسترسی غیرمجاز." };
  }

  try {
    async function safeQuery<T>(label: string, p: Promise<T>): Promise<T> {
      try {
        return await p;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[Dashboard] ❌ ${label} failed:`, msg, e);
        throw new Error(`${label}: ${msg}`);
      }
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const PAID_STATUSES = ["paid", "processing", "shipped", "delivered"] as const;

    const batch1 = await Promise.all([
      safeQuery("products.enabled", prisma.product.count({ where: { isEnabled: true } })),
      safeQuery("products.disabled", prisma.product.count({ where: { isEnabled: false } })),
      safeQuery("products.lowStock", prisma.product.count({ where: { inventoryCount: { lte: 5 }, isEnabled: true } })),
      safeQuery("orders.total", prisma.order.count()),
      safeQuery("orders.pending", prisma.order.count({ where: { status: "pending_payment" } })),
      safeQuery("orders.paid", prisma.order.count({ where: { status: "paid" } })),
      safeQuery("orders.shipped", prisma.order.count({ where: { status: "shipped" } })),
      safeQuery("orders.delivered", prisma.order.count({ where: { status: "delivered" } })),
      safeQuery("orders.totalRevenue", prisma.order.aggregate({
        where: { status: { in: [...PAID_STATUSES] } },
        _sum: { totalAmount: true },
      })),
    ]);

    const [
      productCount, disabledProductCount, lowStockCount,
      orderCount, pendingOrderCount, paidOrderCount,
      shippedOrderCount, deliveredOrderCount,
      totalRevenueResult,
    ] = batch1;

    const batch2 = await Promise.all([
      safeQuery("orders.monthlyRevenue", prisma.order.aggregate({
        where: {
          status: { in: [...PAID_STATUSES] },
          createdAt: { gte: startOfMonth },
        },
        _sum: { totalAmount: true },
      })),
      safeQuery("users.total", prisma.user.count()),
      safeQuery("users.active", prisma.user.count({ where: { isActive: true } })),
      safeQuery("reviews.total", prisma.review.count()),
      safeQuery("reviews.pending", prisma.review.count({ where: { isApproved: false } })),
      safeQuery("coupons.total", prisma.coupon.count()),
      safeQuery("coupons.active", prisma.coupon.count({ where: { isActive: true } })),
      safeQuery("repairs.total", prisma.repairRequest.count()),
      safeQuery("repairs.pending", prisma.repairRequest.count({ where: { status: "pending" } })),
    ]);

    const [
      monthlyRevenueResult, userCount, activeUserCount,
      reviewCount, pendingReviewCount, couponCount, activeCouponCount,
      repairCount, pendingRepairCount,
    ] = batch2;

    const batch3 = await Promise.all([
      safeQuery("recentOrders", prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true, orderNumber: true, status: true,
          totalAmount: true, currency: true,
          customerInformation: true, createdAt: true,
        },
      })),
      safeQuery("recentUsers", prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true, firstName: true, lastName: true,
          mobileNumber: true, role: true, createdAt: true,
        },
      })),
      safeQuery("topProducts", prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true, price: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      })),
      safeQuery("monthlyOrders", prisma.order.findMany({
        where: {
          status: { in: [...PAID_STATUSES] },
          createdAt: { gte: sixMonthsAgo },
        },
        select: { totalAmount: true, createdAt: true },
      })),
    ]);

    const [recentOrdersRaw, recentUsersRaw, topProductsRaw, monthlyOrdersRaw] = batch3;

    const topProductIds = topProductsRaw.map((p) => p.productId);
    const topProductsInfo = await safeQuery(
      "topProductsInfo",
      prisma.product.findMany({
        where: { id: { in: topProductIds } },
        select: { id: true, slug: true, title: true },
      })
    );

    const topProducts: TopProduct[] = topProductsRaw.map((p) => {
      const info = topProductsInfo.find((i) => i.id === p.productId);
      return {
        id: p.productId,
        slug: info?.slug || "",
        title: info?.title || "نامشخص",
        totalSold: p._sum.quantity || 0,
        revenue: Number(p._sum.price || 0),
      };
    });

    const monthlySalesMap = new Map<string, { orderCount: number; revenue: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlySalesMap.set(key, { orderCount: 0, revenue: 0 });
    }

    for (const order of monthlyOrdersRaw) {
      const key = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, "0")}`;
      const existing = monthlySalesMap.get(key);
      if (existing) {
        existing.orderCount += 1;
        existing.revenue += Number(order.totalAmount);
      }
    }

    const monthLabels = ["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];
    const monthlySales: MonthlySales[] = Array.from(monthlySalesMap.entries()).map(([key, data]) => {
      const [, monthStr] = key.split("-");
      const monthNum = parseInt(monthStr || "1", 10);
      return {
        month: key,
        monthLabel: monthLabels[monthNum - 1] || key,
        orderCount: data.orderCount,
        revenue: data.revenue,
      };
    });

    function extractCustomerName(jsonStr: string): string {
      try {
        const parsed = JSON.parse(jsonStr) as { firstName?: string; lastName?: string };
        return `${parsed.firstName || ""} ${parsed.lastName || ""}`.trim() || "ناشناس";
      } catch {
        return "ناشناس";
      }
    }

    return {
      success: true,
      data: {
        stats: {
          productCount, disabledProductCount, lowStockCount,
          orderCount, pendingOrderCount, paidOrderCount,
          shippedOrderCount, deliveredOrderCount,
          totalRevenue: Number(totalRevenueResult._sum.totalAmount || 0),
          monthlyRevenue: Number(monthlyRevenueResult._sum.totalAmount || 0),
          userCount, activeUserCount,
          reviewCount, pendingReviewCount,
          couponCount, activeCouponCount,
          repairCount, pendingRepairCount,
        },
        recentOrders: recentOrdersRaw.map((o) => ({
          id: o.id, orderNumber: o.orderNumber, status: o.status,
          totalAmount: Number(o.totalAmount), currency: o.currency,
          customerName: extractCustomerName(o.customerInformation),
          createdAt: o.createdAt,
        })),
        recentUsers: recentUsersRaw,
        topProducts,
        monthlySales,
      },
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Admin:Dashboard] Stats failed:", msg, error);
    return { success: false, error: `خطا در دریافت آمار. جزئیات: ${msg}` };
  }
}

// ============================================================
// User Management Actions
// ============================================================

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  mobileNumber: string;
  email: string | null;
  role: string;
  isActive: boolean;
  loyaltyPoints: number;
  financialTestPassed: boolean;
  createdAt: Date;
  orderCount: number;
}

export type GetAdminUsersResult =
  | { success: true; data: AdminUser[] }
  | { success: false; error: string };

export type UpdateUserRoleResult =
  | { success: true; data: { id: string; role: string } }
  | { success: false; error: string };

export type ToggleUserActiveResult =
  | { success: true; data: { id: string; isActive: boolean } }
  | { success: false; error: string };

export type DeleteUserResult =
  | { success: true; data: { id: string; mode: "deleted" | "deactivated" } }
  | { success: false; error: string };

const VALID_ROLES = ["customer", "staff", "admin", "super_admin"];

export async function getAdminUsersAction(): Promise<GetAdminUsersResult> {
  const user = await getAuthenticatedUser();
  if (!isAdmin(user)) {
    return { success: false, error: "دسترسی غیرمجاز." };
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        mobileNumber: true,
        email: true,
        role: true,
        isActive: true,
        loyaltyPoints: true,
        financialTestPassed: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    });

    return {
      success: true,
      data: users.map((u) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        mobileNumber: u.mobileNumber,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        loyaltyPoints: u.loyaltyPoints,
        financialTestPassed: u.financialTestPassed,
        createdAt: u.createdAt,
        orderCount: u._count.orders,
      })),
    };
  } catch (error) {
    logger.error("[Admin:Users] Failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "خطا در بارگذاری کاربران." };
  }
}

export async function updateUserRoleAction(
  userId: string,
  role: string
): Promise<UpdateUserRoleResult> {
  const currentUser = await getAuthenticatedUser();
  if (!isSuperAdmin(currentUser)) {
    return { success: false, error: "فقط مدیر ارشد می‌تواند نقش کاربران را تغییر دهد." };
  }

  if (!VALID_ROLES.includes(role)) {
    return { success: false, error: "نقش نامعتبر است." };
  }

  try {
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return { success: false, error: "کاربر یافت نشد." };
    }

    if (targetUser.id === currentUser!.id) {
      return { success: false, error: "نمی‌توانید نقش خودتان را تغییر دهید." };
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, role: true },
    });

    logger.info("[Admin:User] Role updated", {
      userId,
      role,
      updatedBy: currentUser!.id,
    });

    revalidatePath("/admin/users");
    return { success: true, data: updated };
  } catch (error) {
    logger.error("[Admin:User] Role update failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "خطا در تغییر نقش کاربر." };
  }
}

export async function toggleUserActiveAction(
  userId: string
): Promise<ToggleUserActiveResult> {
  const currentUser = await getAuthenticatedUser();
  if (!isAdmin(currentUser)) {
    return { success: false, error: "دسترسی غیرمجاز." };
  }

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true, role: true },
    });

    if (!targetUser) {
      return { success: false, error: "کاربر یافت نشد." };
    }

    if (targetUser.id === currentUser!.id) {
      return { success: false, error: "نمی‌توانید حساب خودتان را غیرفعال کنید." };
    }

    if (
      (targetUser.role === "admin" || targetUser.role === "super_admin") &&
      !isSuperAdmin(currentUser)
    ) {
      return { success: false, error: "فقط مدیر ارشد می‌تواند مدیران را غیرفعال کند." };
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive: !targetUser.isActive },
      select: { id: true, isActive: true },
    });

    logger.info("[Admin:User] Active status toggled", {
      userId,
      isActive: updated.isActive,
      updatedBy: currentUser!.id,
    });

    revalidatePath("/admin/users");
    return { success: true, data: updated };
  } catch (error) {
    logger.error("[Admin:User] Toggle active failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "خطا در تغییر وضعیت کاربر." };
  }
}

export async function deleteUserAction(
  userId: string,
  mode: "soft" | "hard" = "soft"
): Promise<DeleteUserResult> {
  const currentUser = await getAuthenticatedUser();
  if (!isSuperAdmin(currentUser)) {
    return { success: false, error: "فقط مدیر ارشد می‌تواند کاربران را حذف کند." };
  }

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, _count: { select: { orders: true } } },
    });

    if (!targetUser) {
      return { success: false, error: "کاربر یافت نشد." };
    }

    if (targetUser.id === currentUser!.id) {
      return { success: false, error: "نمی‌توانید حساب خودتان را حذف کنید." };
    }

    if (
      (targetUser.role === "admin" || targetUser.role === "super_admin") &&
      !isSuperAdmin(currentUser)
    ) {
      return { success: false, error: "فقط مدیر ارشد می‌تواند مدیران را حذف کند." };
    }

    if (mode === "soft") {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
        select: { id: true },
      });

      logger.info("[Admin:User] Soft deleted", { userId, deletedBy: currentUser!.id });
      revalidatePath("/admin/users");
      return { success: true, data: { id: updated.id, mode: "deactivated" } };
    }

    if (mode === "hard") {
      if (targetUser._count.orders > 0) {
        return {
          success: false,
          error: "این کاربر سفارش دارد و قابل حذف کامل نیست. به جای حذف، غیرفعالش کنید.",
        };
      }

      await prisma.$transaction([
        prisma.session.deleteMany({ where: { userId } }),
        prisma.address.deleteMany({ where: { userId } }),
        prisma.wishlist.deleteMany({ where: { userId } }),
        prisma.compare.deleteMany({ where: { userId } }),
        prisma.notification.deleteMany({ where: { userId } }),
        prisma.review.deleteMany({ where: { userId } }),
        prisma.user.delete({ where: { id: userId } }),
      ]);

      logger.info("[Admin:User] Hard deleted", { userId, deletedBy: currentUser!.id });
      revalidatePath("/admin/users");
      return { success: true, data: { id: userId, mode: "deleted" } };
    }

    return { success: false, error: "حالت حذف نامعتبر است." };
  } catch (error) {
    logger.error("[Admin:User] Delete failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "خطا در حذف کاربر." };
  }
}

// ============================================================
// Site Settings Actions
// ============================================================

export type GetAllSettingsResult =
  | { success: true; data: Record<string, boolean> }
  | { success: false; error: string };

export type UpdateSettingResult =
  | { success: true; data: { key: string; value: boolean } }
  | { success: false; error: string };

export async function getAllSettingsAction(): Promise<GetAllSettingsResult> {
  const user = await getAuthenticatedUser();
  if (!isAdmin(user)) {
    return { success: false, error: "دسترسی غیرمجاز." };
  }

  try {
    const settings = await prisma.siteSetting.findMany();
    const result: Record<string, boolean> = {};

    for (const setting of settings) {
      const value = setting.value;
      if (typeof value === "boolean") {
        result[setting.key] = value;
      } else if (typeof value === "string") {
        result[setting.key] = value === "true";
      } else {
        result[setting.key] = false;
      }
    }

    return { success: true, data: result };
  } catch (error) {
    logger.error("[Admin:Settings] GetAll failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "خطا در بارگذاری تنظیمات." };
  }
}

export async function updateSettingAction(
  key: string,
  value: boolean
): Promise<UpdateSettingResult> {
  const user = await getAuthenticatedUser();
  if (!isAdmin(user)) {
    return { success: false, error: "دسترسی غیرمجاز." };
  }

  if (!key || typeof key !== "string") {
    return { success: false, error: "کلید نامعتبر است." };
  }

  try {
    await prisma.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    logger.info("[Admin:Setting] Updated", {
      key,
      value,
      updatedBy: user!.id,
    });

    revalidatePath("/", "layout");

    return { success: true, data: { key, value } };
  } catch (error) {
    logger.error("[Admin:Setting] Update failed", {
      key,
      value,
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "خطا در ذخیره تنظیمات." };
  }
}

// ============================================================
// Coupon Management Actions
// ============================================================

export interface AdminCoupon {
  id: string;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  minimumOrder: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  perUserLimit: number | null;
  expiresAt: Date | null;
  isActive: boolean;
  isAutoApplied: boolean;
  createdAt: Date;
}

export type GetAdminCouponsResult =
  | { success: true; data: AdminCoupon[] }
  | { success: false; error: string };

export type CreateCouponResult =
  | { success: true; data: AdminCoupon }
  | { success: false; error: string };

export type UpdateCouponResult =
  | { success: true; data: AdminCoupon }
  | { success: false; error: string };

export type DeleteCouponResult =
  | { success: true; data: { id: string } }
  | { success: false; error: string };

export type ToggleCouponResult =
  | { success: true; data: { id: string; isActive: boolean } }
  | { success: false; error: string };

const VALID_DISCOUNT_TYPES = ["percentage", "fixed"];

function mapCouponToAdmin(c: {
  id: string;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: { toString(): string };
  minimumOrder: { toString(): string } | null;
  maxDiscount: { toString(): string } | null;
  usageLimit: number | null;
  usedCount: number;
  perUserLimit: number | null;
  expiresAt: Date | null;
  isActive: boolean;
  isAutoApplied: boolean;
  createdAt: Date;
}): AdminCoupon {
  return {
    id: c.id,
    code: c.code,
    description: c.description,
    discountType: c.discountType,
    discountValue: Number(c.discountValue),
    minimumOrder: c.minimumOrder ? Number(c.minimumOrder) : null,
    maxDiscount: c.maxDiscount ? Number(c.maxDiscount) : null,
    usageLimit: c.usageLimit,
    usedCount: c.usedCount,
    perUserLimit: c.perUserLimit,
    expiresAt: c.expiresAt,
    isActive: c.isActive,
    isAutoApplied: c.isAutoApplied,
    createdAt: c.createdAt,
  };
}

export async function getAdminCouponsAction(): Promise<GetAdminCouponsResult> {
  const user = await getAuthenticatedUser();
  if (!isAdmin(user)) {
    return { success: false, error: "دسترسی غیرمجاز." };
  }

  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: coupons.map(mapCouponToAdmin),
    };
  } catch (error) {
    logger.error("[Admin:Coupons] Failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "خطا در بارگذاری کوپن‌ها." };
  }
}

export async function createCouponAction(data: {
  code: string;
  description?: string;
  discountType: string;
  discountValue: number;
  minimumOrder?: number;
  maxDiscount?: number;
  usageLimit?: number;
  perUserLimit?: number;
  expiresAt?: string;
  isActive?: boolean;
  isAutoApplied?: boolean;
}): Promise<CreateCouponResult> {
  const user = await getAuthenticatedUser();
  if (!isAdmin(user)) {
    return { success: false, error: "دسترسی غیرمجاز." };
  }

  try {
    const code = data.code.trim().toUpperCase();
    if (!code || code.length < 3) {
      return { success: false, error: "کد کوپن باید حداقل ۳ کاراکتر باشد." };
    }

    if (!VALID_DISCOUNT_TYPES.includes(data.discountType)) {
      return { success: false, error: "نوع تخفیف نامعتبر است." };
    }

    if (data.discountValue <= 0) {
      return { success: false, error: "مقدار تخفیف باید بیشتر از صفر باشد." };
    }

    if (data.discountType === "percentage" && data.discountValue > 100) {
      return { success: false, error: "درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد." };
    }

    const existing = await prisma.coupon.findUnique({ where: { code } });
    if (existing) {
      return { success: false, error: "این کد کوپن قبلاً استفاده شده است." };
    }

    const coupon = await prisma.coupon.create({
      data: {
        code,
        description: data.description || null,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minimumOrder: data.minimumOrder ?? null,
        maxDiscount: data.maxDiscount ?? null,
        usageLimit: data.usageLimit ?? null,
        perUserLimit: data.perUserLimit ?? null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        isActive: data.isActive ?? true,
        isAutoApplied: data.isAutoApplied ?? false,
      },
    });

    logger.info("[Admin:Coupon] Created", { couponId: coupon.id, code, createdBy: user!.id });
    revalidatePath("/admin/coupons");
    return { success: true, data: mapCouponToAdmin(coupon) };
  } catch (error) {
    logger.error("[Admin:Coupon] Create failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "خطا در ایجاد کوپن." };
  }
}

export async function updateCouponAction(
  couponId: string,
  data: {
    description?: string;
    discountType?: string;
    discountValue?: number;
    minimumOrder?: number | null;
    maxDiscount?: number | null;
    usageLimit?: number | null;
    perUserLimit?: number | null;
    expiresAt?: string | null;
    isActive?: boolean;
    isAutoApplied?: boolean;
  }
): Promise<UpdateCouponResult> {
  const user = await getAuthenticatedUser();
  if (!isAdmin(user)) {
    return { success: false, error: "دسترسی غیرمجاز." };
  }

  try {
    const existing = await prisma.coupon.findUnique({ where: { id: couponId } });
    if (!existing) {
      return { success: false, error: "کوپن یافت نشد." };
    }

    if (data.discountType && !VALID_DISCOUNT_TYPES.includes(data.discountType)) {
      return { success: false, error: "نوع تخفیف نامعتبر است." };
    }

    if (data.discountValue !== undefined && data.discountValue <= 0) {
      return { success: false, error: "مقدار تخفیف باید بیشتر از صفر باشد." };
    }

    const updateData: Record<string, unknown> = {};
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.discountType !== undefined) updateData.discountType = data.discountType;
    if (data.discountValue !== undefined) updateData.discountValue = data.discountValue;
    if (data.minimumOrder !== undefined) updateData.minimumOrder = data.minimumOrder;
    if (data.maxDiscount !== undefined) updateData.maxDiscount = data.maxDiscount;
    if (data.usageLimit !== undefined) updateData.usageLimit = data.usageLimit;
    if (data.perUserLimit !== undefined) updateData.perUserLimit = data.perUserLimit;
    if (data.expiresAt !== undefined) {
      updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    }
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.isAutoApplied !== undefined) updateData.isAutoApplied = data.isAutoApplied;

    const updated = await prisma.coupon.update({
      where: { id: couponId },
      data: updateData,
    });

    logger.info("[Admin:Coupon] Updated", { couponId, updatedBy: user!.id });
    revalidatePath("/admin/coupons");
    return { success: true, data: mapCouponToAdmin(updated) };
  } catch (error) {
    logger.error("[Admin:Coupon] Update failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "خطا در به‌روزرسانی کوپن." };
  }
}

export async function deleteCouponAction(
  couponId: string
): Promise<DeleteCouponResult> {
  const user = await getAuthenticatedUser();
  if (!isSuperAdmin(user)) {
    return { success: false, error: "فقط مدیر ارشد می‌تواند کوپن‌ها را حذف کند." };
  }

  try {
    const existing = await prisma.coupon.findUnique({ where: { id: couponId } });
    if (!existing) {
      return { success: false, error: "کوپن یافت نشد." };
    }

    await prisma.coupon.delete({ where: { id: couponId } });

    logger.info("[Admin:Coupon] Deleted", { couponId, deletedBy: user!.id });
    revalidatePath("/admin/coupons");
    return { success: true, data: { id: couponId } };
  } catch (error) {
    logger.error("[Admin:Coupon] Delete failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "خطا در حذف کوپن." };
  }
}

export async function toggleCouponActiveAction(
  couponId: string
): Promise<ToggleCouponResult> {
  const user = await getAuthenticatedUser();
  if (!isAdmin(user)) {
    return { success: false, error: "دسترسی غیرمجاز." };
  }

  try {
    const existing = await prisma.coupon.findUnique({ where: { id: couponId } });
    if (!existing) {
      return { success: false, error: "کوپن یافت نشد." };
    }

    const updated = await prisma.coupon.update({
      where: { id: couponId },
      data: { isActive: !existing.isActive },
      select: { id: true, isActive: true },
    });

    logger.info("[Admin:Coupon] Toggled", {
      couponId,
      isActive: updated.isActive,
      updatedBy: user!.id,
    });
    revalidatePath("/admin/coupons");
    return { success: true, data: updated };
  } catch (error) {
    logger.error("[Admin:Coupon] Toggle failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "خطا در تغییر وضعیت کوپن." };
  }
}

// ============================================================
// Review Management Actions
// ============================================================

export interface AdminReview {
  id: string;
  productId: string;
  productTitle: string;
  productSlug: string;
  userId: string;
  userFirstName: string;
  userLastName: string;
  userMobile: string;
  rating: number;
  title: string | null;
  content: string | null;
  isApproved: boolean;
  adminReply: string | null;
  adminReplyAt: Date | null;
  createdAt: Date;
}

export type GetAdminReviewsResult =
  | { success: true; data: AdminReview[] }
  | { success: false; error: string };

export type ApproveReviewResult =
  | { success: true; data: { id: string; isApproved: boolean } }
  | { success: false; error: string };

export type DeleteReviewResult =
  | { success: true; data: { id: string } }
  | { success: false; error: string };

export type ReplyToReviewResult =
  | { success: true; data: { id: string; adminReply: string; adminReplyAt: Date } }
  | { success: false; error: string };

export async function getAdminReviewsAction(): Promise<GetAdminReviewsResult> {
  const user = await getAuthenticatedUser();
  if (!isAdmin(user)) {
    return { success: false, error: "دسترسی غیرمجاز." };
  }

  try {
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { title: true, slug: true } },
        user: { select: { firstName: true, lastName: true, mobileNumber: true } },
      },
    });

    return {
      success: true,
      data: reviews.map((r) => ({
        id: r.id,
        productId: r.productId,
        productTitle: r.product.title,
        productSlug: r.product.slug,
        userId: r.userId,
        userFirstName: r.user.firstName,
        userLastName: r.user.lastName,
        userMobile: r.user.mobileNumber,
        rating: r.rating,
        title: r.title,
        content: r.content,
        isApproved: r.isApproved,
        adminReply: r.adminReply,
        adminReplyAt: r.adminReplyAt,
        createdAt: r.createdAt,
      })),
    };
  } catch (error) {
    logger.error("[Admin:Reviews] Failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "خطا در بارگذاری نظرات." };
  }
}

export async function approveReviewAction(
  reviewId: string
): Promise<ApproveReviewResult> {
  const user = await getAuthenticatedUser();
  if (!isAdmin(user)) {
    return { success: false, error: "دسترسی غیرمجاز." };
  }

  try {
    const existing = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!existing) {
      return { success: false, error: "نظر یافت نشد." };
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: { isApproved: !existing.isApproved },
      select: { id: true, isApproved: true },
    });

    logger.info("[Admin:Review] Approval toggled", {
      reviewId,
      isApproved: updated.isApproved,
      updatedBy: user!.id,
    });

    revalidatePath("/admin/reviews");
    revalidatePath(`/products/${existing.productId}`);
    return { success: true, data: updated };
  } catch (error) {
    logger.error("[Admin:Review] Approve failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "خطا در تأیید نظر." };
  }
}

export async function deleteReviewAction(
  reviewId: string
): Promise<DeleteReviewResult> {
  const user = await getAuthenticatedUser();
  if (!isSuperAdmin(user)) {
    return { success: false, error: "فقط مدیر ارشد می‌تواند نظرات را حذف کند." };
  }

  try {
    const existing = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!existing) {
      return { success: false, error: "نظر یافت نشد." };
    }

    await prisma.review.delete({ where: { id: reviewId } });

    logger.info("[Admin:Review] Deleted", { reviewId, deletedBy: user!.id });
    revalidatePath("/admin/reviews");
    return { success: true, data: { id: reviewId } };
  } catch (error) {
    logger.error("[Admin:Review] Delete failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "خطا در حذف نظر." };
  }
}

export async function replyToReviewAction(
  reviewId: string,
  replyText: string
): Promise<ReplyToReviewResult> {
  const user = await getAuthenticatedUser();
  if (!isAdmin(user)) {
    return { success: false, error: "دسترسی غیرمجاز." };
  }

  const trimmed = replyText.trim();
  if (!trimmed || trimmed.length < 2) {
    return { success: false, error: "متن پاسخ باید حداقل ۲ کاراکتر باشد." };
  }

  if (trimmed.length > 2000) {
    return { success: false, error: "متن پاسخ نمی‌تواند بیشتر از ۲۰۰۰ کاراکتر باشد." };
  }

  try {
    const existing = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!existing) {
      return { success: false, error: "نظر یافت نشد." };
    }

    const now = new Date();
    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: {
        adminReply: trimmed,
        adminReplyAt: now,
        adminReplyById: user!.id,
      },
      select: {
        id: true,
        adminReply: true,
        adminReplyAt: true,
      },
    });

    logger.info("[Admin:Review] Admin replied", {
      reviewId,
      adminId: user!.id,
    });

    revalidatePath("/admin/reviews");
    revalidatePath(`/products/${existing.productId}`);

    return {
      success: true,
      data: {
        id: updated.id,
        adminReply: updated.adminReply || "",
        adminReplyAt: updated.adminReplyAt || now,
      },
    };
  } catch (error) {
    logger.error("[Admin:Review] Reply failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "خطا در ثبت پاسخ." };
  }
}

export type DeleteReplyResult =
  | { success: true; data: { id: string } }
  | { success: false; error: string };

export async function deleteReviewReplyAction(
  reviewId: string
): Promise<DeleteReplyResult> {
  const user = await getAuthenticatedUser();
  if (!isAdmin(user)) {
    return { success: false, error: "دسترسی غیرمجاز." };
  }

  try {
    const existing = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!existing) {
      return { success: false, error: "نظر یافت نشد." };
    }

    await prisma.review.update({
      where: { id: reviewId },
      data: {
        adminReply: null,
        adminReplyAt: null,
        adminReplyById: null,
      },
    });

    logger.info("[Admin:Review] Reply deleted", {
      reviewId,
      adminId: user!.id,
    });

    revalidatePath("/admin/reviews");
    revalidatePath(`/products/${existing.productId}`);

    return { success: true, data: { id: reviewId } };
  } catch (error) {
    logger.error("[Admin:Review] Delete reply failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "خطا در حذف پاسخ." };
  }
}