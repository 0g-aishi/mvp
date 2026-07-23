'use client';

import { useState, useCallback } from 'react';
import { useStorageDownload } from '../storage/useStorageDownload';
import { useStorageUpload } from '../storage/useStorageUpload';
import { useWallet } from '../useWallet';
import { useAgentConversation } from './useAgentConversation';
import { useAgentConversationPrompt, buildConversationSummaryPrompt } from './useAgentConversationPrompt';
import { ConversationContextBuilder, ConversationContext, ChatMessage } from './services/conversationContextBuilder';
import { ConversationSummary, ConversationUnifiedSchema } from './types/agentChatTypes';
import { getContractConfig } from './config/contractConfig';
import { getViemProvider, getViemSigner } from '../../lib/0g/fees';
import { getActiveChain } from '../../config/chains';
import type { PublicClient, WalletClient } from 'viem';
import { logger } from '@/lib/logger';

interface ChatSession {
  sessionId: string;
  tokenId: number;
  messages: ChatMessage[];
  builtContext: ConversationContext | null;
  isActive: boolean;
  lastActivity: number;
  // Removed currentSummary - unified schema created on demand
}

interface ChatState {
  session: ChatSession | null;
  isInitializing: boolean;
  isTyping: boolean;
  error: string | null;
  // Save functionality
  isSaving: boolean;
  saveStatus: string;
  // Contract functionality
  isProcessingContract: boolean;
  contractStatus: string;
  // Prompt debugging
  lastPrompt: string | null;
}

// Context types from contract interface
enum ContextType {
  DREAM_DISCUSSION = 0,
  GENERAL_CHAT = 1,
  PERSONALITY_QUERY = 2,
  THERAPEUTIC = 3,
  ADVICE_SEEKING = 4
}

