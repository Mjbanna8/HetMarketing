import { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import fs from 'fs';
import path from 'path';

const FRONTEND_DIST = path.join(process.cwd(), '../frontend/dist');
const INDEX_HTML_PATH = path.join(FRONTEND_DIST, 'index.html');

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

// Safe Interceptor function
export const safeSeoInterceptor = async (req: Request, res: Response, next: any) => {
  try {
    const { slug } = req.params;
    
    // Check if dist/index.html exists (only exists post-build or after run build)
    if (!fs.existsSync(INDEX_HTML_PATH)) {
      // For local development when dist/ is not built, fail gracefully
      res.status(404).json({ error: "Cannot serve HTML in dev mode without frontend dist build." });
      return;
    }

    const product = await prisma.product.findUnique({
      where: { slug, isDeleted: false },
      include: { images: true }
    });

    if (!product) {
       res.sendFile(INDEX_HTML_PATH);
       return;
    }

    let html = fs.readFileSync(INDEX_HTML_PATH, 'utf8');

    const title = `${product.name} | HetMarketing`;
    const description = product.description.substring(0, 150) + '...';
    const primaryImage = product.images.find(img => img.isPrimary)?.url || product.images[0]?.url || 'https://res.cloudinary.com/cloud_name/image/upload/v1234/default.jpg';
    const productUrl = `${process.env.FRONTEND_URL || 'https://www.hetmarketing.tech'}/products/${product.slug}`;

    html = html.replace(/__META_TITLE__/g, escapeHtml(title));
    html = html.replace(/__META_DESCRIPTION__/g, escapeHtml(description));
    html = html.replace(/__OG_TITLE__/g, escapeHtml(title));
    html = html.replace(/__OG_DESCRIPTION__/g, escapeHtml(description));
    html = html.replace(/__OG_IMAGE__/g, primaryImage);
    html = html.replace(/__OG_URL__/g, productUrl);

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
