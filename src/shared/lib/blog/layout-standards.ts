import { BlogLayoutVariant } from "@/shared/lib/blog/types";

export type BlogLayoutStandard = {
  variant: BlogLayoutVariant;
  preferredSectionKinds: string[];
  maxSectionCount: number;
  recommendedWordRange: [number, number];
};

export const BLOG_LAYOUT_STANDARDS: BlogLayoutStandard[] = [
  {
    variant: "guide",
    preferredSectionKinds: ["intro", "step", "summary"],
    maxSectionCount: 8,
    recommendedWordRange: [900, 1800],
  },
  {
    variant: "comparison",
    preferredSectionKinds: ["intro", "comparison", "faq", "summary"],
    maxSectionCount: 9,
    recommendedWordRange: [1000, 2000],
  },
  {
    variant: "listicle",
    preferredSectionKinds: ["intro", "step", "faq", "summary"],
    maxSectionCount: 10,
    recommendedWordRange: [850, 1600],
  },
  {
    variant: "story",
    preferredSectionKinds: ["intro", "comparison", "summary"],
    maxSectionCount: 7,
    recommendedWordRange: [800, 1700],
  },
];

/**
 * Resolve standards for a specific layout variant.
 */
export const getBlogLayoutStandard = (variant: BlogLayoutVariant) =>
  BLOG_LAYOUT_STANDARDS.find((item) => item.variant === variant) ??
  BLOG_LAYOUT_STANDARDS[0];
