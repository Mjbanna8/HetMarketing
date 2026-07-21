import { SITE_URL, fetchAllProducts, fetchAllCategories, plainText } from './_lib.js';

export default async function handler(_req, res) {
  const [products, categories] = await Promise.all([fetchAllProducts(), fetchAllCategories()]);

  const lines = [
    '# Het Marketing',
    '',
    '> Het Marketing — IT services & e-commerce company in Rajkot, Gujarat, India (web development, digital solutions, online store). DPIIT-recognized startup. Customers browse products online and place orders via WhatsApp.',
    '',
    '## Products',
    '',
  ];

  if (products.length) {
    for (const p of products.slice(0, 200)) {
      lines.push(`- [${p.name}](${SITE_URL}/products/${p.slug}): ${plainText(p.description, 120)}`);
    }
  } else {
    lines.push(`- [All Products](${SITE_URL}/products): Browse the full HetMarketing catalog.`);
  }

  if (categories.length) {
    lines.push('', '## Categories', '');
    for (const c of categories) {
      lines.push(`- [${c.name}](${SITE_URL}/products/category/${c.slug}): ${c.name} products from HetMarketing.`);
    }
  }

  lines.push(
    '',
    '## Services',
    '',
    `- [Services & Solutions](${SITE_URL}/about): Web development, digital solutions, and WhatsApp-commerce services.`,
    '',
    '## Company',
    '',
    `- [About Us](${SITE_URL}/about): Who we are, our mission, and why customers choose HetMarketing.`,
    `- [Home](${SITE_URL}/): Storefront with latest products and offers.`,
    '',
    '## Contact',
    '',
    `- [Contact & Ordering](${SITE_URL}/about): Orders and inquiries are handled via WhatsApp from any product page.`,
    '- Office: 223/219 Jimmy Tower, Gondal Road, Rajkot, Gujarat, India',
    ''
  );

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(lines.join('\n'));
}
