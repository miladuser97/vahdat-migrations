"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { FormGroup } from "@/components/ui/FormGroup";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useCheckout } from "@/features/checkout/CheckoutProvider";
import { validateAddress } from "@/features/checkout/validation";
import type { OrderAddress } from "@/features/orders/types";

type TouchedFields = Partial<Record<keyof OrderAddress, boolean>>;

/**
 * AddressSection
 * The real "آدرس" checkout section (Phase 27), gated by
 * `CHECKOUT_FEATURES.showAddressForm` (see config.ts).
 *
 * Five fields only, exactly as scoped: province, city, street address,
 * postal code (optional), additional description (optional). Built
 * entirely from the existing form design system
 * (`FormField`/`FormGroup`/`Input`/`Textarea`) — no new form
 * primitives, same approach as `CustomerInformationSection`. Province
 * and city are plain text fields, not a linked dropdown pair — this
 * phase explicitly excludes any province/city dependency, and a static
 * hardcoded province list would be exactly the kind of premature
 * structure this project has consistently avoided building without a
 * real consumer.
 *
 * No `<form>` element, no submit button — same reasoning as
 * `CustomerInformationSection`: nothing downstream exists yet for a
 * submission to do.
 *
 * Phase 30: each field reads/writes CheckoutProvider's shared
 * `address` instead of being uncontrolled DOM state with no other
 * reader.
 *
 * Phase 31: same validation approach as `CustomerInformationSection` —
 * logic lives in `features/checkout/validation.ts`
 * (`validateAddress`), and an error only appears for a field once it's
 * been blurred (`touched`). See that component's doc comment for why
 * blur is the trigger used instead of a submit action.
 */
export function AddressSection() {
  const { address, updateAddress, showAllErrors } = useCheckout();
  const [touched, setTouched] = useState<TouchedFields>({});
  const errors = validateAddress(address);

  function markTouched(field: keyof OrderAddress) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  return (
    <Card className="flex flex-col gap-md">
      <h2 className="text-h4 font-semibold text-text-primary">آدرس</h2>

      <FormGroup layout="responsive">
        <div className="sm:flex-1">
          <FormField
            label="استان"
            required
            errorMessage={(touched.province || showAllErrors) ? errors.province : undefined}
          >
            {(fieldProps) => (
              <Input
                {...fieldProps}
                name="province"
                autoComplete="address-level1"
                value={address.province ?? ""}
                onChange={(event) => updateAddress({ province: event.target.value })}
                onBlur={() => markTouched("province")}
              />
            )}
          </FormField>
        </div>
        <div className="sm:flex-1">
          <FormField
            label="شهر"
            required
            errorMessage={(touched.city || showAllErrors) ? errors.city : undefined}
          >
            {(fieldProps) => (
              <Input
                {...fieldProps}
                name="city"
                autoComplete="address-level2"
                value={address.city ?? ""}
                onChange={(event) => updateAddress({ city: event.target.value })}
                onBlur={() => markTouched("city")}
              />
            )}
          </FormField>
        </div>
      </FormGroup>

      <FormField
        label="آدرس دقیق"
        required
        errorMessage={(touched.streetAddress || showAllErrors) ? errors.streetAddress : undefined}
      >
        {(fieldProps) => (
          <Input
            {...fieldProps}
            name="streetAddress"
            autoComplete="street-address"
            value={address.streetAddress ?? ""}
            onChange={(event) => updateAddress({ streetAddress: event.target.value })}
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
            value={address.postalCode ?? ""}
            onChange={(event) => updateAddress({ postalCode: event.target.value })}
          />
        )}
      </FormField>

      <FormField label="توضیحات تکمیلی (اختیاری)">
        {(fieldProps) => (
          <Textarea
            {...fieldProps}
            name="additionalDescription"
            rows={3}
            value={address.additionalDescription ?? ""}
            onChange={(event) => updateAddress({ additionalDescription: event.target.value })}
          />
        )}
      </FormField>
    </Card>
  );
}
