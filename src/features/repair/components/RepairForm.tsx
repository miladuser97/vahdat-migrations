"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { FormMessage } from "@/components/ui/FormMessage";
import { createRepairRequestAction } from "@/lib/server/repair-actions";

const PROBLEM_TYPES = [
  { value: "screen", label: "صفحه‌نمایش (شکستگی، خط و خش، سوختگی)" },
  { value: "battery", label: "باتری (تخلیه سریع، شارژ نشدن، باد کردن)" },
  { value: "charging", label: "شارژ (پورت شارژ، کابل، آداپتور)" },
  { value: "camera", label: "دوربین (تاری، خط افتادن، کار نکردن)" },
  { value: "speaker", label: "بلندگو و میکروفون (صدای نامشخص، کار نکردن)" },
  { value: "water", label: "آب‌خوردگی و مایعات" },
  { value: "software", label: "نرم‌افزار (آپدیت، ویروس، هنگ کردن)" },
  { value: "network", label: "شبکه و اینترنت (وای‌فای، بلوتوث، آنتن)" },
  { value: "other", label: "سایر مشکلات" },
];

const BRANDS = [
  "سامسونگ",
  "اپل",
  "شیائومی",
  "هواوی",
  "نوکیا",
  "الجی",
  "سونی",
  "گوگل",
  "وان‌پلاس",
  "آنر",
  "تکنو",
  "اینفینیکس",
  "سایر",
];

export function RepairForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    mobileNumber: "",
    email: "",
    brand: "",
    model: "",
    problemType: "",
    description: "",
    address: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const result = await createRepairRequestAction(formData);

    if (result.success) {
      setSuccess("درخواست شما با موفقیت ثبت شد.");
      setTrackingCode(result.trackingCode || null);
      setFormData({
        firstName: "",
        lastName: "",
        mobileNumber: "",
        email: "",
        brand: "",
        model: "",
        problemType: "",
        description: "",
        address: "",
      });
    } else {
      setError(result.error || "خطا در ثبت درخواست.");
    }

    setIsSubmitting(false);
  };

  return (
    <Card className="p-6 md:p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {success && (
          <div className="rounded-lg border border-success/30 bg-success/5 p-4">
            <FormMessage variant="success">{success}</FormMessage>
            {trackingCode && (
              <div className="mt-3 p-3 bg-white/50 rounded-lg text-center">
                <p className="text-sm text-text-secondary">کد پیگیری شما:</p>
                <p className="text-2xl font-bold text-primary tracking-wider">{trackingCode}</p>
                <p className="text-xs text-text-secondary mt-1">
                  این کد را ذخیره کنید تا بتوانید وضعیت درخواست خود را پیگیری کنید.
                </p>
              </div>
            )}
          </div>
        )}

        {error && <FormMessage variant="error">{error}</FormMessage>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">نام</Label>
            <Input
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="نام خود را وارد کنید"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="lastName">نام خانوادگی</Label>
            <Input
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="نام خانوادگی خود را وارد کنید"
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="mobileNumber">شماره موبایل</Label>
            <Input
              id="mobileNumber"
              name="mobileNumber"
              type="tel"
              value={formData.mobileNumber}
              onChange={handleChange}
              placeholder="مثلاً ۰۹۱۲۷۸۰۹۷۲۰"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="email">ایمیل (اختیاری)</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="ایمیل خود را وارد کنید"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="brand">برند گوشی</Label>
            <select
              id="brand"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-body text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              required
              disabled={isSubmitting}
            >
              <option value="">انتخاب برند</option>
              {BRANDS.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="model">مدل گوشی</Label>
            <Input
              id="model"
              name="model"
              value={formData.model}
              onChange={handleChange}
              placeholder="مثلاً S24 Ultra یا iPhone 15"
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="problemType">نوع مشکل</Label>
          <select
            id="problemType"
            name="problemType"
            value={formData.problemType}
            onChange={handleChange}
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-body text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            required
            disabled={isSubmitting}
          >
            <option value="">انتخاب نوع مشکل</option>
            {PROBLEM_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="description">توضیحات کامل مشکل</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="لطفاً مشکل گوشی را به طور کامل توضیح دهید..."
            rows={5}
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Label htmlFor="address">آدرس (برای دریافت و تحویل گوشی)</Label>
          <Textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="آدرس کامل خود را وارد کنید..."
            rows={3}
            disabled={isSubmitting}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
          <Button
            type="submit"
            variant="default"
            size="lg"
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? "در حال ثبت..." : "ثبت درخواست تعمیر"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.push("/repair/track")}
            disabled={isSubmitting}
          >
            پیگیری درخواست
          </Button>
        </div>

        <p className="text-center text-caption text-text-secondary">
          🔹 پس از ثبت درخواست، کد پیگیری دریافت خواهید کرد.
          <br />
          کارشناسان ما در اسرع وقت با شما تماس می‌گیرند.
        </p>
      </form>
    </Card>
  );
}