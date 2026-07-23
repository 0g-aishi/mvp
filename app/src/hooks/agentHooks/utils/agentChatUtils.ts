/**
 * Utility functions for Agent Chat functionality
 */

import { ContextType } from '../types/agentChatTypes';

// Error parsing utility (SAME AS useAgentDream)
export const parseViemError = (error: any): string => {
  if (error?.message?.includes('execution reverted')) {
    let revertReason = null;
    const patterns = [
      /execution reverted: (.+?)(?:\n|$)/,
      /execution reverted with reason: (.+?)(?:\n|$)/,
      /revert (.+?)(?:\n|$)/,
      /reverted with reason string '(.+?)'/,
      /reverted with custom error '(.+?)'/
    ];
    
    for (const pattern of patterns) {
      const match = error.message.match(pattern);
      if (match) {
        revertReason = match[1].trim();
        break;
      }
    }
    
    if (revertReason) {
      switch (revertReason) {
        case 'Agent not found':
          return 'Agent not found. Please ensure you own a valid agent.';
        case 'Agent not owned by sender':
          return 'You do not own this agent. Only the agent owner can have conversations.';
        case 'Conversation recording paused':
          return 'Conversation recording is temporarily paused. Please try again later.';
        default:
          return `Contract error: ${revertReason}`;
      }
    } else {
      return 'Transaction failed due to contract requirements not being met.';
    }
  }
  
  if (error?.message?.includes('User rejected') || error?.name === 'UserRejectedRequestError') {
    return 'Transaction was rejected by user.';
  }
  
  if (error?.message?.includes('insufficient funds')) {
    return 'Insufficient funds in your wallet to complete the transaction.';
  }
  
  if (error?.message?.includes('network') || error?.message?.includes('connection')) {
    return 'Network connection error. Please check your internet connection and try again.';
  }
  
  if (error?.message?.includes('gas')) {
    return 'Gas estimation failed. The transaction may fail or network may be congested.';
  }
  
  if (error?.message?.includes('timeout')) {
    return 'Transaction timeout. Please try again or increase gas price.';
  }
  
  return error?.message || 'An unexpected error occurred during conversation.';
};

// Detect context type from user message
export const detectContextType = (userMessage: string): ContextType => {
  const message = userMessage.toLowerCase();
  
  if (message.includes('dream') || message.includes('nightmare') || message.includes('sleep')) {
    return ContextType.DREAM_DISCUSSION;
  }
  
  if (message.includes('personality') || message.includes('trait') || message.includes('character')) {
    return ContextType.PERSONALITY_QUERY;
  }
  
  if (message.includes('help') || message.includes('advice') || message.includes('what should')) {
    return ContextType.ADVICE_SEEKING;
  }
  
  if (message.includes('feel') || message.includes('emotion') || message.includes('therapy')) {
    return ContextType.THERAPEUTIC;
  }
  
  return ContextType.GENERAL_CHAT;
};

// Helper function to ensure proper hex format
export const ensureProperHex = (hash: string): string => {
  if (hash.startsWith('0x')) {
    return hash;
  }
  return `0x${hash}`;
}; 