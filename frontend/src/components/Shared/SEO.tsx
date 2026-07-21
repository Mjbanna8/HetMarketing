import React from 'react';
import { Helmet } from 'react-helmet-async';
import { SITE_URL, SITE_NAME, LOGO_URL } from '../../utils/seoUtils';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  /** Absolute canonical URL. Defaults to current path on the canonical host. */
  url?: string;
  /** og:type — 'product' on product detail pages */
  type?: 'website' | 'product';
  /** Set true on private pages (account, orders, order-confirm) */
  noindex?: boolean;
  /** Product price — emits product:price:* OG tags */
  price?: number;
  /** JSON-LD object(s) to embed */
  jsonLd?: object | object[];
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  image,
  url,
  type = 'website',
  noindex = false,
  price,
  jsonLd,
}) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — IT Services & Online Store in Rajkot`;
  const desc =
    description ||
    'Het Marketing — IT services and online store in Rajkot, Gujarat. Browse premium products and order instantly on WhatsApp.';
  const img = image || LOGO_URL;
  // Canonical: absolute, https, www host, no query params
  const canonical =
    url || `${SITE_URL}${typeof window !== 'undefined' ? window.location.pathname : '/'}`;
  const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <html lang="en" />
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_IN" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={img} />
      <meta property="og:url" content={canonical} />
      {type === 'product' && price !== undefined && (
        <meta property="product:price:amount" content={String(price)} />
      )}
      {type === 'product' && price !== undefined && (
        <meta property="product:price:currency" content="INR" />
      )}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />

      {/* JSON-LD structured data */}
      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};
