import { z } from "zod";

/**
 * Cart Item Schema
 */
export const CartItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  title: z.string(),
  slug: z.string(),
  quantity: z.number().int().min(1),
  price: z.number().optional(),
  currency: z.string().optional(),
});
