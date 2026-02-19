# Hosting and Build Pipeline

## Primary options
- GitHub Pages (current beta static export).
- Vercel (recommended runtime hosting for launch).

## Vercel pipeline
Workflow: `/ .github/workflows/vercel-deploy.yml`

### Required repository secrets
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

### Deploy behavior
- Auto deploy on push to `main`.
- Manual deploy via `workflow_dispatch`.
- Builds with `vercel build --prod` and deploys prebuilt artifact.

## Notes
- Keep GitHub Pages workflow during beta validation.
- Switch canonical production pipeline to Vercel before launch if dynamic/runtime features are required.
