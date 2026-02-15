/**
 * Core product data types used across the app.
 */
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
  price: number;
  originalPrice?: number;
  rating?: number;
  ratingCount?: number;
  images: string[];
  description: string;
  affiliateUrl: string;
  retailer?: string;
  videoUrl?: string;
  dealEndsAt?: string;
  isSponsored?: boolean;
};

/**
 * Centralized UI constants tied to product content display.
 */
export const PRODUCT_UI = {
  DESCRIPTION_COLLAPSE_LIMIT: 800,
} as const;
