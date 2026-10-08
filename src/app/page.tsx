import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  Truck,
  Headphones,
} from "lucide-react";
import { BackgroundSection } from "@/components/layout/BackgroundSection";
import { Section } from "@/components/layout/Section";
import { HeroSlider } from "@/components/shared/HeroSlider";
import { CategorySlider } from "@/components/shared/CategorySlider";
import { ProductSlider } from "@/components/shared/ProductSlider";
import { TrustBar } from "@/components/shared/TrustBar";
import { PromoBanners } from "@/components/shared/PromoBanners";
import { getCategoriesForSlider } from "@/features/categories/services/category-service";
import { getProductsByFilter } from "@/features/products/services/product-service";
import { getSetting } from "@/lib/server/site-settings";
import { SETTING_KEYS } from "@/lib/settings-keys";

// ISR
export const revalidate = 60;

// ============================================================
// SEO
// ============================================================
export const metadata: Metadata = {
  title: "موبایل وحدت | موبایل، لپ‌تاپ و لوازم جانبی",
  description:
    "فروشگاه اینترنتی تخصصی گوشی موبایل، لپ‌تاپ، لوازم جانبی، ساعت هوشمند و تجهیزات دیجیتال با بهترین قیمت و ضمانت اصالت کالا.",
  alternates: { canonical: "/" },
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "موبایل وحدت",
  url: SITE_URL,
  logo: `${SITE_URL}/icon`,
  description:
    "فروشگاه اینترنتی تخصصی گوشی موبایل، لپ‌تاپ، لوازم جانبی و تجهیزات دیجیتال",
};

