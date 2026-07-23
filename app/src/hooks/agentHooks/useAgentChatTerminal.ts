'use client';

import { useState, useCallback } from 'react';
import { useStorageDownload } from '../storage/useStorageDownload';
import { useStorageUpload } from '../storage/useStorageUpload';
import { useWallet } from '../useWallet';
import { useAgentConversation } from './useAgentConversation';
import { useAgentConversationPrompt, buildConversationSummaryPrompt } from './useAgentConversationPrompt';
import { ConversationContextBuilder, ConversationContext, ChatMessage } from './services/conversationContextBuilder';
import { ConversationUnifiedSchema } from './types/agentChatTypes';
import { getContractConfig } from './config/contractConfig';
import { getViemProvider, getViemSigner } from '../../lib/0g/fees';
import { getActiveChain } from '../../config/chains';
import type { PublicClient, WalletClient } from 'viem';
import { logger } from '@/lib/logger';

interface TerminalChatSession {
  sessionId: string;
  tokenId: number;
  messages: ChatMessage[];
  builtContext: ConversationContext | null;
  isActive: boolean;
  lastActivity: number;
}

interface TerminalChatState {
  session: TerminalChatSession | null;
  isInitializing: boolean;
  isSendingMessage: boolean;
  isSavingConversation: boolean;
  error: string | null;
}

// Context types from contract interface
enum ContextType {
  DREAM_DISCUSSION = 0,
  GENERAL_CHAT = 1,
  PERSONALITY_QUERY = 2,
  THERAPEUTIC = 3,
  ADVICE_SEEKING = 4
}

