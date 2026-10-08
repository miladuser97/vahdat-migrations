"use client";

import { useMemo, useState } from "react";
import { Order } from "@/features/orders/types";
import { Card } from "@/components/ui/Card";
import { Price } from "@/features/products/components/Price";
import { Button } from "@/components/ui/Button";
import { CartItem } from "@/features/cart/types";
import { submitOrderAndPay, initiatePaymentForOrder } from "@/features/checkout/services/checkout-submission";
import type { ValidatedCheckoutState } from "@/features/checkout/validation";

interface ReviewConfirmationProps {
  order: Order;
  onBack: () => void;
}

/**
 * ReviewConfirmation
 *
 * Displays the final assembled order for review, then — on
 * confirmation — actually creates the order via the authoritative
 * server action and starts a real ZarinPal payment, redirecting the
 * browser to the gateway.
 *
 * Phase 2 (Payment Hardening): previously this component's final
 * button was hardcoded `disabled` and no order or payment was ever
 * created from here — `submitOrder`/`startPaymentAction` had no
 * caller anywhere in the app. That has been fixed: this is now the
 * one place the real commerce/payment flow is triggered from the UI.
 * 
 * ✅ اصلاح شده: نمایش قیمت‌ها به صورت Server-authoritative
 */
export function ReviewConfirmation({ order, onBack }: ReviewConfirmationProps) {
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  // Generated once per review session so a retry after a transient
  // failure (network error, gateway timeout) reuses the same key —
  // createOrderAction's idempotency check then returns the existing
  // order instead of creating a duplicate one for the same items.
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);

  const validatedState: ValidatedCheckoutState = {
    customerInformation: order.customerInformation,
    address: order.address,
    shippingMethod: order.shippingMethod,
    paymentMethod: order.paymentMethod,
  };

  const goToGateway = (paymentUrl: string) => {
    window.location.href = paymentUrl;
  };

  const handleConfirm = async () => {
    setStatus("submitting");
    setError(null);

    const result = createdOrderId
      ? await initiatePaymentForOrder(createdOrderId)
      : await submitOrderAndPay(validatedState, order.items, idempotencyKey);

    if (result.success && result.paymentUrl) {
      goToGateway(result.paymentUrl);
      return;
    }

    if (result.orderId) setCreatedOrderId(result.orderId);
    setStatus("error");
    setError(result.error || "خطایی در ثبت سفارش یا اتصال به درگاه پرداخت رخ داد.");
  };

  // ============================================================
  // ✅ محاسبه مجموع قیمت از آیتم‌ها
  // ============================================================
  const subtotal = useMemo(() => {
    return order.items.reduce((total, item) => {
      return total + (item.price || 0) * item.quantity;
    }, 0);
  }, [order.items]);

  return (
    <div className="flex flex-col gap-lg">
      <Card className="flex flex-col gap-md border-primary/20 bg-primary/5">
        <h2 className="text-h4 font-bold text-text-primary">مرور و تأیید نهایی</h2>
        <p className="text-body-sm text-text-secondary">
          لطفاً اطلاعات زیر را بررسی کنید. با تأیید نهایی، سفارش شما ثبت شده و به درگاه پرداخت زرین‌پال منتقل می‌شوید.
        </p>
        <div className="text-sm text-text-secondary bg-white/50 p-3 rounded-lg">
          <p>⚠️ قیمت‌ها از دیتابیس محاسبه شده‌اند و در صورت تغییر، به‌روزرسانی می‌شوند.</p>
        </div>
      </Card>

      <div className="grid gap-lg lg:grid-cols-2">
        <Card className="flex flex-col gap-md">
          <h3 className="text-h5 font-bold text-text-primary border-b border-border pb-xs">اطلاعات تحویل</h3>
          <div>
            <p className="text-caption text-text-secondary">گیرنده</p>
            <p className="text-body-sm font-medium">
              {order.customerInformation.firstName} {order.customerInformation.lastName}
            </p>
            <p className="text-body-sm text-text-secondary">{order.customerInformation.mobileNumber}</p>
          </div>
          <div>
            <p className="text-caption text-text-secondary">آدرس</p>
            <p className="text-body-sm">
              {order.address.province}، {order.address.city}، {order.address.streetAddress}
            </p>
          </div>
        </Card>

        <Card className="flex flex-col gap-md">
          <h3 className="text-h5 font-bold text-text-primary border-b border-border pb-xs">انتخاب‌ها</h3>
          <div>
            <p className="text-caption text-text-secondary">روش ارسال</p>
            <p className="text-body-sm font-medium">{order.shippingMethod || "نامشخص"}</p>
          </div>
          <div>
            <p className="text-caption text-text-secondary">روش پرداخت</p>
            <p className="text-body-sm font-medium">پرداخت آنلاین (درگاه زرین‌پال)</p>
          </div>
        </Card>
      </div>

      <Card className="flex flex-col gap-md">
        <h3 className="text-h5 font-bold text-text-primary border-b border-border pb-xs">اقلام سفارش</h3>
        <div className="flex flex-col gap-sm">
          {order.items.map((item: CartItem) => (
            <div key={item.id} className="flex justify-between items-center gap-md py-xs border-b border-border last:border-0">
              <div className="min-w-0">
                <p className="text-body-sm font-medium truncate">{item.title}</p>
                <p className="text-caption text-text-secondary">{item.quantity} عدد</p>
              </div>
              <Price price={(item.price || 0) * item.quantity} currency={item.currency} />
            </div>
          ))}
        </div>

        {/* ============================================================ */}
        {/* ✅ نمایش جمع کل */}
        {/* ============================================================ */}
        <div className="flex justify-between items-center border-t border-border pt-md mt-md">
          <span className="text-body font-medium text-text-primary">جمع کل</span>
          <Price price={subtotal} currency="تومان" />
        </div>
      </Card>

      {status === "error" && error && (
        <Card className="border-error/30 bg-error/5">
          <p className="text-body-sm text-error">{error}</p>
          {createdOrderId && (
            <p className="text-caption text-text-secondary mt-xs">
              سفارش شما ثبت شده است؛ می‌توانید دوباره برای اتصال به درگاه پرداخت تلاش کنید.
            </p>
          )}
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-md">
        <Button variant="outline" onClick={onBack} className="flex-1" disabled={status === "submitting"}>
          ویرایش اطلاعات
        </Button>
        <Button
          variant="default"
          className="flex-1"
          onClick={handleConfirm}
          disabled={status === "submitting"}
        >
          {status === "submitting"
            ? "در حال اتصال به درگاه پرداخت..."
            : createdOrderId
              ? "تلاش مجدد برای پرداخت"
              : "ثبت نهایی و پرداخت"}
        </Button>
      </div>

      <p className="text-center text-caption text-text-secondary">
        مبلغ نهایی پرداخت توسط سرور و بر اساس اقلام واقعی سفارش شما محاسبه می‌شود.
      </p>
    </div>
  );
}