import type { Metadata } from "next";
import Link from "next/link";
import { BackgroundSection } from "@/components/layout/BackgroundSection";
import { PageHero } from "@/components/layout/PageHero";
import { Section } from "@/components/layout/Section";
import { Card } from "@/components/ui/Card";
import { InfoGrid } from "@/components/ui/InfoGrid";
import { buttonVariants } from "@/components/ui/button-variants";
import { PlaceholderBlock } from "@/components/shared/PlaceholderBlock";

export const metadata: Metadata = {
  title: "خرید سازمانی",
  description: "همکاری تحریرینو با مدارس، ادارات و سازمان‌ها.",
  alternates: {
    canonical: "/business",
  },
  openGraph: {
    title: "خرید سازمانی | تحریرینو",
    description: "همکاری تحریرینو با مدارس، ادارات و سازمان‌ها.",
    type: "website",
  },
};

const BENEFITS = [
  {
    title: "خرید حجمی",
    description: "امکان سفارش تعداد بالا برای مصرف مستمر مدرسه یا اداره.",
  },
  {
    title: "هماهنگی مستقیم",
    description:
      "در آینده، امکان هماهنگی مستقیم با تیم تحریرینو برای سفارش‌های بزرگ فراهم خواهد شد.",
  },
  {
    title: "فاکتور رسمی",
    description: "صدور فاکتور رسمی برای خریدهای سازمانی از اهداف این پروژه است.",
  },
];

export default function BusinessPage() {
  return (
    <>
      <BackgroundSection tone="background">
        <PageHero
          title="همکاری با مدارس، ادارات و سازمان‌ها"
          description="تحریرینو برای پاسخ‌گویی به نیازهای خرید حجمی نهادها طراحی می‌شود."
        />
      </BackgroundSection>

      <BackgroundSection tone="surface">
        <Section title="مزایای همکاری">
          <InfoGrid columns={3}>
            {BENEFITS.map((benefit) => (
              <Card key={benefit.title}>
                <h3 className="text-h3 font-semibold text-text-primary">
                  {benefit.title}
                </h3>
                <p className="mt-xs text-body-sm text-text-secondary">
                  {benefit.description}
                </p>
              </Card>
            ))}
          </InfoGrid>
        </Section>
      </BackgroundSection>

      <BackgroundSection tone="background">
        <Section title="خرید حجمی">
          <PlaceholderBlock>
            فرایند دقیق ثبت سفارش حجمی پس از راه‌اندازی فروشگاه اعلام
            خواهد شد.
          </PlaceholderBlock>
        </Section>

        <Section title="فاکتور رسمی">
          <PlaceholderBlock>
            جزئیات صدور فاکتور رسمی (نوع فاکتور، مدارک لازم) به‌زودی
            منتشر می‌شود.
          </PlaceholderBlock>
        </Section>

        <Section title="خدمات سازمانی آینده">
          <PlaceholderBlock>
            خدماتی مانند حساب سازمانی اختصاصی و تخفیف مستمر برای
            همکاری بلندمدت، در برنامه‌ی آینده‌ی این پروژه قرار دارند.
          </PlaceholderBlock>
        </Section>
      </BackgroundSection>

      <BackgroundSection tone="surface">
        <Section>
          <Card className="flex flex-col items-center gap-md py-xl text-center">
            <h2 className="text-h2 font-semibold text-text-primary">
              می‌خواهید همکاری را شروع کنید؟
            </h2>
            <p className="max-w-md text-body text-text-secondary">
              برای هماهنگی خرید سازمانی، با ما در تماس باشید.
            </p>
            <Link
              href="/contact"
              className={buttonVariants({ variant: "default", size: "md" })}
            >
              تماس با ما
            </Link>
          </Card>
        </Section>
      </BackgroundSection>
    </>
  );
}
