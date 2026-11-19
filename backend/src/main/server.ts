import { HealthService } from '../application/HealthService';
import { TemporalSearchService } from '../application/TemporalSearchService';
import { RedisHealthIndicator } from '../adapters/health/RedisHealthIndicator';
import { SupplierHealthIndicator } from '../adapters/health/SupplierHealthIndicator';
import { createRedisClient } from '../adapters/redis/createRedisClient';
import { config } from '../config';
import { createApp } from '../http/app';
import { HealthController } from '../http/controllers/HealthController';
import { HotelController } from '../http/controllers/HotelController';
import type { IHealthIndicator } from '../ports';
import { createTemporalClient } from '../temporal/createTemporalClient';
import { createLogger } from '../utils/logger';

const log = createLogger('server');

/** Composition root of the API process: the only place where concrete classes are wired together. */
async function main(): Promise<void> {
  const redis = createRedisClient(config.redisUrl);

  const searchService = new TemporalSearchService(await createTemporalClient(), {
    taskQueue: config.temporal.taskQueue,
    timeout: config.temporal.workflowTimeout,
  });

  const indicators: IHealthIndicator[] = [
    ...config.suppliers.ids.map((id) => new SupplierHealthIndicator(id, config.suppliers.baseUrl, config.suppliers.timeoutMs)),
    new RedisHealthIndicator(redis),
  ];

  const app = createApp({
    hotelController: new HotelController(searchService),
    healthController: new HealthController(new HealthService(indicators)),
  });

  const server = app.listen(config.port, () => log.info({ port: config.port }, 'API listening'));

  const shutdown = () => {
    log.info('Shutting down API');
    server.close(() => {
      redis.disconnect();
      process.exit(0);
    });
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

main().catch((error) => {
  log.fatal({ err: error }, 'API crashed');
  process.exit(1);
});
