"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCategoryFilter } from "@/components/category-filter/CategoryFilterProvider";
import { getRecentlyViewedIds } from "@/lib/recently-viewed";
import { Product } from "@/lib/types";
import { toCategorySlug } from "@/lib/categories";
import { formatCategoryLabel } from "@/components/home-feed/home-feed-utils";
import ScrollingColumn from "@/components/home-feed/ScrollingColumn";
import {
  buildCardDecks,
  normalizeText,
  rankProductsForUser,
} from "@/components/home-feed/deck-utils";
import styles from "@/components/home-feed/HomeFeed.module.css";

/**
 * Sort options available for the home feed.
 */
type SortOption = "top-rated" | "newest" | "price-low" | "price-high";

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
  const [personalizationSeed, setPersonalizationSeed] = useState(0);
  const { selectedCategory, selectedSubCategory, searchQuery } =
    useCategoryFilter(); // Shared category filter + search query.

  useEffect(() => {
    const handleModalToggle = (event: Event) => {
      const customEvent = event as CustomEvent<{ open?: boolean }>;
      const isOpen = Boolean(customEvent.detail?.open);

      setIsModalOpen(isOpen); // Track modal open state.

      if (!isOpen) {
        setPersonalizationSeed((prev) => prev + 1); // Refresh personalization after closing.
      }
    };

    window.addEventListener("modal:toggle", handleModalToggle); // Listen for modal open/close.

    return () => {
      window.removeEventListener("modal:toggle", handleModalToggle); // Clean up listener.
    };
  }, []);

  const categorySource = selectedSubCategory || selectedCategory || ""; // Prefer subcategory for the header.
  const displayCategory = formatCategoryLabel(categorySource); // Format slug for the header.
  const effectiveTitle = categorySource
    ? `Today's ${displayCategory} Finds`
    : title; // Fall back when no category filter is selected.

  const recentlyViewedIds = useMemo(
    () => getRecentlyViewedIds(),
    [personalizationSeed],
  ); // Pull recent IDs when the seed changes.

  const shouldPersonalize = sortOption === "newest"; // Only personalize the default sort.

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
    () => rankProductsForUser(sortedProducts, recentlyViewedIds, shouldPersonalize),
    [recentlyViewedIds, shouldPersonalize, sortedProducts],
  );

  const resultsLabel = `Browse ${sortedProducts.length} ${subtitleLabel}`; // Accessible count label.

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
    <section className={styles.homeFeed} aria-label={resultsLabel}>
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
