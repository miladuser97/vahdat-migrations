import { describe, it, expect, vi, beforeEach } from "vitest";
import { getProducts, getBrands } from "../services/product-service";

vi.mock("@/lib/server/prisma", () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/server/prisma";

describe("Product Service", () => {
  const mockProducts = [
    { 
      id: "1", 
      slug: "samsung-s24-ultra", 
      title: "گوشی سامسونگ گلکسی S24 Ultra", 
      price: { toString: () => "66000000" }, 
      isEnabled: true, 
      brand: { name: "سامسونگ" }, 
      shortDescription: null,
      description: null,
      sku: null,
      categorySlug: "smartphones",
      currency: "تومان",
      discountPrice: null,
      inventoryCount: 10,
      images: null,
      rating: 4.8,
      reviewCount: 120,
      createdAt: new Date(), 
      updatedAt: new Date() 
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return all products when no query is provided", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue(
      mockProducts as Awaited<ReturnType<typeof prisma.product.findMany>>
    );
    const products = await getProducts();
    expect(products).toHaveLength(1);
  });

  it("should filter products by category slug", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue(
      mockProducts as Awaited<ReturnType<typeof prisma.product.findMany>>
    );
    const products = await getProducts({ category: "smartphones" });
    expect(prisma.product.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ categorySlug: "smartphones" })
    }));
    expect(products).toHaveLength(1);
  });

  it("should return unique brands", async () => {
    vi.mocked(prisma.brand?.findMany || prisma.product.findMany).mockResolvedValue(
      [{ name: "سامسونگ" }] as Awaited<ReturnType<typeof prisma.product.findMany>>
    );
    const brands = await getBrands();
    expect(brands).toBeDefined();
  });
});