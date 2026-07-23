/**
 * Logger Configuration
 * Environment-based logger setup with production safety
 */

import { LogLevel, LoggerConfig, LogLevelName } from './types';

/**
 * Parse log level from string
 */
function parseLogLevel(level: string | undefined): LogLevel {
  const normalized = (level || 'production').toLowerCase();

  switch (normalized) {
    case 'error':
      return LogLevel.ERROR;
    case 'warn':
      return LogLevel.WARN;
    case 'info':
      return LogLevel.INFO;
    case 'debug':
      return LogLevel.DEBUG;
    case 'trace':
      return LogLevel.TRACE;
    case 'development':
      return LogLevel.DEBUG; // Development defaults to DEBUG
    case 'production':
    default:
      return LogLevel.WARN; // Production defaults to WARN (error + warn only)
  }
}

/**
 * Check if we're in production environment
 */
function isProduction(): boolean {
  // Next.js sets NODE_ENV
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
    return true;
  }

  // Check NEXT_PUBLIC_LOGGER_LEVEL
  if (typeof process !== 'undefined') {
    const loggerLevel = process.env.NEXT_PUBLIC_LOGGER_LEVEL?.toLowerCase();
    if (loggerLevel === 'production') {
      return true;
    }
  }

  return false;
}

/**
 * Check if debug mode is enabled
 * SECURITY: Debug mode only works in development environment
 */
function isDebugEnabled(): boolean {
  // In production, ALWAYS return false (security first!)
  if (isProduction()) {
    return false;
  }

  // In development, check the debug flag
  if (typeof process !== 'undefined') {
    const debugFlag = process.env.NEXT_PUBLIC_LOGGER_DEBUG;
    return debugFlag === 'true' || debugFlag === '1';
  }

  return false;
}

/**
 * Get effective log level based on environment and flags
 *
 * Logic:
 * - PRODUCTION: Always ERROR/WARN only, regardless of debug flag
 * - DEVELOPMENT + DEBUG=false: ERROR/WARN only
 * - DEVELOPMENT + DEBUG=true: All levels (ERROR/WARN/INFO/DEBUG/TRACE)
 */
function getEffectiveLogLevel(): LogLevel {
  const isProd = isProduction();
  const debugEnabled = isDebugEnabled();

  if (isProd) {
    // Production: Only error and warn
    return LogLevel.WARN;
  }

  if (!debugEnabled) {
    // Development but debug disabled: Only error and warn
    return LogLevel.WARN;
  }

  // Development with debug enabled: Use configured level or default to DEBUG
  const configuredLevel = typeof process !== 'undefined'
    ? process.env.NEXT_PUBLIC_LOGGER_LEVEL
    : undefined;

  return parseLogLevel(configuredLevel);
}

/**
 * Create logger configuration from environment
 */
export function createConfig(): LoggerConfig {
  const isProd = isProduction();
  const debugEnabled = isDebugEnabled();

  return {
    level: getEffectiveLogLevel(),
    environment: isProd ? 'production' : 'development',
    debugEnabled,
    enableConsole: true, // Always enable console (we filter by level)
    includeTimestamp: !isProd, // Timestamps in development only
    globalPrefix: 'aishi',
    enableRedaction: isProd, // Redact sensitive data in production
  };
}

/**
 * Default logger configuration
 */
export const defaultConfig: LoggerConfig = createConfig();
