import { SortOption } from "@/features/home-feed/SortDropdown";
import { normalizeText } from "@/features/home-feed/deck-utils";
import { toCategorySlug } from "@/shared/lib/catalog/categories";
import { Product } from "@/shared/lib/catalog/types";

/**
 * Apply search/category/subcategory filters to the feed product list.
 */
export const filterProducts = ({
  products,
  searchQuery,
  selectedCategory,
  selectedSubCategory,
}: {
  products: Product[];
  searchQuery: string;
  selectedCategory: string;
  selectedSubCategory: string;
}): Product[] => {
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
};

/**
 * Score search relevance to improve query result ordering.
 */
const getSearchRelevanceScore = (product: Product, normalizedQuery: string): number => {
  if (!normalizedQuery) {
    return 0;
  }

  const name = normalizeText(product.name);
  const category = normalizeText(product.category);
  const subCategory = normalizeText(product.subCategory ?? "");
  const tags = (product.tags ?? []).map(normalizeText);

  let score = 0;
  if (name === normalizedQuery) score += 200;
  if (name.startsWith(normalizedQuery)) score += 120;
  if (name.includes(normalizedQuery)) score += 80;
  if (tags.some((tag) => tag === normalizedQuery)) score += 70;
  if (tags.some((tag) => tag.includes(normalizedQuery))) score += 45;
  if (subCategory.includes(normalizedQuery)) score += 30;
  if (category.includes(normalizedQuery)) score += 20;
  score += Math.min(product.rating ?? 0, 5) * 2;

  return score;
};

/**
 * Sort feed products using the selected sort mode.
 */
export const sortProducts = ({
  products,
  sortOption,
  searchQuery = "",
}: {
  products: Product[];
  sortOption: SortOption;
  searchQuery?: string;
}): Product[] => {
  const productsCopy = [...products];
  const normalizedQuery = normalizeText(searchQuery);

  if (normalizedQuery) {
    return productsCopy.sort((a, b) => {
      const scoreDiff =
        getSearchRelevanceScore(b, normalizedQuery) - getSearchRelevanceScore(a, normalizedQuery);
      if (scoreDiff !== 0) {
        return scoreDiff;
      }

      const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
      if (ratingDiff !== 0) {
        return ratingDiff;
      }

      return a.price - b.price;
    });
  }

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
};
