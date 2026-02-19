import { BlogArticle } from "@/shared/lib/blog/types";
import { readTasteProfile } from "@/shared/lib/profile/taste-profile/storage";

/**
 * Rank blog articles using local taste-profile signals when available.
 */
export const rankBlogArticlesForUser = (articles: BlogArticle[]) => {
  if (typeof window === "undefined") {
    return articles;
  }

  const tasteProfile = readTasteProfile();
  if (!tasteProfile || !tasteProfile.personalizationEnabled) {
    return articles;
  }

  return [...articles].sort((a, b) => {
    const score = (article: BlogArticle) => {
      const categoryWeight =
        tasteProfile.categoryWeights[article.category.toLowerCase().replace(/\s+/g, "-")] ?? 0;
      const tagWeight = article.tags.reduce(
        (total, tag) => total + (tasteProfile.tagWeights[tag.toLowerCase()] ?? 0),
        0,
      );
      return categoryWeight + tagWeight;
    };
    return score(b) - score(a);
  });
};
