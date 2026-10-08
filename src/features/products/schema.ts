import { z } from "zod";

export const ProductDimensionsSchema = z.object({
  length: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  unit: z.enum(["cm", "mm"]).optional(),
});

export const StockStatusSchema = z.enum([
  "in_stock",
  "low_stock",
  "out_of_stock",
  "coming_soon",
  "discontinued",
]);

export const ImageRefSchema = z.object({
  url: z.string(),
  alt: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export const SeoMetadataSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  canonical: z.string().optional(),
  ogImage: z.string().optional(),
  ogType: z.string().optional(),
});

export const ProductSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  sku: z.string().optional(),
  brand: z.string().optional(),
  brandId: z.string().optional(),
  category: z.string().optional(),
  categorySlug: z.string().optional(),
  images: z.array(ImageRefSchema).optional(),
  thumbnail: ImageRefSchema.optional(),
  price: z.number().optional(),
  discountPrice: z.number().optional(),
  currency: z.string().optional(),
  stockStatus: StockStatusSchema.optional(),
  availability: z.string().optional(),
  attributes: z.record(z.string(), z.string()).optional(),
  tags: z.array(z.string()).optional(),
  weight: z.number().optional(),
  dimensions: ProductDimensionsSchema.optional(),
  // ✅ فیلدهای اضافه‌شده
  rating: z.number().optional(),
  reviewCount: z.number().optional(),
  inventoryCount: z.number().optional(),
  isEnabled: z.boolean().optional(),
  // ✅ فیلدهای Product Flags
  isNew: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  isFastShipping: z.boolean().optional(),
  isTechnoTime: z.boolean().optional(),
  technoTimeEndsAt: z.string().optional(),
  discountEndsAt: z.string().optional(),
  // ✅ فیلدهای محصول دست دوم
  isUsed: z.boolean().optional(),
  usedCondition: z.enum([
    "NEW",
    "USED_LIKE_NEW",
    "USED_GOOD",
    "USED_FAIR",
    "REFURBISHED",
  ]).optional(),
  usedDescription: z.string().optional(),
  // ✅ فیلدهای گارانتی و اصالت
  warranty: z.string().optional(),
  isOriginal: z.boolean().optional(),
  // ✅ فیلدهای SEO اختصاصی
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  // ✅ فیلدهای باقی‌مانده
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  seo: SeoMetadataSchema.optional(),
});

export type Product = z.infer<typeof ProductSchema>;
export type StockStatus = z.infer<typeof StockStatusSchema>;