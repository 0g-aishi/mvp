// @ts-nocheck
/**
 * @fileoverview Month-Learn State Machine
 * @description State machine for monthly memory consolidation workflow
 */

import React from 'react';
import { setup, assign, sendParent, fromPromise } from 'xstate';
import { ContractReaderService } from '../services/contractReader';
import { XStateStorageService } from '../services/xstateStorage';
import { getTxExplorerUrl } from '../../config/chains';
import type { TerminalLine } from './types';
import { logger } from '@/lib/logger';

// Logger instance
const log = logger.child({ component: 'MonthLearnMachine' });

// Context interface
export interface MonthLearnContext {
  // Agent data
  tokenId: number | null;
  agentName: string;
  walletAddress: string | null;
  modelId: string;

  // Daily data
  dailyDreams: any[];
  dailyConversations: any[];

  // Consolidation results
  dreamConsolidation: any | null;
  conversationConsolidation: any | null;

  // Storage hashes
  dreamStorageHash: string | null;
  conversationStorageHash: string | null;
  contractTxHash: string | null;

  // Agent personality (fetched from contract)
  agentPersonality: any | null;

  // Status
  statusMessage: string;
  errorMessage: string | null;

  // Memory hashes from contract
  currentDreamDailyHash: string | null;
  currentConvDailyHash: string | null;
  lastDreamMonthlyHash: string | null;
  lastConvMonthlyHash: string | null;

  // Dates
  currentMonth: number;
  currentYear: number;
}

// Event types
export type MonthLearnEvent =
  | { type: 'START'; tokenId: number; agentName: string; walletAddress: string; modelId: string }
  | { type: 'RETRY' }
  | { type: 'CANCEL' }
  | { type: 'xstate.done.actor.downloadDaily'; output: any }
  | { type: 'xstate.done.actor.aiConsolidation'; output: any }
  | { type: 'xstate.done.actor.uploadMonthly'; output: any }
  | { type: 'xstate.done.actor.contractUpdate'; output: any }
  | { type: 'xstate.error.actor.downloadDaily'; error: any }
  | { type: 'xstate.error.actor.aiConsolidation'; error: any }
  | { type: 'xstate.error.actor.uploadMonthly'; error: any }
  | { type: 'xstate.error.actor.contractUpdate'; error: any };

// Initial context
const initialContext: MonthLearnContext = {
  tokenId: null,
  agentName: '',
  walletAddress: null,
  modelId: 'gemini-2.5-flash-auto',
  dailyDreams: [],
  dailyConversations: [],
  dreamConsolidation: null,
  conversationConsolidation: null,
  dreamStorageHash: null,
  conversationStorageHash: null,
  contractTxHash: null,
  agentPersonality: null,
  statusMessage: '',
  errorMessage: null,
  currentDreamDailyHash: null,
  currentConvDailyHash: null,
  lastDreamMonthlyHash: null,
  lastConvMonthlyHash: null,
  currentMonth: 1,
  currentYear: 2024
};

// Services
const fetchMemoryHashesService = fromPromise(async ({ input }: {
  input: {
    tokenId: number;
  }
}) => {
  log.debug('Fetching memory hashes from contract', input);

  const contractReader = new ContractReaderService();
  const agentData = await contractReader.getCompleteAgentData(input.tokenId);

  if (!agentData || !agentData.memory) {
    throw new Error('Unable to fetch agent memory data');
  }

  // Determine dates
  let currentMonth: number;
  let currentYear: number;

  if (process.env.NEXT_PUBLIC_CONSOLIDATION_TEST === 'true') {
    currentMonth = 1;
    currentYear = 2024;
  } else {
    const now = new Date();
    currentMonth = now.getMonth() + 1;
    currentYear = now.getFullYear();
  }

  return {
    currentDreamDailyHash: agentData.memory.currentDreamDailyHash,
    currentConvDailyHash: agentData.memory.currentConvDailyHash,
    lastDreamMonthlyHash: agentData.memory.lastDreamMonthlyHash,
    lastConvMonthlyHash: agentData.memory.lastConvMonthlyHash,
    currentMonth,
    currentYear,
    agentPersonality: agentData.personality
  };
});

