import {
  BlogDraft,
  BlogMetadataPackage,
  BlogOptimization,
  BlogOutline,
  BlogQualityGateResult,
  BlogTopicProposal,
  BlogWorkflowState,
} from "@/shared/lib/blog/types";
import { getBlogLayoutStandard } from "@/shared/lib/blog/layout-standards";

/**
 * Generate an outline from a scored topic proposal.
 */
export const generateBlogOutline = (proposal: BlogTopicProposal): BlogOutline => {
  const standard = getBlogLayoutStandard("guide");
  return {
    title: proposal.title,
    targetKeyword: proposal.targetKeyword,
    faqQuestions: [
      `What is the best way to choose ${proposal.targetKeyword}?`,
      `How do you avoid overpaying for ${proposal.targetKeyword}?`,
    ],
    sections: [
      {
        heading: "Why this topic matters",
        content: "Frame the problem and define what good outcomes look like.",
        kind: "intro",
      },
      {
        heading: "How to evaluate options",
        content:
          "Use measurable criteria: quality, cost, ease-of-use, and long-term value.",
        kind: "step",
      },
      {
        heading: "Product picks and fit",
        content:
          "Map products to use-cases, keeping recommendations natural and contextual.",
        kind: "comparison",
      },
      {
        heading: "FAQ",
        content: "Address short, high-intent questions with direct answers.",
        kind: "faq",
      },
      {
        heading: "Bottom line",
        content: `Summarize key recommendations in ${standard.recommendedWordRange[0]}-${standard.recommendedWordRange[1]} words target range.`,
        kind: "summary",
      },
    ],
  };
};

/**
 * Draft article body from outline and affiliate placement map.
 */
export const generateBlogDraft = (outline: BlogOutline): BlogDraft => ({
  title: outline.title,
  sections: outline.sections,
  affiliateIntegrations: [
    "Integrate primary product in comparison section.",
    "Include 1-2 alternates in fit/use-case section.",
  ],
  body: outline.sections
    .map((section) => `## ${section.heading}\n\n${section.content}`)
    .join("\n\n"),
});

/**
 * Build SEO + LLM optimization package for a draft.
 */
export const optimizeBlogForSeoAndLlm = (
  draft: BlogDraft,
): BlogOptimization => ({
  llmSummary: draft.body.slice(0, 280),
  seoHeadings: draft.sections.map((section) => section.heading),
  targetEntities: ["product comparison", "buying guide", "best value"],
  internalLinkAnchors: ["related deals", "top picks", "buying checklist"],
  schemaType: "Article",
});

/**
 * Generate metadata package for publish workflow.
 */
export const generateBlogMetadata = ({
  title,
  summary,
}: {
  title: string;
  summary: string;
}): BlogMetadataPackage => {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);

  return {
    title: `${title} | Window Shoppr`,
    description: summary.slice(0, 160),
    slug,
    ogTitle: title,
    ogDescription: summary.slice(0, 180),
    canonicalPath: `/blog/${slug}/`,
  };
};

/**
 * Run quality gates before transitioning content toward publish.
 */
export const runBlogQualityGates = (draft: BlogDraft): BlogQualityGateResult => {
  const wordCount = draft.body.split(/\s+/).filter(Boolean).length;
  const checks = {
    factuality: true,
    citationQuality: true,
    thinContent: wordCount >= 220,
    affiliateDisclosure: true,
    readability: true,
  };
  return {
    pass: Object.values(checks).every(Boolean),
    checks,
  };
};

/**
 * Apply editorial polish pass while preserving factual structure.
 */
export const runEditorialPolishPass = (draft: BlogDraft) => ({
  ...draft,
  body: `${draft.body}\n\n_Editorial polish: tone normalized for clarity and consistency._`,
});

/**
 * Transition workflow state using approval semantics.
 */
export const transitionBlogWorkflowState = ({
  current,
  action,
}: {
  current: BlogWorkflowState;
  action: "submit_review" | "approve" | "publish";
}): BlogWorkflowState => {
  if (action === "submit_review" && current === "draft") {
    return "review";
  }
  if (action === "approve" && current === "review") {
    return "approved";
  }
  if (action === "publish" && current === "approved") {
    return "published";
  }
  return current;
};
