/**
 * One-time migration: Cloudinary about-page images → DO Spaces
 * Run: npx ts-node backend/scripts/migrateAboutToSpaces.ts
 *
 * About images are stored as SiteSetting key/value pairs:
 *   about_founder_image        → CDN URL
 *   about_founder_image_public_id → object key (updated to Spaces key after migration)
 *   about_member1_image        → CDN URL
 *   about_member1_image_public_id
 *   about_member2_image        → CDN URL
 *   about_member2_image_public_id
 *
 * Safe: never deletes from Cloudinary.
 */
import 'dotenv/config';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { uploadToSpaces } from '../src/utils/spaces';

const prisma = new PrismaClient();

const ABOUT_IMAGE_KEYS = [
  'about_founder_image',
  'about_member1_image',
  'about_member2_image',
];

async function migrateAboutToSpaces(): Promise<void> {
  // Load all relevant settings at once
  const settings = await prisma.siteSetting.findMany({
    where: {
      key: {
        in: [
          ...ABOUT_IMAGE_KEYS,
          ...ABOUT_IMAGE_KEYS.map((k) => `${k}_public_id`),
        ],
      },
    },
  });

  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  const toMigrate = ABOUT_IMAGE_KEYS.filter(
    (k) => map[k] && map[k].includes('cloudinary')
  );

  console.log(`Found ${toMigrate.length} about image(s) to migrate.`);

  for (const key of toMigrate) {
    const url = map[key];

    try {
      const response = await axios.get<ArrayBuffer>(url, {
        responseType: 'arraybuffer',
      });

      const buffer = Buffer.from(response.data);
      const contentTypeHeader = response.headers['content-type'];
      const mimeType = typeof contentTypeHeader === 'string' ? contentTypeHeader : 'image/*';

      const uploaded = await uploadToSpaces(buffer, mimeType, 'hetmarketing/about');

      // Update both the image URL and the stored public_id key (now a Spaces key)
      await prisma.siteSetting.upsert({
        where: { key },
        update: { value: uploaded.url },
        create: { key, value: uploaded.url },
      });

      await prisma.siteSetting.upsert({
        where: { key: `${key}_public_id` },
        update: { value: uploaded.cdnPublicId },
        create: { key: `${key}_public_id`, value: uploaded.cdnPublicId },
      });

      console.log(`✅ migrated ${key}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ failed ${key} - ${message}`);
    }
  }

  console.log('About image migration complete.');
}

migrateAboutToSpaces()
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Migration aborted: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
