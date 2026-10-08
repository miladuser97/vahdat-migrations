"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Badge } from "@/components/ui/Badge";
import { FormField } from "@/components/ui/FormField";
import { FormGroup } from "@/components/ui/FormGroup";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { FormMessage } from "@/components/ui/FormMessage";
import { EmptyState } from "@/components/shared/EmptyState";
import { validateAddress } from "@/features/checkout/validation";
import type { OrderAddress } from "@/features/orders/types";
import {
  addAddressAction,
  updateAddressAction,
  deleteAddressAction,
  setDefaultAddressAction,
  type AccountAddress,
} from "@/lib/server/account-actions";

type AddressFormData = OrderAddress & { title: string };

const EMPTY_FORM: AddressFormData = {
  title: "",
  province: "",
  city: "",
  streetAddress: "",
  postalCode: "",
  additionalDescription: "",
};

function toFormData(address: AccountAddress): AddressFormData {
  return {
    title: address.title,
    province: address.province,
    city: address.city,
    streetAddress: address.streetAddress,
    postalCode: address.postalCode || "",
    additionalDescription: address.additionalDescription || "",
  };
}

/**
 * AddressList
 *
 * Phase 6: replaces the addresses placeholder (disabled "افزودن آدرس
 * جدید (به‌زودی)" button + a permanent empty state) with real
 * create/update/delete/set-default, all going through
 * account-actions.ts's ownership-checked, server-validated actions —
 * this component decides nothing about whether an edit is allowed, it
 * only decides what to render based on the (server-authoritative)
 * result.
 */
