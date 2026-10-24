import { Metadata } from "next";
import Link from "next/link";
import { ImportMediaForm } from "@/features/admin/components/ImportMediaForm";
import { MediaGrid } from "@/features/admin/components/MediaGrid";

export const metadata: Metadata = {
  title: "کتابخانه عکس‌ها | پنل مدیریت",
};

export default function AdminMediaPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">کتابخانه عکس‌ها</h1>
        <Link href="/admin" className="text-blue-600 hover:underline">
          بازگشت به پنل
        </Link>
      </div>

      {/* بخش آپلود با لینک */}
      <section className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold mb-4">افزودن عکس از طریق لینک</h2>
        <ImportMediaForm />
      </section>

      {/* گالری عکس‌های موجود */}
      <section>
        <h2 className="text-lg font-semibold mb-4">عکس‌های موجود</h2>
        <MediaGrid />
      </section>
    </div>
  );
}
