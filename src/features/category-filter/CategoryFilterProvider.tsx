"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

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
