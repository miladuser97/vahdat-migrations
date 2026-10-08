"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { buttonVariants } from "@/components/ui/button-variants";
import { EmptyState } from "@/components/shared/EmptyState";
import { useCart } from "@/features/cart/CartProvider";
import { useCheckout } from "@/features/checkout/CheckoutProvider";
import { CheckoutSectionPlaceholder } from "@/features/checkout/components/CheckoutSectionPlaceholder";
import { CustomerInformationSection } from "@/features/checkout/components/CustomerInformationSection";
import { AddressSection } from "@/features/checkout/components/AddressSection";
import { ShippingSection } from "@/features/checkout/components/ShippingSection";
import { PaymentSection } from "@/features/checkout/components/PaymentSection";
import { OrderReviewSection } from "@/features/checkout/components/OrderReviewSection";
import { ReviewConfirmation } from "@/features/checkout/components/ReviewConfirmation";
import { SITE_FEATURES } from "@/config/features";
import { validateCheckout } from "@/features/checkout/validation";
import { buildOrder } from "@/features/orders/buildOrder";

/**
 * CheckoutView
 * Reads the shared cart state directly (useCart) — the same single
 * source of truth the cart page and Header use.
 * 
 * Phase 42: Integrated a real frontend-only review flow. Users
 * complete the form, validation is triggered, and if successful, 
 * the view switches to a ReviewConfirmation step.
 */
export function CheckoutView() {
  const { items } = useCart();
  const checkout = useCheckout();
  const [step, setStep] = useState<"form" | "review">("form");

  if (items.length === 0) {
    return (
      <EmptyState
        title="سبد خرید شما خالی است"
        action={
          <Link href="/products" className={buttonVariants({ variant: "default", size: "md" })}>
            مشاهده‌ی محصولات
          </Link>
        }
      />
    );
  }

  const handleProceedToReview = () => {
    const result = validateCheckout(
      checkout.customerInformation,
      checkout.address,
      checkout.shippingMethod,
      checkout.paymentMethod
    );

    if (result.isValid) {
      checkout.setShowAllErrors(false);
      setStep("review");
      // Scroll to top
      window.scrollTo(0, 0);
    } else {
      checkout.setShowAllErrors(true);
    }
  };

  if (step === "review") {
    const order = buildOrder(
      {
        customerInformation: checkout.customerInformation,
        address: checkout.address,
        shippingMethod: checkout.shippingMethod,
        paymentMethod: checkout.paymentMethod,
      },
      items
    );
    return <ReviewConfirmation order={order} onBack={() => setStep("form")} />;
  }

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex flex-col gap-lg lg:flex-row lg:items-start lg:gap-xl">
        <div className="flex min-w-0 flex-1 flex-col gap-md">
          {SITE_FEATURES.checkout.customerForm.enabled ? (
            <CustomerInformationSection />
          ) : (
            <CheckoutSectionPlaceholder title="اطلاعات مشتری" />
          )}
          {SITE_FEATURES.checkout.addressForm.enabled && <AddressSection />}
          {SITE_FEATURES.checkout.shippingOptions.enabled ? (
            <ShippingSection />
          ) : (
            <CheckoutSectionPlaceholder title="ارسال" />
          )}
          {SITE_FEATURES.checkout.paymentMethods.enabled ? (
            <PaymentSection />
          ) : (
            <CheckoutSectionPlaceholder title="پرداخت" />
          )}
        </div>

        <div className="flex flex-col gap-md lg:sticky lg:top-lg lg:w-80 lg:shrink-0 lg:self-start">
          <OrderReviewSection items={items} />
          <Button variant="default" size="lg" className="w-full" onClick={handleProceedToReview}>
            تأیید نهایی اطلاعات
          </Button>
        </div>
      </div>
    </div>
  );
}