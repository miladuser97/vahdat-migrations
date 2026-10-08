import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { ForgotPasswordForm } from "@/features/account/components/ForgotPasswordForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "فراموشی رمز عبور",
  description: "بازیابی رمز عبور حساب کاربری",
};

export default function ForgotPasswordPage() {
  return (
    <Container>
      <Breadcrumb
        items={[
          { label: "خانه", href: "/" },
          { label: "ورود", href: "/login" },
          { label: "فراموشی رمز عبور" },
        ]}
        className="mb-md sm:mb-lg"
      />
      <PageHeader
        title="فراموشی رمز عبور"
        description="شماره موبایل خود را وارد کنید تا کد بازیابی ارسال شود."
      />
      <Section>
        <div className="mx-auto max-w-md">
          <ForgotPasswordForm />
        </div>
      </Section>
    </Container>
  );
}