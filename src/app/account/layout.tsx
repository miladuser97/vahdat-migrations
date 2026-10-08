import { Container } from "@/components/layout/Container";
import { AccountLayoutClient } from "@/features/account/components/AccountLayoutClient";

/**
 * Account Layout
 *
 * Phase 3: delegates the auth gate + sidebar + page chrome to
 * AccountLayoutClient (a Client Component, since it reads the real
 * AuthContext session state) — this file stays a Server Component
 * shell so nothing here blocks static analysis of `/account/*`
 * metadata exports in each page.
 */
export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Container>
      <AccountLayoutClient>{children}</AccountLayoutClient>
    </Container>
  );
}
