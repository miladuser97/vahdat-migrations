import { ValidatedCheckoutState } from "../validation";
import { createOrderAction, startPaymentAction } from "@/lib/server/commerce-actions";
import type { CartItem } from "@/features/cart/types";

const SHIPPING_COSTS: Record<string, number> = {
  "standard-post": 35000,
  "express-post": 65000,
  "courier": 120000,
  "local-delivery": 50000,
  "store-pickup": 0,
  "free-shipping": 0,
};

// ✅ اصلاح P1: discriminated union
export type SubmissionResult =
  | { success: true; orderId: string; error?: never }
  | { success: false; orderId?: never; error: string };

export type CheckoutPaymentResult =
  | { success: true; orderId: string; paymentUrl: string; orderCreated: true; error?: never }
  | { success: false; orderId?: string; paymentUrl?: never; orderCreated?: boolean; error: string };

export async function submitOrder(
  state: ValidatedCheckoutState,
  items: CartItem[],
  idempotencyKey?: string,
  couponCode?: string
): Promise<SubmissionResult> {
  try {
    const shippingCost = state.shippingMethod ? (SHIPPING_COSTS[state.shippingMethod] || 0) : 0;

    const cartItems = items.map((item) => ({
      productId: item.productId || item.id,
      quantity: item.quantity,
      title: item.title
    }));

    const result = await createOrderAction(
      {
        customerInformation: state.customerInformation,
        address: state.address,
        shippingMethod: state.shippingMethod,
        shippingCost: shippingCost,
        couponCode: couponCode,
        idempotencyKey
      },
      cartItems
    );

    if (result.success) {
      return { success: true, orderId: result.orderId };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error: unknown) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "ثبت سفارش با خطا مواجه شد." 
    };
  }
}

export async function initiatePaymentForOrder(orderId: string): Promise<CheckoutPaymentResult> {
  try {
    const result = await startPaymentAction(orderId);
    if (!result.success) {
      return { success: false, orderId, orderCreated: true, error: result.error || "اتصال به درگاه پرداخت با خطا مواجه شد." };
    }
    return { success: true, orderId, paymentUrl: result.paymentUrl, orderCreated: true };
  } catch (error: unknown) {
    return {
      success: false,
      orderId,
      orderCreated: true,
      error: error instanceof Error ? error.message : "اتصال به درگاه پرداخت با خطا مواجه شد.",
    };
  }
}

export async function submitOrderAndPay(
  state: ValidatedCheckoutState,
  items: CartItem[],
  idempotencyKey: string,
  couponCode?: string
): Promise<CheckoutPaymentResult> {
  const orderResult = await submitOrder(state, items, idempotencyKey, couponCode);

  if (!orderResult.success) {
    return { success: false, orderCreated: false, error: orderResult.error };
  }

  return initiatePaymentForOrder(orderResult.orderId);
}