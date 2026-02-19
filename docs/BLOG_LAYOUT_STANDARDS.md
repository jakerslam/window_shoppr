# Blog Layout Standards

These standards define how blog pages are structured so generated content remains consistent, scannable, and SEO/LLM-friendly.

## Layout Variants
- `guide`
  - Required section kinds: `intro`, `step`, `summary`
  - Recommended length: `900-1800` words
- `comparison`
  - Required section kinds: `intro`, `comparison`, `faq`, `summary`
  - Recommended length: `1000-2000` words
- `listicle`
  - Required section kinds: `intro`, `step`, `faq`, `summary`
  - Recommended length: `850-1600` words

## Rendering Rules
- Every article must include:
  - canonical metadata
  - breadcrumb trail
  - category + tags
  - section-based body blocks
- FAQ sections should remain concise and answer-first for LLM extraction.
- Summary section should provide a clear final recommendation.

## Implementation
- Standards source:
  - `src/shared/lib/blog/layout-standards.ts`
- Rendering:
  - `src/app/blog/[slug]/page.tsx`
  - `src/app/blog/[slug]/BlogArticleClient.tsx`