export function useAgentChat(tokenId?: number) {
  const [chatState, setChatState] = useState<ChatState>({
    session: null,
    isInitializing: false,
    isTyping: false,
    error: null,
    isSaving: false,
    saveStatus: '',
    isProcessingContract: false,
    contractStatus: '',
    lastPrompt: null
  });

  const { downloadFile } = useStorageDownload();
  const { uploadFile } = useStorageUpload();
  const { isConnected, address } = useWallet();
  const { sendConversationMessage } = useAgentConversation();
  const { buildConversationPrompt } = useAgentConversationPrompt();

  // Logger instance
  const log = logger.child({ component: 'useAgentChat' });

  // Wrapper function for services that expect function parameter
  const logFn = (message: string, data?: any) => log.debug(message, data);

  log.debug('useAgentChat hook initialized', { tokenId });

  /**
   * Inicjalizuje nową sesję chatu
   */
  const initializeSession = useCallback(async (agentData?: any) => {
    if (!tokenId || !isConnected) {
      setChatState(prev => ({ ...prev, error: 'Token ID and wallet connection required' }));
      return;
    }

    setChatState(prev => ({ 
      ...prev, 
      isInitializing: true, 
      error: null,
      session: null
    }));

    try {
      log('Initializing chat session', { tokenId, hasAgentData: !!agentData });

      const sessionId = `chat_${tokenId}_${Date.now()}`;
      
      // Build conversation context
      let context: ConversationContext;
      
      if (agentData) {
        // Use pre-loaded data from useAgentRead (faster)
        const contextBuilder = new ConversationContextBuilder(null as any, logFn);
        context = await contextBuilder.buildContext(
          tokenId,
          sessionId,
          [], // Empty conversation history for new session
          downloadFile,
          agentData
        );
      } else {
        // Fallback to contract calls
        const [publicClient, publicErr] = await getViemProvider();
        if (!publicClient || publicErr) {
          throw new Error(`PublicClient error: ${publicErr?.message}`);
        }

        const contextBuilder = new ConversationContextBuilder(publicClient, logFn);
        context = await contextBuilder.buildContext(
          tokenId,
          sessionId,
          [], // Empty conversation history for new session
          downloadFile
        );
      }

      const session: ChatSession = {
        sessionId,
        tokenId,
        messages: [],
        builtContext: context,
        isActive: true,
        lastActivity: Date.now()
      };

      setChatState(prev => ({ 
        ...prev, 
        isInitializing: false,
        session
      }));

      log('Chat session initialized successfully', {
        sessionId,
        agentName: context.agentProfile.name,
        memoryDepth: context.memoryAccess.memoryDepth,
        uniqueFeatures: context.uniqueFeatures.length
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setChatState(prev => ({ 
        ...prev, 
        isInitializing: false,
        error: errorMessage
      }));
      log('Session initialization failed', { error: errorMessage });
    }
  }, [tokenId, isConnected, downloadFile, log]);

  /**
   * Wysyła wiadomość do agenta
   */
  const sendMessage = useCallback(async (userMessage: string) => {
    if (!chatState.session || !chatState.session.builtContext) {
      setChatState(prev => ({ ...prev, error: 'Chat session not initialized' }));
      return;
    }

    if (!userMessage.trim()) {
      setChatState(prev => ({ ...prev, error: 'Message cannot be empty' }));
      return;
    }

    log('Sending message to agent', { 
      sessionId: chatState.session.sessionId,
      messageLength: userMessage.length
    });

    // Add user message to chat
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: Date.now()
    };

    setChatState(prev => ({
      ...prev,
      session: prev.session ? {
        ...prev.session,
        messages: [...prev.session.messages, userMsg],
        lastActivity: Date.now()
      } : null,
      isTyping: true,
      error: null
    }));

    try {
      // Build conversation prompt with current context + updated history
      const updatedContext = {
        ...chatState.session.builtContext,
        conversationHistory: [...chatState.session.messages, userMsg]
      };

      const conversationPrompt = buildConversationPrompt(updatedContext, userMessage);
      
      // Save prompt for debugging
      setChatState(prev => ({ ...prev, lastPrompt: conversationPrompt.prompt }));
      
      log('Sending to AI', { 
        promptLength: conversationPrompt.prompt.length,
        agentName: updatedContext.agentProfile.name
      });

      // Send to AI (dedicated conversation service)
      const parsedResponse = await sendConversationMessage(conversationPrompt);

      if (parsedResponse && parsedResponse.agentResponse) {
        const agentMsg: ChatMessage = {
          id: `agent_${Date.now()}`,
          role: 'agent',
          content: parsedResponse.agentResponse,
          timestamp: Date.now(),
          metadata: {
            conversationType: 'general_chat',
            emotionalTone: 'neutral', // Simplified - no summary
            uniqueFeatures: updatedContext.uniqueFeatures.map(f => f.name)
          }
        };

        setChatState(prev => ({
          ...prev,
          session: prev.session ? {
            ...prev.session,
            messages: [...prev.session.messages, agentMsg],
            lastActivity: Date.now()
            // Removed currentSummary - no auto-summary
          } : null,
          isTyping: false
        }));

        log('Message sent successfully', {
          agentResponseLength: agentMsg.content.length,
          totalMessages: chatState.session.messages.length + 2
        });
      } else {
        throw new Error('AI conversation response was empty or invalid');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setChatState(prev => ({ 
        ...prev, 
        isTyping: false,
        error: errorMessage
      }));
      log('Message sending failed', { error: errorMessage });
    }
  }, [chatState.session, sendConversationMessage, buildConversationPrompt, log]);

  /**
   * NEW: Wysyła rozmowę do LLM dla utworzenia unified summary
   */
  const createConversationSummary = async (
    conversationHistory: ChatMessage[],
    context: ConversationContext
  ): Promise<ConversationUnifiedSchema | null> => {
    try {
      log('Creating conversation summary with LLM', {
        messageCount: conversationHistory.length,
        agentName: context.agentProfile.name
      });

      // Build summarization prompt
      const summaryPrompt = buildConversationSummaryPrompt(context, conversationHistory);
      
      log('Sending to AI for summarization', { 
        promptLength: summaryPrompt.length
      });

      // Send to AI compute service
      const apiUrl = process.env.NEXT_PUBLIC_COMPUTE_API_URL || 'http://localhost:3001/api';
      
      const response = await fetch(`${apiUrl}/0g-compute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
          query: summaryPrompt
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const apiResult = await response.json();
      
      if (!apiResult.success) {
        throw new Error(apiResult.error || 'Conversation summarization failed');
      }

      const aiResponseText = apiResult.data.response;
      log('LLM summary response received', { responseLength: aiResponseText.length });

      // Parse JSON response
      const jsonMatch = aiResponseText.match(/```json\s*([\s\S]*?)\s*```/);
      if (!jsonMatch) {
        throw new Error('No JSON block found in LLM response');
      }

      const summaryData = JSON.parse(jsonMatch[1]) as ConversationUnifiedSchema;
      
      log('Conversation summary created', {
        conversationId: summaryData.id,
        topic: summaryData.topic,
        type: summaryData.type,
        duration: summaryData.duration,
        keyInsights: summaryData.key_insights.length
      });

      return summaryData;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log('Conversation summarization failed', { error: errorMessage });
      return null;
    }
  };

  /**
   * Zapisuje konwersację do storage i kontraktu - używa unified schema
   */
  const saveConversation = useCallback(async () => {
    if (!chatState.session || !chatState.session.builtContext || chatState.session.messages.length === 0) {
      setChatState(prev => ({ ...prev, error: 'No conversation to save' }));
      return;
    }

    setChatState(prev => ({ 
      ...prev, 
      isSaving: true, 
      saveStatus: 'Creating conversation summary...',
      error: null
    }));

    try {
      log('Starting conversation save with unified schema', {
        sessionId: chatState.session.sessionId,
        messageCount: chatState.session.messages.length
      });

      // 1. Create unified summary using LLM
      const unifiedSummary = await createConversationSummary(
        chatState.session.messages, 
        chatState.session.builtContext
      );
      
      if (!unifiedSummary) {
        throw new Error('Failed to create conversation summary');
      }

      // 2. Save to storage
      setChatState(prev => ({ ...prev, saveStatus: 'Uploading to storage...' }));
      const rootHash = await saveConversationToStorage(chatState.session.tokenId, unifiedSummary);

      if (rootHash) {
        // 3. Record in contract
        setChatState(prev => ({ ...prev, saveStatus: 'Recording in contract...' }));
        await recordConversationInContract(chatState.session.tokenId, rootHash);

        setChatState(prev => ({ 
          ...prev, 
          isSaving: false,
          saveStatus: 'Conversation saved successfully!'
        }));

        log('Conversation saved successfully with unified schema', {
          conversationId: unifiedSummary.id,
          rootHash,
          topic: unifiedSummary.topic,
          type: unifiedSummary.type,
          duration: unifiedSummary.duration,
          relationshipDepth: unifiedSummary.relationship_depth
        });

        // Clear save status after 3 seconds
        setTimeout(() => {
          setChatState(prev => ({ ...prev, saveStatus: '' }));
        }, 3000);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setChatState(prev => ({ 
        ...prev, 
        isSaving: false,
        saveStatus: `Save failed: ${errorMessage}`
      }));
      log('Conversation save failed', { error: errorMessage });
    }
  }, [chatState.session, address, log]);

  /**
   * Zapisuje konwersację do storage (append-only pattern) - unified schema
   */
  const saveConversationToStorage = async (tokenId: number, conversationData: ConversationUnifiedSchema): Promise<string> => {
    try {
      log('Saving conversation to storage with unified schema', { 
        tokenId, 
        conversationId: conversationData.id,
        topic: conversationData.topic,
        type: conversationData.type
      });

      // 1. Get current conversation hash from contract
      const [publicClient] = await getViemProvider();
      const contractConfig = getContractConfig();

      const agentMemory = await publicClient!.readContract({
        address: contractConfig.address,
        abi: contractConfig.abi,
        functionName: 'getAgentMemory',
        args: [BigInt(tokenId)]
      });
      const currentConvHash = (agentMemory as any).currentConvDailyHash;
      const emptyHash = '0x0000000000000000000000000000000000000000000000000000000000000000';

      // 2. Download existing conversations
      let existingConversations: any[] = [];
      if (currentConvHash && currentConvHash !== emptyHash) {
        log('Downloading existing conversations', { hash: currentConvHash });
        const downloadResult = await downloadFile(currentConvHash);
        if (downloadResult.success && downloadResult.data) {
          const textDecoder = new TextDecoder('utf-8');
          const jsonString = textDecoder.decode(downloadResult.data);
          existingConversations = JSON.parse(jsonString);
        }
      }

      // 3. Add new conversation to top (append-only, newest first)
      const updatedConversations = [conversationData, ...existingConversations];

      // 4. Create file and upload
      const fileName = `conversation_essence_daily_${new Date().toISOString().slice(0, 7)}.json`;
      const file = new File(
        [JSON.stringify(updatedConversations, null, 2)],
        fileName,
        { type: 'application/json' }
      );

      log('Uploading conversations file with unified schema', { 
        fileName, 
        totalConversations: updatedConversations.length,
        fileSize: file.size,
        newConversationType: conversationData.type,
        relationshipDepth: conversationData.relationship_depth
      });

      const uploadResult = await uploadFile(file);
      
      if (uploadResult.success && uploadResult.rootHash) {
        log('Conversation uploaded successfully', { 
          rootHash: uploadResult.rootHash,
          totalConversations: updatedConversations.length
        });
        return uploadResult.rootHash;
      } else {
        throw new Error(uploadResult.error || 'Upload failed');
      }

    } catch (error) {
      log('Storage save failed', { error: error.message });
      throw error;
    }
  };

  /**
   * Zapisuje hash konwersacji w kontrakcie
   */
  const recordConversationInContract = async (tokenId: number, conversationHash: string) => {
    try {
      log('Recording conversation in contract', { tokenId, conversationHash });

      setChatState(prev => ({ 
        ...prev, 
        isProcessingContract: true,
        contractStatus: 'Connecting to contract...'
      }));

      const [walletClient, walletErr] = await getViemSigner();
      if (!walletClient || walletErr) {
        throw new Error(`WalletClient error: ${walletErr?.message}`);
      }

      // Get account from walletClient
      const [account] = await walletClient.getAddresses();
      if (!account) {
        throw new Error('No account available');
      }

      const contractConfig = getContractConfig();

      const hashBytes32 = conversationHash.startsWith('0x') ? conversationHash : `0x${conversationHash}`;

      const contextType = ContextType.GENERAL_CHAT;

      setChatState(prev => ({ 
        ...prev, 
        contractStatus: 'Calling recordConversation...'
      }));

      const txHash = await walletClient.writeContract({
        address: contractConfig.address,
        abi: contractConfig.abi,
        functionName: 'recordConversation',
        chain: getActiveChain(),
        account,
        args: [BigInt(tokenId), hashBytes32 as `0x${string}`, contextType]
      });

      setChatState(prev => ({ 
        ...prev, 
        contractStatus: 'Waiting for confirmation...'
      }));

      const [publicClient] = await getViemProvider();
      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });

      setChatState(prev => ({ 
        ...prev, 
        isProcessingContract: false,
        contractStatus: 'Conversation recorded successfully!'
      }));

      log('Conversation recorded in contract', {
        txHash,
        gasUsed: receipt.gasUsed?.toString()
      });

      // Clear contract status after 3 seconds
      setTimeout(() => {
        setChatState(prev => ({ ...prev, contractStatus: '' }));
      }, 3000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setChatState(prev => ({ 
        ...prev, 
        isProcessingContract: false,
        contractStatus: `Contract recording failed: ${errorMessage}`
      }));
      log('Contract recording failed', { error: errorMessage });
      throw error;
    }
  };

  /**
   * Resetuje sesję chatu
   */
  const resetSession = useCallback(() => {
    setChatState({
      session: null,
      isInitializing: false,
      isTyping: false,
      error: null,
      isSaving: false,
      saveStatus: '',
      isProcessingContract: false,
      contractStatus: '',
      lastPrompt: null
    });
    log('Chat session reset');
  }, [log]);

  return {
    // Session management
    session: chatState.session,
    isInitializing: chatState.isInitializing,
    initializeSession,
    resetSession,
    
    // Messages
    messages: chatState.session?.messages || [],
    sendMessage,
    isTyping: chatState.isTyping,
    
    // Save functionality
    saveConversation,
    isSaving: chatState.isSaving,
    saveStatus: chatState.saveStatus,
    
    // Contract functionality
    isProcessingContract: chatState.isProcessingContract,
    contractStatus: chatState.contractStatus,
    
    // Error handling
    error: chatState.error,
    clearError: () => setChatState(prev => ({ ...prev, error: null })),
    
    // Prompt debugging
    lastPrompt: chatState.lastPrompt
  };
}

/**
 * Helper functions
 */

function detectConversationType(messages: ChatMessage[] | string): string {
  if (typeof messages === 'string') {
    const text = messages.toLowerCase();
    if (text.includes('dream') || text.includes('nightmare')) return 'dream_discussion';
    if (text.includes('feel') || text.includes('emotion') || text.includes('help')) return 'therapeutic';
    if (text.includes('advice') || text.includes('should') || text.includes('what do you think')) return 'advice_seeking';
    if (text.includes('personality') || text.includes('trait') || text.includes('who are you')) return 'personality_query';
    return 'general_chat';
  }
  
  // For message arrays, analyze content
  const userMessages = Array.isArray(messages) ? messages.filter(m => m.role === 'user') : [];
  const allText = userMessages.map(m => m.content).join(' ').toLowerCase();
  
  if (allText.includes('dream') || allText.includes('nightmare')) return 'dream_discussion';
  if (allText.includes('feel') || allText.includes('emotion') || allText.includes('help')) return 'therapeutic';
  if (allText.includes('advice') || allText.includes('should') || allText.includes('what do you think')) return 'advice_seeking';
  if (allText.includes('personality') || allText.includes('trait') || allText.includes('who are you')) return 'personality_query';
  return 'general_chat';
}

function detectEmotionalTone(messages: ChatMessage[] | string): string {
  if (typeof messages === 'string') {
    const text = messages.toLowerCase();
    if (text.includes('happy') || text.includes('joy') || text.includes('excited')) return 'positive';
    if (text.includes('sad') || text.includes('worried') || text.includes('anxious')) return 'negative';
    if (text.includes('curious') || text.includes('wonder') || text.includes('interesting')) return 'curious';
    return 'neutral';
  }
  
  // For message arrays
  const allText = Array.isArray(messages) ? messages.map(m => m.content).join(' ').toLowerCase() : '';
  if (allText.includes('happy') || allText.includes('joy') || allText.includes('excited')) return 'positive';
  if (allText.includes('sad') || allText.includes('worried') || allText.includes('anxious')) return 'negative';
  if (allText.includes('curious') || allText.includes('wonder') || allText.includes('interesting')) return 'curious';
  return 'neutral';
}

function extractConversationTopic(messages: ChatMessage[]): string {
  if (messages.length === 0) return 'General conversation';
  
  const userMessages = messages.filter(m => m.role === 'user');
  if (userMessages.length === 0) return 'General conversation';
  
  // Use first user message as topic basis
  const firstMessage = userMessages[0].content;
  if (firstMessage.length > 50) {
    return firstMessage; // PEŁNA treść - bez obcinania
  }
  return firstMessage;
}

function calculateDuration(messages: ChatMessage[]): number {
  if (messages.length < 2) return 1;
  
  const timestamps = messages.map(m => m.timestamp);
  const start = Math.min(...timestamps);
  const end = Math.max(...timestamps);
  
  return Math.max(1, Math.round((end - start) / 60000)); // Convert to minutes
}

function extractKeyInsights(messages: ChatMessage[]): string[] {
  // Simple extraction - could be more sophisticated
  const insights = [];
  const agentMessages = messages.filter(m => m.role === 'agent');
  
  for (const msg of agentMessages) {
    if (msg.content.includes('insight') || msg.content.includes('understand') || msg.content.includes('realize')) {
      insights.push(msg.content);
    }
  }
  
  return insights; // WSZYSTKIE insights - bez ograniczeń
}

function extractFollowUpQuestions(messages: ChatMessage[]): string[] {
  const questions = [];
  const agentMessages = messages.filter(m => m.role === 'agent');
  
  for (const msg of agentMessages) {
    const sentences = msg.content.split(/[.!?]+/);
    for (const sentence of sentences) {
      if (sentence.trim().endsWith('?')) {
        questions.push(sentence.trim() + '?');
      }
    }
  }
  
  return questions; // WSZYSTKIE questions - bez ograniczeń
}

function mapConversationTypeToEnum(conversationType: string): ContextType {
  switch (conversationType) {
    case 'dream_discussion': return ContextType.DREAM_DISCUSSION;
    case 'therapeutic': return ContextType.THERAPEUTIC;
    case 'advice_seeking': return ContextType.ADVICE_SEEKING;
    case 'personality_query': return ContextType.PERSONALITY_QUERY;
    default: return ContextType.GENERAL_CHAT;
  }
}
