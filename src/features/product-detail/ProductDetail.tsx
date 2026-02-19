"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCategoryFilter } from "@/features/category-filter";
import {
  formatDealTimeRemaining,
  isDealWindowActive,
} from "@/shared/lib/catalog/deals";
import { trackRecentlyViewed } from "@/shared/lib/engagement/recently-viewed";
import {
  awardWindowPoints,
  buildDailyWindowPointsKey,
} from "@/shared/lib/engagement/window-points";
import { Product } from "@/shared/lib/catalog/types";
import ProductDetailActions from "@/features/product-detail/ProductDetailActions";
import ProductDetailInfo from "@/features/product-detail/ProductDetailInfo";
import ProductMediaGallery from "@/features/product-detail/ProductMediaGallery";
import styles from "@/features/product-detail/ProductDetail.module.css";

/**
 * Product detail layout used for both page and modal views.
 */
export default function ProductDetail({
  product,
  inModal = false,
  origin,
}: {
  product: Product;
  inModal?: boolean;
  origin?: "feed" | "wishlist" | "blog";
}) {
  const router = useRouter();
  const { setSearchQuery } = useCategoryFilter();
  const hasPriceDeal =
    typeof product.originalPrice === "number" &&
    product.originalPrice > product.price; // Determine if strike price should show.
  const isDealActive = isDealWindowActive(product.dealEndsAt); // Disable deal-only UI once expiration is in the past.
  const hasDeal = hasPriceDeal && isDealActive; // Show strike pricing only while the deal window is active.
  const dealLabel = formatDealTimeRemaining(product.dealEndsAt); // Compute active deal timer when available.
  const showDealBadge = hasDeal || Boolean(dealLabel); // Show badge for active deals.

  useEffect(() => {
    trackRecentlyViewed(product.id); // Persist recently viewed state.
    awardWindowPoints({
      action: "product_view",
      uniqueKey: buildDailyWindowPointsKey(`product-view:${product.id}`),
    }); // Award one daily point event per viewed product.
  }, [product.id]);

  /**
   * Navigate back when the detail view is in a modal.
   */
  const handleBack = useCallback(() => {
    if (inModal) {
      router.back(); // Close modal by returning to the previous page.
    }
  }, [inModal, router]);

  /**
   * Send a tag to the shared search bar and return to the feed.
   */
  const handleTagClick = useCallback(
    (tag: string) => {
      setSearchQuery(tag); // Mirror the tag into the search input.

      if (inModal) {
        router.back(); // Close the modal when the feed is already behind it.
        return;
      }

      router.push("/"); // Navigate to the feed when coming from a full page.
    },
    [inModal, router, setSearchQuery],
  );

  return (
    <section
      className={`${styles.productDetail} ${
        inModal ? styles["productDetail--modal"] : ""
      }`}
    >
      <ProductDetailActions inModal={inModal} onBack={handleBack} />

      <div className={styles.productDetail__content}>
        <ProductMediaGallery
          productId={product.id}
          images={product.images}
          videoUrl={product.videoUrl}
          name={product.name}
        />

        <ProductDetailInfo
          product={product}
          showDealBadge={showDealBadge}
          dealLabel={dealLabel}
          onTagClick={handleTagClick}
          hasDeal={hasDeal}
          hideRelatedBlogLink={origin === "blog"}
        />
      </div>
    </section>
  );
}
