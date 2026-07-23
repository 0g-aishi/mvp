/**
 * @fileoverview Chat Machine Actions
 * @description All actions for the chat state machine
 */

import { assign, sendParent, enqueueActions } from 'xstate';
import React from 'react';
import { getTxExplorerUrl } from '../../config/chains';
import type { ChatMessage, ChatContext } from './chatMachine';
import type { TerminalLine } from './types';
import { logger } from '@/lib/logger';

// Logger instance
const log = logger.child({ component: 'ChatActions' });

export const chatActions = {
  /**
   * Initialize chat session
   */
  initializeSession: assign({
    agentId: ({ event }: any) => event.agentId,
    agentName: ({ event }: any) => event.agentName,
    modelId: ({ event }: any) => event.modelId || 'auto',
    walletAddress: ({ event }: any) => event.walletAddress || null,
    sessionId: () => `chat_${Date.now()}`,
    statusMessage: ({ event }: any) => `Starting chat with ${event.agentName}...`,
    promptMessage: () => 'Type your message...',
    messages: () => [],
    currentTranscript: () => '',
    wasVoiceInput: ({ event }: any) => event.wasVoiceInput || false
  }),

  /**
   * Store context data
   */
  storeContext: assign({
    agentContext: ({ event }: any) => event.output.agentContext,
    historicalData: ({ event }: any) => event.output.historicalData,
    isInitialized: true,
    statusMessage: ({ context }: { context: ChatContext }) => `Chat ready with ${context.agentName}`,
    promptMessage: () => 'Type your message...'
  }),

  /**
   * Add user message
   */
  addUserMessage: assign({
    messages: ({ context, event }: any) => {
      const userMessage: ChatMessage = {
        role: 'user',
        content: event.message || event.value,
        timestamp: Date.now()
      };
      return [...context.messages, userMessage];
    },
    currentTranscript: ({ context, event }: any) => {
      const message = event.message || event.value;
      return context.currentTranscript +
             `User: ${message}\n`;
    },
    wasVoiceInput: ({ event }: any) => {
      // Update wasVoiceInput from event if present
      return event.wasVoiceInput || false;
    },
    statusMessage: ({ context }: { context: ChatContext }) => `${context.agentName} is thinking...`,
    promptMessage: () => null
  }),

  /**
   * Add AI response
   */
  addAIResponse: assign({
    messages: ({ context, event }: any) => {
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: event.output.response,
        timestamp: Date.now()
      };
      return [...context.messages, aiMessage];
    },
    currentTranscript: ({ context, event }: any) => {
      return context.currentTranscript +
             `${context.agentName}: ${event.output.response}\n`;
    }
    // Removed statusMessage reset - will be handled after display
  }),

  /**
   * Set awaiting save confirmation
   */
  setAwaitingConfirmation: assign({
    awaitingConfirmation: true,
    statusMessage: null,
    promptMessage: () => 'Waiting for your decision...'
  }),

  /**
   * Store conversation summary
   */
  storeConversationSummary: assign({
    conversationSummary: ({ event }: any) => event.output.summary,
    statusMessage: 'Saving conversation...',
    promptMessage: () => null
  }),

  /**
   * Store persistence result
   */
  storePersistenceResult: assign({
    contractTxHash: ({ event }: any) => event.output.txHash,
    statusMessage: 'Conversation saved successfully!',
    promptMessage: () => null,
    retryCount: 0 // Reset retry count on success
  }),

  /**
   * Set error
   */
  setError: assign({
    error: ({ event }: any) => event.error || 'An error occurred',
    lastError: ({ event }: any) => event.error || 'Unknown error',
    statusMessage: null, // Clear status for new input
    promptMessage: () => null,
    awaitingConfirmation: false // Reset any confirmation state
  }),

  /**
   * Clear error
   */
  clearError: assign({
    error: null,
    lastError: null,
    retryCount: 0
  }),
  
  /**
   * Increment retry count
   */
  incrementRetry: assign({
    retryCount: ({ context }: { context: ChatContext }) => context.retryCount + 1,
    statusMessage: ({ context }: { context: ChatContext }) => 
      `Retrying... (Attempt ${context.retryCount + 1}/${context.maxRetries})`
  }),
  
  /**
   * Reset retry count
   */
  resetRetry: assign({
    retryCount: 0,
    lastError: null
  }),

  /**
   * Send lines to parent (terminal) with voice support
   */
  sendLinesToParent: enqueueActions(({ context, enqueue }: any) => {
    log.debug('[Chat] sendLinesToParent triggered', {
      wasVoiceInput: context.wasVoiceInput,
      messagesCount: context.messages.length,
      agentName: context.agentName
    });

    // First action: send lines to parent
    enqueue(sendParent(() => {
      const lines: TerminalLine[] = [];
      const timestamp = Date.now();

      // Get the last message (should be AI response)
      const lastMessage = context.messages[context.messages.length - 1];

      if (lastMessage && lastMessage.role === 'assistant') {
        // For text input, display the response immediately
        // For voice input, skip text display (TTS will handle it)
        if (!context.wasVoiceInput) {
          lines.push({
            type: 'info',
            content: `~ ${context.agentName} : ${lastMessage.content}`,
            timestamp
          });
        }
      }

      return { type: 'APPEND_LINES', lines };
    }));

    // Second action: send TTS request if voice input
    if (context.wasVoiceInput) {
      const lastMessage = context.messages[context.messages.length - 1];

      if (lastMessage && lastMessage.role === 'assistant') {
        log.debug('[Chat] ✅ TRIGGERING TTS - Voice input detected with AI response', {
          textLength: lastMessage.content.length,
          textPreview: lastMessage.content.substring(0, 100),
          agentName: context.agentName
        });

        enqueue(sendParent(() => ({
          type: 'VOICE.SYNTHESIZE_RESPONSE',
          text: lastMessage.content,
          agentName: context.agentName,
          isChatResponse: true
        })));
      }
    } else {
      log.debug('[Chat] ❌ NO TTS TRIGGERED - Text input mode', {
        wasVoiceInput: context.wasVoiceInput
      });
    }
  }),

  /**
   * Send save confirmation prompt
   */
  sendSavePrompt: sendParent(({ context }: { context: ChatContext }) => {
    const lines: TerminalLine[] = [{
      type: 'system',
      content: `Should ${context.agentName} grow with this conversation? (type 'y' or 'n')`,
      timestamp: Date.now()
    }];
    return { type: 'APPEND_LINES', lines };
  }),

  /**
   * Send completion to parent
   */
  sendCompletionToParent: sendParent(({ context }: { context: ChatContext }) => {
    const ts = Date.now();
    const lines: TerminalLine[] = [];
    lines.push({
      type: 'success',
      content: context.statusMessage,
      timestamp: ts
    });
    const shortHash = (h?: string | null) => (h && h.length > 12 ? `${h.slice(0, 10)}...${h.slice(-8)}` : h || '');
    if (context.storageRootHash) {
      lines.push({
        type: 'info',
        content: `Completed: chat | root: ${shortHash(context.storageRootHash)}`,
        timestamp: ts + 1
      });
    }
    if (context.contractTxHash) {
      lines.push({
        type: 'info',
        content: buildTxLinkContent(context.contractTxHash),
        timestamp: ts + 2
      });
    }
    return { type: 'APPEND_LINES', lines };
  }),

  /**
   * Send chat started message
   */
  sendChatStartedMessage: sendParent(({ context }: { context: ChatContext }) => ({
    type: 'APPEND_LINES',
    lines: [{
      type: 'system',
      content: `Chat session started with ${context.agentName}. Type your message:`,
      timestamp: Date.now()
    }]
  })),

  /**
   * Send context load error with retry info
   */
  sendContextLoadError: sendParent(({ context }: { context: ChatContext }) => ({
    type: 'APPEND_LINES',
    lines: [{
      type: 'error',
      content: context.retryCount < context.maxRetries 
        ? `Failed to load agent context: ${context.error}. Retrying in 2 seconds...`
        : `Failed to load agent context after ${context.maxRetries} attempts: ${context.error}`,
      timestamp: Date.now()
    }]
  })),

  /**
   * Send unable to start message
   */
  sendUnableToStart: sendParent(() => ({
    type: 'APPEND_LINES',
    lines: [{
      type: 'error',
      content: 'Unable to start chat session. Please try again later.',
      timestamp: Date.now()
    }]
  })),

  /**
   * Send message processing error
   */
  sendMessageError: sendParent(({ context }: { context: ChatContext }) => ({
    type: 'APPEND_LINES',
    lines: [{
      type: 'error',
      content: context.retryCount < context.maxRetries
        ? `Message processing failed: ${context.error}. Retrying in 2 seconds...`
        : `Message failed after ${context.maxRetries} attempts. Type to try again or END SESSION to exit.`,
      timestamp: Date.now()
    }]
  })),

  /**
   * Send save failed error
   */
  sendSaveError: sendParent(({ context }: { context: ChatContext }) => ({
    type: 'APPEND_LINES',
    lines: [{
      type: 'error',
      content: `Failed to save conversation: ${context.error}`,
      timestamp: Date.now()
    }]
  })),

  /**
   * Set cancelled status
   */
  setCancelledStatus: assign({
    statusMessage: 'Chat cancelled.',
    promptMessage: () => null
  })
};

