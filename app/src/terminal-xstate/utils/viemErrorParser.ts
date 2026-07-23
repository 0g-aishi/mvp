/**
 * @fileoverview Viem Error Parser
 * @description Elegant error handling for Viem v2 blockchain errors
 */

import type { BaseError } from 'viem';

export type ParsedError = {
  type: 'user_rejected' | 'insufficient_funds' | 'network_error' | 'contract_error' | 'unknown';
  message: string;
  details?: string;
  shouldRetry: boolean;
};

/**
 * Parse Viem errors into user-friendly messages
 */
export function parseViemError(error: any): ParsedError {
  // Handle string errors
  if (typeof error === 'string') {
    return parseErrorString(error);
  }

  // Handle Error objects
  if (error instanceof Error) {
    const errorMessage = error.message || '';

    // Check for specific Viem error patterns
    if (errorMessage.includes('User rejected') || errorMessage.includes('user rejected')) {
      return {
        type: 'user_rejected',
        message: 'Transaction cancelled',
        details: 'You rejected the transaction in your wallet',
        shouldRetry: true
      };
    }

    if (errorMessage.includes('insufficient funds') || errorMessage.includes('Insufficient funds')) {
      return {
        type: 'insufficient_funds',
        message: 'Insufficient funds',
        details: 'Not enough tokens to complete transaction',
        shouldRetry: false
      };
    }

    if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      return {
        type: 'network_error',
        message: 'Network error',
        details: 'Connection issue - please try again',
        shouldRetry: true
      };
    }

    // Check if error has walk method (Viem BaseError)
    if ('walk' in error && typeof error.walk === 'function') {
      return parseViemBaseError(error as BaseError);
    }

    // Parse the error string for common patterns
    return parseErrorString(errorMessage);
  }

  // Default unknown error
  return {
    type: 'unknown',
    message: 'Transaction failed',
    details: 'An unexpected error occurred',
    shouldRetry: true
  };
}

/**
 * Parse Viem BaseError using walk method
 */
function parseViemBaseError(error: BaseError): ParsedError {
  // Try to find specific error types using walk
  try {
    // Check for UserRejectedRequestError
    const findUserRejected = error.walk((err) => {
      const errString = err?.toString() || '';
      return errString.includes('UserRejectedRequestError') ||
             errString.includes('User rejected') ||
             errString.includes('4001'); // MetaMask error code
    });

    if (findUserRejected) {
      return {
        type: 'user_rejected',
        message: 'Transaction cancelled',
        details: 'You rejected the transaction in your wallet',
        shouldRetry: true
      };
    }

    // Check for insufficient funds
    const findInsufficientFunds = error.walk((err) => {
      const errString = err?.toString() || '';
      return errString.includes('insufficient') ||
             errString.includes('InsufficientFunds');
    });

    if (findInsufficientFunds) {
      return {
        type: 'insufficient_funds',
        message: 'Insufficient funds',
        details: 'Not enough tokens to complete transaction',
        shouldRetry: false
      };
    }
  } catch {
    // If walk fails, continue with string parsing
  }

  // Fallback to string parsing
  return parseErrorString(error.message || error.toString());
}

/**
 * Parse error string for common patterns
 */
function parseErrorString(errorStr: string): ParsedError {
  const lowerError = errorStr.toLowerCase();

  // User rejection patterns
  if (lowerError.includes('user rejected') ||
      lowerError.includes('user denied') ||
      lowerError.includes('cancelled') ||
      lowerError.includes('4001')) {
    return {
      type: 'user_rejected',
      message: 'Transaction cancelled',
      details: undefined,
      shouldRetry: true
    };
  }

  // Insufficient funds patterns
  if (lowerError.includes('insufficient') ||
      lowerError.includes('not enough') ||
      lowerError.includes('balance too low')) {
    return {
      type: 'insufficient_funds',
      message: 'Insufficient funds',
      details: undefined,
      shouldRetry: false
    };
  }

  // Transaction receipt timeout (special case - transaction may have succeeded)
  if ((lowerError.includes('timeout') || lowerError.includes('timed out')) &&
      (lowerError.includes('receipt') || lowerError.includes('transaction'))) {
    return {
      type: 'network_error',
      message: 'Transaction submitted successfully',
      details: 'Confirmation is taking longer than usual - transaction may still complete',
      shouldRetry: true
    };
  }

  // Network error patterns
  if (lowerError.includes('network') ||
      lowerError.includes('timeout') ||
      lowerError.includes('connection') ||
      lowerError.includes('rpc')) {
    return {
      type: 'network_error',
      message: 'Network error',
      details: 'Please check your connection',
      shouldRetry: true
    };
  }

  // Contract revert patterns
  if (lowerError.includes('revert') ||
      lowerError.includes('require') ||
      lowerError.includes('assert')) {
    // Extract revert reason if available
    const revertMatch = errorStr.match(/revert(?:ed)?\s*(?:with reason string\s*)?[:\s]*["']?([^"']+)["']?/i);
    const reason = revertMatch ? revertMatch[1].trim() : undefined;

    return {
      type: 'contract_error',
      message: 'Contract error',
      details: reason || 'Transaction reverted',
      shouldRetry: false
    };
  }

  // Gas estimation failed
  if (lowerError.includes('gas') || lowerError.includes('estimategas')) {
    return {
      type: 'contract_error',
      message: 'Gas estimation failed',
      details: 'Transaction may fail - check parameters',
      shouldRetry: true
    };
  }

  // Default for unknown errors
  return {
    type: 'unknown',
    message: 'Transaction failed',
    details: extractShortMessage(errorStr),
    shouldRetry: true
  };
}

/**
 * Extract a short, readable message from error string
 */
function extractShortMessage(errorStr: string): string | undefined {
  // Remove common technical prefixes
  let cleaned = errorStr
    .replace(/^Error:\s*/i, '')
    .replace(/^Contract update failed:\s*/i, '')
    .replace(/^Transaction failed:\s*/i, '')
    .replace(/^execution reverted:\s*/i, '');

  // If it's still too long or contains technical details, truncate
  if (cleaned.length > 100 || cleaned.includes('0x') || cleaned.includes('Request Arguments')) {
    // Try to extract just the first meaningful sentence
    const firstSentence = cleaned.split(/[.\n]/)[0];
    if (firstSentence && firstSentence.length < 100) {
      return firstSentence;
    }
    return undefined; // Too technical, don't show
  }

  return cleaned;
}

/**
 * Format error for terminal display
 */
export function formatErrorForTerminal(error: any): string {
  const parsed = parseViemError(error);

  // Build the message
  let message = parsed.message;

  if (parsed.details) {
    message += ` - ${parsed.details}`;
  }

  if (parsed.shouldRetry) {
    message += ' (try again)';
  }

  return message;
}