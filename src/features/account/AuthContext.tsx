"use client";

import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import type { User } from "./types";
import { loginAction, logoutAction, getCurrentUserAction } from "@/lib/server/auth-actions";
import { logger } from "@/lib/logger";
import { useCart } from "@/features/cart/CartProvider";
import { loadCart, saveCart } from "@/lib/persistence";
import type { CartItem } from "@/features/cart/types"; // ✅ اضافه شد

export type AuthStatus = "unauthenticated" | "loading" | "authenticated" | "expired" | "error";

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  error?: string;
  login: (credentials: unknown) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * AuthProvider
 * 
 * Boundary for identity management. Wraps the real server actions in
 * src/lib/server/auth-actions.ts (bcrypt password hashing, hashed
 * sessions, brute-force lockout) — mounted once at the root layout so
 * every page (Header, /login, /register, /account) shares one session
 * state instead of each re-fetching it independently.
 * 
 * FIX 2026-09-05: Added cart merging after login. Guest cart items are
 * merged with existing user cart items to prevent data loss.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [error, setError] = useState<string | undefined>(undefined);

  const refreshSession = async () => {
    setStatus("loading");
    try {
      const response = await getCurrentUserAction();
      if (response.success) {
        setUser(response.user);
        setStatus("authenticated");
      } else {
        setUser(null);
        setStatus("unauthenticated");
      }
    } catch (e) {
      logger.error("Session restore failed", { error: e instanceof Error ? e.message : String(e) });
      setStatus("error");
      setError("Failed to restore session");
    }
  };

  // Initial session check
  useEffect(() => {
    refreshSession();
  }, []);

  const login = async (credentials: unknown) => {
    setStatus("loading");
    setError(undefined);
    try {
      const response = await loginAction(credentials);
      if (response.success) {
        setUser(response.user);
        setStatus("authenticated");
      } else {
        setStatus("unauthenticated");
        setError(response.error);
      }
    } catch (e: unknown) {
      setStatus("unauthenticated");
      setError(e instanceof Error ? e.message : "Login failed");
    }
  };

  const logout = async () => {
    try {
      await logoutAction();
      setUser(null);
      setStatus("unauthenticated");
      // پس از خروج، سبد خرید مهمان رو پاک میکنیم
      saveCart([]);
    } catch (e) {
      logger.error("Logout failed", { error: e instanceof Error ? e.message : String(e) });
    }
  };

  const value = useMemo(
    () => ({
      user,
      status,
      error,
      login,
      logout,
      refreshSession,
    }),
    [user, status, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// ============================================================
// کامپوننت برای ادغام سبد خرید بعد از لاگین
// ============================================================

/**
 * CartMerger
 * 
 * این کامپوننت بعد از لاگین، سبد خرید مهمان رو با سبد خرید کاربر ادغام میکنه.
 * باید داخل AuthProvider و در کنار CartProvider قرار بگیره.
 */
export function CartMerger() {
  const { user, status } = useAuth();
  const { items, addItem } = useCart();

  useEffect(() => {
    // فقط زمانی که کاربر لاگین میکنه
    if (status === "authenticated" && user) {
      // بارگذاری سبد خرید از localStorage
      const guestItems = loadCart() as CartItem[] | null;
      
      if (guestItems && guestItems.length > 0) {
        // ادغام سبد خرید مهمان با سبد خرید فعلی
        guestItems.forEach((guestItem) => {
          // بررسی اینکه آیا این محصول قبلاً در سبد خرید هست یا نه
          const existingItem = items.find((item) => item.productId === guestItem.productId);
          if (existingItem) {
            // اگر موجود بود، تعداد رو جمع کن
            addItem({
              ...guestItem,
              quantity: existingItem.quantity + guestItem.quantity,
            });
          } else {
            // اگر نبود، اضافه کن
            addItem(guestItem);
          }
        });
        
        // پاک کردن سبد خرید مهمان از localStorage
        saveCart([]);
      }
    }
  }, [status, user, addItem, items]);

  return null;
}