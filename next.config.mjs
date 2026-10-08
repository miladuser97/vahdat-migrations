/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // ✅ تنظیمات تصاویر برای next/image
  images: {
    remotePatterns: [
      // Supabase Storage
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "*.supabase.in",
      },
      // Vercel Blob
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      // هر دامنه‌ی خارجی دیگه (اختیاری)
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Production Hardening: Security Headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // script-src: فقط منابع خودمان + unsafe-inline برای Next.js
              "script-src 'self' 'unsafe-inline'",
              // style-src: فقط خودمان + unsafe-inline برای Tailwind
              "style-src 'self' 'unsafe-inline'",
              // تصاویر: خودمان + data: + Supabase + هر دامنه‌ای
              "img-src 'self' data: blob: https:",
              // فونت‌ها: خودمان + jsdelivr
              "font-src 'self' https://cdn.jsdelivr.net",
              // اتصالات: خودمان + Supabase
              "connect-src 'self' https://*.supabase.co https://*.supabase.in",
              // فریم‌ها: هیچ کجا
              "frame-ancestors 'none'",
              // فرم‌ها: فقط خودمان
              "form-action 'self'",
              // manifest: فقط خودمان
              "manifest-src 'self'",
              // worker: فقط خودمان
              "worker-src 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;