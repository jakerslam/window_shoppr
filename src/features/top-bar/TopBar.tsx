"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { useCategoryFilter } from "@/features/category-filter/CategoryFilterProvider";
import TopBarBrand from "@/features/top-bar/TopBarBrand";
import TopBarMenu from "@/features/top-bar/TopBarMenu";
import TopBarSearch from "@/features/top-bar/TopBarSearch";
import TopBarActions from "@/features/top-bar/TopBarActions";
import styles from "@/features/top-bar/TopBar.module.css";

/**
 * Top navigation bar with branding, categories, search, and login placeholder.
 */
export default function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    selectedCategory,
    selectedSubCategory,
    searchQuery,
    setSearchQuery,
    clearFilters,
    clearCategories,
  } = useCategoryFilter(); // Pull shared category filter state.

  const isOnAllCategories =
    pathname === "/" && !selectedCategory && !selectedSubCategory; // Track main feed default state.

  /**
   * Keep search text in sync with the shared filter state.
   */
  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value; // Capture the latest query value.
      setSearchQuery(nextValue); // Update the shared search query.
      if (nextValue.trim()) {
        clearCategories(); // Reset categories when search is active.
      }
    },
    [clearCategories, setSearchQuery],
  );

  /**
   * Clear search text when returning to the main feed.
   */
  const handleLogoClick = useCallback(() => {
    clearFilters(); // Reset categories + search when logo is clicked.
  }, [clearFilters]);

  /**
   * Route back to the feed when submitting a search from another page.
   */
  const handleSearchSubmit = useCallback(() => {
    if (pathname !== "/" && searchQuery.trim()) {
      router.push("/"); // Jump back to the feed when search is submitted.
    }
  }, [pathname, router, searchQuery]);

  return (
    <header className={styles.topBar}>
      {/* Brand + categories cluster. */}
      <div className={styles.topBar__left}>
        <TopBarBrand
          isOnAllCategories={isOnAllCategories}
          onLogoClick={handleLogoClick}
        />
        <TopBarMenu />
      </div>

      {/* Feed search input (desktop + mobile). */}
      <TopBarSearch
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
      />

      {/* Right-side actions (desktop + mobile bell). */}
      <TopBarActions />
    </header>
  );
}
