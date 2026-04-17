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
      "priceCurrency": "INR",
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

export const optimizeCloudinaryUrl = (originalUrl?: string, width = 800) => {
  if (!originalUrl) return '';
  if (!originalUrl.includes('cloudinary')) return originalUrl;
  
  const insertIndex = originalUrl.indexOf('/upload/') + 8;
  const transformations = `f_auto,q_auto,w_${width},c_limit/`;
  
  return originalUrl.slice(0, insertIndex) + transformations + originalUrl.slice(insertIndex);
};
