import { format } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

const IST_TIMEZONE = 'Asia/Kolkata';

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDateIST(dateStr: string, formatStr = 'dd/MM/yyyy HH:mm'): string {
  const date = new Date(dateStr);
  const istDate = utcToZonedTime(date, IST_TIMEZONE);
  return format(istDate, formatStr);
}

export function formatDateShort(dateStr: string): string {
  return formatDateIST(dateStr, 'dd MMM yyyy');
}

export function buildWhatsAppUrl(
  whatsappNumber: string,
  message: string
): string {
  const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
}

export function buildOrderMessage(
  storeName: string,
  productName: string,
  qty: number,
  unitPrice: number,
  totalPrice: number,
  fullName: string,
  mobile: string,
  deliveryAddress: string,
  note: string | null,
  orderId: string,
  template?: string
): string {
  const time = formatDateIST(new Date().toISOString());

  if (template) {
    return template
      .replace(/\{\{storeName\}\}/g, storeName)
      .replace(/\{\{productName\}\}/g, productName)
      .replace(/\{\{qty\}\}/g, qty.toString())
      .replace(/\{\{unitPrice\}\}/g, formatINR(unitPrice).replace('₹', ''))
      .replace(/\{\{totalPrice\}\}/g, formatINR(totalPrice).replace('₹', ''))
      .replace(/\{\{fullName\}\}/g, fullName)
      .replace(/\{\{mobile\}\}/g, mobile)
      .replace(/\{\{deliveryAddress\}\}/g, deliveryAddress)
      .replace(/\{\{note\}\}/g, note || 'None')
      .replace(/\{\{time\}\}/g, time)
      .replace(/\{\{orderId\}\}/g, orderId);
  }

  return `🛍️ NEW ORDER — ${storeName}
━━━━━━━━━━━━━━━━━━━━━━━━
📦 Product: ${productName}
🔢 Quantity: ${qty}
💰 Unit Price: ₹${formatINR(unitPrice).replace('₹', '')}
💵 Total: ₹${formatINR(totalPrice).replace('₹', '')}
━━━━━━━━━━━━━━━━━━━━━━━━
👤 Customer: ${fullName}
📱 Mobile: ${mobile}
📍 Address: ${deliveryAddress}
📝 Note: ${note || 'None'}
━━━━━━━━━━━━━━━━━━━━━━━━
🕐 Time: ${time} IST
🔖 Ref: #${orderId}`;
}

export function openWhatsApp(url: string): void {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  if (isMobile) {
    window.location.href = url;
  } else {
    window.open(url, '_blank');
  }
}

export function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'badge-warning';
    case 'CONFIRMED':
      return 'badge-info';
    case 'DISPATCHED':
      return 'badge-info';
    case 'DELIVERED':
      return 'badge-success';
    case 'CANCELLED':
      return 'badge-danger';
    case 'ACTIVE':
      return 'badge-success';
    case 'INACTIVE':
      return 'badge-neutral';
    case 'OUT_OF_STOCK':
      return 'badge-danger';
    default:
      return 'badge-neutral';
  }
}

export function getProductStatusLabel(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'In Stock';
    case 'INACTIVE':
      return 'Inactive';
    case 'OUT_OF_STOCK':
      return 'Out of Stock';
    default:
      return status;
  }
}

// Recently viewed products (localStorage)
const RECENTLY_VIEWED_KEY = 'recentlyViewed';
const MAX_RECENTLY_VIEWED = 5;

interface RecentProduct {
  slug: string;
  name: string;
  price: number;
  image: string;
}

export function addToRecentlyViewed(product: RecentProduct): void {
  const existing = getRecentlyViewed();
  const filtered = existing.filter((p) => p.slug !== product.slug);
  filtered.unshift(product);
  const limited = filtered.slice(0, MAX_RECENTLY_VIEWED);
  localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(limited));
}

export function getRecentlyViewed(): RecentProduct[] {
  try {
    const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
    return stored ? (JSON.parse(stored) as RecentProduct[]) : [];
  } catch {
    return [];
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
