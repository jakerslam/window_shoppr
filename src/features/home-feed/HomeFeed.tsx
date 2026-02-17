"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCategoryFilter } from "@/features/category-filter/CategoryFilterProvider";
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
import useFiniteFeedState from "@/features/home-feed/useFiniteFeedState";
import styles from "@/features/home-feed/HomeFeed.module.css";

const BASE_COLUMN_DURATIONS = [38, 46, 54, 62, 70]; // Base scroll speeds per column.
const SPEED_MODE_STORAGE_KEY = "window_shoppr_feed_speed_mode"; // Persist user-selected speed toggle mode.
const END_DECK_BAR_HEIGHT = 126; // Full-width end-of-feed bar height used as the stop boundary offset.
const INITIAL_COLUMN_BATCH_SIZE = 3; // Cards dealt initially to each column when a new feed loads.

/**
 * Validate storage values before applying them to speed mode state.
 */
const isValidSpeedMode = (value: string): value is "cozy" | "quick" =>
  value === "cozy" || value === "quick";

const buildInitialDeckState = (products: Product[], columnCount: number) => {
  const decks: Product[][] = Array.from({ length: columnCount }, () => []);
  if (products.length === 0 || columnCount === 0) {
    return { decks, remaining: [] };
  }

  const initialDealCount = Math.min(
    products.length,
    columnCount * INITIAL_COLUMN_BATCH_SIZE,
  );

  for (let index = 0; index < initialDealCount; index += 1) {
    decks[index % columnCount].push(products[index]);
  }

  const remaining = products.slice(initialDealCount);
  return { decks, remaining };
};

