import type { Metadata } from "next";
import Link from "next/link";
import { BackgroundSection } from "@/components/layout/BackgroundSection";
import { PageHero } from "@/components/layout/PageHero";
import { Section } from "@/components/layout/Section";
import { Card } from "@/components/ui/Card";
import { InfoGrid } from "@/components/ui/InfoGrid";
import { buttonVariants } from "@/components/ui/button-variants";
import { PlaceholderBlock } from "@/components/shared/PlaceholderBlock";
import { Container } from "@/components/layout/Container";
import { AutoBreadcrumb } from "@/components/shared/AutoBreadcrumb";

export const metadata: Metadata = {
  title: "درباره ما",
  description: "معرفی موبایل وحدت، مأموریت، چشم‌انداز و ارزش‌های ما در حوزه موبایل و تکنولوژی.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "درباره ما | موبایل وحدت",
    description: "معرفی موبایل وحدت، مأموریت، چشم‌انداز و ارزش‌های ما در حوزه موبایل و تکنولوژی.",
    type: "website",
  },
};

const VALUES = [
  {
    title: "اصالت و کیفیت",
    description: "همه محصولات با ضمانت اصالت و کیفیت ارائه می‌شوند.",
  },
  {
    title: "اعتماد مشتری",
    description: "رضایت مشتری اولویت اصلی ماست.",
  },
  {
    title: "تخصص و تجربه",
    description: "تیمی متخصص برای ارائه بهترین مشاوره و خدمات.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Container>
        <div className="pt-md sm:pt-lg">
          <AutoBreadcrumb />
        </div>
      </Container>

      <BackgroundSection tone="background">
        <PageHero
          title="درباره موبایل وحدت"
          description="فروشگاه اینترنتی تخصصی موبایل و تکنولوژی با ضمانت اصالت و بهترین قیمت."
        />
      </BackgroundSection>

      <BackgroundSection tone="surface">
        <Section title="معرفی">
          <p className="max-w-2xl text-body-lg leading-relaxed text-text-secondary">
            موبایل وحدت با هدف ارائه بهترین و باکیفیت‌ترین محصولات حوزه موبایل و تکنولوژی تأسیس شده است. 
            ما با تکیه بر تخصص و تجربه، مجموعه‌ای از بهترین برندهای جهانی را گردآوری کرده‌ایم تا خریدی مطمئن و لذت‌بخش را برای شما فراهم کنیم.
          </p>
        </Section>
      </BackgroundSection>

      <BackgroundSection tone="background">
        <Section title="مأموریت و چشم‌انداز">
          <div className="grid gap-md sm:grid-cols-2">
            <Card>
              <h3 className="text-h3 font-semibold text-text-primary">مأموریت</h3>
              <p className="mt-xs text-body-sm text-text-secondary">
                ارائه بهترین محصولات موبایل و تکنولوژی با ضمانت اصالت و بهترین قیمت.
              </p>
            </Card>
            <Card>
              <h3 className="text-h3 font-semibold text-text-primary">چشم‌انداز</h3>
              <p className="mt-xs text-body-sm text-text-secondary">
                تبدیل شدن به مرجع اصلی خرید موبایل و لوازم جانبی در ایران.
              </p>
            </Card>
          </div>
        </Section>
      </BackgroundSection>

      <BackgroundSection tone="surface">
        <Section title="ارزش‌های ما">
          <InfoGrid columns={3}>
            {VALUES.map((value) => (
              <Card key={value.title}>
                <h3 className="text-h3 font-semibold text-text-primary">
                  {value.title}
                </h3>
                <p className="mt-xs text-body-sm text-text-secondary">
                  {value.description}
                </p>
              </Card>
            ))}
          </InfoGrid>
        </Section>
      </BackgroundSection>

      <BackgroundSection tone="background">
        <Section title="مسیر رشد">
          <PlaceholderBlock title="جدول زمانی">
            جدول زمانی رشد و توسعه فروشگاه به زودی در این بخش منتشر خواهد شد.
          </PlaceholderBlock>
        </Section>
      </BackgroundSection>

      <BackgroundSection tone="surface">
        <Section>
          <Card className="flex flex-col items-center gap-md py-xl text-center">
            <h2 className="text-h2 font-semibold text-text-primary">
              سوالی درباره موبایل وحدت دارید؟
            </h2>
            <p className="max-w-md text-body text-text-secondary">
              خوشحال می‌شویم پاسخگوی شما باشیم.
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