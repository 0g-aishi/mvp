/**
 * @fileoverview Shared Storage Actions for XState Machines
 * @description Common actions for storage operations and retry logic used by both dream and chat machines
 */

import { assign, sendParent } from 'xstate';
import type { TerminalLine } from '../types';
import { logger } from '@/lib/logger';

// Logger instance
const log = logger.child({ component: 'StorageActions' });

/**
 * Shared storage-related actions for consistent upload/retry handling across machines
 */
export const storageActions = {
  /**
   * Store upload error in context
   */
  storeUploadError: assign({
    error: ({ event }: any) => {
      const errorMsg = event.error || 'Upload failed';
      log.debug('Storing upload error', { error: errorMsg });
      return errorMsg;
    },
    lastError: ({ event }: any) => event.error || 'Upload failed',
    statusMessage: 'Storage upload failed'
  }),

  /**
   * Display upload error prompt to user
   * Asks if they want to retry the upload
   */
  displayUploadErrorPrompt: sendParent(({ context }: any) => {
    const retryCount = context.retryCount || 0;
    const maxRetries = context.maxRetries || 3;
    
    const lines: TerminalLine[] = [{
      type: 'error',
      content: `0G Network storage error: ${context.error || context.lastError || 'Upload failed'}`,
      timestamp: Date.now()
    }];

    if (retryCount < maxRetries) {
      lines.push({
        type: 'system',
        content: `Do you want to try uploading again? (Attempt ${retryCount + 1}/${maxRetries}) Type y or n`,
        timestamp: Date.now() + 1
      });
    } else {
      lines.push({
        type: 'warning',
        content: `Maximum retry attempts (${maxRetries}) reached. Type y to try once more or n to cancel.`,
        timestamp: Date.now() + 1
      });
    }

    return {
      type: 'APPEND_LINES',
      lines
    };
  }),

  /**
   * Increment retry count
   */
  incrementRetryCount: assign({
    retryCount: ({ context }: any) => {
      const newCount = (context.retryCount || 0) + 1;
      log.debug('Incrementing retry count', { newCount, max: context.maxRetries });
      return newCount;
    },
    statusMessage: ({ context }: any) => 
      `Retrying upload... (Attempt ${(context.retryCount || 0) + 1}/${context.maxRetries || 3})`
  }),

  announceRetryStatus: sendParent(({ context }: any) => ({
    type: 'UPDATE_STATUS',
    status: `Retrying upload... (Attempt ${context.retryCount}/${context.maxRetries || 3})`
  })),

  /**
   * Reset retry count
   */
  resetRetryCount: assign({
    retryCount: 0,
    lastError: null
  }),

  /**
   * Store file preparation result (for chat)
   */
  storeFilePreparation: assign({
    conversationSummary: ({ event }: any) => event.output?.summary,
    preparedFileData: ({ event }: any) => event.output?.fileData,
    statusMessage: 'Uploading to storage...'
  }),

  /**
   * Store dream file data (for dream)
   */
  storeDreamFileData: assign({
    persistenceResult: ({ context, event }: any) => ({
      ...context.persistenceResult,
      fileData: event.output
    }),
    statusMessage: 'Uploading to 0G Network...'
  }),

  /**
   * Store storage upload result
   */
  storeStorageResult: assign({
    storageRootHash: ({ event }: any) => {
      const rootHash = event.output?.rootHash;
      log.debug('Storing storage result', { rootHash });
      return rootHash;
    },
    statusMessage: ({ event }: any) => {
      if (event.output?.alreadyExists) {
        return 'Storage already synced. Updating contract...';
      }
      return 'Updating contract...';
    }
  }),

  /**
   * Store contract update result
   */
  storeContractResult: assign({
    contractTxHash: ({ event }: any) => {
      const txHash = event.output?.txHash;
      log.debug('Storing contract result', { txHash });
      return txHash;
    },
    statusMessage: 'Successfully saved!',
    retryCount: 0 // Reset on success
  }),

  /**
   * Clear storage error
   */
  clearStorageError: assign({
    error: null,
    lastError: null,
    retryCount: 0
  }),

  /**
   * Set upload cancelled status
   */
  setUploadCancelledStatus: assign({
    statusMessage: ({ context }: any) => {
      // Determine what was cancelled based on context
      if (context.dreamInput !== undefined) {
        return 'Dream not saved.';
      } else if (context.messages !== undefined) {
        return 'Conversation not saved.';
      }
      return 'Upload cancelled.';
    }
  }),

  /**
   * Set max retries exceeded status
   */
  setMaxRetriesExceededStatus: assign({
    statusMessage: ({ context }: any) => {
      const maxRetries = context.maxRetries || 3;
      return `Maximum retries (${maxRetries}) exceeded. Data not saved.`;
    }
  })
};