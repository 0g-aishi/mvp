'use client';

import { ConversationContext, ChatMessage } from './services/conversationContextBuilder';
import {
  buildConversationPrompt as buildConversationPromptFromFile,
  buildConversationSummaryPrompt,
  ConversationPrompt,
  ConversationResponse
} from '../../prompts/conversationPrompts';
import { logger } from '@/lib/logger';

// Re-export types for compatibility
export type { ConversationPrompt, ConversationResponse };

export function useAgentConversationPrompt() {

  // Logger instance
  const log = logger.child({ component: 'useAgentConversationPrompt' });

  log.debug('useAgentConversationPrompt hook initialized');

  /**
   * Buduje kompletny prompt do konwersacji na podstawie ConversationContext
   */
  const buildConversationPrompt = (
    context: ConversationContext, 
    userMessage: string
  ): ConversationPrompt => {
    return buildConversationPromptFromFile(context, userMessage);
  };

  return {
    buildConversationPrompt
  };
}

// Export standalone function for compatibility
export { buildConversationSummaryPrompt };

