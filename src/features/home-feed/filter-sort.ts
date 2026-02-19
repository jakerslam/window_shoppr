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
 * Sort feed products using the selected sort mode.
 */
export const sortProducts = ({
  products,
  sortOption,
}: {
  products: Product[];
  sortOption: SortOption;
}): Product[] => {
  const productsCopy = [...products];

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
