import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

declare global {
  // Prevent multiple instances during hot-reload in development
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const createPrismaClient = (): PrismaClient => {
  return new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

export const prisma: PrismaClient =
  process.env.NODE_ENV === 'production'
    ? createPrismaClient()
    : (global.__prisma ?? (global.__prisma = createPrismaClient()));

// Log slow queries in development
if (process.env.NODE_ENV !== 'production') {
  (prisma as any).$on('query', (e: { query: string; duration: number }) => {
    if (e.duration > 1000) {
      logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
    }
  });
}

(prisma as any).$on('error', (e: { message: string }) => {
  logger.error('Prisma error', { message: e.message });
});
