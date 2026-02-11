"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCategoryFilter } from "@/components/category-filter/CategoryFilterProvider";
import { Product } from "@/lib/types";
import { toCategorySlug } from "@/lib/categories";
import ProductCard from "@/components/product-card/ProductCard";
import styles from "@/components/home-feed/HomeFeed.module.css";

/**
 * Sort options available for the home feed.
 */
type SortOption = "top-rated" | "newest" | "price-low" | "price-high";

/**
 * Normalize text for consistent search matching.
 */
const normalizeText = (value: string) => value.trim().toLowerCase();

/**
 * Rank products for each user (cookie- + preference-driven in a later pass).
 */
const rankProductsForUser = (products: Product[]) =>
  products; // TODO: apply personalization weights from cookies/preferences.

/**
 * Split products into column decks for the animated feed.
 */
const buildCardDecks = (
  products: Product[],
  columnCount: number,
  minimumPerColumn: number,
) => {
  const decks: Product[][] = Array.from({ length: columnCount }, () => []);

  if (products.length === 0) {
    return decks; // Keep empty decks when no results are available.
  }

  const targetSize = columnCount * minimumPerColumn; // Ensure enough cards to loop smoothly.
  const deckPool: Product[] = []; // Working list that supplies the decks.

  while (deckPool.length < targetSize) {
    deckPool.push(...products); // Repeat products until we fill the deck pool.
  }

  deckPool.slice(0, targetSize).forEach((product, index) => {
    decks[index % columnCount].push(product); // Distribute cards across columns.
  });

  return decks;
};

/**
 * Scrolling column of product cards with hover pause + smooth resume.
 */
