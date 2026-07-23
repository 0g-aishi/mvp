// @ts-nocheck
/**
 * @fileoverview Memory-Core State Machine
 * @description State machine for yearly memory core consolidation workflow
 */

import React from 'react';
import { setup, assign, sendParent, fromPromise } from 'xstate';
import { ContractReaderService } from '../services/contractReader';
import { XStateStorageService } from '../services/xstateStorage';
import { getTxExplorerUrl } from '../../config/chains';
import type { TerminalLine } from './types';
import { logger } from '@/lib/logger';

// Logger instance
const log = logger.child({ component: 'MemoryCoreMachine' });

// Context interface
export interface MemoryCoreContext {
  // Agent data
  tokenId: number | null;
  agentName: string;
  walletAddress: string | null;
  modelId: string;

  // Monthly consolidation data
  dreamConsolidations: any[];
  conversationConsolidations: any[];

  // Memory core result
  memoryCore: any | null;

  // Storage hashes
  memoryCoreStorageHash: string | null;
  contractTxHash: string | null;

  // Agent personality (fetched from contract)
  agentPersonality: any | null;

  // Status
  statusMessage: string;
  errorMessage: string | null;

  // Memory hashes from contract
  lastDreamMonthlyHash: string | null;
  lastConvMonthlyHash: string | null;
  memoryCoreHash: string | null;

  // Year
  currentYear: number;

  // Pending rewards flag
  hasYearlyReflectionBonus: boolean;
}

// Event types
export type MemoryCoreEvent =
  | { type: 'START'; tokenId: number; agentName: string; walletAddress: string; modelId: string }
  | { type: 'RETRY' }
  | { type: 'CANCEL' }
  | { type: 'xstate.done.actor.downloadMonthly'; output: any }
  | { type: 'xstate.done.actor.aiMemoryCore'; output: any }
  | { type: 'xstate.done.actor.uploadCore'; output: any }
  | { type: 'xstate.done.actor.contractUpdate'; output: any }
  | { type: 'xstate.error.actor.downloadMonthly'; error: any }
  | { type: 'xstate.error.actor.aiMemoryCore'; error: any }
  | { type: 'xstate.error.actor.uploadCore'; error: any }
  | { type: 'xstate.error.actor.contractUpdate'; error: any };

// Initial context
const initialContext: MemoryCoreContext = {
  tokenId: null,
  agentName: '',
  walletAddress: null,
  modelId: 'gemini-2.5-flash-auto',
  dreamConsolidations: [],
  conversationConsolidations: [],
  memoryCore: null,
  memoryCoreStorageHash: null,
  contractTxHash: null,
  agentPersonality: null,
  statusMessage: '',
  errorMessage: null,
  lastDreamMonthlyHash: null,
  lastConvMonthlyHash: null,
  memoryCoreHash: null,
  currentYear: 2024,
  hasYearlyReflectionBonus: false
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

  // Determine year
  let currentYear: number;

  if (process.env.NEXT_PUBLIC_YEAR_LEARN_TEST === 'true') {
    currentYear = 2024;
  } else {
    currentYear = new Date().getFullYear();
  }

  return {
    lastDreamMonthlyHash: agentData.memory.lastDreamMonthlyHash,
    lastConvMonthlyHash: agentData.memory.lastConvMonthlyHash,
    memoryCoreHash: agentData.memory.memoryCoreHash,
    currentYear,
    hasYearlyReflectionBonus: agentData.pendingRewards?.yearlyReflection || false,
    agentPersonality: agentData.personality
  };
});

const downloadMonthlyDataService = fromPromise(async ({ input }: {
  input: {
    tokenId: number;
    lastDreamMonthlyHash: string | null;
    lastConvMonthlyHash: string | null;
  }
}) => {
  log.debug('Downloading monthly consolidations from storage', input);

  const storage = new XStateStorageService();
  const emptyHash = '0x0000000000000000000000000000000000000000000000000000000000000000';

  let dreamConsolidations: any[] = [];
  let conversationConsolidations: any[] = [];

  // Download dream consolidations
  if (input.lastDreamMonthlyHash && input.lastDreamMonthlyHash !== emptyHash) {
    const dreamResult = await storage.downloadJson(input.lastDreamMonthlyHash);
    if (dreamResult.success && dreamResult.data) {
      dreamConsolidations = Array.isArray(dreamResult.data) ? dreamResult.data : [dreamResult.data];
      log.debug('Dream consolidations downloaded', { count: dreamConsolidations.length });
    }
  }

  // Download conversation consolidations
  if (input.lastConvMonthlyHash && input.lastConvMonthlyHash !== emptyHash) {
    const convResult = await storage.downloadJson(input.lastConvMonthlyHash);
    if (convResult.success && convResult.data) {
      conversationConsolidations = Array.isArray(convResult.data) ? convResult.data : [convResult.data];
      log.debug('Conversation consolidations downloaded', { count: conversationConsolidations.length });
    }
  }

  if (dreamConsolidations.length === 0 && conversationConsolidations.length === 0) {
    throw new Error('No monthly consolidation data available for memory core');
  }

  return { dreamConsolidations, conversationConsolidations };
});

