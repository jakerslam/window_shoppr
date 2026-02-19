# Hosting and Build Pipeline

## Primary options
- GitHub Pages (current beta static export).
- Vercel (recommended runtime hosting for launch).

## Recommended Hosting Combos (Runtime Launch)
We can keep GitHub Pages for a static beta preview, but **runtime features** (intercepting routes/modals, server APIs, SQL, auth cookies) require a runtime host.

Option 1 (Recommended): **Vercel (Web) + Render (API) + Neon (Postgres)**
- Pros: simplest “enterprise-ish” stack, good DX, easy scaling, clear separation of concerns.
- Cons: 2 deployments + CORS/origin policy to manage.

Option 2: **Vercel (Web) + Fly.io (API) + Neon (Postgres)**
- Pros: strong performance + regions; good long-term scale.
- Cons: slightly more ops complexity.

Option 3: **Vercel (Web) + Supabase (DB/Auth) + thin API (optional)**
- Pros: integrated DB/auth/admin tooling.
- Cons: we’d likely refactor portions of `server/` to use Supabase primitives (policy + auth), which is more of a “platform bet.”

### Static Beta vs Runtime
- Static beta (GitHub Pages): `NEXT_PUBLIC_DEPLOY_TARGET=static-export`
- Runtime (launch): `NEXT_PUBLIC_DEPLOY_TARGET=runtime`

In `static-export` builds, we keep runtime-only features **behind feature flags / deploy target** so the site still renders, but those routes/flows won’t function fully until we deploy the runtime stack.

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
