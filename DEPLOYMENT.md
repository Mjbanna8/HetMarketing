# Deployment Guide — HetMarketing

Production runbook for `hetmarketing.tech`. Read this before touching production.

## Topology

```
                        ┌─────────────────────────────────────────┐
   git push origin main │  GitHub: Mjbanna8/HetMarketing (main)   │
  ──────────────────────►                                         │
                        └───────────────┬─────────────────────────┘
                                        │ auto-deploy (frontend/ root)
                                        ▼
   www.hetmarketing.tech   ┌─────────────────────────┐
   hetmarketing.tech ──301─►  Vercel                 │
                           │  • Vite SPA (dist/)     │
                           │  • /api/* functions     │  sitemap, llms.txt, llms-full.txt
                           │  • UA-based bot rewrite │──► social scrapers proxied to backend
                           └────────────┬────────────┘
                                        │ VITE_API_URL
                                        ▼
   api.hetmarketing.tech   ┌─────────────────────────┐
                           │  DigitalOcean droplet   │
                           │  nginx :443 → :5000     │
                           │  pm2: hetmarketing-api  │
                           │  (also: ivisioncraft)   │
                           └────────────┬────────────┘
                                        ▼
                    PostgreSQL (Neon)  +  DO Spaces CDN (images)
```

- **Frontend**: Vercel project rooted at `frontend/`, auto-deploys every push to `main`. No manual step.
- **Backend**: droplet at `/var/www/HetMarketing`, Express via pm2 (`hetmarketing-api`, port 5000), nginx terminates TLS for `api.hetmarketing.tech`. Deployed manually via `deploy.sh`.
- The droplet also hosts an unrelated Next.js app (`ivisioncraft`, port 3001) — never `pm2 delete all`.

## Deploying

### Frontend (automatic)
```bash
git push origin main        # Vercel builds frontend/ and goes live in ~1 minute
```
Requires push access to `Mjbanna8/HetMarketing` (the repo is public; fetch works for everyone, push does not).

### Backend (manual, on the droplet)
```bash
ssh root@<droplet>          # api.hetmarketing.tech
cd /var/www/HetMarketing
./deploy.sh
```
`deploy.sh` is intentionally **not tracked in git** (a tracked copy would collide with the
untracked one on the droplet during `git pull`). Its contents:
```bash
#!/bin/bash
cd /var/www/HetMarketing
git pull origin main
cd backend
npm install
npm run build
pm2 restart hetmarketing-api --update-env
pm2 save
echo "✅ Deployed successfully!"
curl -s http://localhost:5000/api/health
```

### Backend deploy without GitHub access (git bundle over SSH)
If you have commits locally but cannot push to GitHub:
```bash
git bundle create /tmp/rel.bundle origin/main..main
scp /tmp/rel.bundle root@<droplet>:/tmp/
ssh root@<droplet> 'cd /var/www/HetMarketing && git fetch /tmp/rel.bundle main && git merge --ff-only FETCH_HEAD'
# then run the deploy.sh steps (skip git pull)
```
Note: this only deploys the **backend** — the frontend still requires a real GitHub push for Vercel to build.

### Database migrations
Migrations do not run automatically. When `backend/prisma/migrations/` has new entries:
```bash
ssh root@<droplet>
cd /var/www/HetMarketing/backend && npx prisma migrate deploy
```
Run **before** `pm2 restart` if the new code depends on the schema change.

## Post-deploy verification

Run after every deploy (all should pass in <30s):

```bash
# API up
curl -s https://api.hetmarketing.tech/api/health                         # {"success":true,...}

# SEO surface (Vercel functions, fed by live API)
curl -s https://www.hetmarketing.tech/sitemap.xml | grep -c "<loc>"      # 8 + product count
curl -s -o /dev/null -w "%{http_code}\n" https://www.hetmarketing.tech/llms.txt        # 200
curl -s -o /dev/null -w "%{http_code}\n" https://www.hetmarketing.tech/llms-full.txt   # 200

# Dynamic rendering for social scrapers (bot UA → SSR meta; human UA → SPA)
curl -s -A "WhatsApp/2.0" https://www.hetmarketing.tech/products/<any-slug> | grep og:image
curl -s https://www.hetmarketing.tech/products/<any-slug> | grep '<div id="root">'

# Host canonicalization
curl -sI https://hetmarketing.tech | grep -i location                    # → https://www.hetmarketing.tech/
```

## Rollback

- **Frontend**: Vercel dashboard → Deployments → previous deployment → *Promote to Production* (instant, no rebuild).
- **Backend**:
  ```bash
  cd /var/www/HetMarketing
  git log --oneline -5              # find last good commit
  git reset --hard <good-sha>
  cd backend && npm install && npm run build
  pm2 restart hetmarketing-api && curl -s http://localhost:5000/api/health
  ```
  (Coordinate with GitHub main afterward — don't leave the droplet permanently diverged.)

## Environment variables

| Where | Vars |
|---|---|
| Vercel (project settings) | `VITE_API_URL=https://api.hetmarketing.tech/api` (also in tracked `frontend/.env.production`); optional `SEO_API_BASE` override for the `/api` functions |
| Droplet `/var/www/HetMarketing/.env` | `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `DO_SPACES_KEY/SECRET/BUCKET/REGION`, `SMTP_*`, `FRONTEND_URL`, `PORT=5000`, `NODE_ENV=production` |

`pm2 restart --update-env` picks up `.env` edits; a plain `pm2 restart` may not.

## SEO/AEO surface — who serves what

| URL | Served by | Notes |
|---|---|---|
| `/sitemap.xml` | Vercel fn `frontend/api/sitemap.js` | Live product/category URLs, 1h edge cache, never 500s (falls back to static pages on API failure) |
| `/llms.txt`, `/llms-full.txt` | Vercel fns | llmstxt.org spec, live catalog, 1h cache |
| `/robots.txt` | Vercel static (`frontend/public/`) | AI crawlers explicitly allowed |
| `/products/:slug` (social-scraper UAs) | Rewritten to backend `/seo-products/:slug` | Self-contained HTML: OG/Twitter meta + Product JSON-LD; 10min edge cache |
| `/products/:slug` (humans, Googlebot) | SPA | Meta/JSON-LD via react-helmet (Googlebot renders JS) |

## Gotchas (learned the hard way)

1. **`GET /products` caps `limit` at 50** (Zod). Pagination loops must request ≤50 or get a 400.
2. **Never add files to `frontend/public/` that shadow vercel.json rewrites** — a static `sitemap.xml` there silently overrides the dynamic function (filesystem wins on Vercel).
3. **`frontend/dist` does not exist on the droplet** — backend code must never depend on it (the old SEO interceptor did, and was dead in production for months).
4. The Vercel dashboard's apex→www domain redirect fires **before** vercel.json and returns 307; set it to 308 (permanent) in the dashboard for full SEO value.
5. Droplet is 1 vCPU/2GB shared with another app — avoid running heavy builds there concurrently.
6. GTM only: the GA4 tag lives **inside** container `GTM-5B7PB4C3`. Never add a separate gtag.js snippet.
7. SPA route changes push `page_view` to `dataLayer` (see `frontend/src/lib/gtm.ts`); GA4 pageviews require a matching Custom Event trigger in GTM.

## Security checklist

- [ ] Droplet: disable SSH password auth (`PasswordAuthentication no`), use keys only
- [ ] Rotate any credential ever pasted into a chat/ticket (GitHub PATs, root password)
- [ ] GitHub PATs: fine-grained, repo-scoped, short expiry; never commit them
- [ ] After first admin login, `mustChangePassword` forces a reset — don't disable it
