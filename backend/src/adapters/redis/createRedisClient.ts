import Redis from 'ioredis';
import { createLogger } from '../../utils/logger';

const log = createLogger('redis');

export function createRedisClient(url: string): Redis {
  const client = new Redis(url, { maxRetriesPerRequest: 3 });
  client.on('error', (error) => log.error({ err: error }, 'Redis error'));
  client.on('connect', () => log.info('Redis connected'));
  return client;
}
