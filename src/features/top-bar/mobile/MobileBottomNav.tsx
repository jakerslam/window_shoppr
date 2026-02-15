"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { getAvailableCategories } from "@/shared/lib/categories";
import { getProductCatalog } from "@/shared/lib/products";
import { trackSearch } from "@/shared/lib/analytics";
import { useCategoryFilter } from "@/features/category-filter/CategoryFilterProvider";
import styles from "@/features/top-bar/TopBar.module.css";
import { HomeIcon, SearchIcon, StarIcon, UserIcon } from "@/features/top-bar/NavIcons";
import MobileCategoriesSheet from "@/features/top-bar/mobile/MobileCategoriesSheet";
import MobileSearchOverlay from "@/features/top-bar/mobile/MobileSearchOverlay";
import useMobileBottomNavOverlays from "@/features/top-bar/mobile/useMobileBottomNavOverlays";

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
  const isHomeActive =
    (normalizedPath === "/" || normalizedPath.startsWith("/c")) && !isCategoriesOpen; // Treat category pages as part of the feed.
  const isWishlistActive = normalizedPath === "/wishlist";
  const isProfileActive = normalizedPath === "/login" || normalizedPath === "/signup";
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useMobileBottomNavOverlays({
    isCategoriesOpen,
    isSearchOpen,
    normalizedPath,
    searchInputRef,
    setIsCategoriesOpen,
    setIsSearchOpen,
    setOpenCategory,
  }); // Keep overlay side effects out of the render component.

  /**
   * Navigate to the main feed and reset filters when needed.
   */
  const handleHome = () => {
    clearFilters(); // Reset filters whenever Home is pressed.

    if (normalizedPath !== "/") {
      router.push("/"); // Return to the full feed.
    }
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
      if (normalizedPath === "/") {
        clearCategories(); // Reset categories only on the root feed (category pages keep their scope).
      }
    }
  };

  /**
   * Submit the search and return to the feed if needed.
   */
  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      trackSearch({
        query: searchQuery,
        pathname: normalizedPath,
        source: "mobile",
      }); // Record search intent for analytics.
    }

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
    router.push(`/c/${categorySlug}/`); // Navigate to canonical category page.
  };

  /**
   * Apply a subcategory filter and close the sheet.
   */
  const handleSubCategorySelect = (categorySlug: string, subCategorySlug: string) => {
    setSubCategory(categorySlug, subCategorySlug); // Filter by subcategory.
    handleCategoriesClose(); // Close after selection.
    router.push(`/c/${categorySlug}/${subCategorySlug}/`); // Navigate to canonical subcategory page.
  };

  return (
    <>
      <MobileCategoriesSheet
        isOpen={isCategoriesOpen}
        availableCategories={availableCategories}
        openCategory={openCategory}
        onClose={handleCategoriesClose} // Close the category sheet.
        onClearAll={() => {
          clearFilters(); // Reset filters to show all products.
          handleCategoriesClose(); // Close after selection.

          if (normalizedPath !== "/") {
            router.push("/"); // Return to feed.
          }
        }}
        onCategorySelect={handleCategorySelect} // Select a category or open its subcategories.
        onSubCategorySelect={handleSubCategorySelect} // Select a subcategory filter.
      />

      <MobileSearchOverlay
        isOpen={isSearchOpen}
        searchQuery={searchQuery}
        inputRef={searchInputRef}
        onChange={handleSearchChange} // Update the shared search query.
        onSubmit={handleSearchSubmit} // Submit search and optionally navigate home.
        onClose={handleSearchClose} // Close search when tapping away.
      />

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
