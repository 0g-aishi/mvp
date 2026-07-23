/**
 * Core Logger Implementation
 * Production-safe, structured logging for 0G Dreamscape
 */

import { Logger, LoggerConfig, LogLevel, LogMeta, ConsoleMethod } from './types';
import { defaultConfig } from './config';

/**
 * Sensitive data patterns to redact
 */
const SENSITIVE_PATTERNS = [
  // Ethereum addresses (0x + 40 hex chars)
  /0x[a-fA-F0-9]{40}/g,
  // Private keys (0x + 64 hex chars)
  /0x[a-fA-F0-9]{64}/g,
  // Potential API keys (32+ alphanumeric)
  /[a-zA-Z0-9]{32,}/g,
];

/**
 * Redact sensitive data from string
 */
function redactSensitiveData(value: any): any {
  if (typeof value === 'string') {
    let redacted = value;

    // Redact Ethereum addresses (show first 6 + last 4)
    redacted = redacted.replace(/0x[a-fA-F0-9]{40}/g, (match) => {
      return `${match.slice(0, 6)}...${match.slice(-4)}`;
    });

    // Redact private keys completely
    redacted = redacted.replace(/0x[a-fA-F0-9]{64}/g, '[REDACTED_KEY]');

    return redacted;
  }

  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      return value.map(redactSensitiveData);
    }

    const redacted: any = {};
    for (const key in value) {
      // Redact fields that likely contain sensitive data
      if (['privateKey', 'secret', 'password', 'token', 'apiKey'].includes(key)) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = redactSensitiveData(value[key]);
      }
    }
    return redacted;
  }

  return value;
}

/**
 * Format timestamp for logs
 */
function formatTimestamp(): string {
  const now = new Date();
  return now.toISOString().split('T')[1].split('.')[0]; // HH:MM:SS
}

/**
 * Format log message with prefix and metadata
 */
function formatMessage(
  level: string,
  message: string,
  meta: LogMeta | undefined,
  config: LoggerConfig,
  componentContext?: string
): string {
  const parts: string[] = [];

  // Timestamp (development only)
  if (config.includeTimestamp) {
    parts.push(`[${formatTimestamp()}]`);
  }

  // Level prefix
  parts.push(`[${level}]`);

  // Global prefix
  if (config.globalPrefix) {
    parts.push(`[${config.globalPrefix}]`);
  }

  // Component context
  if (componentContext) {
    parts.push(`[${componentContext}]`);
  }

  // Message
  parts.push(message);

  return parts.join(' ');
}

/**
 * Format metadata for console output
 */
function formatMeta(meta: LogMeta | undefined, config: LoggerConfig): any[] {
  if (!meta || Object.keys(meta).length === 0) {
    return [];
  }

  // Remove component from meta (already in prefix)
  const { component, ...rest } = meta;

  if (Object.keys(rest).length === 0) {
    return [];
  }

  // Redact sensitive data if enabled
  const sanitized = config.enableRedaction ? redactSensitiveData(rest) : rest;

  return [sanitized];
}

/**
 * Get console method for log level
 */
function getConsoleMethod(level: LogLevel): ConsoleMethod {
  switch (level) {
    case LogLevel.ERROR:
      return 'error';
    case LogLevel.WARN:
      return 'warn';
    default:
      return 'log';
  }
}

/**
 * Core logger class
 */
class LoggerImpl implements Logger {
  private config: LoggerConfig;
  private componentContext?: string;

  constructor(config: LoggerConfig = defaultConfig, componentContext?: string) {
    this.config = config;
    this.componentContext = componentContext;
  }

  /**
   * Check if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return level <= this.config.level;
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, levelName: string, message: string, meta?: LogMeta): void {
    if (!this.shouldLog(level)) {
      return; // No-op for disabled levels (zero cost)
    }

    if (!this.config.enableConsole) {
      return;
    }

    const formattedMessage = formatMessage(
      levelName,
      message,
      meta,
      this.config,
      this.componentContext
    );

    const formattedMeta = formatMeta(meta, this.config);
    const consoleMethod = getConsoleMethod(level);

    // Output to console
    if (formattedMeta.length > 0) {
      console[consoleMethod](formattedMessage, ...formattedMeta);
    } else {
      console[consoleMethod](formattedMessage);
    }
  }

  /**
   * Log error message (always visible in production)
   */
  error(message: string, meta?: LogMeta): void {
    this.log(LogLevel.ERROR, 'error', message, meta);
  }

  /**
   * Log warning message (always visible in production)
   */
  warn(message: string, meta?: LogMeta): void {
    this.log(LogLevel.WARN, 'warn', message, meta);
  }

  /**
   * Log info message (development only)
   */
  info(message: string, meta?: LogMeta): void {
    this.log(LogLevel.INFO, 'info', message, meta);
  }

  /**
   * Log debug message (development + debug flag only)
   */
  debug(message: string, meta?: LogMeta): void {
    this.log(LogLevel.DEBUG, 'debug', message, meta);
  }

  /**
   * Log trace message (development + debug flag only)
   */
  trace(message: string, meta?: LogMeta): void {
    this.log(LogLevel.TRACE, 'trace', message, meta);
  }

  /**
   * Create child logger with additional context
   */
  child(meta: LogMeta): Logger {
    const component = meta.component || this.componentContext;
    return new LoggerImpl(this.config, component);
  }

  /**
   * Get current configuration (readonly)
   */
  getConfig(): Readonly<LoggerConfig> {
    return { ...this.config };
  }
}

/**
 * Create root logger instance
 */
export function createLogger(config?: Partial<LoggerConfig>): Logger {
  const finalConfig = config
    ? { ...defaultConfig, ...config }
    : defaultConfig;

  return new LoggerImpl(finalConfig);
}

/**
 * Default logger instance
 */
export const logger = createLogger();
