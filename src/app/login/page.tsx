import { Suspense } from "react";
import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { LoginForm } from "@/features/account/components/LoginForm";

export const metadata: Metadata = {
  title: "ورود به حساب کاربری",
};

/**
 * Login page.
 *
 * Thin Server Component (keeps `metadata` exportable); LoginForm is
 * the Client Component boundary `useAuth()`/`useSearchParams()`
 * require. Wrapped in Suspense because `useSearchParams()` needs the
 * nearest Suspense boundary in the App Router (same pattern as
 * PaymentResultBanner on /checkout).
 */
export default function LoginPage() {
  return (
    <Container>
      <div className="mx-auto flex max-w-md flex-col py-xl sm:py-2xl">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </Container>
  );
}
