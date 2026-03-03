import Redis from 'ioredis';
import { logger } from './logger';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
const REDIS_PASSWORD = process.env.REDIS_PASSWORD ?? undefined;

const createRedisClient = (): Redis => {
  const client = new Redis(REDIS_URL, {
    password: REDIS_PASSWORD,
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) {
      if (times > 10) {
        logger.error('Redis retry limit reached, giving up');
        return null;
      }
      const delay = Math.min(times * 100, 3000);
      logger.warn(`Redis reconnecting in ${delay}ms (attempt ${times})`);
      return delay;
    },
    lazyConnect: false,
    enableReadyCheck: true,
    connectTimeout: 10_000,
  });

  client.on('connect', () => logger.info('Redis: connection established'));
  client.on('ready', () => logger.info('Redis: ready to accept commands'));
  client.on('error', (err: Error) => logger.error('Redis error', { message: err.message }));
  client.on('close', () => logger.warn('Redis: connection closed'));
  client.on('reconnecting', () => logger.warn('Redis: reconnecting...'));

  return client;
};

export const redis: Redis = createRedisClient();

/** Typed Redis helpers */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const raw = await redis.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw as unknown as T;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  await redis.setex(key, ttlSeconds, serialized);
}

export async function cacheDel(key: string): Promise<void> {
  await redis.del(key);
}
