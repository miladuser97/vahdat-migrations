// ============================================================
// کلیدهای مجاز تنظیمات سایت
// ⚠️ این فایل نباید "use server" داشته باشه چون object و type
//    export می‌کنه. فقط توابع async می‌تونن در فایل‌های "use server"
//    export بشن.
// ============================================================

export const SETTING_KEYS = {
  ZARINPAL_ENABLED: "zarinpal_enabled",
  CASH_ON_DELIVERY_ENABLED: "cash_on_delivery_enabled",
  DARK_MODE_ENABLED: "dark_mode_enabled",
  WISHLIST_ENABLED: "wishlist_enabled",
  COMPARE_ENABLED: "compare_enabled",
  QUICK_VIEW_ENABLED: "quick_view_enabled",
  TECHNO_TIME_ENABLED: "techno_time_enabled",
  USED_PRODUCTS_ENABLED: "used_products_enabled",
  INSTALLMENT_ENABLED: "installment_enabled",
  LOYALTY_POINTS_ENABLED: "loyalty_points_enabled",
  FINANCIAL_TEST_ENABLED: "financial_test_enabled",
  TRUST_BAR_ENABLED: "trust_bar_enabled",
  BRANDS_SLIDER_ENABLED: "brands_slider_enabled",
  BLOG_PREVIEW_ENABLED: "blog_preview_enabled",
  LIVE_CHAT_ENABLED: "live_chat_enabled",
  FLOATING_CONTACT_ENABLED: "floating_contact_enabled",
  WHATSAPP_ENABLED: "whatsapp_enabled",
  TELEGRAM_ENABLED: "telegram_enabled",
  GOOGLE_MAP_ENABLED: "google_map_enabled",
  REPAIR_ENABLED: "repair_enabled",
  REPAIR_TRACKING_ENABLED: "repair_tracking_enabled",
  ADMIN_PANEL_ENABLED: "admin_panel_enabled",
  PRODUCT_RATING_ENABLED: "product_rating_enabled",
  COUNTDOWN_TIMER_ENABLED: "countdown_timer_enabled",
} as const;

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];