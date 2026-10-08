import { z } from "zod";
import type { CartItem } from "@/features/cart/types";

/**
 * Mirrors CustomerInformationSection's fields exactly (Phase 24) —
 * first/last name and mobile required, email optional, same as that
 * section's `FormField required` usage.
 */
export interface OrderCustomerInformation {
  firstName: string;
  lastName: string;
  mobileNumber: string;
  email?: string;
}

/**
 * Mirrors AddressSection's fields exactly (Phase 27) — province, city,
 * and street address required, postal code and additional description
 * optional, same as that section's `FormField required` usage.
 */
export interface OrderAddress {
  province: string;
  city: string;
  streetAddress: string;
  postalCode?: string;
  additionalDescription?: string;
}

export const OrderAddressSchema = z.object({
  province: z.string(),
  city: z.string(),
  streetAddress: z.string(),
  postalCode: z.string().optional(),
  additionalDescription: z.string().optional(),
});

export type OrderStatus =
  | "draft"
  | "pending_payment"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "failed";

export interface OrderPaymentInfo {
  methodId: string;
  status: "pending" | "completed" | "failed" | "refunded";
  transactionId?: string;
  amount: number;
  currency: string;
}

/**
 * Order
 * A shared, reusable shape for what a future checkout submission would
 * eventually produce.
 */
export interface Order {
  id?: string;
  status?: OrderStatus;
  customerInformation: OrderCustomerInformation;
  address: OrderAddress;
  shippingMethod: string;
  paymentMethod: string;
  paymentInfo?: OrderPaymentInfo;
  items: CartItem[]; 
  subtotal?: number;
  shipping?: number;
  discount?: number;
  total?: number;
  createdAt?: string;
  updatedAt?: string;
}