// ============================================================
// HomePage
// ============================================================
export default async function HomePage() {
  const [
    categories,
    bestSellers,
    newestProducts,
    discountedProducts,
    technoTimeProducts,
    usedProducts,
    laptops,
    budgetProducts,
    showTrustBar,
    showBrandsSlider,
    showCountdownTimer,
    showBlogPreview,
  ] = await Promise.all([
    getCategoriesForSlider(),
    getProductsByFilter("bestSeller", 10),
    getProductsByFilter("newest", 10),
    getProductsByFilter("discounted", 10),
    getProductsByFilter("technoTime", 6),
    getProductsByFilter("used", 6),
    getProductsByFilter("laptop", 10),
    getProductsByFilter("budget", 10),
    getSetting(SETTING_KEYS.TRUST_BAR_ENABLED, true),
    getSetting(SETTING_KEYS.BRANDS_SLIDER_ENABLED, true),
    getSetting(SETTING_KEYS.COUNTDOWN_TIMER_ENABLED, false),
    getSetting(SETTING_KEYS.BLOG_PREVIEW_ENABLED, false),
  ]);

  return (
    <>
      {/* ✅ Schema.org */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      {/* ========================================== */}
      {/* ۱. بنر متحرک (Hero Slider) */}
      {/* ========================================== */}
      <section className="container mx-auto px-4 py-6 lg:py-8">
        <HeroSlider />
      </section>

      {/* ========================================== */}
      {/* ۲. دسته‌بندی‌ها */}
      {/* ========================================== */}
      {categories.length > 0 && (
        <BackgroundSection tone="muted">
          <Section
            title="دسته‌بندی محصولات"
            description="برای مشاهده‌ی محصولات، روی دسته‌بندی موردنظر کلیک کنید"
            actions={
              <Link
                href="/categories"
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
              >
                مشاهده همه
                <ArrowLeft className="h-4 w-4" />
              </Link>
            }
          >
            <CategorySlider categories={categories} />
          </Section>
        </BackgroundSection>
      )}

      {/* ========================================== */}
      {/* ۳. نوار اعتماد (شرطی) */}
      {/* ========================================== */}
      {showTrustBar && (
        <BackgroundSection tone="surface">
          <Section>
            <TrustBar />
          </Section>
        </BackgroundSection>
      )}

      {/* ========================================== */}
      {/* ۴. پرفروش‌ترین‌ها */}
      {/* ========================================== */}
      {bestSellers.length > 0 && (
        <BackgroundSection tone="background">
          <Section
            title="پرفروش‌ترین‌ها"
            description="محبوب‌ترین محصولات این ماه"
            actions={
              <Link
                href="/products?filter=bestSeller"
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
              >
                مشاهده همه
                <ArrowLeft className="h-4 w-4" />
              </Link>
            }
          >
            <ProductSlider products={bestSellers} />
          </Section>
        </BackgroundSection>
      )}

      {/* ========================================== */}
      {/* ۵. بنرهای تبلیغاتی */}
      {/* ========================================== */}
      <BackgroundSection tone="muted">
        <Section>
          <PromoBanners />
        </Section>
      </BackgroundSection>

      {/* ========================================== */}
      {/* ۶. تکنو تایم */}
      {/* ========================================== */}
      {technoTimeProducts.length > 0 && (
        <BackgroundSection tone="background">
          <Section
            title="⚡ تکنو تایم"
            description="پیشنهادهای لحظه‌ای با تخفیف ویژه و زمان محدود"
            actions={
              <Link
                href="/products?filter=technoTime"
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
              >
                مشاهده همه
                <ArrowLeft className="h-4 w-4" />
              </Link>
            }
          >
            <ProductSlider products={technoTimeProducts} />
          </Section>
        </BackgroundSection>
      )}

      {/* ========================================== */}
      {/* ۷. جدیدترین محصولات */}
      {/* ========================================== */}
      {newestProducts.length > 0 && (
        <BackgroundSection tone="muted">
          <Section
            title="جدیدترین محصولات"
            description="تازه‌ترین‌های موبایل وحدت"
            actions={
              <Link
                href="/products?filter=newest"
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
              >
                مشاهده همه
                <ArrowLeft className="h-4 w-4" />
              </Link>
            }
          >
            <ProductSlider products={newestProducts} />
          </Section>
        </BackgroundSection>
      )}

      {/* ========================================== */}
      {/* ۸. تخفیفات شگفت‌انگیز */}
      {/* ========================================== */}
      {discountedProducts.length > 0 && (
        <BackgroundSection tone="background">
          <Section
            title="🔥 تخفیفات شگفت‌انگیز"
            description="فرصت را از دست ندهید، تخفیف‌های ویژه با زمان محدود"
            actions={
              <Link
                href="/products?filter=discounted"
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
              >
                مشاهده همه
                <ArrowLeft className="h-4 w-4" />
              </Link>
            }
          >
            <ProductSlider products={discountedProducts} />
          </Section>
        </BackgroundSection>
      )}

      {/* ========================================== */}
      {/* ۹. کارکرده‌ها */}
      {/* ========================================== */}
      {usedProducts.length > 0 && (
        <BackgroundSection tone="muted">
          <Section
            title="♻️ کارکرده‌های باکیفیت"
            description="محصولات کارکرده با کیفیت و قیمت مناسب"
            actions={
              <Link
                href="/products?filter=used"
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
              >
                مشاهده همه
                <ArrowLeft className="h-4 w-4" />
              </Link>
            }
          >
            <ProductSlider products={usedProducts} />
          </Section>
        </BackgroundSection>
      )}

      {/* ========================================== */}
      {/* ۱۰. لپ‌تاپ‌ها */}
      {/* ========================================== */}
      {laptops.length > 0 && (
        <BackgroundSection tone="background">
          <Section
            title="💻 لپ‌تاپ‌ها"
            description="جدیدترین لپ‌تاپ‌های ایسوس، لنوو، اپل، اچ‌پی، دل و ام‌اس‌آی"
            actions={
              <Link
                href="/categories/laptops"
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
              >
                مشاهده همه
                <ArrowLeft className="h-4 w-4" />
              </Link>
            }
          >
            <ProductSlider products={laptops} />
          </Section>
        </BackgroundSection>
      )}

      {/* ========================================== */}
      {/* ۱۱. اقتصادی‌ها (جدید) */}
      {/* ========================================== */}
      {budgetProducts.length > 0 && (
        <BackgroundSection tone="muted">
          <Section
            title="💰 اقتصادی‌ها"
            description="محصولات اقتصادی با قیمت مناسب — زیر ۱۰ میلیون تومان"
            actions={
              <Link
                href="/products?maxPrice=10000000&sort=price_asc"
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
              >
                مشاهده همه
                <ArrowLeft className="h-4 w-4" />
              </Link>
            }
          >
            <ProductSlider products={budgetProducts} />
          </Section>
        </BackgroundSection>
      )}

      {/* ========================================== */}
      {/* ۱۲. چرا موبایل وحدت؟ */}
      {/* ========================================== */}
      <BackgroundSection tone="background">
        <Section
          title="چرا موبایل وحدت؟"
          description="سه دلیل که ما را از دیگران متمایز می‌کند"
        >
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <WhyCard
              icon={<Award className="h-8 w-8" />}
              title="ضمانت اصالت کالا"
              description="همه محصولات با ضمانت اصالت و سلامت فیزیکی ارائه می‌شوند."
            />
            <WhyCard
              icon={<Truck className="h-8 w-8" />}
              title="ارسال سریع"
              description="تحویل سریع و مطمئن در کمترین زمان ممکن به سراسر ایران."
            />
            <WhyCard
              icon={<Headphones className="h-8 w-8" />}
              title="پشتیبانی ۲۴/۷"
              description="تیم پشتیبانی ما همیشه در دسترس شماست."
            />
          </div>
        </Section>
      </BackgroundSection>

      {/* ========================================== */}
      {/* ۱۳. CTA نهایی */}
      {/* ========================================== */}
      <BackgroundSection tone="muted">
        <Section>
          <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-8 sm:p-12 text-center text-white shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              سوالی دارید؟
            </h2>
            <p className="text-white/80 mb-6 max-w-md mx-auto">
              برای هرگونه پرسش درباره محصولات، سفارش یا خدمات با ما در تماس
              باشید.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-bold text-brand-700 hover:bg-white/90 transition-colors"
              >
                تماس با ما
              </Link>
            </div>
          </div>
        </Section>
      </BackgroundSection>
    </>
  );
}

// ============================================================
// کامپوننت کمکی WhyCard
// ============================================================
function WhyCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-600 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
    </div>
  );
}