"use client";

import Link from "next/link";
import {
  Phone,
  MapPin,
  Clock,
  ArrowUp,
  ShieldCheck,
  Truck,
  CreditCard,
  Headphones,
} from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Logo } from "@/components/shared/Logo";
import {
  FOOTER_MENU,
  CONTACT_INFO,
  SOCIAL_LINKS,
} from "@/config/navigation/menu";
import { cn } from "@/utils/cn";
import { toPersianDigits } from "@/utils/text-utils";
import {
  InstagramBrandIcon,
  TelegramBrandIcon,
  WhatsAppBrandIcon,
  BaleBrandIcon,
} from "@/components/ui/brand-icons";

// ============================================================
// ویژگی‌های اعتماد
// ============================================================
const TRUST_FEATURES = [
  {
    icon: <Truck className="h-6 w-6" />,
    title: "ارسال سریع",
    description: "به سراسر ایران",
  },
  {
    icon: <ShieldCheck className="h-6 w-6" />,
    title: "ضمانت اصالت",
    description: "کالای اورجینال",
  },
  {
    icon: <CreditCard className="h-6 w-6" />,
    title: "پرداخت امن",
    description: "درگاه معتبر",
  },
  {
    icon: <Headphones className="h-6 w-6" />,
    title: "پشتیبانی ۲۴/۷",
    description: "همیشه در دسترس",
  },
];

// ============================================================
// Footer
// ============================================================
export function Footer() {
  const year = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ✅ فقط شبکه‌های اجتماعی که لینک دارن
  const availableSocials = [
    { key: "instagram", href: SOCIAL_LINKS.instagram, label: "اینستاگرام", Icon: InstagramBrandIcon },
    { key: "telegram", href: SOCIAL_LINKS.telegram, label: "تلگرام", Icon: TelegramBrandIcon },
    { key: "whatsapp", href: SOCIAL_LINKS.whatsapp, label: "واتساپ", Icon: WhatsAppBrandIcon },
    { key: "bale", href: SOCIAL_LINKS.bale, label: "بله", Icon: BaleBrandIcon },
  ].filter((s) => s.href && s.href.trim() !== "");

  return (
    <footer className="mt-16 bg-gradient-to-b from-brand-700 to-brand-900 text-white">
      {/* ========================================== */}
      {/* نوار ویژگی‌های اعتماد */}
      {/* ========================================== */}
      <div className="border-b border-white/10">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6">
            {TRUST_FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="flex items-center gap-3 p-3 rounded-lg"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10">
                  {feature.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold !text-white">{feature.title}</p>
                  <p className="text-xs text-white/70 truncate">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* ========================================== */}
      {/* بخش اصلی فوتر */}
      {/* ========================================== */}
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 py-12">
          {/* ستون ۱: درباره فروشگاه */}
          <div className="lg:col-span-2 space-y-4">
            <div className="[&_*]:!text-white">
              <Logo />
            </div>

            <p className="text-sm text-white/80 leading-relaxed">
              موبایل وحدت، عرضه‌کننده انواع گوشی موبایل، لوازم جانبی،
              ساعت هوشمند و تجهیزات دیجیتال با ضمانت اصالت کالا و قیمت رقابتی.
              رضایت شما، افتخار ماست.
            </p>

            {/* اطلاعات تماس */}
            <ul className="space-y-3 text-sm">
              {CONTACT_INFO.address && (
                <li className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 shrink-0 mt-0.5 text-white/70" />
                  <span className="text-white/90">{CONTACT_INFO.address}</span>
                </li>
              )}

              {CONTACT_INFO.phone && (
                <li className="flex items-center gap-3">
                  <Phone className="h-5 w-5 shrink-0 text-white/70" />
                  <a
                    href={`tel:${CONTACT_INFO.phone}`}
                    className="text-white/90 hover:text-white transition-colors fa-num"
                    dir="ltr"
                  >
                    {toPersianDigits(CONTACT_INFO.phone)}
                  </a>
                </li>
              )}

              {CONTACT_INFO.workingHours && (
                <li className="flex items-center gap-3">
                  <Clock className="h-5 w-5 shrink-0 text-white/70" />
                  <span className="text-white/90">{CONTACT_INFO.workingHours}</span>
                </li>
              )}
            </ul>
          </div>

          {/* ستون ۲-۵: منوهای فوتر */}
          {Object.values(FOOTER_MENU).map((group) => (
            <div key={group.title} className="space-y-4">
              <h3 className="text-base font-bold !text-white relative pb-2 after:absolute after:bottom-0 after:right-0 after:h-0.5 after:w-8 after:bg-white/40">
                {group.title}
              </h3>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "inline-flex items-center text-sm text-white/80",
                        "hover:text-white hover:pr-1",
                        "transition-all duration-200",
                        "before:content-[''] before:w-1 before:h-1 before:rounded-full before:bg-white/40 before:ml-2"
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ========================================== */}
        {/* شبکه‌های اجتماعی + نمادها */}
        {/* ========================================== */}
        <div className="border-t border-white/10 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* شبکه‌های اجتماعی */}
            {availableSocials.length > 0 && (
              <div>
                <p className="text-sm font-bold !text-white mb-3">
                  ما را در شبکه‌های اجتماعی دنبال کنید
                </p>
                <div className="flex items-center gap-3">
                  {availableSocials.map(({ key, href, label, Icon }) => (
                    <a
                      key={key}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full hover:scale-110 transition-transform"
                    >
                      <Icon className="h-10 w-10" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* نمادهای اعتماد */}
            <div className="lg:text-left">
              <p className="text-sm font-bold !text-white mb-3">نمادهای اعتماد</p>
              <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white/10 text-[10px] text-white/70 border border-white/20">
                  ای‌نماد
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white/10 text-[10px] text-white/70 border border-white/20">
                  ساماندهی
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white/10 text-[10px] text-white/70 border border-white/20">
                  اعتماد
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* ========================================== */}
      {/* نوار کپی‌رایت + بازگشت به بالا */}
      {/* ========================================== */}
      <div className="bg-black/20 border-t border-white/10">
        <Container>
          <div className="flex flex-col items-center gap-4 py-4">
            <button
              type="button"
              onClick={scrollToTop}
              aria-label="بازگشت به بالا"
              className={cn(
                "flex items-center gap-2",
                "px-4 py-2 rounded-lg",
                "bg-white/10 hover:bg-white/20",
                "text-sm text-white/90",
                "transition-colors"
              )}
            >
              <ArrowUp className="h-4 w-4" />
              <span>بازگشت به بالا</span>
            </button>

            <p className="text-xs text-white/70 text-center fa-num">
              © {toPersianDigits(year)} موبایل وحدت — تمامی حقوق محفوظ است
            </p>
          </div>
        </Container>
      </div>
    </footer>
  );
}