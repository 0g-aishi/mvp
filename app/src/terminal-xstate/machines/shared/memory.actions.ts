/**
 * @fileoverview Shared Memory Actions for XState Machines  
 * @description Common actions for memory error handling used by both dream and chat machines
 */

import { assign, sendParent } from 'xstate';
import type { TerminalLine } from '../types';

/**
 * Shared memory-related actions for consistent error handling across machines
 */
export const memoryActions = {
  /**
   * Store memory download error in context
   */
  storeMemoryError: assign({
    memoryDownloadError: ({ event }: any) => {
      if ('error' in event) {
        return event.error instanceof Error ? event.error.message : String(event.error);
      }
      return 'Failed to access memory from 0G Storage';
    },
    statusMessage: 'Memory download failed'
  }),

  /**
   * Display memory error prompt to user
   * Asks if they want to continue without historical memory
   */
  displayMemoryErrorPrompt: sendParent(({ context }: any) => {
    // Support both dream and chat contexts
    const agentName = context.agentName || 
                     context.dreamContext?.agentProfile?.name ||
                     (context.agentId ? `Agent #${context.agentId}` : 'Your agent');
    
    // Customize message based on machine type
    const memoryType = context.dreamInput !== undefined ? 
      "Agent won't remember previous dreams" : 
      "Agent won't remember previous conversations and dreams";
    
    return {
      type: 'APPEND_LINES',
      lines: [{
        type: 'warning',
        content: `${agentName} can't access previous memory from 0G Storage. Check nodes status.`,
        timestamp: Date.now()
      }, {
        type: 'system',
        content: `Do u wanna continue? ${memoryType}. Type y/n`,
        timestamp: Date.now() + 1
      }] as TerminalLine[]
    };
  }),

  /**
   * Clear memory error and mark to continue without memory
   */
  clearMemoryError: assign({
    continueWithoutMemory: true,
    memoryDownloadError: null
  }),

  /**
   * Reset memory error state
   */
  resetMemoryError: assign({
    continueWithoutMemory: false,
    memoryDownloadError: null
  })
};