import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsApi, ordersApi, settingsApi } from '../api';
import type { Product, SiteSettings } from '../types';
import { useAuthStore } from '../store';
import { useTrackProductView } from '../hooks';
import { formatINR, buildOrderMessage, buildWhatsAppUrl, openWhatsApp, getStatusBadgeColor, getProductStatusLabel } from '../utils';
import { Modal, Spinner, PageLoader, ProductCard } from '../components/Shared';
import toast from 'react-hot-toast';

export default function ProductDetailPage(): React.ReactElement {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  // Order modal state
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useTrackProductView(product);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    productsApi
      .getBySlug(slug)
      .then(({ data }) => {
        if (data.data) {
          setProduct(data.data);
          // Load related products from same category
          productsApi
            .getAll({ category: data.data.category.slug, limit: 4 })
            .then(({ data: relData }) => {
              if (relData.data) {
                setRelatedProducts(relData.data.items.filter((p) => p.id !== data.data!.id));
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        toast.error('Product not found');
        navigate('/products');
      })
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  if (loading) return <PageLoader />;
  if (!product) return <PageLoader />;

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  const sortedImages = [...product.images].sort((a, b) => a.displayOrder - b.displayOrder);

  const handleOrderNow = () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/products/${product.slug}`);
      return;
    }
    setOrderModalOpen(true);
  };

  const handleSubmitOrder = async () => {
    if (!deliveryAddress.trim()) {
      toast.error('Please enter your delivery address');
      return;
    }
    if (deliveryAddress.trim().length < 5) {
      toast.error('Delivery address must be at least 5 characters');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await ordersApi.create({
        productId: product.id,
        quantity,
        deliveryAddress: deliveryAddress.trim(),
        customerNote: customerNote.trim() || undefined,
      });

      if (data.data) {
        const order = data.data;

        // Get settings for WhatsApp number and template
        let settings: SiteSettings = { store_name: 'HetMarketing', store_logo_url: '', whatsapp_number: order.whatsappNumberUsed, contact_email: '' };
        try {
          const settingsRes = await settingsApi.getPublic();
          if (settingsRes.data.data) settings = settingsRes.data.data;
        } catch {
          // use defaults
        }

        const message = buildOrderMessage(
          settings.store_name,
          product.name,
          quantity,
          product.price,
          product.price * quantity,
          user!.fullName,
          user!.mobile,
          deliveryAddress.trim(),
          customerNote.trim() || null,
          order.id,
          settings.wp_message_template
        );

        const waUrl = buildWhatsAppUrl(order.whatsappNumberUsed, message);
        openWhatsApp(waUrl);

        setOrderModalOpen(false);
        navigate(`/order-confirm/${order.id}`);
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      const serverMessage = axiosError?.response?.data?.error;
      toast.error(serverMessage || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-page py-8 md:py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Gallery */}
        <div>
          <div
            className="aspect-square rounded-2xl overflow-hidden bg-surface-50 cursor-zoom-in mb-4"
            onClick={() => setZoomOpen(true)}
          >
            {sortedImages[selectedImage] ? (
              <img
                src={sortedImages[selectedImage].url}
                alt={`${product.name} - Image ${selectedImage + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/EEE/999?text=No+Image'; }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-surface-300">
                <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {sortedImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {sortedImages.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(i)}
                  className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                    i === selectedImage ? 'border-primary-500 ring-2 ring-primary-100' : 'border-transparent hover:border-surface-200'
                  }`}
                >
                  <img src={img.url} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/EEE/999?text=No+Image'; }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <p className="text-primary-600 font-medium mb-2">{product.category.name}</p>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-surface-900 mb-4">{product.name}</h1>

          {/* Availability Badge */}
          <div className="mb-4">
            <span className={getStatusBadgeColor(product.status)}>{getProductStatusLabel(product.status)}</span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-3xl font-bold text-surface-900">{formatINR(product.price)}</span>
            {hasDiscount && (
              <>
                <span className="text-xl text-surface-400 line-through">{formatINR(product.originalPrice!)}</span>
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
                  {discountPercent}% OFF
                </span>
              </>
            )}
          </div>

          {/* Description */}
          <div className="prose prose-sm max-w-none mb-8 text-surface-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: product.description }} />

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {product.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 bg-surface-100 text-surface-600 rounded-full text-xs font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Order CTA */}
          {product.status === 'ACTIVE' && (
            <button
              onClick={handleOrderNow}
              className="btn-whatsapp w-full md:w-auto text-lg px-10 py-4"
              id="order-now-btn"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              </svg>
              Order via WhatsApp
            </button>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="section-title mb-8">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Zoom Modal */}
      {zoomOpen && sortedImages[selectedImage] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setZoomOpen(false)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
            onClick={() => setZoomOpen(false)}
            aria-label="Close zoom"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={sortedImages[selectedImage].url}
            alt={product.name}
            className="max-w-full max-h-[90vh] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/EEE/999?text=No+Image'; }}
          />
        </div>
      )}

      {/* Order Modal */}
      <Modal isOpen={orderModalOpen} onClose={() => setOrderModalOpen(false)} title="Order Summary" maxWidth="max-w-md">
        <div className="space-y-5">
          <div className="flex items-center gap-4 p-4 bg-surface-50 rounded-xl">
            {sortedImages[0] && (
              <img src={sortedImages[0].url} alt={product.name} className="w-16 h-16 rounded-lg object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/EEE/999?text=No+Image'; }} />
            )}
            <div>
              <h4 className="font-semibold text-surface-900">{product.name}</h4>
              <p className="text-primary-600 font-bold">{formatINR(product.price)}</p>
            </div>
          </div>

          <div>
            <label htmlFor="order-qty" className="block text-sm font-medium text-surface-700 mb-2">Quantity</label>
            <select
              id="order-qty"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
              className="input-field"
            >
              {Array.from({ length: 99 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="order-address" className="block text-sm font-medium text-surface-700 mb-2">
              Delivery Address <span className="text-red-500">*</span>
            </label>
            <textarea
              id="order-address"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              className="input-field min-h-[100px] resize-none"
              placeholder="Enter your complete delivery address"
              required
            />
          </div>

          <div>
            <label htmlFor="order-note" className="block text-sm font-medium text-surface-700 mb-2">
              Note (optional, max 300 chars)
            </label>
            <textarea
              id="order-note"
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value.slice(0, 300))}
              className="input-field min-h-[80px] resize-none"
              placeholder="Any special instructions?"
              maxLength={300}
            />
            <p className="text-xs text-surface-400 mt-1">{customerNote.length}/300</p>
          </div>

          <div className="p-4 bg-surface-50 rounded-xl space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">Unit Price</span>
              <span className="font-medium">{formatINR(product.price)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">Quantity</span>
              <span className="font-medium">×{quantity}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t border-surface-200 pt-2">
              <span>Total</span>
              <span className="text-primary-600">{formatINR(product.price * quantity)}</span>
            </div>
          </div>

          <button
            onClick={handleSubmitOrder}
            disabled={submitting || !deliveryAddress.trim()}
            className="btn-whatsapp w-full text-lg"
          >
            {submitting ? (
              <Spinner size="sm" />
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                </svg>
                Confirm & Send via WhatsApp
              </>
            )}
          </button>
        </div>
      </Modal>
    </div>
  );
}
