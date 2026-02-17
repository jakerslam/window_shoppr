import type { Metadata } from "next";
import { WishlistPage } from "@/features/wishlist";

/**
 * Canonical metadata for this route.
 */
export const metadata: Metadata = {
  alternates: {
    canonical: "/wishlist",
  },
};

/**
 * Wishlist route entry for saved products.
 */
export default function WishlistRoute() {
  return (
    <>
      {/* Wishlist page content. */}
      <WishlistPage />
    </>
  );
}
