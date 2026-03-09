import { getSiteConfig } from "@/lib/site-config";

export default function sitemap() {
  const site = getSiteConfig();

  return [
    {
      url: site.url,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1,
    },
  ];
}