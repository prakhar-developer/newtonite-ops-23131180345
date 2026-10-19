import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Normalize process.env: Treat empty strings as undefined so defaults apply cleanly!
const normalizedEnv: Record<string, any> = {};
for (const [key, value] of Object.entries(process.env)) {
  normalizedEnv[key] = typeof value === 'string' && value.trim() === '' ? undefined : value;
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  API_PREFIX: z.string().default('/api/v1'),
  LOG_LEVEL: z.string().default('info'),
  DATABASE_URL: z.string().min(1).default('postgresql://postgres:postgres@localhost:5432/instos?schema=public'),
  DATABASE_TEST_URL: z.string().min(1).optional(),
  JWT_SECRET: z.string().min(16).default('instos-dev-super-secret-jwt-key-min-32-chars-long'),
  JWT_EXPIRES_IN: z.string().default('12h'),
  CORS_ORIGIN: z.string().default('*'),
  
  // Frontend URL for email tracking links
  FRONTEND_URL: z.string().default('http://localhost:5173'),

  // Resend Free Tier
  RESEND_API_KEY: z.string().optional().default(''),
  RESEND_FROM_EMAIL: z.string().default('instOS Support <support@inistnt.in>'),
  
  // Cloudinary Free Tier (Supports CLOUDINARY_URL or separate credentials)
  CLOUDINARY_URL: z.string().optional().default(''),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),
  
  // Redis Free Tier (Upstash, Railway, or local container)
  REDIS_URL: z.string().optional().default(''),

  // Outbox & SLA Intervals
  OUTBOX_POLL_INTERVAL_MS: z.coerce.number().default(1500),
  OUTBOX_MAX_ATTEMPTS: z.coerce.number().default(5),
  OUTBOX_STALE_THRESHOLD_MS: z.coerce.number().default(300000),
  SLA_POLL_INTERVAL_MS: z.coerce.number().default(10000),
});

export const env = envSchema.parse(normalizedEnv);
