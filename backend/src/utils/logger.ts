import pino from 'pino';
import { config } from '../config';

export const logger = pino({ level: config.logLevel, base: undefined, timestamp: pino.stdTimeFunctions.isoTime });

export const createLogger = (component: string) => logger.child({ component });
