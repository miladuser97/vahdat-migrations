"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { FormMessage } from "@/components/ui/FormMessage";
import { Button } from "@/components/ui/Button";
import { requestPasswordReset } from "@/services/auth-service";

export function ForgotPasswordForm() {
  const [mobileNumber, setMobileNumber] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [error, setError] = useState<string | undefined>(undefined);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(undefined);

    if (!/^09\d{9}$/.test(mobileNumber)) {
      setError("شماره موبایل معتبر نیست.");
      return;
    }

    setStatus("submitting");
    const result = await requestPasswordReset(mobileNumber);

    if (result.success) {
      setStatus("success");
      setSuccessMessage(result.message);
    } else {
      setStatus("idle");
      setError(result.error);
    }
  };

  if (status === "success") {
    return (
      <Card className="flex flex-col gap-md text-center">
        {/* ✅ فقط پیام سرور */}
        <FormMessage variant="success">{successMessage}</FormMessage>

        <p className="text-body-sm text-text-secondary">
          کد ۶ رقمی تا ۱۰ دقیقه اعتبار دارد.
        </p>

        <Link
          href={`/reset-password?mobile=${mobileNumber}`}
          className="text-primary font-medium hover:underline"
        >
          رفتن به صفحه‌ی بازیابی
        </Link>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-md" noValidate>
        <FormField
          label="شماره موبایل"
          required
          helperText="شماره‌ای که با آن ثبت‌نام کرده‌اید"
          errorMessage={error}
        >
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

        <Button
          type="submit"
          variant="default"
          size="lg"
          className="w-full"
          disabled={status === "submitting"}
        >
          {status === "submitting" ? "در حال ارسال..." : "ارسال کد بازیابی"}
        </Button>
      </form>

      <p className="text-center text-body-sm text-text-secondary">
        رمز عبور را به یاد آورده‌اید؟{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          وارد شوید
        </Link>
      </p>
    </Card>
  );
}