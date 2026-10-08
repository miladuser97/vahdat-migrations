"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { HelperText } from "@/components/ui/HelperText";
import { useCheckout } from "@/features/checkout/CheckoutProvider";

/**
 * Payment methods offered at checkout.
 */
// ✅ اصلاح P0: استفاده از ثابت به جای PAYMENT_METHODS[0]
const ONLINE_PAYMENT_METHOD = {
  id: "online-payment",
  label: "پرداخت آنلاین (درگاه زرین‌پال)",
} as const;

export function PaymentSection() {
  const { paymentMethod, setPaymentMethod } = useCheckout();

  useEffect(() => {
    if (paymentMethod !== ONLINE_PAYMENT_METHOD.id) {
      setPaymentMethod(ONLINE_PAYMENT_METHOD.id);
    }
  }, [paymentMethod, setPaymentMethod]);

  return (
    <Card className="flex flex-col gap-md">
      <h2 className="text-h4 font-semibold text-text-primary">پرداخت</h2>

      <div className="flex items-center gap-sm rounded-md border border-border p-md">
        <span className="h-4 w-4 rounded-full border-2 border-primary bg-primary" aria-hidden="true" />
        <span className="text-body text-text-primary">{ONLINE_PAYMENT_METHOD.label}</span>
      </div>

      <HelperText>
        پس از ثبت نهایی سفارش، به درگاه پرداخت امن زرین‌پال منتقل می‌شوید. مبلغ پرداخت همواره توسط
        سرور و بر اساس اقلام سبد خرید شما محاسبه می‌شود.
      </HelperText>
    </Card>
  );
}