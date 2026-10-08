import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { Card, CardContent } from "@/components/ui/Card";
import { AutoBreadcrumb } from "@/components/shared/AutoBreadcrumb";

export const metadata: Metadata = {
  title: "شرایط و مقررات",
  description:
    "شرایط و مقررات استفاده از خدمات و وب‌سایت موبایل وحدت — قوانین خرید، پرداخت، ارسال، گارانتی و مرجوعی.",
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: "شرایط و مقررات | موبایل وحدت",
    description: "شرایط و مقررات استفاده از خدمات موبایل وحدت.",
    type: "website",
  },
};

const LAST_UPDATED = "۱۴۰۴/۰۷/۱۳";

export default function TermsPage() {
  return (
    <Container>
      <div className="pt-md sm:pt-lg">
        <AutoBreadcrumb />
      </div>

      <PageHeader
        title="شرایط و مقررات"
        description={`آخرین به‌روزرسانی: ${LAST_UPDATED}`}
      />

      <Section>
        <Card>
          <CardContent className="pt-4">
            <p className="text-body-sm text-text-secondary leading-relaxed">
              لطفاً پیش از استفاده از خدمات وب‌سایت <strong>موبایل وحدت</strong>،
              این شرایط و مقررات را به دقت مطالعه کنید. استفاده از خدمات ما
              به معنی پذیرش کامل این شرایط است.
            </p>
          </CardContent>
        </Card>
      </Section>

      {/* ۱. پذیرش شرایط */}
      <Section title="۱. پذیرش شرایط">
        <div className="flex flex-col gap-sm text-body text-text-secondary leading-relaxed">
          <p>
            با ورود به وب‌سایت موبایل وحدت و استفاده از خدمات آن، شما تأیید
            می‌کنید که:
          </p>
          <ul className="flex flex-col gap-xs ps-6 list-disc">
            <li>حداقل ۱۸ سال سن دارید یا با اجازه‌ی سرپرست قانونی خود خرید می‌کنید.</li>
            <li>اطلاعات هویتی و تماس ارائه‌شده‌ی شما صحیح و به‌روز است.</li>
            <li>این شرایط و مقررات را مطالعه کرده و می‌پذیرید.</li>
            <li>استفاده از سایت به هیچ منظور غیرقانونی یا سوءاستفاده نخواهد بود.</li>
          </ul>
          <p>
            موبایل وحدت حق دارد در صورت مشاهده‌ی هرگونه تخلف، دسترسی کاربر را
            به‌صورت موقت یا دائم مسدود کند.
          </p>
        </div>
      </Section>

      {/* ۲. استفاده مجاز */}
      <Section title="۲. استفاده‌ی مجاز از سایت">
        <div className="flex flex-col gap-sm text-body text-text-secondary leading-relaxed">
          <p>شما متعهد می‌شوید از سایت و خدمات ما صرفاً برای اهداف قانونی و شخصی استفاده کنید. موارد زیر ممنوع است:</p>
          <ul className="flex flex-col gap-xs ps-6 list-disc">
            <li>هرگونه تلاش برای نفوذ، هک یا اخلال در عملکرد سایت.</li>
            <li>استفاده از ربات، اسکریپت یا ابزار خودکار برای استخراج اطلاعات (Scraping).</li>
            <li>کپی‌برداری از محتوا، تصاویر و اطلاعات محصولات بدون اجازه‌ی کتبی.</li>
            <li>ارسال محتوای توهین‌آمیز، غیرقانونی یا ناقض حقوق دیگران در نظرات.</li>
            <li>استفاده از اطلاعات تماس دیگران برای اهداف تبلیغاتی یا مزاحمت.</li>
          </ul>
        </div>
      </Section>

      {/* ۳. محصولات و قیمت‌گذاری */}
      <Section title="۳. محصولات و قیمت‌گذاری">
        <div className="flex flex-col gap-sm text-body text-text-secondary leading-relaxed">
          <p>
            تمامی محصولات عرضه‌شده در موبایل وحدت، اورجینال و دارای گارانتی
            معتبر شرکتی هستند. اطلاعات محصولات (شامل مشخصات فنی، تصاویر و
            توضیحات) به‌صورت دقیق درج می‌شود.
          </p>
          <p>
            <strong className="text-text-primary">نکات مهم درباره‌ی قیمت‌ها:</strong>
          </p>
          <ul className="flex flex-col gap-xs ps-6 list-disc">
            <li>
              قیمت‌ها بر اساس نرخ روز بازار تعیین می‌شوند و ممکن است بدون اطلاع
              قبلی تغییر کنند.
            </li>
            <li>
              در صورت تغییر قیمت پس از ثبت سفارش و پیش از پرداخت، همکاران ما
              با شما تماس گرفته و مبلغ جدید را اعلام می‌کنند.
            </li>
            <li>
              در صورت مغایرت قیمت درج‌شده با قیمت واقعی (به‌دلیل خطای فنی)،
              موبایل وحدت حق لغو سفارش و بازگشت مبلغ پرداختی را دارد.
            </li>
            <li>
              تصاویر محصولات ممکن است با محصول واقعی تفاوت‌های جزئی داشته
              باشند (به‌دلیل کیفیت نمایش).
            </li>
          </ul>
        </div>
      </Section>

      {/* ۴. ثبت سفارش و پرداخت */}
      <Section title="۴. ثبت سفارش و پرداخت">
        <div className="flex flex-col gap-sm text-body text-text-secondary leading-relaxed">
          <p>
            <strong className="text-text-primary">۴.۱. ثبت سفارش</strong>
          </p>
          <ul className="flex flex-col gap-xs ps-6 list-disc">
            <li>سفارش شما پس از تأیید نهایی و پرداخت، قابل پیگیری خواهد بود.</li>
            <li>
              کد پیگیری سفارش (مثل R-12345678) پس از ثبت به شما اعلام می‌شود.
            </li>
            <li>
              موبایل وحدت حق دارد در صورت عدم موجودی، سفارش را لغو و مبلغ را
              بازگرداند.
            </li>
          </ul>

          <p className="mt-2">
            <strong className="text-text-primary">۴.۲. روش‌های پرداخت</strong>
          </p>
          <ul className="flex flex-col gap-xs ps-6 list-disc">
            <li>پرداخت آنلاین از طریق درگاه معتبر زرین‌پال</li>
            <li>پرداخت در محل (برای شهر قزوین و شهرهای اطراف)</li>
            <li>کارت به کارت (با تأیید از پشتیبانی)</li>
            <li>
              خرید اقساطی از طریق اسنپ‌پی یا اقساطی سنتی (با چک و ضامن)
            </li>
          </ul>

          <p className="mt-2">
            <strong className="text-text-primary">۴.۳. لغو سفارش</strong>
          </p>
          <p>
            شما تا زمانی که سفارش ارسال نشده باشد، می‌توانید با تماس با
            پشتیبانی، سفارش خود را لغو کنید. پس از ارسال، امکان لغو وجود ندارد
            اما می‌توانید از حق مرجوعی استفاده کنید.
          </p>
        </div>
      </Section>

      {/* ۵. ارسال و تحویل */}
      <Section title="۵. ارسال و تحویل">
        <div className="flex flex-col gap-sm text-body text-text-secondary leading-relaxed">
          <ul className="flex flex-col gap-xs ps-6 list-disc">
            <li>
              سفارش‌ها از طریق پست پیشتاز، تیپاکس یا پیک موتوری (برای قزوین)
              ارسال می‌شوند.
            </li>
            <li>
              زمان تحویل برای شهر قزوین معمولاً همان روز یا روز بعد، و برای
              سایر شهرها ۲ تا ۴ روز کاری است.
            </li>
            <li>
              هزینه‌ی ارسال بر اساس مقصد و وزن محاسبه می‌شود و در صفحه‌ی پرداخت
              نمایش داده می‌شود.
            </li>
            <li>
              در صورت تأخیر در تحویل به‌دلیل مشکلات شرکت حمل، موبایل وحدت
              مسئولیتی ندارد اما پیگیری‌های لازم را انجام می‌دهد.
            </li>
            <li>
              مشتری موظف است هنگام تحویل، بسته‌بندی را بررسی کند. در صورت
              آسیب‌دیدگی، از تحویل خودداری و با پشتیبانی تماس بگیرد.
            </li>
          </ul>
        </div>
      </Section>

      {/* ۶. گارانتی */}
      <Section title="۶. گارانتی و خدمات پس از فروش">
        <div className="flex flex-col gap-sm text-body text-text-secondary leading-relaxed">
          <ul className="flex flex-col gap-xs ps-6 list-disc">
            <li>
              تمامی محصولات دارای گارانتی معتبر (شرکتی یا نمایندگی رسمی)
              هستند. مدت گارانتی در صفحه‌ی هر محصول ذکر شده است.
            </li>
            <li>
              گارانتی شامل خرابی‌های ناشی از استفاده‌ی نادرست، ضربه، نفوذ
              مایعات، شکستگی و دستکاری غیرمجاز نمی‌شود.
            </li>
            <li>
              برای استفاده از گارانتی، ارائه‌ی فاکتور خرید یا کد پیگیری سفارش
              الزامی است.
            </li>
            <li>
              مدت زمان تعمیر گارانتی بسته به نوع خرابی و شرکت گارانتی‌دهنده
              متغیر است.
            </li>
          </ul>
        </div>
      </Section>

      {/* ۷. مرجوعی */}
      <Section title="۷. مرجوعی و بازگشت کالا">
        <div className="flex flex-col gap-sm text-body text-text-secondary leading-relaxed">
          <p>
            <strong className="text-text-primary">۷.۱. شرایط مرجوعی</strong>
          </p>
          <ul className="flex flex-col gap-xs ps-6 list-disc">
            <li>
              شما تا <strong>۷ روز</strong> پس از دریافت کالا، امکان مرجوع کردن
              آن را دارید.
            </li>
            <li>
              کالا باید سالم، پلمب و در بسته‌بندی اصلی خود باشد.
            </li>
            <li>
              هزینه‌ی ارسال مرجوعی در صورت ایراد کالا با موبایل وحدت و در
              صورت انصراف با شماست.
            </li>
            <li>
              برای شروع فرآیند مرجوعی، با پشتیبانی تماس بگیرید.
            </li>
          </ul>

          <p className="mt-2">
            <strong className="text-text-primary">۷.۲. موارد غیرقابل مرجوعی</strong>
          </p>
          <ul className="flex flex-col gap-xs ps-6 list-disc">
            <li>محصولاتی که پلمب آن‌ها باز شده است.</li>
            <li>محصولاتی که به‌دلیل استفاده‌ی نادرست آسیب دیده‌اند.</li>
            <li>کارت‌های هدیه و اشتراک‌های دیجیتال.</li>
            <li>محصولات خریداری‌شده در حراج یا با تخفیف‌های ویژه (مگر با ذکر شود).</li>
          </ul>
        </div>
      </Section>

      {/* ۸. حریم خصوصی */}
      <Section title="۸. حریم خصوصی">
        <div className="flex flex-col gap-sm text-body text-text-secondary leading-relaxed">
          <p>
            موبایل وحدت به حفاظت از اطلاعات شخصی شما متعهد است. برای اطلاع از
            جزئیات، لطفاً{" "}
            <Link
              href="/privacy"
              className="text-brand-600 hover:underline font-medium"
            >
              سیاست حریم خصوصی
            </Link>{" "}
            ما را مطالعه کنید.
          </p>
        </div>
      </Section>

      {/* ۹. مسئولیت‌ها */}
      <Section title="۹. مسئولیت‌ها">
        <div className="flex flex-col gap-sm text-body text-text-secondary leading-relaxed">
          <p>
            <strong className="text-text-primary">۹.۱. مسئولیت موبایل وحدت</strong>
          </p>
          <ul className="flex flex-col gap-xs ps-6 list-disc">
            <li>تضمین اصالت و سالم بودن کالا در زمان تحویل.</li>
            <li>پاسخگویی به مشتریان در ساعات کاری.</li>
            <li>حفظ اطلاعات شخصی کاربران.</li>
            <li>ارسال محصولات در زمان توافق‌شده.</li>
          </ul>

          <p className="mt-2">
            <strong className="text-text-primary">۹.۲. مسئولیت کاربر</strong>
          </p>
          <ul className="flex flex-col gap-xs ps-6 list-disc">
            <li>ارائه‌ی اطلاعات صحیح هنگام ثبت سفارش.</li>
            <li>بررسی کالا هنگام تحویل.</li>
            <li>استفاده‌ی صحیح از محصول و رعایت شرایط گارانتی.</li>
          </ul>
        </div>
      </Section>

      {/* ۱۰. تغییرات */}
      <Section title="۱۰. تغییرات در شرایط">
        <div className="flex flex-col gap-sm text-body text-text-secondary leading-relaxed">
          <p>
            موبایل وحدت حق دارد در هر زمان، این شرایط و مقررات را به‌روزرسانی
            کند. تغییرات از لحظه‌ی انتشار در وب‌سایت، لازم‌الاجرا خواهند بود.
            توصیه می‌شود کاربران به‌صورت دوره‌ای این صفحه را مطالعه کنند.
          </p>
        </div>
      </Section>

      {/* ۱۱. قانون حاکم */}
      <Section title="۱۱. قانون حاکم و حل اختلاف">
        <div className="flex flex-col gap-sm text-body text-text-secondary leading-relaxed">
          <p>
            این شرایط تحت قوانین جمهوری اسلامی ایران تنظیم شده است. در صورت
            بروز هرگونه اختلاف، ابتدا تلاش می‌شود از طریق مذاکره‌ی دوستانه حل
            شود. در صورت عدم توافق، مرجع رسیدگی، دادگاه‌های صلاحیت‌دار شهر
            قزوین خواهد بود.
          </p>
        </div>
      </Section>

      {/* ۱۲. تماس */}
      <Section title="۱۲. تماس با ما">
        <div className="flex flex-col gap-sm text-body text-text-secondary leading-relaxed">
          <p>
            در صورت داشتن هرگونه سوال درباره‌ی این شرایط، می‌توانید از طریق
            راه‌های زیر با ما در تماس باشید:
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
            <li>
              آدرس: قزوین، غیاث آباد، خیابان ساحل، جنب درمانگاه صدرا
            </li>
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
        </div>
      </Section>

      <Section>
        <Card className="border-amber-300/50 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="pt-4">
            <p className="text-body-sm text-text-secondary leading-relaxed">
              <strong className="text-text-primary">📌 یادداشت مهم:</strong>{" "}
              این شرایط به‌صورت شفاف و مطابق با رویه‌ی فروشگاه موبایل وحدت
              تدوین شده است. در صورت نیاز به مشاوره‌ی حقوقی برای موارد خاص،
              توصیه می‌شود پیش از خرید با کارشناسان ما تماس بگیرید.
            </p>
          </CardContent>
        </Card>
      </Section>
    </Container>
  );
}