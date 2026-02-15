"use client";

import { useMemo } from "react";
import { toCategorySlug } from "@/shared/lib/catalog/categories";
import { Product } from "@/shared/lib/catalog/types";
import { TasteProfile } from "@/shared/lib/profile/taste-profile/model";
import { SortOption } from "@/features/home-feed/SortDropdown";
import { normalizeText, rankProductsForUser } from "@/features/home-feed/deck-utils";

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
    const normalizedQuery = normalizeText(searchQuery);
    const categorySlug = selectedCategory;
    const subCategorySlug = selectedSubCategory;

    return products.filter((product) => {
      const name = normalizeText(product.name);
      const category = normalizeText(product.category);
      const subCategory = normalizeText(product.subCategory ?? "");
      const tags = (product.tags ?? []).map(normalizeText);
      const matchesTags = tags.some((tag) => tag.includes(normalizedQuery));
      const matchesSearch =
        !normalizedQuery ||
        name.includes(normalizedQuery) ||
        category.includes(normalizedQuery) ||
        subCategory.includes(normalizedQuery) ||
        matchesTags;
      const matchesCategory =
        !categorySlug || toCategorySlug(product.category) === categorySlug;
      const matchesSubCategory =
        !subCategorySlug ||
        (product.subCategory && toCategorySlug(product.subCategory) === subCategorySlug);

      return matchesSearch && matchesCategory && matchesSubCategory;
    });
  }, [products, searchQuery, selectedCategory, selectedSubCategory]);

  const sortedProducts = useMemo(() => {
    const productsCopy = [...filteredProducts];

    if (sortOption === "newest") {
      return productsCopy;
    }

    if (sortOption === "top-rated") {
      return productsCopy.sort((a, b) => {
        const ratingA = a.rating ?? 0;
        const ratingB = b.rating ?? 0;
        const countA = a.ratingCount ?? 0;
        const countB = b.ratingCount ?? 0;

        if (ratingB !== ratingA) {
          return ratingB - ratingA;
        }

        return countB - countA;
      });
    }

    if (sortOption === "price-low") {
      return productsCopy.sort((a, b) => a.price - b.price);
    }

    return productsCopy.sort((a, b) => b.price - a.price);
  }, [filteredProducts, sortOption]);

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
