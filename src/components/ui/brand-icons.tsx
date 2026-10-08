import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

// ============================================================
// Instagram — صورتی-بنفش (رنگ ثابت — بدون gradient)
// ============================================================
export function InstagramBrandIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="50" cy="50" r="50" fill="#D6249F" />
      <rect
        x="25" y="25" width="50" height="50" rx="14" ry="14"
        fill="none" stroke="#FFFFFF" strokeWidth="5"
      />
      <circle cx="50" cy="50" r="12" fill="none" stroke="#FFFFFF" strokeWidth="5" />
      <circle cx="67" cy="33" r="3.5" fill="#FFFFFF" />
    </svg>
  );
}

// ============================================================
// Telegram — آبی + سفید
// ============================================================
export function TelegramBrandIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="50" cy="50" r="50" fill="#29A9EB" />
      <path
        d="M72 30L22 49c-2.5 1-2.5 4.5 0 5.3l11 3.3l4 13c.7 2.5 4 3 5.5 1.2l6.5-6.7l11.5 8.5c2 1.5 5 .4 5.5-2.2L73 32.5c.5-2.7-2-4.8-4.5-3.8z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

// ============================================================
// WhatsApp — سبز + حباب سفید + تلفن سبز
// ============================================================
export function WhatsAppBrandIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="50" cy="50" r="50" fill="#25D366" />
      <path
        d="M50 20c-16.5 0-30 13.5-30 30 0 5.3 1.4 10.3 3.8 14.7L20 84l15-3.9c4.1 2.2 8.8 3.4 13.7 3.4h.3c16.5 0 30-13.5 30-30S66.5 20 50 20z"
        fill="#FFFFFF"
      />
      <path
        d="M63 58c-.9-.4-5.3-2.6-6.1-2.9-.8-.3-1.4-.4-2 .5-.6.9-2.3 2.9-2.8 3.5-.5.6-1 .6-1.9.2-.9-.4-3.7-1.4-7.1-4.4-2.6-2.3-4.4-5.2-4.9-6.1-.5-.9-.1-1.3.4-1.8.4-.4.9-1 1.3-1.5.4-.5.5-.9.3-1.5-.2-.6-1.9-4.6-2.6-6.3-.7-1.7-1.4-1.4-1.9-1.4h-1.6c-.6 0-1.5.2-2.3 1.1-.8.9-3 2.9-3 7.1s3.1 8.2 3.5 8.8c.4.5 6 9.6 14.6 13.4 2 .9 3.6 1.4 4.9 1.8 2 .6 3.9.5 5.3.3 1.6-.2 4.8-2 5.5-3.9.7-1.9.7-3.5.5-3.8-.2-.4-.7-.6-1.5-1z"
        fill="#25D366"
      />
    </svg>
  );
}

// ============================================================
// Bale — فیروزه‌ای (رنگ ثابت — بدون gradient) + تیزی رو به بالا-چپ
// ============================================================
export function BaleBrandIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
      {/* دایره پس‌زمینه — فیروزه‌ای */}
      <circle cx="50" cy="50" r="50" fill="#0891B2" />

      {/* حباب چت سفید — یک تکه، تیزی سمت چپ-بالا */}
      <path
        d="M42 22 C30 22 22 32 22 45 L22 60 C22 72 32 80 50 80 C68 80 78 72 78 60 L78 40 C78 30 72 22 62 22 L42 22 Z M22 45 L18 18 L32 32 Z"
        fill="#FFFFFF"
      />

      {/* تیک فیروزه‌ای */}
      <path
        d="M40 50l7 7l15-15"
        stroke="#0891B2"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}