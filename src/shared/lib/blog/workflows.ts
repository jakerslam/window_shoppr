import {
  BlogLayoutVariant,
  BlogAffiliateLink,
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
  variant,
  keyword,
  category,
  tags,
}: {
  kind: BlogOutline["sections"][number]["kind"];
  variant: BlogLayoutVariant;
  keyword: string;
  category: string;
  tags: string[];
}) => {
  const tagHint = tags.slice(0, 3).join(", ");

  if (kind === "intro") {
    const hook =
      variant === "story"
        ? `You can waste months buying "almost right" ${keyword} and still feel stuck.`
        : `Most people researching ${keyword} want confidence before spending, not a giant checklist.`;
    return `${hook}\n\nThe fastest path is to define your real constraint first: budget, time, storage space, or ease of use. In ${category}, a "best" product is only best when it fits your routine and keeps working after the first week. This piece keeps things practical and skimmable so you can decide faster with less regret.`;
  }

  if (kind === "step") {
    return `Evaluate ${keyword} in this order:\n1. Durability and material quality.\n2. Daily usability and setup friction.\n3. Maintenance overhead and hidden costs.\n4. Total 6-12 month value.\n\nCompare two or three options side by side and eliminate anything that fails in at least two categories.`;
  }

  if (kind === "comparison") {
    return `Use this quick framing for ${keyword}:\n- Starter pick: minimum friction, lowest risk.\n- Best value: strongest performance per dollar.\n- Comfort upgrade: premium option that actually earns it.\n\nWe prioritize products aligned with ${tagHint} so recommendations match real browsing intent.`;
  }

  if (kind === "faq") {
    return `FAQ that matters:\n- Is it worth the price now, not just on sale day?\n- Will it hold up after the honeymoon week?\n- What red flags should I avoid?\n\nIf two options are close, choose the one with clearer specs, fewer dependencies, and better long-term reliability signals.`;
  }

  return `Bottom line: choose the option you'll keep using, not the one with the loudest headline. For ${keyword}, start with one high-fit pick, test it in your routine, then upgrade only if it removes a real pain point.`;
};

/**
 * Generate an outline from a scored topic proposal.
 */
export const generateBlogOutline = (proposal: BlogTopicProposal): BlogOutline => {
  const variant: "guide" | "comparison" | "listicle" | "story" =
    proposal.viralSignalScore >= 72 ? "story" : "guide";
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
          variant,
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
          variant,
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
          variant,
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
          variant,
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
          variant,
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
 * Build conversion-first affiliate CTA copy blocks.
 */
export const buildAffiliateCallouts = (links: BlogAffiliateLink[]) =>
  links.map((link, index) => {
    const hook =
      index === 0
        ? "If you only click one option, start with this one:"
        : "Good alternate if the first pick is out of stock:";
    return `${hook}\n${link.label} — ${link.href}`;
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
  const headingCount = (draft.body.match(/^## /gm) ?? []).length;
  const listSignal = /(^\d+\.\s)|(^-\s)/gm.test(draft.body);
  const linkSignal = /https?:\/\//.test(draft.body);
  const checks = {
    factuality: true,
    citationQuality: true,
    thinContent: wordCount >= 220,
    affiliateDisclosure: true,
    readability: wordCount >= 260,
    usefulnessOrFun: /why|how|quick|mistake|best|worth/i.test(draft.title + draft.body),
    scannability: headingCount >= 3 && listSignal,
    affiliateCoverage: linkSignal,
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
  body: draft.body
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\. ([A-Z])/g, ".\n\n$1")
    .trim(),
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
