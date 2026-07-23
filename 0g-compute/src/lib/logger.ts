/**
 * Production Logger for 0G Compute Backend
 *
 * Winston-based structured logging with environment-aware configuration
 */

const winston: typeof import('winston') = require('winston');

/**
 * Get log level based on environment
 * - production: info (errors, warnings, important info only)
 * - development: debug (all logs including debug traces)
 */
function getLogLevel(): string {
  // Explicit LOG_LEVEL from env takes precedence
  if (process.env.LOG_LEVEL) {
    return process.env.LOG_LEVEL;
  }

  // Auto-detect based on NODE_ENV
  if (process.env.NODE_ENV === 'production') {
    return 'info';
  }

  // Development default: show debug logs
  return 'debug';
}

/**
 * Custom format for development (colorized, professional)
 */
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, service, ...meta }) => {
    // Format service tag
    const serviceTag = service ? `[${service}]` : '[aishi]';

    // Format metadata
    const metaString = Object.keys(meta).length > 0
      ? '\n  ' + JSON.stringify(meta, null, 2).split('\n').join('\n  ')
      : '';

    return `[${timestamp}]${serviceTag} ${level}: ${message}${metaString}`;
  })
);

/**
 * Custom format for production (JSON for log aggregation, no colors)
 */
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, service, ...meta }) => {
    const serviceTag = service ? `[${service}]` : '[aishi]';
    const metaString = Object.keys(meta).length > 0 ? ' ' + JSON.stringify(meta) : '';
    return `[${timestamp}]${serviceTag} [${level}]: ${message}${metaString}`;
  })
);

/**
 * Create Winston logger instance
 */
const logger = winston.createLogger({
  level: getLogLevel(),
  format: process.env.NODE_ENV === 'production'
    ? productionFormat
    : developmentFormat,
  defaultMeta: { service: '0g-compute' },
  transports: [
    new winston.transports.Console({
      stderrLevels: ['error']
    })
  ]
});

/**
 * Create child logger for specific service/component
 *
 * @example
 * const log = createLogger('AIService');
 * log.info('Model discovered', { model: 'gpt-4' });
 */
function createLogger(serviceName: string) {
  return logger.child({ service: serviceName });
}

module.exports = { createLogger, logger };
