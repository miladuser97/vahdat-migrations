import { z } from "zod";

export const PaymentMethodSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  enabled: z.boolean(),
  icon: z.string().optional(),
});

export const ShippingMethodSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  price: z.number().optional(),
  enabled: z.boolean(),
  estimatedDelivery: z.string().optional(),
});

export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
export type ShippingMethod = z.infer<typeof ShippingMethodSchema>;
