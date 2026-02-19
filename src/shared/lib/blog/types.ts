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
