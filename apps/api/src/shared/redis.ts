import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from './logger';

class RedisManager {
  private client: Redis | null = null;
  private isConnected = false;

  constructor() {
    if (env.REDIS_URL && env.REDIS_URL.trim() !== '') {
      try {
        this.client = new Redis(env.REDIS_URL, {
          maxRetriesPerRequest: 1,
          enableReadyCheck: true,
          lazyConnect: true,
          retryStrategy(times) {
            // Reconnect backoff up to 5 seconds
            return Math.min(times * 500, 5000);
          },
        });

        this.client.on('connect', () => {
          this.isConnected = true;
          logger.info('[Redis] Successfully connected to Redis instance');
        });

        this.client.on('error', (err) => {
          this.isConnected = false;
          logger.warn(`[Redis] Connection warning: ${err.message}`);
        });

        this.client.connect().catch((err) => {
          logger.warn(`[Redis] Initial connection attempt skipped: ${err.message}`);
        });
      } catch (err) {
        logger.warn(`[Redis] Initialization skipped: ${(err as Error).message}`);
      }
    } else {
      logger.info('[Redis] REDIS_URL not configured. Operating in in-memory fallback mode');
    }
  }

  get isAvailable(): boolean {
    return this.isConnected && this.client !== null;
  }

  getClient(): Redis | null {
    return this.client;
  }

  /**
   * Sliding window / token bucket rate limiter with in-memory fallback
   */
  async checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number }> {
    const fullKey = `ratelimit:${key}`;

    if (this.isAvailable && this.client) {
      try {
        const count = await this.client.incr(fullKey);
        if (count === 1) {
          await this.client.expire(fullKey, windowSeconds);
        }
        return {
          allowed: count <= limit,
          remaining: Math.max(0, limit - count),
        };
      } catch (err) {
        logger.warn(`[Redis] Rate limit query error: ${(err as Error).message}. Falling back to allow.`);
        return { allowed: true, remaining: limit };
      }
    }

    // In-memory rate limiting fallback
    return inMemoryRateLimiter.check(fullKey, limit, windowSeconds);
  }
}

// Simple sliding window in-memory fallback
class InMemoryRateLimiter {
  private hits = new Map<string, { count: number; resetAt: number }>();

  check(key: string, limit: number, windowSeconds: number): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const entry = this.hits.get(key);

    if (!entry || entry.resetAt < now) {
      this.hits.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
      return { allowed: true, remaining: limit - 1 };
    }

    entry.count += 1;
    return {
      allowed: entry.count <= limit,
      remaining: Math.max(0, limit - entry.count),
    };
  }
}

const inMemoryRateLimiter = new InMemoryRateLimiter();
export const redisManager = new RedisManager();
