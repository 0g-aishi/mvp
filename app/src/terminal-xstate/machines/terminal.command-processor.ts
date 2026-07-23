/**
 * @fileoverview Terminal Command Processor
 * @description Command processing logic for terminal machine
 */

import { assign } from 'xstate';
import { parseCommand, validateCommandArgs } from '../services/commandParser';
import type { TerminalContext, TerminalLine } from './types';
import { logger } from '@/lib/logger';

const log = logger.child({ component: 'TerminalCommandProcessor' });

/**
 * Process and validate command input
 * Returns lines to display for simple commands or null for complex ones
 */
export const processCommand = (context: TerminalContext): TerminalLine[] | null => {
  const timestamp = Date.now();
  const parsed = parseCommand(context.currentInput);
  
  // Handle invalid command
  if (!parsed.isValid) {
    return [{
      type: 'error',
      content: parsed.error || 'Invalid command',
      timestamp
    }];
  }
  
  // Validate command arguments
  const validation = validateCommandArgs(parsed.command as any, parsed.args);
  if (!validation.valid) {
    return [{
      type: 'error',
      content: validation.error || 'Invalid arguments',
      timestamp
    }];
  }
  
  // Handle simple commands that don't need actors
  switch (parsed.command) {
    case 'clear':
      // Clear command is handled by action
      return [];
      
    case 'dream':
    case 'chat':
      // These are handled by state transitions
      return null;
      
    case 'personality':
    case 'unique-features':
    case 'stats':
    case 'help':
      // These need async actors
      return null;
      
    case 'memory':
      // Handled by async actor
      return null;

    case 'month-learn':
    case 'memory-core':
      // Handled by async actors (living memory system)
      return null;

    default:
      // Unimplemented command
      return [{
        type: 'info',
        content: `Command '${parsed.command}' recognized but not yet implemented.`,
        timestamp
      }];
  }
};


/**
 * Command processor action that adds input line and processes command
 */
export const submitCommandAction = assign({
  lines: ({ context }: { context: TerminalContext }) => {
    const timestamp = Date.now();
    const newLines: TerminalLine[] = [
      ...context.lines,
      {
        type: 'input',
        content: `$ ${context.currentInput}`,
        timestamp
      }
    ];
    
    // Process command for simple results
    const commandResult = processCommand(context);
    if (commandResult !== null) {
      newLines.push(...commandResult);
    }
    
    return newLines;
  },
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
  lastParsedCommand: ({ context }: { context: TerminalContext }) => {
    const parsed = parseCommand(context.currentInput);
    log.debug('Parsing command', {
      input: context.currentInput,
      parsed: parsed,
      command: parsed.command
    });
    return parsed.isValid ? parsed.command : null;
  },
  currentInput: '',
  historyIndex: -1
});

/**
 * Helper to get agent data from context
 */
export const getAgentData = (context: TerminalContext) => {
  const agentState = context.agentRef?.getSnapshot();
  const data = {
    tokenId: agentState?.context?.tokenId,
    agentName: agentState?.context?.agentName || 'agent',
    walletAddress: agentState?.context?.walletAddress
  };

  // Enhanced debug logging for wallet address tracking
  log.debug('Retrieved agent data', {
    ...data,
    agentStatus: agentState?.context?.status,
    hasAgentRef: !!context.agentRef,
    walletAddressType: typeof data.walletAddress,
    walletAddressValue: data.walletAddress || 'null/undefined',
    isZeroAddress: data.walletAddress === '0x0000000000000000000000000000000000000000'
  });

  return data;
};

/**
 * Helper to get model data from context
 */
export const getModelData = (context: TerminalContext) => {
  const modelState = context.modelRef?.getSnapshot();
  return {
    selectedModel: modelState?.context?.selectedModel || 'gemini-2.5-flash-auto'
  };
};

/**
 * Actions for starting workflows with proper context
 */
