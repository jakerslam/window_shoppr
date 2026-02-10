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
