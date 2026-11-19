import { NativeConnection, Worker } from '@temporalio/worker';
import { HttpSupplierGateway } from '../adapters/suppliers/HttpSupplierGateway';
import { CheapestOfferSelector } from '../adapters/pricing/CheapestOfferSelector';
import { createRedisClient } from '../adapters/redis/createRedisClient';
import { RedisHotelRepository } from '../adapters/redis/RedisHotelRepository';
import { config } from '../config';
import { HotelActivities } from '../temporal/HotelActivities';
import { createLogger } from '../utils/logger';
import { retry } from '../utils/retry';

const log = createLogger('worker');

/** Composition root of the worker process. Add a supplier by adding its id to SUPPLIERS. */
async function main(): Promise<void> {
  const redis = createRedisClient(config.redisUrl);
  const repository = new RedisHotelRepository(redis, config.cacheTtlSeconds);

  const activities = new HotelActivities({
    gateways: config.suppliers.ids.map((id) => new HttpSupplierGateway(id, config.suppliers.baseUrl, config.suppliers.timeoutMs)),
    selector: new CheapestOfferSelector(),
    writer: repository, // as IHotelWriter
    priceQuery: repository, // as IHotelPriceQuery
  });

  const connection = await retry(() => NativeConnection.connect({ address: config.temporal.address }), {
    attempts: 30,
    delayMs: 2000,
    onRetry: (_error, attempt) => log.warn({ attempt, address: config.temporal.address }, 'Waiting for Temporal...'),
  });

  const worker = await Worker.create({
    connection,
    namespace: config.temporal.namespace,
    taskQueue: config.temporal.taskQueue,
    workflowsPath: require.resolve('../temporal/workflows'),
    activities: activities.registry(),
  });

  const shutdown = () => {
    log.info('Shutting down worker');
    worker.shutdown();
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);

  log.info({ taskQueue: config.temporal.taskQueue, suppliers: config.suppliers.ids }, 'Worker started');
  await worker.run();
  await connection.close();
  redis.disconnect();
}

main().catch((error) => {
  log.fatal({ err: error }, 'Worker crashed');
  process.exit(1);
});
