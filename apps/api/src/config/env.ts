import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  API_PREFIX: z.string().default('/api/v1'),
  LOG_LEVEL: z.string().default('info'),
  DATABASE_URL: z.string().url().default('postgresql://postgres:postgres@localhost:5432/instos?schema=public'),
  DATABASE_TEST_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(16).default('instos-dev-super-secret-jwt-key-min-32-chars-long'),
  JWT_EXPIRES_IN: z.string().default('12h'),
  CORS_ORIGIN: z.string().default('http://localhost:5173,http://127.0.0.1:5173'),
  
  // Resend Free Tier
  RESEND_API_KEY: z.string().optional().default(''),
  RESEND_FROM_EMAIL: z.string().default('instOS Support <onboarding@resend.dev>'),
  
  // Cloudinary Free Tier
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),
  
  // Redis Free Tier
  REDIS_URL: z.string().optional().default(''),

  // Outbox & SLA Intervals
  OUTBOX_POLL_INTERVAL_MS: z.coerce.number().default(1500),
  OUTBOX_MAX_ATTEMPTS: z.coerce.number().default(5),
  OUTBOX_STALE_THRESHOLD_MS: z.coerce.number().default(300000),
  SLA_POLL_INTERVAL_MS: z.coerce.number().default(10000),
});

export const env = envSchema.parse(process.env);
