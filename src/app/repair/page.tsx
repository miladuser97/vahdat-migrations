import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { AutoBreadcrumb } from "@/components/shared/AutoBreadcrumb";
import { RepairForm } from "@/features/repair/components/RepairForm";

export const metadata: Metadata = {
  title: "درخواست تعمیر گوشی",
  description: "ثبت درخواست تعمیر گوشی موبایل در موبایل وحدت",
};

export default function RepairPage() {
  return (
    <Container>
      <div className="pt-md sm:pt-lg">
        <AutoBreadcrumb />
      </div>

      <PageHeader 
        title="📱 درخواست تعمیر گوشی" 
        description="اگر گوشی شما مشکل دارد، درخواست خود را ثبت کنید تا کارشناسان ما در اسرع وقت با شما تماس بگیرند."
      />

      <Section>
        <RepairForm />
      </Section>
    </Container>
  );
}