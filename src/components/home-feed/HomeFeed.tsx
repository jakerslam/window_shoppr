"use client";

import { useMemo, useState } from "react";
import { useWishlist } from "@/lib/wishlist";
import type { CSSProperties } from "react";
import { Product } from "@/lib/types";
import ProductCard from "@/components/product-card/ProductCard";
import ExpandedCardOverlay from "@/components/expanded-card/ExpandedCardOverlay";
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
 * Compute an expanded overlay style that stays inside the viewport.
 */
const buildExpandedStyle = (rect: DOMRect): CSSProperties => {
  const scale = 1.5;
  const margin = 16;
  const targetWidth = rect.width * scale;
  const targetHeight = rect.height * scale;
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  let left = centerX - targetWidth / 2;
  let top = centerY - targetHeight / 2;
  const maxLeft = window.innerWidth - targetWidth - margin;
  const maxTop = window.innerHeight - targetHeight - margin;

  left = Math.min(Math.max(left, margin), Math.max(margin, maxLeft));
  top = Math.min(Math.max(top, margin), Math.max(margin, maxTop));

  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${targetWidth}px`,
    height: `${targetHeight}px`,
  };
};

/**
 * Client-side feed renderer with sorting, search, and in-feed expansion.
 */
export default function HomeFeed({ products }: { products: Product[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [expandedProduct, setExpandedProduct] = useState<Product | null>(null);
  const [expandedStyle, setExpandedStyle] = useState<CSSProperties | null>(null);
  const { isSaved, toggleSaved } = useWishlist(); // Shared wishlist state.

  const filteredProducts = useMemo(() => {
    const normalizedQuery = normalizeText(searchQuery); // Normalize input for matching.

    if (!normalizedQuery) {
      return products; // Skip filtering when query is empty.
    }

    return products.filter((product) => {
      const name = normalizeText(product.name); // Normalize product name.
      const category = normalizeText(product.category); // Normalize product category.
      const subCategory = normalizeText(product.subCategory ?? ""); // Normalize subcategory.

      return (
        name.includes(normalizedQuery) ||
        category.includes(normalizedQuery) ||
        subCategory.includes(normalizedQuery)
      ); // Match on name or categories.
    });
  }, [products, searchQuery]);

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

  const handleCardOpen =
    (product: Product) => (event: React.SyntheticEvent<HTMLElement>) => {
      if (window.matchMedia("(max-width: 900px)").matches) {
        window.location.href = `/product/${product.slug}`; // Mobile navigates to full page.
        return;
      }

      const rect = event.currentTarget.getBoundingClientRect(); // Anchor expansion to card.
      setExpandedStyle(buildExpandedStyle(rect));
      setExpandedProduct(product);
    };

  const handleCloseOverlay = () => {
    setExpandedProduct(null);
    setExpandedStyle(null);
  };

  const handleViewDetails = (product: Product) => {
    window.location.href = `/product/${product.slug}`; // Full page view for details.
  };

  const handleSave = (product: Product) => {
    toggleSaved(product.id); // Toggle saved state and persist it.
  };

  return (
    <section className={styles.homeFeed}>
      {/* Header with title and controls. */}
      <div className={styles.homeFeed__header}>
        {/* Title and helper text. */}
        <div className={styles.homeFeed__titleGroup}>
          <h1 className={styles.homeFeed__title}>Today&apos;s Window Finds</h1>
          <p className={styles.homeFeed__subtitle}>
            Browse {sortedProducts.length} curated picks and cozy deals.
          </p>
        </div>

        {/* Search + sort controls. */}
        <div className={styles.homeFeed__controls}>
          <input
            className={styles.homeFeed__search}
            type="search"
            placeholder="Search products"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            aria-label="Search products"
          />
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

      {/* Grid of product cards. */}
      <div className={styles.homeFeed__grid}>
        {sortedProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onOpen={handleCardOpen(product)}
            onWishlist={handleSave}
            isSaved={isSaved(product.id)}
          />
        ))}
      </div>

      {/* Empty state for no results. */}
      {sortedProducts.length === 0 && (
        <div className={styles.homeFeed__empty}>
          No results yet. Try a different search.
        </div>
      )}

      {/* In-feed expanded overlay for desktop users. */}
      {expandedProduct && expandedStyle ? (
        <ExpandedCardOverlay
          product={expandedProduct}
          style={expandedStyle}
          onClose={handleCloseOverlay}
          onViewDetails={() => handleViewDetails(expandedProduct)}
          onSave={handleSave}
          isSaved={isSaved(expandedProduct.id)}
        />
      ) : null}
    </section>
  );
}
