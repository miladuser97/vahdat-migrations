import { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { AutoBreadcrumb } from "@/components/shared/AutoBreadcrumb";
import { AccountDashboard } from "@/features/account/components/AccountDashboard";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "پیشخوان حساب کاربری",
};

export default function AccountPage() {
  return (
    <Container>
      <div className="pt-md sm:pt-lg">
        <AutoBreadcrumb />
      </div>
      <AccountDashboard />
    </Container>
  );
}