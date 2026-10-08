import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Price } from "@/features/products/components/Price";
import { orderStatusLabel, orderStatusVariant } from "@/features/orders/status-labels";

export interface OrderSummary {
  id: string;
  orderNumber: number;
  status: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
  itemCount: number;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" });
}

/**
 * OrdersList
 *
 * Phase 6: replaces the permanent "هنوز هیچ سفارشی ثبت نکرده‌اید" empty
 * state with real order data (getUserOrdersAction, unchanged from
 * Phase 2 — this component only shapes/displays what that action
 * already returns and already ownership-scopes to the current user).
 * No client interactivity here by design — actions (cancel, resume
 * payment) live on the order detail page, keeping this list a plain,
 * fast Server Component.
 */
export function OrdersList({ orders }: { orders: OrderSummary[] }) {
  return (
    <div className="flex flex-col gap-md">
      {orders.map((order) => (
        <Link key={order.id} href={`/account/orders/${order.id}`} className="block">
          <Card className="flex flex-col gap-sm transition-colors hover:bg-muted">
            <div className="flex flex-wrap items-center justify-between gap-sm">
              <span className="font-medium text-text-primary">
                سفارش #{order.orderNumber.toLocaleString("fa-IR")}
              </span>
              <Badge variant={orderStatusVariant(order.status)}>{orderStatusLabel(order.status)}</Badge>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-sm">
              <span className="text-body-sm text-text-secondary">
                {formatDate(order.createdAt)} — {order.itemCount.toLocaleString("fa-IR")} قلم
              </span>
              <Price price={order.totalAmount} currency={order.currency} />
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
