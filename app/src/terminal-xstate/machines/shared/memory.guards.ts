/**
 * @fileoverview Shared Memory Guards for XState Machines
 * @description Common guards for memory error handling used by both dream and chat machines
 */

/**
 * Check if memory download error occurred
 * Used by both dream and chat machines to detect 0G Storage access failures
 */
export const memoryGuards = {
  /**
   * Detects various patterns of memory download failures
   * @param event - XState event that may contain error information
   * @returns true if the error is related to memory/storage access
   */
  isMemoryDownloadError: ({ event }: { event: any }) => {
    if ('error' in event && event.error) {
      const errorMsg = event.error instanceof Error ? event.error.message : String(event.error);
      
      // Comprehensive checks for various memory error patterns
      return errorMsg.includes('File not found') || 
             errorMsg.includes('code 101') ||
             errorMsg.includes('Download failed') ||
             errorMsg.includes('Failed to load') ||
             errorMsg.includes('Failed to download') ||
             errorMsg.includes('does not exist in storage') ||
             errorMsg.includes('0G Storage') ||
             errorMsg.includes('root hash') ||
             errorMsg.includes('Failed to access memory') ||
             errorMsg.includes('memory core');
    }
    return false;
  }
};