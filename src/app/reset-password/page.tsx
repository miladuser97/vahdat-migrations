import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { ResetPasswordForm } from "@/features/account/components/ResetPasswordForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "بازیابی رمز عبور",
  description: "تنظیم رمز عبور جدید",
};

export default function ResetPasswordPage() {
  return (
    <Container>
      <Breadcrumb
        items={[
          { label: "خانه", href: "/" },
          { label: "ورود", href: "/login" },
          { label: "بازیابی رمز عبور" },
        ]}
        className="mb-md sm:mb-lg"
      />
      <PageHeader
        title="بازیابی رمز عبور"
        description="کد دریافتی و رمز عبور جدید خود را وارد کنید."
      />
      <Section>
        <div className="mx-auto max-w-md">
          <Suspense fallback={null}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </Section>
    </Container>
  );
}