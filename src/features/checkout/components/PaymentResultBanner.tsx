"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { useCart } from "@/features/cart/CartProvider";

/**
 * PaymentResultBanner
 *
 * Phase 2 (Payment Hardening): the ZarinPal callback route
 * (src/app/api/payment/callback/route.ts) redirects the browser back
 * here with a `payment` status after verification. Previously nothing
 * read these query params at all — a customer landing back on
 * /checkout after paying (or failing/cancelling/hitting an invalid
 * order state) saw no acknowledgement of what happened.
 *
 * This never claims success on its own — it only reflects the status
 * the server-verified callback already decided and put in the URL.
 */
export function PaymentResultBanner() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const payment = searchParams.get("payment");
  const orderId = searchParams.get("orderId");
  const message = searchParams.get("message");

  // The cart is only cleared once the server-verified callback confirms
  // success — not at redirect time — so a cancelled/failed payment
  // leaves the cart intact for the customer to try again.
  useEffect(() => {
    if (payment === "success") {
      clearCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payment]);

  if (!payment) return null;

  const content = {
    success: {
      style: "border-success/30 bg-success/5 text-success",
      title: "پرداخت با موفقیت انجام شد",
      body: "سفارش شما ثبت و پرداخت آن تایید شد.",
    },
    failed: {
      style: "border-error/30 bg-error/5 text-error",
      title: "پرداخت ناموفق بود",
      body: message || "تراکنش توسط بانک یا درگاه پرداخت تایید نشد. می‌توانید دوباره تلاش کنید.",
    },
    cancelled: {
      style: "border-warning/30 bg-warning/5 text-warning",
      title: "پرداخت لغو شد",
      body: "شما پرداخت را در درگاه بانکی لغو کردید. سفارش شما پرداخت نشده باقی مانده است.",
    },
    invalid_state: {
      style: "border-error/30 bg-error/5 text-error",
      title: "این سفارش دیگر قابل پرداخت نیست",
      body: message || "سفارش لغو شده یا منقضی شده است. در صورت کسر وجه از حساب شما، با پشتیبانی تماس بگیرید.",
    },
    invalid: {
      style: "border-error/30 bg-error/5 text-error",
      title: "درخواست نامعتبر",
      body: "اطلاعات بازگشت از درگاه پرداخت ناقص بود.",
    },
  }[payment];

  if (!content) return null;

  return (
    <Card className={`mb-md flex flex-col gap-xs ${content.style}`}>
      <h2 className="text-h5 font-bold">{content.title}</h2>
      <p className="text-body-sm">{content.body}</p>
      {orderId && <p className="text-caption opacity-80">شماره پیگیری سفارش: {orderId}</p>}
    </Card>
  );
}
