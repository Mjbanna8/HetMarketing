import { SITE_URL, fetchAllProducts, fetchAllCategories, plainText } from './_lib.js';

export default async function handler(_req, res) {
  const [products, categories] = await Promise.all([fetchAllProducts(), fetchAllCategories()]);

  const lines = [
    '# Het Marketing — Full Reference',
    '',
    '> Het Marketing — IT services & e-commerce company in Rajkot, Gujarat, India (web development, digital solutions, online store). DPIIT-recognized startup.',
    '',
    '## Company',
    '',
    'Het Marketing is an IT services and e-commerce company based in Rajkot, Gujarat, India, and a DPIIT-recognized startup.',
    'It operates hetmarketing.tech, a WhatsApp-commerce storefront: customers browse a curated product catalog online and',
    'complete orders through a pre-filled WhatsApp conversation — no on-site checkout. The company also provides IT services',
    'including web development and digital solutions for businesses.',
    '',
    'Office address: 223/219 Jimmy Tower, Gondal Road, Rajkot, Gujarat, India',
    `Website: ${SITE_URL}`,
    '',
    '## Services',
    '',
    '- Web development: business websites, e-commerce storefronts, and web applications.',
    '- Digital solutions: online presence, digital marketing, and automation for SMBs.',
    '- WhatsApp commerce: conversational ordering flows connecting online catalogs to WhatsApp.',
    '',
    '## How Ordering Works',
    '',
    '1. Browse products at ' + SITE_URL + '/products',
    '2. Open a product page and click "Order on WhatsApp".',
    '3. A pre-filled WhatsApp message opens with product, quantity, price, and delivery address.',
    '4. The order is confirmed in the WhatsApp conversation. Prices are in Indian Rupees (INR).',
    '',
  ];

  if (categories.length) {
    lines.push('## Categories', '');
    for (const c of categories) {
      lines.push(`- [${c.name}](${SITE_URL}/products/category/${c.slug})`);
    }
    lines.push('');
  }

  lines.push('## Complete Product List', '');
  if (products.length) {
    for (const p of products) {
      const price = typeof p.price === 'number' ? `₹${p.price} INR` : '';
      lines.push(`### ${p.name}`, '', `- URL: ${SITE_URL}/products/${p.slug}`, `- Price: ${price}`, `- Description: ${plainText(p.description, 400)}`, '');
    }
  } else {
    lines.push(`Product list temporarily unavailable — browse ${SITE_URL}/products`, '');
  }

  lines.push('## Contact', '', '- Orders and inquiries: via WhatsApp from any product page on the site.', '- Office: 223/219 Jimmy Tower, Gondal Road, Rajkot, Gujarat, India', '');

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(lines.join('\n'));
}
