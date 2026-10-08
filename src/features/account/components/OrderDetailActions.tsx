"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";
import { cancelOrderAction } from "@/lib/server/commerce-actions";
import { initiatePaymentForOrder } from "@/features/checkout/services/checkout-submission";

const CANCELLABLE_STATUSES = ["draft", "pending_payment"];
const PAYABLE_STATUSES = ["pending_payment", "payment_failed"];

/**
 * OrderDetailActions
 *
 * Phase 6: both actions here reuse existing, unmodified Phase 2 logic
 * rather than reimplementing anything —
 * `cancelOrderAction` (commerce-actions.ts) already does ownership +
 * status-guarded cancellation + inventory restoration; `initiatePaymentForOrder`
 * (features/checkout/services/checkout-submission.ts) is the exact
 * function the checkout page itself uses to start a real ZarinPal
 * payment and get a redirect URL. This component adds no new payment
 * or cancellation logic of its own — it only decides when to show
 * these buttons and where to send the customer next.
 */
export function OrderDetailActions({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"cancel" | "pay" | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);

  const canCancel = CANCELLABLE_STATUSES.includes(status);
  const canPay = PAYABLE_STATUSES.includes(status);

  if (!canCancel && !canPay) return null;

  async function handleCancel() {
    if (!window.confirm("از لغو این سفارش مطمئن هستید؟")) return;
    setBusy("cancel");
    setError(undefined);

    const result = await cancelOrderAction(orderId);

    if (!result.success) {
      setBusy(null);
      setError(result.error || "لغو سفارش با خطا مواجه شد.");
      return;
    }

    router.refresh();
  }

  async function handlePay() {
    setBusy("pay");
    setError(undefined);

    const result = await initiatePaymentForOrder(orderId);

    if (!result.success) {
      setBusy(null);
      setError(result.error || "اتصال به درگاه پرداخت با خطا مواجه شد.");
      return;
    }

    window.location.href = result.paymentUrl;
  }

  return (
    <div className="flex flex-col gap-sm">
      <div className="flex flex-wrap gap-sm">
        {canPay && (
          <Button variant="default" disabled={busy !== null} onClick={handlePay}>
            {busy === "pay" ? "در حال اتصال به درگاه..." : "تکمیل پرداخت"}
          </Button>
        )}
        {canCancel && (
          <Button variant="outline" disabled={busy !== null} onClick={handleCancel}>
            {busy === "cancel" ? "در حال لغو..." : "لغو سفارش"}
          </Button>
        )}
      </div>
      {error && <FormMessage variant="error">{error}</FormMessage>}
    </div>
  );
}
