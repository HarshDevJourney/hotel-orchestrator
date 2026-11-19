import type Redis from 'ioredis';
import type { HealthStatus } from '../../domain/models';
import type { IHealthIndicator } from '../../ports';

/** Redis PING. Critical: the service cannot serve searches without it. Never throws. */
export class RedisHealthIndicator implements IHealthIndicator {
  readonly name = 'redis';
  readonly critical = true;

  constructor(private readonly redis: Redis) {}

  async check(): Promise<HealthStatus> {
    const startedAt = Date.now();
    try {
      await this.redis.ping();
      return { status: 'up', latencyMs: Date.now() - startedAt };
    } catch (error) {
      return { status: 'down', latencyMs: Date.now() - startedAt, error: (error as Error).message };
    }
  }
}
