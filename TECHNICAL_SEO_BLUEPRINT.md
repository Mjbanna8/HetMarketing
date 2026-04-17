# HetMarketing Technical SEO Blueprint (Vite + Express Architecture)

This blueprint provides a production-ready strategy for optimizing your Client-Side Rendered (CSR) React + Vite application for Googlebot and social media crawlers. It leverages your existing Express backend to dynamically inject SEO metadata into your initially static HTML shell.

## 1. The Express.js Crawler Interceptor (Dynamic Meta Injection)

Since Vite generates a static `index.html`, social network scrapers (WhatsApp, Facebook, Twitter) which do not execute JavaScript will see empty or default `<meta>` tags. We must intercept the request in the Express server, fetch the data, read the `index.html` file, inject the tags, and return the modified HTML.

### A. Add Placeholder Tags in Vite's `index.html`
Ensure your `frontend/index.html` has identifiable placeholders in the `<head>`:

```html
<!-- frontend/index.html -->
<title>__META_TITLE__</title>
<meta name="description" content="__META_DESCRIPTION__" />
<meta property="og:title" content="__OG_TITLE__" />
<meta property="og:description" content="__OG_DESCRIPTION__" />
<meta property="og:image" content="__OG_IMAGE__" />
<meta property="og:url" content="__OG_URL__" />
<meta name="twitter:card" content="summary_large_image" />
```

### B. Express Catch-All Route for HTML Serving
Place this at the *bottom* of your Express setup (`server.ts`), after all your API routes, to handle React SPA routing while dynamically injecting tags for product pages.

```typescript
// backend/src/server.ts (At the end, before errorHandler)

import fs from 'fs';
import path from 'path';
import { prisma } from './utils/prisma.js'; // Adjust path

const FRONTEND_DIST = path.join(__dirname, '../../frontend/dist');
const INDEX_HTML_PATH = path.join(FRONTEND_DIST, 'index.html');

// Helper to escape HTML to prevent XSS
const escapeHtml = (unsafe: string) => {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
};

// Intercept specific routes needing dynamic SEO
app.get('/products/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    
    // 1. Fetch product from Prisma
    const product = await prisma.product.findUnique({
      where: { slug, isDeleted: false },
      include: { images: true }
    });

    if (!product) {
      return res.status(404).sendFile(INDEX_HTML_PATH); // Fallback to CSR 404
    }

    // 2. Read the static index.html built by Vite
    let html = fs.readFileSync(INDEX_HTML_PATH, 'utf8');

    // 3. Define the dynamic meta data
    const title = `${product.name} | HetMarketing`;
    const description = product.description.substring(0, 150) + '...';
    // Get primary image or fallback
    const primaryImage = product.images.find(img => img.isPrimary)?.url || product.images[0]?.url || 'DEFAULT_IMAGE_URL';
    const productUrl = `${process.env.FRONTEND_URL}/products/${product.slug}`;

    // 4. Inject metadata by replacing placeholders
    html = html.replace(/__META_TITLE__/g, escapeHtml(title));
    html = html.replace(/__META_DESCRIPTION__/g, escapeHtml(description));
    html = html.replace(/__OG_TITLE__/g, escapeHtml(title));
    html = html.replace(/__OG_DESCRIPTION__/g, escapeHtml(description));
    html = html.replace(/__OG_IMAGE__/g, primaryImage);
    html = html.replace(/__OG_URL__/g, productUrl);

    // 5. Send the populated HTML to the bot/client
    res.send(html);
  } catch (error) {
    console.error('SEO Interceptor Error:', error);
    next(error);
  }
});

// Serve Vite static assets
app.use(express.static(FRONTEND_DIST));

// Catch-all for other React routes that don't need dynamic injection
app.get('*', (req, res) => {
  let html = fs.readFileSync(INDEX_HTML_PATH, 'utf8');
  // Provide generic defaults
  html = html.replace(/__META_TITLE__/g, 'HetMarketing | Premium Products');
  html = html.replace(/__META_DESCRIPTION__/g, 'Discover the best products on HetMarketing.');
  html = html.replace(/__OG_TITLE__/g, 'HetMarketing');
  // ... replace other defaults
  res.send(html);
});
```
> [!IMPORTANT]
> The above configuration assumes your backend server also serves your built Vite frontend (typical for Express monolithic deployments). If you host the frontend strictly on Vercel and the backend on Railway, serverless edge functions are required instead. If deploying completely separately, let me know, and we can configure Vercel Edge Middleware for the injection instead of Express route handling.

---

## 2. Client-Side SEO Management

For users already in the app, routing happens client-side without hitting the Express HTML engine. Use `react-helmet-async` to manage the document `<head>`.

### A. Install Dependency
```bash
npm install react-helmet-async
```

### B. Setup Provider in `App.tsx` or `main.tsx`
```tsx
// frontend/src/main.tsx
import { HelmetProvider } from 'react-helmet-async';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);
```

### C. Reusable SEO Component
```tsx
// frontend/src/components/Shared/SEO.tsx
import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
}

export const SEO: React.FC<SEOProps> = ({ title, description, image, url }) => {
  const defaultImage = "https://your-domain.com/default-og.jpg";
  return (
    <Helmet>
      <title>{title} | HetMarketing</title>
      <meta name="description" content={description} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={`${title} | HetMarketing`} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image || defaultImage} />
      {url && <meta property="og:url" content={url} />}
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={`${title} | HetMarketing`} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image || defaultImage} />
    </Helmet>
  );
};
```
*Use `<SEO>` in your `ProductDetailPage.tsx`.*

