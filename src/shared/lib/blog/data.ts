import { scoreBlogTopicProposal, isBlogTopicEligible } from "@/shared/lib/blog/pipeline";
import {
  generateBlogDraft,
  generateBlogMetadata,
  generateBlogOutline,
  runBlogQualityGates,
  runEditorialPolishPass,
} from "@/shared/lib/blog/workflows";
import { FALLBACK_PRODUCTS } from "@/shared/lib/catalog/products";
import { BlogArticle, BlogLayoutVariant, BlogTopicProposal } from "@/shared/lib/blog/types";

type BlogSeed = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  publishedAt: string;
  layoutVariant: BlogLayoutVariant;
  targetKeyword: string;
  scores: {
    viralSignalScore: number;
    searchTrendScore: number;
    llmQuerySignalScore: number;
    businessPriorityScore: number;
  };
};

const BLOG_SEEDS: BlogSeed[] = [
  {
    id: "blog-001",
    slug: "sleep-better-night-routine-products",
    title: "How to Sleep Better: A Cozy Night Routine That Actually Works",
    summary: "A practical sleep routine with product picks that support better rest.",
    category: "Wellness",
    tags: ["sleep", "night routine", "wellness", "home"],
    publishedAt: "2026-02-01T00:00:00.000Z",
    layoutVariant: "guide",
    targetKeyword: "sleep routine products",
    scores: {
      viralSignalScore: 66,
      searchTrendScore: 80,
      llmQuerySignalScore: 78,
      businessPriorityScore: 72,
    },
  },
  {
    id: "blog-002",
    slug: "small-home-office-upgrades",
    title: "Small Home Office Upgrades That Feel Premium on a Budget",
    summary: "High-impact workspace upgrades that improve comfort and focus.",
    category: "Home Office",
    tags: ["home office", "productivity", "desk setup", "budget"],
    publishedAt: "2026-02-05T00:00:00.000Z",
    layoutVariant: "listicle",
    targetKeyword: "home office upgrades",
    scores: {
      viralSignalScore: 59,
      searchTrendScore: 74,
      llmQuerySignalScore: 70,
      businessPriorityScore: 68,
    },
  },
  {
    id: "blog-003",
    slug: "best-kitchen-tools-small-spaces",
    title: "Best Kitchen Tools for Small Spaces",
    summary: "Space-efficient kitchen picks that still feel delightful to use.",
    category: "Home & Kitchen",
    tags: ["kitchen", "small space", "organization"],
    publishedAt: "2026-02-07T00:00:00.000Z",
    layoutVariant: "comparison",
    targetKeyword: "small-space kitchen tools",
    scores: {
      viralSignalScore: 55,
      searchTrendScore: 73,
      llmQuerySignalScore: 65,
      businessPriorityScore: 67,
    },
  },
  {
    id: "blog-004",
    slug: "cozy-fitness-setup-home",
    title: "Build a Cozy Fitness Setup at Home",
    summary: "Simple fitness setup ideas for consistency, not complexity.",
    category: "Health & Fitness",
    tags: ["fitness", "home gym", "wellness"],
    publishedAt: "2026-02-09T00:00:00.000Z",
    layoutVariant: "guide",
    targetKeyword: "home fitness setup",
    scores: {
      viralSignalScore: 64,
      searchTrendScore: 77,
      llmQuerySignalScore: 69,
      businessPriorityScore: 70,
    },
  },
  {
    id: "blog-005",
    slug: "pet-care-must-haves-apartment",
    title: "Pet-Care Must-Haves for Apartment Living",
    summary: "Apartment-friendly pet products that reduce daily friction.",
    category: "Pets",
    tags: ["pets", "apartment", "care"],
    publishedAt: "2026-02-10T00:00:00.000Z",
    layoutVariant: "listicle",
    targetKeyword: "apartment pet care products",
    scores: {
      viralSignalScore: 61,
      searchTrendScore: 71,
      llmQuerySignalScore: 67,
      businessPriorityScore: 64,
    },
  },
  {
    id: "blog-006",
    slug: "beauty-routine-less-clutter",
    title: "A Beauty Routine With Less Clutter",
    summary: "Skin and beauty picks that simplify your routine and vanity.",
    category: "Beauty & Personal Care",
    tags: ["beauty", "skincare", "organization"],
    publishedAt: "2026-02-11T00:00:00.000Z",
    layoutVariant: "guide",
    targetKeyword: "minimal beauty routine",
    scores: {
      viralSignalScore: 58,
      searchTrendScore: 69,
      llmQuerySignalScore: 64,
      businessPriorityScore: 63,
    },
  },
  {
    id: "blog-007",
    slug: "travel-gear-comparison-weekend",
    title: "Weekend Travel Gear: What’s Worth Packing",
    summary: "A practical comparison of travel gear for short trips.",
    category: "Outdoors & Sports",
    tags: ["travel", "gear", "weekend trip"],
    publishedAt: "2026-02-12T00:00:00.000Z",
    layoutVariant: "comparison",
    targetKeyword: "weekend travel gear",
    scores: {
      viralSignalScore: 62,
      searchTrendScore: 72,
      llmQuerySignalScore: 66,
      businessPriorityScore: 68,
    },
  },
  {
    id: "blog-008",
    slug: "tech-upgrades-under-100",
    title: "Tech Upgrades Under $100 That Feel Premium",
    summary: "Affordable tech upgrades with surprisingly strong daily impact.",
    category: "Tech",
    tags: ["tech", "budget", "gadgets"],
    publishedAt: "2026-02-13T00:00:00.000Z",
    layoutVariant: "listicle",
    targetKeyword: "budget tech upgrades",
    scores: {
      viralSignalScore: 70,
      searchTrendScore: 82,
      llmQuerySignalScore: 79,
      businessPriorityScore: 76,
    },
  },
  {
    id: "blog-009",
    slug: "morning-routine-products-focus",
    title: "Morning Routine Products for Better Focus",
    summary: "A focus-first morning setup with intentional product choices.",
    category: "Wellness",
    tags: ["morning routine", "focus", "wellness"],
    publishedAt: "2026-02-14T00:00:00.000Z",
    layoutVariant: "guide",
    targetKeyword: "morning focus routine",
    scores: {
      viralSignalScore: 64,
      searchTrendScore: 76,
      llmQuerySignalScore: 74,
      businessPriorityScore: 69,
    },
  },
  {
    id: "blog-010",
    slug: "bedding-comparison-cozy-budget",
    title: "Cozy Bedding on a Budget: Side-by-Side Comparison",
    summary: "A clear bedding comparison for comfort, durability, and value.",
    category: "Home & Kitchen",
    tags: ["bedding", "cozy", "budget"],
    publishedAt: "2026-02-15T00:00:00.000Z",
    layoutVariant: "comparison",
    targetKeyword: "budget cozy bedding",
    scores: {
      viralSignalScore: 63,
      searchTrendScore: 75,
      llmQuerySignalScore: 71,
      businessPriorityScore: 72,
    },
  },
];

