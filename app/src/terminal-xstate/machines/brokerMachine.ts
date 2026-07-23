/**
 * @fileoverview Virtual Broker State Machine
 * @description Manages virtual broker state, balance, and funding operations using XState actor model
 */

import { setup, assign, fromPromise } from 'xstate';
import { logger } from '@/lib/logger';

const log = logger.child({ component: 'BrokerMachine' });

interface BrokerContext {
  status: 'uninitialized' | 'not_initialized' | 'initialized' | 'loading' | 'error';
  balance: number;
  walletAddress: string | null;
  errorMessage: string | null;
}

type BrokerEvent =
  | { type: 'INITIALIZE'; walletAddress: string }
  | { type: 'CREATE' }
  | { type: 'FUND'; amount: number; txHash?: string }
  | { type: 'UPDATE_BALANCE'; balance: number }
  | { type: 'REFRESH' }
  | { type: 'RETRY' }
  // XState actor completion events
  | { type: 'xstate.done.actor.fetchBrokerStatus'; output: { exists: boolean; balance: number } }
  | { type: 'xstate.done.actor.createBroker'; output: { success: boolean; balance: number; message?: string } }
  | { type: 'xstate.done.actor.fundBroker'; output: { success: boolean; balance: number; txHash?: string; message?: string } }
  // XState actor error events
  | { type: 'xstate.error.actor.fetchBrokerStatus'; error: { message?: string } }
  | { type: 'xstate.error.actor.createBroker'; error: { message?: string } }
  | { type: 'xstate.error.actor.fundBroker'; error: { message?: string } };

// API service actors
const fetchBrokerStatus = fromPromise(async ({ input }: { input: { walletAddress: string } }) => {
  const API_URL = process.env.NEXT_PUBLIC_COMPUTE_API_URL || 'http://localhost:3001/api';
  
  log.debug('Fetching broker status', { walletAddress: input.walletAddress, API_URL });
  
  try {
    const response = await fetch(`${API_URL}/balance/${input.walletAddress}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    log.debug('Balance API response', { 
      status: response.status, 
      ok: response.ok,
      statusText: response.statusText 
    });
    
    // Handle 404 - broker doesn't exist
    if (response.status === 404) {
      log.debug('Broker not found (404), returning exists: false');
      // Try to get error message from response
      try {
        const errorData = await response.json();
        log.debug('404 error data', errorData);
      } catch (e) {
        log.debug('Could not parse 404 response body');
      }
      return { exists: false, balance: 0 };
    }
    
    // Handle 500 with specific "No virtual broker found" message
    if (response.status === 500) {
      try {
        const errorData = await response.json();
        log.debug('500 error response', errorData);
        
        // Check if this is a "broker not found" error from backend
        if (errorData.error && errorData.error.includes('No virtual broker found')) {
          log.debug('Broker not found (500 with specific message), returning exists: false');
          return { exists: false, balance: 0 };
        }
        
        // Otherwise it's a real error
        throw new Error(`Server error: ${errorData.error || response.statusText}`);
      } catch (parseError) {
        // If we can't parse the JSON, try text
        const errorText = await response.text();
        log.debug('Could not parse 500 response as JSON', { errorText });
        
        // Check if text contains the broker not found message
        if (errorText.includes('No virtual broker found')) {
          log.debug('Broker not found (500 with text message), returning exists: false');
          return { exists: false, balance: 0 };
        }
        
        throw new Error(`Failed to fetch broker status: ${response.status} ${response.statusText}`);
      }
    }
    
    // Handle other non-OK responses
    if (!response.ok) {
      const errorText = await response.text();
      log.debug('API error response', { status: response.status, errorText });
      throw new Error(`Failed to fetch broker status: ${response.status} ${response.statusText}`);
    }
    
    // Parse successful response
    const data = await response.json();
    log.debug('Balance data received', data);
    
    // Check if broker exists based on response
    if (data.success && data.data) {
      return {
        exists: true,
        balance: data.data.balance || 0
      };
    } else {
      log.debug('Unexpected response format, assuming broker does not exist', data);
      return { exists: false, balance: 0 };
    }
  } catch (error: any) {
    log.debug('Error fetching broker status', { 
      message: error.message,
      stack: error.stack 
    });
    throw error;
  }
});

const createBroker = fromPromise(async ({ input }: { input: { walletAddress: string } }) => {
  const API_URL = process.env.NEXT_PUBLIC_COMPUTE_API_URL || 'http://localhost:3001/api';
  
  log.debug('Creating broker', { 
    walletAddress: input.walletAddress,
    API_URL,
    endpoint: `${API_URL}/create-broker`
  });
  
  try {
    const response = await fetch(`${API_URL}/create-broker`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress: input.walletAddress })
    });
    
    log.debug('Create broker response', { 
      status: response.status, 
      ok: response.ok,
      statusText: response.statusText
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      log.debug('Create broker error response', { 
        status: response.status,
        errorText 
      });
      throw new Error(`Failed to create broker: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    log.debug('Broker created successfully', data);
    
    return {
      balance: data.data?.balance || 0
    };
  } catch (error: any) {
    log.debug('Error creating broker', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
});

const fundBroker = fromPromise(async ({ input }: { input: { walletAddress: string; amount: number } }) => {
  const API_URL = process.env.NEXT_PUBLIC_COMPUTE_API_URL || 'http://localhost:3001/api';
  
  log.debug('Funding broker', { walletAddress: input.walletAddress, amount: input.amount });
  
  const response = await fetch(`${API_URL}/fund`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress: input.walletAddress,
      amount: input.amount,
      txHash: undefined // Optional, can be added later if needed
    })
  });
  
  log.debug('Fund broker response', { status: response.status, ok: response.ok });
  
  if (!response.ok) {
    const errorText = await response.text();
    log.debug('Fund broker error', errorText);
    throw new Error(`Failed to fund broker: ${response.statusText}`);
  }
  
  const data = await response.json();
  log.debug('Broker funded', data);
  
  return {
    balance: data.data?.balance || 0
  };
});

