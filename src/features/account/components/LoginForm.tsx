"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { FormMessage } from "@/components/ui/FormMessage";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/features/account/AuthContext";

const DEFAULT_REDIRECT = "/account";

// ============================================================
// ✅ نقش‌هایی که باید برن به /admin
// ============================================================
const ADMIN_ROLES = ["admin", "super_admin"];

interface LoginFormState {
  mobileNumber: string;
  password: string;
}

const INITIAL_STATE: LoginFormState = {
  mobileNumber: "",
  password: "",
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, status, error, login } = useAuth();

  const [formData, setFormData] = useState<LoginFormState>(INITIAL_STATE);
  const [touched, setTouched] = useState<Partial<Record<keyof LoginFormState, boolean>>>({});
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ نمایش/مخفی کردن رمز عبور
  const [showPassword, setShowPassword] = useState(false);

  const explicitRedirect = searchParams.get("redirect");
  const resetSuccess = searchParams.get("reset") === "success";

  // ============================================================
  // ✅ منطق: بعد از لاگین، بر اساس نقش، به مسیر مناسب برو
  // ============================================================
  useEffect(() => {
    if (status === "authenticated" && user) {
      let target = DEFAULT_REDIRECT;

      if (explicitRedirect) {
        target = explicitRedirect;
      } else if (user.role && ADMIN_ROLES.includes(user.role)) {
        target = "/admin";
      }

      router.replace(target);
    }
  }, [status, user, router, explicitRedirect]);

  const mobileError =
    formData.mobileNumber && !/^09\d{9}$/.test(formData.mobileNumber)
      ? "شماره موبایل معتبر نیست."
      : undefined;
  const passwordError =
    formData.password && formData.password.length < 8
      ? "رمز عبور باید حداقل ۸ کاراکتر باشد."
      : undefined;

  function markTouched(field: keyof LoginFormState) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  function updateField<K extends keyof LoginFormState>(field: K, value: LoginFormState[K]) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setShowAllErrors(true);
    if (mobileError || passwordError || !formData.mobileNumber || !formData.password) return;

    setIsSubmitting(true);
    await login({
      mobileNumber: formData.mobileNumber,
      password: formData.password,
    });
    setIsSubmitting(false);
  }

  return (
    <Card className="flex flex-col gap-lg">
      <div className="flex flex-col gap-xs text-center">
        <h1 className="text-h3 font-bold text-text-primary">ورود به حساب کاربری</h1>
        <p className="text-body-sm text-text-secondary">
          برای پیگیری سفارش‌ها و استفاده از امکانات، وارد شوید.
        </p>
      </div>

      {resetSuccess && (
        <FormMessage variant="success">
          رمز عبور شما با موفقیت تغییر یافت. لطفاً وارد شوید.
        </FormMessage>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-md" noValidate>
        <FormField
          label="شماره موبایل"
          required
          errorMessage={(touched.mobileNumber || showAllErrors) ? (mobileError || (formData.mobileNumber ? undefined : "شماره موبایل الزامی است.")) : undefined}
        >
          {(fieldProps) => (
            <Input
              {...fieldProps}
              name="mobileNumber"
              autoComplete="tel"
              inputMode="tel"
              dir="ltr"
              placeholder="09xxxxxxxxx"
              value={formData.mobileNumber}
              onChange={(event) => updateField("mobileNumber", event.target.value)}
              onBlur={() => markTouched("mobileNumber")}
            />
          )}
        </FormField>

        <FormField
          label="رمز عبور"
          required
          errorMessage={(touched.password || showAllErrors) ? (passwordError || (formData.password ? undefined : "رمز عبور الزامی است.")) : undefined}
        >
          {(fieldProps) => (
            <div className="relative">
              <Input
                {...fieldProps}
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                className="pl-10"
                value={formData.password}
                onChange={(event) => updateField("password", event.target.value)}
                onBlur={() => markTouched("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "مخفی کردن رمز عبور" : "نمایش رمز عبور"}
                aria-pressed={showPassword}
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          )}
        </FormField>

        <div className="flex justify-end -mt-1">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline transition-colors"
          >
            رمز عبور را فراموش کرده‌اید؟
          </Link>
        </div>

        {error && <FormMessage variant="error">{error}</FormMessage>}

        <Button type="submit" variant="default" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "در حال ورود..." : "ورود"}
        </Button>
      </form>

      <p className="text-center text-body-sm text-text-secondary">
        حساب کاربری ندارید؟{" "}
        <Link href="/register" className="font-medium text-brand-600 hover:underline">
          ثبت‌نام کنید
        </Link>
      </p>
    </Card>
  );
}