/**
 * Order status → Persian label + visual variant, for order status
 * display across both the customer account area and the admin area.
 *
 * Originally (Phase 6) this lived only in the account feature, with
 * AdminOrdersTable.tsx keeping its own identical inline copy — Phase 6
 * deliberately left that duplication in place since consolidating it
 * meant editing the Admin-domain file, out of scope at the time. Phase
 * 7 (a cross-cutting hardening/cleanup phase with no such domain
 * restriction) consolidated them: AdminOrdersTable.tsx now imports
 * from here too, so there is exactly one status-label map in the
 * project, not two that could silently drift apart.
 */

export type OrderStatusVariant = "success" | "warning" | "error" | "info" | "muted";

export const ORDER_STATUS_LABELS: Record<string, string> = {
  draft: "پیش‌نویس",
  pending_payment: "در انتظار پرداخت",
  payment_failed: "پرداخت ناموفق",
  paid: "پرداخت‌شده",
  processing: "در حال آماده‌سازی",
  shipped: "ارسال‌شده",
  delivered: "تحویل داده‌شده",
  cancelled: "لغوشده",
  expired: "منقضی‌شده",
};

export const ORDER_STATUS_VARIANTS: Record<string, OrderStatusVariant> = {
  paid: "success",
  processing: "info",
  shipped: "info",
  delivered: "success",
  pending_payment: "warning",
  payment_failed: "error",
  cancelled: "muted",
  expired: "muted",
  draft: "muted",
};

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status] || status;
}

export function orderStatusVariant(status: string): OrderStatusVariant {
  return ORDER_STATUS_VARIANTS[status] || "muted";
}
