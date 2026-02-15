"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * Category filter state shared across the browsing experience.
 */
type CategoryFilterState = {
  selectedCategory: string | null;
  selectedSubCategory: string | null;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  setCategory: (categorySlug: string | null) => void;
  setSubCategory: (categorySlug: string, subCategorySlug: string | null) => void;
  clearFilters: () => void;
  clearCategories: () => void;
  clearSearch: () => void;
};

const CategoryFilterContext = createContext<CategoryFilterState | null>(null);

/**
 * Shared provider that keeps category and subcategory filters in sync.
 */
export default function CategoryFilterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname(); // Read the active route for URL-driven category pages.
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const setCategory = useCallback((categorySlug: string | null) => {
    setSelectedCategory(categorySlug); // Update active category.
    setSelectedSubCategory(null); // Reset subcategory whenever category changes.
    setSearchQuery(""); // Clear search when category changes.
  }, []);

  const setSubCategory = useCallback(
    (categorySlug: string, subCategorySlug: string | null) => {
      setSelectedCategory(categorySlug); // Ensure category stays in sync.
      setSelectedSubCategory(subCategorySlug); // Update the subcategory filter.
      setSearchQuery(""); // Clear search when subcategory changes.
    },
    [],
  );

  const clearCategories = useCallback(() => {
    setSelectedCategory(null); // Clear category filter.
    setSelectedSubCategory(null); // Clear subcategory filter.
  }, []);

  const clearFilters = useCallback(() => {
    clearCategories(); // Clear category + subcategory filters.
    setSearchQuery(""); // Clear search when filters reset.
  }, [clearCategories]);

  const clearSearch = useCallback(() => {
    setSearchQuery(""); // Clear the search query.
  }, []);

  /**
   * Keep filter state in sync with canonical category URLs (/c/:category/:sub?).
   */
  useEffect(() => {
    const normalizedPath = pathname.replace(/\/+$/, "") || "/"; // Normalize trailing slashes from static hosting.

    const shouldClearForRoot =
      normalizedPath === "/" && (selectedCategory || selectedSubCategory); // Clear stale category state on root.

    if (normalizedPath === "/") {
      if (!shouldClearForRoot) {
        return; // Skip scheduling when state already matches the root feed.
      }
    } else if (!normalizedPath.startsWith("/c")) {
      return; // Only sync state for canonical category routes.
    }

    const segments = normalizedPath.split("/").filter(Boolean); // Example: ["c","tech","accessories"].
    const nextCategory = segments[1] ?? null; // Read category slug from URL.
    const nextSubCategory = segments[2] ?? null; // Read subcategory slug from URL.

    const shouldClearForEmptyCategory =
      normalizedPath.startsWith("/c") &&
      !nextCategory &&
      (selectedCategory || selectedSubCategory); // Reset when /c is visited without a category slug.

    const shouldSyncSubCategory =
      Boolean(nextCategory && nextSubCategory) &&
      (selectedCategory !== nextCategory ||
        selectedSubCategory !== nextSubCategory); // Sync when URL differs.

    const shouldSyncCategory =
      Boolean(nextCategory && !nextSubCategory) &&
      (selectedCategory !== nextCategory || Boolean(selectedSubCategory)); // Sync when URL differs.

    if (
      !shouldClearForRoot &&
      !shouldClearForEmptyCategory &&
      !shouldSyncSubCategory &&
      !shouldSyncCategory
    ) {
      return; // Skip scheduling when state already matches the URL.
    }

    const timeoutId = window.setTimeout(() => {
      if (shouldClearForRoot || shouldClearForEmptyCategory) {
        clearCategories(); // Reset category state to match the URL.
        return;
      }

      if (shouldSyncSubCategory && nextCategory && nextSubCategory) {
        setSubCategory(nextCategory, nextSubCategory); // Sync state to the URL slugs.
        return;
      }

      if (shouldSyncCategory && nextCategory) {
        setCategory(nextCategory); // Sync state to the URL category slug.
      }
    }, 0); // Defer updates so lint rules and React effects stay predictable.

    return () => {
      window.clearTimeout(timeoutId); // Cancel pending sync when navigating quickly.
    };
  }, [
    clearCategories,
    pathname,
    selectedCategory,
    selectedSubCategory,
    setCategory,
    setSubCategory,
  ]);

  const value = useMemo(
    () => ({
      selectedCategory,
      selectedSubCategory,
      searchQuery,
      setSearchQuery,
      setCategory,
      setSubCategory,
      clearFilters,
      clearCategories,
      clearSearch,
    }),
    [
      selectedCategory,
      selectedSubCategory,
      searchQuery,
      setSearchQuery,
      setCategory,
      setSubCategory,
      clearFilters,
      clearCategories,
      clearSearch,
    ],
  );

  return (
    <CategoryFilterContext.Provider value={value}>
      {/* Shared filter state for nav + feed. */}
      {children}
    </CategoryFilterContext.Provider>
  );
}

/**
 * Access the shared category filter state.
 */
export const useCategoryFilter = () => {
  const context = useContext(CategoryFilterContext);

  if (!context) {
    throw new Error("useCategoryFilter must be used within CategoryFilterProvider");
  }

  return context;
};
