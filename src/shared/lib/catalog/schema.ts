import { z } from "zod";
import type { Product } from "@/shared/lib/catalog/types";

const ISO_DATE_TIME_SCHEMA = z.string().datetime({ offset: true }); // Accept "Z" and "+00:00" style ISO datetimes.

/**
 * Runtime validation schema for a single product object.
 * Keeps JSON/SQL data honest at runtime (TS types only validate at compile time).
 */
export const ProductSchema: z.ZodType<Product> = z
  .object({
    id: z.string().min(1), // Stable internal id.
    source: z.string().min(1).optional(), // Source system tag (json/sql/agent).
    externalId: z.string().min(1).optional(), // Source-native identifier.
    lastSeenAt: ISO_DATE_TIME_SCHEMA.optional(), // Timestamp for agent dedupe.
    lastPriceCheckAt: ISO_DATE_TIME_SCHEMA.optional(), // Timestamp for price refresh.
    slug: z
      .string()
      .min(1)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), // URL-safe slug used in routes.
    name: z.string().min(1), // Human-friendly title.
    category: z.string().min(1), // Top-level category label.
    subCategory: z.string().min(1).optional(), // Optional nested category.
    tags: z.array(z.string().min(1)).optional(), // Optional keyword tags.
    price: z.number().finite().nonnegative(), // Current price shown to users.
    originalPrice: z.number().finite().nonnegative().optional(), // Optional crossed-out price.
    rating: z.number().finite().min(0).max(5).optional(), // 0..5 star rating.
    ratingCount: z.number().int().nonnegative().optional(), // Count of ratings/reviews.
    images: z.array(z.string().min(1)).min(1), // Primary image + optional gallery.
    description: z.string().min(1), // SEO-friendly description stored per product.
    affiliateUrl: z.string().url(), // Outbound affiliate destination.
    retailer: z.string().min(1).optional(), // Retailer label for CTA text.
    videoUrl: z.string().url().optional(), // Optional review/demo video.
    dealEndsAt: ISO_DATE_TIME_SCHEMA.optional(), // Optional deal expiration timestamp.
    isSponsored: z.boolean().optional(), // Optional native ad flag.
    publishState: z
      .enum(["draft", "published", "unpublished"])
      .optional(), // Optional publish state for agent moderation workflows.
  })
  .strict()
  .superRefine((product, context) => {
    if (product.originalPrice !== undefined && product.originalPrice < product.price) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "originalPrice must be greater than or equal to price",
        path: ["originalPrice"],
      }); // Prevents "discount" UI from rendering backwards.
    }
  });

/**
 * Runtime validation schema for the full product catalog list.
 * Adds uniqueness checks (ids + slugs must not collide).
 */
export const ProductCatalogSchema: z.ZodType<Product[]> = z
  .array(ProductSchema)
  .superRefine((products, context) => {
    const seenIds = new Set<string>(); // Track ids to detect collisions.
    const seenSlugs = new Set<string>(); // Track slugs to detect collisions.

    products.forEach((product, index) => {
      if (seenIds.has(product.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate product id: ${product.id}`,
          path: [index, "id"],
        }); // Surface duplicate ids with the exact item index.
      } else {
        seenIds.add(product.id); // Record id for later collisions.
      }

      if (seenSlugs.has(product.slug)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate product slug: ${product.slug}`,
          path: [index, "slug"],
        }); // Surface duplicate slugs with the exact item index.
      } else {
        seenSlugs.add(product.slug); // Record slug for later collisions.
      }
    });
  });
