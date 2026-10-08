import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { buttonVariants } from "@/components/ui/button-variants";

export const metadata: Metadata = {
  title: "صفحه پیدا نشد",
  description: "صفحه‌ی مورد نظر شما پیدا نشد.",
};

export default function NotFound() {
  return (
    <Container>
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 py-section text-center">
        <h1 className="text-h1 font-bold text-text-primary">
          صفحه پیدا نشد
        </h1>

        <p className="max-w-md text-body-lg text-text-secondary">
          صفحه‌ای که به دنبال آن بودید وجود ندارد یا جابه‌جا شده است.
        </p>

        <Link href="/" className={buttonVariants({ variant: "default", size: "md" })}>
          بازگشت به صفحه اصلی
        </Link>
      </div>
    </Container>
  );
}
