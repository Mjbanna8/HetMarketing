# HetMarketing — WhatsApp-Integrated E-Commerce Platform

A full-stack e-commerce platform where customers browse products and place orders via WhatsApp deep links. Built with React + TypeScript (frontend) and Node.js + Express + Prisma (backend). All product, category, and about-page images are stored on **DigitalOcean Spaces** (S3-compatible CDN), automatically converted to WebP at quality 80 before upload.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v3 |
| State | Zustand |
| Forms | react-hook-form + Zod |
| Charts | Recharts |
| Backend | Node.js + Express.js + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (access + refresh tokens) + bcrypt |
| Images | DigitalOcean Spaces (S3) + sharp (WebP) |
| WhatsApp | wa.me deep-link (client-side) |

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Neon or local)
- DigitalOcean Spaces bucket with CDN enabled
- SMTP credentials (for password reset emails)

### 1. Clone & Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Setup

Create `backend/.env` with the following values:

```env
# Server
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL=postgresql://<user>:<pass>@<host>/<db>?sslmode=require

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# JWT
JWT_ACCESS_SECRET=<random-32-char-string>
JWT_REFRESH_SECRET=<random-32-char-string>

# DigitalOcean Spaces (image storage)
DO_SPACES_KEY=<your-spaces-access-key>
DO_SPACES_SECRET=<your-spaces-secret-key>
DO_SPACES_BUCKET=<your-bucket-name>
DO_SPACES_REGION=<region>   # e.g. sgp1

# SMTP (email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your-email>
SMTP_PASS=<app-password>
```

### 3. Database Setup

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed the database (creates default admin + categories)
npm run prisma:seed
```

### 4. Run Development Servers

```bash
# Terminal 1 — Backend (port 5000)
cd backend
npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

Visit:
- **Storefront**: http://localhost:5173
- **Admin Panel**: http://localhost:5173/admin/login

## Project Structure

```
├── frontend/
│   ├── src/
│   │   ├── api/          # Axios client + typed API calls
│   │   ├── components/   # Shared UI components + Layouts
│   │   ├── hooks/        # Custom React hooks
│   │   ├── pages/        # Route-level page components
│   │   │   └── admin/    # Admin panel pages
│   │   ├── store/        # Zustand state management
│   │   ├── types/        # TypeScript interfaces
│   │   └── utils/        # Helpers (WhatsApp builder, formatters)
│   └── ...config files
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma # Database schema
│   │   └── seed.ts       # Seed data
│   ├── scripts/          # One-time migration scripts
│   │   ├── migrateImagesToSpaces.ts      # Product images
│   │   ├── migrateCategoriesToSpaces.ts  # Category icons
│   │   └── migrateAboutToSpaces.ts       # About page images
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── middleware/   # Auth, validation, rate limiting
│   │   ├── routes/       # Express routers
│   │   ├── services/     # Business logic
│   │   └── utils/        # Logger, helpers, spaces.ts, email
│   └── ...config files
└── README.md
```

## Key Features

### Customer
- Product browsing with filters (category, price range) and pagination
- Live search with 500ms debounce
- Product detail with image gallery and zoom
- WhatsApp order flow with pre-filled message
- Account management and order history
- Recently viewed products (localStorage)

### Admin Panel
- Dashboard with Recharts (order volume, category distribution)
- Product CRUD with multi-image upload → auto-converted to WebP on Spaces
- Category management with icon upload and safe deletion (product reassignment)
- About page member photo management
- Order management with status updates and CSV export
- WhatsApp message template editor with live preview
- 8-hour session with T-5min warning

### Image Storage (DigitalOcean Spaces)
All uploads go through `backend/src/utils/spaces.ts`:
- Every image is converted to **WebP at quality 80** via `sharp` before upload
- ACL is set to `public-read`; CDN URL is returned immediately
- Stored under folder paths:
  - `hetmarketing/products/<uuid>.webp` — product images
  - `hetmarketing/categories/<uuid>.webp` — category icons
  - `hetmarketing/about/<uuid>.webp` — about page photos
- Old images are deleted from Spaces on replacement or hard-delete (non-throwing)

### Security
- JWT access (15min) + refresh (30d, httpOnly cookie) tokens
- bcrypt (cost factor 12) password hashing
- Account lockout after 5 failed logins (15min)
- Rate limiting (general, auth, admin login)
- Helmet.js with CSP headers
- Zod validation on all inputs
- Separate customer/admin auth middleware

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Secret for access token signing |
| `JWT_REFRESH_SECRET` | Secret for refresh token signing |
| `DO_SPACES_KEY` | DigitalOcean Spaces access key |
| `DO_SPACES_SECRET` | DigitalOcean Spaces secret key |
| `DO_SPACES_BUCKET` | Spaces bucket name |
| `DO_SPACES_REGION` | Spaces region (e.g. `sgp1`) |
| `SMTP_HOST` | SMTP server host |
| `SMTP_PORT` | SMTP server port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `FRONTEND_URL` | Frontend URL (for CORS and emails) |
| `PORT` | Backend server port (default: `5000`) |
| `NODE_ENV` | `development` / `production` |

## One-Time Migrations (Cloudinary → Spaces)

If you have existing images stored on Cloudinary, run these scripts once (they are read-only — Cloudinary is never touched):

```bash
cd backend

# Migrate product images
npx tsx scripts/migrateImagesToSpaces.ts

# Migrate category icons
npx tsx scripts/migrateCategoriesToSpaces.ts

# Migrate about-page member photos
npx tsx scripts/migrateAboutToSpaces.ts
```

Each script logs `✅ migrated` or `❌ failed` per record. Failed rows (e.g. already-deleted Cloudinary URLs) can be cleaned up manually via Prisma Studio (`npm run prisma:studio`).

## Deployment

### Frontend → Vercel
```bash
cd frontend
npm run build
# Deploy dist/ folder to Vercel
# Set VITE_API_URL env var in Vercel dashboard
```

### Backend → Railway / Render
```bash
cd backend
npm run build
# Deploy with Railway or Render
# Set all env vars (DATABASE_URL, DO_SPACES_*, JWT_*, SMTP_*, etc.) in dashboard
# Run: npx prisma migrate deploy (on first deploy)
```

## License

MIT
