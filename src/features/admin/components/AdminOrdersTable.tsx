"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";
import {
  updateOrderStatusAction,
  type AdminOrder,
} from "@/lib/server/admin-actions";
import {
  orderStatusLabel,
  orderStatusVariant,
  ORDER_STATUS_LABELS,
} from "@/features/orders/status-labels";
import { toPersianDigits } from "@/utils/text-utils";

const ADMIN_SETTABLE_STATUSES = ["processing", "shipped", "delivered"] as const;

function parseCustomerName(customerInformationJson: string): string {
  try {
    const info = JSON.parse(customerInformationJson);
    return [info.firstName, info.lastName].filter(Boolean).join(" ") || "—";
  } catch {
    return "—";
  }
}

function parseCustomerPhone(customerInformationJson: string): string {
  try {
    const info = JSON.parse(customerInformationJson);
    return info.mobileNumber || info.phone || "—";
  } catch {
    return "—";
  }
}

interface AdminOrdersTableProps {
  initialOrders: AdminOrder[];
}

export function AdminOrdersTable({ initialOrders }: AdminOrdersTableProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ✅ جستجو و فیلتر
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ✅ فیلتر و مرتب‌سازی
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((o) => {
        const customerName = parseCustomerName(o.customerInformation).toLowerCase();
        const phone = parseCustomerPhone(o.customerInformation).toLowerCase();
        const orderNum = String(o.orderNumber);
        return (
          customerName.includes(q) ||
          phone.includes(q) ||
          orderNum.includes(q) ||
          o.status.toLowerCase().includes(q)
        );
      });
    }

    if (statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter);
    }

    if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === "amount-desc") {
      result.sort((a, b) => b.totalAmount - a.totalAmount);
    } else if (sortBy === "amount-asc") {
      result.sort((a, b) => a.totalAmount - b.totalAmount);
    } else if (sortBy === "orderNumber") {
      result.sort((a, b) => b.orderNumber - a.orderNumber);
    }

    return result;
  }, [orders, searchQuery, statusFilter, sortBy]);

  // ✅ آمار
  const stats = useMemo(() => {
    const total = orders.length;
    const paid = orders.filter((o) => o.status === "paid").length;
    const shipped = orders.filter((o) => o.status === "shipped").length;
    const delivered = orders.filter((o) => o.status === "delivered").length;
    const totalRevenue = orders
      .filter((o) => ["paid", "processing", "shipped", "delivered"].includes(o.status))
      .reduce((sum, o) => sum + o.totalAmount, 0);
    return { total, paid, shipped, delivered, totalRevenue };
  }, [orders]);

  async function handleStatusChange(order: AdminOrder, nextStatus: string) {
    setSavingId(order.id);
    setErrors((current) => ({ ...current, [order.id]: "" }));

    const result = await updateOrderStatusAction(order.id, nextStatus);

    if (!result.success) {
      setErrors((current) => ({
        ...current,
        [order.id]: result.error || "به‌روزرسانی با خطا مواجه شد.",
      }));
      setSavingId(null);
      return;
    }

    setOrders((current) =>
      current.map((o) => (o.id === order.id ? { ...o, status: result.data.status } : o))
    );
    setSavingId(null);
  }

  function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  if (orders.length === 0) {
    return (
      <Card>
        <p className="text-body-sm text-text-secondary text-center py-lg">
          هیچ سفارشی یافت نشد.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-md">
      {/* ✅ کارت‌های آمار */}
      <div className="grid grid-cols-2 gap-sm sm:grid-cols-4">
        <Card className="p-3">
          <p className="text-caption text-text-secondary">کل سفارش‌ها</p>
          <p className="text-h5 font-bold text-text-primary fa-num">
            {toPersianDigits(stats.total)}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-caption text-text-secondary">در انتظار ارسال</p>
          <p className="text-h5 font-bold text-blue-500 fa-num">
            {toPersianDigits(stats.paid)}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-caption text-text-secondary">ارسال‌شده</p>
          <p className="text-h5 font-bold text-success fa-num">
            {toPersianDigits(stats.shipped)}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-caption text-text-secondary">درآمد کل</p>
          <p className="text-h5 font-bold text-brand-600 fa-num">
            {toPersianDigits(stats.totalRevenue.toLocaleString("en-US"))}
          </p>
        </Card>
      </div>

      {/* ✅ نوار جستجو و فیلتر */}
      <Card className="flex flex-col gap-sm p-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Input
            placeholder="🔍 جستجو در شماره سفارش، نام مشتری، موبایل..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-sm sm:w-auto">
          <div className="flex-1 sm:w-44">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">همه‌ی وضعیت‌ها</option>
              <option value="draft">پیش‌نویس</option>
              <option value="pending_payment">در انتظار پرداخت</option>
              <option value="paid">پرداخت‌شده</option>
              <option value="processing">در حال پردازش</option>
              <option value="shipped">ارسال‌شده</option>
              <option value="delivered">تحویل‌شده</option>
              <option value="cancelled">لغو‌شده</option>
              <option value="payment_failed">پرداخت ناموفق</option>
            </Select>
          </div>
          <div className="flex-1 sm:w-44">
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">جدیدترین</option>
              <option value="oldest">قدیمی‌ترین</option>
              <option value="amount-desc">مبلغ: زیاد → کم</option>
              <option value="amount-asc">مبلغ: کم → زیاد</option>
              <option value="orderNumber">شماره سفارش</option>
            </Select>
          </div>
        </div>
      </Card>

      <p className="text-body-sm text-text-secondary">
        {toPersianDigits(filteredOrders.length)} سفارش نمایش داده می‌شود
        {filteredOrders.length !== orders.length && (
          <span className="text-text-muted">
            {" "}
            (از {toPersianDigits(orders.length)} سفارش)
          </span>
        )}
      </p>

      {filteredOrders.length === 0 ? (
        <Card>
          <p className="text-body-sm text-text-secondary text-center py-lg">
            سفارشی با این فیلترها یافت نشد.
          </p>
        </Card>
      ) : (
        filteredOrders.map((order) => {
          const canAdvance =
            order.status === "paid" ||
            (ADMIN_SETTABLE_STATUSES as readonly string[]).includes(order.status);
          const isExpanded = expandedId === order.id;

          return (
            <Card key={order.id} className="flex flex-col gap-sm">
              <div className="flex flex-wrap items-center justify-between gap-sm">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/account/orders/${order.id}`}
                    target="_blank"
                    className="font-medium text-text-primary hover:text-brand-600 transition-colors fa-num"
                  >
                    سفارش #{toPersianDigits(order.orderNumber)}
                  </Link>
                  <p className="text-caption text-text-secondary">
                    {parseCustomerName(order.customerInformation)}
                    {" — "}
                    <span className="fa-num" dir="ltr">
                      {parseCustomerPhone(order.customerInformation)}
                    </span>
                  </p>
                  <p className="text-caption text-text-muted mt-1">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <Badge variant={orderStatusVariant(order.status)}>
                  {orderStatusLabel(order.status)}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-sm text-body-sm border-t border-border/50 pt-2">
                <span className="text-text-secondary">
                  {toPersianDigits(order.items.length)} قلم — مبلغ کل:{" "}
                  <span className="font-medium text-text-primary fa-num">
                    {toPersianDigits(order.totalAmount.toLocaleString("en-US"))} {order.currency}
                  </span>
                </span>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                >
                  {isExpanded ? "▲ بستن" : "▼ جزئیات"}
                </Button>
              </div>

              {/* ✅ بخش جزئیات (باز شده) */}
              {isExpanded && (
                <div className="flex flex-col gap-sm p-3 rounded-lg bg-muted/30 border border-border/50">
                  {/* آدرس */}
                  {order.address && (
                    <div>
                      <p className="text-caption font-medium text-text-secondary mb-1">
                        📍 آدرس تحویل:
                      </p>
                      <p className="text-body-sm text-text-primary">{order.address}</p>
                    </div>
                  )}

                  {/* اقلام سفارش */}
                  {order.items.length > 0 && (
                    <div>
                      <p className="text-caption font-medium text-text-secondary mb-2">
                        📦 اقلام سفارش:
                      </p>
                      <div className="space-y-1">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between text-caption bg-background p-2 rounded"
                          >
                            <Link
                              href={`/products/${item.productId}`}
                              target="_blank"
                              className="flex-1 truncate hover:text-brand-600"
                            >
                              {item.title}
                            </Link>
                            <span className="text-text-secondary ms-2">
                              × {toPersianDigits(item.quantity)}
                            </span>
                            <span className="font-medium text-text-primary ms-2 fa-num">
                              {toPersianDigits((item.price * item.quantity).toLocaleString("en-US"))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* تلاش‌های پرداخت */}
                  {order.paymentAttempts.length > 0 && (
                    <div>
                      <p className="text-caption font-medium text-text-secondary mb-2">
                        💳 تلاش‌های پرداخت:
                      </p>
                      {order.paymentAttempts.map((attempt) => (
                        <div
                          key={attempt.id}
                          className="flex items-center justify-between text-caption bg-background p-2 rounded mb-1"
                        >
                          <span className="font-mono text-xs" dir="ltr">
                            {attempt.transactionId || "—"}
                          </span>
                          <span className="text-text-secondary">{attempt.status}</span>
                          <span className="fa-num">
                            {toPersianDigits(attempt.amount.toLocaleString("en-US"))}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* تغییر وضعیت */}
                  {canAdvance && (
                    <div className="pt-2 border-t border-border/50">
                      <p className="text-caption font-medium text-text-secondary mb-2">
                        🔄 تغییر وضعیت:
                      </p>
                      <Select
                        aria-label="تغییر وضعیت سفارش"
                        className="w-full sm:w-64"
                        value={
                          (ADMIN_SETTABLE_STATUSES as readonly string[]).includes(order.status)
                            ? order.status
                            : ""
                        }
                        disabled={savingId === order.id}
                        onChange={(e) => e.target.value && handleStatusChange(order, e.target.value)}
                      >
                        <option value="" disabled>
                          {order.status === "paid" ? "انتخاب وضعیت ارسال..." : "تغییر وضعیت"}
                        </option>
                        {ADMIN_SETTABLE_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {ORDER_STATUS_LABELS[status]}
                          </option>
                        ))}
                      </Select>
                    </div>
                  )}
                </div>
              )}

              {errors[order.id] && <FormMessage variant="error">{errors[order.id]}</FormMessage>}
            </Card>
          );
        })
      )}
    </div>
  );
}