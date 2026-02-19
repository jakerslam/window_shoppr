import {
  BlogResearchPlan,
  BlogTopicProposal,
  BlogTopicScore,
} from "@/shared/lib/blog/types";

/**
 * Score a topic proposal using trend, viral, LLM, link-coverage, and business signals.
 */
export const scoreBlogTopicProposal = (
  proposal: BlogTopicProposal,
): BlogTopicScore => {
  const linkCoverage = Math.min(100, proposal.referralLinkCount * 20);
  const components = {
    trend: proposal.searchTrendScore,
    viral: proposal.viralSignalScore,
    llm: proposal.llmQuerySignalScore,
    linkCoverage,
    business: proposal.businessPriorityScore,
  };
  const totalScore = Math.round(
    components.trend * 0.24 +
      components.viral * 0.2 +
      components.llm * 0.21 +
      components.linkCoverage * 0.2 +
      components.business * 0.15,
  );
  return { totalScore, components };
};

/**
 * Enforce topic eligibility: must map to at least one referral link.
 */
export const isBlogTopicEligible = (proposal: BlogTopicProposal) =>
  proposal.referralLinkCount >= 1;

/**
 * Build the agentic research checklist for an eligible topic proposal.
 */
export const buildBlogResearchPlan = (
  proposal: BlogTopicProposal,
): BlogResearchPlan => ({
  proposalTitle: proposal.title,
  competitorPatternChecklist: [
    "Collect top SERP formats and heading patterns for target keyword.",
    "Identify recurring FAQ blocks and table structures from top pages.",
    "Capture internal-link opportunities to product/category pages.",
  ],
  sourceCollectionChecklist: [
    "Gather primary docs, product sources, and reputable references.",
    "Store citation URLs for each factual claim in outline notes.",
  ],
  factValidationChecklist: [
    "Verify objective claims against primary/official sources.",
    "Validate affiliate links resolve to intended merchant products.",
    "Confirm disclosures and compliance language are present.",
  ],
  outlineSections: [
    "Problem framing and intent-matching intro",
    "Step-by-step recommendations",
    "Product mapping blocks with natural integration",
    "FAQ block optimized for short-form answer extraction",
    "Summary and next actions",
  ],
});
