"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { FormGroup } from "@/components/ui/FormGroup";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";
import { updateProfileAction } from "@/lib/server/account-actions";
import { validateProfileFields, type ProfileFormData } from "@/features/account/validation";

export interface ProfileFormProps {
  initialProfile: ProfileFormData & { mobileNumber: string };
}

type TouchedFields = Partial<Record<keyof ProfileFormData, boolean>>;

/**
 * ProfileForm
 *
 * Phase 6: replaces the previous placeholder ("این بخش در نسخه‌های
 * بعدی... تکمیل خواهد شد") with a real form wired to the now-complete
 * `updateProfileAction` (src/lib/server/account-actions.ts). Mobile
 * number is shown but not editable — see that action's doc comment for
 * why.
 */
export function ProfileForm({ initialProfile }: ProfileFormProps) {
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: initialProfile.firstName,
    lastName: initialProfile.lastName,
    email: initialProfile.email,
  });
  const [touched, setTouched] = useState<TouchedFields>({});
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | undefined>(undefined);

  const fieldErrors = validateProfileFields(formData);

  function markTouched(field: keyof ProfileFormData) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  function updateField<K extends keyof ProfileFormData>(field: K, value: ProfileFormData[K]) {
    setFormData((current) => ({ ...current, [field]: value }));
    setStatus("idle");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setShowAllErrors(true);
    setMessage(undefined);

    if (Object.keys(fieldErrors).length > 0) return;

    setStatus("saving");
    const result = await updateProfileAction(formData);

    if (!result.success) {
      setStatus("error");
      setMessage(result.error || "ذخیره‌سازی با خطا مواجه شد.");
      return;
    }

    setStatus("success");
    setMessage("اطلاعات با موفقیت به‌روزرسانی شد.");
  }

  return (
    <Card className="flex flex-col gap-md">
      <h2 className="text-h4 font-bold text-text-primary">اطلاعات کاربری</h2>

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

        <FormField label="شماره موبایل" helperText="برای تغییر شماره موبایل با پشتیبانی تماس بگیرید.">
          {(fieldProps) => (
            <Input {...fieldProps} value={initialProfile.mobileNumber} dir="ltr" disabled readOnly />
          )}
        </FormField>

        {message && (
          <FormMessage variant={status === "success" ? "success" : "error"}>{message}</FormMessage>
        )}

        <Button type="submit" variant="default" disabled={status === "saving"} className="self-start">
          {status === "saving" ? "در حال ذخیره..." : "ذخیره تغییرات"}
        </Button>
      </form>
    </Card>
  );
}
