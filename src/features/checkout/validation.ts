import { required } from "@/utils/validation";
import type { OrderAddress, OrderCustomerInformation } from "@/features/orders/types";

/**
 * Centralized validation messages. One shared "required" message reused
 * everywhere a field is required, rather than the same string retyped
 * in every section (which is exactly the kind of duplication Phase
 * 12.5's cleanup, and later STORE_NOT_READY_MESSAGE/
 * CHECKOUT_SECTION_NOT_READY_MESSAGE, already established the pattern
 * of avoiding in this project).
 */
export const VALIDATION_MESSAGES = {
  required: "این فیلد الزامی است.",
} as const;

export type FieldErrors<TKey extends string> = Partial<Record<TKey, string>>;

/**
 * Checkout validation.
 *
 * Pure, UI-independent functions — no component, hook, or JSX in this
 * file. Each takes the relevant slice of CheckoutProvider's state and
 * returns which fields are missing, using the plain field names
 * (`firstName`, `province`, etc.) that CustomerInformationSection/
 * AddressSection already use — nothing here is duplicated inside those
 * components; they only call these functions and render the result.
 *
 * Reuses generic validation utilities from src/utils/validation.ts.
 * 
 * NOTE: validateCheckout is the formal validation gate used by 
 * CheckoutView to produce a ValidatedCheckoutState.
 */
export function validateCustomerInformation(
  info: Partial<OrderCustomerInformation>,
): FieldErrors<keyof OrderCustomerInformation> {
  const errors: FieldErrors<keyof OrderCustomerInformation> = {};
  if (!required(info.firstName)) errors.firstName = VALIDATION_MESSAGES.required;
  if (!required(info.lastName)) errors.lastName = VALIDATION_MESSAGES.required;
  if (!required(info.mobileNumber)) errors.mobileNumber = VALIDATION_MESSAGES.required;
  // email: optional, never validated.
  return errors;
}

export function validateAddress(address: Partial<OrderAddress>): FieldErrors<keyof OrderAddress> {
  const errors: FieldErrors<keyof OrderAddress> = {};
  if (!required(address.province)) errors.province = VALIDATION_MESSAGES.required;
  if (!required(address.city)) errors.city = VALIDATION_MESSAGES.required;
  if (!required(address.streetAddress)) errors.streetAddress = VALIDATION_MESSAGES.required;
  // postalCode, additionalDescription: optional, never validated.
  return errors;
}

/**
 * Shipping/payment method presence. Included for architectural
 * completeness (Phase 31 explicitly scopes "Shipping: required
 * selection" / "Payment: required selection"), but note: as of Phase
 * 30, ShippingSection/PaymentSection always display an effectively
 * selected option (a render-time fallback to the first method when
 * `shippingMethod`/`paymentMethod` is still `undefined` — see those
 * components' own doc comments). That means these two functions exist
 * and are correct, but there is no meaningful moment today where a
 * person looking at the page has "no selection" — so neither is wired
 * to any visible error UI yet (see ShippingSection/PaymentSection:
 * unchanged this phase).
 */
export function validateShippingMethod(shippingMethod: string | undefined): string | undefined {
  return shippingMethod ? undefined : VALIDATION_MESSAGES.required;
}

export function validatePaymentMethod(paymentMethod: string | undefined): string | undefined {
  return paymentMethod ? undefined : VALIDATION_MESSAGES.required;
}

/**
 * Validated Checkout State
 * 
 * Represents a checkout state that has passed all validation rules.
 * Required fields are guaranteed to be present and non-empty.
 */
export interface ValidatedCheckoutState {
  customerInformation: OrderCustomerInformation;
  address: OrderAddress;
  shippingMethod: string;
  paymentMethod: string;
}

/**
 * Validation Result
 */
export type ValidationResult =
  | { isValid: true; data: ValidatedCheckoutState }
  | {
      isValid: false;
      errors: {
        customerInformation: FieldErrors<keyof OrderCustomerInformation>;
        address: FieldErrors<keyof OrderAddress>;
        shippingMethod?: string;
        paymentMethod?: string;
      };
    };

/**
 * Full checkout validation.
 * 
 * Combines all individual section validations into one result.
 * If all sections are valid, returns the data cast to ValidatedCheckoutState.
 */
export function validateCheckout(
  customerInformation: Partial<OrderCustomerInformation>,
  address: Partial<OrderAddress>,
  shippingMethod: string | undefined,
  paymentMethod: string | undefined,
): ValidationResult {
  const customerErrors = validateCustomerInformation(customerInformation);
  const addressErrors = validateAddress(address);
  const shippingError = validateShippingMethod(shippingMethod);
  const paymentError = validatePaymentMethod(paymentMethod);

  const isValid =
    Object.keys(customerErrors).length === 0 &&
    Object.keys(addressErrors).length === 0 &&
    !shippingError &&
    !paymentError;

  if (isValid) {
    return {
      isValid: true,
      data: {
        customerInformation: customerInformation as OrderCustomerInformation,
        address: address as OrderAddress,
        shippingMethod: shippingMethod!,
        paymentMethod: paymentMethod!,
      },
    };
  }

  return {
    isValid: false,
    errors: {
      customerInformation: customerErrors,
      address: addressErrors,
      shippingMethod: shippingError,
      paymentMethod: paymentError,
    },
  };
}
