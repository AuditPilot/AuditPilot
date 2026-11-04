# AuditPilot

Code-audit platform: React (Vite + Tailwind, wouter) SPA + Express API + MongoDB, with Stripe billing, GitHub OAuth/App integration, and OpenRouter-backed audit AI.

## Local development

```bash
npm install
npm run dev          # API server (tsx) with Vite middleware on http://localhost:5000
```

Full build (client + server) and run:

```bash
npm run build        # vite -> dist/public/*, esbuild -> dist/index.cjs
npm start            # node dist/index.cjs (serves SPA + API on one port)
```

Segmented builds (used by the split Dockerfiles, also handy locally):

```bash
npm run build:client # SPA only  -> dist/public
npm run build:server # API only  -> dist/index.cjs
```

Environment in production requires `JWT_SECRET` and `ENCRYPTION_KEY` (see `server/config/env.ts`).

## Docker — split deployment (recommended)

Frontend and backend build as **independent images** and deploy separately:

| Image | Dockerfile | What it contains |
|---|---|---|
| `auditpilot-web` | `Dockerfile.client` | Vite-built SPA served by **nginx** with an `/api` proxy + SPA fallback |
| `auditpilot-api` | `Dockerfile.server` | esbuild API bundle (`dist/index.cjs`) + prod `node_modules`, `SERVE_STATIC=0` |

Run the whole stack locally (web on :4173, API on :8080, bundled Mongo):

```bash
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))") \
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))") \
docker compose up -d
# app  -> http://localhost:4173
# api  -> http://localhost:8080/api/health
# Note: Compose auto-loads the project `.env` for interpolation. To use the
# bundled Mongo, run with MONGODB_URI=mongodb://mongo:27017/auditpilot
# (shell env wins over .env); or keep your .editorconfig-style Atlas URI.
```

Build/push each image independently (e.g. different CI pipelines or registries):

```bash
docker build -f Dockerfile.server -t auditpilot-api .            # backend only
docker build -f Dockerfile.client \
  --build-arg VITE_API_BASE=https://api.example.com \
  -t auditpilot-web .                                            # frontend only
```

### Same-origin vs. split origins

- **Same-origin (default here):** keep `VITE_API_BASE` empty — nginx proxies `/api/` to `API_UPSTREAM` (default `server:8080`), cookies stay `SameSite=Lax`, no CORS involved.
- **Fully split origins** (`app.example.com` ≠ `api.example.com`): bake `VITE_API_BASE=https://api.example.com` into the web image, and on the API set `CLIENT_ORIGIN=https://app.example.com` and `COOKIE_SAMESITE=none` (cookies are `Secure` in production, so both units must run behind HTTPS).
  For GitHub OAuth set the callback to the API origin: `GITHUB_REDIRECT_URI=https://api.example.com/api/auth/github/callback`.

### Rebuild scope

- Frontend code only → rebuild/push `auditpilot-web`; the API deployment stays untouched.
- Backend code only → rebuild/push `auditpilot-api`; the SPA is unaffected (its `VITE_API_BASE` matters only when it changes, which requires a web rebuild).

## Docker — single container (alternative)

`./Dockerfile` builds one image containing the API **and** the statically served SPA (monolith — good for demos/simple hosting):

```bash
docker build -t auditpilot .
docker run --rm -p 5000:5000 -e JWT_SECRET=... -e ENCRYPTION_KEY=... auditpilot
```

## Key env vars (server)

Set via compose / orchestrator secrets — never commit `.env`.

| Variable | Notes |
|---|---|
| `JWT_SECRET`, `ENCRYPTION_KEY` | **Required in production** (32+ hex / 64 hex) |
| `MONGODB_URI` | Atlas URI or `mongodb://mongo:27017/auditpilot` |
| `CLIENT_ORIGIN` | Comma-separated browser origins for CORS |
| `COOKIE_SAMESITE` | `lax` (same-site/proxied) or `none` (split origins) |
| `PORT` | API port (compose uses 8080) |
| `SERVE_STATIC` | `0` for API-only deployments |
| `GITHUB_CLIENT_ID/SECRET/REDIRECT_URI`, `GITHUB_AUTH_MODE`, `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY_BASE64` | GitHub auth |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_*_PRICE_ID` | Billing |
| `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_MODEL_TRIAGE`, `AI_MODEL_DEEP` | Audit AI |

## Checks

```bash
npm run check       # tsc
npm run lint
npm run test        # vitest
```
