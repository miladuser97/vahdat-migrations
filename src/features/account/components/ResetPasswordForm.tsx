"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { FormMessage } from "@/components/ui/FormMessage";
import { Button } from "@/components/ui/Button";
import { resetPassword } from "@/services/auth-service";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMobile = searchParams.get("mobile") || "";

  const [mobileNumber, setMobileNumber] = useState(initialMobile);
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (initialMobile) setMobileNumber(initialMobile);
  }, [initialMobile]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(undefined);

    if (!/^09\d{9}$/.test(mobileNumber)) {
      setError("شماره موبایل معتبر نیست.");
      return;
    }
    if (!/^\d{6}$/.test(resetCode)) {
      setError("کد بازیابی باید ۶ رقم باشد.");
      return;
    }
    if (newPassword.length < 8) {
      setError("رمز عبور باید حداقل ۸ کاراکتر باشد.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("تکرار رمز عبور مطابقت ندارد.");
      return;
    }

    setStatus("submitting");
    const result = await resetPassword({
      mobileNumber,
      resetCode,
      newPassword,
    });

    if (result.success) {
      router.push("/login?reset=success");
    } else {
      setStatus("idle");
      setError(result.error);
    }
  };

  return (
    <Card className="flex flex-col gap-lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-md" noValidate>
        <FormField label="شماره موبایل" required>
          {(fieldProps) => (
            <Input
              {...fieldProps}
              name="mobileNumber"
              type="tel"
              inputMode="tel"
              dir="ltr"
              placeholder="09xxxxxxxxx"
              value={mobileNumber}
              onChange={(event) => setMobileNumber(event.target.value)}
            />
          )}
        </FormField>

        <FormField
          label="کد بازیابی"
          required
          helperText="کد ۶ رقمی ارسال شده به موبایل شما"
        >
          {(fieldProps) => (
            <Input
              {...fieldProps}
              name="resetCode"
              type="text"
              inputMode="numeric"
              dir="ltr"
              placeholder="123456"
              maxLength={6}
              value={resetCode}
              onChange={(event) => setResetCode(event.target.value.replace(/\D/g, ""))}
            />
          )}
        </FormField>

        <FormField
          label="رمز عبور جدید"
          required
          helperText="حداقل ۸ کاراکتر"
        >
          {(fieldProps) => (
            <Input
              {...fieldProps}
              name="newPassword"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          )}
        </FormField>

        <FormField label="تکرار رمز عبور جدید" required>
          {(fieldProps) => (
            <Input
              {...fieldProps}
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          )}
        </FormField>

        {error && <FormMessage variant="error">{error}</FormMessage>}

        <Button
          type="submit"
          variant="default"
          size="lg"
          className="w-full"
          disabled={status === "submitting"}
        >
          {status === "submitting" ? "در حال تغییر..." : "تغییر رمز عبور"}
        </Button>
      </form>

      <p className="text-center text-body-sm text-text-secondary">
        <Link href="/forgot-password" className="font-medium text-primary hover:underline">
          ارسال مجدد کد بازیابی
        </Link>
      </p>
    </Card>
  );
}