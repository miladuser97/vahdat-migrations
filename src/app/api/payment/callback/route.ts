import { NextRequest, NextResponse } from "next/server";
import { handlePaymentCallbackAction } from "@/lib/server/commerce-actions";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");
  const authority = searchParams.get("Authority");
  const status = searchParams.get("Status");

  if (!orderId || !authority) {
    return NextResponse.redirect(new URL("/checkout?payment=invalid", request.url));
  }

  if (status !== "OK") {
    return NextResponse.redirect(new URL(`/checkout?payment=cancelled&orderId=${encodeURIComponent(orderId)}`, request.url));
  }

  const result = await handlePaymentCallbackAction({ orderId, token: authority });
  const destination = new URL("/checkout", request.url);

  // Phase 8.1: restructured to narrow on `result.success` alone
  // first, with no data field combined into the same boolean
  // expression — Vercel's real build proved that a compound condition
  // combining the discriminant with a second field
  // (`!result.success || !result.orders`, elsewhere in this codebase)
  // can defeat TypeScript's narrowing even where it looks safe by
  // inspection. `result.code` is intentionally still read without
  // narrowing below, since it exists on both members of
  // PaymentCallbackResult by design (see commerce-actions.ts) — that
  // one is genuinely safe, not just assumed to be.
  if (!result.success) {
    destination.searchParams.set(
      "payment",
      result.code === "ORDER_NOT_PAYABLE" || result.code === "ORDER_NOT_PAYABLE_FUNDS_CAPTURED" ? "invalid_state" : "failed",
    );
    destination.searchParams.set("orderId", orderId);
    destination.searchParams.set("message", result.error);
    return NextResponse.redirect(destination);
  }

  destination.searchParams.set("payment", "success");
  destination.searchParams.set("orderId", orderId);
  return NextResponse.redirect(destination);
}
