import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "تحریرینو",
    short_name: "تحریرینو",
    description:
      "تحریرینو، فروشگاه کاغذ و لوازم‌التحریر برای مدارس، ادارات، سازمان‌ها و مشتریان عمومی.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F5F1",
    theme_color: "#F7F5F1",
    lang: "fa",
    dir: "rtl",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