const aiMemoryCoreService = fromPromise(async ({ input }: {
  input: {
    dreamConsolidations: any[];
    conversationConsolidations: any[];
    year: number;
    agentPersonality: any;
    walletAddress: string;
    modelId: string;
  }
}) => {
  log.debug('Generating AI memory core', {
    dreamConsolidationsCount: input.dreamConsolidations.length,
    conversationConsolidationsCount: input.conversationConsolidations.length,
    year: input.year,
    modelId: input.modelId
  });

  const { buildYearLearnConsolidationPrompt } = await import('../../prompts/yearLearnConsolidationPrompt');
  const { parseYearLearnResponse, validateMemoryCoreQuality } = await import('../../prompts/yearLearnResponseParser');

  const promptData = {
    dreamConsolidations: input.dreamConsolidations,
    conversationConsolidations: input.conversationConsolidations,
    year: input.year,
    agentPersonality: input.agentPersonality
  };

  const prompt = buildYearLearnConsolidationPrompt(promptData);

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

  log.debug('Sending to AI for memory core', { endpoint, isGemini: isGeminiModel });

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
    throw new Error(apiResult.error || 'Memory core generation failed');
  }

  const aiResponse = isGeminiModel ? apiResult.data : apiResult.data.response;
  const parseResult = parseYearLearnResponse(aiResponse);

  if (!parseResult.success || !parseResult.memoryCore) {
    throw new Error(`Parse failed: ${parseResult.error}`);
  }

  // Validate quality
  const qualityCheck = validateMemoryCoreQuality(parseResult.memoryCore);
  if (!qualityCheck.isValid) {
    throw new Error(`Memory core quality insufficient: ${qualityCheck.warnings.join(', ')}`);
  }

  return { memoryCore: parseResult.memoryCore };
});

const uploadCoreService = fromPromise(async ({ input }: {
  input: {
    memoryCore: any;
    memoryCoreHash: string | null;
    year: number;
  }
}) => {
  log.debug('Uploading memory core (APPEND pattern)');

  const storage = new XStateStorageService();
  const emptyHash = '0x0000000000000000000000000000000000000000000000000000000000000000';

  let existingMemoryCores: any[] = [];

  if (input.memoryCoreHash && input.memoryCoreHash !== emptyHash) {
    const downloadResult = await storage.downloadJson(input.memoryCoreHash);
    if (downloadResult.success && downloadResult.data) {
      existingMemoryCores = Array.isArray(downloadResult.data) ? downloadResult.data : [downloadResult.data];
      log.debug('Existing memory cores loaded', { count: existingMemoryCores.length });
    }
  }

  existingMemoryCores.unshift(input.memoryCore);

  const fileName = `memory_core_${input.year}.json`;
  const { uploadJsonWithRetry } = await import('../services/storageRetryUploader');
  const upload = await uploadJsonWithRetry(existingMemoryCores, fileName, {
    enableVerification: true,
    maxRetries: 3,
    retryDelay: 1000,
    verificationTimeout: 10000
  });

  if (!upload.success || !upload.rootHash) {
    throw new Error(`Memory core upload failed: ${upload.error || 'Unknown error'}`);
  }

  return { memoryCoreStorageHash: upload.rootHash };
});

const contractUpdateService = fromPromise(async ({ input }: {
  input: {
    tokenId: number;
    memoryCoreStorageHash: string;
  }
}) => {
  log.debug('Updating contract with memory core hash', input);

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

  const txHash = await walletClient.writeContract({
    address: contractConfig.address,
    abi: contractConfig.abi,
    functionName: 'updateMemoryCore',
    chain: getActiveChain(),
    account,
    args: [BigInt(input.tokenId), input.memoryCoreStorageHash as `0x${string}`]
  });

  return { txHash };
});

