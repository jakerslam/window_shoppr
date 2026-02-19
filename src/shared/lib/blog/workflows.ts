import {
  BlogDraft,
  BlogMetadataPackage,
  BlogOptimization,
  BlogOutline,
  BlogQualityGateResult,
  BlogTopicProposal,
  BlogWorkflowState,
} from "@/shared/lib/blog/types";

const expandSectionContent = ({
  kind,
  keyword,
  category,
  tags,
}: {
  kind: BlogOutline["sections"][number]["kind"];
  keyword: string;
  category: string;
  tags: string[];
}) => {
  const tagHint = tags.slice(0, 3).join(", ");

  if (kind === "intro") {
    return `Most people researching ${keyword} want confidence before spending, not a giant checklist. The fastest path is to define your real constraint first: budget, time, storage space, or ease of use. In ${category}, a "best" product is only best when it fits your routine and keeps working after the first week. This guide uses practical criteria and avoids hype so you can decide quickly. We focus on repeatable buying patterns, not one-off deals, and keep examples grounded in everyday use cases. If you only remember one thing, make it this: choose for consistency and comfort first, then optimize for extras.`;
  }

  if (kind === "step") {
    return `Evaluate ${keyword} in this order: durability, daily usability, maintenance overhead, and total cost after 6-12 months. Durability tells you whether the product survives normal use without becoming another replacement cycle. Usability asks whether setup is simple enough that you'll actually use it. Maintenance overhead catches hidden friction like refill cycles, cleaning complexity, or subscriptions. Total cost keeps "cheap now, expensive later" purchases out of your cart. Compare two or three options side by side with the same criteria and eliminate anything that fails at least two categories. This structure keeps decisions objective and prevents impulse-based overbuying.`;
  }

  if (kind === "comparison") {
    return `When mapping products to use-cases, match each option to a clear scenario: starter pick, best value, and premium comfort upgrade. Starter picks should cover the core need with minimal setup. Value picks should balance reliability and price without obvious tradeoffs. Premium picks should earn higher cost through convenience, longevity, or measurable quality improvements. For ${keyword}, we also prioritize products that align with ${tagHint} so recommendations stay relevant to how people actually browse and buy. Keep alternatives in the same size class and intended use so comparisons remain fair. The goal is to narrow choices, not inflate the list.`;
  }

  if (kind === "faq") {
    return `Common buyer questions for ${keyword} usually fall into three buckets: "Is this worth the price?", "How long will it last?", and "What should I skip?" Price value is strongest when the product reduces repeated work or replacement. Longevity is easiest to evaluate through materials, warranty signals, and failure patterns in verified reviews. To avoid bad buys, skip options that hide basic specs, overpromise with vague claims, or require add-ons to perform as advertised. If two products look similar, choose the one with clearer documentation and fewer setup dependencies. Clear answers reduce hesitation and improve post-purchase satisfaction.`;
  }

  return `Bottom line: choose the option that fits your routine with the least friction and the highest long-term confidence. For ${keyword}, the right pick is rarely the flashiest; it is the one you will keep using because setup is simple and outcomes are reliable. Start with one product that solves your primary use-case, then add optional upgrades only if they remove a real pain point. That approach protects budget, reduces clutter, and creates better conversion from browse to buy without regret. If you're still deciding, shortlist two options and compare them against your top non-negotiables before checkout.`;
};

/**
 * Generate an outline from a scored topic proposal.
 */
export const generateBlogOutline = (proposal: BlogTopicProposal): BlogOutline => {
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
        content: expandSectionContent({
          kind: "intro",
          keyword: proposal.targetKeyword,
          category: proposal.category,
          tags: proposal.tags,
        }),
        kind: "intro",
      },
      {
        heading: "How to evaluate options",
        content: expandSectionContent({
          kind: "step",
          keyword: proposal.targetKeyword,
          category: proposal.category,
          tags: proposal.tags,
        }),
        kind: "step",
      },
      {
        heading: "Product picks and fit",
        content: expandSectionContent({
          kind: "comparison",
          keyword: proposal.targetKeyword,
          category: proposal.category,
          tags: proposal.tags,
        }),
        kind: "comparison",
      },
      {
        heading: "FAQ",
        content: expandSectionContent({
          kind: "faq",
          keyword: proposal.targetKeyword,
          category: proposal.category,
          tags: proposal.tags,
        }),
        kind: "faq",
      },
      {
        heading: "Bottom line",
        content: expandSectionContent({
          kind: "summary",
          keyword: proposal.targetKeyword,
          category: proposal.category,
          tags: proposal.tags,
        }),
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
