export type BlogArticle = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  category: string;
  tags: string[];
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
  layoutVariant: BlogLayoutVariant;
  sections: BlogSection[];
  status: "draft" | "review" | "approved" | "published";
};

export type BlogLayoutVariant = "guide" | "comparison" | "listicle";

export type BlogSection = {
  heading: string;
  content: string;
  kind: "intro" | "step" | "comparison" | "faq" | "summary";
};

export type BlogTopicProposal = {
  title: string;
  targetKeyword: string;
  category: string;
  tags: string[];
  viralSignalScore: number;
  searchTrendScore: number;
  llmQuerySignalScore: number;
  businessPriorityScore: number;
  referralLinkCount: number;
};

export type BlogTopicScore = {
  totalScore: number;
  components: {
    trend: number;
    viral: number;
    llm: number;
    linkCoverage: number;
    business: number;
  };
};

export type BlogResearchPlan = {
  proposalTitle: string;
  competitorPatternChecklist: string[];
  sourceCollectionChecklist: string[];
  factValidationChecklist: string[];
  outlineSections: string[];
};

export type BlogOutline = {
  title: string;
  sections: BlogSection[];
  targetKeyword: string;
  faqQuestions: string[];
};

export type BlogDraft = {
  title: string;
  body: string;
  sections: BlogSection[];
  affiliateIntegrations: string[];
};

export type BlogOptimization = {
  llmSummary: string;
  seoHeadings: string[];
  targetEntities: string[];
  internalLinkAnchors: string[];
  schemaType: "Article" | "FAQPage";
};

export type BlogMetadataPackage = {
  title: string;
  description: string;
  slug: string;
  ogTitle: string;
  ogDescription: string;
  canonicalPath: string;
};

export type BlogQualityGateResult = {
  pass: boolean;
  checks: {
    factuality: boolean;
    citationQuality: boolean;
    thinContent: boolean;
    affiliateDisclosure: boolean;
    readability: boolean;
  };
};

export type BlogWorkflowState = "draft" | "review" | "approved" | "published";
