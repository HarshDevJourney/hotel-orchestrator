import { setTimeout as sleep } from 'node:timers/promises';

interface RetryOptions {
  attempts: number;
  delayMs: number;
  onRetry?: (error: unknown, attempt: number) => void;
}

/** Retries an async operation with a fixed delay. Used for start-up connections. */
export async function retry<T>(operation: () => Promise<T>, { attempts, delayMs, onRetry }: RetryOptions): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        onRetry?.(error, attempt);
        await sleep(delayMs);
      }
    }
  }
  throw lastError;
}
