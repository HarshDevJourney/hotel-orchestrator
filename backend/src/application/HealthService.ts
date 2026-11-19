import type { HealthReport, HealthStatus, OverallStatus } from '../domain/models';
import type { IHealthIndicator } from '../ports';

interface IndicatorResult {
  indicator: IHealthIndicator;
  result: HealthStatus;
}

/** Aggregates any number of IHealthIndicator instances. Adding a check never requires editing this class. */
export class HealthService {
  constructor(private readonly indicators: IHealthIndicator[]) {}

  async check(): Promise<HealthReport> {
    const results = await Promise.all(this.indicators.map((indicator) => this.run(indicator)));
    return {
      status: this.aggregate(results),
      timestamp: new Date().toISOString(),
      dependencies: Object.fromEntries(results.map(({ indicator, result }) => [indicator.name, result])),
    };
  }

  /** Defensive: indicators must not throw, but a misbehaving one must not break the endpoint. */
  private async run(indicator: IHealthIndicator): Promise<IndicatorResult> {
    try {
      return { indicator, result: await indicator.check() };
    } catch (error) {
      return { indicator, result: { status: 'down', latencyMs: 0, error: (error as Error).message } };
    }
  }

  /**
   * down     - a critical indicator is down, or every non-critical indicator is down
   * degraded - at least one indicator is down
   * ok       - everything is up
   */
  private aggregate(results: IndicatorResult[]): OverallStatus {
    const isDown = ({ result }: IndicatorResult) => result.status === 'down';
    const nonCritical = results.filter(({ indicator }) => !indicator.critical);

    if (results.some((entry) => entry.indicator.critical && isDown(entry))) return 'down';
    if (nonCritical.length > 0 && nonCritical.every(isDown)) return 'down';
    return results.some(isDown) ? 'degraded' : 'ok';
  }
}
