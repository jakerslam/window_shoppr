"use client";

import { useMemo } from "react";
import { Product } from "@/shared/lib/catalog/types";
import { TasteProfile } from "@/shared/lib/profile/taste-profile/model";
import { SortOption } from "@/features/home-feed/SortDropdown";
import { rankProductsForUser } from "@/features/home-feed/deck-utils";
import { filterProducts, sortProducts } from "@/features/home-feed/filter-sort";

/**
 * Filter, sort, and personalize feed products from shared filter controls.
 */
export default function useFilteredSortedProducts({
  products,
  searchQuery,
  selectedCategory,
  selectedSubCategory,
  sortOption,
  shouldPersonalize,
  recentlyViewedIds,
  tasteProfile,
  preferredCategorySlugs,
  recommendationListIds,
}: {
  products: Product[];
  searchQuery: string;
  selectedCategory: string;
  selectedSubCategory: string;
  sortOption: SortOption;
  shouldPersonalize: boolean;
  recentlyViewedIds: string[];
  tasteProfile: TasteProfile | null;
  preferredCategorySlugs: string[];
  recommendationListIds: string[];
}) {
  const filteredProducts = useMemo(() => {
    return filterProducts({
      products,
      searchQuery,
      selectedCategory,
      selectedSubCategory,
    });
  }, [products, searchQuery, selectedCategory, selectedSubCategory]);

  const sortedProducts = useMemo(() => {
    return sortProducts({ products: filteredProducts, sortOption, searchQuery });
  }, [filteredProducts, searchQuery, sortOption]);

  const rankedProducts = useMemo(
    () =>
      rankProductsForUser(sortedProducts, recentlyViewedIds, shouldPersonalize, {
        tasteProfile,
        preferredCategorySlugs,
        recommendationListIds,
      }),
    [
      preferredCategorySlugs,
      recommendationListIds,
      recentlyViewedIds,
      shouldPersonalize,
      sortedProducts,
      tasteProfile,
    ],
  );

  return {
    sortedProducts,
    rankedProducts,
  };
}