const downloadDailyDataService = fromPromise(async ({ input }: {
  input: {
    tokenId: number;
    currentDreamDailyHash: string | null;
    currentConvDailyHash: string | null;
  }
}) => {
  log.debug('Downloading daily data from storage', input);

  const storage = new XStateStorageService();
  const emptyHash = '0x0000000000000000000000000000000000000000000000000000000000000000';

  let dailyDreams: any[] = [];
  let dailyConversations: any[] = [];

  // Download dreams
  if (input.currentDreamDailyHash && input.currentDreamDailyHash !== emptyHash) {
    const dreamResult = await storage.downloadJson(input.currentDreamDailyHash);
    if (dreamResult.success && dreamResult.data) {
      dailyDreams = Array.isArray(dreamResult.data) ? dreamResult.data : [dreamResult.data];
      log.debug('Daily dreams downloaded', { count: dailyDreams.length });
    }
  }

  // Download conversations
  if (input.currentConvDailyHash && input.currentConvDailyHash !== emptyHash) {
    const convResult = await storage.downloadJson(input.currentConvDailyHash);
    if (convResult.success && convResult.data) {
      dailyConversations = Array.isArray(convResult.data) ? convResult.data : [convResult.data];
      log.debug('Daily conversations downloaded', { count: dailyConversations.length });
    }
  }

  if (dailyDreams.length === 0 && dailyConversations.length === 0) {
    throw new Error('No daily data available for consolidation');
  }

  return { dailyDreams, dailyConversations };
});

