// ============================================================
// تنظیمات Feature Flags — برای سازگاری با کدهای قدیمی
// ⚠️ توجه: تنظیمات اصلی از دیتابیس (SiteSetting) خوانده می‌شود
// ============================================================

export const SITE_FEATURES = {
  navigation: {
    headerAccount: {
      enabled: true,
    },
  },
  categories: {
    productGrid: {
      enabled: true,
    },
  },
  products: {
    relatedProducts: {
      enabled: true,
    },
    recentlyViewed: {
      enabled: true,
    },
    compare: {
      enabled: true,
    },
    faq: {
      enabled: true,
    },
    searchSuggestions: {
      enabled: true,
    },
    savedFilters: {
      enabled: true,
    },
    filters: {
      enabled: true,
    },
    addToCart: {
      enabled: true,
    },
  },
  social: {
    instagram: {
      enabled: true,
    },
    telegram: {
      enabled: true,
    },
    whatsapp: {
      enabled: true,
    },
    bale: {
      enabled: true,
    },
  },
  cart: {
    checkoutEntry: {
      enabled: true,
    },
  },
  checkout: {
    customerForm: {
      enabled: true,
    },
    addressForm: {
      enabled: true,
    },
    shippingOptions: {
      enabled: true,
    },
    paymentMethods: {
      enabled: true,
    },
  },
} as const;

// ✅ تایپ SiteFeatures — بر اساس ساختار SITE_FEATURES
export type SiteFeatures = typeof SITE_FEATURES;