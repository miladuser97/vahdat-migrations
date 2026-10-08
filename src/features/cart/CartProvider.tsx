"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CartItem } from "./types";
import { loadCart, saveCart } from "@/lib/persistence";

export interface CartContextValue {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

/**
 * CartProvider
 * ...
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from persistence on mount
  useEffect(() => {
    const saved = loadCart() as CartItem[] | null;
    if (saved) setItems(saved);
    setIsLoaded(true);
  }, []);

  // Save to persistence on change (only after initial load to avoid overwriting)
  useEffect(() => {
    if (isLoaded) {
      saveCart(items);
    }
  }, [items, isLoaded]);

  const addItem = useCallback((item: CartItem) => {
    // Ensure quantity is a safe finite integer >= 1
    const rawQuantity = typeof item.quantity === "number" ? item.quantity : 1;
    const quantity = Number.isFinite(rawQuantity) ? Math.max(1, Math.floor(rawQuantity)) : 1;

    setItems((current) => {
      const existing = current.find((line) => line.id === item.id);
      if (existing) {
        return current.map((line) =>
          line.id === item.id ? { ...line, quantity: line.quantity + quantity } : line,
        );
      }
      return [...current, { ...item, quantity }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((line) => line.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    // Check for NaN/Infinite or non-numeric
    if (!Number.isFinite(quantity)) return;

    setItems((current) => {
      // Clamping: less than 1 removes the item; otherwise ensure integer
      if (quantity < 1) {
        return current.filter((line) => line.id !== id);
      }
      const safeQuantity = Math.floor(quantity);
      return current.map((line) => (line.id === id ? { ...line, quantity: safeQuantity } : line));
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const value = useMemo(
    () => ({ items, addItem, removeItem, updateQuantity, clearCart }),
    [items, addItem, removeItem, updateQuantity, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
