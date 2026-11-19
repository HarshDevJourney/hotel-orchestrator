const bool = (value: string | undefined): boolean => value === 'true' || value === '1';
const int = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const supplierIds = (process.env.SUPPLIERS ?? 'A,B')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);

export const config = {
  port: int(process.env.PORT, 3000),
  logLevel: process.env.LOG_LEVEL ?? 'info',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  cacheTtlSeconds: int(process.env.CACHE_TTL_SECONDS, 300),
  temporal: {
    address: process.env.TEMPORAL_ADDRESS ?? 'localhost:7233',
    namespace: process.env.TEMPORAL_NAMESPACE ?? 'default',
    taskQueue: process.env.TEMPORAL_TASK_QUEUE ?? 'hotel-offers',
    workflowTimeout: '30 seconds',
  },
  suppliers: {
    ids: supplierIds,
    baseUrl: process.env.SUPPLIER_BASE_URL ?? 'http://localhost:3000',
    timeoutMs: int(process.env.SUPPLIER_TIMEOUT_MS, 3000),
    initiallyDown: Object.fromEntries(supplierIds.map((id) => [id, bool(process.env[`SUPPLIER_${id}_DOWN`])])) as Record<
      string,
      boolean
    >,
  },
} as const;
