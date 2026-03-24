# WA Commerce — WhatsApp-Integrated E-Commerce Platform

A full-stack e-commerce platform where customers browse products and order via WhatsApp deep links. Built with React + TypeScript (frontend) and Node.js + Express + Prisma (backend).

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
| Images | Cloudinary SDK |
| WhatsApp | wa.me deep-link (client-side) |

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Cloudinary account (for image uploads)
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

```bash
# Copy env template
cp .env.example backend/.env

# Edit backend/.env with your values:
# - DATABASE_URL: Your PostgreSQL connection string
# - JWT_ACCESS_SECRET / JWT_REFRESH_SECRET: Generate secure random strings
# - CLOUDINARY_*: Your Cloudinary credentials
# - SMTP_*: Your email service credentials
# - FRONTEND_URL: http://localhost:5173 (for development)
```

### 3. Database Setup

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed the database
npm run prisma:seed
```

### 4. Run Development Servers

```bash
# Terminal 1 — Backend (port 4000)
cd backend
npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

Visit:
- **Storefront**: http://localhost:5173
- **Admin Panel**: http://localhost:5173/admin/login

### Default Admin Credentials

```
Email: admin@store.com
Password: Admin@123
```

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
│   ├── src/
│   │   ├── config/       # Environment configuration
│   │   ├── controllers/  # Request handlers
│   │   ├── middleware/    # Auth, validation, rate limiting
│   │   ├── routes/       # Express routers
│   │   ├── services/     # Business logic
│   │   └── utils/        # Logger, helpers, Cloudinary, email
│   └── ...config files
└── .env.example
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
- Product CRUD with Cloudinary image upload
- Category management with safe deletion (product reassignment)
- Order management with status updates and CSV export
- WhatsApp message template editor with live preview
- 8-hour session with T-5min warning

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
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `SMTP_HOST` | SMTP server host |
| `SMTP_PORT` | SMTP server port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `FRONTEND_URL` | Frontend URL (for CORS and emails) |
| `PORT` | Backend server port (default: 4000) |
| `NODE_ENV` | development / production |

## Deployment

### Frontend → Vercel
```bash
cd frontend
npm run build
# Deploy dist/ folder to Vercel
```

### Backend → Railway
```bash
cd backend
npm run build
# Deploy with Railway — set all env vars in dashboard
```

## License

MIT