const truncateDescription = (description: string) =>
  description.length > 180 ? `${description.slice(0, 177).trimEnd()}...` : description;

const normalizeToken = (value: string) => value.toLowerCase().trim();

/**
 * Pull related products from the current feed catalog for a blog seed.
 */
const getRelatedFeedProducts = (seed: BlogSeed) =>
  FALLBACK_PRODUCTS.filter((product) => {
    if (product.blogSlug === seed.slug) {
      return true;
    }

    const seedCategory = normalizeToken(seed.category);
    const productCategory = normalizeToken(product.category);
    const productSubCategory = normalizeToken(product.subCategory ?? "");
    if (productCategory === seedCategory || productSubCategory === seedCategory) {
      return true;
    }

    const seedTagTokens = new Set(
      seed.tags.map(normalizeToken).concat(seed.targetKeyword.split(/\s+/).map(normalizeToken)),
    );
    const productTagTokens = (product.tags ?? []).map(normalizeToken);
    return productTagTokens.some((tag) => seedTagTokens.has(tag));
  })
    .slice(0, 3)
    .map((product, index) => ({
      name: product.name,
      slug: product.slug,
      price: product.price,
      priceText: `$${product.price.toFixed(2)}`,
      retailer: product.retailer ?? "Retailer",
      affiliateUrl: product.affiliateUrl,
      description: truncateDescription(product.description),
      bestFor:
        index === 0
          ? "everyday reliability"
          : index === 1
            ? "value-focused setups"
            : "backup or alternate fit",
      tradeoff:
        index === 0
          ? "Trade-off: strongest all-round fit, but not always the lowest price."
          : index === 1
            ? "Trade-off: better value, but may skip premium extras."
            : "Trade-off: useful alternate when availability or fit changes.",
    }));

/**
 * Run the local agentic workflow to produce a publishable fallback article.
 */
const buildArticleFromSeed = (seed: BlogSeed): BlogArticle => {
  const relatedProducts = getRelatedFeedProducts(seed);
  const inferredSummary =
    relatedProducts.length > 0
      ? `Built from current feed picks: ${relatedProducts.map((product) => product.name).join(", ")}.`
      : seed.summary;
  const proposal: BlogTopicProposal = {
    title: seed.title,
    targetKeyword: seed.targetKeyword,
    category: seed.category,
    tags: seed.tags,
    referralLinkCount: Math.max(1, relatedProducts.length),
    ...seed.scores,
  };

  const score = scoreBlogTopicProposal(proposal);
  if (!isBlogTopicEligible(proposal)) {
    throw new Error(`Ineligible blog seed: ${seed.id}`);
  }

  const outline = generateBlogOutline(proposal);
  const draft = generateBlogDraft({
    ...outline,
    category: seed.category,
    variant: seed.layoutVariant,
    feedPicks: relatedProducts.map((product) => ({
      label: product.name,
      href: product.affiliateUrl,
      merchant: product.retailer,
      price: product.priceText,
      blurb: product.description,
      bestFor: product.bestFor,
      tradeoff: product.tradeoff,
    })),
  });
  const polished = runEditorialPolishPass(draft);
  const quality = runBlogQualityGates(polished);
  if (!quality.pass) {
    throw new Error(`Blog quality gate failed: ${seed.id}`);
  }

  const metadata = generateBlogMetadata({ title: seed.title, summary: inferredSummary });

  return {
    id: seed.id,
    slug: seed.slug, // Preserve stable route slugs for linked products.
    title: seed.title,
    summary: inferredSummary,
    body: polished.body,
    category: seed.category,
    tags: seed.tags,
    publishedAt: seed.publishedAt,
    seoTitle: metadata.title,
    seoDescription: metadata.description,
    layoutVariant: seed.layoutVariant,
    sections: polished.sections,
    affiliateLinks: relatedProducts.map((product) => ({
      label: `${product.name} on ${product.retailer}`,
      href: product.affiliateUrl,
      productSlug: product.slug,
      productPreview:
        FALLBACK_PRODUCTS.find((candidate) => candidate.slug === product.slug) ??
        undefined, // Attach local product data for preview modals when the data API is unavailable.
    })),
    status: score.totalScore >= 55 ? "published" : "review",
  };
};

/**
 * Local-first blog fallback catalog (10 sample articles) until SQL/CMS backend is enabled.
 */
const BLOG_ARTICLES: BlogArticle[] = BLOG_SEEDS.map(buildArticleFromSeed);

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
