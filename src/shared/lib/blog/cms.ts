import { requestDataApi } from "@/shared/lib/platform/data-api";
import { BlogArticle } from "@/shared/lib/blog/types";
import { getBlogArticles } from "@/shared/lib/blog/data";

/**
 * Read blog catalog from backend API with local fallback.
 */
export const getBlogCatalog = async () => {
  const response = await requestDataApi<{ items: BlogArticle[] }>({
    path: "/data/blog/articles",
    method: "GET",
  });

  if (!response || !response.ok) {
    return {
      source: "fallback" as const,
      items: getBlogArticles(),
    };
  }

  const items = Array.isArray(response.data.items) ? response.data.items : [];
  return {
    source: "sql" as const,
    items: items.length > 0 ? items : getBlogArticles(),
  };
};

/**
 * Stub create/update API call for blog CMS workflows.
 */
export const upsertBlogArticle = async (article: BlogArticle) =>
  requestDataApi<{ id: string }>({
    path: "/data/blog/articles/upsert",
    method: "POST",
    body: { article },
  });