export const brokerMachine = setup({
  types: {} as {
    context: BrokerContext;
    events: BrokerEvent;
  },
  actors: {
    fetchBrokerStatus,
    createBroker,
    fundBroker
  },
  actions: {
    setWalletAddress: assign({
      walletAddress: ({ event }) => {
        if (event.type === 'INITIALIZE') {
          return event.walletAddress;
        }
        return null;
      }
    }),
    
    updateBalance: assign({
      balance: ({ event }) => {
        if (event.type === 'UPDATE_BALANCE') {
          return event.balance;
        }
        return 0;
      }
    }),
    
    setBalanceFromResponse: assign({
      balance: ({ event }) => {
        if (event.type === 'xstate.done.actor.fetchBrokerStatus') {
          return event.output.balance;
        }
        if (event.type === 'xstate.done.actor.createBroker') {
          return event.output.balance;
        }
        if (event.type === 'xstate.done.actor.fundBroker') {
          return event.output.balance;
        }
        return 0;
      }
    }),
    
    setError: assign({
      errorMessage: ({ event }) => {
        if (event.type === 'xstate.error.actor.fetchBrokerStatus' ||
            event.type === 'xstate.error.actor.createBroker' ||
            event.type === 'xstate.error.actor.fundBroker') {
          const errorMsg = event.error?.message || 'Unknown error occurred';
          log.debug('Setting error', { 
            eventType: event.type,
            error: errorMsg,
            fullError: event.error 
          });
          return errorMsg;
        }
        return null;
      },
      status: 'error' as const
    }),
    
    clearError: assign({
      errorMessage: null
    })
  },
  guards: {
    brokerExists: ({ event }) => {
      if (event.type === 'xstate.done.actor.fetchBrokerStatus') {
        return event.output.exists === true;
      }
      return false;
    },
    
    hasWalletAddress: ({ context }) => {
      return context.walletAddress !== null;
    }
  }
}).createMachine({
  id: 'broker',
  initial: 'uninitialized',
  context: {
    status: 'uninitialized',
    balance: 0,
    walletAddress: null,
    errorMessage: null
  },
  
  states: {
    uninitialized: {
      entry: assign({ status: 'uninitialized' as const }),
      on: {
        INITIALIZE: {
          target: 'checking',
          actions: 'setWalletAddress'
        }
      }
    },
    
    checking: {
      entry: assign({ status: 'loading' as const }),
      invoke: {
        id: 'fetchBrokerStatus',
        src: 'fetchBrokerStatus',
        input: ({ context }) => ({ walletAddress: context.walletAddress! }),
        onDone: [
          {
            target: 'initialized',
            guard: 'brokerExists',
            actions: 'setBalanceFromResponse'
          },
          {
            target: 'not_initialized'
          }
        ],
        onError: {
          target: 'error',
          actions: 'setError'
        }
      }
    },
    
    not_initialized: {
      entry: [
        assign({ status: 'not_initialized' as const }),
        () => log.debug('Entered not_initialized state - broker does not exist')
      ],
      on: {
        CREATE: {
          target: 'creating',
          actions: () => log.debug('CREATE event received, transitioning to creating state')
        },
        REFRESH: {
          target: 'checking',
          guard: 'hasWalletAddress'
        }
      }
    },
    
    creating: {
      entry: assign({ status: 'loading' as const }),
      invoke: {
        id: 'createBroker',
        src: 'createBroker',
        input: ({ context }) => ({ walletAddress: context.walletAddress! }),
        onDone: {
          target: 'initialized',
          actions: 'setBalanceFromResponse'
        },
        onError: {
          target: 'error',
          actions: 'setError'
        }
      }
    },
    
    initialized: {
      entry: assign({ status: 'initialized' as const }),
      on: {
        FUND: 'funding',
        UPDATE_BALANCE: {
          actions: 'updateBalance'
        },
        REFRESH: {
          target: 'checking',
          guard: 'hasWalletAddress'
        }
      }
    },
    
    funding: {
      entry: assign({ status: 'loading' as const }),
      invoke: {
        id: 'fundBroker',
        src: 'fundBroker',
        input: ({ context, event }) => ({
          walletAddress: context.walletAddress!,
          amount: event.type === 'FUND' ? event.amount : 0.01
        }),
        onDone: {
          target: 'initialized',
          actions: 'setBalanceFromResponse'
        },
        onError: {
          target: 'error',
          actions: 'setError'
        }
      }
    },
    
    error: {
      entry: assign({ status: 'error' as const }),
      on: {
        RETRY: {
          target: 'checking',
          guard: 'hasWalletAddress',
          actions: 'clearError'
        },
        INITIALIZE: {
          target: 'checking',
          actions: ['setWalletAddress', 'clearError']
        }
      }
    }
  }
});