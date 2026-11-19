import { WorkflowFailedError, type Client } from '@temporalio/client';
import { ApplicationFailure } from '@temporalio/common';
import { randomUUID } from 'node:crypto';
import type { HotelOffer, HotelSearchInput } from '../domain/models';
import type { IHotelSearchService } from '../ports';
import { ALL_SUPPLIERS_UNAVAILABLE, HOTEL_WORKFLOW_NAME } from '../temporal/names';
import type { hotelOfferWorkflow } from '../temporal/workflows';
import { AppError } from '../utils/errors';
import { createLogger } from '../utils/logger';

const log = createLogger('temporal-search-service');

export interface TemporalSearchOptions {
  taskQueue: string;
  timeout: string;
}

/** IHotelSearchService backed by a Temporal workflow. Translates workflow failures into AppError. */
export class TemporalSearchService implements IHotelSearchService {
  constructor(
    private readonly client: Client,
    private readonly options: TemporalSearchOptions,
  ) {}

  async search(input: HotelSearchInput): Promise<HotelOffer[]> {
    const workflowId = `hotels-${input.city}-${randomUUID()}`;
    try {
      return await this.client.workflow.execute<typeof hotelOfferWorkflow>(HOTEL_WORKFLOW_NAME, {
        taskQueue: this.options.taskQueue,
        workflowId,
        args: [input],
        workflowExecutionTimeout: this.options.timeout as '30 seconds',
      });
    } catch (error) {
      log.error({ workflowId, err: error }, 'Hotel workflow failed');
      throw this.toAppError(error);
    }
  }

  private toAppError(error: unknown): AppError {
    if (
      error instanceof WorkflowFailedError &&
      error.cause instanceof ApplicationFailure &&
      error.cause.type === ALL_SUPPLIERS_UNAVAILABLE
    ) {
      return new AppError(502, 'SUPPLIERS_UNAVAILABLE', 'All hotel suppliers are currently unavailable');
    }
    return new AppError(500, 'WORKFLOW_FAILED', 'Failed to process hotel search');
  }
}
