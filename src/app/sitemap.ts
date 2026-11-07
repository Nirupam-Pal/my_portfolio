import type { MetadataRoute } from "next";

import { projects } from "@/data/projects";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${siteUrl}/`, changeFrequency: "monthly", priority: 1 },
    ...projects.map((project) => ({ url: `${siteUrl}${project.caseStudy}/`, changeFrequency: "yearly" as const, priority: 0.8 })),
  ];
}
