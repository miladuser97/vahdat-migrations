import { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { getAddressesAction } from "@/lib/server/account-actions";
import { AddressList } from "@/features/account/components/AddressList";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "آدرس‌های من",
};

export default async function AddressesPage() {
  const result = await getAddressesAction();

  if (!result.success) {
    return (
      <Card>
        <p className="text-body-sm text-error">
          {result.error || "بارگذاری آدرس‌ها با خطا مواجه شد."}
        </p>
      </Card>
    );
  }

  // ✅ اصلاح: اگر data undefined بود، آرایه خالی برگردون
  return <AddressList initialAddresses={result.data || []} />;
}