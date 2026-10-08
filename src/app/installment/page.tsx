import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "خرید اقساطی",
  description:
    "خرید اقساطی موبایل و لپ‌تاپ در موبایل وحدت — با اسنپ‌پی (بدون چک و ضامن) یا اقساطی سنتی. شرایط آسان، تأیید سریع.",
  alternates: {
    canonical: "/installment",
  },
  openGraph: {
    title: "خرید اقساطی | موبایل وحدت",
    description: "خرید اقساطی موبایل و لپ‌تاپ با شرایط آسان و تأیید سریع.",
    type: "website",
  },
};

// ============================================================
// اطلاعات تماس
// ============================================================
const PHONE = "09127809720";
const WHATSAPP_LINK = `https://wa.me/989127809720?text=${encodeURIComponent(
  "سلام، درباره‌ی خرید اقساطی سوال داشتم."
)}`;

export default function InstallmentPage() {
  return (
    <Container>
      <PageHeader
        title="خرید اقساطی"
        description="خرید آسان موبایل، لپ‌تاپ و لوازم دیجیتال با پرداخت اقساطی — بدون دغدغه‌ی پرداخت یکجا."
      />

      {/* ========================================== */}
      {/* بخش ۱: دو روش خرید اقساطی */}
      {/* ========================================== */}
      <Section
        title="دو روش برای خرید اقساطی"
        description="بسته به نیاز و مبلغ خرید، می‌توانید یکی از این دو روش را انتخاب کنید."
      >
        <div className="grid gap-md md:grid-cols-2">
          {/* اسنپ‌پی */}
          <Card className="flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-success/10 text-2xl">
                  ⚡
                </div>
                <div>
                  <CardTitle>خرید با اسنپ‌پی</CardTitle>
                  <p className="text-caption text-success mt-1">
                    سریع‌ترین روش — بدون چک و ضامن
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-md flex-1">
              <ul className="flex flex-col gap-sm text-body-sm">
                <li className="flex items-start gap-2">
                  <span className="text-success shrink-0">✅</span>
                  <span>بدون نیاز به چک یا ضامن</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success shrink-0">✅</span>
                  <span>تأیید آنی و خودکار</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success shrink-0">✅</span>
                  <span>پرداخت در ۴ قسط</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success shrink-0">✅</span>
                  <span>بدون کارمزد اضافه</span>
                </li>
              </ul>

              <div className="rounded-lg bg-muted/50 p-3 mt-auto">
                <p className="text-caption text-text-secondary">
                  ⏳ این سرویس به‌زودی فعال می‌شود. برای اطلاع از زمان فعال‌سازی،
                  با ما در تماس باشید.
                </p>
              </div>

              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="default" className="w-full">
                  💬 اطلاع از زمان فعال‌سازی
                </Button>
              </a>
            </CardContent>
          </Card>

          {/* اقساطی سنتی */}
          <Card className="flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30 text-2xl">
                  📋
                </div>
                <div>
                  <CardTitle>خرید اقساطی سنتی</CardTitle>
                  <p className="text-caption text-brand-600 mt-1">
                    برای مبالغ بالا — با چک و ضامن
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-md flex-1">
              <ul className="flex flex-col gap-sm text-body-sm">
                <li className="flex items-start gap-2">
                  <span className="text-brand-600 shrink-0">✅</span>
                  <span>مناسب برای خریدهای بالای ۲۰ میلیون تومان</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-600 shrink-0">✅</span>
                  <span>با چک یا سفته و یک ضامن</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-600 shrink-0">✅</span>
                  <span>امکان تعیین اقساط ۶ تا ۲۴ ماهه</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-600 shrink-0">✅</span>
                  <span>مشاوره‌ی رایگان حضوری یا تلفنی</span>
                </li>
              </ul>

              <div className="rounded-lg bg-muted/50 p-3 mt-auto">
                <p className="text-caption text-text-secondary">
                  💡 برای اطلاع از شرایط دقیق و محاسبه‌ی اقساط، با ما تماس بگیرید.
                </p>
              </div>

              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="default" className="w-full">
                  💬 مشاوره‌ی رایگان
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* ========================================== */}
      {/* بخش ۲: مدارک لازم */}
      {/* ========================================== */}
      <Section
        title="مدارک لازم برای خرید اقساطی"
        description="برای تسریع در فرآیند، این مدارک را همراه داشته باشید."
      >
        <Card>
          <CardContent className="pt-4">
            <ul className="flex flex-col gap-sm text-body">
              <li className="flex items-start gap-2">
                <span className="text-brand-600 shrink-0">📄</span>
                <span>اصل کارت ملی</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-600 shrink-0">📄</span>
                <span>اصل شناسنامه</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-600 shrink-0">📄</span>
                <span>یک فقره چک یا سفته به مبلغ کل خرید</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-600 shrink-0">📄</span>
                <span>یک ضامن معتبر با مدارک شناسایی</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-600 shrink-0">📄</span>
                <span>فیش حقوقی یا جواز کسب (در صورت نیاز)</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </Section>

      {/* ========================================== */}
      {/* بخش ۳: مراحل خرید اقساطی */}
      {/* ========================================== */}
      <Section
        title="مراحل خرید اقساطی"
        description="فرآیند خرید اقساطی در موبایل وحدت در ۴ مرحله‌ی ساده"
      >
        <div className="grid gap-md sm:grid-cols-2 lg:grid-cols-4">
          <Card className="flex flex-col gap-sm p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white font-bold fa-num">
              ۱
            </div>
            <h3 className="text-body font-bold text-text-primary">
              انتخاب محصول
            </h3>
            <p className="text-body-sm text-text-secondary">
              محصول موردنظر خود را از فروشگاه انتخاب کنید یا با کارشناسان ما
              مشورت بگیرید.
            </p>
          </Card>

          <Card className="flex flex-col gap-sm p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white font-bold fa-num">
              ۲
            </div>
            <h3 className="text-body font-bold text-text-primary">
              تماس و مشاوره
            </h3>
            <p className="text-body-sm text-text-secondary">
              با پشتیبانی تماس بگیرید تا شرایط، مبلغ اقساط و تعداد آن مشخص شود.
            </p>
          </Card>

          <Card className="flex flex-col gap-sm p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white font-bold fa-num">
              ۳
            </div>
            <h3 className="text-body font-bold text-text-primary">
              ارائه‌ی مدارک
            </h3>
            <p className="text-body-sm text-text-secondary">
              مدارک لازم را به فروشگاه ارائه دهید تا فرآیند اعتبارسنجی انجام شود.
            </p>
          </Card>

          <Card className="flex flex-col gap-sm p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white font-bold fa-num">
              ۴
            </div>
            <h3 className="text-body font-bold text-text-primary">
              تحویل محصول
            </h3>
            <p className="text-body-sm text-text-secondary">
              پس از تأیید نهایی، محصول تحویل داده می‌شود و اقساط شروع می‌گردد.
            </p>
          </Card>
        </div>
      </Section>

      {/* ========================================== */}
      {/* بخش ۴: چرا خرید اقساطی از ما؟ */}
      {/* ========================================== */}
      <Section
        title="چرا خرید اقساطی از موبایل وحدت؟"
        description="مزایای خرید اقساطی از فروشگاه ما"
      >
        <div className="grid gap-md sm:grid-cols-2 lg:grid-cols-3">
          <Card className="flex flex-col gap-sm p-4 text-center">
            <span className="text-3xl">💰</span>
            <h3 className="text-body font-bold text-text-primary">
              بدون سود پنهان
            </h3>
            <p className="text-body-sm text-text-secondary">
              شرایط شفاف و بدون هزینه‌های اضافی و پنهان
            </p>
          </Card>

          <Card className="flex flex-col gap-sm p-4 text-center">
            <span className="text-3xl">🚀</span>
            <h3 className="text-body font-bold text-text-primary">
              تأیید سریع
            </h3>
            <p className="text-body-sm text-text-secondary">
              بررسی و تأیید درخواست‌ها در کمترین زمان ممکن
            </p>
          </Card>

          <Card className="flex flex-col gap-sm p-4 text-center">
            <span className="text-3xl">🛡️</span>
            <h3 className="text-body font-bold text-text-primary">
              ضمانت اصالت
            </h3>
            <p className="text-body-sm text-text-secondary">
              همه‌ی محصولات با گارانتی معتبر و ضمانت اصالت کالا
            </p>
          </Card>

          <Card className="flex flex-col gap-sm p-4 text-center">
            <span className="text-3xl">📞</span>
            <h3 className="text-body font-bold text-text-primary">
              مشاوره‌ی رایگان
            </h3>
            <p className="text-body-sm text-text-secondary">
              کارشناسان ما در انتخاب بهترین گزینه کمکتان می‌کنند
            </p>
          </Card>

          <Card className="flex flex-col gap-sm p-4 text-center">
            <span className="text-3xl">🔄</span>
            <h3 className="text-body font-bold text-text-primary">
              انعطاف در اقساط
            </h3>
            <p className="text-body-sm text-text-secondary">
              امکان تعیین تعداد و مبلغ اقساط بر اساس شرایط شما
            </p>
          </Card>

          <Card className="flex flex-col gap-sm p-4 text-center">
            <span className="text-3xl">✨</span>
            <h3 className="text-body font-bold text-text-primary">
              خدمات پس از فروش
            </h3>
            <p className="text-body-sm text-text-secondary">
              پشتیبانی کامل در طول دوره‌ی اقساط و بعد از آن
            </p>
          </Card>
        </div>
      </Section>

      {/* ========================================== */}
      {/* بخش ۵: CTA تماس */}
      {/* ========================================== */}
      <Section>
        <Card className="p-6 sm:p-8 text-center bg-gradient-to-br from-brand-600 to-brand-800 text-white border-0">
          <h2 className="text-h3 font-bold mb-3">
            آماده‌ی خرید اقساطی هستید؟
          </h2>
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">
            برای مشاوره‌ی رایگان و اطلاع از شرایط دقیق، همین حالا با ما تماس
            بگیرید. کارشناسان ما در کمترین زمان پاسخگوی شما خواهند بود.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href={`tel:${PHONE}`}>
              <Button
                variant="default"
                size="lg"
                className="bg-white text-brand-700 hover:bg-white/90"
              >
                📞 تماس: <span className="fa-num">{PHONE}</span>
              </Button>
            </a>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                size="lg"
                className="bg-white/10 text-white border-white/30 hover:bg-white/20"
              >
                💬 چت واتساپ
              </Button>
            </a>
          </div>
        </Card>
      </Section>

      {/* ========================================== */}
      {/* بخش ۶: لینک به سوالات متداول */}
      {/* ========================================== */}
      <Section>
        <div className="text-center">
          <p className="text-body-sm text-text-secondary">
            سوال بیشتری دارید؟{" "}
            <Link
              href="/faq"
              className="text-brand-600 hover:underline font-medium"
            >
              سوالات متداول
            </Link>{" "}
            را ببینید یا{" "}
            <Link
              href="/contact"
              className="text-brand-600 hover:underline font-medium"
            >
              با ما تماس بگیرید
            </Link>
            .
          </p>
        </div>
      </Section>
    </Container>
  );
}