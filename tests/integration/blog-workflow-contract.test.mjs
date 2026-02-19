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
