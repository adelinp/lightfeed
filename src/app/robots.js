import { getSiteConfig } from "@/lib/site-config";

export default function robots() {
  const site = getSiteConfig();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/settings", "/settings/*"],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}