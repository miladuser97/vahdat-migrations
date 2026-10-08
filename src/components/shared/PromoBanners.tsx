import Link from "next/link";
import { ArrowLeft, Zap, Gift, Percent } from "lucide-react";
import { cn } from "@/utils/cn";

// ============================================================
// بنرهای پیش‌فرض
// ============================================================
const PROMO_BANNERS = [
  {
    id: "1",
    title: "خرید اقساطی",
    subtitle: "بدون ضامن، تا ۱۲ ماه",
    href: "/installment",
    gradient: "from-purple-600 to-indigo-700",
    icon: Zap,
    emoji: "💳",
  },
  {
    id: "2",
    title: "تخفیف ویژه",
    subtitle: "تا ۵۰٪ تخفیف",
    href: "/products?filter=discounted",
    gradient: "from-rose-500 to-orange-600",
    icon: Percent,
    emoji: "🔥",
  },
  {
    id: "3",
    title: "هدیه خرید",
    subtitle: "با هر خرید بالای ۵ میلیون",
    href: "/products",
    gradient: "from-emerald-500 to-teal-700",
    icon: Gift,
    emoji: "🎁",
  },
];

export function PromoBanners() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {PROMO_BANNERS.map((banner) => {
        const Icon = banner.icon;
        return (
          <Link
            key={banner.id}
            href={banner.href}
            className={cn(
              "group relative overflow-hidden rounded-2xl p-6",
              "bg-gradient-to-br text-white",
              "transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl",
              "min-h-[140px] flex flex-col justify-between",
              banner.gradient
            )}
          >
            {/* الگوی SVG */}
            <svg
              className="absolute inset-0 h-full w-full opacity-10"
              viewBox="0 0 400 200"
              fill="none"
              preserveAspectRatio="xMidYMid slice"
            >
              <circle cx="320" cy="40" r="80" stroke="white" strokeWidth="1" />
              <circle cx="80" cy="160" r="60" stroke="white" strokeWidth="1" />
              <path
                d="M0 180 Q100 140 200 180 T400 180"
                stroke="white"
                strokeWidth="0.8"
                opacity="0.5"
              />
            </svg>

            {/* آیکون بزرگ */}
            <div className="absolute top-4 left-4 h-12 w-12 flex items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
              <span className="text-2xl">{banner.emoji}</span>
            </div>

            {/* محتوا */}
            <div className="relative z-10 mt-10">
              <div className="inline-flex items-center gap-1.5 mb-2 rounded-full bg-white/20 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-bold">
                <Icon className="h-3 w-3" />
                <span>ویژه</span>
              </div>

              <h3 className="text-xl font-bold leading-tight">
                {banner.title}
              </h3>
              <p className="text-sm text-white/90 mt-1">
                {banner.subtitle}
              </p>

              <div className="mt-4 flex items-center gap-1 text-xs font-bold opacity-90 group-hover:gap-2 transition-all">
                <span>مشاهده</span>
                <ArrowLeft className="h-3.5 w-3.5" />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}