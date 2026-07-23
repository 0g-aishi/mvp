// @ts-nocheck
/**
 * @fileoverview Terminal State Machine
 * @description Main terminal machine using XState v5 with modular architecture
 */

import { setup, assign } from 'xstate';
import { TerminalContext, TerminalEvent } from './types';
import { brokerMachine } from './brokerMachine';
import { modelMachine } from './modelMachine';
import { agentMachine } from './agentMachine';
import { dreamMachine } from './dreamMachine';
import { chatMachine } from './chatMachine';
import { voiceMachine } from './voiceMachine';
import { monthLearnMachine } from './monthLearnMachine';
import { memoryCoreMemachine } from './memoryCoreMemachine';
import { commandExecutors } from './terminal.command-executors';
import { terminalActions } from './terminal.actions';
import { terminalGuards } from './terminal.guards';
import {
  submitCommandAction,
  workflowActions,
  getAgentData,
  getModelData
} from './terminal.command-processor';

// Initial context
const initialContext: TerminalContext = {
  lines: [],
  welcomeLines: [],
  currentInput: '',
  commandHistory: [],
  historyIndex: -1,
  isInitialized: false,
  brokerRef: null,
  modelRef: null,
  agentRef: null,
  dreamRef: null,
  chatRef: null,
  voiceRef: null,
  monthLearnRef: null,
  memoryCoreRef: null,
  selectedModel: null,
  selectedVoice: null,
  isVoiceEnabled: false,
  voiceStatus: null,
  isRecording: false,
  wasVoiceInput: false,
  isDreamActive: false,
  isChatActive: false,
  dreamStatus: null,
  dreamPrompt: null,
  chatStatus: null,
  chatPrompt: null,
  isMonthLearnActive: false,
  monthLearnStatus: null,
  isMemoryCoreActive: false,
  memoryCoreStatus: null,
  lastParsedCommand: null,
  isSynthesizing: false
};

