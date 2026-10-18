import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';
import { logger } from '../shared/logger';

export class UploadService {
  private hasCloudinary = false;
  private localUploadDir = path.resolve(process.cwd(), 'uploads');

  constructor() {
    if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
      cloudinary.config({
        cloud_name: env.CLOUDINARY_CLOUD_NAME,
        api_key: env.CLOUDINARY_API_KEY,
        api_secret: env.CLOUDINARY_API_SECRET,
      });
      this.hasCloudinary = true;
      logger.info('[UploadService] Configured with production Cloudinary storage');
    } else {
      if (!fs.existsSync(this.localUploadDir)) {
        fs.mkdirSync(this.localUploadDir, { recursive: true });
      }
      logger.info(`[UploadService] Cloudinary keys not found. Using local disk fallback at ${this.localUploadDir}`);
    }
  }

  async uploadFile(fileBuffer: Buffer, filename: string, mimeType: string): Promise<{ url: string; filename: string; size: number; format: string }> {
    const ext = path.extname(filename).replace('.', '') || 'bin';
    const size = fileBuffer.length;

    if (this.hasCloudinary) {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'instos-tickets',
            resource_type: 'auto',
          },
          (error, result) => {
            if (error || !result) {
              logger.error(`[UploadService] Cloudinary upload error: ${error?.message}`);
              return reject(error || new Error('Upload failed'));
            }
            resolve({
              url: result.secure_url,
              filename,
              size,
              format: result.format || ext,
            });
          }
        );
        uploadStream.end(fileBuffer);
      });
    }

    // Local Disk Fallback
    const uniqueName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const destination = path.join(this.localUploadDir, uniqueName);
    fs.writeFileSync(destination, fileBuffer);
    const localUrl = `/uploads/${uniqueName}`;

    return {
      url: localUrl,
      filename,
      size,
      format: ext,
    };
  }
}

export const uploadService = new UploadService();
