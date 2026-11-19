import type { Request, Response } from 'express';
import type { HealthService } from '../../application/HealthService';

export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /** 200 for ok/degraded, 503 for down. */
  readonly getHealth = async (_req: Request, res: Response): Promise<void> => {
    const report = await this.healthService.check();
    res.status(report.status === 'down' ? 503 : 200).json(report);
  };
}
