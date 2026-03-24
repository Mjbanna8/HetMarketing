import { prisma } from '../utils/prisma.js';
import { slugify } from '../utils/helpers.js';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';

interface CategoryData {
  id: string;
  name: string;
  slug: string;
  iconUrl: string | null;
  displayOrder: number;
  createdAt: Date;
  _count?: { products: number };
}

export async function getAllCategories(): Promise<CategoryData[]> {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: { where: { isDeleted: false } } } } },
    orderBy: { displayOrder: 'asc' },
  });

  return categories as CategoryData[];
}

export async function getCategoryBySlug(slug: string): Promise<CategoryData> {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: { _count: { select: { products: { where: { isDeleted: false } } } } },
  });

  if (!category) throw new NotFoundError('Category not found');
  return category as CategoryData;
}

export async function createCategory(
  name: string,
  iconBuffer?: Buffer
): Promise<CategoryData> {
  const slug = slugify(name);

  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) {
    throw new ConflictError('A category with this name already exists');
  }

  let iconUrl: string | null = null;
  if (iconBuffer) {
    const result = await uploadToCloudinary(iconBuffer, 'categories');
    iconUrl = result.url;
  }

  const maxOrder = await prisma.category.aggregate({ _max: { displayOrder: true } });
  const displayOrder = (maxOrder._max.displayOrder ?? 0) + 1;

  const category = await prisma.category.create({
    data: { name, slug, iconUrl, displayOrder },
    include: { _count: { select: { products: { where: { isDeleted: false } } } } },
  });

  return category as CategoryData;
}

export async function updateCategory(
  id: string,
  name?: string,
  iconBuffer?: Buffer
): Promise<CategoryData> {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Category not found');

  const updateData: Record<string, unknown> = {};

  if (name) {
    updateData.name = name;
    updateData.slug = slugify(name);

    const slugConflict = await prisma.category.findFirst({
      where: { slug: updateData.slug as string, id: { not: id } },
    });
    if (slugConflict) {
      throw new ConflictError('A category with this name already exists');
    }
  }

  if (iconBuffer) {
    if (existing.iconUrl) {
      const publicId = existing.iconUrl.split('/').slice(-2).join('/').split('.')[0];
      await deleteFromCloudinary(publicId);
    }
    const result = await uploadToCloudinary(iconBuffer, 'categories');
    updateData.iconUrl = result.url;
  }

  const category = await prisma.category.update({
    where: { id },
    data: updateData,
    include: { _count: { select: { products: { where: { isDeleted: false } } } } },
  });

  return category as CategoryData;
}

export async function deleteCategory(
  id: string,
  reassignCategoryId?: string
): Promise<void> {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: { where: { isDeleted: false } } } } },
  });

  if (!category) throw new NotFoundError('Category not found');

  const productCount = (category as CategoryData)._count?.products ?? 0;
  if (productCount > 0) {
    if (!reassignCategoryId) {
      throw new BadRequestError(
        `This category has ${productCount} product(s). Please specify a category to reassign them to.`
      );
    }

    const targetCategory = await prisma.category.findUnique({ where: { id: reassignCategoryId } });
    if (!targetCategory) throw new BadRequestError('Target category for reassignment not found');
    if (targetCategory.id === id) throw new BadRequestError('Cannot reassign products to the same category');

    await prisma.product.updateMany({
      where: { categoryId: id },
      data: { categoryId: reassignCategoryId },
    });
  }

  await prisma.category.delete({ where: { id } });
}
