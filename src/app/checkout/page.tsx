import { Suspense } from "react";
import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { AutoBreadcrumb } from "@/components/shared/AutoBreadcrumb";
import { CheckoutProvider } from "@/features/checkout/CheckoutProvider";
import { CheckoutView } from "@/features/checkout/components/CheckoutView";
import { PaymentResultBanner } from "@/features/checkout/components/PaymentResultBanner";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "تسویه‌حساب",
};

export default function CheckoutPage() {
  return (
    <Container>
      <div className="pt-md sm:pt-lg">
        <AutoBreadcrumb />
      </div>

      <PageHeader title="تسویه‌حساب" />

      <Section>
        <Suspense fallback={null}>
          <PaymentResultBanner />
        </Suspense>
        <CheckoutProvider>
          <CheckoutView />
        </CheckoutProvider>
      </Section>
    </Container>
  );
}