export function useAgentChatTerminal(tokenId?: number) {
  const [chatState, setChatState] = useState<TerminalChatState>({
    session: null,
    isInitializing: false,
    isSendingMessage: false,
    isSavingConversation: false,
    error: null
  });

  const { downloadFile } = useStorageDownload();
  const { uploadFile } = useStorageUpload();
  const { isConnected, address } = useWallet();
  const { sendConversationMessage } = useAgentConversation();
  const { buildConversationPrompt } = useAgentConversationPrompt();

  // Logger instance
  const log = logger.child({ component: 'useAgentChatTerminal' });
  const logFn = (message: string, data?: any) => log.debug(message, data);

  log.debug('useAgentChatTerminal hook initialized', { tokenId });

  /**
   * Inicjalizuje nową sesję chatu dla terminala
   */
  const initializeTerminalChatSession = useCallback(async (agentData?: any) => {
    if (!tokenId || !isConnected) {
      setChatState(prev => ({ ...prev, error: 'Token ID and wallet connection required' }));
      return false;
    }

    setChatState(prev => ({ 
      ...prev, 
      isInitializing: true, 
      error: null,
      session: null
    }));

    try {
      log.debug('Initializing terminal chat session', { tokenId, hasAgentData: !!agentData });

      const sessionId = `terminal_chat_${tokenId}_${Date.now()}`;
      
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

      const session: TerminalChatSession = {
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

      log.debug('Terminal chat session initialized successfully', {
        sessionId,
        agentName: context.agentProfile.name,
        memoryDepth: context.memoryAccess.memoryDepth,
        uniqueFeatures: context.uniqueFeatures.length
      });

      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setChatState(prev => ({ 
        ...prev, 
        isInitializing: false,
        error: errorMessage
      }));
      log.debug('Terminal session initialization failed', { error: errorMessage });
      return false;
    }
  }, [tokenId, isConnected, downloadFile, debugLog]);

  /**
   * Wysyła wiadomość do agenta w terminalu
   */
  const sendTerminalMessage = useCallback(async (userMessage: string): Promise<string | null> => {
    if (!chatState.session || !chatState.session.builtContext) {
      setChatState(prev => ({ ...prev, error: 'Chat session not initialized' }));
      return null;
    }

    if (!userMessage.trim()) {
      setChatState(prev => ({ ...prev, error: 'Message cannot be empty' }));
      return null;
    }

    log.debug('Sending terminal message to agent', { 
      sessionId: chatState.session.sessionId,
      messageLength: userMessage.length
    });

    setChatState(prev => ({ ...prev, isSendingMessage: true, error: null }));

    // Add user message to chat
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: Date.now()
    };

    // Update session with user message
    setChatState(prev => ({
      ...prev,
      session: prev.session ? {
        ...prev.session,
        messages: [...prev.session.messages, userMsg],
        lastActivity: Date.now()
      } : null
    }));

    try {
      // Build conversation prompt with current context + updated history
      const updatedContext = {
        ...chatState.session.builtContext,
        conversationHistory: [...chatState.session.messages, userMsg]
      };

      const conversationPrompt = buildConversationPrompt(updatedContext, userMessage);
      
      log.debug('Sending to AI for terminal chat', { 
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
            emotionalTone: 'neutral',
            uniqueFeatures: updatedContext.uniqueFeatures.map(f => f.name)
          }
        };

        setChatState(prev => ({
          ...prev,
          session: prev.session ? {
            ...prev.session,
            messages: [...prev.session.messages, agentMsg],
            lastActivity: Date.now()
          } : null,
          isSendingMessage: false
        }));

        log.debug('Terminal message sent successfully', {
          agentResponseLength: agentMsg.content.length,
          totalMessages: chatState.session.messages.length + 2
        });

        return parsedResponse.agentResponse;
      } else {
        throw new Error('AI conversation response was empty or invalid');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setChatState(prev => ({ 
        ...prev, 
        isSendingMessage: false,
        error: errorMessage
      }));
      log.debug('Terminal message sending failed', { error: errorMessage });
      return null;
    }
  }, [chatState.session, sendConversationMessage, buildConversationPrompt, debugLog]);

  /**
   * Zapisuje konwersację z terminala do storage i kontraktu
   */
  const saveTerminalConversation = useCallback(async (): Promise<boolean> => {
    if (!chatState.session || !chatState.session.builtContext || chatState.session.messages.length === 0) {
      setChatState(prev => ({ ...prev, error: 'No conversation to save' }));
      return false;
    }

    setChatState(prev => ({ 
      ...prev, 
      isSavingConversation: true,
      error: null
    }));

    try {
      log.debug('Starting terminal conversation save', {
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
      const rootHash = await saveConversationToStorage(chatState.session.tokenId, unifiedSummary);

      if (rootHash) {
        // 3. Record in contract
        await recordConversationInContract(chatState.session.tokenId, rootHash);

        setChatState(prev => ({ 
          ...prev, 
          isSavingConversation: false
        }));

        log.debug('Terminal conversation saved successfully', {
          conversationId: unifiedSummary.id,
          rootHash,
          topic: unifiedSummary.topic,
          type: unifiedSummary.type,
          duration: unifiedSummary.duration
        });

        return true;
      }

      return false;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setChatState(prev => ({ 
        ...prev, 
        isSavingConversation: false,
        error: errorMessage
      }));
      log.debug('Terminal conversation save failed', { error: errorMessage });
      return false;
    }
  }, [chatState.session, address, debugLog]);

  /**
   * Tworzy podsumowanie konwersacji używając LLM
   */
  const createConversationSummary = async (
    conversationHistory: ChatMessage[],
    context: ConversationContext
  ): Promise<ConversationUnifiedSchema | null> => {
    try {
      log.debug('Creating conversation summary with LLM', {
        messageCount: conversationHistory.length,
        agentName: context.agentProfile.name
      });

      // Build summarization prompt
      const summaryPrompt = buildConversationSummaryPrompt(context, conversationHistory);
      
      log.debug('Sending to AI for summarization', { 
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
      log.debug('LLM summary response received', { responseLength: aiResponseText.length });

      // Parse JSON response
      const jsonMatch = aiResponseText.match(/```json\s*([\s\S]*?)\s*```/);
      if (!jsonMatch) {
        throw new Error('No JSON block found in LLM response');
      }

      const summaryData = JSON.parse(jsonMatch[1]) as ConversationUnifiedSchema;
      
      log.debug('Conversation summary created', {
        conversationId: summaryData.id,
        topic: summaryData.topic,
        type: summaryData.type,
        duration: summaryData.duration,
        keyInsights: summaryData.key_insights.length
      });

      return summaryData;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.debug('Conversation summarization failed', { error: errorMessage });
      return null;
    }
  };

  /**
   * Zapisuje konwersację do storage (append-only pattern)
   */
  const saveConversationToStorage = async (tokenId: number, conversationData: ConversationUnifiedSchema): Promise<string> => {
    try {
      log.debug('Saving conversation to storage', { 
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
        log.debug('Downloading existing conversations', { hash: currentConvHash });
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

      log.debug('Uploading conversations file', { 
        fileName, 
        totalConversations: updatedConversations.length,
        fileSize: file.size
      });

      const uploadResult = await uploadFile(file);
      
      if (uploadResult.success && uploadResult.rootHash) {
        log.debug('Conversation uploaded successfully', { 
          rootHash: uploadResult.rootHash,
          totalConversations: updatedConversations.length
        });
        return uploadResult.rootHash;
      } else {
        throw new Error(uploadResult.error || 'Upload failed');
      }

    } catch (error) {
      log.debug('Storage save failed', { error: error.message });
      throw error;
    }
  };

  /**
   * Zapisuje hash konwersacji w kontrakcie
   */
  const recordConversationInContract = async (tokenId: number, conversationHash: string) => {
    try {
      log.debug('Recording conversation in contract', { tokenId, conversationHash });

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

      const txHash = await walletClient.writeContract({
        address: contractConfig.address,
        abi: contractConfig.abi,
        functionName: 'recordConversation',
        chain: getActiveChain(),
        account,
        args: [BigInt(tokenId), hashBytes32 as `0x${string}`, contextType]
      });

      const [publicClient] = await getViemProvider();
      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });

      log.debug('Conversation recorded in contract', {
        txHash,
        gasUsed: receipt.gasUsed?.toString()
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.debug('Contract recording failed', { error: errorMessage });
      throw error;
    }
  };

  /**
   * Resetuje sesję chatu
   */
  const resetTerminalSession = useCallback(() => {
    setChatState({
      session: null,
      isInitializing: false,
      isSendingMessage: false,
      isSavingConversation: false,
      error: null
    });
    log.debug('Terminal chat session reset');
  }, [debugLog]);

  return {
    // Session management
    session: chatState.session,
    isInitializing: chatState.isInitializing,
    initializeTerminalChatSession,
    resetTerminalSession,
    
    // Messages
    messages: chatState.session?.messages || [],
    sendTerminalMessage,
    isSendingMessage: chatState.isSendingMessage,
    
    // Save functionality
    saveTerminalConversation,
    isSavingConversation: chatState.isSavingConversation,
    
    // Error handling
    error: chatState.error,
    clearError: () => setChatState(prev => ({ ...prev, error: null }))
  };
}