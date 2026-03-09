const fallbackSiteUrl = "http://localhost:3000";

export function getSiteConfig() {
  return {
    name: process.env.NEXT_PUBLIC_SITE_NAME || "LightFeed",
    title: process.env.NEXT_PUBLIC_SITE_TITLE || "LightFeed RSS Reader",
    description:
      process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
      "A fast, privacy-friendly open source RSS reader.",
    url: process.env.NEXT_PUBLIC_SITE_URL || fallbackSiteUrl,
    locale: process.env.NEXT_PUBLIC_SITE_LOCALE || "en_US",
    ogImage: process.env.NEXT_PUBLIC_SITE_OG_IMAGE || "/icons/icon-512.png",
  };
}