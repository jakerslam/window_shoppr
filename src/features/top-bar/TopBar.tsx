"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { useCategoryFilter } from "@/features/category-filter/CategoryFilterProvider";
import { PlusIcon } from "@/features/top-bar/NavIcons";
import { trackSearch } from "@/shared/lib/engagement/analytics";
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
        if (pathname === "/") {
          clearCategories(); // Reset categories only on the root feed (category pages keep their scope).
        }
      }
    },
    [clearCategories, pathname, setSearchQuery],
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
    if (searchQuery.trim()) {
      trackSearch({
        query: searchQuery,
        pathname,
        source: "topbar",
      }); // Record search intent for analytics.

      if (pathname !== "/") {
        router.push("/"); // Jump back to the feed when search is submitted.
      }
    }
  }, [pathname, router, searchQuery]);

  return (
    <header className={styles.topBar}>
      {/* Mobile quick action for deal submissions. */}
      <Link
        className={`${styles.topBar__iconButton} ${styles.topBar__mobileSubmit}`}
        href="/submit-deal"
        aria-label="Submit a deal"
      >
        <PlusIcon className={styles.topBar__iconGraphic} />
      </Link>

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
