# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**HetMarketing** — a full-stack e-commerce platform where customers browse products but *do not check out on-site*. Placing an order records the order in the DB and then opens a pre-filled **WhatsApp deep link** (`wa.me/<number>?text=...`) so the conversation moves to WhatsApp. There is no payment gateway. Keep this mental model: the "cart/checkout" endpoint is really "create order record + build WhatsApp message."

It is a monorepo of two independently-deployed apps: `frontend/` (Vite/React SPA → Vercel) and `backend/` (Express API → Railway/Render). They share no code; they communicate over the REST API under `/api`.

## Commands

Run from the repo root:
```bash
npm run dev          # runs backend + frontend concurrently
./start-dev.sh       # same thing via a bash script
```

Backend (`cd backend`):
```bash
npm run dev              # tsx watch, hot-reload (default port 4000, README says 5000 — check .env PORT)
npm run build            # prisma generate && tsc  → dist/
npm run start:prod       # node dist/server.js
npm run prisma:migrate   # prisma migrate dev
npm run prisma:seed      # seeds default admin + categories (tsx prisma/seed.ts)
npm run prisma:studio    # Prisma Studio GUI
npx prisma generate      # regenerate client after schema.prisma changes
```

Frontend (`cd frontend`):
```bash
npm run dev      # Vite dev server, port 5173
npm run build    # tsc -b && vite build → dist/
npm run lint     # eslint .
npm run preview  # preview production build
```

There is **no test suite** in this repo (no test runner, no `test` script). Do not invent test commands.

## Architecture

### Backend request pipeline
Every API request flows: **route → middleware → controller → service → Prisma**. This layering is strict:
- **Controllers** (`src/controllers/`) are thin: parse the request, call a service, wrap the result in `successResponse(...)` from `utils/response.ts`. They are wrapped in `asyncHandler` so thrown errors reach the central `errorHandler` middleware.
- **Services** (`src/services/`) hold all business logic and are the *only* layer that talks to Prisma. Put logic here, not in controllers.
- **Errors** are thrown as typed classes from `utils/errors.ts` (`UnauthorizedError`, `ForbiddenError`, `NotFoundError`, etc.); `middleware/errorHandler.ts` maps them to HTTP responses. Never `res.status().json()` an error manually in a controller — throw instead.
- `server.ts` wires all routes, Helmet CSP, CORS allow-list, and connects Prisma before `listen()`.

### Dual authentication (customers vs admins are fully separate)
There are **two distinct auth systems** with separate DB tables (`User` and `Admin`), separate JWTs, and separate middleware — do not conflate them:
- **Customers**: `authGuard` middleware; access token **15 min**, refresh token **30 d** (httpOnly cookie). Token must carry `role: 'CUSTOMER'`.
- **Admins**: `adminGuard` middleware; access token **8 h**, no refresh — the session simply expires. Token must carry `role: 'ADMIN'`.
- All of `/api/admin/*` is behind `router.use(adminGuard)` in `adminRoutes.ts`. Token helpers all live in `middleware/auth.ts`.

On the frontend this mirror-images into **two Zustand stores** in `src/store/index.ts`: `useAuthStore` (keys `accessToken`/`user` in localStorage) and `useAdminAuthStore` (keys `adminAccessToken`/`admin`/`adminSessionExpiry`). The Axios client (`src/api/client.ts`) picks which token to attach by checking whether the URL contains `/admin`, and auto-refreshes customer tokens on 401 via a queued single-flight refresh. Admin sessions are enforced client-side (8h expiry + a T-5min warning via `useAdminSessionWarning`), because the admin JWT has no refresh path.

### Image storage — DigitalOcean Spaces (all uploads go through one file)
`backend/src/utils/spaces.ts` is the single choke point for images. Every uploaded image is:
1. converted to **WebP at quality 80** via `sharp` before upload,
2. stored `public-read` under `hetmarketing/{products,categories,about}/<uuid>.webp`,
3. returned as a CDN URL, with its S3 key stored as `cdnPublicId` in the DB.

