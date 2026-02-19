# Blog Workflow (B1-B5)

- `B1`: Blog architecture is live with:
  - `/blog/` index route
  - `/blog/[slug]/` article route
  - taxonomy fields (`category`, `tags`)
  - breadcrumb navigation and canonical metadata
- `B2`: Desktop top bar exposes a `Blog` entry; mobile top-level nav still omits blog entry.
- `B3`: Topic proposal scoring pipeline in `src/shared/lib/blog/pipeline.ts`.
- `B4`: Eligibility gate requires at least one referral link (`referralLinkCount >= 1`).
- `B5`: Agentic research plan generator returns:
  - competitor format checklist
  - source collection checklist
  - fact validation checklist
  - outline section plan
