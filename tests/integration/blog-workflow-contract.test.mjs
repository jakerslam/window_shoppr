import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path) => readFileSync(resolve(process.cwd(), path), "utf8");

test("B1 blog architecture routes and canonical metadata exist", () => {
  const indexPage = read("src/app/blog/page.tsx");
  const articlePage = read("src/app/blog/[slug]/page.tsx");
  assert.match(indexPage, /Window Shoppr Blog/);
  assert.match(articlePage, /generateMetadata/);
  assert.match(articlePage, /alternates:\s*\{\s*canonical/);
  assert.match(articlePage, /Breadcrumb/);
});

test("B2 desktop top bar exposes blog nav entry", () => {
  const topBar = read("src/features/top-bar/TopBar.tsx");
  assert.match(topBar, /href="\/blog\//);
  assert.match(topBar, />\s*Blog\s*</);
});

test("B3-B5 topic scoring, eligibility, and research workflow exist", () => {
  const pipeline = read("src/shared/lib/blog/pipeline.ts");
  assert.match(pipeline, /scoreBlogTopicProposal/);
  assert.match(pipeline, /isBlogTopicEligible/);
  assert.match(pipeline, /buildBlogResearchPlan/);
  assert.match(pipeline, /referralLinkCount >= 1/);
});

test("B6-B12 workflow generation, quality gates, and approvals exist", () => {
  const workflows = read("src/shared/lib/blog/workflows.ts");
  const approvals = read("src/shared/lib/blog/approvals.ts");
  assert.match(workflows, /generateBlogOutline/);
  assert.match(workflows, /generateBlogDraft/);
  assert.match(workflows, /optimizeBlogForSeoAndLlm/);
  assert.match(workflows, /generateBlogMetadata/);
  assert.match(workflows, /runBlogQualityGates/);
  assert.match(workflows, /runEditorialPolishPass/);
  assert.match(workflows, /transitionBlogWorkflowState/);
  assert.match(approvals, /recordBlogWorkflowAudit/);
});

test("B13-B16 ranking, cms fallback, analytics, and sample catalog exist", () => {
  const ranking = read("src/shared/lib/blog/ranking.ts");
  const cms = read("src/shared/lib/blog/cms.ts");
  const analytics = read("src/shared/lib/blog/analytics.ts");
  const data = read("src/shared/lib/blog/data.ts");
  assert.match(ranking, /rankBlogArticlesForUser/);
  assert.match(cms, /getBlogCatalog/);
  assert.match(cms, /upsertBlogArticle/);
  assert.match(analytics, /trackBlogEvent/);
  assert.match(data, /blog-010/);
});
