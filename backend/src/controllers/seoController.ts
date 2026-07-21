import { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';

let cachedSitemap: string | null = null;
let sitemapTimestamp: number = 0;
const CACHE_DURATION = 60 * 60 * 1000;

export const getSitemap = async (_req: Request, res: Response) => {
  try {
    res.header('Content-Type', 'application/xml');

    if (cachedSitemap && (Date.now() - sitemapTimestamp) < CACHE_DURATION) {
      res.send(cachedSitemap);
      return;
    }

    const baseUrl = process.env.FRONTEND_URL || 'https://www.hetmarketing.tech';

    const products = await prisma.product.findMany({
      where: { isDeleted: false, status: 'ACTIVE' },
      select: { slug: true, updatedAt: true },
    });

    const categories = await prisma.category.findMany({
      select: { slug: true }
    });

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    const staticPages = ['/', '/products', '/about', '/search'];
    staticPages.forEach(page => {
      xml += `\n  <url>\n    <loc>${baseUrl}${page}</loc>\n    <changefreq>daily</changefreq>\n    <priority>${page === '/' ? '1.0' : '0.8'}</priority>\n  </url>`;
    });

    categories.forEach(cat => {
      xml += `\n  <url>\n    <loc>${baseUrl}/products/category/${cat.slug}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`;
    });

    products.forEach(product => {
      xml += `\n  <url>\n    <loc>${baseUrl}/products/${product.slug}</loc>\n    <lastmod>${product.updatedAt.toISOString()}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>`;
    });

    xml += `\n</urlset>`;

    cachedSitemap = xml;
    sitemapTimestamp = Date.now();

    res.send(xml);
  } catch (error) {
    console.error('Sitemap Generation Error:', error);
    res.status(500).end();
  }
};

const escapeHtml = (unsafe: string) => {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
};

const SITE_URL = 'https://www.hetmarketing.tech';
const SITE_NAME = 'Het Marketing';

const stripHtml = (html: string, maxLen = 158): string => {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > maxLen ? `${text.slice(0, maxLen - 1)}…` : text;
};

/**
 * Dynamic-rendering endpoint for social scrapers (WhatsApp/Facebook/Twitter/LinkedIn).
 * Vercel proxies bot user-agents on /products/:slug here, so the scraper sees
 * fully-rendered meta tags under the original www URL. Self-contained — no
 * dependency on a frontend build existing on this server.
 */
export const safeSeoInterceptor = async (req: Request, res: Response, next: any) => {
  try {
    const { slug } = req.params;

    const product = await prisma.product.findUnique({
      where: { slug, isDeleted: false },
      include: { images: { orderBy: { displayOrder: 'asc' } }, category: true }
    });

    if (!product) {
      res.status(404).send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${SITE_NAME}</title><meta name="robots" content="noindex"></head><body><a href="${SITE_URL}/products">Browse products</a></body></html>`);
      return;
    }

    const title = `${product.name} | ${SITE_NAME}`;
    const description = stripHtml(product.description);
    const images = [...product.images].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary)).map(i => i.url);
    const primaryImage = images[0] || `${SITE_URL}/logo.png`;
    const productUrl = `${SITE_URL}/products/${product.slug}`;

    const jsonLd = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: product.name,
      image: images.length ? images : undefined,
      description: stripHtml(product.description, 5000),
      sku: product.id,
      brand: { '@type': 'Brand', name: SITE_NAME },
      offers: {
        '@type': 'Offer',
        url: productUrl,
        priceCurrency: 'INR',
        price: product.price,
        itemCondition: 'https://schema.org/NewCondition',
        availability: product.status === 'ACTIVE' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      },
    };

    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${productUrl}">
<meta property="og:type" content="product">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:locale" content="en_IN">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:image" content="${primaryImage}">
<meta property="og:url" content="${productUrl}">
<meta property="product:price:amount" content="${product.price}">
<meta property="product:price:currency" content="INR">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${primaryImage}">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
<h1>${escapeHtml(product.name)}</h1>
<img src="${primaryImage}" alt="${escapeHtml(product.name)}" width="600">
<p>${escapeHtml(description)}</p>
<p>Price: ₹${product.price} INR</p>
<p><a href="${productUrl}">View and order on ${SITE_NAME}</a></p>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600');
    res.send(html);
  } catch (error) {
    console.error('SEO Interceptor Error:', error);
    next(error);
  }
};

// Also offer a JSON API for Vercel functions if needed
export const getProductSeoMetadata = async (req: Request, res: Response) => {
    try {
        const { slug } = req.params;
        const product = await prisma.product.findUnique({
            where: { slug, isDeleted: false },
            include: { images: true }
        });
        if (!product) {
            res.status(404).json({ error: 'Not found' });
            return;
        }
        
        const title = `${product.name} | HetMarketing`;
        const description = product.description.substring(0, 150) + '...';
        const primaryImage = product.images.find(img => img.isPrimary)?.url || product.images[0]?.url;

        res.json({ title, description, image: primaryImage });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
