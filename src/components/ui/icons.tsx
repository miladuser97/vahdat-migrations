import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Schools: a simple building with a triangular roof. */
export function SchoolIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3l9 5-9 5-9-5 9-5Z" />
      <path d="M5 11v6c0 1 3 3 7 3s7-2 7-3v-6" />
    </svg>
  );
}

/** Educational institutes: a simple graduation cap. */
export function GraduationIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 4 3 8l9 4 9-4-9-4Z" />
      <path d="M7 10.5V15c0 1.1 2.2 2 5 2s5-.9 5-2v-4.5" />
    </svg>
  );
}

/** Kindergartens: simple blocks / toy shapes. */
export function KindergartenIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="13" width="6" height="6" rx="1" />
      <circle cx="16" cy="8" r="3" />
      <rect x="13" y="13" width="6" height="6" rx="1" />
    </svg>
  );
}

/** Government offices: a building with columns. */
export function GovernmentIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 10 12 4l8 6" />
      <path d="M5 10v9M9 10v9M15 10v9M19 10v9" />
      <path d="M4 19h16" />
    </svg>
  );
}

/** Companies & organizations: a simple briefcase. */
export function CompanyIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="8" width="18" height="11" rx="2" />
      <path d="M9 8V6c0-.6.4-1 1-1h4c.6 0 1 .4 1 1v2" />
    </svg>
  );
}

/** Internet cafes: a simple monitor. */
export function InternetCafeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="4" width="18" height="12" rx="1" />
      <path d="M9 20h6M12 16v4" />
    </svg>
  );
}

/** Public customers: a simple person. */
export function PublicCustomerIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
    </svg>
  );
}

/** Paper category: a sheet with a folded corner. */
export function PaperIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 3h9l3 3v15H6Z" />
      <path d="M15 3v3h3" />
    </svg>
  );
}

/** Office supplies category: a simple folder. */
export function OfficeSuppliesIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 7a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7Z" />
    </svg>
  );
}

/** Writing instruments category: a simple pen. */
export function WritingInstrumentIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m4 20 1-4L16 5l3 3L8 19l-4 1Z" />
      <path d="m14 7 3 3" />
    </svg>
  );
}

/** School supplies category: a simple notebook. */
export function SchoolSuppliesIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4Z" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  );
}

/** Printer supplies category: a simple printer. */
export function PrinterSuppliesIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="8" width="16" height="8" rx="1" />
      <path d="M7 8V4h10v4M7 16v4h10v-4" />
    </svg>
  );
}

/** Office equipment category: a simple cabinet. */
export function OfficeEquipmentIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="5" y="3" width="14" height="18" rx="1" />
      <path d="M5 11h14" />
      <path d="M9 7h2M9 15h2" />
    </svg>
  );
}

/** Phone contact method: a simple handset. */
export function PhoneIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 4h3l2 5-2 1a11 11 0 0 0 6 6l1-2 5 2v3a2 2 0 0 1-2 2 16 16 0 0 1-15-15 2 2 0 0 1 2-2Z" />
    </svg>
  );
}

/** Email contact method: a simple envelope. */
export function EmailIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="1" />
      <path d="m4 6 8 7 8-7" />
    </svg>
  );
}

/** Address contact method: a simple location pin. */
export function LocationIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.25" />
    </svg>
  );
}

/** Working hours: a simple clock. */
export function ClockIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

/** Shopping cart: used by the Header's cart link (Phase 18). */
export function CartIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.8h7.6a2 2 0 0 0 2-1.6L20.5 8H6" />
      <circle cx="9.5" cy="20" r="1.25" />
      <circle cx="17" cy="20" r="1.25" />
    </svg>
  );
}

/** Account/session: used by the Header's login/account link (Phase 3). */
export function UserIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
    </svg>
  );
}

/** Logout: a door with an outward-pointing arrow (Phase 3). */
export function LogoutIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
      <path d="M14 15l4-4-4-4" />
      <path d="M18 11H9" />
    </svg>
  );
}

// ============================================================
// SOCIAL MEDIA & CONTACT ICONS
// ============================================================

/** WhatsApp icon - استایل خطی (هماهنگ با بقیه) */
export function WhatsAppIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
      <path d="M11 8v3l2 1" />
    </svg>
  );
}

/** Telegram icon - استایل خطی (هماهنگ با بقیه) */
export function TelegramIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 2L2 9.5l7 2.5" />
      <path d="M9 12l3 7L21 2" />
      <path d="M9 12l4 4" />
    </svg>
  );
}

/** Bale icon - اصلاح‌شده با استایل خطی و تیک ۹۰ درجه به بالا */
export function BaleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 12a9 9 0 01-9 9 8.84 8.84 0 01-4.5-1.2L3 21l1.8-5.2A8.84 8.84 0 013 12a9 9 0 019-9 9 9 0 019 9z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

/** Instagram icon - استایل خطی (هماهنگ با بقیه) */
export function InstagramIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="17" cy="7" r="0.75" fill="currentColor" />
    </svg>
  );
}

/** Close icon (X) */
export function CloseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/** Chat icon (message bubble) */
export function ChatIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ============================================================
// ✅ آیکون جدید: درخواست تعمیر (Wrench)
// ============================================================
export function WrenchIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

// ============================================================
// ✅ آیکون‌های تم (روشن / تاریک)
// ============================================================

/**
 * SunIcon
 * آیکون خورشید — برای وقتی که کاربر توی Dark Mode هست
 * (کلیک روی این، می‌بره به Light Mode)
 */
export function SunIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M4.93 4.93l1.41 1.41" />
      <path d="M17.66 17.66l1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="M6.34 17.66l-1.41 1.41" />
      <path d="M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

/**
 * MoonIcon
 * آیکون ماه — برای وقتی که کاربر توی Light Mode هست
 * (کلیک روی این، می‌بره به Dark Mode)
 */
export function MoonIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

// ============================================================
// (نگه‌داشتن ThemeIcon برای سازگاری — ولی دیگه استفاده نمی‌شه)
// ============================================================
export function ThemeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2v1.5" />
      <path d="M12 20.5V22" />
      <path d="M4.5 4.5l1.06 1.06" />
      <path d="M18.44 18.44l1.06 1.06" />
      <path d="M2 12h1.5" />
      <path d="M20.5 12H22" />
      <path d="M4.5 19.5l1.06-1.06" />
      <path d="M18.44 5.56l1.06-1.06" />
      <path d="M16 12a4 4 0 01-8 0 4 4 0 015-3.87 3 3 0 003 3.87" />
    </svg>
  );
}