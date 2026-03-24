import { Prisma, ProductStatus } from '@prisma/client';
import { prisma } from '../utils/prisma.js';
import { slugify } from '../utils/helpers.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';
import type { CreateProductInput, UpdateProductInput, ProductQueryInput, BulkActionInput } from '../utils/validators.js';

interface ProductWithImages {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice: number | null;
  categoryId: string;
  category: { id: string; name: string; slug: string };
  status: ProductStatus;
  tags: string[];
  images: Array<{
    id: string;
    url: string;
    cdnPublicId: string;
    displayOrder: number;
    isPrimary: boolean;
  }>;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const productInclude = {
  category: { select: { id: true, name: true, slug: true } },
  images: {
    select: { id: true, url: true, cdnPublicId: true, displayOrder: true, isPrimary: true },
    orderBy: { displayOrder: Prisma.SortOrder.asc },
  },
};

export async function getPublicProducts(
  query: ProductQueryInput
): Promise<{ products: ProductWithImages[]; total: number }> {
  const where: Prisma.ProductWhereInput = {
    isDeleted: false,
    status: ProductStatus.ACTIVE,
  };

  if (query.category) {
    where.category = { slug: query.category };
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.price = {};
    if (query.minPrice !== undefined) where.price.gte = query.minPrice;
    if (query.maxPrice !== undefined) where.price.lte = query.maxPrice;
  }

  if (query.status) {
    where.status = query.status;
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.product.count({ where }),
  ]);

  return { products: products as ProductWithImages[], total };
}

export async function searchProducts(searchQuery: string): Promise<ProductWithImages[]> {
  const products = await prisma.product.findMany({
    where: {
      isDeleted: false,
      status: ProductStatus.ACTIVE,
      OR: [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { description: { contains: searchQuery, mode: 'insensitive' } },
        { tags: { hasSome: [searchQuery.toLowerCase()] } },
      ],
    },
    include: productInclude,
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return products as ProductWithImages[];
}

export async function getProductBySlug(slug: string): Promise<ProductWithImages> {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: productInclude,
  });

  if (!product || product.isDeleted) {
    throw new NotFoundError('Product not found');
  }

  return product as ProductWithImages;
}

