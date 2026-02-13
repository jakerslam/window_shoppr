"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getAvailableCategories, toCategorySlug } from "@/shared/lib/categories";
import { getProductCatalog } from "@/shared/lib/products";
import { useCategoryFilter } from "@/features/category-filter/CategoryFilterProvider";
import styles from "@/features/top-bar/TopBar.module.css";
import { HomeIcon, SearchIcon, StarIcon, UserIcon } from "@/features/top-bar/NavIcons";

/**
 * Mobile bottom navigation with category sheet and search overlay.
 */
export default function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { clearFilters, clearCategories, setCategory, setSubCategory, searchQuery, setSearchQuery } =
    useCategoryFilter();
  const availableCategories = getAvailableCategories(
    getProductCatalog(),
  ); // Filter category list based on available products.

  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const normalizedPath = pathname.replace(/\/+$/, "") || "/"; // Normalize trailing slashes from static hosting.
  const isHomeActive = normalizedPath === "/" && !isCategoriesOpen;
  const isWishlistActive = normalizedPath === "/wishlist";
  const isProfileActive = normalizedPath === "/login" || normalizedPath === "/signup";
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  /**
   * Lock body scrolling while the category sheet is open.
   */
  useEffect(() => {
    if (!isCategoriesOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // Prevent background scrolling.

    return () => {
      document.body.style.overflow = previousOverflow; // Restore previous scroll behavior.
    };
  }, [isCategoriesOpen]);

  /**
   * Focus the search input when the search overlay opens.
   */
  useEffect(() => {
    if (!isSearchOpen) {
      return;
    }

    window.setTimeout(() => {
      searchInputRef.current?.focus(); // Focus the search field on open.
    }, 0);
  }, [isSearchOpen]);

  /**
   * Mirror search open state on the body for CSS-driven hiding.
   */
  useEffect(() => {
    if (typeof document === "undefined") {
      return; // Skip DOM mutations on the server.
    }

    if (isSearchOpen) {
      document.body.dataset.mobileSearchOpen = "true"; // Flag search overlay state.
      return;
    }

    delete document.body.dataset.mobileSearchOpen; // Clear flag when closed.
  }, [isSearchOpen]);

  /**
   * Close mobile overlays whenever the route changes.
   */
  useEffect(() => {
    setIsSearchOpen(false); // Hide mobile search when navigating.
    setIsCategoriesOpen(false); // Close category sheet when navigating.
    setOpenCategory(null); // Reset submenu expansion on route change.
  }, [normalizedPath]);

  /**
   * Listen for feed-triggered category sheet requests.
   */
  useEffect(() => {
    const handleOpen = (event: Event) => {
      const customEvent = event as CustomEvent<{ open?: boolean }>;
      if (customEvent.detail?.open) {
        setIsCategoriesOpen(true); // Open sheet from feed controls.
        setIsSearchOpen(false); // Ensure search is closed.
        setOpenCategory(null); // Reset subcategory state.
      }
    };

    window.addEventListener("mobile:categories", handleOpen);

    return () => {
      window.removeEventListener("mobile:categories", handleOpen);
    };
  }, []);

  /**
   * Navigate to the main feed and reset filters when needed.
   */
  const handleHome = () => {
    if (normalizedPath !== "/") {
      router.push("/"); // Return to the feed.
      return;
    }

    clearFilters(); // Reset filters when already on the feed.
  };

  /**
   * Close the categories sheet and reset subcategory state.
   */
  const handleCategoriesClose = () => {
    setIsCategoriesOpen(false); // Close the sheet.
    setOpenCategory(null); // Reset open subcategory list.
  };

  /**
   * Toggle the mobile search overlay.
   */
  const handleSearchToggle = () => {
    setIsSearchOpen((prev) => !prev); // Toggle the search overlay.
    setIsCategoriesOpen(false); // Close categories when search opens.
    setOpenCategory(null); // Reset open subcategory list.
  };

  /**
   * Close the mobile search overlay.
   */
  const handleSearchClose = () => {
    setIsSearchOpen(false); // Hide the search overlay.
  };

  /**
   * Update the search query and reset categories if needed.
   */
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value; // Capture the latest search input.
    setSearchQuery(nextValue); // Update the shared search query.
    if (nextValue.trim()) {
      clearCategories(); // Reset categories when search is active.
    }
  };

  /**
   * Submit the search and return to the feed if needed.
   */
  const handleSearchSubmit = () => {
    if (searchQuery.trim() && normalizedPath !== "/") {
      router.push("/"); // Return to the feed when search is submitted.
    }

    setIsSearchOpen(false); // Hide the search overlay after submit.
  };

  /**
   * Apply a category filter or toggle its subcategory list.
   */
  const handleCategorySelect = (categorySlug: string, hasSubCategories: boolean) => {
    if (hasSubCategories) {
      setOpenCategory((prev) => (prev === categorySlug ? null : categorySlug)); // Toggle subcategories.
      return;
    }

    setCategory(categorySlug); // Filter by category.
    handleCategoriesClose(); // Close after selection.

    if (normalizedPath !== "/") {
      router.push("/"); // Return to feed for category filtering.
    }
  };

  /**
   * Apply a subcategory filter and close the sheet.
   */
  const handleSubCategorySelect = (categorySlug: string, subCategorySlug: string) => {
    setSubCategory(categorySlug, subCategorySlug); // Filter by subcategory.
    handleCategoriesClose(); // Close after selection.

    if (normalizedPath !== "/") {
      router.push("/"); // Return to feed for subcategory filtering.
    }
  };

  return (
    <>
      {isCategoriesOpen ? (
        <div
          className={styles.mobileNav__overlay}
          onClick={handleCategoriesClose} // Close the sheet when tapping the backdrop.
        >
          {/* Slide-up category sheet. */}
          <div
            className={styles.mobileNav__sheet}
            onClick={(event) => event.stopPropagation()} // Keep taps inside the sheet.
          >
            {/* Sheet header with title + close action. */}
            <div className={styles.mobileNav__sheetHeader}>
              <span>Browse Categories</span>
              <button
                className={styles.mobileNav__sheetClose}
                type="button"
                onClick={handleCategoriesClose} // Close the sheet explicitly.
                aria-label="Close categories"
              >
                ✕
              </button>
            </div>

            {/* All categories option. */}
            <button
              className={styles.mobileNav__sheetItem}
              type="button"
              onClick={() => {
                clearFilters(); // Reset filters to show all products.
                handleCategoriesClose(); // Close after selection.

                if (normalizedPath !== "/") {
                  router.push("/"); // Return to feed.
                }
              }}
            >
              All Categories
            </button>

            {/* Category list with expandable subcategories. */}
            {availableCategories.map((category) => {
              const categorySlug = toCategorySlug(category.label);
              const hasSubCategories = category.subCategories.length > 0;
              const isOpen = openCategory === categorySlug;

              return (
                <div
                  key={category.label}
                  className={styles.mobileNav__sheetGroup}
                >
                  <button
                    className={styles.mobileNav__sheetItem}
                    type="button"
                    onClick={() =>
                      handleCategorySelect(categorySlug, hasSubCategories)
                    }
                  >
                    <span>{category.label}</span>
                    {hasSubCategories ? (
                      <span
                        className={styles.mobileNav__sheetCaret}
                        aria-hidden="true"
                      >
                        {isOpen ? "–" : "+"}
                      </span>
                    ) : null}
                  </button>

                  {hasSubCategories && isOpen ? (
                    <div className={styles.mobileNav__sheetSubList}>
                      {category.subCategories.map((subCategory) => (
                        <button
                          key={subCategory}
                          className={styles.mobileNav__sheetSubItem}
                          type="button"
                          onClick={() =>
                            handleSubCategorySelect(
                              categorySlug,
                              toCategorySlug(subCategory),
                            )
                          }
                        >
                          {subCategory}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {isSearchOpen ? (
        <div
          className={styles.mobileSearch__overlay}
          onClick={handleSearchClose} // Close search when tapping away.
        >
          <div
            className={`${styles.mobileSearch__bar} ${styles["mobileSearch__bar--open"]}`}
            onClick={(event) => event.stopPropagation()} // Keep taps inside the bar.
          >
            <input
              ref={searchInputRef}
              className={styles.mobileSearch__input}
              type="search"
              placeholder="Search window finds"
              aria-label="Search products"
              value={searchQuery}
              onChange={handleSearchChange} // Update search query.
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSearchSubmit(); // Submit on Enter.
                }
              }}
            />
            <button
              className={styles.mobileSearch__button}
              type="button"
              onClick={handleSearchSubmit} // Submit the current search.
              aria-label="Submit search"
            >
              <SearchIcon className={styles.topBar__searchIcon} />
            </button>
          </div>
        </div>
      ) : null}

      {/* Bottom navigation bar for mobile. */}
      <nav className={styles.mobileNav} aria-label="Bottom navigation">
        {/* Search overlay toggle. */}
        <button
          className={styles.mobileNav__item}
          type="button"
          onClick={handleSearchToggle} // Show or hide search.
          aria-pressed={isSearchOpen}
        >
          <span className={`${styles.mobileNav__icon} ${styles["mobileNav__icon--small"]}`}>
            <SearchIcon className={styles.mobileNav__iconGraphic} />
          </span>
          <span className={styles.mobileNav__label}>Search</span>
        </button>

        {/* Home shortcut. */}
        <button
          className={`${styles.mobileNav__item} ${isHomeActive ? styles["mobileNav__item--active"] : ""}`}
          type="button"
          onClick={handleHome} // Return to the main feed.
        >
          <span className={styles.mobileNav__icon}>
            <HomeIcon className={styles.mobileNav__iconGraphic} />
          </span>
          <span className={styles.mobileNav__label}>Home</span>
          <span className={styles.mobileNav__dot} aria-hidden="true" />
        </button>

        {/* Wishlist shortcut. */}
        <Link className={`${styles.mobileNav__item} ${isWishlistActive ? styles["mobileNav__item--active"] : ""}`} href="/wishlist">
          <span className={styles.mobileNav__icon}>
            <StarIcon className={styles.mobileNav__iconGraphic} />
          </span>
          <span className={styles.mobileNav__label}>Wishlist</span>
          <span className={styles.mobileNav__dot} aria-hidden="true" />
        </Link>

        {/* Profile shortcut. */}
        <Link className={`${styles.mobileNav__item} ${isProfileActive ? styles["mobileNav__item--active"] : ""}`} href="/login">
          <span className={styles.mobileNav__icon}>
            <UserIcon className={styles.mobileNav__iconGraphic} />
          </span>
          <span className={styles.mobileNav__label}>Profile</span>
          <span className={styles.mobileNav__dot} aria-hidden="true" />
        </Link>
      </nav>
    </>
  );
}