export function AddressList({ initialAddresses }: { initialAddresses: AccountAddress[] }) {
  const router = useRouter();
  const [addresses, setAddresses] = useState(initialAddresses);
  const [mode, setMode] = useState<"list" | "add" | "edit">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AddressFormData>(EMPTY_FORM);
  const [touched, setTouched] = useState<Partial<Record<keyof AddressFormData, boolean>>>({});
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [formStatus, setFormStatus] = useState<"idle" | "saving" | "error">("idle");
  const [formError, setFormError] = useState<string | undefined>(undefined);
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);

  const addressErrors = validateAddress(formData);
  const titleError = formData.title.trim() ? undefined : "عنوان آدرس الزامی است.";

  function openAddForm() {
    setFormData(EMPTY_FORM);
    setTouched({});
    setShowAllErrors(false);
    setFormStatus("idle");
    setFormError(undefined);
    setMode("add");
    setEditingId(null);
  }

  function openEditForm(address: AccountAddress) {
    setFormData(toFormData(address));
    setTouched({});
    setShowAllErrors(false);
    setFormStatus("idle");
    setFormError(undefined);
    setMode("edit");
    setEditingId(address.id);
  }

  function closeForm() {
    setMode("list");
    setEditingId(null);
  }

  function markTouched(field: keyof AddressFormData) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  function updateField<K extends keyof AddressFormData>(field: K, value: AddressFormData[K]) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setShowAllErrors(true);
    setFormError(undefined);

    if (Object.keys(addressErrors).length > 0 || titleError) return;

    setFormStatus("saving");
    const payload = {
      title: formData.title.trim(),
      province: formData.province,
      city: formData.city,
      streetAddress: formData.streetAddress,
      postalCode: formData.postalCode || undefined,
      additionalDescription: formData.additionalDescription || undefined,
    };

    const result =
      mode === "edit" && editingId
        ? await updateAddressAction(editingId, payload)
        : await addAddressAction(payload);

    if (!result.success) {
      setFormStatus("error");
      setFormError(result.error || "ذخیره‌سازی با خطا مواجه شد.");
      return;
    }

    closeForm();
    router.refresh();
  }

  async function handleDelete(address: AccountAddress) {
    if (!window.confirm(`آدرس «${address.title}» حذف شود؟`)) return;

    setRowBusyId(address.id);
    setRowError(null);
    const result = await deleteAddressAction(address.id);

    if (!result.success) {
      setRowBusyId(null);
      setRowError({ id: address.id, message: result.error || "حذف با خطا مواجه شد." });
      return;
    }

    setAddresses((current) => current.filter((a) => a.id !== address.id));
    setRowBusyId(null);
    router.refresh();
  }

  async function handleSetDefault(address: AccountAddress) {
    setRowBusyId(address.id);
    setRowError(null);
    const result = await setDefaultAddressAction(address.id);

    if (!result.success) {
      setRowBusyId(null);
      setRowError({ id: address.id, message: result.error || "به‌روزرسانی با خطا مواجه شد." });
      return;
    }

    setAddresses((current) => current.map((a) => ({ ...a, isDefault: a.id === address.id })));
    setRowBusyId(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-h4 font-bold text-text-primary">آدرس‌ها</h2>
        {mode === "list" && (
          <Button variant="outline" size="sm" onClick={openAddForm}>
            افزودن آدرس جدید
          </Button>
        )}
      </div>

      {mode !== "list" && (
        <Card className="flex flex-col gap-md">
          <h3 className="text-h5 font-bold text-text-primary">
            {mode === "edit" ? "ویرایش آدرس" : "آدرس جدید"}
          </h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-md" noValidate>
            <FormField
              label="عنوان آدرس"
              required
              helperText="مثلاً «خانه» یا «محل کار»"
              errorMessage={(touched.title || showAllErrors) ? titleError : undefined}
            >
              {(fieldProps) => (
                <Input
                  {...fieldProps}
                  name="title"
                  value={formData.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  onBlur={() => markTouched("title")}
                />
              )}
            </FormField>

            <FormGroup layout="responsive">
              <div className="sm:flex-1">
                <FormField
                  label="استان"
                  required
                  errorMessage={(touched.province || showAllErrors) ? addressErrors.province : undefined}
                >
                  {(fieldProps) => (
                    <Input
                      {...fieldProps}
                      name="province"
                      autoComplete="address-level1"
                      value={formData.province}
                      onChange={(event) => updateField("province", event.target.value)}
                      onBlur={() => markTouched("province")}
                    />
                  )}
                </FormField>
              </div>
              <div className="sm:flex-1">
                <FormField
                  label="شهر"
                  required
                  errorMessage={(touched.city || showAllErrors) ? addressErrors.city : undefined}
                >
                  {(fieldProps) => (
                    <Input
                      {...fieldProps}
                      name="city"
                      autoComplete="address-level2"
                      value={formData.city}
                      onChange={(event) => updateField("city", event.target.value)}
                      onBlur={() => markTouched("city")}
                    />
                  )}
                </FormField>
              </div>
            </FormGroup>

            <FormField
              label="آدرس دقیق"
              required
              errorMessage={(touched.streetAddress || showAllErrors) ? addressErrors.streetAddress : undefined}
            >
              {(fieldProps) => (
                <Input
                  {...fieldProps}
                  name="streetAddress"
                  autoComplete="street-address"
                  value={formData.streetAddress}
                  onChange={(event) => updateField("streetAddress", event.target.value)}
                  onBlur={() => markTouched("streetAddress")}
                />
              )}
            </FormField>

            <FormField label="کد پستی (اختیاری)">
              {(fieldProps) => (
                <Input
                  {...fieldProps}
                  name="postalCode"
                  autoComplete="postal-code"
                  inputMode="numeric"
                  dir="ltr"
                  value={formData.postalCode}
                  onChange={(event) => updateField("postalCode", event.target.value)}
                />
              )}
            </FormField>

            <FormField label="توضیحات تکمیلی (اختیاری)">
              {(fieldProps) => (
                <Textarea
                  {...fieldProps}
                  name="additionalDescription"
                  rows={3}
                  value={formData.additionalDescription}
                  onChange={(event) => updateField("additionalDescription", event.target.value)}
                />
              )}
            </FormField>

            {formError && <FormMessage variant="error">{formError}</FormMessage>}

            <div className="flex gap-sm">
              <Button type="submit" variant="default" disabled={formStatus === "saving"}>
                {formStatus === "saving" ? "در حال ذخیره..." : "ذخیره آدرس"}
              </Button>
              <Button type="button" variant="outline" onClick={closeForm} disabled={formStatus === "saving"}>
                انصراف
              </Button>
            </div>
          </form>
        </Card>
      )}

      {mode === "list" && addresses.length === 0 && (
        <EmptyState
          title="هنوز هیچ آدرسی ثبت نکرده‌اید"
          description="با ثبت آدرس، فرآیند خرید خود را سریع‌تر انجام دهید."
          action={
            <button onClick={openAddForm} className={buttonVariants({ variant: "default", size: "md" })}>
              افزودن آدرس جدید
            </button>
          }
        />
      )}

      {mode === "list" && addresses.length > 0 && (
        <div className="flex flex-col gap-md">
          {addresses.map((address) => (
            <Card key={address.id} className="flex flex-col gap-sm">
              <div className="flex flex-wrap items-center justify-between gap-sm">
                <div className="flex items-center gap-sm">
                  <span className="font-medium text-text-primary">{address.title}</span>
                  {address.isDefault && <Badge variant="success">پیش‌فرض</Badge>}
                </div>
                <div className="flex flex-wrap gap-sm">
                  {!address.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={rowBusyId === address.id}
                      onClick={() => handleSetDefault(address)}
                    >
                      تنظیم به‌عنوان پیش‌فرض
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => openEditForm(address)}>
                    ویرایش
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={rowBusyId === address.id}
                    onClick={() => handleDelete(address)}
                  >
                    {rowBusyId === address.id ? "..." : "حذف"}
                  </Button>
                </div>
              </div>
              <p className="text-body-sm text-text-secondary">
                {address.province}، {address.city}، {address.streetAddress}
                {address.postalCode ? ` — کد پستی: ${address.postalCode}` : ""}
              </p>
              {address.additionalDescription && (
                <p className="text-caption text-text-secondary">{address.additionalDescription}</p>
              )}
              {rowError?.id === address.id && <FormMessage variant="error">{rowError.message}</FormMessage>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}