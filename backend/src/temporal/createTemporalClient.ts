import { Client, Connection } from '@temporalio/client';
import { config } from '../config';
import { createLogger } from '../utils/logger';
import { retry } from '../utils/retry';

const log = createLogger('temporal-client');

export async function createTemporalClient(): Promise<Client> {
  const connection = await retry(() => Connection.connect({ address: config.temporal.address }), {
    attempts: 30,
    delayMs: 2000,
    onRetry: (_error, attempt) => log.warn({ attempt, address: config.temporal.address }, 'Waiting for Temporal...'),
  });
  return new Client({ connection, namespace: config.temporal.namespace });
}
