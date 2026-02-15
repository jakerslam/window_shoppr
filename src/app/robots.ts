import type { MetadataRoute } from "next";
import { SITE_URL } from "@/shared/lib/platform/seo";

export const dynamic = "force-static"; // Required for static export.

/**
 * Provide crawl directives and sitemap location for robots.txt.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*", // Target all crawlers.
        allow: "/", // Allow full site indexing.
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`, // Point to the generated sitemap.
  };
}