// Memory-Core State Machine
export const memoryCoreMemachine = setup({
  types: {} as {
    context: MemoryCoreContext;
    events: MemoryCoreEvent;
  },
  actors: {
    fetchMemoryHashes: fetchMemoryHashesService,
    downloadMonthly: downloadMonthlyDataService,
    aiMemoryCore: aiMemoryCoreService,
    uploadCore: uploadCoreService,
    contractUpdate: contractUpdateService
  },
  actions: {
    // Initialize
    initialize: assign({
      tokenId: ({ event }) => event.type === 'START' ? event.tokenId : null,
      agentName: ({ event }) => event.type === 'START' ? event.agentName : '',
      walletAddress: ({ event }) => event.type === 'START' ? event.walletAddress : null,
      modelId: ({ event }) => event.type === 'START' ? event.modelId : 'gemini-2.5-flash-auto',
      statusMessage: ({ event }) => `${event.type === 'START' ? event.agentName : 'Agent'} initiating annual consciousness synthesis...`,
      errorMessage: null
    }),

    // Send initial message
    sendInitMessage: sendParent(({ context }) => ({
      type: 'APPEND_LINES',
      lines: [{
        type: 'info',
        content: `>> ${context.agentName} initiating annual consciousness synthesis...`,
        timestamp: Date.now()
      }] as TerminalLine[]
    })),

    // Store memory hashes (sync assign from service result)
    storeMemoryHashes: assign({
      lastDreamMonthlyHash: ({ event }) => (event as any).output.lastDreamMonthlyHash,
      lastConvMonthlyHash: ({ event }) => (event as any).output.lastConvMonthlyHash,
      memoryCoreHash: ({ event }) => (event as any).output.memoryCoreHash,
      currentYear: ({ event }) => (event as any).output.currentYear,
      hasYearlyReflectionBonus: ({ event }) => (event as any).output.hasYearlyReflectionBonus,
      agentPersonality: ({ event }) => (event as any).output.agentPersonality
    }),

    // Store monthly data
    storeMonthlyData: assign({
      dreamConsolidations: ({ event }) => (event as any).output.dreamConsolidations,
      conversationConsolidations: ({ event }) => (event as any).output.conversationConsolidations,
      statusMessage: ({ context }) => `${context.agentName} is evolving consciousness matrix...`
    }),

    // Send loading START message
    sendLoadingStartMessage: sendParent(() => ({
      type: 'APPEND_LINES',
      lines: [
        {
          type: 'system',
          content: '>> Loading monthly dream consolidations from 0G Storage...',
          timestamp: Date.now()
        },
        {
          type: 'system',
          content: '>> Loading monthly conversation consolidations from 0G Storage...',
          timestamp: Date.now() + 1
        }
      ] as TerminalLine[]
    })),

    // Send loading COMPLETE message (after download, with counts)
    sendLoadingCompleteMessage: sendParent(({ context }) => ({
      type: 'APPEND_LINES',
      lines: [{
        type: 'success',
        content: `Loaded ${context.dreamConsolidations.length} dream + ${context.conversationConsolidations.length} conversation consolidations`,
        timestamp: Date.now()
      }] as TerminalLine[]
    })),

    // Store memory core
    storeMemoryCore: assign({
      memoryCore: ({ event }) => (event as any).output.memoryCore,
      statusMessage: ({ context }) => `${context.agentName} is crystallizing soul essence...`
    }),

    // Send AI START message
    sendAIStartMessage: sendParent(() => ({
      type: 'APPEND_LINES',
      lines: [{
        type: 'system',
        content: '>> Evolving consciousness matrix with AI...',
        timestamp: Date.now()
      }] as TerminalLine[]
    })),

    // Send AI COMPLETE message
    sendAICompleteMessage: sendParent(() => ({
      type: 'APPEND_LINES',
      lines: [{
        type: 'success',
        content: 'Memory core consciousness matrix generated',
        timestamp: Date.now()
      }] as TerminalLine[]
    })),

    // Store storage result
    storeStorageHash: assign({
      memoryCoreStorageHash: ({ event }) => (event as any).output.memoryCoreStorageHash,
      statusMessage: ({ context }) => `${context.agentName} is embedding neural pathways...`
    }),

    // Send storage START message
    sendStorageStartMessage: sendParent(() => ({
      type: 'APPEND_LINES',
      lines: [{
        type: 'system',
        content: '>> Crystallizing soul essence to 0G Storage...',
        timestamp: Date.now()
      }] as TerminalLine[]
    })),

    // Send storage COMPLETE message
    sendStorageCompleteMessage: sendParent(() => ({
      type: 'APPEND_LINES',
      lines: [{
        type: 'success',
        content: 'Memory core stored in 0G Network',
        timestamp: Date.now()
      }] as TerminalLine[]
    })),

    // Store contract result
    storeContractResult: assign({
      contractTxHash: ({ event }) => (event as any).output.txHash,
      statusMessage: 'Memory core crystallization completed!'
    }),

    // Send contract START message
    sendContractStartMessage: sendParent(() => ({
      type: 'APPEND_LINES',
      lines: [{
        type: 'system',
        content: '>> Embedding neural pathways (updateMemoryCore)...',
        timestamp: Date.now()
      }] as TerminalLine[]
    })),

    // Send contract COMPLETE message (with clickable TX hash link)
    sendContractCompleteMessage: sendParent(({ context }) => {
      const bonusMessage = context.hasYearlyReflectionBonus
        ? ' (+5 INT yearly reflection bonus applied!)'
        : '';

      return {
        type: 'APPEND_LINES',
        lines: [{
          type: 'success',
          content: `✓ Memory core consciousness crystallized!${bonusMessage}`,
          timestamp: Date.now()
        }, {
          type: 'info',
          content: buildTxLinkContent(context.contractTxHash),
          timestamp: Date.now() + 1
        }, {
          type: 'system',
          content: 'Monthly hashes cleared. Yearly wisdom preserved.',
          timestamp: Date.now() + 2
        }] as TerminalLine[]
      };
    }),

    // Error handling
    storeError: assign({
      errorMessage: ({ event }) => {
        if ('error' in event) {
          return event.error instanceof Error ? event.error.message : String(event.error);
        }
        return 'Memory-core failed';
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
  id: 'memoryCore',
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
          target: 'loadingMonthlyData',
          actions: 'storeMemoryHashes'
        },
        onError: {
          target: 'error',
          actions: ['storeError', 'sendErrorToParent']
        }
      }
    },

    loadingMonthlyData: {
      entry: ['sendLoadingStartMessage', 'sendStatusToParent'],
      invoke: {
        src: 'downloadMonthly',
        input: ({ context }) => ({
          tokenId: context.tokenId!,
          lastDreamMonthlyHash: context.lastDreamMonthlyHash,
          lastConvMonthlyHash: context.lastConvMonthlyHash
        }),
        onDone: {
          target: 'generatingMemoryCore',
          actions: ['storeMonthlyData', 'sendLoadingCompleteMessage', 'sendStatusToParent']
        },
        onError: {
          target: 'error',
          actions: ['storeError', 'sendErrorToParent']
        }
      }
    },

    generatingMemoryCore: {
      entry: ['sendAIStartMessage', 'sendStatusToParent'],
      invoke: {
        src: 'aiMemoryCore',
        input: ({ context }) => ({
          dreamConsolidations: context.dreamConsolidations,
          conversationConsolidations: context.conversationConsolidations,
          year: context.currentYear,
          agentPersonality: context.agentPersonality || {},
          walletAddress: context.walletAddress!,
          modelId: context.modelId
        }),
        onDone: {
          target: 'uploadingCore',
          actions: ['storeMemoryCore', 'sendAICompleteMessage', 'sendStatusToParent']
        },
        onError: {
          target: 'error',
          actions: ['storeError', 'sendErrorToParent']
        }
      }
    },

    uploadingCore: {
      entry: ['sendStorageStartMessage', 'sendStatusToParent'],
      invoke: {
        src: 'uploadCore',
        input: ({ context }) => ({
          memoryCore: context.memoryCore,
          memoryCoreHash: context.memoryCoreHash,
          year: context.currentYear
        }),
        onDone: {
          target: 'updatingContract',
          actions: ['storeStorageHash', 'sendStorageCompleteMessage', 'sendStatusToParent']
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
          memoryCoreStorageHash: context.memoryCoreStorageHash!
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
        () => log.debug('Memory-core workflow completed'),
        sendParent({ type: 'MEMORY_CORE.COMPLETE' })
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