---

## 3. Dynamic JSON-LD Schema Generation

JSON-LD helps Google understand your products for rich snippets (like exact price and stock status appearing directly in Google search results).

### A. JSON-LD Utility
```typescript
// frontend/src/utils/seoUtils.ts
import { Product } from '../types';

export const generateProductSchema = (product: Product, productUrl: string) => {
  const primaryImage = product.images?.find((img: any) => img.isPrimary)?.url || product.images?.[0]?.url;

  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": primaryImage,
    "description": product.description,
    "sku": product.id,
    "offers": {
      "@type": "Offer",
      "url": productUrl,
      "priceCurrency": "INR", // Adjust based on your currency
      "price": product.price,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": product.status === "ACTIVE" 
          ? "https://schema.org/InStock" 
          : "https://schema.org/OutOfStock",
    }
  };
};

export const generateOrganizationSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "HetMarketing",
    "url": "https://www.hetmarketing.tech",
    "logo": "https://res.cloudinary.com/.../logo.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-xxxxx-xxxxx",
      "contactType": "customer service"
    }
  };
};
```

### B. Injecting into React Page
```tsx
// frontend/src/pages/ProductDetailPage.tsx
import { Helmet } from 'react-helmet-async';
import { generateProductSchema } from '../utils/seoUtils';

// ... inside the component, after data fetch:
const schema = generateProductSchema(product, window.location.href);

<Helmet>
  <script type="application/ld+json">
    {JSON.stringify(schema)}
  </script>
</Helmet>
```

---

## 4. Cloudinary Image Optimization for SEO

Google heavily weights page load speed and modern image formats.

### A. Cloudinary URL Transformations
Whenever fetching an image in React (or storing in the DB), configure the URL to serve `f_auto` (format auto: WebP/AVIF depending on the browser) and `q_auto` (quality auto: optimized payload).

```typescript
// Example Transform Utility
export const optimizeCloudinaryUrl = (originalUrl: string, width = 800) => {
  // Assuming URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234/public_id
  if (!originalUrl.includes('cloudinary')) return originalUrl;
  
  const insertIndex = originalUrl.indexOf('/upload/') + 8;
  const transformations = `f_auto,q_auto,w_${width},c_limit/`;
  
  return originalUrl.slice(0, insertIndex) + transformations + originalUrl.slice(insertIndex);
};
```

### B. Alt Text Modeling in Prisma
**Crucial for Google Image Search:** Currently, your `ProductImage` schema lacks an `altText` field. 

```prisma
// backend/prisma/schema.prisma
model ProductImage {
  id           String   @id @default(cuid())
  productId    String
  // ...
  url          String
  cdnPublicId  String
  altText      String?  // Add this field for SEO
  // ...
}
```
*Run `npx prisma migrate dev --name add_alttext_to_images`.*
When uploading an image, default the `altText` to `${productName} Image ${index + 1}`. Ensure image tags use it: `<img src={optimizeCloudinaryUrl(img.url)} alt={img.altText} />`

---

## 5. Automated XML Sitemap Generation via Express

Search engines need a `sitemap.xml` to discover your products efficiently.

### Express Sitemap Controller
```typescript
// backend/src/controllers/seoController.ts
import { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';

// Cache to prevent DB hammering (e.g. 1 hour)
let cachedSitemap: string | null = null;
let sitemapTimestamp: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; 

export const getSitemap = async (req: Request, res: Response) => {
  try {
    res.header('Content-Type', 'application/xml');

    // Return cache if valid
    if (cachedSitemap && (Date.now() - sitemapTimestamp) < CACHE_DURATION) {
      return res.send(cachedSitemap);
    }

    const baseUrl = process.env.FRONTEND_URL || 'https://www.hetmarketing.tech';

    // Fetch active data
    const products = await prisma.product.findMany({
      where: { isDeleted: false, status: 'ACTIVE' },
      select: { slug: true, updatedAt: true },
    });

    const categories = await prisma.category.findMany({
      select: { slug: true }
    });

    // Build XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Static pages
    const staticPages = ['/', '/products', '/about', '/search'];
    staticPages.forEach(page => {
      xml += `
  <url>
    <loc>${baseUrl}${page}</loc>
    <changefreq>daily</changefreq>
    <priority>${page === '/' ? '1.0' : '0.8'}</priority>
  </url>`;
    });

    // Dynamic Category Pages
    categories.forEach(cat => {
      xml += `
  <url>
    <loc>${baseUrl}/products/category/${cat.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    // Dynamic Product Pages
    products.forEach(product => {
      xml += `
  <url>
    <loc>${baseUrl}/products/${product.slug}</loc>
    <lastmod>${product.updatedAt.toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;
    });

    xml += `\n</urlset>`;

    // Save to cache
    cachedSitemap = xml;
    sitemapTimestamp = Date.now();

    res.send(xml);
  } catch (error) {
    console.error('Sitemap Generation Error:', error);
    res.status(500).end();
  }
};
```

### App Setup (`backend/src/server.ts`)
```typescript
import { getSitemap } from './controllers/seoController.js';

// Add this before auth middleware / general routes
app.get('/sitemap.xml', getSitemap);
```