const ScrollingColumn = ({
  deck,
  duration,
  onOpen,
  isModalOpen,
}: {
  deck: Product[];
  duration: number;
  onOpen: (product: Product) => () => void;
  isModalOpen: boolean;
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const positionRef = useRef(0);
  const loopHeightRef = useRef(0);
  const baseSpeedRef = useRef(0);
  const speedRef = useRef(0);
  const targetSpeedRef = useRef(0);
  const isPausedRef = useRef(false);
  const isHoveringRef = useRef(false);
  const isModalOpenRef = useRef(false);
  const durationRef = useRef(duration);

  const loopedDeck = useMemo(() => [...deck, ...deck], [deck]);

  /**
   * Measure the track height and recompute the scroll speed.
   */
  const syncMetrics = useCallback(() => {
    const track = trackRef.current;

    if (!track) {
      return; // Skip when the track is not mounted yet.
    }

    const totalHeight = track.getBoundingClientRect().height; // Full height of the looped deck.
    const loopHeight = totalHeight / 2; // One full deck height.

    if (!loopHeight) {
      return; // Skip when layout has no measurable height.
    }

    const wasPaused = isPausedRef.current; // Preserve hover pause state.

    loopHeightRef.current = loopHeight; // Cache the loop height for animation.
    baseSpeedRef.current = loopHeight / durationRef.current; // Compute pixels per second.
    targetSpeedRef.current = wasPaused ? 0 : baseSpeedRef.current; // Keep pause state intact.

    if (wasPaused) {
      speedRef.current = 0; // Ensure the track stays stopped when paused.
    }
  }, []);

  /**
   * Animate the column by translating the track on each frame.
   */
  const animate = useCallback((time: number) => {
    if (lastTimeRef.current === null) {
      lastTimeRef.current = time; // Seed the previous time for delta math.
    }

    const deltaSeconds = (time - lastTimeRef.current) / 1000; // Convert to seconds.
    lastTimeRef.current = time; // Store the current frame time.

    const loopHeight = loopHeightRef.current; // Height of a full deck loop.
    const track = trackRef.current; // DOM node to move.

    if (track && loopHeight > 0) {
      const speedDelta = (targetSpeedRef.current - speedRef.current) * 0.08; // Ease toward target speed.
      const nextSpeed = speedRef.current + speedDelta; // Apply speed easing.
      const nextPosition = (positionRef.current + nextSpeed * deltaSeconds) % loopHeight; // Wrap position.

      speedRef.current = nextSpeed; // Update the current speed.
      positionRef.current = nextPosition; // Cache the current position.
      track.style.transform = `translateY(-${nextPosition}px)`; // Move the track.
    }

    animationRef.current = window.requestAnimationFrame(animate); // Schedule next frame.
  }, []);

  /**
   * Pause the scroll while the pointer is over the column.
   */
  const handleMouseEnter = () => {
    isHoveringRef.current = true; // Track hover state for modal coordination.
    isPausedRef.current = true; // Track pause state for resizes.
    targetSpeedRef.current = 0; // Ease to a stop on hover.
  };

  /**
   * Resume the scroll with a gentle speed ramp.
   */
  const handleMouseLeave = () => {
    isHoveringRef.current = false; // Track hover state for modal coordination.

    if (isModalOpenRef.current) {
      isPausedRef.current = true; // Keep paused when a modal is open.
      targetSpeedRef.current = 0; // Stay stopped until modal closes.
      return;
    }

    isPausedRef.current = false; // Track resume state for resizes.
    targetSpeedRef.current = baseSpeedRef.current; // Ease back to the base speed.
  };

  // Pause the scroll whenever a modal is open.
  useEffect(() => {
    isModalOpenRef.current = isModalOpen; // Keep modal state in sync.

    if (isModalOpen) {
      isPausedRef.current = true; // Pause while a modal is open.
      targetSpeedRef.current = 0; // Stop moving under the modal.
      return;
    }

    if (!isHoveringRef.current) {
      isPausedRef.current = false; // Resume if the user is not hovering.
      targetSpeedRef.current = baseSpeedRef.current; // Return to base speed.
    }
  }, [isModalOpen]);

  // Update scroll speed whenever the duration changes.
  useEffect(() => {
    durationRef.current = duration; // Track the latest duration value.
    syncMetrics(); // Recompute speeds without resetting position.
  }, [duration, syncMetrics]);

  // Reset position whenever the deck changes.
  useEffect(() => {
    positionRef.current = 0; // Start new decks at the top.
    lastTimeRef.current = null; // Reset timing for smooth restarts.
  }, [deck]);

  // Run the animation loop and keep it in sync with layout changes.
  useEffect(() => {
    if (deck.length === 0) {
      return undefined; // Skip animation when there are no cards.
    }

    if (typeof window === "undefined") {
      return undefined; // Skip animation on the server.
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (mediaQuery.matches) {
      return undefined; // Respect reduced motion preferences.
    }

    syncMetrics(); // Measure the track before starting.

    const handleResize = () => {
      syncMetrics(); // Recompute metrics after layout changes.
    };

    window.addEventListener("resize", handleResize); // Keep sizes current.
    animationRef.current = window.requestAnimationFrame(animate); // Start the animation loop.

    return () => {
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current); // Stop the animation loop.
      }

      window.removeEventListener("resize", handleResize); // Clean up resize listener.
    };
  }, [animate, deck.length, syncMetrics]);

  if (deck.length === 0) {
    return null; // Skip empty columns when there are no cards.
  }

  return (
    <div
      className={styles.homeFeed__column}
      onMouseEnter={handleMouseEnter} // Pause when hovering the column.
      onMouseLeave={handleMouseLeave} // Resume when leaving the column.
    >
      <div ref={trackRef} className={styles.homeFeed__columnTrack}>
        {loopedDeck.map((product, index) => (
          <ProductCard
            key={`${product.id}-${index}`}
            product={product}
            onOpen={onOpen(product)} // Open modal/full page on click.
          />
        ))}
      </div>
    </div>
  );
};

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { selectedCategory, selectedSubCategory, searchQuery } =
    useCategoryFilter(); // Shared category filter + search query.

  useEffect(() => {
    const handleModalToggle = (event: Event) => {
      const customEvent = event as CustomEvent<{ open?: boolean }>;
      setIsModalOpen(Boolean(customEvent.detail?.open)); // Track modal open state.
    };

    window.addEventListener("modal:toggle", handleModalToggle); // Listen for modal open/close.

    return () => {
      window.removeEventListener("modal:toggle", handleModalToggle); // Clean up listener.
    };
  }, []);

  const categorySource = selectedSubCategory || selectedCategory || ""; // Prefer subcategory for the header.
  const formattedCategory = categorySource.replace(/-/g, " "); // Normalize slug spacing.
  const displayCategory = formattedCategory.replace(/\b\w/g, (char) =>
    char.toUpperCase(),
  ); // Title-case the category label.
  const effectiveTitle = categorySource
    ? `Today's ${displayCategory} Finds`
    : title; // Fall back when no category filter is selected.

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
    () => rankProductsForUser(sortedProducts),
    [sortedProducts],
  );

  const columnCount = 5; // Desktop column count for the animated feed.
  const baseDurations = [38, 46, 54, 62, 70]; // Unique speeds for each column.
  const durationScale = speedMode === "quick" ? 0.7 : 1; // Adjust speeds per toggle.
  const columnDurations = baseDurations.map((value) => value * durationScale);
  const minimumPerColumn = Math.min(
    7,
    Math.max(4, Math.ceil(rankedProducts.length / columnCount)),
  ); // Scale deck size with available inventory.
  const columnDecks = useMemo(
    () => buildCardDecks(rankedProducts, columnCount, minimumPerColumn),
    [rankedProducts, minimumPerColumn],
  );

  const handleCardOpen =
    (product: Product) => () => {
      if (window.matchMedia("(max-width: 900px)").matches) {
        window.location.href = `/product/${product.slug}`; // Mobile navigates to full page.
        return;
      }

      router.push(`/product/${product.slug}`); // Open modal detail view with slug.
    };

  return (
    <section className={styles.homeFeed}>
      {/* Header with title and controls. */}
      <div className={styles.homeFeed__header}>
        {/* Title and helper text. */}
        <div className={styles.homeFeed__titleGroup}>
          <h1 className={styles.homeFeed__title}>{effectiveTitle}</h1>
        </div>

        {/* Sort controls (search lives in the top bar). */}
        <div className={styles.homeFeed__controls}>
          <button
            className={`${styles.homeFeed__speedToggle} ${
              speedMode === "quick" ? styles["homeFeed__speedToggle--quick"] : ""
            }`}
            type="button"
            onClick={() =>
              setSpeedMode((prev) => (prev === "cozy" ? "quick" : "cozy"))
            } // Toggle between cozy and quick speeds.
            aria-pressed={speedMode === "quick"}
            aria-label={
              speedMode === "quick"
                ? "Switch to cozy scroll speed"
                : "Switch to quick scroll speed"
            }
          >
            <span className={styles.homeFeed__speedThumb} aria-hidden="true" />
            <span
              className={styles.homeFeed__speedIcon}
              data-side="left"
              aria-hidden="true"
            >
              🐢
            </span>
            <span
              className={styles.homeFeed__speedIcon}
              data-side="right"
              aria-hidden="true"
            >
              🐇
            </span>
          </button>

          <select
            className={styles.homeFeed__select}
            value={sortOption}
            onChange={(event) => setSortOption(event.target.value as SortOption)}
            aria-label="Sort products"
          >
            <option value="newest">Newest</option>
            <option value="top-rated">Top rated</option>
            <option value="price-low">Price low to high</option>
            <option value="price-high">Price high to low</option>
          </select>
        </div>
      </div>

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
          No results yet. Try a different search.
        </div>
      )}
    </section>
  );
}
