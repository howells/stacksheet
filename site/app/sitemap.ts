import { source } from "@/lib/source";
import type { MetadataRoute } from "next";

const baseUrl = "https://stacksheet.danielhowells.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const docs = source.getPages().map((page) => ({
    url: `${baseUrl}${page.url}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
    },
    ...docs,
  ];
}