const aiConsolidationService = fromPromise(async ({ input }: {
  input: {
    dailyDreams: any[];
    dailyConversations: any[];
    month: number;
    year: number;
    agentPersonality: any;
    walletAddress: string;
    modelId: string;
  }
}) => {
  log.debug('Generating AI consolidation', {
    dreamsCount: input.dailyDreams.length,
    conversationsCount: input.dailyConversations.length,
    month: input.month,
    year: input.year,
    modelId: input.modelId
  });

  const { buildMonthLearnConsolidationPrompt } = await import('../../prompts/monthLearnConsolidationPrompt');
  const { parseMonthLearnResponse } = await import('../../prompts/monthLearnResponseParser');

  const promptData = {
    dreams: input.dailyDreams,
    conversations: input.dailyConversations,
    month: input.month,
    year: input.year,
    agentPersonality: input.agentPersonality
  };

  const prompt = buildMonthLearnConsolidationPrompt(promptData);

  // Model routing
  const isGeminiModel = input.modelId.startsWith('gemini-');
  const endpoint = isGeminiModel ? '/gemini' : '/0g-compute';
  const apiUrl = process.env.NEXT_PUBLIC_COMPUTE_API_URL || 'http://localhost:3001/api';

  const requestBody = isGeminiModel ? {
    prompt: prompt,
    modelId: input.modelId
  } : {
    walletAddress: input.walletAddress,
    query: prompt,
    modelId: input.modelId
  };

  log.debug('Sending to AI', { endpoint, isGemini: isGeminiModel });

  const response = await fetch(`${apiUrl}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  const apiResult = await response.json();
  if (!apiResult.success) {
    throw new Error(apiResult.error || 'AI consolidation failed');
  }

  const aiResponse = isGeminiModel ? apiResult.data : apiResult.data.response;
  const parseResult = parseMonthLearnResponse(aiResponse);

  if (!parseResult.success) {
    throw new Error(`Parse failed: ${parseResult.error}`);
  }

  return {
    dreamConsolidation: parseResult.dreamConsolidation,
    conversationConsolidation: parseResult.conversationConsolidation
  };
});

const uploadMonthlyService = fromPromise(async ({ input }: {
  input: {
    dreamConsolidation: any | null;
    conversationConsolidation: any | null;
    lastDreamMonthlyHash: string | null;
    lastConvMonthlyHash: string | null;
    month: number;
    year: number;
  }
}) => {
  log.debug('Uploading monthly consolidations (APPEND pattern)');

  const storage = new XStateStorageService();
  const emptyHash = '0x0000000000000000000000000000000000000000000000000000000000000000';

  let dreamStorageHash: string | null = null;
  let conversationStorageHash: string | null = null;

  // Dreams APPEND
  if (input.dreamConsolidation) {
    let existing: any[] = [];

    if (input.lastDreamMonthlyHash && input.lastDreamMonthlyHash !== emptyHash) {
      const downloadResult = await storage.downloadJson(input.lastDreamMonthlyHash);
      if (downloadResult.success && downloadResult.data) {
        existing = Array.isArray(downloadResult.data) ? downloadResult.data : [downloadResult.data];
      }
    }

    existing.unshift(input.dreamConsolidation);
    const fileName = `dream_essence_monthly_${input.year}-${String(input.month).padStart(2, '0')}.json`;
    const { uploadJsonWithRetry } = await import('../services/storageRetryUploader');
    const dreamUpload = await uploadJsonWithRetry(existing, fileName, {
      enableVerification: true,
      maxRetries: 3,
      retryDelay: 1000,
      verificationTimeout: 10000
    });
    if (!dreamUpload.success || !dreamUpload.rootHash) {
      throw new Error(`Dream upload failed: ${dreamUpload.error || 'Unknown error'}`);
    }
    dreamStorageHash = dreamUpload.rootHash;
  }

  // Conversations APPEND
  if (input.conversationConsolidation) {
    let existing: any[] = [];

    if (input.lastConvMonthlyHash && input.lastConvMonthlyHash !== emptyHash) {
      const downloadResult = await storage.downloadJson(input.lastConvMonthlyHash);
      if (downloadResult.success && downloadResult.data) {
        existing = Array.isArray(downloadResult.data) ? downloadResult.data : [downloadResult.data];
      }
    }

    existing.unshift(input.conversationConsolidation);
    const convFileName = `conversation_essence_monthly_${input.year}-${String(input.month).padStart(2, '0')}.json`;
    const { uploadJsonWithRetry } = await import('../services/storageRetryUploader');
    const convUpload = await uploadJsonWithRetry(existing, convFileName, {
      enableVerification: true,
      maxRetries: 3,
      retryDelay: 1000,
      verificationTimeout: 10000
    });
    if (!convUpload.success || !convUpload.rootHash) {
      throw new Error(`Conversation upload failed: ${convUpload.error || 'Unknown error'}`);
    }
    conversationStorageHash = convUpload.rootHash;
  }

  return { dreamStorageHash, conversationStorageHash };
});

const contractUpdateService = fromPromise(async ({ input }: {
  input: {
    tokenId: number;
    dreamStorageHash: string | null;
    conversationStorageHash: string | null;
    month: number;
    year: number;
  }
}) => {
  log.debug('Updating contract with consolidation hashes', input);

  const { getViemSigner } = await import('../../lib/0g/fees');
  const { getContractConfig } = await import('../services/contractService');
  const { getActiveChain } = await import('../../config/chains');

  const [walletClient, walletErr] = await getViemSigner();
  if (!walletClient || walletErr) {
    throw new Error(`WalletClient error: ${walletErr?.message}`);
  }

  const [account] = await walletClient.getAddresses();
  if (!account) {
    throw new Error('No account available');
  }

  const contractConfig = getContractConfig();
  const emptyHash = '0x0000000000000000000000000000000000000000000000000000000000000000';

  const txHash = await walletClient.writeContract({
    address: contractConfig.address,
    abi: contractConfig.abi,
    functionName: 'consolidateMonth',
    chain: getActiveChain(),
    account,
    args: [
      BigInt(input.tokenId),
      (input.dreamStorageHash || emptyHash) as `0x${string}`,
      (input.conversationStorageHash || emptyHash) as `0x${string}`,
      input.month,
      input.year
    ]
  });

  return { txHash };
});

// Month-Learn State Machine
export const monthLearnMachine = setup({
  types: {} as {
    context: MonthLearnContext;
    events: MonthLearnEvent;
  },
  actors: {
    fetchMemoryHashes: fetchMemoryHashesService,
    downloadDaily: downloadDailyDataService,
    aiConsolidation: aiConsolidationService,
    uploadMonthly: uploadMonthlyService,
    contractUpdate: contractUpdateService
  },
  actions: {
    // Initialize
    initialize: assign({
      tokenId: ({ event }) => event.type === 'START' ? event.tokenId : null,
      agentName: ({ event }) => event.type === 'START' ? event.agentName : '',
      walletAddress: ({ event }) => event.type === 'START' ? event.walletAddress : null,
      modelId: ({ event }) => event.type === 'START' ? event.modelId : 'gemini-2.5-flash-auto',
      statusMessage: ({ event }) => `${event.type === 'START' ? event.agentName : 'Agent'} initiating monthly memory consolidation...`,
      errorMessage: null
    }),

    // Send initial message
    sendInitMessage: sendParent(({ context }) => ({
      type: 'APPEND_LINES',
      lines: [{
        type: 'info',
        content: `>> ${context.agentName} initiating monthly memory consolidation...`,
        timestamp: Date.now()
      }] as TerminalLine[]
    })),

    // Store memory hashes (sync assign from service result)
    storeMemoryHashes: assign({
      currentDreamDailyHash: ({ event }) => (event as any).output.currentDreamDailyHash,
      currentConvDailyHash: ({ event }) => (event as any).output.currentConvDailyHash,
      lastDreamMonthlyHash: ({ event }) => (event as any).output.lastDreamMonthlyHash,
      lastConvMonthlyHash: ({ event }) => (event as any).output.lastConvMonthlyHash,
      currentMonth: ({ event }) => (event as any).output.currentMonth,
      currentYear: ({ event }) => (event as any).output.currentYear,
      agentPersonality: ({ event }) => (event as any).output.agentPersonality
    }),

    // Store daily data
    storeDailyData: assign({
      dailyDreams: ({ event }) => (event as any).output.dailyDreams,
      dailyConversations: ({ event }) => (event as any).output.dailyConversations,
      statusMessage: ({ context }) => `${context.agentName} is analyzing subconscious patterns...`
    }),

    // Send loading START message (before download)
    sendLoadingStartMessage: sendParent(() => ({
      type: 'APPEND_LINES',
      lines: [
        {
          type: 'system',
          content: '>> Loading daily dreams from 0G Storage...',
          timestamp: Date.now()
        },
        {
          type: 'system',
          content: '>> Loading daily conversations from 0G Storage...',
          timestamp: Date.now() + 1
        }
      ] as TerminalLine[]
    })),

    // Send loading COMPLETE message (after download, with counts)
    sendLoadingCompleteMessage: sendParent(({ context }) => ({
      type: 'APPEND_LINES',
      lines: [{
        type: 'success',
        content: `Loaded ${context.dailyDreams.length} dreams and ${context.dailyConversations.length} conversations`,
        timestamp: Date.now()
      }] as TerminalLine[]
    })),

    // Store AI results
    storeConsolidation: assign({
      dreamConsolidation: ({ event }) => (event as any).output.dreamConsolidation,
      conversationConsolidation: ({ event }) => (event as any).output.conversationConsolidation,
      statusMessage: ({ context }) => `${context.agentName} is encoding neural patterns...`
    }),

    // Send AI START message
    sendAIStartMessage: sendParent(() => ({
      type: 'APPEND_LINES',
      lines: [{
        type: 'system',
        content: '>> Analyzing subconscious patterns with AI...',
        timestamp: Date.now()
      }] as TerminalLine[]
    })),

    // Send AI COMPLETE message
    sendAICompleteMessage: sendParent(() => ({
      type: 'APPEND_LINES',
      lines: [{
        type: 'success',
        content: 'AI consolidation completed',
        timestamp: Date.now()
      }] as TerminalLine[]
    })),

    // Store storage results
    storeStorageHashes: assign({
      dreamStorageHash: ({ event }) => (event as any).output.dreamStorageHash,
      conversationStorageHash: ({ event }) => (event as any).output.conversationStorageHash,
      statusMessage: ({ context }) => `${context.agentName} is updating blockchain...`
    }),

    // Send storage START message
    sendStorageStartMessage: sendParent(() => ({
      type: 'APPEND_LINES',
      lines: [{
        type: 'system',
        content: '>> Encoding neural patterns to 0G Storage...',
        timestamp: Date.now()
      }] as TerminalLine[]
    })),

    // Send storage COMPLETE message
    sendStorageCompleteMessage: sendParent(() => ({
      type: 'APPEND_LINES',
      lines: [{
        type: 'success',
        content: 'Storage upload completed',
        timestamp: Date.now()
      }] as TerminalLine[]
    })),

    // Store contract result
    storeContractResult: assign({
      contractTxHash: ({ event }) => (event as any).output.txHash,
      statusMessage: 'Month-learn consolidation completed!'
    }),

    // Send contract START message
    sendContractStartMessage: sendParent(() => ({
      type: 'APPEND_LINES',
      lines: [{
        type: 'system',
        content: '>> Upgrading consciousness parameters on blockchain...',
        timestamp: Date.now()
      }] as TerminalLine[]
    })),

    // Send contract COMPLETE message (with clickable TX hash link)
    sendContractCompleteMessage: sendParent(({ context }) => ({
      type: 'APPEND_LINES',
      lines: [{
        type: 'success',
        content: `✓ Month-learn consolidation completed successfully!`,
        timestamp: Date.now()
      }, {
        type: 'info',
        content: buildTxLinkContent(context.contractTxHash),
        timestamp: Date.now() + 1
      }, {
        type: 'system',
        content: 'Daily memory hashes cleared. Monthly essence preserved.',
        timestamp: Date.now() + 2
      }] as TerminalLine[]
    })),

    // Error handling
    storeError: assign({
      errorMessage: ({ event }) => {
        if ('error' in event) {
          return event.error instanceof Error ? event.error.message : String(event.error);
        }
        return 'Month-learn failed';
      },
      statusMessage: null
    }),

    sendErrorToParent: sendParent(({ context }) => ({
      type: 'APPEND_LINES',
      lines: [{
        type: 'error',
        content: `Error: ${context.errorMessage}`,
        timestamp: Date.now()
      }] as TerminalLine[]
    })),

    // Status updates
    sendStatusToParent: sendParent(({ context }) => ({
      type: 'UPDATE_STATUS',
      status: context.statusMessage
    }))
  }
}).createMachine({
  id: 'monthLearn',
  initial: 'idle',
  context: initialContext,

  states: {
    idle: {
      on: {
        START: {
          target: 'initializing',
          actions: ['initialize', 'sendInitMessage', 'sendStatusToParent']
        }
      }
    },

    initializing: {
      invoke: {
        src: 'fetchMemoryHashes',
        input: ({ context }) => ({ tokenId: context.tokenId! }),
        onDone: {
          target: 'loadingDailyData',
          actions: 'storeMemoryHashes'
        },
        onError: {
          target: 'error',
          actions: ['storeError', 'sendErrorToParent']
        }
      }
    },

    loadingDailyData: {
      entry: ['sendLoadingStartMessage', 'sendStatusToParent'],
      invoke: {
        src: 'downloadDaily',
        input: ({ context }) => ({
          tokenId: context.tokenId!,
          currentDreamDailyHash: context.currentDreamDailyHash,
          currentConvDailyHash: context.currentConvDailyHash
        }),
        onDone: {
          target: 'generatingConsolidation',
          actions: ['storeDailyData', 'sendLoadingCompleteMessage', 'sendStatusToParent']
        },
        onError: {
          target: 'error',
          actions: ['storeError', 'sendErrorToParent']
        }
      }
    },

    generatingConsolidation: {
      entry: ['sendAIStartMessage', 'sendStatusToParent'],
      invoke: {
        src: 'aiConsolidation',
        input: ({ context }) => ({
          dailyDreams: context.dailyDreams,
          dailyConversations: context.dailyConversations,
          month: context.currentMonth,
          year: context.currentYear,
          agentPersonality: context.agentPersonality || {},
          walletAddress: context.walletAddress!,
          modelId: context.modelId
        }),
        onDone: {
          target: 'uploadingToStorage',
          actions: ['storeConsolidation', 'sendAICompleteMessage', 'sendStatusToParent']
        },
        onError: {
          target: 'error',
          actions: ['storeError', 'sendErrorToParent']
        }
      }
    },

    uploadingToStorage: {
      entry: ['sendStorageStartMessage', 'sendStatusToParent'],
      invoke: {
        src: 'uploadMonthly',
        input: ({ context }) => ({
          dreamConsolidation: context.dreamConsolidation,
          conversationConsolidation: context.conversationConsolidation,
          lastDreamMonthlyHash: context.lastDreamMonthlyHash,
          lastConvMonthlyHash: context.lastConvMonthlyHash,
          month: context.currentMonth,
          year: context.currentYear
        }),
        onDone: {
          target: 'updatingContract',
          actions: ['storeStorageHashes', 'sendStorageCompleteMessage', 'sendStatusToParent']
        },
        onError: {
          target: 'error',
          actions: ['storeError', 'sendErrorToParent']
        }
      }
    },

    updatingContract: {
      entry: ['sendContractStartMessage', 'sendStatusToParent'],
      invoke: {
        src: 'contractUpdate',
        input: ({ context }) => ({
          tokenId: context.tokenId!,
          dreamStorageHash: context.dreamStorageHash,
          conversationStorageHash: context.conversationStorageHash,
          month: context.currentMonth,
          year: context.currentYear
        }),
        onDone: {
          target: 'completed',
          actions: ['storeContractResult', 'sendContractCompleteMessage']
        },
        onError: {
          target: 'error',
          actions: ['storeError', 'sendErrorToParent']
        }
      }
    },

    completed: {
      type: 'final',
      entry: [
        () => log.debug('Month-learn workflow completed'),
        sendParent({ type: 'MONTH_LEARN.COMPLETE' })
      ]
    },

    error: {
      entry: sendParent(() => ({
        type: 'UPDATE_STATUS',
        status: null
      })),
      always: 'completed'
    }
  }
});

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
          e.currentTarget.style.color = '#A855F7';
        },
        onMouseLeave: (e: React.MouseEvent<HTMLAnchorElement>) => {
          e.currentTarget.style.color = '#8B5CF6';
        }
      },
      `${txHash.slice(0, 10)}...${txHash.slice(-8)}`
    )
  );
}
