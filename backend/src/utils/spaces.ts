import { randomUUID } from 'node:crypto';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import sharp from 'sharp';

const spacesKey = process.env.DO_SPACES_KEY;
const spacesSecret = process.env.DO_SPACES_SECRET;
const spacesBucket = process.env.DO_SPACES_BUCKET ?? 'jadeja-video';
const spacesRegion = process.env.DO_SPACES_REGION ?? 'sgp1';

if (!spacesKey || !spacesSecret) {
  throw new Error('Missing required DigitalOcean Spaces credentials: DO_SPACES_KEY and DO_SPACES_SECRET');
}

const spacesClient = new S3Client({
  region: spacesRegion,
  endpoint: `https://${spacesRegion}.digitaloceanspaces.com`,
  credentials: {
    accessKeyId: spacesKey,
    secretAccessKey: spacesSecret,
  },
});

export interface SpacesUploadResult {
  url: string;
  cdnPublicId: string;
}

export async function uploadToSpaces(
  buffer: Buffer,
  _mimeType: string,
  folder = 'hetmarketing/products'
): Promise<SpacesUploadResult> {
  const key = `${folder}/${randomUUID()}.webp`;
  const webpBuffer = await sharp(buffer).webp({ quality: 80 }).toBuffer();

  await spacesClient.send(
    new PutObjectCommand({
      Bucket: spacesBucket,
      Key: key,
      Body: webpBuffer,
      ACL: 'public-read',
      ContentType: 'image/webp',
    })
  );

  return {
    url: `https://${spacesBucket}.${spacesRegion}.cdn.digitaloceanspaces.com/${key}`,
    cdnPublicId: key,
  };
}

export async function deleteFromSpaces(cdnPublicId: string): Promise<void> {
  try {
    await spacesClient.send(
      new DeleteObjectCommand({
        Bucket: spacesBucket,
        Key: cdnPublicId,
      })
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Spaces delete failed for key ${cdnPublicId}: ${message}`);
  }
}
