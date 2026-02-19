import { BlogArticle } from "@/shared/lib/blog/types";

const buildSections = (topic: string, variant: BlogArticle["layoutVariant"]) => [
  {
    heading: `What to know about ${topic}`,
    content: `Start with a simple framework so choices stay practical and budget-aware.`,
    kind: "intro" as const,
  },
  {
    heading: `How we compare ${topic}`,
    content:
      "Compare options by durability, ease-of-use, and long-term value before price.",
    kind: variant === "comparison" ? ("comparison" as const) : ("step" as const),
  },
  {
    heading: "Common questions",
    content: "Answer high-intent questions clearly so readers can decide quickly.",
    kind: "faq" as const,
  },
  {
    heading: "Bottom line",
    content: "Choose the option that matches your real routine and constraints.",
    kind: "summary" as const,
  },
];

/**
 * Local-first blog fallback catalog (10 sample articles) until SQL/CMS backend is enabled.
 */
const BLOG_ARTICLES: BlogArticle[] = [
  {
    id: "blog-001",
    slug: "sleep-better-night-routine-products",
    title: "How to Sleep Better: A Cozy Night Routine That Actually Works",
    summary: "A practical sleep routine with product picks that support better rest.",
    body: "Guide content body.",
    category: "Wellness",
    tags: ["sleep", "night routine", "wellness", "home"],
    publishedAt: "2026-02-01T00:00:00.000Z",
    seoTitle: "How to Sleep Better: Night Routine + Product Picks",
    seoDescription: "A practical sleep routine with trusted product picks for better rest.",
    layoutVariant: "guide",
    sections: buildSections("sleep routines", "guide"),
    status: "published",
  },
  {
    id: "blog-002",
    slug: "small-home-office-upgrades",
    title: "Small Home Office Upgrades That Feel Premium on a Budget",
    summary: "High-impact workspace upgrades that improve comfort and focus.",
    body: "Guide content body.",
    category: "Home Office",
    tags: ["home office", "productivity", "desk setup", "budget"],
    publishedAt: "2026-02-05T00:00:00.000Z",
    seoTitle: "Best Budget Home Office Upgrades for Comfort and Focus",
    seoDescription: "Improve your workspace with high-impact, budget-friendly upgrades.",
    layoutVariant: "listicle",
    sections: buildSections("home office upgrades", "listicle"),
    status: "published",
  },
  {
    id: "blog-003",
    slug: "best-kitchen-tools-small-spaces",
    title: "Best Kitchen Tools for Small Spaces",
    summary: "Space-efficient kitchen picks that still feel delightful to use.",
    body: "Comparison content body.",
    category: "Home & Kitchen",
    tags: ["kitchen", "small space", "organization"],
    publishedAt: "2026-02-07T00:00:00.000Z",
    seoTitle: "Best Kitchen Tools for Small Spaces (2026)",
    seoDescription: "Space-saving kitchen tools compared by value and usability.",
    layoutVariant: "comparison",
    sections: buildSections("small-space kitchen tools", "comparison"),
    status: "published",
  },
  {
    id: "blog-004",
    slug: "cozy-fitness-setup-home",
    title: "Build a Cozy Fitness Setup at Home",
    summary: "Simple fitness setup ideas for consistency, not complexity.",
    body: "Guide content body.",
    category: "Health & Fitness",
    tags: ["fitness", "home gym", "wellness"],
    publishedAt: "2026-02-09T00:00:00.000Z",
    seoTitle: "Cozy Home Fitness Setup: Essentials + Tips",
    seoDescription: "Create a practical at-home fitness setup that fits your routine.",
    layoutVariant: "guide",
    sections: buildSections("home fitness setups", "guide"),
    status: "published",
  },
  {
    id: "blog-005",
    slug: "pet-care-must-haves-apartment",
    title: "Pet-Care Must-Haves for Apartment Living",
    summary: "Apartment-friendly pet products that reduce daily friction.",
    body: "Listicle content body.",
    category: "Pets",
    tags: ["pets", "apartment", "care"],
    publishedAt: "2026-02-10T00:00:00.000Z",
    seoTitle: "Apartment Pet Care Essentials: What to Buy First",
    seoDescription: "Pet-care essentials designed for apartment routines and small spaces.",
    layoutVariant: "listicle",
    sections: buildSections("apartment pet care", "listicle"),
    status: "published",
  },
  {
    id: "blog-006",
    slug: "beauty-routine-less-clutter",
    title: "A Beauty Routine With Less Clutter",
    summary: "Skin and beauty picks that simplify your routine and vanity.",
    body: "Guide content body.",
    category: "Beauty & Personal Care",
    tags: ["beauty", "skincare", "organization"],
    publishedAt: "2026-02-11T00:00:00.000Z",
    seoTitle: "Minimal-Clutter Beauty Routine: Smart Product Picks",
    seoDescription: "Build a cleaner beauty routine with fewer, better product choices.",
    layoutVariant: "guide",
    sections: buildSections("minimal beauty routines", "guide"),
    status: "published",
  },
  {
    id: "blog-007",
    slug: "travel-gear-comparison-weekend",
    title: "Weekend Travel Gear: What’s Worth Packing",
    summary: "A practical comparison of travel gear for short trips.",
    body: "Comparison content body.",
    category: "Outdoors & Sports",
    tags: ["travel", "gear", "weekend trip"],
    publishedAt: "2026-02-12T00:00:00.000Z",
    seoTitle: "Weekend Travel Gear Comparison: What to Pack",
    seoDescription: "Compare weekend travel gear by size, utility, and value.",
    layoutVariant: "comparison",
    sections: buildSections("weekend travel gear", "comparison"),
    status: "published",
  },
  {
    id: "blog-008",
    slug: "tech-upgrades-under-100",
    title: "Tech Upgrades Under $100 That Feel Premium",
    summary: "Affordable tech upgrades with surprisingly strong daily impact.",
    body: "Listicle content body.",
    category: "Tech",
    tags: ["tech", "budget", "gadgets"],
    publishedAt: "2026-02-13T00:00:00.000Z",
    seoTitle: "Best Tech Upgrades Under $100",
    seoDescription: "Budget tech picks that punch above their price point.",
    layoutVariant: "listicle",
    sections: buildSections("budget tech upgrades", "listicle"),
    status: "published",
  },
  {
    id: "blog-009",
    slug: "morning-routine-products-focus",
    title: "Morning Routine Products for Better Focus",
    summary: "A focus-first morning setup with intentional product choices.",
    body: "Guide content body.",
    category: "Wellness",
    tags: ["morning routine", "focus", "wellness"],
    publishedAt: "2026-02-14T00:00:00.000Z",
    seoTitle: "Morning Routine Product Picks for Better Focus",
    seoDescription: "Start mornings stronger with product picks that support focus.",
    layoutVariant: "guide",
    sections: buildSections("morning focus routines", "guide"),
    status: "published",
  },
  {
    id: "blog-010",
    slug: "bedding-comparison-cozy-budget",
    title: "Cozy Bedding on a Budget: Side-by-Side Comparison",
    summary: "A clear bedding comparison for comfort, durability, and value.",
    body: "Comparison content body.",
    category: "Home & Kitchen",
    tags: ["bedding", "cozy", "budget"],
    publishedAt: "2026-02-15T00:00:00.000Z",
    seoTitle: "Budget Cozy Bedding Comparison Guide",
    seoDescription: "Compare cozy bedding options to find the best value quickly.",
    layoutVariant: "comparison",
    sections: buildSections("budget cozy bedding", "comparison"),
    status: "published",
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

/**
 * Find one article by id.
 */
export const getBlogArticleById = (id: string) =>
  BLOG_ARTICLES.find((article) => article.id === id) ?? null;
