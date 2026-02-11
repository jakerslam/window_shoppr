"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { useCategoryFilter } from "@/components/category-filter/CategoryFilterProvider";
import TopBarBrand from "@/components/top-bar/TopBarBrand";
import TopBarMenu from "@/components/top-bar/TopBarMenu";
import TopBarSearch from "@/components/top-bar/TopBarSearch";
import TopBarActions from "@/components/top-bar/TopBarActions";
import styles from "@/components/top-bar/TopBar.module.css";

/**
 * Top navigation bar with branding, categories, search, and login placeholder.
 */
export default function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { selectedCategory, selectedSubCategory, searchQuery, setSearchQuery } =
    useCategoryFilter(); // Pull shared category filter state.

  const isOnAllCategories =
    pathname === "/" && !selectedCategory && !selectedSubCategory; // Track main feed default state.

  /**
   * Keep search text in sync with the shared filter state.
   */
  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value; // Capture the latest query value.
      setSearchQuery(nextValue); // Update the shared search query.
    },
    [setSearchQuery],
  );

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
      <div className={styles.topBar__left}>
        <TopBarBrand isOnAllCategories={isOnAllCategories} />
        <TopBarMenu />
      </div>

      <TopBarSearch
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
      />

      <TopBarActions />
    </header>
  );
}
