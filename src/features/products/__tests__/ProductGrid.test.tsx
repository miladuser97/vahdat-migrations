import { render, screen } from "@testing-library/react";
import { ProductGrid } from "../components/ProductGrid";
import { describe, it, expect } from "vitest";
import { PRODUCT_FIXTURES } from "../data/fixtures";
import { CartProvider } from "@/features/cart/CartProvider";
import { STORE_NOT_READY_MESSAGE } from "@/constants/messages";
import React from "react";
import type { Product } from "../types";

// Need to wrap with CartProvider because ProductCard uses useCart (via ProductActions)
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

describe("ProductGrid", () => {
  it("renders the empty state when no products are provided", () => {
    render(<ProductGrid products={[]} />, { wrapper });
    expect(screen.getByText(STORE_NOT_READY_MESSAGE)).toBeDefined();
  });

  it("renders a list of products", () => {
    render(<ProductGrid products={PRODUCT_FIXTURES} />, { wrapper });
    
    PRODUCT_FIXTURES.forEach((product: Product) => {
      expect(screen.getAllByText(product.title).length).toBeGreaterThan(0);
    });
  });
});
