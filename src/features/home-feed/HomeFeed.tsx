"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCategoryFilter } from "@/features/category-filter/CategoryFilterProvider";
import { Product } from "@/shared/lib/catalog/types";
import { formatCategoryLabel } from "@/features/home-feed/home-feed-utils";
import HomeFeedEmptyState from "@/features/home-feed/HomeFeedEmptyState";
import HomeFeedEndDeck from "@/features/home-feed/HomeFeedEndDeck";
import HomeFeedHeader from "@/features/home-feed/HomeFeedHeader";
import { SortOption } from "@/features/home-feed/SortDropdown";
import ScrollingColumn from "@/features/home-feed/ScrollingColumn";
import { buildCardDecks } from "@/features/home-feed/deck-utils";
import useHomeFeedPreferences from "@/features/home-feed/useHomeFeedPreferences";
import useFilteredSortedProducts from "@/features/home-feed/useFilteredSortedProducts";
import useFiniteFeedState from "@/features/home-feed/useFiniteFeedState";
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
  const router = useRouter();
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [speedMode, setSpeedMode] = useState<"cozy" | "quick">("cozy");
  const {
    speedPreferences,
    preferredCategorySlugs,
    recommendationListIds,
    tasteProfile,
    recentlyViewedIds,
    isModalOpen,
  } = useHomeFeedPreferences();
  const { selectedCategory, selectedSubCategory, searchQuery, clearFilters } =
    useCategoryFilter();

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

  const categorySource = selectedSubCategory || selectedCategory || "";
  const displayCategory = formatCategoryLabel(categorySource);
  const effectiveTitle = categorySource
    ? `Today's ${displayCategory} Finds` : title;

  const personalizationEnabled = tasteProfile?.personalizationEnabled ?? true;
  const shouldPersonalize =
    sortOption === "newest" && personalizationEnabled;
  const { sortedProducts, rankedProducts } = useFilteredSortedProducts({
    products,
    searchQuery,
    selectedCategory: selectedCategory ?? "",
    selectedSubCategory: selectedSubCategory ?? "",
    sortOption,
    shouldPersonalize,
    recentlyViewedIds,
    tasteProfile,
    preferredCategorySlugs,
    recommendationListIds,
  });

  const resultsLabel = `Browse ${sortedProducts.length} ${subtitleLabel}`;

  const columnCount = 5;
  const durationScale =
    speedMode === "quick" ? speedPreferences.quickScale : speedPreferences.cozyScale;
  const columnDurations = useMemo(
    () => BASE_COLUMN_DURATIONS.map((value) => value * durationScale),
    [durationScale],
  );
  const minimumPerColumn = useMemo(
    () => Math.min(7, Math.max(4, Math.ceil(rankedProducts.length / columnCount))),
    [rankedProducts.length, columnCount],
  );
  const columnDecks = useMemo(
    () => buildCardDecks(rankedProducts, columnCount, minimumPerColumn),
    [rankedProducts, minimumPerColumn],
  );
  const {
    isDeckEnded,
    cycleToken,
    handleColumnComplete,
    handleReplayDeck,
  } = useFiniteFeedState({ columnDecks });

  /**
   * Reset filters and return to the all-categories feed.
   */
  const handleBrowseAllCategories = useCallback(() => {
    clearFilters(); // Reset category and search filters.
    router.push("/"); // Navigate back to the root feed.
  }, [clearFilters, router]);

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

      <div className={styles.homeFeed__columns}>
        {columnDecks.map((deck, index) => (
          <ScrollingColumn
            key={`column-${index}`}
            columnIndex={index}
            deck={deck}
            duration={columnDurations[index % columnDurations.length]}
            onOpen={handleCardOpen}
            isModalOpen={isModalOpen}
            isFeedEnded={isDeckEnded}
            cycleToken={cycleToken}
            onColumnComplete={handleColumnComplete}
          />
        ))}
      </div>

      {isDeckEnded && sortedProducts.length > 0 ? (
        <HomeFeedEndDeck
          categoryLabel={displayCategory || "all categories"}
          onReplayDeck={handleReplayDeck}
          onBrowseAllCategories={handleBrowseAllCategories}
        />
      ) : null}

      {sortedProducts.length === 0 && (
        <HomeFeedEmptyState
          onClearFilters={() => clearFilters()} // Reset filters + search when empty.
        />
      )}
    </section>
  );
}
