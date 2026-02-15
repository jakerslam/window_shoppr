"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCategoryFilter } from "@/features/category-filter/CategoryFilterProvider";
import { Product } from "@/shared/lib/types";
import { toCategorySlug } from "@/shared/lib/categories";
import { formatCategoryLabel } from "@/features/home-feed/home-feed-utils";
import HomeFeedHeader from "@/features/home-feed/HomeFeedHeader";
import { SortOption } from "@/features/home-feed/SortDropdown";
import ScrollingColumn from "@/features/home-feed/ScrollingColumn";
import {
  buildCardDecks,
  normalizeText,
  rankProductsForUser,
} from "@/features/home-feed/deck-utils";
import useHomeFeedPreferences from "@/features/home-feed/useHomeFeedPreferences";
import styles from "@/features/home-feed/HomeFeed.module.css";

const BASE_COLUMN_DURATIONS = [38, 46, 54, 62, 70]; // Base scroll speeds per column.

/**
 * Client-side feed renderer with sorting and search.
 */
export default function HomeFeed({
  products,
  title = "Today's Finds",
  subtitleLabel = "curated picks and cozy deals.",
}: {
  products: Product[];
  title?: string;
  subtitleLabel?: string;
}) {
  const router = useRouter(); // Router for modal navigation.
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [speedMode, setSpeedMode] = useState<"cozy" | "quick">("cozy");
  const { speedPreferences, preferredCategorySlugs, recommendationListIds, tasteProfile, recentlyViewedIds, isModalOpen } =
    useHomeFeedPreferences(); // Load personalization sources (profile + taste + wishlist).
  const { selectedCategory, selectedSubCategory, searchQuery, clearFilters } =
    useCategoryFilter(); // Shared category filter + search query.

  /**
   * Lock the middle content scroller on mobile while the home feed auto-scrolls.
   */
  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined; // Skip DOM mutations during SSR.
    }

    document.body.dataset.homeFeedLock = "true"; // Mark home feed lock state for global CSS.

    return () => {
      delete document.body.dataset.homeFeedLock; // Restore default scrolling on route change.
    };
  }, []);

  const categorySource = selectedSubCategory || selectedCategory || ""; // Prefer subcategory for the header.
  const displayCategory = formatCategoryLabel(categorySource); // Format slug for the header.
  const effectiveTitle = categorySource
    ? `Today's ${displayCategory} Finds`
    : title; // Fall back when no category filter is selected.

  const personalizationEnabled = tasteProfile?.personalizationEnabled ?? true; // Default personalization to enabled.
  const shouldPersonalize =
    sortOption === "newest" && personalizationEnabled; // Only personalize the default sort when enabled.

  const filteredProducts = useMemo(() => {
    const normalizedQuery = normalizeText(searchQuery); // Normalize input for matching.
    const categorySlug = selectedCategory ?? ""; // Normalize selected category slug.
    const subCategorySlug = selectedSubCategory ?? ""; // Normalize selected subcategory slug.

    return products.filter((product) => {
      const name = normalizeText(product.name); // Normalize product name.
      const category = normalizeText(product.category); // Normalize product category.
      const subCategory = normalizeText(product.subCategory ?? ""); // Normalize subcategory.
      const tags = (product.tags ?? []).map(normalizeText); // Normalize tags for search.
      const matchesTags = tags.some((tag) => tag.includes(normalizedQuery)); // Match tag values.
      const matchesSearch =
        !normalizedQuery ||
        name.includes(normalizedQuery) ||
        category.includes(normalizedQuery) ||
        subCategory.includes(normalizedQuery) ||
        matchesTags; // Match on name, categories, or tags.
      const matchesCategory =
        !categorySlug || toCategorySlug(product.category) === categorySlug; // Match category filter.
      const matchesSubCategory =
        !subCategorySlug ||
        (product.subCategory &&
          toCategorySlug(product.subCategory) === subCategorySlug); // Match subcategory filter.

      return matchesSearch && matchesCategory && matchesSubCategory; // Apply stacked filters.
    });
  }, [products, searchQuery, selectedCategory, selectedSubCategory]);

  const sortedProducts = useMemo(() => {
    const productsCopy = [...filteredProducts]; // Clone to avoid mutating source.

    if (sortOption === "newest") {
      return productsCopy; // Preserve input order for newest.
    }

    if (sortOption === "top-rated") {
      return productsCopy.sort((a, b) => {
        const ratingA = a.rating ?? 0; // Default missing rating.
        const ratingB = b.rating ?? 0; // Default missing rating.
        const countA = a.ratingCount ?? 0; // Default missing count.
        const countB = b.ratingCount ?? 0; // Default missing count.

        if (ratingB !== ratingA) {
          return ratingB - ratingA; // Highest rating first.
        }

        return countB - countA; // Break ties by review count.
      });
    }

    if (sortOption === "price-low") {
      return productsCopy.sort((a, b) => a.price - b.price); // Lowest price first.
    }

    return productsCopy.sort((a, b) => b.price - a.price); // Highest price first.
  }, [filteredProducts, sortOption]);

  const rankedProducts = useMemo(
    () =>
      rankProductsForUser(sortedProducts, recentlyViewedIds, shouldPersonalize, {
        tasteProfile,
        preferredCategorySlugs,
        recommendationListIds,
      }),
    [
      preferredCategorySlugs,
      recommendationListIds,
      recentlyViewedIds,
      shouldPersonalize,
      sortedProducts,
      tasteProfile,
    ],
  );

  const resultsLabel = `Browse ${sortedProducts.length} ${subtitleLabel}`; // Accessible count label.

  const columnCount = 5; // Desktop column count for the animated feed.
  const durationScale =
    speedMode === "quick" ? speedPreferences.quickScale : speedPreferences.cozyScale; // Adjust speeds from saved profile preferences.
  // Memoize column durations so scroll speeds remain stable between renders.
  const columnDurations = useMemo(
    () => BASE_COLUMN_DURATIONS.map((value) => value * durationScale),
    [durationScale],
  );
  // Memoize deck sizing to avoid recalculating on unrelated renders.
  const minimumPerColumn = useMemo(
    () => Math.min(7, Math.max(4, Math.ceil(rankedProducts.length / columnCount))),
    [rankedProducts.length, columnCount],
  );
  const columnDecks = useMemo(
    () => buildCardDecks(rankedProducts, columnCount, minimumPerColumn),
    [rankedProducts, minimumPerColumn],
  );

  /**
   * Build a stable open handler for a given product card.
   */
  const handleCardOpen = useCallback(
    (product: Product) => () => {
      router.push(`/product/${product.slug}/`); // Navigate to the product detail page (static export friendly).
    },
    [router],
  );

  return (
    <section className={styles.homeFeed} aria-label={resultsLabel}>
      {/* Header with title and controls. */}
      <HomeFeedHeader
        title={effectiveTitle}
        speedMode={speedMode}
        sortOption={sortOption}
        onOpenCategories={() =>
          window.dispatchEvent(new CustomEvent("mobile:categories", { detail: { open: true } }))
        } // Open the mobile category sheet from the feed header.
        onToggleSpeedMode={() => setSpeedMode((prev) => (prev === "cozy" ? "quick" : "cozy"))} // Toggle between cozy and quick speeds.
        onSortChange={setSortOption} // Update the selected sort option.
      />

      {/* Animated columns of product cards. */}
      <div className={styles.homeFeed__columns}>
        {columnDecks.map((deck, index) => (
          <ScrollingColumn
            key={`column-${index}`}
            deck={deck}
            duration={columnDurations[index % columnDurations.length]}
            onOpen={handleCardOpen}
            isModalOpen={isModalOpen}
          />
        ))}
      </div>

      {/* Empty state for no results. */}
      {sortedProducts.length === 0 && (
        <div className={styles.homeFeed__empty}>
          {/* Empty state headline. */}
          <p className={styles.homeFeed__emptyTitle}>No results yet.</p>

          {/* Empty state helper copy. */}
          <p className={styles.homeFeed__emptyText}>Try clearing filters or searching something new.</p>

          {/* Action to reset filters. */}
          <button
            className={styles.homeFeed__emptyAction}
            type="button"
            onClick={() => clearFilters()} // Reset filters + search when empty.
          >
            Clear filters
          </button>
        </div>
      )}
    </section>
  );
}
