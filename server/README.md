# Local Backend Server (SQLite)

This directory contains a lightweight Node + SQLite backend that implements the same HTTP contracts the web app expects via:
- `NEXT_PUBLIC_DATA_API_URL`
- `NEXT_PUBLIC_AUTH_API_URL`

It is intended for:
- local development/testing of the SQL/API wiring
- a clear reference implementation of the API shapes before deploying a real Postgres-backed service

## Run

From the repo root:

```bash
# Starts the API server on http://127.0.0.1:8787 by default
npm run api:dev
```

### Configure the web app to use it

```bash
NEXT_PUBLIC_DEPLOY_TARGET=runtime \
NEXT_PUBLIC_DATA_API_URL=http://127.0.0.1:8787 \
NEXT_PUBLIC_AUTH_API_URL=http://127.0.0.1:8787 \
NEXT_PUBLIC_ALLOWED_ORIGINS=http://localhost:3000 \
npm run dev
```

## Database
- Default DB path: `db/window-shoppr.sqlite` (gitignored)
- Migrations are applied from `db/migrations/*.sql` in lexical order
- Seeds are applied from `db/seeds/*.sql` in lexical order
- If the `products` table is empty, the server will import `src/data/products.json` into SQL tables.

## Notes
- The Node `sqlite` API is still marked experimental in Node 22.
- Production should use a managed Postgres instance + a hardened API service; this server exists to keep the web app’s backend seam honest.

