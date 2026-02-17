import type { InsightTemplate } from "@/data/insight-templates";
import type { Product } from "@/shared/lib/catalog/types";

const MAX_RECOMMENDED_PRODUCTS = 4;

const normalizeTerm = (value: string) => value.trim().toLowerCase();

/**
 * Score a product based on how many intent keywords match its metadata.
 */
const scoreProductForIntent = (product: Product, keywords: string[]) => {
  const normalizedKeywords = keywords.map(normalizeTerm);
  let score = 0;

  const targetFields = [
    product.name,
    product.category,
    product.subCategory ?? "",
    ...(product.tags ?? []),
  ];

  const normalizedFields = targetFields.map(normalizeTerm);

  normalizedKeywords.forEach((keyword) => {
    normalizedFields.forEach((field) => {
      if (field.includes(keyword)) {
        score += 2;
      }
    });
  });

  return score;
};

/**
 * Build a short list of products that match the insight intent keywords.
 */
export const buildIntentProductList = (
  template: InsightTemplate,
  products: Product[],
) => {
  const scored = products
    .map((product) => ({
      product,
      score: scoreProductForIntent(product, template.intentKeywords),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return (b.product.rating ?? 0) - (a.product.rating ?? 0);
    })
    .map((entry) => entry.product);

  if (scored.length > 0) {
    return scored.slice(0, MAX_RECOMMENDED_PRODUCTS);
  }

  // Fallback: use top-rated products when no keywords match.
  return [...products]
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, MAX_RECOMMENDED_PRODUCTS);
};
