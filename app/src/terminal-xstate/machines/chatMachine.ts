// @ts-nocheck
/**
 * @fileoverview Chat Machine for Terminal XState
 * @description Manages interactive chat sessions between users and their AI agents
 */

import { setup, assign, sendParent, fromPromise } from 'xstate';
import { TerminalLine } from './types';
import { memoryGuards } from './shared/memory.guards';
import { memoryActions } from './shared/memory.actions';
import { storageActions } from './shared/storage.actions';
import { storageGuards } from './shared/storage.guards';
import { contextualTerminalActions } from './shared/terminal.actions';
import { chatActions, chatGuards } from './chat.actions';
import { logger } from '@/lib/logger';

// Logger instance
const log = logger.child({ component: 'ChatMachine' });

// Chat-specific types
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatContext {
  agentId: number | null;
  agentName: string;
  modelId: string;
  walletAddress: string | null; // Wallet address for 0G Network billing
  sessionId: string | null;
  messages: ChatMessage[];
  currentTranscript: string;
  isInitialized: boolean;
  awaitingConfirmation: boolean;
  statusMessage: string | null;
  promptMessage: string | null;
  statusSource: 'chat';
  error: string | null;
  // Context data
  agentContext: any | null;
  historicalData: any | null;
  // Persistence
  conversationSummary: any | null;
  preparedFileData: any | null; // Store prepared file for retry
  storageRootHash: string | null;
  contractTxHash: string | null;
  // Error handling
  retryCount: number;
  maxRetries: number;
  lastError: string | null;
  // Memory handling (like dream)
  memoryDownloadError: string | null;
  continueWithoutMemory: boolean;
  // Voice tracking
  wasVoiceInput: boolean;
}

export type ChatEvent =
  | { type: 'START_CHAT'; agentId: number; agentName: string; modelId: string; walletAddress?: string; wasVoiceInput?: boolean }
  | { type: 'USER_MESSAGE'; message: string; wasVoiceInput?: boolean }
  | { type: 'AI_RESPONSE_SUCCESS'; response: string }
  | { type: 'AI_RESPONSE_ERROR'; error: string }
  | { type: 'END_SESSION' }
  | { type: 'CONFIRM_SAVE' }
  | { type: 'CANCEL_SAVE' }
  | { type: 'INPUT.SUBMIT'; value: string; wasVoiceInput?: boolean }
  | { type: 'EXIT' }
  | { type: 'RETRY' }
  | { type: 'SKIP_RETRY' };

// Initial context
const initialContext: ChatContext = {
  agentId: null,
  agentName: '',
  modelId: 'auto',
  walletAddress: null,
  sessionId: null,
  messages: [],
  currentTranscript: '',
  isInitialized: false,
  awaitingConfirmation: false,
  statusMessage: null,
  promptMessage: null,
  statusSource: 'chat',
  error: null,
  agentContext: null,
  historicalData: null,
  conversationSummary: null,
  preparedFileData: null,
  storageRootHash: null,
  contractTxHash: null,
  retryCount: 0,
  maxRetries: 3,
  lastError: null,
  memoryDownloadError: null,
  continueWithoutMemory: false,
  wasVoiceInput: false
};