/**
 * Build initial column stacks and the next undealt index from a single ranked deck.
 */
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
  const [viewportWidth, setViewportWidth] = useState(1280); // Keep a stable SSR width and update after mount.
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
   * Sync viewport width so feed columns match the active breakpoint on mobile and desktop.
   */
  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined; // Skip browser listeners during SSR.
    }

    const syncViewportWidth = () => {
      setViewportWidth(window.innerWidth); // Keep responsive column count in sync with current viewport.
    };

    syncViewportWidth(); // Capture current width once after mount.
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

  const feedProducts = useMemo(
    () => interleaveSponsoredProducts(rankedProducts),
    [rankedProducts],
  );

  const resultsLabel = `Browse ${feedProducts.length} ${subtitleLabel}`;

  const columnCount = useMemo(
    () => getFeedColumnCount(viewportWidth),
    [viewportWidth],
  );
  const durationScale =
    speedMode === "quick" ? speedPreferences.quickScale : speedPreferences.cozyScale;
  const columnDurations = useMemo(
    () => BASE_COLUMN_DURATIONS.map((value) => value * durationScale),
    [durationScale],
  );
  const initialDeckState = useMemo(
    () => buildInitialDeckState(feedProducts, columnCount),
    [feedProducts, columnCount],
  );
  const feedResetKey = useMemo(
    () => `${columnCount}:${rankedProducts.map((product) => product.id).join("|")}`,
    [columnCount, rankedProducts],
  ); // Stable reset key for a new feed/query, independent from runtime deck rebalancing.
  const [deckState, setDeckState] = useState<{
    resetKey: string;
    decks: Product[][];
    remaining: Product[];
  }>(() => ({
    resetKey: feedResetKey,
    ...initialDeckState,
  }));
  const columnDecks = deckState.resetKey === feedResetKey ? deckState.decks : initialDeckState.decks;
  const columnDecksRef = useRef<Product[][]>(columnDecks);
  const completedColumnsRef = useRef<Set<number>>(new Set());
  const deckStateRef = useRef(deckState);

  /**
   * Keep the runtime deck + column refs in sync with rendered decks.
   */
  useEffect(() => {
    columnDecksRef.current = columnDecks; // Keep current deck snapshot available to callbacks.
    deckStateRef.current = deckState; // Keep a mutable pointer for dynamic dealings.
  }, [columnDecks, deckState]);

  /**
   * Re-sync deck state whenever the query or breakpoint changes.
   */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDeckState((previous) => {
      if (previous.resetKey === feedResetKey) {
        return previous;
      }

      return {
        resetKey: feedResetKey,
        ...initialDeckState,
      };
    });
    completedColumnsRef.current = new Set(); // Reset completed-column tracking for new queries/breakpoints.
  }, [feedResetKey, initialDeckState]);

  const {
    isDeckEnded,
    hasAnyColumnEnteredEndZone,
    cycleToken,
    handleColumnEnterEndZone,
    handleColumnComplete,
    handleReplayDeck,
  } = useFiniteFeedState({ columnDecks, resetKey: feedResetKey });

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

  const dealNextCard = useCallback(
    (columnIndex: number) => {
      if (isDeckEnded) {
        return false; // Do not add cards once the feed is finished.
      }

      const current = deckStateRef.current;

      if (columnIndex >= current.decks.length) {
        return false; // Guard against missing columns.
      }

      if (current.remaining.length === 0) {
        return false; // No cards left in the stack.
      }

      const [nextCard, ...rest] = current.remaining;
      const nextDecks = current.decks.map((deck, index) =>
        index === columnIndex ? [...deck, nextCard] : deck,
      );

      setDeckState({
        resetKey: current.resetKey,
        decks: nextDecks,
        remaining: rest,
      });

      return true;
    },
    [isDeckEnded],
  );

  /**
   * Rebalance cards by lending 1-2 tail cards from the longest active stack to an exhausted stack.
   */
  const handleDeckExhausted = useCallback(
    (columnIndex: number) => {
      if (isDeckEnded) {
        return false; // Do not refill once the feed is already in its final ended state.
      }

      if (dealNextCard(columnIndex)) {
        return true; // A new card was dealt, so keep scrolling after the column completes.
      }

      const currentDecks = columnDecksRef.current;
      const receiverDeck = currentDecks[columnIndex];

      if (!receiverDeck || receiverDeck.length === 0) {
        return false; // Skip invalid or empty receivers.
      }

      let donorIndex = -1;
      let donorLength = -1;

      currentDecks.forEach((deck, index) => {
        if (index === columnIndex) {
          return; // Skip self.
        }

        if (completedColumnsRef.current.has(index)) {
          return; // Do not borrow from stacks already marked complete.
        }

        if (deck.length > donorLength) {
          donorLength = deck.length;
          donorIndex = index; // Choose the longest available donor stack.
        }
      });

      if (donorIndex < 0) {
        return false; // No eligible donor stack.
      }

      if (donorLength <= 2) {
        return false; // Keep at least a small runway in donor stacks.
      }

      const receiverLength = receiverDeck.length;
      const lengthGap = donorLength - receiverLength; // Positive when donor has more total cards.
      const desiredTransfer = lengthGap >= 3 ? 2 : 1; // Favor 2-card top-ups only when donor is clearly longer.
      const transferCount = Math.min(desiredTransfer, donorLength - 1); // Keep at least one card in donor.

      if (transferCount <= 0) {
        return false; // Guard against empty/near-empty donor stacks.
      }

      const nextDecks = currentDecks.map((deck) => [...deck]);
      const movedCards = nextDecks[donorIndex].splice(-transferCount, transferCount);

      if (movedCards.length === 0) {
        return false;
      }

      nextDecks[columnIndex].push(...movedCards);
      setDeckState((previous) => ({
        ...previous,
        decks: nextDecks,
      }));
      return true;
    },
    [isDeckEnded, dealNextCard],
  );

  /**
   * Track completed columns locally and in finite-feed state.
   */
  const handleColumnCompleteWithTracking = useCallback(
    (columnIndex: number) => {
      completedColumnsRef.current.add(columnIndex); // Prevent this stack from donating after it has ended.
      handleColumnComplete(columnIndex); // Update finite-feed completion state.
    },
    [handleColumnComplete],
  );

  /**
   * Replay from the initial deck distribution for the current query.
   */
  const handleReplayFeed = useCallback(() => {
    const resetState = {
      resetKey: feedResetKey,
      ...initialDeckState,
    };
    completedColumnsRef.current = new Set(); // Clear completed-column state.
    setDeckState(resetState);
    handleReplayDeck(); // Reset finite-feed progress tracking.
  }, [feedResetKey, handleReplayDeck, initialDeckState]);

  return (
    <section className={styles.homeFeed} aria-label={resultsLabel}>
      <HomeFeedHeader
        title={effectiveTitle}
        speedMode={speedMode}
        sortOption={sortOption}
        isFeedEnded={isDeckEnded}
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
            onDeckExhausted={handleDeckExhausted}
            onColumnEnterEndZone={handleColumnEnterEndZone}
            onColumnComplete={handleColumnCompleteWithTracking}
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
          onClearFilters={() => clearFilters()} // Reset filters + search when empty.
        />
      )}
    </section>
  );
}
