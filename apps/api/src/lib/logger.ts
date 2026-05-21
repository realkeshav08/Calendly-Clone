import pino from 'pino';
import { isProduction } from '../config/env';

/**
 * Structured logger. In development we pretty-print for readability; in production
 * we emit raw JSON lines so the host's log aggregator can parse them.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProduction ? 'info' : 'debug'),
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
      },
});
