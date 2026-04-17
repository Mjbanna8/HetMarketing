import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

export const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  image, 
  url 
}) => {
  const defaultTitle = title ? `${title} | HetMarketing` : "HetMarketing - Shop & Order via WhatsApp";
  const defaultDesc = description || "HetMarketing - Your premium WhatsApp Commerce Platform. Discover top-quality products and order instantly through WhatsApp.";
  const defaultImage = image || "https://www.hetmarketing.tech/logo.png";
  const defaultUrl = url || "https://www.hetmarketing.tech";

  return (
    <Helmet>
      <title>{defaultTitle}</title>
      <meta name="description" content={defaultDesc} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={defaultTitle} />
      <meta property="og:description" content={defaultDesc} />
      <meta property="og:image" content={defaultImage} />
      <meta property="og:url" content={defaultUrl} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={defaultTitle} />
      <meta name="twitter:description" content={defaultDesc} />
      <meta name="twitter:image" content={defaultImage} />
    </Helmet>
  );
};
