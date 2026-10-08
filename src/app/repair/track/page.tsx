import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { RepairTracking } from "@/features/repair/components/RepairTracking";

export const metadata: Metadata = {
  title: "پیگیری درخواست تعمیر",
  description: "پیگیری وضعیت درخواست تعمیر گوشی موبایل در موبایل وحدت",
};

export default function RepairTrackPage() {
  return (
    <Container>
      <Breadcrumb
        items={[
          { label: "خانه", href: "/" },
          { label: "درخواست تعمیر", href: "/repair" },
          { label: "پیگیری" },
        ]}
        className="mb-md sm:mb-lg"
      />

      <PageHeader 
        title="🔍 پیگیری درخواست تعمیر" 
        description="کد پیگیری خود را وارد کنید تا وضعیت درخواست تعمیر گوشی خود را مشاهده کنید."
      />

      <Section>
        <RepairTracking />
      </Section>
    </Container>
  );
}