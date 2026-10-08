import {
  Truck,
  ShieldCheck,
  CreditCard,
  Headphones,
  RefreshCw,
  Award,
} from "lucide-react";

// ============================================================
// آیتم‌های نوار اعتماد
// ============================================================
const TRUST_ITEMS = [
  {
    icon: Truck,
    title: "ارسال سریع",
    description: "به سراسر ایران",
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/40",
  },
  {
    icon: ShieldCheck,
    title: "ضمانت اصالت",
    description: "کالای اورجینال",
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-950/40",
  },
  {
    icon: CreditCard,
    title: "پرداخت امن",
    description: "درگاه معتبر",
    color: "text-purple-600",
    bg: "bg-purple-50 dark:bg-purple-950/40",
  },
  {
    icon: RefreshCw,
    title: "۷ روز مرجوعی",
    description: "بدون قید و شرط",
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/40",
  },
  {
    icon: Headphones,
    title: "پشتیبانی ۲۴/۷",
    description: "همیشه در دسترس",
    color: "text-rose-600",
    bg: "bg-rose-50 dark:bg-rose-950/40",
  },
  {
    icon: Award,
    title: "گارانتی معتبر",
    description: "تضمین کیفیت",
    color: "text-indigo-600",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
  },
];

export function TrustBar() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {TRUST_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.title}
            className={cn(
              "flex flex-col items-center gap-2 p-4 text-center",
              "rounded-xl border border-border bg-card",
              "transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            )}
          >
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full",
                item.bg,
                item.color
              )}
            >
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary">
                {item.title}
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                {item.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ✅ برای استفاده در کامپوننت‌های Client
import { cn } from "@/utils/cn";