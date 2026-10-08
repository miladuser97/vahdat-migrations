"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";
import { FormMessage } from "@/components/ui/FormMessage";
import { StarRating } from "./StarRating";
import { addReviewAction } from "@/lib/server/commerce-actions";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  createdAt: Date;
  user: {
    firstName: string;
    lastName: string;
  };
}

interface ProductReviewsProps {
  productId: string;
  initialReviews: Review[];
  averageRating: number;
  totalReviews: number;
  isAuthenticated: boolean;
}

export function ProductReviews({
  productId,
  initialReviews,
  averageRating,
  totalReviews,
  isAuthenticated,
}: ProductReviewsProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    rating: 5,
    title: "",
    content: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      // استفاده از Link یا router.push برای هدایت به لاگین
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    const result = await addReviewAction(productId, {
      rating: formData.rating,
      title: formData.title,
      content: formData.content,
    });

    if (result.success) {
      setSuccess(true);
      
      // ✅ به جای router.refresh()، نظر جدید رو به لیست اضافه میکنیم
      const newReview: Review = {
        id: result.reviewId || "temp",
        rating: formData.rating,
        title: formData.title || null,
        content: formData.content || null,
        createdAt: new Date(),
        user: {
          firstName: "کاربر",
          lastName: "",
        },
      };
      
      // اضافه کردن نظر جدید به اول لیست
      setReviews([newReview, ...reviews]);
      
      // پاک کردن فرم
      setFormData({ rating: 5, title: "", content: "" });
      
      // بعد از ۳ ثانیه پیام موفقیت رو پاک کن
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error);
      // بعد از ۳ ثانیه خطا رو پاک کن
      setTimeout(() => setError(null), 3000);
    }

    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-text-primary">
            {averageRating.toFixed(1)}
          </span>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`text-xl ${
                  star <= Math.round(averageRating)
                    ? "text-yellow-500"
                    : "text-muted"
                }`}
              >
                ★
              </span>
            ))}
          </div>
        </div>
        <span className="text-sm text-text-secondary">
          ({totalReviews} نظر)
        </span>
      </div>

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-sm ${
                            star <= review.rating
                              ? "text-yellow-500"
                              : "text-muted"
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <Badge variant="muted" className="text-xs">
                      {review.rating} از ۵
                    </Badge>
                  </div>
                  {review.title && (
                    <h4 className="mt-1 font-medium text-text-primary">
                      {review.title}
                    </h4>
                  )}
                  {review.content && (
                    <p className="mt-1 text-sm text-text-secondary">
                      {review.content}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-text-secondary">
                    {review.user.firstName} {review.user.lastName} •{" "}
                    {new Date(review.createdAt).toLocaleDateString("fa-IR")}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-secondary">
          هنوز نظری برای این محصول ثبت نشده است.
        </p>
      )}

      {/* Add Review Form */}
      <Card className="p-6">
        <h3 className="text-h5 font-bold text-text-primary mb-4">
          {isAuthenticated ? "ثبت نظر جدید" : "برای ثبت نظر وارد شوید"}
        </h3>

        {success && (
          <FormMessage variant="success">
            نظر شما با موفقیت ثبت شد و پس از تأیید ادمین نمایش داده خواهد شد.
          </FormMessage>
        )}

        {error && <FormMessage variant="error">{error}</FormMessage>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>امتیاز شما</Label>
            <StarRating
              value={formData.rating}
              onChange={(rating) => setFormData({ ...formData, rating })}
              disabled={!isAuthenticated || isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="review-title">عنوان نظر (اختیاری)</Label>
            <Input
              id="review-title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="خلاصه‌ای از نظر شما"
              disabled={!isAuthenticated || isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="review-content">متن نظر</Label>
            <Textarea
              id="review-content"
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              placeholder="نظر خود را درباره این محصول بنویسید..."
              rows={4}
              disabled={!isAuthenticated || isSubmitting}
              required
            />
          </div>

          <Button
            type="submit"
            variant="default"
            disabled={!isAuthenticated || isSubmitting}
          >
            {isSubmitting ? "در حال ارسال..." : "ثبت نظر"}
          </Button>

          {!isAuthenticated && (
            <p className="text-sm text-text-secondary">
              برای ثبت نظر ابتدا{" "}
              <a href="/login" className="text-primary hover:underline">
                وارد حساب خود شوید
              </a>
              .
            </p>
          )}
        </form>
      </Card>
    </div>
  );
}