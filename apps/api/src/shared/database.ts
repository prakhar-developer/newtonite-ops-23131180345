import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    datasources: {
      db: {
        url: env.NODE_ENV === 'test' && env.DATABASE_TEST_URL ? env.DATABASE_TEST_URL : env.DATABASE_URL,
      },
    },
    log: env.LOG_LEVEL === 'debug' ? ['query', 'error', 'warn'] : ['error', 'warn'],
  });

if (env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}
