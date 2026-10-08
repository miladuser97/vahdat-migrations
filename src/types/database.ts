import { z } from "zod";

/**
 * Database Domain Models
 * These represent the authoritative structure of data in the backend.
 */

export const DbUserSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  mobileNumber: z.string(),
  email: z.string().email().optional(),
  role: z.enum(["customer", "staff", "admin", "super_admin"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const DbProductSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  price: z.number().nonnegative(),
  currency: z.string().default("تومان"),
  inventoryCount: z.number().int().nonnegative(),
  isEnabled: z.boolean().default(true),
});

// ✅ اصلاح P1: جایگزینی z.any() با schema واقعی
export const OrderCustomerInformationSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  mobileNumber: z.string(),
  email: z.string().email().optional(),
});

export const OrderAddressSchema = z.object({
  province: z.string(),
  city: z.string(),
  streetAddress: z.string(),
  postalCode: z.string().optional(),
  additionalDescription: z.string().optional(),
});

export const DbOrderSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().optional(),
  status: z.enum(["draft", "pending_payment", "paid", "processing", "shipped", "delivered", "cancelled", "failed"]),
  totalAmount: z.number().nonnegative(),
  customerInformation: OrderCustomerInformationSchema,
  address: OrderAddressSchema,
  createdAt: z.string().datetime(),
});

export type DbUser = z.infer<typeof DbUserSchema>;
export type DbProduct = z.infer<typeof DbProductSchema>;
export type DbOrder = z.infer<typeof DbOrderSchema>;
export type OrderCustomerInformation = z.infer<typeof OrderCustomerInformationSchema>;
export type OrderAddress = z.infer<typeof OrderAddressSchema>;