export async function getAdminProducts(
  search?: string,
  sort?: string,
  page = 1,
  limit = 20,
  includeDeleted = false
): Promise<{ products: ProductWithImages[]; total: number }> {
  const where: Prisma.ProductWhereInput = {};

  if (!includeDeleted) {
    where.isDeleted = false;
  } else {
    where.isDeleted = true;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
  if (sort) {
    const [field, direction] = sort.split(':');
    if (['name', 'price', 'createdAt', 'updatedAt'].includes(field)) {
      orderBy = { [field]: direction === 'asc' ? 'asc' : 'desc' };
    }
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return { products: products as ProductWithImages[], total };
}

export async function createProduct(
  input: CreateProductInput,
  imageBuffers: Buffer[]
): Promise<ProductWithImages> {
  const slug = slugify(input.name);

  const existingSlug = await prisma.product.findUnique({ where: { slug } });
  if (existingSlug) {
    throw new BadRequestError('A product with a similar name already exists');
  }

  const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
  if (!category) {
    throw new BadRequestError('Invalid category');
  }

  const imageData: Array<{ url: string; cdnPublicId: string; displayOrder: number; isPrimary: boolean }> = [];
  for (let i = 0; i < imageBuffers.length; i++) {
    const result = await uploadToCloudinary(imageBuffers[i]);
    imageData.push({
      url: result.url,
      cdnPublicId: result.publicId,
      displayOrder: i,
      isPrimary: i === 0,
    });
  }

  const product = await prisma.product.create({
    data: {
      name: input.name,
      slug,
      description: input.description,
      price: input.price,
      originalPrice: input.originalPrice ?? null,
      categoryId: input.categoryId,
      status: input.status as ProductStatus,
      tags: input.tags as string[],
      images: {
        create: imageData,
      },
    },
    include: productInclude,
  });

  return product as ProductWithImages;
}

export async function updateProduct(
  id: string,
  input: UpdateProductInput,
  newImageBuffers?: Buffer[],
  removeImageIds?: string[],
  imageOrder?: Array<{ id: string; displayOrder: number; isPrimary: boolean }>
): Promise<ProductWithImages> {
  const existing = await prisma.product.findUnique({
    where: { id },
    include: { images: true },
  });

  if (!existing || existing.isDeleted) {
    throw new NotFoundError('Product not found');
  }

  const updateData: Prisma.ProductUpdateInput = {};

  if (input.name) {
    updateData.name = input.name;
    updateData.slug = slugify(input.name);
    const slugConflict = await prisma.product.findFirst({
      where: { slug: updateData.slug as string, id: { not: id } },
    });
    if (slugConflict) {
      throw new BadRequestError('A product with a similar name already exists');
    }
  }

  if (input.description !== undefined) updateData.description = input.description;
  if (input.price !== undefined) updateData.price = input.price;
  if (input.originalPrice !== undefined) updateData.originalPrice = input.originalPrice;
  if (input.categoryId) updateData.category = { connect: { id: input.categoryId } };
  if (input.status) updateData.status = input.status as ProductStatus;
  if (input.tags !== undefined) updateData.tags = input.tags as string[];

  if (removeImageIds && removeImageIds.length > 0) {
    const imagesToRemove = existing.images.filter((img) => removeImageIds.includes(img.id));
    for (const img of imagesToRemove) {
      await deleteFromCloudinary(img.cdnPublicId);
    }
    await prisma.productImage.deleteMany({
      where: { id: { in: removeImageIds } },
    });
  }

  if (newImageBuffers && newImageBuffers.length > 0) {
    const currentCount = existing.images.length - (removeImageIds?.length ?? 0);
    for (let i = 0; i < newImageBuffers.length; i++) {
      const result = await uploadToCloudinary(newImageBuffers[i]);
      await prisma.productImage.create({
        data: {
          productId: id,
          url: result.url,
          cdnPublicId: result.publicId,
          displayOrder: currentCount + i,
          isPrimary: currentCount + i === 0,
        },
      });
    }
  }

  if (imageOrder && imageOrder.length > 0) {
    for (const item of imageOrder) {
      await prisma.productImage.update({
        where: { id: item.id },
        data: { displayOrder: item.displayOrder, isPrimary: item.isPrimary },
      });
    }
  }

  const product = await prisma.product.update({
    where: { id },
    data: updateData,
    include: productInclude,
  });

  return product as ProductWithImages;
}

export async function softDeleteProduct(id: string): Promise<void> {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new NotFoundError('Product not found');

  await prisma.product.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
}

export async function restoreProduct(id: string): Promise<ProductWithImages> {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new NotFoundError('Product not found');
  if (!product.isDeleted) throw new BadRequestError('Product is not deleted');

  const restored = await prisma.product.update({
    where: { id },
    data: { isDeleted: false, deletedAt: null },
    include: productInclude,
  });

  return restored as ProductWithImages;
}

export async function hardDeleteProduct(id: string): Promise<void> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { images: true },
  });

  if (!product) throw new NotFoundError('Product not found');
  if (!product.isDeleted) throw new BadRequestError('Product must be soft-deleted first');

  for (const img of product.images) {
    await deleteFromCloudinary(img.cdnPublicId);
  }

  await prisma.product.delete({ where: { id } });
}

export async function bulkAction(input: BulkActionInput): Promise<number> {
  const { ids, action } = input;

  switch (action) {
    case 'delete':
      await prisma.product.updateMany({
        where: { id: { in: ids } },
        data: { isDeleted: true, deletedAt: new Date() },
      });
      return ids.length;

    case 'activate':
      await prisma.product.updateMany({
        where: { id: { in: ids } },
        data: { status: ProductStatus.ACTIVE },
      });
      return ids.length;

    case 'deactivate':
      await prisma.product.updateMany({
        where: { id: { in: ids } },
        data: { status: ProductStatus.INACTIVE },
      });
      return ids.length;

    default:
      throw new BadRequestError('Invalid bulk action');
  }
}

export async function exportProductsCSV(): Promise<string> {
  const products = await prisma.product.findMany({
    where: { isDeleted: false },
    include: { category: { select: { name: true } }, images: { where: { isPrimary: true }, select: { url: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const header = 'ID,Name,Category,Price,Original Price,Status,Tags,Primary Image,Created At\n';
  const rows = products.map((p) => {
    return [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category.name}"`,
      p.price,
      p.originalPrice ?? '',
      p.status,
      `"${p.tags.join(', ')}"`,
      p.images[0]?.url ?? '',
      p.createdAt.toISOString(),
    ].join(',');
  });

  return header + rows.join('\n');
}

export async function getLatestProducts(count = 6): Promise<ProductWithImages[]> {
  const products = await prisma.product.findMany({
    where: { isDeleted: false, status: ProductStatus.ACTIVE },
    include: productInclude,
    orderBy: { createdAt: 'desc' },
    take: count,
  });

  return products as ProductWithImages[];
}

export async function getDiscountedProducts(count = 6): Promise<ProductWithImages[]> {
  const products = await prisma.product.findMany({
    where: {
      isDeleted: false,
      status: ProductStatus.ACTIVE,
      originalPrice: { not: null },
    },
    include: productInclude,
    orderBy: { createdAt: 'desc' },
    take: count,
  });

  return products as ProductWithImages[];
}
