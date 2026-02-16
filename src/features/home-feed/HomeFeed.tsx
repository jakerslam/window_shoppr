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
const SPEED_MODE_STORAGE_KEY = "window_shoppr_feed_speed_mode"; // Persist user-selected speed toggle mode.
const END_DECK_BAR_HEIGHT = 126; // Full-width end-of-feed bar height used as the stop boundary offset.

/**
 * Validate storage values before applying them to speed mode state.
 */
const isValidSpeedMode = (value: string): value is "cozy" | "quick" =>
  value === "cozy" || value === "quick";

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
  const [speedMode, setSpeedMode] = useState<"cozy" | "quick">(() => {
    if (typeof window === "undefined") {
      return "cozy"; // Use a stable default during SSR.
    }

    const savedMode = window.localStorage.getItem(SPEED_MODE_STORAGE_KEY);
    return savedMode && isValidSpeedMode(savedMode) ? savedMode : "cozy"; // Restore saved mode when available.
  });
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

  /**
   * Persist the current cozy/quick toggle selection for next visits.
   */
  useEffect(() => {
    if (typeof window === "undefined") {
      return; // Skip storage writes during SSR.
    }

    window.localStorage.setItem(SPEED_MODE_STORAGE_KEY, speedMode); // Save mode after each toggle.
  }, [speedMode]);

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
    hasAnyColumnEnteredEndZone,
    cycleToken,
    handleColumnEnterEndZone,
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
            endDeckHeight={END_DECK_BAR_HEIGHT}
            cycleToken={cycleToken}
            onColumnEnterEndZone={handleColumnEnterEndZone}
            onColumnComplete={handleColumnComplete}
          />
        ))}

        {hasAnyColumnEnteredEndZone && sortedProducts.length > 0 ? (
          <div
            className={`${styles.homeFeed__endDeckOverlay} ${styles["homeFeed__endDeckOverlay--active"]}`}
          >
            <HomeFeedEndDeck
              categoryLabel={displayCategory || "all categories"}
              showActions
              onReplayDeck={handleReplayDeck}
              onBrowseAllCategories={handleBrowseAllCategories}
            />
          </div>
        ) : null}
      </div>

      {sortedProducts.length === 0 && (
        <HomeFeedEmptyState
          onClearFilters={() => clearFilters()} // Reset filters + search when empty.
        />
      )}
    </section>
  );
}
