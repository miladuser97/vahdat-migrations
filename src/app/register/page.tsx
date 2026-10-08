import { Suspense } from "react";
import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { RegisterForm } from "@/features/account/components/RegisterForm";

export const metadata: Metadata = {
  title: "ثبت‌نام",
};

/**
 * Register page — same structure as /login (see that page's comment).
 */
export default function RegisterPage() {
  return (
    <Container>
      <div className="mx-auto flex max-w-md flex-col py-xl sm:py-2xl">
        <Suspense fallback={null}>
          <RegisterForm />
        </Suspense>
      </div>
    </Container>
  );
}
