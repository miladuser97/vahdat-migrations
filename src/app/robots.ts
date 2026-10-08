import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Robots — Next.js Metadata Route convention, auto-served at
 * /robots.txt. Allows indexing of public content (the site is meant to
 * be found) while excluding private/auth-gated and purely functional
 * routes that have no SEO value and would otherwise waste crawl budget
 * or surface authenticated-only URLs in search results: account and
 * admin (both already server-side auth-gated — this is defense in
 * depth for search visibility, not a security control on its own),
 * plus checkout/cart/login/register, which are transactional, not
 * content, pages.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/account", "/admin", "/checkout", "/cart", "/login", "/register"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}