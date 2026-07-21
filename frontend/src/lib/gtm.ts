// GTM dataLayer helpers. GA4 fires from inside the GTM container (GTM-5B7PB4C3);
// we only push events — never load gtag.js directly.

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function pushDataLayer(event: Record<string, unknown>): void {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(event);
}

/** Virtual pageview for SPA route changes (GTM History/Custom Event trigger). */
export function trackPageView(pagePath: string, pageTitle: string): void {
  pushDataLayer({
    event: 'page_view',
    page_path: pagePath,
    page_title: pageTitle,
    page_location: window.location.href,
  });
}

interface GA4Item {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  item_category?: string;
}

/** Fired when the user opens the order modal (closest analog to add_to_cart). */
export function trackAddToCart(item: GA4Item): void {
  pushDataLayer({
    event: 'add_to_cart',
    ecommerce: { currency: 'INR', value: item.price * item.quantity, items: [item] },
  });
}

/**
 * Fired when an order record is created and the WhatsApp deep link opens.
 * This is the site's conversion: both a GA4 purchase and a lead handed to WhatsApp.
 */
export function trackPurchase(orderId: string, value: number, item: GA4Item): void {
  pushDataLayer({
    event: 'purchase',
    ecommerce: { transaction_id: orderId, currency: 'INR', value, items: [item] },
  });
  pushDataLayer({
    event: 'generate_lead',
    currency: 'INR',
    value,
    lead_source: 'whatsapp_order',
  });
}
