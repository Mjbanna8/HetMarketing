/**
 * One-time migration: Cloudinary category icons → DO Spaces
 * Run: npx ts-node backend/scripts/migrateCategoriesToSpaces.ts
 *
 * Safe: never deletes from Cloudinary.
 */
import 'dotenv/config';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { uploadToSpaces } from '../src/utils/spaces';

const prisma = new PrismaClient();

async function migrateCategoriesToSpaces(): Promise<void> {
  const categories = await prisma.category.findMany({
    where: {
      iconUrl: { contains: 'cloudinary' },
    },
    select: { id: true, name: true, iconUrl: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Found ${categories.length} category icon(s) to migrate.`);

  for (const cat of categories) {
    if (!cat.iconUrl) continue;

    try {
      const response = await axios.get<ArrayBuffer>(cat.iconUrl, {
        responseType: 'arraybuffer',
      });

      const buffer = Buffer.from(response.data);
      const contentTypeHeader = response.headers['content-type'];
      const mimeType = typeof contentTypeHeader === 'string' ? contentTypeHeader : 'image/*';

      const uploaded = await uploadToSpaces(buffer, mimeType, 'hetmarketing/categories');

      await prisma.category.update({
        where: { id: cat.id },
        data: { iconUrl: uploaded.url },
      });

      console.log(`✅ migrated category "${cat.name}" (${cat.id})`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ failed category "${cat.name}" (${cat.id}) - ${message}`);
    }
  }

  console.log('Category icon migration complete.');
}

migrateCategoriesToSpaces()
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Migration aborted: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
