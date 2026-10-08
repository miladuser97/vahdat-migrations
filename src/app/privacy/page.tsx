import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { Card, CardContent } from "@/components/ui/Card";
import { AutoBreadcrumb } from "@/components/shared/AutoBreadcrumb";

export const metadata: Metadata = {
  title: "حریم خصوصی",
  description:
    "سیاست حریم خصوصی موبایل وحدت — نحوه‌ی جمع‌آوری، استفاده و حفاظت از اطلاعات شخصی کاربران.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "حریم خصوصی | موبایل وحدت",
    description: "سیاست حریم خصوصی و حفاظت از اطلاعات کاربران موبایل وحدت.",
    type: "website",
  },
};

const LAST_UPDATED = "۱۴۰۴/۰۷/۱۳";

export default function PrivacyPage() {
  return (
    <Container>
      <div className="pt-md sm:pt-lg">
        <AutoBreadcrumb />
      </div>

      <PageHeader
        title="حریم خصوصی"
        description={`آخرین به‌روزرسانی: ${LAST_UPDATED}`}
      />

      <Section>
        <Card>
          <CardContent className="pt-4">
            <p className="text-body-sm text-text-secondary leading-relaxed">
              موبایل وحدت به حفاظت از اطلاعات شخصی شما متعهد است. این سند
              توضیح می‌دهد که چه اطلاعاتی جمع‌آوری می‌شود، چگونه استفاده
              می‌شود و شما چه حقوقی نسبت به آن دارید. با استفاده از خدمات ما،
              با این سیاست موافقت می‌کنید.
            </p>
          </CardContent>
        </Card>
      </Section>

      {/* ۱. اطلاعاتی که جمع‌آوری می‌شود */}
      <Section title="۱. اطلاعاتی که جمع‌آوری می‌شود">
        <div className="flex flex-col gap-sm text-body text-text-secondary leading-relaxed">
          <p>
            <strong className="text-text-primary">
              ۱.۱. اطلاعاتی که خودتان ارائه می‌دهید
            </strong>
          </p>
          <ul className="flex flex-col gap-xs ps-6 list-disc">
            <li>
              <strong>اطلاعات هویتی:</strong> نام، نام خانوادگی، شماره موبایل
            </li>
            <li>
              <strong>اطلاعات تماس:</strong> آدرس پستی، شماره تلفن ثابت (اختیاری)
            </li>
            <li>
              <strong>اطلاعات سفارش:</strong> جزئیات محصولات خریداری‌شده،
              تاریخ سفارش، مبلغ
            </li>
            <li>
              <strong>اطلاعات پرداخت:</strong> شماره تراکنش (اطلاعات کارت
              بانکی شما نزد درگاه پرداخت ذخیره می‌شود، نه ما)
            </li>
          </ul>

          <p className="mt-2">
            <strong className="text-text-primary">
              ۱.۲. اطلاعاتی که خودکار جمع‌آوری می‌شود
            </strong>
          </p>
          <ul className="flex flex-col gap-xs ps-6 list-disc">
            <li>
              <strong>اطلاعات دستگاه:</strong> نوع مرورگر، سیستم‌عامل، اندازه‌ی
              صفحه
            </li>
            <li>
              <strong>آدرس IP:</strong> برای امنیت و جلوگیری از تقلب
            </li>
            <li>
              <strong>کوکی‌ها:</strong> برای حفظ وضعیت ورود و سبد خرید
            </li>
            <li>
              <strong>اطلاعات استفاده:</strong> صفحات بازدیدشده، مدت زمان
              حضور، محصولات مشاهده‌شده
            </li>
          </ul>
        </div>
      </Section>

      {/* ۲. نحوه‌ی استفاده */}
      <Section title="۲. نحوه‌ی استفاده از اطلاعات">
        <div className="flex flex-col gap-sm text-body text-text-secondary leading-relaxed">
          <p>از اطلاعات شما برای موارد زیر استفاده می‌کنیم:</p>
          <ul className="flex flex-col gap-xs ps-6 list-disc">
            <li>
              <strong>پردازش و ارسال سفارش‌ها:</strong> تأیید سفارش، هماهنگی
              ارسال، پیگیری تحویل
            </li>
            <li>
              <strong>ارتباط با شما:</strong> اطلاع‌رسانی درباره‌ی وضعیت سفارش،
              پاسخ به سوالات
            </li>
            <li>
              <strong>بهبود خدمات:</strong> تحلیل رفتار کاربران برای بهبود
              تجربه‌ی خرید
            </li>
            <li>
              <strong>امنیت:</strong> جلوگیری از تقلب، سوءاستفاده و حملات
              سایبری
            </li>
            <li>
              <strong>تبلیغات هدفمند:</strong> نمایش پیشنهادات مرتبط با
              علاقه‌مندی‌های شما (با امکان لغو)
            </li>
            <li>
              <strong>رعایت قوانین:</strong> پاسخ به مراجع قانونی در صورت
              درخواست رسمی
            </li>
          </ul>
        </div>
      </Section>

      {/* ۳. کوکی‌ها */}
      <Section title="۳. کوکی‌ها">
        <div className="flex flex-col gap-sm text-body text-text-secondary leading-relaxed">
          <p>
            کوکی‌ها فایل‌های کوچکی هستند که در مرورگر شما ذخیره می‌شوند و به
            ما کمک می‌کنند تجربه‌ی بهتری ارائه دهیم.
          </p>

          <p className="mt-2">
            <strong className="text-text-primary">انواع کوکی‌های ما:</strong>
          </p>
          <ul className="flex flex-col gap-xs ps-6 list-disc">
            <li>
              <strong>کوکی‌های ضروری:</strong> برای ورود به حساب، حفظ سبد خرید
              و امنیت سایت (قابل غیرفعال‌سازی نیستند)
            </li>
            <li>
              <strong>کوکی‌های عملکردی:</strong> برای به‌خاطر سپردن تنظیمات
              شما (زبان، تم روشن/تیره)
            </li>
            <li>
              <strong>کوکی‌های تحلیلی:</strong> برای آمار بازدید و بهبود سایت
              (مثل Google Analytics)
            </li>
            <li>
              <strong>کوکی‌های تبلیغاتی:</strong> برای نمایش تبلیغات مرتبط
            </li>
          </ul>

          <p className="mt-2">
            <strong className="text-text-primary">
              مدیریت کوکی‌ها:
            </strong>{" "}
            شما می‌توانید از طریق تنظیمات مرورگر خود، کوکی‌ها را مدیریت یا
            حذف کنید. توجه داشته باشید که غیرفعال کردن کوکی‌های ضروری، باعث
            اختلال در عملکرد سایت می‌شود.
          </p>
        </div>
      </Section>

      {/* ۴. اشتراک‌گذاری */}
      <Section title="۴. اشتراک‌گذاری اطلاعات با اشخاص ثالث">
        <div className="flex flex-col gap-sm text-body text-text-secondary leading-relaxed">
          <p>
            <strong className="text-text-primary">
              ما اطلاعات شخصی شما را نمی‌فروشیم.
            </strong>{" "}
            اما در موارد زیر ممکن است اطلاعات را با اشخاص ثالث به اشتراک
            بگذاریم:
          </p>
          <ul className="flex flex-col gap-xs ps-6 list-disc">
            <li>
              <strong>شرکت‌های حمل و نقل:</strong> برای ارسال سفارش (نام، آدرس،
              شماره تماس)
            </li>
            <li>
              <strong>درگاه‌های پرداخت:</strong> برای پردازش تراکنش (زرین‌پال،
              اسنپ‌پی)
            </li>
            <li>
              <strong>سرویس‌های پیامکی:</strong> برای ارسال کد تأیید و اطلاع‌رسانی
            </li>
            <li>
              <strong>سرویس‌های تحلیلی:</strong> برای آمار بازدید (Google
              Analytics، Vercel Analytics)
            </li>
            <li>
              <strong>مراجع قانونی:</strong> در صورت درخواست رسمی و مطابق قانون
            </li>
          </ul>
          <p className="mt-2">
            همه‌ی این سرویس‌ها متعهد به حفظ محرمانگی اطلاعات شما هستند.
          </p>
        </div>
      </Section>

      {/* ۵. امنیت */}
      <Section title="۵. امنیت اطلاعات">
        <div className="flex flex-col gap-sm text-body text-text-secondary leading-relaxed">
          <p>
            ما از روش‌های امنیتی استاندارد برای حفاظت از اطلاعات شما استفاده
            می‌کنیم:
          </p>
          <ul className="flex flex-col gap-xs ps-6 list-disc">
            <li>استفاده از پروتکل HTTPS و رمزنگاری SSL در تمام ارتباطات</li>
            <li>ذخیره‌ی رمز عبور به‌صورت هش‌شده (bcrypt)</li>
            <li>عدم ذخیره‌ی اطلاعات کارت بانکی در سرورهای ما</li>
            <li>دسترسی محدود کارمندان به اطلاعات کاربران</li>
            <li>پشتیبان‌گیری منظم از اطلاعات</li>
          </ul>
          <p className="mt-2">
            با این وجود، هیچ سیستمی ۱۰۰٪ امن نیست. در صورت بروز هرگونه
            رخداد امنیتی، بلافاصله به شما اطلاع‌رسانی خواهیم کرد.
          </p>
        </div>
      </Section>

      {/* ۶. حقوق کاربران */}
      <Section title="۶. حقوق کاربران">
        <div className="flex flex-col gap-sm text-body text-text-secondary leading-relaxed">
          <p>شما نسبت به اطلاعات شخصی خود این حقوق را دارید:</p>
          <ul className="flex flex-col gap-xs ps-6 list-disc">
            <li>
              <strong>حق دسترسی:</strong> مشاهده‌ی اطلاعاتی که از شما ذخیره
              کرده‌ایم
            </li>
            <li>
              <strong>حق اصلاح:</strong> ویرایش اطلاعات نادرست یا قدیمی (از
              طریق پروفایل کاربری)
            </li>
            <li>
              <strong>حق حذف:</strong> درخواست حذف حساب کاربری و اطلاعات
              مرتبط (با رعایت تعهدات قانونی)
            </li>
            <li>
              <strong>حق اعتراض:</strong> اعتراض به استفاده از اطلاعات برای
              تبلیغات
            </li>
            <li>
              <strong>حق انتقال:</strong> دریافت اطلاعات خود در قالب فایل
              قابل خواندن
            </li>
          </ul>
          <p className="mt-2">
            برای اعمال هر یک از این حقوق، با پشتیبانی تماس بگیرید.
          </p>
        </div>
      </Section>

      {/* ۷. مدت نگهداری */}
      <Section title="۷. مدت نگهداری اطلاعات">
        <div className="flex flex-col gap-sm text-body text-text-secondary leading-relaxed">
          <ul className="flex flex-col gap-xs ps-6 list-disc">
            <li>
              <strong>اطلاعات حساب کاربری:</strong> تا زمانی که حساب فعال است
            </li>
            <li>
              <strong>اطلاعات سفارش‌ها:</strong> حداقل ۵ سال (طبق قوانین
              مالیاتی و تجاری)
            </li>
            <li>
              <strong>اطلاعات پیامک‌ها و ایمیل‌ها:</strong> تا ۱ سال پس از
              ارسال
            </li>
            <li>
              <strong>کوکی‌ها:</strong> بسته به نوع کوکی (بین ۱ روز تا ۱ سال)
            </li>
          </ul>
        </div>
      </Section>

      {/* ۸. کودکان */}
      <Section title="۸. اطلاعات کودکان">
        <div className="flex flex-col gap-sm text-body text-text-secondary leading-relaxed">
          <p>
            خدمات ما برای افراد زیر ۱۸ سال طراحی نشده است. ما به‌صورت آگاهانه
            اطلاعات شخصی کودکان را جمع‌آوری نمی‌کنیم. اگر متوجه شدید که
            کودکی اطلاعاتی برای ما ارسال کرده، لطفاً با ما تماس بگیرید تا
            حذف کنیم.
          </p>
        </div>
      </Section>

      {/* ۹. تغییرات */}
      <Section title="۹. تغییرات در سیاست حریم خصوصی">
        <div className="flex flex-col gap-sm text-body text-text-secondary leading-relaxed">
          <p>
            ما حق به‌روزرسانی این سیاست را در هر زمان محفوظ می‌دانیم. تغییرات
            مهم از طریق پیامک یا اعلان در سایت به شما اطلاع داده
            می‌شود. تاریخ آخرین به‌روزرسانی در بالای این صفحه ذکر شده است.
          </p>
        </div>
      </Section>

      {/* ۱۰. تماس */}
      <Section title="۱۰. تماس برای مسائل حریم خصوصی">
        <div className="flex flex-col gap-sm text-body text-text-secondary leading-relaxed">
          <p>
            در صورت داشتن هرگونه سوال، نگرانی یا شکایت درباره‌ی نحوه‌ی
            مدیریت اطلاعات شخصی شما، لطفاً با ما در تماس باشید:
          </p>
          <ul className="flex flex-col gap-xs ps-6 list-disc">
            <li>
              تلفن:{" "}
              <a
                href="tel:09127809720"
                className="text-brand-600 hover:underline fa-num"
                dir="ltr"
              >
                ۰۹۱۲۷۸۰۹۷۲۰
              </a>
            </li>
            <li>آدرس: قزوین، غیاث آباد، خیابان ساحل، جنب درمانگاه صدرا</li>
            <li>
              اینستاگرام:{" "}
              <a
                href="https://www.instagram.com/mobile.vahdat"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 hover:underline"
                dir="ltr"
              >
                @mobile.vahdat
              </a>
            </li>
          </ul>
          <p className="mt-2">
            ما تلاش می‌کنیم در کمترین زمان ممکن (حداکثر ۷ روز کاری) به
            درخواست‌های شما پاسخ دهیم.
          </p>
        </div>
      </Section>

      <Section>
        <Card className="border-brand-300/50 bg-brand-50/50 dark:bg-brand-950/20">
          <CardContent className="pt-4">
            <p className="text-body-sm text-text-secondary leading-relaxed">
              📌 برای اطلاع از قوانین خرید و استفاده از خدمات، به{" "}
              <Link
                href="/terms"
                className="text-brand-600 hover:underline font-medium"
              >
                شرایط و مقررات
              </Link>{" "}
              مراجعه کنید.
            </p>
          </CardContent>
        </Card>
      </Section>
    </Container>
  );
}