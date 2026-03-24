import { PrismaClient, UserRole, ProductStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_WP_TEMPLATE = `🛍️ NEW ORDER — {{storeName}}
━━━━━━━━━━━━━━━━━━━━━━━━
📦 Product: {{productName}}
🔢 Quantity: {{qty}}
💰 Unit Price: ₹{{unitPrice}}
💵 Total: ₹{{totalPrice}}
━━━━━━━━━━━━━━━━━━━━━━━━
👤 Customer: {{fullName}}
📱 Mobile: {{mobile}}
📍 Address: {{deliveryAddress}}
📝 Note: {{note}}
━━━━━━━━━━━━━━━━━━━━━━━━
🕐 Time: {{time}}
🔖 Ref: {{orderId}}`;

async function main(): Promise<void> {
  console.log('🌱 Seeding database...');

  // --- Site Settings ---
  const settings = [
    { key: 'whatsapp_number', value: '+919999999999' },
    { key: 'store_name', value: 'WA Commerce' },
    { key: 'store_logo_url', value: '' },
    { key: 'wp_message_template', value: DEFAULT_WP_TEMPLATE },
    { key: 'contact_email', value: 'admin@wacommerce.com' },
  ];

  for (const setting of settings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log('✅ Site settings seeded');

  // --- Admin Account ---
  const adminPasswordHash = await bcrypt.hash('Admin@123', 12);
  await prisma.admin.upsert({
    where: { email: 'admin@store.com' },
    update: {},
    create: {
      email: 'admin@store.com',
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      mustChangePassword: true,
    },
  });
  console.log('✅ Admin account seeded (admin@store.com / Admin@123)');

  // --- Categories ---
  const categories = [
    { name: 'Electronics', slug: 'electronics', displayOrder: 1 },
    { name: 'Cosmetics', slug: 'cosmetics', displayOrder: 2 },
    { name: 'Daily Use', slug: 'daily-use', displayOrder: 3 },
  ];

  const createdCategories: Record<string, string> = {};
  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    createdCategories[cat.slug] = created.id;
  }
  console.log('✅ Categories seeded');

  // --- Sample Products ---
  const products = [
    {
      name: 'Wireless Bluetooth Earbuds',
      slug: 'wireless-bluetooth-earbuds',
      description: 'Premium wireless earbuds with noise cancellation, 24-hour battery life, and IPX5 water resistance. Crystal clear audio with deep bass.',
      price: 1499,
      originalPrice: 2999,
      categorySlug: 'electronics',
      status: ProductStatus.ACTIVE,
      tags: ['wireless', 'bluetooth', 'earbuds', 'audio'],
      images: [
        { url: 'https://placehold.co/600x600/EEE/999?text=Earbuds', cdnPublicId: 'products/earbuds-1', isPrimary: true },
        { url: 'https://placehold.co/600x600/EEE/999?text=Earbuds+2', cdnPublicId: 'products/earbuds-2', isPrimary: false },
      ],
    },
    {
      name: 'Smart Watch Pro',
      slug: 'smart-watch-pro',
      description: 'Advanced fitness tracker with AMOLED display, heart rate monitoring, SpO2 sensor, and 7-day battery. Compatible with Android and iOS.',
      price: 3499,
      originalPrice: 5999,
      categorySlug: 'electronics',
      status: ProductStatus.ACTIVE,
      tags: ['smartwatch', 'fitness', 'wearable'],
      images: [
        { url: 'https://placehold.co/600x600/EEE/999?text=Smart+Watch', cdnPublicId: 'products/watch-1', isPrimary: true },
      ],
    },
    {
      name: 'Vitamin C Face Serum',
      slug: 'vitamin-c-face-serum',
      description: 'Brightening face serum with 20% Vitamin C, Hyaluronic Acid, and Niacinamide. Reduces dark spots and improves skin texture. 30ml bottle.',
      price: 599,
      originalPrice: 899,
      categorySlug: 'cosmetics',
      status: ProductStatus.ACTIVE,
      tags: ['skincare', 'serum', 'vitamin-c', 'face'],
      images: [
        { url: 'https://placehold.co/600x600/EEE/999?text=Serum', cdnPublicId: 'products/serum-1', isPrimary: true },
      ],
    },
    {
      name: 'Matte Lipstick Collection',
      slug: 'matte-lipstick-collection',
      description: 'Set of 6 long-lasting matte lipsticks in trending shades. Transfer-proof formula that stays up to 12 hours. Enriched with Vitamin E.',
      price: 799,
      originalPrice: null,
      categorySlug: 'cosmetics',
      status: ProductStatus.ACTIVE,
      tags: ['lipstick', 'matte', 'makeup', 'cosmetics'],
      images: [
        { url: 'https://placehold.co/600x600/EEE/999?text=Lipstick', cdnPublicId: 'products/lipstick-1', isPrimary: true },
      ],
    },
    {
      name: 'Bamboo Toothbrush Set',
      slug: 'bamboo-toothbrush-set',
      description: 'Eco-friendly bamboo toothbrush pack of 4 with charcoal-infused bristles. BPA-free, biodegradable, and gentle on gums.',
      price: 249,
      originalPrice: 399,
      categorySlug: 'daily-use',
      status: ProductStatus.ACTIVE,
      tags: ['eco-friendly', 'dental', 'bamboo', 'sustainable'],
      images: [
        { url: 'https://placehold.co/600x600/EEE/999?text=Toothbrush', cdnPublicId: 'products/toothbrush-1', isPrimary: true },
      ],
    },
    {
      name: 'Organic Cotton Towel Set',
      slug: 'organic-cotton-towel-set',
      description: 'Premium 600 GSM organic cotton towel set — 2 bath towels and 2 hand towels. Ultra-soft, quick-drying, and hypoallergenic.',
      price: 1299,
      originalPrice: 1799,
      categorySlug: 'daily-use',
      status: ProductStatus.ACTIVE,
      tags: ['towel', 'organic', 'cotton', 'bath'],
      images: [
        { url: 'https://placehold.co/600x600/EEE/999?text=Towel', cdnPublicId: 'products/towel-1', isPrimary: true },
      ],
    },
  ];

  for (const product of products) {
    const categoryId = createdCategories[product.categorySlug];
    if (!categoryId) continue;

    const existingProduct = await prisma.product.findUnique({
      where: { slug: product.slug },
    });

    if (!existingProduct) {
      await prisma.product.create({
        data: {
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: product.price,
          originalPrice: product.originalPrice,
          categoryId,
          status: product.status,
          tags: product.tags,
          images: {
            create: product.images.map((img, index) => ({
              url: img.url,
              cdnPublicId: img.cdnPublicId,
              displayOrder: index,
              isPrimary: img.isPrimary,
            })),
          },
        },
      });
    }
  }
  console.log('✅ Sample products seeded');

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e: Error) => {
    console.error('❌ Seed error:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
