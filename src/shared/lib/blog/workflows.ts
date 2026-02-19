import {
  BlogLayoutVariant,
  BlogDraft,
  BlogMetadataPackage,
  BlogOptimization,
  BlogOutline,
  BlogQualityGateResult,
  BlogTopicProposal,
  BlogWorkflowState,
} from "@/shared/lib/blog/types";

const pickDeterministic = (choices: string[], seed: string) => {
  const index =
    seed.split("").reduce((total, char) => total + char.charCodeAt(0), 0) %
    choices.length;
  return choices[index];
};

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
  const seed = `${kind}:${keyword}:${category}:${variant}`;

  if (kind === "intro") {
    const hook =
      variant === "story"
        ? pickDeterministic(
            [
              `You can buy “perfect” ${keyword} and still stop using it by week two.`,
              `Most regrets with ${keyword} come from fit, not price.`,
              `If ${keyword} feels like a rabbit hole, it usually is.`,
            ],
            seed,
          )
        : pickDeterministic(
            [
              `Shopping for ${keyword} is harder than it should be.`,
              `The best ${keyword} is the one that survives normal life.`,
              `Most ${keyword} look similar until real use starts.`,
            ],
            seed,
          );
    const framing = pickDeterministic(
      [
        `This guide focuses on what matters in ${category}: friction, upkeep, and whether it fits your routine.`,
        `Below are the few criteria that actually matter, then feed-backed picks with clear tradeoffs.`,
        `Use this as a shortcut: shortlist by routine-fit first, then compare features.`,
      ],
      `${seed}:framing`,
    );
    return `${hook}\n\n${framing}`;
  }

  if (kind === "step") {
    return `What to look for in ${keyword}:\n- Durability and material quality.\n- Daily usability and setup friction.\n- Maintenance overhead and hidden costs.\n- Total 6-12 month value.\n\nCompare two or three options side by side and cut anything that fails in at least two categories.`;
  }

  if (kind === "comparison") {
    return `How to decide quickly:\n- Starter pick: minimum friction, lowest risk.\n- Best value: strongest performance per dollar.\n- Comfort upgrade: premium option that actually earns it.\n\nThemes that matter for this topic: ${tagHint}.`;
  }

  if (kind === "faq") {
    return `FAQ that matters:\n- Is it worth the price now, not just on sale day?\n- Will it hold up after month one?\n- What red flags should I avoid?\n\nIf two options are close, choose the one with clearer specs and fewer dependencies.`;
  }

  return `Bottom line: choose the option you'll keep using. For ${keyword}, start simple, validate fit in your routine, then upgrade only if it removes real friction.`;
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
    "Integrate primary product naturally in comparison flow.",
    "Include alternatives with explicit tradeoffs.",
  ],
  body: [
    "_Disclosure: This post includes affiliate links. If you buy through them, we may earn a commission at no extra cost._",
    ...outline.sections.map((section) => `## ${section.heading}\n\n${section.content}`),
    "## Avoid this mistake",
    "Do not optimize for features first. Optimize for routine-fit first, then add upgrades only if they remove a recurring annoyance.",
  ].join("\n\n"),
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
  const hasNakedLinks = /https?:\/\/\S+/i.test(draft.body);
  const topWindow = draft.body.split("\n").slice(0, 8).join("\n").toLowerCase();
  const hasDisclosureNearTop = /affiliate|commission|may earn/.test(topWindow);
  const templatePhrases = [
    "fastest path",
    "define your real constraint",
    "honeymoon week",
    "loudest headline",
  ];
  const hasTemplateStink = templatePhrases.some((phrase) =>
    draft.body.toLowerCase().includes(phrase),
  );
  const tradeoffSignal = /trade-?off|however|avoid|skip|only if|downside/i.test(draft.body);
  const checks = {
    factuality: true,
    citationQuality: true,
    thinContent: wordCount >= 300,
    affiliateDisclosure: hasDisclosureNearTop,
    readability: wordCount >= 300,
    usefulnessOrFun:
      /why|how|quick|mistake|best|worth|regret|avoid/i.test(draft.title + draft.body) &&
      !hasTemplateStink,
    scannability: headingCount >= 3 && listSignal,
    affiliateCoverage: !hasNakedLinks && tradeoffSignal,
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