export const workflowActions = {
  /**
   * Start dream workflow with context
   */
  startDreamWorkflow: ({ context, enqueue }: { context: TerminalContext; enqueue: any }) => {
    if (context.dreamRef) {
      const { selectedModel } = getModelData(context);
      const { walletAddress, tokenId, agentName } = getAgentData(context);

      log.debug('[workflowActions] Starting dream workflow', {
        tokenId,
        agentName,
        wasVoiceInput: context.wasVoiceInput,
        selectedModel,
        walletAddress: walletAddress || 'undefined',
        agentStatus: context.agentRef?.getSnapshot()?.context?.status
      });

      // Validate wallet address for 0G Network models
      const isGeminiModel = selectedModel.startsWith('gemini-');
      if (!isGeminiModel && !walletAddress) {
        log.error('Cannot start 0G model without wallet address', {
          model: selectedModel,
          walletAddress: walletAddress || 'undefined',
          agentStatus: context.agentRef?.getSnapshot()?.context?.status
        });

        // Send error to terminal
        enqueue({
          type: 'APPEND_LINES',
          lines: [{
            type: 'error',
            content: 'Wallet not ready for 0G Network models. Please wait for agent sync to complete or use Gemini models (gemini-2.5-flash-*).',
            timestamp: Date.now()
          }]
        });
        return; // Don't start dream workflow
      }

      context.dreamRef.send({
        type: 'START',
        modelId: selectedModel,
        walletAddress,
        tokenId,
        agentName,
        wasVoiceInput: context.wasVoiceInput
      });
    }
  },

  /**
   * Start chat workflow with context
   */
  startChatWorkflow: ({ context }: { context: TerminalContext }) => {
    if (context.chatRef) {
      const { walletAddress, tokenId, agentName } = getAgentData(context);
      const { selectedModel } = getModelData(context);

      log.debug('[workflowActions] Starting chat workflow', {
        tokenId,
        agentName,
        walletAddress: walletAddress || 'undefined',
        wasVoiceInput: context.wasVoiceInput,
        selectedModel
      });

      context.chatRef.send({
        type: 'START_CHAT',
        agentId: tokenId || 1,
        agentName,
        modelId: selectedModel,
        walletAddress,
        wasVoiceInput: context.wasVoiceInput
      });
    }
  },

  /**
   * Send dream input
   */
  sendDreamInput: ({ context }: { context: TerminalContext }) => {
    const input = (context.currentInput || '').trim().toLowerCase();
    if (context.dreamRef) {
      // Log voice input status
      log.debug('Sending to dream with wasVoiceInput', { wasVoiceInput: context.wasVoiceInput });

      if (input === 'y' || input === 'yes') {
        context.dreamRef.send({ type: 'CONFIRM_SAVE' });
      } else if (input === 'n' || input === 'no') {
        context.dreamRef.send({ type: 'CANCEL_SAVE' });
      } else {
        context.dreamRef.send({
          type: 'SUBMIT_DREAM',
          dreamText: context.currentInput,
          wasVoiceInput: context.wasVoiceInput // Pass voice flag to dream machine
        });
      }
    }
  },

  /**
   * Send chat input
   */
  sendChatInput: ({ context }: { context: TerminalContext }) => {
    if (context.chatRef) {
      const input = (context.currentInput || '').trim().toLowerCase();

      // Check if we're in confirmation state
      const chatState = context.chatRef.getSnapshot();
      const isAwaitingConfirmation = chatState?.context?.awaitingConfirmation;

      // Log voice input status for debugging
      log.debug('Sending to chat with wasVoiceInput', { wasVoiceInput: context.wasVoiceInput });

      // Handle confirmation responses
      if (isAwaitingConfirmation && (input === 'y' || input === 'yes')) {
        context.chatRef.send({ type: 'CONFIRM_SAVE' });
      } else if (isAwaitingConfirmation && (input === 'n' || input === 'no')) {
        context.chatRef.send({ type: 'CANCEL_SAVE' });
      } else {
        // Regular message with voice flag
        context.chatRef.send({
          type: 'INPUT.SUBMIT',
          value: context.currentInput,
          wasVoiceInput: context.wasVoiceInput // Pass voice flag to chat machine
        });
      }
    }
  },

  /**
   * Start month-learn workflow with context
   */
  startMonthLearnWorkflow: ({ context }: { context: TerminalContext }) => {
    if (context.monthLearnRef) {
      const { walletAddress, tokenId, agentName } = getAgentData(context);
      const { selectedModel } = getModelData(context);

      log.debug('[workflowActions] Starting month-learn workflow', {
        tokenId,
        agentName,
        walletAddress: walletAddress || 'undefined',
        selectedModel
      });

      context.monthLearnRef.send({
        type: 'START',
        tokenId: tokenId || 1,
        agentName,
        walletAddress,
        modelId: selectedModel
      });
    }
  },

  /**
   * Start memory-core workflow with context
   */
  startMemoryCoreWorkflow: ({ context }: { context: TerminalContext }) => {
    if (context.memoryCoreRef) {
      const { walletAddress, tokenId, agentName } = getAgentData(context);
      const { selectedModel } = getModelData(context);

      log.debug('[workflowActions] Starting memory-core workflow', {
        tokenId,
        agentName,
        walletAddress: walletAddress || 'undefined',
        selectedModel
      });

      context.memoryCoreRef.send({
        type: 'START',
        tokenId: tokenId || 1,
        agentName,
        walletAddress,
        modelId: selectedModel
      });
    }
  }
};