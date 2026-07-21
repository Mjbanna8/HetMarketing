// Shared helpers for SEO serverless functions (sitemap, llms.txt).
// Read-only consumption of the public backend API.

export const SITE_URL = 'https://www.hetmarketing.tech';
export const API_BASE = process.env.SEO_API_BASE || 'https://api.hetmarketing.tech/api';

const FETCH_TIMEOUT_MS = 8000;

async function apiGet(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}${path}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`API ${path} -> ${res.status}`);
    const json = await res.json();
    return json.data;
  } finally {
    clearTimeout(timer);
  }
}

/** Fetch every product page-by-page. Returns [] on failure (caller degrades gracefully). */
export async function fetchAllProducts() {
  const products = [];
  try {
    let page = 1;
    let hasNext = true;
    while (hasNext && page <= 100) {
      // Backend caps limit at 50; 100 pages x 50 = 5000 products safety cap
      const data = await apiGet(`/products?page=${page}&limit=50`);
      if (!data?.items?.length) break;
      products.push(...data.items);
      hasNext = Boolean(data.hasNext);
      page += 1;
    }
  } catch {
    // Graceful degradation: never break the sitemap over an API hiccup
  }
  return products;
}

/** Returns [] on failure. */
export async function fetchAllCategories() {
  try {
    const data = await apiGet('/categories');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Strip HTML tags and collapse whitespace for plain-text descriptions. */
export function plainText(html, maxLen = 160) {
  const text = String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > maxLen ? `${text.slice(0, maxLen - 1)}…` : text;
}
