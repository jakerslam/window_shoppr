/**
 * Category configuration with nested subcategory labels.
 */
export const CATEGORY_TREE = [
  {
    label: "Home & Kitchen",
    subCategories: ["Bedding", "Laundry", "Drinkware"],
  },
  {
    label: "Tech",
    subCategories: ["Home Office", "Accessories"],
  },
  {
    label: "Health & Fitness",
    subCategories: ["Wellness", "Pilates"],
  },
  {
    label: "Beauty & Personal Care",
    subCategories: ["Skincare"],
  },
  {
    label: "Outdoors & Sports",
    subCategories: ["Camping"],
  },
  {
    label: "Pets",
    subCategories: ["Sleep"],
  },
] as const;

/**
 * Category labels used for primary navigation.
 */
export const CATEGORY_LABELS = CATEGORY_TREE.map((category) => category.label);

/**
 * Convert a category label into a URL-safe slug.
 */
export const toCategorySlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * Find the category config by slug.
 */
export const getCategoryBySlug = (slug: string) =>
  CATEGORY_TREE.find((category) => toCategorySlug(category.label) === slug) ??
  null;

/**
 * Default minimum products required to surface a category.
 */
export const CATEGORY_MIN_ITEMS = 3;

/**
 * Count products per category and subcategory.
 */
export const buildCategoryAvailability = (products: Array<{
  category: string;
  subCategory?: string;
}>) => {
  const categoryCounts = new Map<string, number>();
  const subCategoryCounts = new Map<string, number>();

  products.forEach((product) => {
    const categorySlug = toCategorySlug(product.category);
    categoryCounts.set(
      categorySlug,
      (categoryCounts.get(categorySlug) ?? 0) + 1,
    );

    if (product.subCategory) {
      const subSlug = toCategorySlug(product.subCategory);
      subCategoryCounts.set(
        `${categorySlug}:${subSlug}`,
        (subCategoryCounts.get(`${categorySlug}:${subSlug}`) ?? 0) + 1,
      );
    }
  });

  return { categoryCounts, subCategoryCounts };
};

type AvailableCategory = {
  label: string;
  subCategories: string[];
};

/**
 * Filter category config based on product availability threshold.
 */
export const getAvailableCategories = (
  products: Array<{ category: string; subCategory?: string }>,
  minItems: number = CATEGORY_MIN_ITEMS,
): AvailableCategory[] => {
  const { categoryCounts, subCategoryCounts } = buildCategoryAvailability(products);

  return CATEGORY_TREE.map((category) => {
    const categorySlug = toCategorySlug(category.label);
    const categoryCount = categoryCounts.get(categorySlug) ?? 0;
    if (categoryCount < minItems) {
      return null;
    }

    const availableSubCategories = category.subCategories.filter((subCategory) => {
      const subSlug = toCategorySlug(subCategory);
      return (subCategoryCounts.get(`${categorySlug}:${subSlug}`) ?? 0) >= minItems;
    });

    return {
      label: category.label,
      subCategories: availableSubCategories,
    };
  }).filter((category): category is AvailableCategory => Boolean(category));
};
