import { SITE_URL, fetchAllProducts, fetchAllCategories, escapeXml } from './_lib.js';

const STATIC_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/products', priority: '0.9', changefreq: 'daily' },
  { path: '/about', priority: '0.6', changefreq: 'monthly' },
  { path: '/search', priority: '0.5', changefreq: 'weekly' },
];

function urlTag({ loc, lastmod, changefreq, priority }) {
  return [
    '  <url>',
    `    <loc>${escapeXml(loc)}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : null,
    priority ? `    <priority>${priority}</priority>` : null,
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n');
}

export default async function handler(_req, res) {
  const [products, categories] = await Promise.all([fetchAllProducts(), fetchAllCategories()]);

  // Canonical form: home = "https://www.hetmarketing.tech/", all others without trailing slash
  const entries = STATIC_PAGES.map((p) => ({
    loc: p.path === '/' ? `${SITE_URL}/` : `${SITE_URL}${p.path}`,
    changefreq: p.changefreq,
    priority: p.priority,
  }));

  for (const cat of categories) {
    if (!cat?.slug) continue;
    entries.push({
      loc: `${SITE_URL}/products/category/${cat.slug}`,
      changefreq: 'weekly',
      priority: '0.9',
    });
  }

  for (const p of products) {
    if (!p?.slug) continue;
    entries.push({
      loc: `${SITE_URL}/products/${p.slug}`,
      lastmod: p.updatedAt ? new Date(p.updatedAt).toISOString() : undefined,
      changefreq: 'daily',
      priority: '0.8',
    });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
    .map(urlTag)
    .join('\n')}\n</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(xml);
}
