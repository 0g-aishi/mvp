/**
 * @fileoverview Agent Synchronization State Machine
 * @description Manages agent data synchronization with blockchain contract using XState and wagmi v2
 */

import { setup, assign, fromPromise } from 'xstate';
import { getContractConfig, ContractFunctions } from '../services/contractService';
import { logger } from '@/lib/logger';

const log = logger.child({ component: 'AgentMachine' });

interface AgentContext {
  status: 'uninitialized' | 'syncing' | 'connected' | 'no_agent' | 'error';
  walletAddress: string | null;
  tokenId: number | null;
  agentName: string | null;
  intelligenceLevel: number | null;
  dreamCount: number | null;
  conversationCount: number | null;
  errorMessage: string | null;
  syncProgress: string;
}

type AgentEvent =
  | { type: 'SYNC'; walletAddress: string; provider: any }
  | { type: 'RETRY' }
  | { type: 'REFRESH' }
  | { type: 'RESET' }
  | { type: 'xstate.done.actor.fetchAgentData'; output: { hasAgent: boolean; tokenId?: number; agentName?: string; intelligenceLevel?: number; dreamCount?: number; conversationCount?: number } }
  | { type: 'xstate.error.actor.fetchAgentData'; error: { message?: string } };

// Service to fetch agent data from contract using viem
const fetchAgentData = fromPromise(async ({ 
  input 
}: { 
  input: { walletAddress: string; provider: any } 
}) => {
  const contractConfig = getContractConfig();
  
  log.debug('Starting agent sync with viem', { 
    walletAddress: input.walletAddress,
    contractAddress: contractConfig.address,
    providerType: input.provider ? 'publicClient' : 'undefined',
    chainId: input.provider?.chain?.id
  });
  
  try {
    // Use viem publicClient directly
    const publicClient = input.provider;
    
    if (!publicClient) {
      throw new Error('No publicClient provided');
    }
    
    log.debug('PublicClient details', {
      chain: publicClient.chain?.name,
      chainId: publicClient.chain?.id,
      transport: publicClient.transport?.type
    });
    
    // Step 1: Get token ID for wallet using viem
    log.debug('Fetching token ID for wallet via viem readContract');
    const tokenId = await publicClient.readContract({
      address: contractConfig.address,
      abi: contractConfig.abi,
      functionName: ContractFunctions.OWNER_TO_TOKEN_ID,
      args: [input.walletAddress]
    });
    const tokenIdNumber = Number(tokenId);
    
    log.debug('Token ID retrieved', { tokenId: tokenIdNumber });
    
    // If no token ID (user has no agent)
    if (tokenIdNumber === 0) {
      log.debug('No agent found for wallet');
      return {
        hasAgent: false,
        tokenId: 0,
        agentName: null,
        intelligenceLevel: null,
        dreamCount: null,
        conversationCount: null
      };
    }
    
    // Step 2: Get agent data using token ID with viem
    log.debug('Fetching agent data for token via viem', { tokenId: tokenIdNumber });
    const agentData = await publicClient.readContract({
      address: contractConfig.address,
      abi: contractConfig.abi,
      functionName: ContractFunctions.AGENTS,
      args: [BigInt(tokenIdNumber)]
    });
    
    // Debug raw data structure from viem
    log.debug('Raw agent data from viem readContract', {
      dataType: typeof agentData,
      isArray: Array.isArray(agentData),
      hasAgentName: agentData?.agentName !== undefined,
      keys: agentData ? Object.keys(agentData) : [],
      firstFewKeys: agentData ? Object.keys(agentData).slice(0, 10) : [],
      rawData: agentData
    });
    
    // Viem returns structs as objects with named properties
    let agentName: string;
    let intelligenceLevel: number;
    let dreamCount: number;
    let conversationCount: number;
    
    // Viem should return object with named properties
    if (agentData && typeof agentData === 'object') {
      log.debug('Processing viem struct data');
      
      // Try named properties first (expected from viem)
      if ('agentName' in agentData) {
        log.debug('Using named properties from viem');
        agentName = agentData.agentName as string;
        intelligenceLevel = Number(agentData.intelligenceLevel || 0);
        dreamCount = Number(agentData.dreamCount || 0);
        conversationCount = Number(agentData.conversationCount || 0);
      }
      // Fallback to array access if needed
      else if (Array.isArray(agentData)) {
        log.debug('Using array access (unexpected from viem)');
        agentName = agentData[1] as string;
        intelligenceLevel = Number(agentData[4] || 0);
        dreamCount = Number(agentData[5] || 0);
        conversationCount = Number(agentData[6] || 0);
      }
      // Type assertion as last resort
      else {
        log.debug('Using type assertion for unknown structure');
        const data = agentData as any;
        agentName = data.agentName || data[1] || 'Unknown Agent';
        intelligenceLevel = Number(data.intelligenceLevel || data[4] || 0);
        dreamCount = Number(data.dreamCount || data[5] || 0);
        conversationCount = Number(data.conversationCount || data[6] || 0);
      }
    } else {
      throw new Error('Invalid agent data structure from contract');
    }
    
    log.debug('Agent data parsed successfully', {
      agentName,
      intelligenceLevel,
      dreamCount,
      conversationCount
    });
    
    return {
      hasAgent: true,
      tokenId: tokenIdNumber,
      agentName,
      intelligenceLevel,
      dreamCount,
      conversationCount
    };
  } catch (error: any) {
    log.debug('Error fetching agent data with viem', {
      message: error.message,
      stack: error.stack,
      errorType: error.constructor?.name,
      details: error.details || error.cause || 'No additional details'
    });
    
    // Provide more helpful error messages
    if (error.message?.includes('execution reverted')) {
      throw new Error('Contract call failed - check if contract is deployed on correct network');
    } else if (error.message?.includes('network')) {
      throw new Error('Network error - check your connection and chain settings');
    }
    
    throw error;
  }
});

