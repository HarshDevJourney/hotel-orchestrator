import type { HealthStatus } from '../domain/models';

/**
 * Contract (LSP): `check()` NEVER throws; failures are reported as `status: 'down'`.
 * `critical` indicators (e.g. Redis) turn the overall status to "down" when they fail.
 */
export interface IHealthIndicator {
  readonly name: string;
  readonly critical: boolean;
  check(): Promise<HealthStatus>;
}
