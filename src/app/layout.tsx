import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { CartProvider } from "@/features/cart/CartProvider";
import { AuthProvider } from "@/features/account/AuthContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { FloatingContact } from "@/components/shared/FloatingContact";
import { getSetting } from "@/lib/server/site-settings";
import { SETTING_KEYS } from "@/lib/settings-keys";

export const metadata: Metadata = {
  title: {
    default: "موبایل وحدت | موبایل، لپ‌تاپ و لوازم جانبی",
    template: "%s | موبایل وحدت",
  },
  description:
    "موبایل وحدت — تخصصی در فروش گوشی موبایل، لپ‌تاپ، لوازم جانبی، ساعت هوشمند و تجهیزات دیجیتال با ضمانت اصالت کالا و ارسال سریع",
  keywords: [
    "موبایل وحدت",
    "فروشگاه موبایل",
    "خرید گوشی",
    "لپ تاپ",
    "خرید لپ تاپ",
    "لوازم جانبی موبایل",
    "ساعت هوشمند",
    "هدفون",
    "قزوین",
  ],
  authors: [{ name: "موبایل وحدت" }],
  creator: "موبایل وحدت",
  publisher: "موبایل وحدت",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: "/",
    siteName: "موبایل وحدت",
    title: "موبایل وحدت | موبایل، لپ‌تاپ و لوازم جانبی",
    description:
      "فروشگاه تخصصی موبایل، لپ‌تاپ، لوازم جانبی و تجهیزات دیجیتال با ضمانت اصالت",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "موبایل وحدت",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "موبایل وحدت",
    description: "فروشگاه تخصصی موبایل، لپ‌تاپ و لوازم جانبی",
    images: ["/images/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [
    showFloatingContact,
    showWhatsApp,
    showTelegram,
    showWishlist,
    showDarkMode,
    showRepair,
  ] = await Promise.all([
    getSetting(SETTING_KEYS.FLOATING_CONTACT_ENABLED, true),
    getSetting(SETTING_KEYS.WHATSAPP_ENABLED, true),
    getSetting(SETTING_KEYS.TELEGRAM_ENABLED, true),
    getSetting(SETTING_KEYS.WISHLIST_ENABLED, true),
    getSetting(SETTING_KEYS.DARK_MODE_ENABLED, true),
    getSetting(SETTING_KEYS.REPAIR_ENABLED, true),
  ]);

  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        {/* ✅ Preload فونت شبنم (برای لود سریع‌تر) */}
        <link
          rel="preload"
          href="/fonts/shabnam/Shabnam-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/shabnam/Shabnam-Medium.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/shabnam/Shabnam-Bold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <CartProvider>
              <Header
                showWhatsApp={showWhatsApp}
                showTelegram={showTelegram}
                showWishlist={showWishlist}
                showDarkMode={showDarkMode}
                showRepair={showRepair}
              />

              <main className="flex-1 pb-16 lg:pb-0">{children}</main>

              <Footer />

              <BottomNavigation />

              {showFloatingContact && <FloatingContact />}
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}