/**
 * @fileoverview Shared Storage Guards for XState Machines
 * @description Common guards for storage operations and retry logic used by both dream and chat machines
 */

import { logger } from '@/lib/logger';

// Logger instance
const log = logger.child({ component: 'StorageGuards' });

/**
 * Shared storage-related guards for consistent validation across machines
 */
export const storageGuards = {
  /**
   * Check if we can retry the upload operation
   */
  canRetry: ({ context }: { context: any }) => {
    const retryCount = context.retryCount || 0;
    const maxRetries = context.maxRetries || 3;
    const canRetry = retryCount < maxRetries;
    
    log.debug('Checking retry eligibility', { 
      retryCount, 
      maxRetries, 
      canRetry 
    });
    
    return canRetry;
  },

  /**
   * Check if maximum retries have been exceeded
   */
  hasExceededMaxRetries: ({ context }: { context: any }) => {
    const retryCount = context.retryCount || 0;
    const maxRetries = context.maxRetries || 3;
    const exceeded = retryCount >= maxRetries;
    
    log.debug('Checking if max retries exceeded', { 
      retryCount, 
      maxRetries, 
      exceeded 
    });
    
    return exceeded;
  },

  /**
   * Check if we have a valid root hash for contract update
   * Now checks the event output directly instead of context
   */
  hasValidRootHash: ({ event }: { event: any }) => {
    // Get hash from event output (from storage upload service)
    const hash = event?.output?.rootHash;

    const isValid = !!hash &&
                   hash !== '0x0' &&
                   hash !== '0x0000000000000000000000000000000000000000000000000000000000000000' &&
                   hash.length === 66;

    log.debug('Validating root hash from event', {
      hash: hash ? `${hash.substring(0, 10)}...` : 'none',
      hashLength: hash?.length,
      expectedLength: 66,
      isValid
    });

    return isValid;
  },

  /**
   * Detect if error is related to storage upload
   */
  isStorageUploadError: ({ event }: { event: any }) => {
    if ('error' in event && event.error) {
      const raw = event.error instanceof Error ? event.error.message : String(event.error);
      const normalizedMsg = raw.toLowerCase();

      const storageErrorPatterns = [
        'upload failed',
        '0g network',
        'storage error',
        'storage upload',
        'no root hash',
        'uploadtostorage',
        'network timeout',
        'econnrefused',
        'failed to fetch',
        'fetch failed',
        'networkerror',
        'socket hang up',
        'etimedout',
        'connection refused',
        'status 5',
        'status: 5'
      ];

      const isStorageError = storageErrorPatterns.some(pattern => normalizedMsg.includes(pattern));

      log.debug('Checking if storage upload error', {
        errorMsg: raw.substring(0, 50),
        isStorageError
      });

      return isStorageError;
    }
    return false;
  },

  /**
   * Check if user input is 'yes'
   */
  isYesInput: ({ event }: any) => {
    if (event.type !== 'INPUT.SUBMIT' && event.type !== 'CONFIRM_SAVE') return false;
    
    if (event.type === 'CONFIRM_SAVE') return true;
    
    const value = event.value?.toLowerCase().trim();
    const isYes = value === 'y' || value === 'yes';
    
    log.debug('Checking yes input', { value, isYes });
    
    return isYes;
  },

  /**
   * Check if user input is 'no'
   */
  isNoInput: ({ event }: any) => {
    if (event.type !== 'INPUT.SUBMIT' && event.type !== 'CANCEL_SAVE') return false;
    
    if (event.type === 'CANCEL_SAVE') return true;
    
    const value = event.value?.toLowerCase().trim();
    const isNo = value === 'n' || value === 'no';
    
    log.debug('Checking no input', { value, isNo });
    
    return isNo;
  },

  /**
   * Combined guard: Check if user wants to retry AND can retry
   */
  shouldRetry: ({ context, event }: any) => {
    const canRetry = storageGuards.canRetry({ context });
    const wantsRetry = storageGuards.isYesInput({ event });
    
    log.debug('Checking should retry', { canRetry, wantsRetry });
    
    return canRetry && wantsRetry;
  },

  /**
   * Combined guard: Check if user wants to retry BUT exceeded max retries
   */
  shouldAbortAfterMaxRetries: ({ context, event }: any) => {
    const exceededMax = storageGuards.hasExceededMaxRetries({ context });
    const wantsRetry = storageGuards.isYesInput({ event });
    
    log.debug('Checking should abort after max retries', { exceededMax, wantsRetry });
    
    return exceededMax && wantsRetry;
  }
};