/**
 * Chat-specific guards
 * Note: Common guards like isYesInput, isNoInput, canRetry are now in shared/storage.guards.ts
 */
export const chatGuards = {
  // Keep this empty for now - all guards moved to shared modules
  // Add any chat-specific guards here in the future
};

function buildTxLinkContent(txHash: string | null | undefined) {
  if (!txHash) {
    return React.createElement(
      React.Fragment,
      null,
      React.createElement(
        'span',
        { style: { color: '#9CA3AF' } },
        'TX: '
      ),
      React.createElement('span', { style: { color: '#6B7280' } }, 'pending')
    );
  }

  const linkHref = getTxExplorerUrl(txHash);
  const linkStyle = {
    color: '#8B5CF6',
    textDecoration: 'none',
    cursor: 'pointer'
  } as const;

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      'span',
      { style: { color: '#9CA3AF' } },
      'TX: '
    ),
    React.createElement(
      'a',
      {
        href: linkHref,
        target: '_blank',
        rel: 'noopener noreferrer',
        style: linkStyle,
        onMouseEnter: (e: React.MouseEvent<HTMLAnchorElement>) => {
          (e.currentTarget as any).style.color = '#A855F7';
        },
        onMouseLeave: (e: React.MouseEvent<HTMLAnchorElement>) => {
          (e.currentTarget as any).style.color = '#8B5CF6';
        }
      },
      `${txHash.slice(0, 10)}...${txHash.slice(-8)}`
    )
  );
}