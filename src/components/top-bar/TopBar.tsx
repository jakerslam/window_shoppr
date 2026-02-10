"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { CATEGORY_TREE, toCategorySlug } from "@/lib/categories";
import { useCategoryFilter } from "@/components/category-filter/CategoryFilterProvider";
import styles from "@/components/top-bar/TopBar.module.css";

/**
 * Top navigation bar with branding, categories, search, and login placeholder.
 */
export default function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const {
    selectedCategory,
    selectedSubCategory,
    searchQuery,
    setSearchQuery,
    setCategory,
    setSubCategory,
    clearFilters,
  } = useCategoryFilter(); // Pull shared category filter state.

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value; // Capture the latest query value.
    setSearchQuery(nextValue); // Update the shared search query.
  };

  const handleSearchSubmit = () => {
    if (pathname !== "/" && searchQuery.trim()) {
      router.push("/"); // Jump back to the feed when search is submitted.
    }
  };

  return (
    <header className={styles.topBar}>
      {/* Left section with brand + categories dropdown. */}
      <div className={styles.topBar__left}>
        {/* Brand block for identity and home navigation. */}
        <div className={styles.topBar__brand}>
          <Link className={styles.topBar__logo} href="/">
            <span>Window</span>
            <span>Shoppr</span>
          </Link>
        </div>

        {/* Categories dropdown trigger and menu. */}
        <div
          className={styles.topBar__categories}
          onMouseEnter={() => setIsMenuOpen(true)}
          onMouseLeave={() => setIsMenuOpen(false)}
        >
          <span className={styles.topBar__categoriesTrigger}>Categories</span>

          <div
            className={`${styles.topBar__menu} ${isMenuOpen ? styles["topBar__menu--open"] : ""}`}
            role="menu"
          >
            {/* Clear filter option. */}
            <button
              className={`${styles.topBar__menuItem} ${
                !selectedCategory ? styles["topBar__menuItem--active"] : ""
              }`}
              type="button"
              onClick={() => {
                clearFilters(); // Reset filters.
                setIsMenuOpen(false); // Close menu after selection.
                if (pathname !== "/") {
                  router.push("/"); // Return to feed for category filtering.
                }
              }}
            >
              All Categories
            </button>

            {CATEGORY_TREE.map((category) => {
              const categorySlug = toCategorySlug(category.label); // Normalize category slug.
              const isActive = selectedCategory === categorySlug; // Track active category.

              return (
                <div key={category.label} className={styles.topBar__menuGroup}>
                  {/* Category item with nested subcategory menu. */}
                  <button
                    className={`${styles.topBar__menuItem} ${
                      isActive && !selectedSubCategory
                        ? styles["topBar__menuItem--active"]
                        : ""
                    }`}
                    type="button"
                    onClick={() => {
                      setCategory(categorySlug); // Filter by category.
                      setIsMenuOpen(false); // Close menu after selection.
                      if (pathname !== "/") {
                        router.push("/"); // Return to feed for category filtering.
                      }
                    }}
                  >
                    {category.label}
                  </button>

                  {/* Subcategory hover menu for the category. */}
                  {category.subCategories.length > 0 ? (
                    <div className={styles.topBar__subMenu} role="menu">
                      {category.subCategories.map((subCategory) => {
                        const subSlug = toCategorySlug(subCategory); // Normalize subcategory slug.
                        const isSubActive =
                          isActive && selectedSubCategory === subSlug; // Track active subcategory.

                        return (
                          <button
                            key={subCategory}
                            className={`${styles.topBar__subMenuItem} ${
                              isSubActive
                                ? styles["topBar__subMenuItem--active"]
                                : ""
                            }`}
                            type="button"
                            onClick={() => {
                              setSubCategory(categorySlug, subSlug); // Filter by subcategory.
                              setIsMenuOpen(false); // Close menu after selection.
                              if (pathname !== "/") {
                                router.push("/"); // Return to feed for subcategory filtering.
                              }
                            }}
                          >
                            {subCategory}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Search input for client-side filtering. */}
      <div className={styles.topBar__search}>
        <div className={styles.topBar__searchField}>
          <input
            className={styles.topBar__searchInput}
            type="search"
            placeholder="Search window finds"
            aria-label="Search products"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSearchSubmit(); // Navigate to feed on enter.
              }
            }}
          />

          <button
            className={styles.topBar__searchButton}
            type="button"
            onClick={handleSearchSubmit}
            aria-label="Submit search"
          >
            🔍
          </button>
        </div>
      </div>

      {/* Action area for wishlist and login placeholders. */}
      <div className={styles.topBar__actions}>
        {/* Wishlist link for saved items. */}
        <Link className={styles.topBar__actionButton} href="/wishlist">
          Wishlist
        </Link>

        {/* Login action linking to modal/page. */}
        <Link className={styles.topBar__actionButton} href="/login">
          Login
        </Link>
      </div>
    </header>
  );
}
