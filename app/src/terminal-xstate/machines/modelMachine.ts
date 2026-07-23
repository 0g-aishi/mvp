/**
 * @fileoverview AI Model Selection State Machine
 * @description Manages AI model selection state and synchronization with localStorage
 */

import { setup, assign, fromPromise } from 'xstate';
import { logger } from '@/lib/logger';

const log = logger.child({ component: 'ModelMachine' });

interface Model {
  id: string;
  name: string;
  provider: string;
  needsBroker: boolean;
}

interface ModelContext {
  selectedModel: string | null;
  availableModels: Model[];
  isLoading: boolean;
  errorMessage: string | null;
}

type ModelEvent =
  | { type: 'SELECT_MODEL'; modelId: string }
  | { type: 'DISCOVER_MODELS' }
  | { type: 'REFRESH' }
  | { type: 'SET_MODEL_FROM_STORAGE'; modelId: string }
  // XState actor completion events
  | { type: 'xstate.done.actor.discoverModels'; output: Model[] }
  | { type: 'xstate.done.actor.loadModelFromStorage'; output: string | null }
  // XState actor error events
  | { type: 'xstate.error.actor.discoverModels'; error: { message?: string } }
  | { type: 'xstate.error.actor.loadModelFromStorage'; error: { message?: string } };

// Service to discover available models
const discoverModels = fromPromise(async () => {
  const BACKEND_URL = process.env.NEXT_PUBLIC_COMPUTE_API_URL || 'http://localhost:3001/api';
  
  try {
    const response = await fetch(`${BACKEND_URL}/models/discover`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to discover models: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.data?.models) {
      // Transform models to our format
      return data.data.models.map((model: any) => ({
        id: model.id,
        name: model.name,
        provider: model.provider || 'unknown',
        needsBroker: model.provider === '0g' || model.provider === '0G'
      }));
    }
    
    return [];
  } catch (error) {
    log.error('Error discovering models', { error });
    // Return some default models if discovery fails
    return [
      { id: 'auto', name: 'Auto Select', provider: 'system', needsBroker: false },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'google', needsBroker: false },
      { id: 'llama', name: 'Llama', provider: '0g', needsBroker: true }
    ];
  }
});

// Service to save model to localStorage
const saveModelToStorage = fromPromise(async ({ input }: { input: { modelId: string } }) => {
  try {
    localStorage.setItem('aishi-selected-model', input.modelId);
    return input.modelId;
  } catch (error) {
    log.error('Failed to save model to localStorage', { error });
    throw error;
  }
});

// Service to load model from localStorage
const loadModelFromStorage = fromPromise(async () => {
  try {
    const saved = localStorage.getItem('aishi-selected-model');
    return saved || 'auto';
  } catch (error) {
    log.error('Failed to load model from localStorage', { error });
    return 'auto';
  }
});

export const modelMachine = setup({
  types: {} as {
    context: ModelContext;
    events: ModelEvent;
  },
  actors: {
    discoverModels,
    saveModelToStorage,
    loadModelFromStorage
  },
  actions: {
    setSelectedModel: assign({
      selectedModel: ({ event }) => {
        if (event.type === 'SELECT_MODEL') {
          return event.modelId;
        }
        if (event.type === 'SET_MODEL_FROM_STORAGE') {
          return event.modelId;
        }
        return 'auto';
      }
    }),
    
    setAvailableModels: assign({
      availableModels: ({ event }) => {
        if (event.type === 'xstate.done.actor.discoverModels') {
          return event.output;
        }
        return [];
      }
    }),
    
    setLoadingTrue: assign({
      isLoading: true
    }),
    
    setLoadingFalse: assign({
      isLoading: false
    }),
    
    setError: assign({
      errorMessage: ({ event }) => {
        if (event.type === 'xstate.error.actor.discoverModels') {
          return 'Failed to discover models';
        }
        return null;
      }
    }),
    
    clearError: assign({
      errorMessage: null
    }),
    
    setModelFromStorage: assign({
      selectedModel: ({ event }) => {
        if (event.type === 'xstate.done.actor.loadModelFromStorage') {
          return event.output;
        }
        return 'auto';
      }
    })
  },
  guards: {
    modelNeedsBroker: ({ context }) => {
      if (!context.selectedModel) return false;
      
      const model = context.availableModels.find(m => m.id === context.selectedModel);
      return model?.needsBroker === true;
    }
  }
}).createMachine({
  id: 'model',
  initial: 'loading',
  context: {
    selectedModel: 'auto',
    availableModels: [],
    isLoading: false,
    errorMessage: null
  },
  
  states: {
    loading: {
      entry: 'setLoadingTrue',
      invoke: [
        {
          id: 'loadModelFromStorage',
          src: 'loadModelFromStorage',
          onDone: {
            actions: 'setModelFromStorage'
          }
        },
        {
          id: 'discoverModels',
          src: 'discoverModels',
          onDone: {
            target: 'idle',
            actions: ['setAvailableModels', 'setLoadingFalse']
          },
          onError: {
            target: 'idle',
            actions: ['setError', 'setLoadingFalse']
          }
        }
      ]
    },
    
    idle: {
      on: {
        SELECT_MODEL: {
          target: 'savingSelection',
          actions: 'setSelectedModel'
        },
        REFRESH: 'discovering',
        SET_MODEL_FROM_STORAGE: {
          actions: 'setSelectedModel'
        }
      }
    },
    
    savingSelection: {
      invoke: {
        id: 'saveModelToStorage',
        src: 'saveModelToStorage',
        input: ({ context }) => ({ modelId: context.selectedModel! }),
        onDone: [
          {
            target: 'brokerRequired',
            guard: 'modelNeedsBroker'
          },
          {
            target: 'idle'
          }
        ],
        onError: 'idle'
      }
    },
    
    brokerRequired: {
      // This state signals that broker initialization is needed
      after: {
        100: 'idle'
      }
    },
    
    discovering: {
      entry: 'setLoadingTrue',
      invoke: {
        id: 'discoverModelsRefresh',
        src: 'discoverModels',
        onDone: {
          target: 'idle',
          actions: ['setAvailableModels', 'setLoadingFalse', 'clearError']
        },
        onError: {
          target: 'idle',
          actions: ['setError', 'setLoadingFalse']
        }
      }
    }
  }
});