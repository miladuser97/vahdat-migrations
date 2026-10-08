"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { FormGroup } from "@/components/ui/FormGroup";
import { Input } from "@/components/ui/Input";
import { FormMessage } from "@/components/ui/FormMessage";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/features/account/AuthContext";
import { register as registerRequest } from "@/services/auth-service";
import {
  validateRegisterFields,
  confirmPasswordError,
  type RegisterFormData,
} from "@/features/account/validation";

type FormState = RegisterFormData & { confirmPassword: string };
type TouchedFields = Partial<Record<keyof FormState, boolean>>;

const DEFAULT_REDIRECT = "/account";
const INITIAL_STATE: FormState = {
  firstName: "",
  lastName: "",
  mobileNumber: "",
  email: "",
  password: "",
  confirmPassword: "",
};

/**
 * RegisterForm
 *
 * Phase 3: the real registration screen, wired to the already-existing
 * `registerAction` (bcrypt hashing at cost 12, uniqueness checks on
 * mobile/email — unchanged, not re-implemented here).
 *
 * `registerAction` only creates the user row; it does not start a
 * session (that's `loginAction`'s job). So after a successful
 * registration this component calls `AuthContext.login` with the same
 * credentials to sign the person in immediately, instead of sending
 * them to a separate login screen right after they just typed their
 * password once already. If that auto-login unexpectedly fails, the
 * person is told their account was created and pointed at /login
 * rather than shown a raw error for a registration that actually
 * succeeded.
 */
export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, status, error: loginError, login } = useAuth();

  const [formData, setFormData] = useState<FormState>(INITIAL_STATE);
  const [touched, setTouched] = useState<TouchedFields>({});
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [phase, setPhase] = useState<"idle" | "submitting" | "awaiting-auto-login" | "auto-login-failed">("idle");
  const [registerError, setRegisterError] = useState<string | undefined>(undefined);

  const fieldErrors = validateRegisterFields(formData);
  const confirmError = confirmPasswordError(formData.password, formData.confirmPassword);
  const redirectTarget = searchParams.get("redirect") || DEFAULT_REDIRECT;

  useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace(redirectTarget);
    }
  }, [status, user, router, redirectTarget]);

  // If the post-registration auto-login didn't result in an
  // authenticated session, stop treating this as still-in-progress.
  useEffect(() => {
    if (phase === "awaiting-auto-login" && status === "unauthenticated") {
      setPhase("auto-login-failed");
    }
  }, [phase, status]);

  function markTouched(field: keyof FormState) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setShowAllErrors(true);
    setRegisterError(undefined);

    if (Object.keys(fieldErrors).length > 0 || confirmError) return;

    setPhase("submitting");
    const result = await registerRequest({
      firstName: formData.firstName,
      lastName: formData.lastName,
      mobileNumber: formData.mobileNumber,
      email: formData.email || undefined,
      password: formData.password,
    });

    if (!result.success) {
      setRegisterError(result.error);
      setPhase("idle");
      return;
    }

    setPhase("awaiting-auto-login");
    await login({ mobileNumber: formData.mobileNumber, password: formData.password });
  }

  const isSubmitting = phase === "submitting" || phase === "awaiting-auto-login";

  return (
    <Card className="flex flex-col gap-lg">
      <div className="flex flex-col gap-xs text-center">
        <h1 className="text-h3 font-bold text-text-primary">ایجاد حساب کاربری</h1>
        <p className="text-body-sm text-text-secondary">
          برای ثبت سفارش و پیگیری آن، یک حساب کاربری بسازید.
        </p>
      </div>

      {phase === "auto-login-failed" ? (
        <div className="flex flex-col gap-md text-center">
          <FormMessage variant="success">
            حساب کاربری شما با موفقیت ساخته شد.
          </FormMessage>
          <p className="text-body-sm text-text-secondary">
            برای ورود، از صفحه‌ی ورود استفاده کنید.
          </p>
          <Link
            href={`/login${redirectTarget !== DEFAULT_REDIRECT ? `?redirect=${encodeURIComponent(redirectTarget)}` : ""}`}
            className="text-primary font-medium hover:underline"
          >
            رفتن به صفحه‌ی ورود
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-md" noValidate>
          <FormGroup layout="responsive">
            <div className="sm:flex-1">
              <FormField
                label="نام"
                required
                errorMessage={(touched.firstName || showAllErrors) ? fieldErrors.firstName : undefined}
              >
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    name="firstName"
                    autoComplete="given-name"
                    value={formData.firstName}
                    onChange={(event) => updateField("firstName", event.target.value)}
                    onBlur={() => markTouched("firstName")}
                  />
                )}
              </FormField>
            </div>
            <div className="sm:flex-1">
              <FormField
                label="نام خانوادگی"
                required
                errorMessage={(touched.lastName || showAllErrors) ? fieldErrors.lastName : undefined}
              >
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    name="lastName"
                    autoComplete="family-name"
                    value={formData.lastName}
                    onChange={(event) => updateField("lastName", event.target.value)}
                    onBlur={() => markTouched("lastName")}
                  />
                )}
              </FormField>
            </div>
          </FormGroup>

          <FormField
            label="شماره موبایل"
            required
            errorMessage={(touched.mobileNumber || showAllErrors) ? fieldErrors.mobileNumber : undefined}
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
            label="ایمیل (اختیاری)"
            errorMessage={(touched.email || showAllErrors) ? fieldErrors.email : undefined}
          >
            {(fieldProps) => (
              <Input
                {...fieldProps}
                type="email"
                name="email"
                autoComplete="email"
                dir="ltr"
                value={formData.email}
                onChange={(event) => updateField("email", event.target.value)}
                onBlur={() => markTouched("email")}
              />
            )}
          </FormField>

          <FormGroup layout="responsive">
            <div className="sm:flex-1">
              <FormField
                label="رمز عبور"
                required
                helperText={!fieldErrors.password ? "حداقل ۸ کاراکتر" : undefined}
                errorMessage={(touched.password || showAllErrors) ? fieldErrors.password : undefined}
              >
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    type="password"
                    name="password"
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={(event) => updateField("password", event.target.value)}
                    onBlur={() => markTouched("password")}
                  />
                )}
              </FormField>
            </div>
            <div className="sm:flex-1">
              <FormField
                label="تکرار رمز عبور"
                required
                errorMessage={(touched.confirmPassword || showAllErrors) ? confirmError : undefined}
              >
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    type="password"
                    name="confirmPassword"
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={(event) => updateField("confirmPassword", event.target.value)}
                    onBlur={() => markTouched("confirmPassword")}
                  />
                )}
              </FormField>
            </div>
          </FormGroup>

          {(registerError || (phase === "awaiting-auto-login" && loginError)) && (
            <FormMessage variant="error">
              {registerError || loginError}
            </FormMessage>
          )}

          <Button type="submit" variant="default" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "در حال ثبت‌نام..." : "ثبت‌نام"}
          </Button>
        </form>
      )}

      {phase !== "auto-login-failed" && (
        <p className="text-center text-body-sm text-text-secondary">
          قبلاً ثبت‌نام کرده‌اید؟{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            وارد شوید
          </Link>
        </p>
      )}
    </Card>
  );
}
