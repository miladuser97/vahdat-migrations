import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { AutoBreadcrumb } from "@/components/shared/AutoBreadcrumb";
import { FAQList, type FAQListItem } from "@/components/shared/FAQList";
import { ProductGallery } from "@/features/products/components/ProductGallery";
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
import { prisma } from "@/lib/server/prisma";
import { VariantSelector } from "@/features/products/components/VariantSelector"; // 👈 اضافه شد

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "محصول یافت نشد" };
  return {
    title: product.title,
    description: product.description || product.shortDescription || STORE_NOT_READY_MESSAGE,
  };
}

export default async function ProductDetailsPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  // گرفتن رنگ‌ها از دیتابیس
  const variants = await prisma.productVariant.findMany({
    where: { productId: product.id },
  });

  const reviewsResult = await getProductReviewsAction(product.id);
  const reviews = reviewsResult.success ? reviewsResult.reviews : [];
  const user = await getAuthenticatedUser();

  const relatedProductsResults = await getProducts({ category: product.categorySlug });
  const relatedProducts = relatedProductsResults.filter((p) => p.id !== product.id);

  const hasActiveDiscount =
    product.discountPrice !== undefined &&
    product.price !== undefined &&
    product.discountPrice < product.price &&
    product.discountEndsAt !== undefined;

  return (
    <Container>
      <div className="pt-md sm:pt-lg">
        <AutoBreadcrumb />
      </div>

      <PageHeader title={product.title} />

      <Section>
        {/* 👇 چیدمان دو ستونی: گالری در راست، اطلاعات در چپ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* ستون راست: گالری عکس */}
          <div>
            <ProductGallery slug={slug} fallbackImage={product.thumbnail} />
          </div>

          {/* ستون چپ: قیمت، رنگ‌ها، خرید */}
          <div className="space-y-6">
            <Card className="flex flex-col gap-4 p-6">
              {product.brand && (
                <p className="text-body-sm text-text-secondary">{product.brand}</p>
              )}

              <Price
                price={product.price}
                discountPrice={product.discountPrice}
                currency={product.currency}
              />

              {hasActiveDiscount && product.discountEndsAt && (
                <DiscountTimer endsAt={product.discountEndsAt} variant="default" />
              )}

              {/* 👇 بخش انتخاب رنگ (کامپوننت جدید) */}
              <VariantSelector variants={variants} />

              <ProductActions product={product} />
            </Card>
          </div>
        </div>
      </Section>

      <Section>
        <Tabs
          items={[
            { label: "توضیحات", content: <Card><p className="text-body-lg leading-relaxed text-text-secondary">{product?.description || product?.shortDescription || STORE_NOT_READY_MESSAGE}</p></Card> },
            { label: "مشخصات فنی", content: <Card><ProductMeta product={product || {}} /></Card> },
            { label: `نظرات (${product.reviewCount || 0})`, content: <ProductReviews productId={product.id} initialReviews={reviews} averageRating={product.rating || 0} totalReviews={product.reviewCount || 0} isAuthenticated={!!user} /> },
          ]}
        />
      </Section>

      {SITE_FEATURES.products.relatedProducts.enabled && (
        <RelatedProductsSection products={relatedProducts} />
      )}
    </Container>
  );
}
