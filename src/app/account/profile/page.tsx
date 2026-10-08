import { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { getProfileAction } from "@/lib/server/account-actions";
import { ProfileForm } from "@/features/account/components/ProfileForm";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "پروفایل کاربری",
};

/**
 * Profile Page
 *
 * Phase 6: replaces the "این بخش در نسخه‌های بعدی... تکمیل خواهد شد"
 * placeholder. AccountLayoutClient already guarantees an authenticated
 * session reaches here; getProfileAction independently re-verifies
 * that server-side (same defense-in-depth pattern used throughout
 * Phase 4's admin actions) rather than trusting the layout alone.
 */
export default async function ProfilePage() {
  const result = await getProfileAction();

  // ✅ اصلاح: بررسی success و وجود data
  if (!result.success) {
    return (
      <Card>
        <p className="text-body-sm text-error">
          {result.error || "بارگذاری اطلاعات کاربری با خطا مواجه شد."}
        </p>
      </Card>
    );
  }

  if (!result.data) {
    return (
      <Card>
        <p className="text-body-sm text-error">
          اطلاعات کاربری یافت نشد.
        </p>
      </Card>
    );
  }

  return (
    <ProfileForm
      initialProfile={{
        firstName: result.data.firstName,
        lastName: result.data.lastName,
        email: result.data.email || "",
        mobileNumber: result.data.mobileNumber,
      }}
    />
  );
}