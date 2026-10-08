import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { AutoBreadcrumb } from "@/components/shared/AutoBreadcrumb";
import { FAQList, type FAQListItem } from "@/components/shared/FAQList";
import { ProductImage } from "@/features/products/components/ProductImage";
import { Price } from "@/features/products/components/Price";
import { ProductActions } from "@/features/products/components/ProductActions";
import { ProductMeta } from "@/features/products/components/ProductMeta";
import { RelatedProductsSection } from "@/features/products/components/RelatedProductsSection";
import { ProductReviews } from "@/features/products/components/ProductReviews";
import { DiscountTimer } from "@/features/products/components/DiscountTimer";
import type { Product } from "@/features/products/types";
import { getProductBySlug, getProducts } from "@/features/products/services/product-service";
import { getProductReviewsAction } from "@/lib/server/commerce-actions";
import { getAuthenticatedUser } from "@/lib/server/auth-utils";
import { SITE_FEATURES } from "@/config/features";
import { STORE_NOT_READY_MESSAGE } from "@/constants/messages";

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "محصول یافت نشد",
    };
  }

  return {
    title: product.title,
    description: product.description || product.shortDescription || STORE_NOT_READY_MESSAGE,
    openGraph: {
      title: product.title,
      description: product.description || product.shortDescription,
      type: "website",
    },
  };
}

export default async function ProductDetailsPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const reviewsResult = await getProductReviewsAction(product.id);
  const reviews = reviewsResult.success ? reviewsResult.reviews : [];

  const user = await getAuthenticatedUser();

  const relatedProductsResults = await getProducts({ category: product.categorySlug });
  const relatedProducts = relatedProductsResults.filter(
    (p) => p.id !== product.id,
  );

  const recentlyViewedProducts: Product[] = [];
  const compareProducts: Product[] = [];
  const productFAQItems: FAQListItem[] = [];

  // ✅ چک کن تخفیف فعاله یا نه
  const hasActiveDiscount =
    product.discountPrice !== undefined &&
    product.price !== undefined &&
    product.discountPrice < product.price &&
    product.discountEndsAt !== undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description || product.shortDescription,
    brand: {
      "@type": "Brand",
      name: product.brand,
    },
    offers: {
      "@type": "Offer",
      price: product.price ? product.price * 10 : undefined,
      priceCurrency: "IRR",
      availability: product.stockStatus === "in_stock" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    aggregateRating: product.reviewCount && product.reviewCount > 0 ? {
      "@type": "AggregateRating",
      ratingValue: product.rating || 0,
      reviewCount: product.reviewCount,
    } : undefined,
  };

  return (
    <Container>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ 
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') 
        }}
      />

      <div className="pt-md sm:pt-lg">
        <AutoBreadcrumb />
      </div>

      <PageHeader title={product.title} />

      <Section>
        <div className="grid gap-lg lg:grid-cols-2">
          <ProductImage
            image={product.thumbnail}
            images={product.images}
            alt={product.title}
            className="border border-border"
          />

          <div className="lg:sticky lg:top-lg lg:self-start">
            <Card className="flex flex-col gap-md">
              {/* برند */}
              {product.brand && (
                <p className="text-body-sm text-text-secondary">{product.brand}</p>
              )}

              {/* قیمت */}
              <Price
                price={product.price}
                discountPrice={product.discountPrice}
                currency={product.currency}
              />

              {/* ✅ تایمر تخفیف (اگه تخفیف فعاله) */}
              {hasActiveDiscount && product.discountEndsAt && (
                <DiscountTimer
                  endsAt={product.discountEndsAt}
                  variant="default"
                />
              )}

              {/* دکمه‌های عملیات */}
              <ProductActions product={product} />
            </Card>
          </div>
        </div>
      </Section>

      <Section>
        <Tabs
          items={[
            {
              label: "توضیحات",
              content: (
                <Card>
                  <p className="max-w-2xl text-body-lg leading-relaxed text-text-secondary">
                    {product?.description || product?.shortDescription || STORE_NOT_READY_MESSAGE}
                  </p>
                </Card>
              ),
            },
            {
              label: "مشخصات فنی",
              content: (
                <Card>
                  <ProductMeta product={product || {}} />
                </Card>
              ),
            },
            {
              label: `نظرات (${product.reviewCount || 0})`,
              content: (
                <ProductReviews
                  productId={product.id}
                  initialReviews={reviews}
                  averageRating={product.rating || 0}
                  totalReviews={product.reviewCount || 0}
                  isAuthenticated={!!user}
                />
              ),
            },
          ]}
        />
      </Section>

      {SITE_FEATURES.products.relatedProducts.enabled && (
        <RelatedProductsSection products={relatedProducts} />
      )}

      {SITE_FEATURES.products.recentlyViewed.enabled && (
        <RelatedProductsSection products={recentlyViewedProducts} title="بازدیدهای اخیر" />
      )}

      {SITE_FEATURES.products.compare.enabled && (
        <RelatedProductsSection products={compareProducts} title="مقایسه با محصولات مشابه" />
      )}

      {SITE_FEATURES.products.faq.enabled && (
        <Section title="سوالات متداول محصول">
          <FAQList items={productFAQItems} />
        </Section>
      )}
    </Container>
  );
}