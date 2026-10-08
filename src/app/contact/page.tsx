import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { Card } from "@/components/ui/Card";
import { buttonVariants } from "@/components/ui/button-variants";
import { PhoneIcon, LocationIcon, ClockIcon } from "@/components/ui/icons";
import { AutoBreadcrumb } from "@/components/shared/AutoBreadcrumb";
import {
  InstagramBrandIcon,
  TelegramBrandIcon,
  WhatsAppBrandIcon,
  BaleBrandIcon,
} from "@/components/ui/brand-icons";
import { CONTACT_INFO, SOCIAL_LINKS } from "@/config/navigation/menu";
import { toPersianDigits } from "@/utils/text-utils";

export const metadata: Metadata = {
  title: "تماس با ما",
  description: "راه‌های ارتباط با موبایل وحدت.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "تماس با ما | موبایل وحدت",
    description: "راه‌های ارتباط با موبایل وحدت.",
    type: "website",
  },
};

const SOCIAL_ITEMS = [
  {
    id: "instagram",
    label: "اینستاگرام",
    href: SOCIAL_LINKS.instagram,
    icon: <InstagramBrandIcon className="h-12 w-12" />,
  },
  {
    id: "telegram",
    label: "تلگرام",
    href: SOCIAL_LINKS.telegram,
    icon: <TelegramBrandIcon className="h-12 w-12" />,
  },
  {
    id: "whatsapp",
    label: "واتساپ",
    href: SOCIAL_LINKS.whatsapp,
    icon: <WhatsAppBrandIcon className="h-12 w-12" />,
  },
  {
    id: "bale",
    label: "بله",
    href: SOCIAL_LINKS.bale,
    icon: <BaleBrandIcon className="h-12 w-12" />,
  },
].filter((item) => item.href && item.href.trim() !== "");

export default function ContactPage() {
  return (
    <Container>
      <div className="pt-md sm:pt-lg">
        <AutoBreadcrumb />
      </div>

      <PageHeader
        title="تماس با ما"
        description="همیشه در دسترس شما هستیم. از راه‌های زیر با ما در ارتباط باشید."
      />

      {/* اطلاعات تماس */}
      <Section>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CONTACT_INFO.phone && (
            <Card className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 shrink-0">
                <PhoneIcon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-text-secondary">شماره تماس</p>
                <a
                  href={`tel:${CONTACT_INFO.phone}`}
                  className="text-body font-medium text-text-primary hover:text-brand-600 transition-colors fa-num"
                  dir="ltr"
                >
                  {toPersianDigits(CONTACT_INFO.phone)}
                </a>
              </div>
            </Card>
          )}

          {CONTACT_INFO.address && (
            <Card className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 shrink-0">
                <LocationIcon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-text-secondary">آدرس</p>
                <p className="text-body font-medium text-text-primary">
                  {CONTACT_INFO.address}
                </p>
              </div>
            </Card>
          )}

          {CONTACT_INFO.workingHours && (
            <Card className="p-4 flex items-center gap-4 sm:col-span-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 shrink-0">
                <ClockIcon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-text-secondary">ساعات کاری</p>
                <p className="text-body font-medium text-text-primary">
                  {CONTACT_INFO.workingHours}
                </p>
              </div>
            </Card>
          )}
        </div>
      </Section>

      {/* پیام‌رسان‌ها */}
      {SOCIAL_ITEMS.length > 0 && (
        <Section
          title="ما را در شبکه‌های اجتماعی دنبال کنید"
          description="از طریق پیام‌رسان‌های زیر می‌توانید سریع‌تر با ما در ارتباط باشید."
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {SOCIAL_ITEMS.map((item) => (
              <a
                key={item.id}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={item.label}
                className="group flex flex-col items-center gap-3 p-5 rounded-xl bg-card border border-border hover:border-brand-500 hover:shadow-lg transition-all"
              >
                <div className="overflow-hidden rounded-full group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <span className="text-sm font-bold text-text-primary group-hover:text-brand-600 transition-colors">
                  {item.label}
                </span>
              </a>
            ))}
          </div>
        </Section>
      )}

      {/* لینک FAQ */}
      <Section>
        <Card className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-body text-text-secondary">
            پیش از تماس، پاسخ سوال خود را در صفحه‌ی سوالات متداول جست‌وجو کنید.
          </p>
          <Link
            href="/faq"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            مشاهده‌ی سوالات متداول
          </Link>
        </Card>
      </Section>
    </Container>
  );
}