export const agentMachine = setup({
  types: {} as {
    context: AgentContext;
    events: AgentEvent;
  },
  actors: {
    fetchAgentData
  },
  actions: {
    setWalletAddress: assign({
      walletAddress: ({ event }) => {
        if (event.type === 'SYNC') {
          return event.walletAddress;
        }
        return null;
      }
    }),
    
    setSyncingStatus: assign({
      status: 'syncing' as const,
      syncProgress: 'syncing with agent'
    }),
    
    setAgentData: assign({
      status: ({ event }) => {
        if (event.type === 'xstate.done.actor.fetchAgentData') {
          return event.output.hasAgent ? 'connected' as const : 'no_agent' as const;
        }
        return 'error' as const;
      },
      tokenId: ({ event }) => {
        if (event.type === 'xstate.done.actor.fetchAgentData') {
          return event.output.tokenId;
        }
        return null;
      },
      agentName: ({ event }) => {
        if (event.type === 'xstate.done.actor.fetchAgentData') {
          return event.output.agentName;
        }
        return null;
      },
      intelligenceLevel: ({ event }) => {
        if (event.type === 'xstate.done.actor.fetchAgentData') {
          return event.output.intelligenceLevel;
        }
        return null;
      },
      dreamCount: ({ event }) => {
        if (event.type === 'xstate.done.actor.fetchAgentData') {
          return event.output.dreamCount;
        }
        return null;
      },
      conversationCount: ({ event }) => {
        if (event.type === 'xstate.done.actor.fetchAgentData') {
          return event.output.conversationCount;
        }
        return null;
      },
      syncProgress: ({ event }) => {
        if (event.type === 'xstate.done.actor.fetchAgentData') {
          if (event.output.hasAgent) {
            return `connected ~ ${event.output.agentName}`;
          } else {
            return `no agent detected ~ go 'mint' section to create your first agent`;
          }
        }
        return '';
      }
    }),
    
    setError: assign({
      status: 'error' as const,
      errorMessage: ({ event }) => {
        if (event.type === 'xstate.error.actor.fetchAgentData') {
          const errorMsg = event.error?.message || 'Failed to sync with contract';
          log.debug('Setting error', { error: errorMsg });
          return errorMsg;
        }
        return null;
      },
      syncProgress: 'connection failed ~ check wallet connection'
    }),
    
    clearError: assign({
      errorMessage: null
    }),
    
    resetAgent: assign({
      status: 'uninitialized' as const,
      walletAddress: null,
      tokenId: null,
      agentName: null,
      intelligenceLevel: null,
      dreamCount: null,
      conversationCount: null,
      errorMessage: null,
      syncProgress: ''
    })
  }
}).createMachine({
  id: 'agent',
  initial: 'uninitialized',
  context: {
    status: 'uninitialized',
    walletAddress: null,
    tokenId: null,
    agentName: null,
    intelligenceLevel: null,
    dreamCount: null,
    conversationCount: null,
    errorMessage: null,
    syncProgress: ''
  },
  
  states: {
    uninitialized: {
      entry: () => log.debug('Agent machine initialized, waiting for SYNC event'),
      on: {
        SYNC: {
          target: 'syncing',
          actions: [
            'setWalletAddress',
            () => log.debug('SYNC event received, transitioning to syncing')
          ]
        }
      }
    },
    
    syncing: {
      entry: [
        'setSyncingStatus',
        () => log.debug('Entering syncing state, fetching agent data from contract')
      ],
      invoke: {
        id: 'fetchAgentData',
        src: 'fetchAgentData',
        input: ({ context, event }) => {
          const input = {
            walletAddress: event.type === 'SYNC' ? event.walletAddress : context.walletAddress!,
            provider: event.type === 'SYNC' ? event.provider : null
          };
          log.debug('Invoking fetchAgentData with input', input);
          return input;
        },
        onDone: [
          {
            target: 'connected',
            guard: ({ event }) => event.output.hasAgent === true,
            actions: 'setAgentData'
          },
          {
            target: 'no_agent',
            actions: 'setAgentData'
          }
        ],
        onError: {
          target: 'error',
          actions: 'setError'
        }
      }
    },
    
    connected: {
      entry: ({ context }) => {
        log.debug('Agent connected successfully', {
          agentName: context.agentName,
          tokenId: context.tokenId,
          intelligenceLevel: context.intelligenceLevel
        });
      },
      on: {
        REFRESH: 'syncing',
        RESET: {
          target: 'uninitialized',
          actions: 'resetAgent'
        }
      }
    },
    
    no_agent: {
      entry: ({ context }) => {
        log.debug('No agent detected for wallet', {
          walletAddress: context.walletAddress
        });
      },
      on: {
        REFRESH: 'syncing',
        RESET: {
          target: 'uninitialized',
          actions: 'resetAgent'
        }
      }
    },
    
    error: {
      entry: ({ context }) => {
        log.debug('Agent machine in error state', {
          error: context.errorMessage,
          walletAddress: context.walletAddress
        });
      },
      on: {
        RETRY: {
          target: 'syncing',
          actions: ['clearError', () => log.debug('Retrying agent sync')]
        },
        RESET: {
          target: 'uninitialized',
          actions: 'resetAgent'
        }
      }
    }
  }
});