"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCategoryFilter } from "@/features/category-filter";
import { ProductDetail } from "@/features/product-detail";
import { Product } from "@/shared/lib/catalog/types";
import {
  formatCategoryLabel,
  interleaveSponsoredProducts,
} from "@/features/home-feed/home-feed-utils";
import HomeFeedEmptyState from "@/features/home-feed/HomeFeedEmptyState";
import HomeFeedEndDeck from "@/features/home-feed/HomeFeedEndDeck";
import HomeFeedHeader from "@/features/home-feed/HomeFeedHeader";
import { SortOption } from "@/features/home-feed/SortDropdown";
import ScrollingColumn from "@/features/home-feed/ScrollingColumn";
import { getFeedColumnCount } from "@/features/home-feed/column-layout";
import useHomeFeedPreferences from "@/features/home-feed/useHomeFeedPreferences";
import useFilteredSortedProducts from "@/features/home-feed/useFilteredSortedProducts";
import useHomeFeedDecks from "@/features/home-feed/useHomeFeedDecks";
import { useFeatureFlag } from "@/shared/lib/platform/useFeatureFlag";
import Modal from "@/shared/components/modal/Modal";
import { PUBLIC_ENV } from "@/shared/lib/platform/env";
import styles from "@/features/home-feed/HomeFeed.module.css";

const BASE_COLUMN_DURATIONS = [38, 46, 54, 62, 70];
const SPEED_MODE_STORAGE_KEY = "window_shoppr_feed_speed_mode";
const END_DECK_BAR_HEIGHT = 126;

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
  const searchParams = useSearchParams();
  const [viewportWidth, setViewportWidth] = useState(1280);
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [speedMode, setSpeedMode] = useState<"cozy" | "quick">(() => {
    if (typeof window === "undefined") {
      return "cozy";
    }

    const savedMode = window.localStorage.getItem(SPEED_MODE_STORAGE_KEY);
    return savedMode && isValidSpeedMode(savedMode) ? savedMode : "cozy";
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
  const sponsoredCardsEnabled = useFeatureFlag("feedSponsoredCards");

  /**
   * Lock the middle content scroller on mobile while the home feed auto-scrolls.
   */
  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    document.body.dataset.homeFeedLock = "true";

    return () => {
      delete document.body.dataset.homeFeedLock;
    };
  }, []);

  /**
   * Sync viewport width so feed columns match the active breakpoint on mobile and desktop.
   */
  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const syncViewportWidth = () => {
      setViewportWidth(window.innerWidth);
    };

    syncViewportWidth();
    window.addEventListener("resize", syncViewportWidth);

    return () => {
      window.removeEventListener("resize", syncViewportWidth);
    };
  }, []);

  /**
   * Persist the current cozy/quick toggle selection for next visits.
   */
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(SPEED_MODE_STORAGE_KEY, speedMode);
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

  const feedProducts = useMemo(
    () =>
      sponsoredCardsEnabled
        ? interleaveSponsoredProducts(rankedProducts)
        : rankedProducts.filter((product) => !product.isSponsored),
    [rankedProducts, sponsoredCardsEnabled],
  );

  const resultsLabel = `Browse ${feedProducts.length} ${subtitleLabel}`;
  const modalProductSlug = searchParams.get("product");
  const modalProduct = useMemo(
    () =>
      modalProductSlug
        ? products.find((product) => product.slug === modalProductSlug) ?? null
        : null,
    [modalProductSlug, products],
  );

  const columnCount = useMemo(
    () => getFeedColumnCount(viewportWidth),
    [viewportWidth],
  );
  const speedFactor =
    speedMode === "quick" ? speedPreferences.quickScale : speedPreferences.cozyScale;
  const durationScale = 1 / Math.max(speedFactor, 0.01);
  const columnDurations = useMemo(
    () => BASE_COLUMN_DURATIONS.map((value) => value * durationScale),
    [durationScale],
  );
  const {
    columnsRef,
    columnDecks,
    isDeckEnded,
    hasAnyColumnEnteredEndZone,
    cycleToken,
    handleColumnEnterEndZone,
    handleColumnComplete,
    handleDeckApproachingEnd,
    handleDeckExhausted,
    handleReplayFeed,
  } = useHomeFeedDecks({
    feedProducts,
    columnCount,
  });

  /**
   * Reset filters and return to the all-categories feed.
   */
  const handleBrowseAllCategories = useCallback(() => {
    clearFilters();
    router.push("/");
  }, [clearFilters, router]);

  /**
   * Build a stable open handler for a given product card.
   */
  const handleCardOpen = useCallback(
    (product: Product) => () => {
      if (PUBLIC_ENV.deployTarget === "runtime") {
        router.push(`/?product=${encodeURIComponent(product.slug)}`); // Runtime mode restores feed-preserving modal routing.
        return;
      }

      router.push(`/product/${product.slug}/`);
    },
    [router],
  );

  return (
    <section className={styles.homeFeed} aria-label={resultsLabel}>
      <HomeFeedHeader
        title={effectiveTitle}
        speedMode={speedMode}
        sortOption={sortOption}
        isFeedEnded={isDeckEnded}
        onOpenCategories={() =>
          window.dispatchEvent(new CustomEvent("mobile:categories", { detail: { open: true } }))
        }
        onToggleSpeedMode={() => setSpeedMode((prev) => (prev === "cozy" ? "quick" : "cozy"))}
        onSortChange={setSortOption}
      />

      <div className={styles.homeFeed__columns} ref={columnsRef}>
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
            onDeckApproachingEnd={handleDeckApproachingEnd}
            onDeckExhausted={handleDeckExhausted}
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
              onReplayDeck={handleReplayFeed}
              onBrowseAllCategories={handleBrowseAllCategories}
            />
          </div>
        ) : null}
      </div>

      {sortedProducts.length === 0 && (
        <HomeFeedEmptyState
          onClearFilters={() => clearFilters()}
        />
      )}

      {PUBLIC_ENV.deployTarget === "runtime" && modalProduct ? (
        <Modal>
          <ProductDetail product={modalProduct} inModal />
        </Modal>
      ) : null}
    </section>
  );
}