On replace/delete the old object is removed via `deleteFromSpaces` (non-throwing — a failed delete only warns). Multer (`middleware/upload.ts`) stages uploads in `/tmp/uploads`. **Note:** `cloudinary` is still a dependency and CSP/README reference Cloudinary — the project was migrated *from* Cloudinary *to* Spaces; treat Spaces as the source of truth and Cloudinary code paths as legacy. One-time migration scripts live in `backend/scripts/migrate*ToSpaces.ts` (read-only against Cloudinary).

### SEO / crawler SSR shim (no real SSR)
The SPA is client-rendered, so `backend/src/controllers/seoController.ts` provides crawler-facing SEO:
- `GET /sitemap.xml` — generated from active products + categories, cached in-memory for 1 hour.
- `GET /seo-products/:slug` (`safeSeoInterceptor`) — reads the built `frontend/dist/index.html` and string-replaces `__META_TITLE__`, `__OG_IMAGE__`, etc. placeholders with per-product values. **This only works after `frontend` is built** (returns 404 in dev when `dist/` is absent). The placeholders must exist in `frontend/index.html`.

### Frontend structure
- Routing in `src/App.tsx`: all pages are `React.lazy`-loaded. Customer routes are nested under `<CustomerLayout>`; admin routes under `<AdminLayout>` (guarded by `useRequireAdmin`). `AppInitializer` runs `useInitializeAuth`, `useInitializeAdminAuth`, and `useLoadSettings` once on mount.
- Typed API calls live in `src/api/index.ts` (grouped objects like `settingsApi`, etc.) built on the shared Axios instance.
- WhatsApp message construction is `buildOrderMessage` + `buildWhatsAppUrl` + `openWhatsApp` in `src/utils/index.ts`. The WhatsApp number itself is a **site setting** (`whatsapp_number` key), editable in the admin panel, read from the `SiteSetting` table.
- Money is INR (`formatINR`); dates are rendered in IST (`formatDateIST`). Reuse these, don't re-implement.

### Data model (`backend/prisma/schema.prisma`)
Key points beyond the obvious: `Product` uses **soft delete** (`isDeleted` / `deletedAt`) — the admin "trash"/restore/hard-delete flow depends on this, so filter `isDeleted: false` in customer-facing queries. `ProductImage` cascades on product delete and carries `cdnPublicId` (the Spaces key) + `isPrimary`. `SiteSetting` is a generic key/value store (WhatsApp number, message templates, marquee offers, etc.). `OtpVerification` backs email OTP; `Admin.mustChangePassword` gates first-login password change.

## Conventions that matter here
- Backend is **ESM** — all relative imports use explicit `.js` extensions (e.g. `import { prisma } from './utils/prisma.js'`) even though the source is `.ts`. Keep this pattern or the build breaks.
- All input validation is **Zod schemas** in `backend/src/utils/validators.ts`, applied via the `validate(schema)` middleware on the route. Add new request validation there, not inline.
- Success responses are always `successResponse(data)` → `{ success: true, data }`. Frontend reads `response.data.data`.
- `config/index.ts` centralizes env access via `getEnv(key, fallback)` which throws on missing required vars. Read env through `config`, not `process.env`, except inside `utils/spaces.ts` which reads Spaces creds directly.

## Production deployment
- **Frontend** → Vercel (project root `frontend/`), auto-deploys on push to `main`. `frontend/vercel.json` holds SPA rewrites, `hetmarketing.tech → www` 301, `/sitemap.xml` `/llms.txt` `/llms-full.txt` rewrites to Vercel functions in `frontend/api/`, and a user-agent rewrite that proxies social scrapers (WhatsApp/Facebook/Twitter/LinkedIn) hitting `/products/:slug` to the backend's `/seo-products/:slug` dynamic renderer.
- **Backend** → DigitalOcean droplet (nginx `api.hetmarketing.tech` → pm2 `hetmarketing-api` on :5000). Deploy: `ssh` to the droplet, then `cd /var/www/HetMarketing && ./deploy.sh` (git pull + npm install + build + pm2 restart).
- Backend `/products` list endpoint caps `limit` at **50** (Zod) — pagination loops must use ≤50.

## Reference docs in the repo
- `README.md` — setup, env vars, deployment.
- `ADMIN_PRODUCT_MANAGEMENT_END_TO_END_FLOW.md` — detailed admin product CRUD + image lifecycle walkthrough.
- `TECHNICAL_SEO_BLUEPRINT.md` — the SEO/crawler strategy behind the seoController shim.
