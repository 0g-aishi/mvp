/**
 * Logger Types & Enums
 * Production-safe logging system for 0G Dreamscape
 */

/**
 * Log levels in order of severity
 * Lower numeric value = higher severity
 */
export enum LogLevel {
  ERROR = 0,  // Critical errors that need immediate attention
  WARN = 1,   // Warning conditions that should be investigated
  INFO = 2,   // Important informational messages
  DEBUG = 3,  // Detailed debugging information
  TRACE = 4,  // Very detailed tracing (e.g., animation frames)
}

/**
 * Log level names for string-based configuration
 */
export type LogLevelName = 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'production' | 'development';

/**
 * Logger configuration
 */
export interface LoggerConfig {
  /** Current log level - messages below this level will be ignored */
  level: LogLevel;

  /** Environment mode */
  environment: 'production' | 'development';

  /** Debug mode flag - only works in development */
  debugEnabled: boolean;

  /** Enable console output */
  enableConsole: boolean;

  /** Include timestamp in logs */
  includeTimestamp: boolean;

  /** Global prefix for all logs (e.g., '[aishi]') */
  globalPrefix: string;

  /** Enable sensitive data redaction */
  enableRedaction: boolean;
}

/**
 * Log entry metadata
 */
export interface LogMeta {
  /** Component or module name */
  component?: string;

  /** Additional structured data */
  [key: string]: any;
}

/**
 * Logger instance interface
 */
export interface Logger {
  /** Log error message */
  error(message: string, meta?: LogMeta): void;

  /** Log warning message */
  warn(message: string, meta?: LogMeta): void;

  /** Log info message */
  info(message: string, meta?: LogMeta): void;

  /** Log debug message */
  debug(message: string, meta?: LogMeta): void;

  /** Log trace message */
  trace(message: string, meta?: LogMeta): void;

  /** Create child logger with additional context */
  child(meta: LogMeta): Logger;

  /** Get current configuration */
  getConfig(): Readonly<LoggerConfig>;
}

/**
 * Console method mapping
 */
export type ConsoleMethod = 'error' | 'warn' | 'log';
