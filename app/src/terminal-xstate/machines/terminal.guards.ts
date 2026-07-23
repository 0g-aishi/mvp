/**
 * @fileoverview Terminal Machine Guards
 * @description Guard conditions for the terminal state machine
 */

import { parseCommand } from '../services/commandParser';
import type { TerminalContext } from './types';
import { logger } from '@/lib/logger';

/**
 * Logger instance
 */
const log = logger.child({ component: 'TerminalGuards' });

/**
 * Terminal machine guards for conditional transitions
 */
export const terminalGuards = {
  /**
   * Command type guards
   */
  isDreamCommand: ({ context }: { context: TerminalContext }) => {
    return context.lastParsedCommand === 'dream';
  },

  isChatCommand: ({ context }: { context: TerminalContext }) => {
    return context.lastParsedCommand === 'chat';
  },

  isPersonalityCommand: ({ context }: { context: TerminalContext }) => {
    return context.lastParsedCommand === 'personality';
  },

  isUniqueFeaturesCommand: ({ context }: { context: TerminalContext }) => {
    return context.lastParsedCommand === 'unique-features';
  },

  isStatsCommand: ({ context }: { context: TerminalContext }) => {
    return context.lastParsedCommand === 'stats';
  },

  isHelpCommand: ({ context }: { context: TerminalContext }) => {
    const result = context.lastParsedCommand === 'help';
    log.debug('isHelpCommand', { 
      lastParsedCommand: context.lastParsedCommand, 
      result 
    });
    return result;
  },

  isClearCommand: ({ context }: { context: TerminalContext }) => {
    return context.lastParsedCommand === 'clear';
  },

  isMemoryCommand: ({ context }: { context: TerminalContext }) => {
    return context.lastParsedCommand === 'memory';
  },

  isMonthLearnCommand: ({ context }: { context: TerminalContext }) => {
    return context.lastParsedCommand === 'month-learn';
  },

  isMemoryCoreCommand: ({ context }: { context: TerminalContext }) => {
    return context.lastParsedCommand === 'memory-core';
  },

  /**
   * Agent state guards
   */
  hasAgent: ({ context }: { context: TerminalContext }) => {
    const agentState = context.agentRef?.getSnapshot();
    return !!agentState?.context?.tokenId;
  },

  hasNoAgent: ({ context }: { context: TerminalContext }) => {
    const agentState = context.agentRef?.getSnapshot();
    return !agentState?.context?.tokenId;
  },

  /**
   * Combined guards for specific scenarios
   */
  isChatCommandWithAgent: ({ context }: { context: TerminalContext }) => {
    if (context.lastParsedCommand !== 'chat') return false;
    const agentState = context.agentRef?.getSnapshot();
    return !!agentState?.context?.tokenId;
  },

  isChatCommandWithoutAgent: ({ context }: { context: TerminalContext }) => {
    if (context.lastParsedCommand !== 'chat') return false;
    const agentState = context.agentRef?.getSnapshot();
    return !agentState?.context?.tokenId;
  },

  /**
   * Command that needs agent (personality, unique-features, stats, memory)
   * Note: month-learn and memory-core have dedicated workflow states
   */
  isAgentRequiredCommand: ({ context }: { context: TerminalContext }) => {
    const agentCommands = ['personality', 'unique-features', 'stats', 'memory'];
    return agentCommands.includes(context.lastParsedCommand || '');
  },

  /**
   * Command validation guards
   */
  isValidCommand: ({ context }: { context: TerminalContext }) => {
    const parsed = parseCommand(context.currentInput);
    return parsed.isValid;
  },

  isInvalidCommand: ({ context }: { context: TerminalContext }) => {
    const parsed = parseCommand(context.currentInput);
    return !parsed.isValid;
  },

  /**
   * Workflow state guards
   */
  isDreamActive: ({ context }: { context: TerminalContext }) => {
    return context.isDreamActive;
  },

  isChatActive: ({ context }: { context: TerminalContext }) => {
    return context.isChatActive;
  },

  /**
   * Chat confirmation guards
   */
  isChatAwaitingConfirmation: ({ context }: { context: TerminalContext }) => {
    const chatState = context.chatRef?.getSnapshot();
    return !!chatState?.context?.awaitingConfirmation;
  },

  /**
   * Input type guards
   */
  isYesInput: ({ context }: { context: TerminalContext }) => {
    const input = context.currentInput.trim().toLowerCase();
    return input === 'y' || input === 'yes';
  },

  isNoInput: ({ context }: { context: TerminalContext }) => {
    const input = context.currentInput.trim().toLowerCase();
    return input === 'n' || input === 'no';
  },

  isConfirmationInput: ({ context }: { context: TerminalContext }) => {
    const input = context.currentInput.trim().toLowerCase();
    return input === 'y' || input === 'yes' || input === 'n' || input === 'no';
  },

  /**
   * History navigation guards
   */
  hasCommandHistory: ({ context }: { context: TerminalContext }) => {
    return context.commandHistory.length > 0;
  },

  canNavigateHistoryUp: ({ context }: { context: TerminalContext }) => {
    return context.commandHistory.length > 0 && 
           (context.historyIndex === -1 || context.historyIndex > 0);
  },

  canNavigateHistoryDown: ({ context }: { context: TerminalContext }) => {
    return context.historyIndex !== -1 && 
           context.historyIndex < context.commandHistory.length - 1;
  }
};