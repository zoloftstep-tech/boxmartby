import type { MetadataRoute } from "next";
import { LANDING_SLUGS, LANDINGS } from "@/lib/landings";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const landings = LANDING_SLUGS.map((slug) => ({
    url: `${SITE_URL}${LANDINGS[slug].path}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...landings,
  ];
}
