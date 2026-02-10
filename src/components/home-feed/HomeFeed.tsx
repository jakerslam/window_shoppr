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
}: {
  deck: Product[];
  duration: number;
  onOpen: (product: Product) => () => void;
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [speedScale, setSpeedScale] = useState(1);
  const resumeTimers = useRef<number[]>([]);

  const loopedDeck = useMemo(() => [...deck, ...deck], [deck]);
  const effectiveDuration = Math.max(duration * speedScale, 1); // Keep duration usable.

  // Clear any pending resume timers.
  const clearResumeTimers = useCallback(() => {
    resumeTimers.current.forEach((timer) => window.clearTimeout(timer));
    resumeTimers.current = [];
  }, []);

  // Pause animation on hover.
  const handleMouseEnter = () => {
    clearResumeTimers(); // Stop queued speed ramps.
    setIsPaused(true); // Pause the scrolling motion.
  };

  // Resume with a gentle speed ramp.
  const handleMouseLeave = () => {
    clearResumeTimers(); // Reset any existing timers.
    setIsPaused(false); // Resume the scrolling motion.
    setSpeedScale(1.35); // Restart slowly for a softer return.
    resumeTimers.current.push(
      window.setTimeout(() => setSpeedScale(1.15), 300), // Speed up a bit.
    );
    resumeTimers.current.push(
      window.setTimeout(() => setSpeedScale(1), 650), // Return to normal speed.
    );
  };

  // Clean up timers on unmount.
  useEffect(() => {
    return () => {
      clearResumeTimers(); // Avoid stale timers after unmount.
    };
  }, [clearResumeTimers]);

  if (deck.length === 0) {
    return null; // Skip empty columns when there are no cards.
  }

  return (
    <div
      className={styles.homeFeed__column}
      onMouseEnter={handleMouseEnter} // Pause when hovering the column.
      onMouseLeave={handleMouseLeave} // Resume when leaving the column.
    >
      <div
        className={`${styles.homeFeed__columnTrack} ${
          isPaused ? styles.homeFeed__columnTrackPaused : ""
        }`}
        style={{
          "--scroll-duration": `${effectiveDuration}s`, // Control scroll speed per column.
        } as React.CSSProperties}
      >
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
  title = "Today's Window Finds",
  subtitleLabel = "curated picks and cozy deals.",
}: {
  products: Product[];
  title?: string;
  subtitleLabel?: string;
}) {
  const router = useRouter(); // Router for modal navigation.
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const { selectedCategory, selectedSubCategory, searchQuery } =
    useCategoryFilter(); // Shared category filter + search query.

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
  const columnDurations = [38, 46, 54, 62, 70]; // Unique speeds for each column.
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
          <h1 className={styles.homeFeed__title}>{title}</h1>
          {/* Subtitle reflects the active result count. */}
          <p className={styles.homeFeed__subtitle}>
            Browse {sortedProducts.length} {subtitleLabel}
          </p>
        </div>

        {/* Sort controls (search lives in the top bar). */}
        <div className={styles.homeFeed__controls}>
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
