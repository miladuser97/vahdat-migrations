import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { AutoBreadcrumb } from "@/components/shared/AutoBreadcrumb";
import { CartView } from "@/features/cart/components/CartView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "سبد خرید",
};

export default function CartPage() {
  return (
    <Container>
      <div className="pt-md sm:pt-lg">
        <AutoBreadcrumb />
      </div>

      <PageHeader title="سبد خرید" />

      <Section>
        <CartView />
      </Section>
    </Container>
  );
}