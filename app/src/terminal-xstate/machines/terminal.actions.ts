// @ts-nocheck
/**
 * @fileoverview Terminal Machine Actions
 * @description All actions for the terminal state machine
 */

import { assign } from 'xstate';
import type { TerminalContext, TerminalLine } from './types';
import { logger } from '@/lib/logger';

const log = logger.child({ component: 'terminal.actions' });

/**
 * Terminal machine actions organized by category
 */
export const terminalActions = {
  /**
   * Input handling actions
   */
  updateInput: assign({
    currentInput: ({ event }: any) => {
      if (event.type === 'INPUT.CHANGE') {
        return event.value;
      }
      return '';
    }
  }),

  clearInput: assign({
    currentInput: ''
    // Don't reset wasVoiceInput here - preserve it for workflows
    // It will be reset by clearTTSState after voice response
  }),

  /**
   * Command history actions
   */
  updateCommandHistory: assign({
    commandHistory: ({ context }: { context: TerminalContext }) => {
      if (context.currentInput.trim()) {
        const newHistory = [...context.commandHistory];
        // Remove duplicates
        const index = newHistory.indexOf(context.currentInput);
        if (index > -1) {
          newHistory.splice(index, 1);
        }
        // Add to end
        newHistory.push(context.currentInput);
        // Keep max 50 entries
        return newHistory.slice(-50);
      }
      return context.commandHistory;
    },
    historyIndex: -1
  }),

  navigateHistoryUp: assign({
    historyIndex: ({ context }: { context: TerminalContext }) => {
      if (context.commandHistory.length === 0) return -1;
      
      const newIndex = context.historyIndex === -1 
        ? context.commandHistory.length - 1 
        : Math.max(0, context.historyIndex - 1);
      
      return newIndex;
    },
    currentInput: ({ context }: { context: TerminalContext }) => {
      if (context.commandHistory.length === 0) return context.currentInput;
      
      const newIndex = context.historyIndex === -1 
        ? context.commandHistory.length - 1 
        : Math.max(0, context.historyIndex - 1);
      
      return context.commandHistory[newIndex] || '';
    }
  }),

  navigateHistoryDown: assign({
    historyIndex: ({ context }: { context: TerminalContext }) => {
      if (context.historyIndex === -1) return -1;
      
      const newIndex = context.historyIndex + 1;
      if (newIndex >= context.commandHistory.length) {
        return -1;
      }
      return newIndex;
    },
    currentInput: ({ context }: { context: TerminalContext }) => {
      if (context.historyIndex === -1) return '';
      
      const newIndex = context.historyIndex + 1;
      if (newIndex >= context.commandHistory.length) {
        return '';
      }
      return context.commandHistory[newIndex] || '';
    }
  }),

  /**
   * Terminal display actions
   */
  clearTerminal: assign({
    lines: [],
    currentInput: ''
  }),

  appendLines: assign({
    lines: ({ context, event }: any) => {
      if (event.type === 'APPEND_LINES') {
        log.debug('appendLines action triggered');
        log.debug('Appending lines', { count: event.lines?.length });
        log.debug('Current lines count', { count: context.lines.length });
        return [...context.lines, ...event.lines];
      }
      return context.lines;
    }
  }),

  appendInputLine: assign({
    lines: ({ context }: { context: TerminalContext }) => {
      const timestamp = Date.now();
      return [...context.lines, {
        type: 'input',
        content: `$ ${context.currentInput}`,
        timestamp
      }];
    }
  }),

  appendErrorLine: assign({
    lines: ({ context, event }: any) => {
      const timestamp = Date.now();
      const error = event.error || 'An error occurred';
      return [...context.lines, {
        type: 'error',
        content: error,
        timestamp
      }];
    }
  }),

  /**
   * Command parsing actions
   */
  clearLastParsedCommand: assign({
    lastParsedCommand: null
  }),

  /**
   * Initialization actions
   */
  initialize: assign({
    isInitialized: true,
    welcomeLines: () => {
      const timestamp = Date.now();
      return [
        {
          type: 'info' as const,
          content: 'syncing with agent',
          timestamp
        },
        {
          type: 'system' as const,
          content: '',
          timestamp: timestamp + 1
        }
      ];
    }
  }),

  /**
   * Actor spawning actions
   */
  spawnActors: assign({
    brokerRef: ({ spawn }: any) => spawn('brokerActor', { id: 'broker' }),
    modelRef: ({ spawn }: any) => spawn('modelActor', { id: 'model' }),
    agentRef: ({ spawn }: any) => spawn('agentActor', { id: 'agent' }),
    voiceRef: ({ spawn }: any) => spawn('voiceActor', { id: 'voice' })
  }),

  spawnDreamMachine: assign({
    dreamRef: ({ spawn }: any) => spawn('dreamActor', { id: 'dream' }),
    isDreamActive: true,
    dreamStatus: 'Initializing dream workflow...',
    dreamPrompt: null,
    lastParsedCommand: null
  }),

  spawnChatMachine: assign({
    chatRef: ({ spawn, context }: any) => {
      // Get agent data from agentRef
      const agentState = context.agentRef?.getSnapshot();
      const agentId = agentState?.context?.tokenId || 1;
      const agentName = agentState?.context?.agentName || 'Agent';

      return spawn('chatActor', {
        id: 'chat',
        input: { agentId, agentName }
      });
    },
    isChatActive: true,
    chatStatus: 'Initializing chat session...',
    chatPrompt: null,
    lastParsedCommand: null
  }),

  spawnMonthLearnMachine: assign({
    monthLearnRef: ({ spawn }: any) => spawn('monthLearnActor', { id: 'monthLearn' }),
    isMonthLearnActive: true,
    monthLearnStatus: 'Initializing month-learn workflow...',
    lastParsedCommand: null
  }),

  spawnMemoryCoreMachine: assign({
    memoryCoreRef: ({ spawn }: any) => spawn('memoryCoreActor', { id: 'memoryCore' }),
    isMemoryCoreActive: true,
    memoryCoreStatus: 'Initializing memory-core workflow...',
    lastParsedCommand: null
  }),

  /**
   * Status update actions
   */
  updateDreamStatus: assign({
    dreamStatus: ({ context, event }: any) => {
      if (event.type !== 'UPDATE_STATUS') {
        return context.dreamStatus;
      }
      const source = event.source ?? (context.isDreamActive ? 'dream' : 'global');
      if (source !== 'dream') {
        if (source === 'global') {
          if (event.status === undefined) {
            return context.dreamStatus;
          }
          return event.status;
        }
        return context.dreamStatus;
      }
      if (event.status === undefined) {
        return context.dreamStatus;
      }
      if (event.status === null && context.isDreamActive) {
        return context.dreamStatus;
      }
      return event.status;
    },
    dreamPrompt: ({ context, event }: any) => {
      if (event.type !== 'UPDATE_STATUS') {
        return context.dreamPrompt;
      }
      const source = event.source ?? (context.isDreamActive ? 'dream' : 'global');
      if (source !== 'dream') {
        return context.dreamPrompt;
      }
      if (event.prompt !== undefined) {
        if (event.prompt === null && event.preservePrompt) {
          return context.dreamPrompt;
        }
        return event.prompt;
      }
      return context.dreamPrompt;
    }
  }),

  updateChatStatus: assign({
    chatStatus: ({ context, event }: any) => {
      if (event.type !== 'UPDATE_STATUS') {
        return context.chatStatus;
      }
      const source = event.source ?? (context.isChatActive ? 'chat' : 'global');
      if (source !== 'chat') {
        return context.chatStatus;
      }
      if (event.status === undefined) {
        return context.chatStatus;
      }
      if (event.status === null && context.isChatActive) {
        return context.chatStatus;
      }
      return event.status;
    },
    chatPrompt: ({ context, event }: any) => {
      if (event.type !== 'UPDATE_STATUS') {
        return context.chatPrompt;
      }
      const source = event.source ?? (context.isChatActive ? 'chat' : 'global');
      if (source !== 'chat') {
        return context.chatPrompt;
      }
      if (event.prompt !== undefined) {
        if (event.prompt === null && event.preservePrompt) {
          return context.chatPrompt;
        }
        return event.prompt;
      }
      return context.chatPrompt;
    }
  }),

  updateSelectedModel: assign({
    selectedModel: ({ event }: any) => {
      if (event.type === 'UPDATE_MODEL') {
        return event.modelId;
      }
      return null;
    }
  }),

  /**
   * Workflow completion actions
   */
  completeDream: assign({
    isDreamActive: false,
    dreamStatus: null,
    dreamPrompt: null,
    dreamRef: null,
    wasVoiceInput: false // Reset voice flag only after dream completes
  }),

  completeChat: assign({
    isChatActive: false,
    chatRef: null,
    chatStatus: null,
    chatPrompt: null,
    wasVoiceInput: false // Reset voice flag only after chat completes
  }),

  completeMonthLearn: assign({
    isMonthLearnActive: false,
    monthLearnRef: null,
    monthLearnStatus: null
  }),

  completeMemoryCore: assign({
    isMemoryCoreActive: false,
    memoryCoreRef: null,
    memoryCoreStatus: null
  }),

  /**
   * Command result display actions
   */
  displayCommandResult: assign({
    lines: ({ context, event }: any) => {
      if (event.output?.success && event.output?.lines) {
        return [...context.lines, ...event.output.lines];
      }
      return context.lines;
    }
  }),

  displayCommandError: assign({
    lines: ({ context, event }: any) => {
      const timestamp = Date.now();
      const error = event.output?.error || event.error || 'Command execution failed';
      
      return [...context.lines, {
        type: 'error',
        content: `Error: ${error}`,
        timestamp
      }];
    }
  }),

  /**
   * Agent-related error handling
   */
  displayNoAgentError: assign({
    lines: ({ context }: { context: TerminalContext }) => {
      const timestamp = Date.now();
      return [...context.lines, {
        type: 'error',
        content: 'No agent found. Please connect your wallet first.',
        timestamp
      }];
    }
  }),

  displayNoChatAgentError: assign({
    lines: ({ context }: { context: TerminalContext }) => {
      const timestamp = Date.now();
      return [...context.lines, {
        type: 'error',
        content: 'No agent selected. Use "info" or "stats" command to select an agent first.',
        timestamp
      }];
    },
    lastParsedCommand: null
  }),

  /**
   * Dream workflow specific actions
   */
  addDreamUserInput: assign({
    lines: ({ context }: { context: TerminalContext }) => {
      const timestamp = Date.now();
      const input = (context.currentInput || '').trim().toLowerCase();
      const isConfirmation = input === 'y' || input === 'yes' || input === 'n' || input === 'no';

      // If voice input and not confirmation, show as voice message
      if (context.wasVoiceInput && !isConfirmation) {
        // Check if voice-input was already added by APPEND_VOICE_INPUT
        const lastLine = context.lines[context.lines.length - 1];
        if (lastLine && lastLine.type === 'voice-input') {
          // Voice input already displayed, don't duplicate
          return context.lines;
        }
        // This shouldn't happen anymore, but keep as fallback
        return [...context.lines, {
          type: 'voice-input',
          content: context.currentInput,
          transcript: context.currentInput,
          audioFormat: 'audio/webm',
          timestamp
        }];
      }

      const formattedContent = isConfirmation
        ? `> ${context.currentInput}`
        : `~ you : ${context.currentInput}`;

      return [...context.lines, {
        type: 'input',
        content: formattedContent,
        timestamp
      }];
    }
  }),

  /**
   * Chat workflow specific actions
   */
  addChatUserInput: assign({
    lines: ({ context }: { context: TerminalContext }) => {
      const timestamp = Date.now();
      const input = context.currentInput.trim();
      const isConfirmation = context.chatRef?.getSnapshot()?.context?.awaitingConfirmation;

      // If voice input and not confirmation, show as voice message
      if (context.wasVoiceInput && !isConfirmation) {
        // Check if voice-input was already added by APPEND_VOICE_INPUT
        const lastLine = context.lines[context.lines.length - 1];
        if (lastLine && lastLine.type === 'voice-input') {
          // Voice input already displayed, don't duplicate
          return context.lines;
        }
        // This shouldn't happen anymore, but keep as fallback
        return [...context.lines, {
          type: 'voice-input',
          content: context.currentInput,
          transcript: context.currentInput,
          audioFormat: 'audio/webm',
          timestamp
        }];
      }

      let formattedContent = '';
      if (isConfirmation) {
        formattedContent = `> ${context.currentInput}`;
      } else {
        // Use spaced pattern to match MinimalOutput regex (~ name : ...)
        formattedContent = `~ you : ${context.currentInput}`;
      }

      return [...context.lines, {
        type: 'input',
        content: formattedContent,
        timestamp
      }];
    }
  }),

  /**
   * Voice control actions
   */
  toggleVoice: assign({
    isVoiceEnabled: ({ context }: { context: TerminalContext }) => !context.isVoiceEnabled
  }),

  updateSelectedVoice: assign({
    selectedVoice: ({ event }: any) => {
      if (event.type === 'VOICE.SELECT_VOICE') {
        return event.voiceId;
      }
      return null;
    }
  }),

  setRecording: assign({
    isRecording: true,
    voiceStatus: 'Recording...'
  }),

  stopRecording: assign({
    isRecording: false,
    voiceStatus: 'Processing...'
  }),

  updateVoiceStatus: assign({
    voiceStatus: ({ event }: any) => {
      if (event.type === 'VOICE.ERROR') {
        return `Error: ${event.message}`;
      }
      return null;
    }
  }),

  handleVoiceTranscript: assign({
    currentInput: ({ event }: any) => {
      log.debug('Setting currentInput from voice event', {
        eventType: event.type,
        transcript: event.transcript
      });
      if (event.type === 'VOICE.TRANSCRIBED') {
        return event.transcript || '';  // Add fallback
      }
      return '';
    },
    voiceStatus: null,
    wasVoiceInput: true // Mark that this input came from voice
  }),

  setVoiceThinkingStatus: assign({
    dreamStatus: ({ context }: { context: TerminalContext }) => {
      if (context.wasVoiceInput && context.agentRef) {
        const agentState = context.agentRef.getSnapshot();
        const agentName = agentState?.context?.agentName || 'Agent';
        return `${agentName} is thinking . . .`;
      }
      return null;
    }
  }),

  setChatThinkingStatus: assign({
    chatStatus: ({ context }: { context: TerminalContext }) => {
      if (context.wasVoiceInput && context.agentRef) {
        const agentState = context.agentRef.getSnapshot();
        const agentName = agentState?.context?.agentName || 'Agent';
        return `${agentName} is thinking . . .`;
      }
      return null;
    }
  }),

  sendToVoice: ({ context, event }: any) => {
    if (context.voiceRef && event.type === 'VOICE.SPEAK') {
      context.voiceRef.send({
        type: 'SYNTHESIZE',
        text: event.text,
        emotionalTone: event.emotionalTone
      });
    }
  },

  startVoiceRecording: ({ context }: any) => {
    if (context.voiceRef) {
      context.voiceRef.send({ type: 'START_RECORDING' });
    }
  },

  stopVoiceRecording: ({ context }: any) => {
    if (context.voiceRef) {
      context.voiceRef.send({ type: 'STOP_RECORDING' });
    }
  },

  /**
   * Voice message display actions
   */
  displayVoiceInput: assign({
    lines: ({ context, event }: any) => {
      log.debug('displayVoiceInput triggered', {
        eventType: event.type,
        hasAudioBlob: !!event.audioBlob,
        hasAudioBase64: !!event.audioBase64,
        duration: event.duration
      });
      const timestamp = Date.now();
      const line: TerminalLine = {
        type: 'voice-input',
        content: event.transcript || 'Voice message',
        transcript: event.transcript,
        audioBlob: event.audioBlob,
        audioData: event.audioBase64,
        audioFormat: 'audio/webm', // Voice input uses webm format from browser recording
        duration: event.duration || 0,
        timestamp
      };
      return [...context.lines, line];
    }
  }),

  displayVoiceOutput: assign({
    lines: ({ context, event }: any) => {
      const timestamp = Date.now();
      const line: TerminalLine = {
        type: 'voice-output',
        content: event.text || event.content || 'Voice response',
        audioData: event.audioData,
        voiceId: event.voiceId || context.selectedVoice,
        timestamp
      };
      return [...context.lines, line];
    }
  }),

  synthesizeVoiceResponse: ({ context }: any) => {
    // This action will be called from dream/chat machines
    // to trigger TTS for AI responses
    if (context.voiceRef && context.isVoiceEnabled) {
      const lastLine = context.lines[context.lines.length - 1];
      if (lastLine && lastLine.type === 'output') {
        context.voiceRef.send({
          type: 'SYNTHESIZE',
          text: lastLine.content,
          emotionalTone: 'neutral'
        });
      }
    }
  },

  forwardToVoice: assign({
    isSynthesizing: ({ context, event }: any) => {
      if (context.voiceRef && event.type === 'VOICE.SYNTHESIZE_RESPONSE') {
        // Send the synthesize command to voice machine
        context.voiceRef.send({
          type: 'SYNTHESIZE',
          text: event.text,
          emotionalTone: 'neutral',
          isDreamResponse: event.isDreamResponse || false,
          agentName: event.agentName,
          isEvolutionDream: event.isEvolutionDream || false
        });
        // Mark that we're synthesizing
        return true;
      }
      return context.isSynthesizing || false;
    }
  }),

  setVoiceInput: assign({
    wasVoiceInput: ({ event }: any) => {
      if (event.type === 'SET_VOICE_INPUT') {
        return event.value;
      }
      return false;
    }
  }),

  /**
   * Clear TTS synthesis state when complete
   */
  clearTTSState: assign({
    isSynthesizing: false,
    dreamStatus: null, // Clear dream status after TTS completes
    chatStatus: null, // Clear chat status after TTS completes
    wasVoiceInput: false // Reset voice flag after TTS completes for next message
  }),

  /**
   * Reset thinking status after AI response is displayed
   * Used by dream and chat workflows to properly manage status lifecycle
   */
  resetThinkingStatus: assign({
    dreamStatus: ({ context }: { context: TerminalContext }) => {
      if (context.isDreamActive) {
        return null;
      }
      return context.dreamStatus;
    },
    dreamPrompt: ({ context }: { context: TerminalContext }) => {
      if (context.isDreamActive) {
        return 'Waiting for your response...';
      }
      return context.dreamPrompt;
    },
    chatStatus: ({ context }: { context: TerminalContext }) => {
      if (context.isChatActive) {
        return null;
      }
      return context.chatStatus;
    },
    chatPrompt: ({ context }: { context: TerminalContext }) => {
      if (context.isChatActive) {
        return 'Type your message...';
      }
      return context.chatPrompt;
    }
  })
};