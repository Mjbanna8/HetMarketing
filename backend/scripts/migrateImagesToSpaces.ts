import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { uploadToSpaces } from '../src/utils/spaces';

const prisma = new PrismaClient();

async function migrateImagesToSpaces(): Promise<void> {
  const images = await prisma.productImage.findMany({
    where: {
      url: {
        contains: 'cloudinary',
      },
    },
    select: {
      id: true,
      url: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  console.log(`Found ${images.length} Cloudinary images to migrate.`);

  for (const image of images) {
    try {
      const response = await axios.get<ArrayBuffer>(image.url, {
        responseType: 'arraybuffer',
      });

      const buffer = Buffer.from(response.data);
      const contentTypeHeader = response.headers['content-type'];
      const mimeType = typeof contentTypeHeader === 'string' ? contentTypeHeader : 'image/*';

      const uploaded = await uploadToSpaces(buffer, mimeType);

      await prisma.productImage.update({
        where: { id: image.id },
        data: {
          url: uploaded.url,
          cdnPublicId: uploaded.cdnPublicId,
        },
      });

      console.log(`✅ migrated ${image.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ failed ${image.id} - ${message}`);
    }
  }
}

migrateImagesToSpaces()
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Migration aborted: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
