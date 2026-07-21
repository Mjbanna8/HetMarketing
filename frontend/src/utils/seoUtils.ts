import { Product, Category } from '../types';

export const SITE_URL = 'https://www.hetmarketing.tech';
export const SITE_NAME = 'Het Marketing';
export const LOGO_URL = `${SITE_URL}/logo.png`;

/** Strip HTML and trim to a length — for meta descriptions derived from rich text. */
export const toMetaDescription = (html: string, maxLen = 158): string => {
  const text = (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > maxLen ? `${text.slice(0, maxLen - 1)}…` : text;
};

export const generateProductSchema = (product: Product, productUrl: string) => {
  const images = (product.images ?? [])
    .slice()
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary))
    .map((img) => img.url);

  return {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    image: images.length ? images : undefined,
    description: toMetaDescription(product.description, 5000),
    sku: product.id,
    brand: { '@type': 'Brand', name: SITE_NAME },
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'INR',
      price: product.price,
      itemCondition: 'https://schema.org/NewCondition',
      availability:
        product.status === 'ACTIVE'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
    },
    // NOTE: no aggregateRating — the data model has no reviews; never fabricate ratings.
  };
};

export const generateOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: LOGO_URL,
  // TODO: add sameAs social profile URLs when available (none found in codebase)
});

export const generateWebSiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
});

export const generateLocalBusinessSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: SITE_NAME,
  image: LOGO_URL,
  url: SITE_URL,
  address: {
    '@type': 'PostalAddress',
    streetAddress: '223/219 Jimmy Tower, Gondal Road',
    addressLocality: 'Rajkot',
    addressRegion: 'Gujarat',
    // TODO: confirm postal code (Gondal Road, Rajkot is typically 360002)
    postalCode: '360002',
    addressCountry: 'IN',
  },
  // TODO: add telephone / email when published on the site
});

export const generateBreadcrumbSchema = (crumbs: Array<{ name: string; url: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: c.name,
    item: c.url,
  })),
});

export const generateItemListSchema = (products: Product[], listName: string) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: listName,
  itemListElement: products.map((p, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: p.name,
    url: `${SITE_URL}/products/${p.slug}`,
  })),
});

export const categoryUrl = (cat: Pick<Category, 'slug'>): string =>
  `${SITE_URL}/products/category/${cat.slug}`;

export const optimizeCloudinaryUrl = (originalUrl?: string, width = 800) => {
  if (!originalUrl) return '';
  if (!originalUrl.includes('cloudinary')) return originalUrl;

  const insertIndex = originalUrl.indexOf('/upload/') + 8;
  const transformations = `f_auto,q_auto,w_${width},c_limit/`;

  return originalUrl.slice(0, insertIndex) + transformations + originalUrl.slice(insertIndex);
};
