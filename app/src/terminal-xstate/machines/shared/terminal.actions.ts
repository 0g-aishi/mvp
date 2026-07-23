/**
 * @fileoverview Shared Terminal Actions for XState Machines
 * @description Common actions for terminal communication used across all machines
 */

import { sendParent } from 'xstate';
import type { TerminalLine } from '../types';

/**
 * Shared terminal communication actions for consistent parent-child messaging
 */
export const terminalActions = {
  /**
   * Send lines to parent terminal for display
   * @param lines - Array of terminal lines to display
   */
  sendLinesToParent: (lines: TerminalLine[]) => 
    sendParent(() => ({
      type: 'APPEND_LINES',
      lines
    })),

  /**
   * Send status update to parent terminal
   * @param status - Status message to display
   */
  sendStatusToParent: (status: string) =>
    sendParent(() => ({
      type: 'UPDATE_STATUS',
      status
    })),

  /**
   * Send error to parent terminal
   * @param error - Error message to display
   */
  sendErrorToParent: (error: string) =>
    sendParent(() => ({
      type: 'APPEND_LINES',
      lines: [{
        type: 'error',
        content: error,
        timestamp: Date.now()
      }] as TerminalLine[]
    })),

  /**
   * Send success/completion message to parent terminal
   * @param message - Success message to display
   */
  sendCompletionToParent: (message: string) =>
    sendParent(() => ({
      type: 'APPEND_LINES',
      lines: [{
        type: 'success',
        content: message,
        timestamp: Date.now()
      }] as TerminalLine[]
    })),

  /**
   * Send warning to parent terminal
   * @param warning - Warning message to display
   */
  sendWarningToParent: (warning: string) =>
    sendParent(() => ({
      type: 'APPEND_LINES',
      lines: [{
        type: 'warning',
        content: warning,
        timestamp: Date.now()
      }] as TerminalLine[]
    })),

  /**
   * Send system message to parent terminal
   * @param message - System message to display
   */
  sendSystemMessageToParent: (message: string) =>
    sendParent(() => ({
      type: 'APPEND_LINES',
      lines: [{
        type: 'system',
        content: message,
        timestamp: Date.now()
      }] as TerminalLine[]
    })),

  /**
   * Send info message to parent terminal
   * @param info - Info message to display
   */
  sendInfoToParent: (info: string) =>
    sendParent(() => ({
      type: 'APPEND_LINES',
      lines: [{
        type: 'info',
        content: info,
        timestamp: Date.now()
      }] as TerminalLine[]
    }))
};

/**
 * Context-aware terminal actions that use machine context
 */
export const contextualTerminalActions = {
  /**
   * Send dynamic status from context to parent
   */
  sendStatusFromContext: sendParent(({ context }: any) => {
    const payload: Record<string, any> = {
      type: 'UPDATE_STATUS',
      source: context.statusSource || 'global'
    };

    if (context.statusMessage !== undefined) {
      payload.status = context.statusMessage ?? null;
    }

    if (context.promptMessage !== undefined) {
      payload.prompt = context.promptMessage ?? null;
    }

    return payload;
  }),

  /**
   * Send error from context to parent
   */
  sendErrorFromContext: sendParent(({ context }: any) => {
    const errorLine: TerminalLine = {
      type: 'error',
      content: context.errorMessage || context.error || 'Unknown error occurred',
      timestamp: Date.now()
    };
    return { type: 'APPEND_LINES', lines: [errorLine] };
  }),

  /**
   * Send completion status from context
   */
  sendCompletionFromContext: sendParent(({ context }: any) => ({
    type: 'APPEND_LINES',
    lines: [{
      type: 'success',
      content: context.statusMessage || 'Operation completed successfully',
      timestamp: Date.now()
    }] as TerminalLine[]
  }))
};