/**
 * Core product data types used across the app.
 */
export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  subCategory?: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  ratingCount?: number;
  images: string[];
  description: string;
  affiliateUrl: string;
  videoUrl?: string;
  dealEndsAt?: string;
  isSponsored?: boolean;
};

/**
 * Centralized UI constants tied to product content display.
 */
export const PRODUCT_UI = {
  DESCRIPTION_PREVIEW_LIMIT: 400,
} as const;
