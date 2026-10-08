import { describe, it, expect, vi } from "vitest";
import { getProducts } from "../services/product-service";

vi.mock("@/lib/server/prisma", () => ({
  prisma: {
    product: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

import { prisma } from "@/lib/server/prisma";

describe("Catalog Discovery Composition", () => {
  it("should compose search and category filter", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue(
      [{ 
        id: "prod_1", 
        slug: "samsung", 
        title: "گوشی سامسونگ", 
        price: { toString: () => "1000000" },
        isEnabled: true,
        brand: null,
        shortDescription: null,
        description: null,
        sku: null,
        categorySlug: "smartphones",
        currency: "تومان",
        discountPrice: null,
        inventoryCount: 5,
        images: null,
        rating: 4.5,
        reviewCount: 10,
        createdAt: new Date(), 
        updatedAt: new Date() 
      }] as Awaited<ReturnType<typeof prisma.product.findMany>>
    );
    const results = await getProducts({
      search: "گوشی سامسونگ",
      category: "smartphones",
    });
    expect(results.length).toBe(1);
  });
});