"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { FormGroup } from "@/components/ui/FormGroup";
import { Input } from "@/components/ui/Input";
import { useCheckout } from "@/features/checkout/CheckoutProvider";
import { validateCustomerInformation } from "@/features/checkout/validation";
import type { OrderCustomerInformation } from "@/features/orders/types";

type TouchedFields = Partial<Record<keyof OrderCustomerInformation, boolean>>;

/**
 * CustomerInformationSection
 * The real "اطلاعات مشتری" checkout section, replacing the Phase 23
 * placeholder now that `CHECKOUT_FEATURES.showCustomerInformationForm`
 * is on (see config.ts).
 *
 * Four fields only, exactly as scoped: first name, last name, mobile
 * number, email (optional). Built entirely from the existing form
 * design system (FormField/FormGroup/Input/Label/HelperText) — no new
 * form primitives, no changes to any of them. FormField already wires
 * Label + input + aria-describedby/aria-invalid correctly.
 *
 * No `<form>` element and no submit button: nothing exists yet for a
 * submission to do (no shipping/payment, no order creation), and a
 * bare `<form>` with a single text field would submit-and-reload the
 * page on Enter for no reason. `Label`+`Input` pairs are already
 * semantic, accessible form elements without needing to be wrapped in
 * one. A future phase that adds real submission can wrap this same
 * markup in a `<form>` without restructuring the fields themselves.
 *
 * Deliberately not exposing accounts/guest-checkout/address-book here:
 * none of that exists yet (explicitly out of scope) — this section
 * only asks for what it needs today. Adding one of those later means
 * adding a field/section here, not reshaping this one, since each
 * field is already an independent FormField.
 *
 * Phase 30: each field reads/writes CheckoutProvider's shared
 * `customerInformation` instead of being uncontrolled DOM state with
 * no other reader.
 *
 * Phase 31: validation logic lives entirely in
 * `features/checkout/validation.ts` (`validateCustomerInformation`) —
 * this component only calls it and decides *when* to show a result.
 * An error only appears for a field once it's been blurred at least
 * once (`touched`), not immediately on page load or while the person
 * is still mid-typing — there's no submit button to use as the usual
 * "now show everything" trigger, so per-field blur is the only honest,
 * available moment. `touched` is plain local UI state (which fields
 * this component has decided to start showing errors for) — not
 * checkout-wide data, so it does not belong in CheckoutProvider.
 */
export function CustomerInformationSection() {
  const { customerInformation, updateCustomerInformation, showAllErrors } = useCheckout();
  const [touched, setTouched] = useState<TouchedFields>({});
  const errors = validateCustomerInformation(customerInformation);

  function markTouched(field: keyof OrderCustomerInformation) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  return (
    <Card className="flex flex-col gap-md">
      <h2 className="text-h4 font-semibold text-text-primary">اطلاعات مشتری</h2>

      <FormGroup layout="responsive">
        <div className="sm:flex-1">
          <FormField
            label="نام"
            required
            errorMessage={(touched.firstName || showAllErrors) ? errors.firstName : undefined}
          >
            {(fieldProps) => (
              <Input
                {...fieldProps}
                name="firstName"
                autoComplete="given-name"
                value={customerInformation.firstName ?? ""}
                onChange={(event) => updateCustomerInformation({ firstName: event.target.value })}
                onBlur={() => markTouched("firstName")}
              />
            )}
          </FormField>
        </div>
        <div className="sm:flex-1">
          <FormField
            label="نام خانوادگی"
            required
            errorMessage={(touched.lastName || showAllErrors) ? errors.lastName : undefined}
          >
            {(fieldProps) => (
              <Input
                {...fieldProps}
                name="lastName"
                autoComplete="family-name"
                value={customerInformation.lastName ?? ""}
                onChange={(event) => updateCustomerInformation({ lastName: event.target.value })}
                onBlur={() => markTouched("lastName")}
              />
            )}
          </FormField>
        </div>
      </FormGroup>

      <FormGroup layout="responsive">
        <div className="sm:flex-1">
          <FormField
            label="شماره موبایل"
            required
            errorMessage={(touched.mobileNumber || showAllErrors) ? errors.mobileNumber : undefined}
          >
            {(fieldProps) => (
              <Input
                {...fieldProps}
                name="mobileNumber"
                autoComplete="tel"
                inputMode="tel"
                value={customerInformation.mobileNumber ?? ""}
                onChange={(event) =>
                  updateCustomerInformation({ mobileNumber: event.target.value })
                }
                onBlur={() => markTouched("mobileNumber")}
              />
            )}
          </FormField>
        </div>
        <div className="sm:flex-1">
          <FormField label="ایمیل (اختیاری)">
            {(fieldProps) => (
              <Input
                {...fieldProps}
                type="email"
                name="email"
                autoComplete="email"
                value={customerInformation.email ?? ""}
                onChange={(event) => updateCustomerInformation({ email: event.target.value })}
              />
            )}
          </FormField>
        </div>
      </FormGroup>
    </Card>
  );
}
