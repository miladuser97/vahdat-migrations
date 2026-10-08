import { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Price } from "@/features/products/components/Price";
import { getOrderAction } from "@/lib/server/commerce-actions";
import { orderStatusLabel, orderStatusVariant } from "@/features/orders/status-labels";
import { OrderDetailActions } from "@/features/account/components/OrderDetailActions";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "جزئیات سفارش",
};

const PAID_ONWARD_STATUSES = ["paid", "processing", "shipped", "delivered"];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" });
}

function safeParseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * Order Detail Page
 *
 * Phase 6: new route. Uses getOrderAction (commerce-actions.ts, Phase
 * 2 — unmodified), which already enforces ownership and returns the
 * identical "Access denied." response whether the order doesn't exist
 * or belongs to someone else — this page deliberately shows the same
 * generic "not found" message for both cases too, rather than trying
 * to distinguish them, so it doesn't leak anything getOrderAction's
 * own design already avoids leaking.
 *
 * Explicitly whitelists which fields get displayed: paymentAuthority,
 * idempotencyKey, the legacy paymentInfo field, and raw
 * paymentAttempts (which include provider transaction ids) are never
 * read from the fetched order into anything rendered here — only
 * order id/number/status/total/currency/date/items/address, plus a
 * simple derived paid/unpaid indicator.
 */
export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  const result = await getOrderAction(id);

  // Phase 8.1: narrow on `result.success` alone — see the identical
  // fix and explanation in account/orders/page.tsx. This page's
  // failure branch doesn't read `result.error` today, but the
  // subsequent unconditional `result.order` access below relies on
  // TypeScript having proven `result.success` is true past this
  // point, which the old `!result.success || !result.order` compound
  // condition did not reliably do.
  if (!result.success) {
    return (
      <Card>
        <p className="text-body-sm text-text-secondary">
          سفارش مورد نظر یافت نشد یا شما اجازه‌ی مشاهده‌ی آن را ندارید.
        </p>
      </Card>
    );
  }

  const order = result.order;
  const customerInfo = safeParseJson<{ firstName?: string; lastName?: string; mobileNumber?: string }>(
    order.customerInformation,
    {}
  );
  const address = safeParseJson<{
    province?: string;
    city?: string;
    streetAddress?: string;
    postalCode?: string;
    additionalDescription?: string;
  }>(order.address, {});

  const isPaid = PAID_ONWARD_STATUSES.includes(order.status);

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <div>
          <h2 className="text-h4 font-bold text-text-primary">
            سفارش #{order.orderNumber.toLocaleString("fa-IR")}
          </h2>
          <p className="text-body-sm text-text-secondary">{formatDate(order.createdAt.toISOString())}</p>
        </div>
        <Badge variant={orderStatusVariant(order.status)}>{orderStatusLabel(order.status)}</Badge>
      </div>

      <Card className="flex flex-col gap-xs">
        <span className="text-caption text-text-secondary">وضعیت پرداخت</span>
        <span className={`font-medium ${isPaid ? "text-success" : "text-text-primary"}`}>
          {isPaid ? "پرداخت‌شده" : order.status === "payment_failed" ? "پرداخت ناموفق" : "پرداخت نشده"}
        </span>
      </Card>

      <OrderDetailActions orderId={order.id} status={order.status} />

      <Card className="flex flex-col gap-md">
        <h3 className="text-h5 font-bold text-text-primary border-b border-border pb-xs">اقلام سفارش</h3>
        <div className="flex flex-col gap-sm">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-md border-b border-border py-xs last:border-0">
              <div className="min-w-0">
                <p className="truncate text-body-sm font-medium text-text-primary">{item.title}</p>
                <p className="text-caption text-text-secondary">{item.quantity.toLocaleString("fa-IR")} عدد</p>
              </div>
              <Price price={Number(item.price) * item.quantity} currency={order.currency} />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-border pt-sm">
          <span className="font-medium text-text-primary">مبلغ کل</span>
          <Price price={Number(order.totalAmount)} currency={order.currency} />
        </div>
      </Card>

      <div className="grid gap-md sm:grid-cols-2">
        <Card className="flex flex-col gap-xs">
          <h3 className="text-h5 font-bold text-text-primary border-b border-border pb-xs mb-xs">گیرنده</h3>
          <p className="text-body-sm text-text-primary">
            {customerInfo.firstName} {customerInfo.lastName}
          </p>
          <p className="text-body-sm text-text-secondary" dir="ltr">
            {customerInfo.mobileNumber}
          </p>
        </Card>
        <Card className="flex flex-col gap-xs">
          <h3 className="text-h5 font-bold text-text-primary border-b border-border pb-xs mb-xs">آدرس تحویل</h3>
          <p className="text-body-sm text-text-primary">
            {address.province}، {address.city}، {address.streetAddress}
          </p>
          {address.postalCode && <p className="text-caption text-text-secondary">کد پستی: {address.postalCode}</p>}
        </Card>
      </div>
    </div>
  );
}