import type { ComponentType } from "react";
import { z } from "zod";
import { SeoMetadataSchema } from "../products/schema";

// ============================================================
// Category Schema — کامل با فیلدهای جدید
// ============================================================

const BaseCategorySchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string().optional(),
  parentId: z.string().optional(),

  // ✅ فیلدهای جدید
  icon: z.string().optional(),
  color: z.string().optional(),
  showInSlider: z.boolean().optional(),

  image: z.string().optional(),
  order: z.number().optional(),
  visible: z.boolean().optional(),
  seo: SeoMetadataSchema.optional(),
});

type CategoryType = z.infer<typeof BaseCategorySchema> & {
  children?: CategoryType[];
  iconComponent?: ComponentType;
};

export const CategorySchema: z.ZodType<CategoryType> = BaseCategorySchema.extend({
  children: z.lazy(() => z.array(CategorySchema).optional()),
  iconComponent: z.custom<ComponentType>().optional(),
});

export type Category = z.infer<typeof CategorySchema>;