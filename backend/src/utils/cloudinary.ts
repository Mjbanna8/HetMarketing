import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({ secure: true });

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

export function uploadToCloudinary(
  buffer: Buffer,
  folder = 'products'
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', format: 'webp', quality: 'auto' },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error('Upload failed'));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export async function uploadMultipleToCloudinary(
  buffers: Buffer[],
  folder = 'products'
): Promise<CloudinaryUploadResult[]> {
  const results = await Promise.all(
    buffers.map((buffer) => uploadToCloudinary(buffer, folder))
  );
  return results;
}

export { cloudinary };
