"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { FormMessage } from "@/components/ui/FormMessage";
import {
  approveReviewAction,
  deleteReviewAction,
  replyToReviewAction,
  deleteReviewReplyAction,
  type AdminReview,
} from "@/lib/server/admin-actions";
import { toPersianDigits } from "@/utils/text-utils";

interface AdminReviewsTableProps {
  initialReviews: AdminReview[];
  currentUserRole: string;
}

export function AdminReviewsTable({
  initialReviews,
  currentUserRole,
}: AdminReviewsTableProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [error, setError] = useState<string | undefined>(undefined);
  const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined);
  const [busyId, setBusyId] = useState<string | null>(null);

  // ✅ state برای پاسخ ادمین
  const [replyOpenId, setReplyOpenId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>("");

  const isSuperAdmin = currentUserRole === "super_admin";

  const filteredReviews = reviews.filter((r) => {
    const matchesSearch =
      searchQuery === "" ||
      r.productTitle.includes(searchQuery) ||
      r.userFirstName.includes(searchQuery) ||
      r.userLastName.includes(searchQuery) ||
      (r.content && r.content.includes(searchQuery)) ||
      (r.adminReply && r.adminReply.includes(searchQuery));

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "approved" && r.isApproved) ||
      (statusFilter === "pending" && !r.isApproved);

    return matchesSearch && matchesStatus;
  });

  async function handleApprove(reviewId: string) {
    setError(undefined);
    setSuccessMessage(undefined);
    setBusyId(reviewId);

    const result = await approveReviewAction(reviewId);

    if (!result.success) {
      setError(result.error || "خطا در تأیید نظر.");
      setBusyId(null);
      return;
    }

    setReviews((current) =>
      current.map((r) =>
        r.id === reviewId ? { ...r, isApproved: result.data.isApproved } : r
      )
    );
    setSuccessMessage(result.data.isApproved ? "نظر تأیید شد." : "تأیید نظر لغو شد.");
    setBusyId(null);
  }

  async function handleDelete(reviewId: string) {
    if (!window.confirm("آیا از حذف این نظر مطمئن هستید؟")) return;

    setError(undefined);
    setSuccessMessage(undefined);
    setBusyId(reviewId);

    const result = await deleteReviewAction(reviewId);

    if (!result.success) {
      setError(result.error || "خطا در حذف نظر.");
      setBusyId(null);
      return;
    }

    setReviews((current) => current.filter((r) => r.id !== reviewId));
    setSuccessMessage("نظر حذف شد.");
    setBusyId(null);
  }

  // ✅ باز کردن فرم پاسخ
  function openReplyForm(review: AdminReview) {
    setReplyOpenId(review.id);
    setReplyText(review.adminReply || "");
    setError(undefined);
    setSuccessMessage(undefined);
  }

  // ✅ لغو پاسخ
  function cancelReply() {
    setReplyOpenId(null);
    setReplyText("");
    setError(undefined);
  }

  // ✅ ثبت پاسخ
  async function handleReply(reviewId: string) {
    setError(undefined);
    setSuccessMessage(undefined);
    setBusyId(reviewId);

    const result = await replyToReviewAction(reviewId, replyText);

    if (!result.success) {
      setError(result.error || "خطا در ثبت پاسخ.");
      setBusyId(null);
      return;
    }

    setReviews((current) =>
      current.map((r) =>
        r.id === reviewId
          ? { ...r, adminReply: result.data.adminReply, adminReplyAt: result.data.adminReplyAt }
          : r
      )
    );
    setSuccessMessage("پاسخ با موفقیت ثبت شد.");
    setReplyOpenId(null);
    setReplyText("");
    setBusyId(null);
  }

  // ✅ حذف پاسخ
  async function handleDeleteReply(reviewId: string) {
    if (!window.confirm("آیا از حذف این پاسخ مطمئن هستید؟")) return;

    setError(undefined);
    setSuccessMessage(undefined);
    setBusyId(reviewId);

    const result = await deleteReviewReplyAction(reviewId);

    if (!result.success) {
      setError(result.error || "خطا در حذف پاسخ.");
      setBusyId(null);
      return;
    }

    setReviews((current) =>
      current.map((r) =>
        r.id === reviewId
          ? { ...r, adminReply: null, adminReplyAt: null }
          : r
      )
    );
    setSuccessMessage("پاسخ حذف شد.");
    setBusyId(null);
  }

  function formatDate(date: Date | null): string {
    if (!date) return "";
    return new Date(date).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return (
    <div className="flex flex-col gap-md">
      <Card className="flex flex-col gap-sm sm:flex-row sm:items-center">
        <div className="flex-1">
          <Input
            placeholder="جستجو (محصول، کاربر، متن، پاسخ)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="sm:w-48">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">همه‌ی نظرات</option>
            <option value="pending">در انتظار تأیید</option>
            <option value="approved">تأییدشده</option>
          </Select>
        </div>
      </Card>

      {error && <FormMessage variant="error">{error}</FormMessage>}
      {successMessage && <FormMessage variant="success">{successMessage}</FormMessage>}

      <p className="text-body-sm text-text-secondary">
        {toPersianDigits(filteredReviews.length)} نظر یافت شد
      </p>

      {filteredReviews.length === 0 ? (
        <Card>
          <p className="text-body-sm text-text-secondary text-center py-lg">
            هیچ نظری یافت نشد.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-sm">
          {filteredReviews.map((review) => {
            const isBusy = busyId === review.id;
            const isReplyOpen = replyOpenId === review.id;

            return (
              <Card key={review.id} className="flex flex-col gap-sm">
                {/* هدر: محصول + کاربر + امتیاز */}
                <div className="flex flex-wrap items-start justify-between gap-sm">
                  <div className="min-w-0">
                    <Link
                      href={`/products/${review.productSlug}`}
                      className="font-medium text-text-primary hover:text-brand-600 transition-colors"
                      target="_blank"
                    >
                      {review.productTitle}
                    </Link>
                    <p className="text-caption text-text-secondary">
                      {review.userFirstName} {review.userLastName} — {toPersianDigits(review.userMobile)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={review.isApproved ? "success" : "warning"}>
                      {review.isApproved ? "تأییدشده" : "در انتظار"}
                    </Badge>
                    <span className="text-caption text-amber-500">
                      {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                    </span>
                  </div>
                </div>

                {/* محتوای نظر */}
                {review.title && (
                  <p className="font-medium text-text-primary text-body-sm">
                    {review.title}
                  </p>
                )}

                {review.content && (
                  <p className="text-body-sm text-text-secondary leading-relaxed">
                    {review.content}
                  </p>
                )}

                {/* ✅ نمایش پاسخ ادمین (اگه هست) */}
                {review.adminReply && (
                  <div className="rounded-lg bg-brand-50 dark:bg-brand-950/30 border-r-4 border-brand-500 p-3 mt-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-caption font-bold text-brand-700 dark:text-brand-300">
                        📢 پاسخ مدیر فروشگاه
                      </p>
                      {review.adminReplyAt && (
                        <span className="text-caption text-text-muted">
                          {formatDate(review.adminReplyAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-body-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                      {review.adminReply}
                    </p>
                  </div>
                )}

                {/* ✅ فرم پاسخ (اگه باز باشه) */}
                {isReplyOpen && (
                  <div className="flex flex-col gap-sm pt-2 border-t border-border/50">
                    <label className="text-caption font-medium text-text-secondary">
                      متن پاسخ:
                    </label>
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="پاسخ خود را به این نظر بنویسید..."
                      rows={3}
                      disabled={isBusy}
                    />
                    <div className="flex flex-wrap gap-sm">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleReply(review.id)}
                        disabled={isBusy || !replyText.trim()}
                      >
                        {isBusy ? "در حال ثبت..." : "✅ ثبت پاسخ"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelReply}
                        disabled={isBusy}
                      >
                        انصراف
                      </Button>
                    </div>
                  </div>
                )}

                {/* دکمه‌های عملیات */}
                <div className="flex flex-wrap items-center justify-between gap-sm pt-sm border-t border-border/50">
                  <span className="text-caption text-text-muted fa-num">
                    {formatDate(review.createdAt)}
                  </span>

                  <div className="flex flex-wrap gap-sm">
                    <Button
                      variant={review.isApproved ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleApprove(review.id)}
                      disabled={isBusy}
                    >
                      {review.isApproved ? "لغو تأیید" : "تأیید"}
                    </Button>

                    {/* ✅ دکمه پاسخ / ویرایش پاسخ */}
                    {!review.adminReply && !isReplyOpen && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openReplyForm(review)}
                        disabled={isBusy}
                      >
                        💬 پاسخ دادن
                      </Button>
                    )}

                    {review.adminReply && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openReplyForm(review)}
                          disabled={isBusy || isReplyOpen}
                        >
                          ✏️ ویرایش پاسخ
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteReply(review.id)}
                          disabled={isBusy}
                        >
                          🗑️ حذف پاسخ
                        </Button>
                      </>
                    )}

                    {isSuperAdmin && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(review.id)}
                        disabled={isBusy}
                      >
                        حذف نظر
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}