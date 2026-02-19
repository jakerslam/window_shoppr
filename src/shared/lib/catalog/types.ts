/**
 * Core product data types used across the app.
 */
export type ProductPublishState = "draft" | "published" | "unpublished";

export type AffiliateVerificationSource = "first_party" | "agent" | "merchant";

export type AffiliateVerificationStatus = "verified" | "pending" | "failed";

export type AffiliateVerification = {
  source: AffiliateVerificationSource;
  status: AffiliateVerificationStatus;
  network?: string;
};

export type AdCreative = {
  headline: string;
  body: string;
  cta: string;
  image?: string;
};

export type Product = {
  id: string;
  source?: string;
  externalId?: string;
  lastSeenAt?: string;
  lastPriceCheckAt?: string;
  slug: string;
  name: string;
  category: string;
  subCategory?: string;
  tags?: string[];
  blogId?: string;
  blogSlug?: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  ratingCount?: number;
  saveCount?: number;
  images: string[];
  description: string;
  affiliateUrl: string;
  affiliateVerification?: AffiliateVerification;
  adCreative?: AdCreative;
  retailer?: string;
  videoUrl?: string;
  dealEndsAt?: string;
  isSponsored?: boolean;
  publishState?: ProductPublishState;
};

/**
 * Centralized UI constants tied to product content display.
 */
export const PRODUCT_UI = {
  DESCRIPTION_COLLAPSE_LIMIT: 800,
} as const;
