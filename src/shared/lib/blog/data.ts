import { BlogArticle } from "@/shared/lib/blog/types";

/**
 * Local-first blog fallback until SQL/CMS backend is enabled.
 */
const BLOG_ARTICLES: BlogArticle[] = [
  {
    id: "blog-001",
    slug: "sleep-better-night-routine-products",
    title: "How to Sleep Better: A Cozy Night Routine That Actually Works",
    summary: "A practical sleep routine with product picks that support better rest.",
    body: "Start with consistent wind-down cues, keep screens low, and optimize temperature. Add products only where they remove friction and make routines easy to repeat.",
    category: "Wellness",
    tags: ["sleep", "night routine", "wellness", "home"],
    publishedAt: "2026-02-01T00:00:00.000Z",
    seoTitle: "How to Sleep Better: Night Routine + Product Picks",
    seoDescription: "A practical sleep routine with trusted product picks for better rest.",
  },
  {
    id: "blog-002",
    slug: "small-home-office-upgrades",
    title: "Small Home Office Upgrades That Feel Premium on a Budget",
    summary: "High-impact workspace upgrades that improve comfort and focus.",
    body: "Prioritize ergonomic improvements first, then lighting and desktop organization. Choose upgrades that support long sessions without clutter.",
    category: "Home Office",
    tags: ["home office", "productivity", "desk setup", "budget"],
    publishedAt: "2026-02-05T00:00:00.000Z",
    seoTitle: "Best Budget Home Office Upgrades for Comfort and Focus",
    seoDescription: "Improve your workspace with high-impact, budget-friendly upgrades.",
  },
];

/**
 * Return the sorted local article fallback list.
 */
export const getBlogArticles = () =>
  [...BLOG_ARTICLES].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

/**
 * Find one article by slug.
 */
export const getBlogArticleBySlug = (slug: string) =>
  BLOG_ARTICLES.find((article) => article.slug === slug) ?? null;
