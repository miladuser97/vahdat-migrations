import { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/shared/EmptyState";
import { buttonVariants } from "@/components/ui/button-variants";
import { getUserOrdersAction } from "@/lib/server/commerce-actions";
import { OrdersList } from "@/features/account/components/OrdersList";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "تاریخچه سفارش‌ها",
};

/**
 * Orders History Page
 *
 * Phase 6: replaces the permanent empty-state placeholder with real
 * data from getUserOrdersAction (commerce-actions.ts, Phase 2 — not
 * modified this phase). Only fields needed for the summary list are
 * extracted here; the full raw order (which includes paymentAuthority)
 * never reaches a Client Component.
 */
export default async function OrdersHistoryPage() {
  const result = await getUserOrdersAction();

  // Phase 8.1: narrow on the discriminant (`result.success`) alone.
  // The previous `!result.success || !result.orders` compound
  // condition is exactly the class of bug Phase 8 was meant to
  // eliminate — `!result.orders` gives TypeScript a second, unrelated
  // reason to enter this branch, so it can no longer prove `result`
  // is the failure member here, and `result.error` (failure-only)
  // becomes unreachable to the type checker. `orders` is guaranteed
  // present on the success branch of GetUserOrdersResult, so the
  // second condition was redundant at the type level as well as
  // unsafe.
  if (!result.success) {
    return (
      <Card>
        <p className="text-body-sm text-error">{result.error || "بارگذاری سفارش‌ها با خطا مواجه شد."}</p>
      </Card>
    );
  }

  if (result.orders.length === 0) {
    return (
      <div>
        <h2 className="text-h4 font-bold text-text-primary mb-lg">سفارش‌ها</h2>
        <EmptyState
          title="هنوز هیچ سفارشی ثبت نکرده‌اید"
          description="پس از ثبت اولین سفارش، می‌توانید وضعیت آن را اینجا پیگیری کنید."
          action={
            <Link href="/products" className={buttonVariants({ variant: "default", size: "md" })}>
              مشاهده‌ی محصولات
            </Link>
          }
        />
      </div>
    );
  }

  const orders = result.orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    totalAmount: Number(order.totalAmount),
    currency: order.currency,
    createdAt: order.createdAt.toISOString(),
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
  }));

  return (
    <div>
      <h2 className="text-h4 font-bold text-text-primary mb-lg">سفارش‌ها</h2>
      <OrdersList orders={orders} />
    </div>
  );
}