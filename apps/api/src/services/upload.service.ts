import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';
import { logger } from '../shared/logger';

export class UploadService {
  private hasCloudinary = false;
  private localUploadDir = path.resolve(process.cwd(), 'uploads');

  constructor() {
    if (env.CLOUDINARY_URL && env.CLOUDINARY_URL.trim() !== '') {
      cloudinary.config({
        cloudinary_url: env.CLOUDINARY_URL,
      });
      this.hasCloudinary = true;
      logger.info('[UploadService] Configured with production Cloudinary storage via CLOUDINARY_URL');
    } else if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
      cloudinary.config({
        cloud_name: env.CLOUDINARY_CLOUD_NAME,
        api_key: env.CLOUDINARY_API_KEY,
        api_secret: env.CLOUDINARY_API_SECRET,
      });
      this.hasCloudinary = true;
      logger.info('[UploadService] Configured with production Cloudinary storage via API credentials');
    } else {
      if (!fs.existsSync(this.localUploadDir)) {
        fs.mkdirSync(this.localUploadDir, { recursive: true });
      }
      logger.info(`[UploadService] Cloudinary keys not found. Using local disk fallback at ${this.localUploadDir}`);
    }
  }

  private saveToLocalDisk(fileBuffer: Buffer, filename: string, ext: string, size: number) {
    if (!fs.existsSync(this.localUploadDir)) {
      fs.mkdirSync(this.localUploadDir, { recursive: true });
    }
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

  async uploadFile(fileBuffer: Buffer, filename: string, mimeType: string): Promise<{ url: string; filename: string; size: number; format: string }> {
    const ext = path.extname(filename).replace('.', '') || 'bin';
    const size = fileBuffer.length;

    if (this.hasCloudinary) {
      try {
        const result = await new Promise<{ url: string; filename: string; size: number; format: string }>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'instos-tickets',
              resource_type: 'auto',
            },
            (error, result) => {
              if (error || !result) {
                logger.warn(`[UploadService] Cloudinary upload rejected (${error?.message}). Falling back to local storage.`);
                return reject(error || new Error('Upload rejected'));
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

        logger.info(`[UploadService] File uploaded successfully to Cloudinary: ${result.url}`);
        return result;
      } catch {
        logger.warn(`[UploadService] Falling back to local disk storage for ${filename}`);
      }
    }

    // Local Disk Fallback
    return this.saveToLocalDisk(fileBuffer, filename, ext, size);
  }
}

export const uploadService = new UploadService();
