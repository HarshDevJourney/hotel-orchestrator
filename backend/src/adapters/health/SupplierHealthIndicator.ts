import type { HealthStatus, SupplierId } from '../../domain/models';
import type { IHealthIndicator } from '../../ports';

/** Pings `GET {baseUrl}/supplier{id}/health`. Never throws. */
export class SupplierHealthIndicator implements IHealthIndicator {
  readonly name: string;
  readonly critical = false;

  constructor(
    private readonly supplierId: SupplierId,
    private readonly baseUrl: string,
    private readonly timeoutMs: number,
  ) {
    this.name = `supplier${supplierId}`;
  }

  async check(): Promise<HealthStatus> {
    const startedAt = Date.now();
    try {
      const response = await fetch(`${this.baseUrl}/supplier${this.supplierId}/health`, {
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      const latencyMs = Date.now() - startedAt;
      return response.ok ? { status: 'up', latencyMs } : { status: 'down', latencyMs, error: `HTTP ${response.status}` };
    } catch (error) {
      return { status: 'down', latencyMs: Date.now() - startedAt, error: (error as Error).message };
    }
  }
}
