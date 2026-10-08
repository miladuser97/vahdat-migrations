// ============================================================
// منوی ناوبری اصلی — یکجا برای هدر، فوتر، و موبایل
// ============================================================

export interface MenuItem {
  label: string;
  href: string;
  icon?: string;
  children?: MenuItem[];
}

// ============================================================
// منوی اصلی هدر
// ============================================================
export const MAIN_MENU: MenuItem[] = [
  { label: "خانه", href: "/" },
  { label: "فروشگاه", href: "/products" },
  { label: "دسته‌بندی‌ها", href: "/categories" },
  { label: "پیشنهاد ویژه", href: "/products?filter=discounted" },
  { label: "کارکرده", href: "/products?filter=used" },
  { label: "درخواست تعمیر", href: "/repair" },
  { label: "وبلاگ", href: "/blog" },
  { label: "درباره ما", href: "/about" },
  { label: "تماس با ما", href: "/contact" },
];

// ============================================================
// منوی فوتر — ستون‌ها
// ============================================================
export const FOOTER_MENU = {
  quickAccess: {
    title: "دسترسی سریع",
    links: [
      { label: "خانه", href: "/" },
      { label: "فروشگاه", href: "/products" },
      { label: "دسته‌بندی‌ها", href: "/categories" },
      { label: "وبلاگ", href: "/blog" },
      { label: "تماس با ما", href: "/contact" },
    ],
  },
  aboutShop: {
    title: "درباره فروشگاه",
    links: [
      { label: "درباره ما", href: "/about" },
      { label: "قوانین و مقررات", href: "/terms" },
      { label: "حریم خصوصی", href: "/privacy" },
      { label: "سوالات متداول", href: "/faq" },
      { label: "تماس با ما", href: "/contact" },
    ],
  },
  customerService: {
    title: "خدمات مشتریان",
    links: [
      { label: "پیگیری سفارشات", href: "/account/orders" },
      { label: "پیگیری تعمیرات", href: "/repair/track" },
      { label: "شرایط بازگشت", href: "/terms#return" },
      { label: "خرید اقساطی", href: "/installment" },
      { label: "حساب کاربری", href: "/account" },
    ],
  },
  popularCategories: {
    title: "محصولات پرفروش",
    links: [
      { label: "گوشی سامسونگ", href: "/categories/samsung-phones" },
      { label: "گوشی اپل", href: "/categories/apple-phones" },
      { label: "گوشی شیائومی", href: "/categories/xiaomi-phones" },
      { label: "لپ‌تاپ", href: "/categories/laptops" },
      { label: "تبلت", href: "/categories/tablets" },
      { label: "ساعت هوشمند", href: "/categories/smartwatches" },
    ],
  },
};

// ============================================================
// اطلاعات تماس
// ============================================================
export const CONTACT_INFO = {
  phone: "09127809720",
  phone2: "",
  landline: "",
  email: "",
  address: "قزوین، غیاث آباد، خیابان ساحل، جنب درمانگاه صدرا",
  workingHours: "شنبه تا پنجشنبه ۱۰ صبح تا ۲۱",
};

// ============================================================
// شبکه‌های اجتماعی
// ============================================================
export const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/mobile.vahdat",
  telegram: "",
  whatsapp: "https://wa.me/989127809720",
  bale: "",
};