// Chat machine definition
export const chatMachine = setup({
  types: {} as {
    context: ChatContext;
    events: ChatEvent;
    input: {
      agentId: number;
      agentName: string;
    };
  },
  actions: {
    // Import actions from chat.actions.ts
    ...chatActions,
    
    // Import shared memory actions
    storeMemoryError: memoryActions.storeMemoryError,
    displayMemoryErrorPrompt: memoryActions.displayMemoryErrorPrompt,
    clearMemoryError: memoryActions.clearMemoryError,
    
    // Import shared storage actions
    storeUploadError: storageActions.storeUploadError,
    displayUploadErrorPrompt: storageActions.displayUploadErrorPrompt,
    storeFilePreparation: storageActions.storeFilePreparation,
    storeStorageResult: storageActions.storeStorageResult,
    announceRetryStatus: storageActions.announceRetryStatus,
    
    // Import shared terminal actions
    sendStatusToParent: contextualTerminalActions.sendStatusFromContext
  },
  actors: {
    // Load full agent context
    loadContext: fromPromise(async ({ input }: { input: { agentId: number; continueWithoutMemory?: boolean } }) => {
      log.debug('Loading full agent context', { 
        agentId: input.agentId,
        continueWithoutMemory: input.continueWithoutMemory || false
      });
      
      // Dynamic import to avoid circular dependencies
      const { fetchChatContext } = await import('./chatServices');
      const contextData = await fetchChatContext(input.agentId, input.continueWithoutMemory);
      
      log.debug('Context loaded successfully', {
        hasAgentData: !!contextData.agentContext,
        hasHistoricalData: !!contextData.historicalData
      });
      
      return contextData;
    }),

    // Process user message with AI
    processMessage: fromPromise(async ({ input }: {
      input: {
        message: string;
        messages: ChatMessage[];
        agentContext: any;
        historicalData: any;
        agentName: string;
        modelId: string;
        walletAddress?: string;
      }
    }) => {
      log.debug('Processing user message', {
        messageLength: input.message?.length,
        isFirstMessage: input.messages.length === 1,
        modelId: input.modelId,
        hasWalletAddress: !!input.walletAddress
      });

      // Dynamic import to avoid circular dependencies
      const { sendChatMessage } = await import('./chatServices');
      const response = await sendChatMessage(
        input.message,
        input.messages,
        input.agentContext,
        input.historicalData,
        input.agentName,
        input.modelId,
        input.walletAddress
      );

      log.debug('AI response received', {
        hasResponse: !!response,
        hasResponseText: !!response?.response,
        responseLength: response?.response?.length || 0
      });

      // Validate response format before returning
      if (!response || typeof response.response !== 'string') {
        log.debug('Invalid response format', { response });
        throw new Error('Invalid response format from AI service');
      }

      return response;
    }),

    // Generate conversation summary
    generateSummary: fromPromise(async ({ input }: { 
      input: {
        currentTranscript: string;
        messages: ChatMessage[];
        agentId: number;
        modelId: string;
      }
    }) => {
      log.debug('Generating conversation summary', {
        messageCount: input.messages.length,
        transcriptLength: input.currentTranscript.length,
        modelId: input.modelId
      });

      // Dynamic import to avoid circular dependencies
      const { generateConversationSummary } = await import('./chatServices');
      const summary = await generateConversationSummary(
        input.currentTranscript,
        input.messages,
        input.agentId,
        input.modelId
      );

      log.debug('Summary generated', {
        hasSummary: !!summary.summary
      });

      return summary;
    }),

    // Prepare conversation file
    prepareConversationFile: fromPromise(async ({ input }: { 
      input: {
        agentId: number;
        agentName: string;
        conversationSummary: any;
      }
    }) => {
      log.debug('Preparing conversation file', {
        agentId: input.agentId,
        hasSummary: !!input.conversationSummary
      });

      // Dynamic import to avoid circular dependencies
      const { ConversationFileManager } = await import('../services/conversationFileManager');
      const fileManager = new ConversationFileManager();
      
      const fileResult = await fileManager.manageConversationFile(
        input.agentId,
        input.agentName,
        input.conversationSummary
      );

      log.debug('Conversation file prepared', {
        fileName: fileResult.fileName,
        isNewFile: fileResult.isNewFile,
        totalConversations: fileResult.totalConversations
      });

      return {
        summary: input.conversationSummary,
        fileData: fileResult
      };
    }),

    // Upload conversation to storage
    uploadToStorage: fromPromise(async ({ input }: { 
      input: {
        fileData: any;
        onStatus?: (message: string) => void;
      }
    }) => {
      log.debug('Uploading conversation to storage', {
        fileName: input.fileData.fileName,
        contentLength: input.fileData.fileContent?.length
      });

      // Dynamic import to avoid circular dependencies
      const { uploadToStorage } = await import('../services/xstateStorage');
      const uploadResult = await uploadToStorage(
        input.fileData.fileContent,
        input.fileData.fileName,
        input.onStatus
      );

      log.debug('Upload result', {
        success: uploadResult.success,
        rootHash: uploadResult.rootHash
      });

      // Check if upload was successful
      if (!uploadResult.success || !uploadResult.rootHash) {
        throw new Error(`Upload failed: ${uploadResult.error || 'No root hash returned'}`);
      }

      return {
        rootHash: uploadResult.rootHash
      };
    }),

    // Update contract with conversation hash
    updateContract: fromPromise(async ({ input }: { 
      input: {
        agentId: number;
        rootHash: string;
        conversationType: string;
      }
    }) => {
      log.debug('Updating contract with conversation', {
        agentId: input.agentId,
        rootHash: input.rootHash,
        conversationType: input.conversationType
      });

      // Dynamic import to avoid circular dependencies
      const { updateConversationContract } = await import('../services/conversationContractUpdater');
      const contractResult = await updateConversationContract(
        input.agentId,
        input.rootHash,
        input.conversationType
      );

      log.debug('Contract updated', {
        txHash: contractResult.txHash
      });

      return {
        txHash: contractResult.txHash
      };
    })
  },
  guards: {
    // Import guards from chat.actions.ts
    ...chatGuards,
    
    // Import shared memory guards
    isMemoryDownloadError: memoryGuards.isMemoryDownloadError,
    
    // Import shared storage guards
    canRetry: storageGuards.canRetry,
    hasExceededMaxRetries: storageGuards.hasExceededMaxRetries,
    shouldRetry: storageGuards.shouldRetry,
    shouldAbortAfterMaxRetries: storageGuards.shouldAbortAfterMaxRetries,
    isYesInput: storageGuards.isYesInput,
    isNoInput: storageGuards.isNoInput
  }
}).createMachine({
  id: 'chatMachine',
  initial: 'idle',
  context: initialContext,
  states: {
    idle: {
      on: {
        START_CHAT: {
          target: 'loadingContext',
          actions: ['initializeSession', 'sendStatusToParent']
        }
      }
    },

    loadingContext: {
      entry: 'clearError',
      invoke: {
        src: 'loadContext',
        input: ({ context }) => ({ 
          agentId: context.agentId,
          continueWithoutMemory: context.continueWithoutMemory
        }),
        onDone: {
          target: 'awaitingFirstMessage',
          actions: ['storeContext', 'sendStatusToParent']
        },
        onError: [
          {
            target: 'memoryDownloadFailed',
            guard: 'isMemoryDownloadError',
            actions: ['storeMemoryError']
          },
          {
            target: 'contextLoadFailed',
            actions: ['setError', 'sendStatusToParent']
          }
        ]
      }
    },

    contextLoadFailed: {
      entry: 'sendContextLoadError',
      // Removed 'always' transition to prevent synchronous infinite loop
      after: {
        2000: [
          {
            target: 'loadingContext',
            guard: 'canRetry',
            actions: ['incrementRetry', 'sendStatusToParent']
          },
          {
            target: 'completed',
            actions: 'sendUnableToStart'
          }
        ]
      },
      on: {
        RETRY: {
          target: 'loadingContext',
          actions: ['resetRetry']
        },
        EXIT: 'completed'
      }
    },

    awaitingFirstMessage: {
      entry: 'sendChatStartedMessage',
      on: {
        'INPUT.SUBMIT': {
          target: 'processingMessage',
          actions: ['addUserMessage', 'sendStatusToParent']
        },
        END_SESSION: 'confirmingSave',
        EXIT: 'completed'
      }
    },

    processingMessage: {
      entry: [
        assign({ 
          statusMessage: ({ context }) => `${context.agentName} is thinking...`,
          promptMessage: () => null
        }),
        'sendStatusToParent'
      ],
      invoke: {
        src: 'processMessage',
        input: ({ context, event }) => ({
          message: (event as any).value || (event as any).message,
          messages: context.messages,
          agentContext: context.agentContext,
          historicalData: context.historicalData,
          agentName: context.agentName,
          modelId: context.modelId,
          walletAddress: context.walletAddress
        }),
        onDone: {
          target: 'displayingResponse',
          actions: ['addAIResponse']
        },
        onError: {
          target: 'messageFailed',
          actions: ['setError', 'sendStatusToParent']
        }
      }
    },

    displayingResponse: {
      entry: ['sendLinesToParent', 'sendStatusToParent'],
      always: 'chatting'
    },

    chatting: {
      entry: [
        // Reset thinking status after AI response is displayed
        assign({ statusMessage: null, promptMessage: () => 'Type your message...' }),
        'sendStatusToParent'
      ],
      on: {
        'INPUT.SUBMIT': {
          target: 'processingMessage',
          actions: ['addUserMessage', 'sendStatusToParent']
        },
        END_SESSION: 'confirmingSave',
        EXIT: 'completed'
      }
    },

    messageFailed: {
      entry: 'sendMessageError',
      // Removed 'always' transition to prevent synchronous infinite loop
      after: {
        2000: [
          {
            target: 'processingMessage',
            guard: 'canRetry',
            actions: ['incrementRetry', 'sendStatusToParent']
          }
        ]
      },
      on: {
        'INPUT.SUBMIT': {
          target: 'processingMessage',
          actions: ['addUserMessage', 'resetRetry', 'sendStatusToParent']
        },
        RETRY: {
          target: 'processingMessage',
          actions: ['resetRetry']
        },
        END_SESSION: 'confirmingSave',
        EXIT: 'completed'
      }
    },

    confirmingSave: {
      entry: ['setAwaitingConfirmation', 'sendSavePrompt', 'sendStatusToParent'],
      on: {
        'INPUT.SUBMIT': [
          {
            guard: 'isYesInput',
            target: 'summarizingConversation'
          },
          {
            guard: 'isNoInput',
            target: 'completed'
          }
        ],
        CONFIRM_SAVE: 'summarizingConversation',
        CANCEL_SAVE: 'completed',
        EXIT: 'completed'
      }
    },

    summarizingConversation: {
      entry: [
        assign({ 
          statusMessage: ({ context }) => `${context.agentName} is learning...` 
        }),
        'sendStatusToParent'
      ],
      invoke: {
        src: 'generateSummary',
        input: ({ context }) => ({
          currentTranscript: context.currentTranscript,
          messages: context.messages,
          agentId: context.agentId,
          modelId: context.modelId
        }),
        onDone: {
          target: 'savingConversation',
          actions: ['storeConversationSummary', 'sendStatusToParent']
        },
        onError: {
          target: 'saveFailed',
          actions: ['setError', 'sendStatusToParent']
        }
      }
    },

    savingConversation: {
      initial: 'preparingFile',
      states: {
        preparingFile: {
          entry: [
            assign({ 
              statusMessage: ({ context }) => `${context.agentName} is learning...`,
              promptMessage: () => null
            }),
            'sendStatusToParent'
          ],
          invoke: {
            src: 'prepareConversationFile',
            input: ({ context }) => ({
              agentId: context.agentId,
              agentName: context.agentName,
              conversationSummary: context.conversationSummary
            }),
            onDone: {
              target: 'uploadingToStorage',
              actions: ['storeFilePreparation']
            },
            onError: {
              target: '#chatMachine.saveFailed',
              actions: ['setError', 'sendStatusToParent']
            }
          }
        },
        
        uploadingToStorage: {
          entry: [
            assign({ 
              statusMessage: ({ context }) => `${context.agentName} is learning...`,
              promptMessage: () => null
            }),
            'sendStatusToParent'
          ],
          invoke: {
            src: 'uploadToStorage',
            input: ({ context, self }) => ({
              fileData: context.preparedFileData,
              onStatus: (status: string) => {
                if (status) {
                  self.parent?.send({ type: 'UPDATE_STATUS', source: 'chat', status });
                }
              }
            }),
            onDone: {
              target: 'updatingContract',
              actions: ['storeStorageResult', 'sendStatusToParent']
            },
            onError: {
              target: '#chatMachine.storageUploadFailed',
              actions: ['storeUploadError']
            }
          }
        },
        
        updatingContract: {
          entry: [
            assign({ 
              statusMessage: ({ context }) => `${context.agentName} is evolving...`,
              promptMessage: () => null
            }),
            'sendStatusToParent'
          ],
          invoke: {
            src: 'updateContract',
            input: ({ context }) => ({
              agentId: context.agentId,
              rootHash: context.storageRootHash,
              conversationType: context.conversationSummary?.type || 'general_chat'
            }),
            onDone: {
              target: '#chatMachine.completed',
              actions: ['storePersistenceResult', 'sendCompletionToParent']
            },
            onError: {
              target: '#chatMachine.saveFailed',
              actions: ['setError', 'sendStatusToParent']
            }
          }
        }
      }
    },

    saveFailed: {
      entry: [
        'sendSaveError',
        assign({ statusMessage: null, promptMessage: () => null }) // Clear status for new input
      ],
      // Auto-transition to completed after showing error
      after: {
        2000: 'completed' // Give user time to see error then exit
      },
      on: {
        EXIT: 'completed'
      }
    },

    storageUploadFailed: {
      entry: [
        sendParent(({ context }: any) => {
          const retryCount = context.retryCount || 0;
          const maxRetries = context.maxRetries || 3;
          const nextAttempt = Math.min(retryCount + 1, maxRetries);
          const errorMsg = context.error || context.lastError || 'Upload failed';
          return {
            type: 'UPDATE_STATUS',
            source: 'chat',
            prompt: `Upload failed (${errorMsg}). Retry attempt ${nextAttempt}/${maxRetries}? Type y or n`
          };
        }),
        'displayUploadErrorPrompt'
      ],
      on: {
        'INPUT.SUBMIT': [
          {
            guard: 'shouldRetry',
            target: 'savingConversation.uploadingToStorage',
            actions: ['incrementRetry', 'announceRetryStatus']
          },
          {
            guard: 'shouldAbortAfterMaxRetries',
            target: 'completed',
            actions: [storageActions.setMaxRetriesExceededStatus as any, 'sendStatusToParent'] as any
          },
          {
            guard: 'isNoInput',
            target: 'completed',
            actions: [storageActions.setUploadCancelledStatus as any, 'sendStatusToParent'] as any
          }
        ],
        EXIT: 'completed'
      }
    },

    memoryDownloadFailed: {
      entry: 'displayMemoryErrorPrompt',
      on: {
        'INPUT.SUBMIT': [
          {
            guard: 'isYesInput',
            target: 'loadingContext',
            actions: 'clearMemoryError'
          },
          {
            guard: 'isNoInput',
            target: 'completed',
            actions: 'setCancelledStatus'
          }
        ],
        EXIT: 'completed'
      }
    },

    completed: {
      type: 'final',
      entry: sendParent(() => ({
        type: 'CHAT_COMPLETED'
      }))
    }
  }
});