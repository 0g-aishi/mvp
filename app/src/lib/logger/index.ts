/**
 * Production Logger
 *
 * Secure, structured logging for 0G Dreamscape application
 *
 * @example
 * ```typescript
 * import { logger } from '@/lib/logger';
 *
 * // Simple logging
 * logger.error('Upload failed', { error: e.message });
 * logger.warn('Slow network detected');
 * logger.info('Processing dream');
 * logger.debug('State transition', { from: 'idle', to: 'processing' });
 *
 * // Component-scoped logging
 * const log = logger.child({ component: 'Upload0G' });
 * log.debug('Starting upload');
 * log.info('Upload complete', { rootHash, size: fileSize });
 * ```
 *
 * @module logger
 */

export { logger, createLogger } from './logger';
export type { Logger, LoggerConfig, LogMeta, LogLevel } from './types';