// Terminal machine definition
export const terminalMachine = setup({
  types: {} as {
    context: TerminalContext;
    events: TerminalEvent;
  },
  actors: {
    // Child machines
    brokerActor: brokerMachine,
    modelActor: modelMachine,
    agentActor: agentMachine,
    dreamActor: dreamMachine,
    chatActor: chatMachine,
    voiceActor: voiceMachine,
    monthLearnActor: monthLearnMachine,
    memoryCoreActor: memoryCoreMemachine,
    // Command executors
    ...commandExecutors
  },
  actions: {
    // Import all terminal actions
    ...terminalActions,
    // Command processing
    submitCommand: submitCommandAction,
    // Workflow actions
    ...workflowActions,
    // Command execution status update
    updateCommandStatus: assign({
      lines: ({ context, event }: any) => {
        if (event.agentName) {
          // Show "thinking" status for async commands
          return [...context.lines, {
            type: 'system',
            content: `${event.agentName} is thinking...`,
            timestamp: Date.now()
          }];
        }
        return context.lines;
      }
    })
  },
  guards: terminalGuards
}).createMachine({
  id: 'terminal',
  initial: 'uninitialized',
  context: initialContext,
  
  states: {
    uninitialized: {
      on: {
        INITIALIZE: {
          target: 'idle',
          actions: ['initialize', 'spawnActors']
        }
      }
    },
    
    idle: {
      on: {
        'INPUT.CHANGE': {
          actions: 'updateInput'
        },
        'INPUT.SUBMIT': {
          target: 'processing'
        },
        'HISTORY.UP': {
          actions: 'navigateHistoryUp'
        },
        'HISTORY.DOWN': {
          actions: 'navigateHistoryDown'
        },
        CLEAR: {
          actions: 'clearTerminal'
        },
        'APPEND_LINES': {
          actions: 'appendLines'
        },
        'UPDATE_STATUS': {
          actions: ['updateDreamStatus', 'updateChatStatus']
        },
        // Voice events
        'VOICE.TOGGLE': {
          actions: 'toggleVoice'
        },
        'VOICE.START_RECORDING': {
          actions: ['setRecording', 'startVoiceRecording']
        },
        'VOICE.STOP_RECORDING': {
          actions: ['stopRecording', 'stopVoiceRecording']
        },
        'VOICE.TRANSCRIBED': {
          actions: 'handleVoiceTranscript',
          target: 'processing'
        },
        'VOICE.SELECT_VOICE': {
          actions: 'updateSelectedVoice'
        },
        'VOICE.ERROR': {
          actions: 'updateVoiceStatus'
        },
        'VOICE.SYNTHESIZE_RESPONSE': {
          actions: 'forwardToVoice'
        },
        'VOICE.TTS_COMPLETE': {
          actions: 'clearTTSState'
        },
        'NOOP': {}
      }
    },
    
    processing: {
      entry: ['submitCommand'],
      always: [
        // Dream command
        {
          target: 'dreamWorkflow',
          guard: 'isDreamCommand',
          actions: 'spawnDreamMachine'
        },
        // Chat command with agent
        {
          target: 'chatWorkflow',
          guard: 'isChatCommandWithAgent',
          actions: 'spawnChatMachine'
        },
        // Chat command without agent
        {
          target: 'idle',
          guard: 'isChatCommandWithoutAgent',
          actions: 'displayNoChatAgentError'
        },
        // Month-learn command with agent
        {
          target: 'monthLearnWorkflow',
          guard: 'isMonthLearnCommand',
          actions: 'spawnMonthLearnMachine'
        },
        // Memory-core command with agent
        {
          target: 'memoryCoreWorkflow',
          guard: 'isMemoryCoreCommand',
          actions: 'spawnMemoryCoreMachine'
        },
        // Clear command
        {
          target: 'idle',
          guard: 'isClearCommand',
          actions: 'clearTerminal'
        },
        // Help command
        {
          target: 'executingHelp',
          guard: 'isHelpCommand'
        },
        // Commands that need agent
        {
          target: 'checkingAgent',
          guard: 'isAgentRequiredCommand'
        },
        // Default: return to idle
        {
          target: 'idle'
        }
      ]
    },
    
    checkingAgent: {
      always: [
        // Has agent - proceed to execution
        {
          target: 'executingCommand',
          guard: 'hasAgent'
        },
        // No agent - show error
        {
          target: 'idle',
          actions: 'displayNoAgentError'
        }
      ]
    },
    
    executingCommand: {
      initial: 'determining',
      states: {
        determining: {
          always: [
            {
              target: 'personality',
              guard: ({ context }) => context.lastParsedCommand === 'personality'
            },
            {
              target: 'uniqueFeatures',
              guard: ({ context }) => context.lastParsedCommand === 'unique-features'
            },
            {
              target: 'stats',
              guard: ({ context }) => context.lastParsedCommand === 'stats'
            },
            {
              target: 'memory',
              guard: ({ context }) => context.lastParsedCommand === 'memory'
            }
          ]
        },
        
        personality: {
          entry: ({ context, self }) => {
            const { agentName } = getAgentData(context);
            self.send({ type: 'UPDATE_STATUS', source: 'global', status: `${agentName} is thinking...` });
          },
          invoke: {
            src: 'personalityExecutor',
            input: ({ context }) => {
              const { tokenId, agentName } = getAgentData(context);
              return { tokenId: tokenId!, agentName };
            },
            onDone: {
              target: '#terminal.idle',
              actions: [
                assign({ lastParsedCommand: null }),
                'displayCommandResult'
              ]
            },
            onError: {
              target: '#terminal.idle',
              actions: [
                assign({ lastParsedCommand: null }),
                'displayCommandError'
              ]
            }
          }
        },
        
        uniqueFeatures: {
          entry: ({ context, self }) => {
            const { agentName } = getAgentData(context);
            self.send({ type: 'UPDATE_STATUS', source: 'global', status: `${agentName} is thinking...` });
          },
          invoke: {
            src: 'uniqueFeaturesExecutor',
            input: ({ context }) => {
              const { tokenId, agentName } = getAgentData(context);
              return { tokenId: tokenId!, agentName };
            },
            onDone: {
              target: '#terminal.idle',
              actions: [
                assign({ lastParsedCommand: null }),
                'displayCommandResult'
              ]
            },
            onError: {
              target: '#terminal.idle',
              actions: [
                assign({ lastParsedCommand: null }),
                'displayCommandError'
              ]
            }
          }
        },
        
        stats: {
          entry: ({ context, self }) => {
            const { agentName } = getAgentData(context);
            self.send({ type: 'UPDATE_STATUS', source: 'global', status: `${agentName} is thinking...` });
          },
          invoke: {
            src: 'statsExecutor',
            input: ({ context }) => {
              const { tokenId, agentName } = getAgentData(context);
              return { tokenId: tokenId!, agentName };
            },
            onDone: {
              target: '#terminal.idle',
              actions: [
                assign({ lastParsedCommand: null }),
                'displayCommandResult'
              ]
            },
            onError: {
              target: '#terminal.idle',
              actions: [
                assign({ lastParsedCommand: null }),
                'displayCommandError'
              ]
            }
          }
        },
        
        memory: {
          entry: ({ context, self }) => {
            const { agentName } = getAgentData(context);
            self.send({ type: 'UPDATE_STATUS', source: 'global', status: `${agentName} is accessing memory...` });
          },
          invoke: {
            src: 'memoryExecutor',
            input: ({ context }) => {
              const { tokenId, agentName } = getAgentData(context);
              return { tokenId: tokenId!, agentName };
            },
            onDone: {
              target: '#terminal.idle',
              actions: [
                assign({ lastParsedCommand: null }),
                'displayCommandResult'
              ]
            },
            onError: {
              target: '#terminal.idle',
              actions: [
                assign({ lastParsedCommand: null }),
                'displayCommandError'
              ]
            }
          }
        },

        // Month-learn and memory-core now spawn dedicated machines
        // These are handled as workflows (like dream and chat)
      }
    },
    
    executingHelp: {
      invoke: {
        src: 'helpExecutor',
        input: ({ context }) => {
          const parsed = context.lastParsedCommand === 'help' ? 
            { args: [] } : { args: [] };
          return parsed;
        },
        onDone: {
          target: 'idle',
          actions: [
            assign({ lastParsedCommand: null }),
            'displayCommandResult'
          ]
        },
        onError: {
          target: 'idle',
          actions: [
            assign({ lastParsedCommand: null }),
            'displayCommandError'
          ]
        }
      }
    },
    
    dreamWorkflow: {
      entry: [
        'clearInput',
        'startDreamWorkflow'
      ],
      on: {
        'INPUT.SUBMIT': {
          actions: [
            'addDreamUserInput',
            'sendDreamInput',
            'clearInput'
          ]
        },
        'INPUT.CHANGE': {
          actions: 'updateInput'
        },
        'APPEND_LINES': {
          actions: 'appendLines'
        },
        'UPDATE_STATUS': {
          actions: 'updateDreamStatus'
        },
        'DREAM.COMPLETE': {
          target: 'idle',
          actions: 'completeDream'
        },
        'HISTORY.UP': {
          actions: 'navigateHistoryUp'
        },
        'HISTORY.DOWN': {
          actions: 'navigateHistoryDown'
        },
        // Voice events in dream workflow
        'VOICE.START_RECORDING': {
          actions: ['setRecording', 'startVoiceRecording']
        },
        'VOICE.STOP_RECORDING': {
          actions: ['stopRecording', 'stopVoiceRecording']
        },
        'APPEND_VOICE_INPUT': {
          actions: 'displayVoiceInput'
        },
        'SET_VOICE_INPUT': {
          actions: 'setVoiceInput'
        },
        'VOICE.TRANSCRIBED': {
          actions: [
            'handleVoiceTranscript',
            'setVoiceThinkingStatus', // Set thinking status immediately after voice transcription
            'addDreamUserInput',
            'sendDreamInput',
            'clearInput'
          ]
        },
        'VOICE.ERROR': {
          actions: 'updateVoiceStatus'
        },
        'VOICE.SYNTHESIZE_RESPONSE': {
          actions: 'forwardToVoice'
        },
        'VOICE.TTS_COMPLETE': {
          actions: 'clearTTSState'
        },
        'NOOP': {}
      }
    },
    
    chatWorkflow: {
      entry: [
        'clearInput',
        'startChatWorkflow'
      ],
      on: {
        'INPUT.SUBMIT': {
          actions: [
            assign({ wasVoiceInput: false }), // Reset for text input
            'addChatUserInput',
            'sendChatInput',
            'clearInput'
          ]
        },
        'INPUT.CHANGE': {
          actions: 'updateInput'
        },
        'APPEND_LINES': {
          actions: 'appendLines'
        },
        'UPDATE_STATUS': {
          actions: 'updateChatStatus'
        },
        'END_SESSION': {
          actions: ({ context }) => {
            if (context.chatRef) {
              context.chatRef.send({ type: 'END_SESSION' });
            }
          }
        },
        'CHAT_COMPLETED': {
          target: 'idle',
          actions: 'completeChat'
        },
        'HISTORY.UP': {
          actions: 'navigateHistoryUp'
        },
        'HISTORY.DOWN': {
          actions: 'navigateHistoryDown'
        },
        // Voice events in chat workflow
        'VOICE.START_RECORDING': {
          actions: ['setRecording', 'startVoiceRecording']
        },
        'VOICE.STOP_RECORDING': {
          actions: ['stopRecording', 'stopVoiceRecording']
        },
        'APPEND_VOICE_INPUT': {
          actions: 'displayVoiceInput'
        },
        'SET_VOICE_INPUT': {
          actions: 'setVoiceInput'
        },
        'VOICE.TRANSCRIBED': {
          actions: [
            'handleVoiceTranscript',
            'setChatThinkingStatus', // Set thinking status immediately after voice transcription
            'addChatUserInput',
            'sendChatInput',
            'clearInput'
          ]
        },
        'VOICE.ERROR': {
          actions: 'updateVoiceStatus'
        },
        // Voice synthesis events for chat
        'VOICE.SYNTHESIZE_RESPONSE': {
          actions: 'forwardToVoice'
        },
        'VOICE.TTS_COMPLETE': {
          actions: 'clearTTSState'
        },
        'NOOP': {}
      }
    },

    monthLearnWorkflow: {
      entry: [
        'clearInput',
        'startMonthLearnWorkflow'
      ],
      on: {
        'APPEND_LINES': {
          actions: 'appendLines'
        },
        'UPDATE_STATUS': {
          actions: assign({
            monthLearnStatus: ({ event }: any) => event.status
          })
        },
        'MONTH_LEARN.COMPLETE': {
          target: 'idle',
          actions: 'completeMonthLearn'
        }
      }
    },

    memoryCoreWorkflow: {
      entry: [
        'clearInput',
        'startMemoryCoreWorkflow'
      ],
      on: {
        'APPEND_LINES': {
          actions: 'appendLines'
        },
        'UPDATE_STATUS': {
          actions: assign({
            memoryCoreStatus: ({ event }: any) => event.status
          })
        },
        'MEMORY_CORE.COMPLETE': {
          target: 'idle',
          actions: 'completeMemoryCore'
        }
      }
    }
  }
});