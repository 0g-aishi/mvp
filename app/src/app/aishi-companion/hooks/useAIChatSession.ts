/**
 * @fileoverview AI Chat Session Hook
 * @description Manages chat session lifecycle and integrates with terminal chat services
 */

import { useState, useCallback, useRef } from 'react';
import type { Live2DModelRef } from '@/components/live2d/utils/live2d-types';
import { sendToAI } from '@/terminal-xstate/services/apiService';
import { fetchChatContext } from '@/terminal-xstate/machines/chatServices';
import { buildLive2DChatPrompt } from '../services/live2dChatPromptBuilder';
import type { ChatMessage } from '@/terminal-xstate/machines/chatMachine';
import toast from 'react-hot-toast';

import { logger } from '@/lib/logger';

const log = logger.child({ component: 'useAIChatSession' });

export type SessionState =
  | 'idle'
  | 'confirming'
  | 'initializing'
  | 'ready'
  | 'thinking'
  | 'animating'
  | 'speaking'
  | 'confirmingSave'
  | 'summarizing'
  | 'saving'
  | 'uploadRetryPrompt'
  | 'contractRetryPrompt'
  | 'completed'
  | 'error';

interface SessionContext {
  agentId: number;
  agentName: string;
  agentContext: any | null;
  historicalData: any | null;
}

/**
 * Default Aishi personality for fallback when no agent NFT exists
 */
const DEFAULT_AISHI_PERSONALITY = {
  agentData: {
    intelligenceLevel: 1,
    dreamCount: 0,
    conversationCount: 0
  },
  personality: {
    creativity: 75,
    analytical: 60,
    empathy: 85,
    intuition: 70,
    resilience: 65,
    curiosity: 80,
    dominantMood: 'cheerful'
  },
  uniqueFeatures: [],
  memory: {}
};

/**
 * Hook for managing AI chat session with Live2D integration
 * Reuses terminal-xstate chat services for consistency
 */
export const useAIChatSession = (
  modelRef: React.RefObject<Live2DModelRef>,
  currentParameters: Map<string, number>
) => {
  const [state, setState] = useState<SessionState>('idle');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sessionContext, setSessionContext] = useState<SessionContext | null>(null);
  const [saveData, setSaveData] = useState<{
    summary: any | null;
    fileData: any | null;
    rootHash: string | null;
    txHash: string | null;
  }>({ summary: null, fileData: null, rootHash: null, txHash: null });

  // Retry state (like chatMachine)
  const [retryCount, setRetryCount] = useState(0);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [retryStep, setRetryStep] = useState<'upload' | 'contract' | null>(null);
  const MAX_RETRIES = 3;

  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Initialize chat session
   * Loads agent context from blockchain and 0G storage (like terminal chat)
   */
  const initializeSession = useCallback(async (agentId: number = 1, agentName: string = 'Aishi') => {
    log.debug('Initializing chat session', { agentId, agentName });

    setState('initializing');
    setError(null);

    try {
      // Fetch context (reuse terminal chat service)
      const contextData = await fetchChatContext(agentId, false);

      // Extract agent name from contract data or use fallback
      const contractAgentName = contextData.agentContext?.agentData?.agentName || agentName;

      setSessionContext({
        agentId,
        agentName: contractAgentName,
        agentContext: contextData.agentContext,
        historicalData: contextData.historicalData
      });

      setState('ready');
      log.debug('Session initialized successfully', {
        agentName: contractAgentName,
        hasAgentContext: !!contextData.agentContext,
        hasHistoricalData: !!contextData.historicalData
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize session';
      setError(errorMessage);
      setState('error');
      log.debug('Session initialization failed', { error: errorMessage });
    }
  }, []);

  /**
   * Send user message and get AI response
   */
  const sendMessage = useCallback(async (userInput: string): Promise<string | null> => {
    if (!sessionContext) {
      log.debug('Cannot send message - session not initialized');
      return null;
    }

    log.debug('Sending user message', {
      messageLength: userInput.length,
      currentMessageCount: messages.length
    });

    setState('thinking');

    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: userInput,
      timestamp: Date.now()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    try {
      // Build prompt with Live2D parameter context
      const prompt = buildLive2DChatPrompt({
        userMessage: userInput,
        messages: updatedMessages,
        agentContext: sessionContext.agentContext,
        historicalData: sessionContext.historicalData,
        agentName: sessionContext.agentName,
        isFirstMessage: messages.length === 0,
        currentParameters
      });

      log.debug('Prompt built, sending to AI', {
        promptLength: prompt.length
      });

      // Send to AI (reuse terminal service)
      const aiResponse = await sendToAI(prompt, 'gemini-2.5-flash');

      log.debug('AI response received', {
        responseLength: aiResponse.length
      });

      // Add AI message to state
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: aiResponse,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, aiMessage]);

      setState('ready');
      return aiResponse;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get AI response';
      setError(errorMessage);
      setState('error');
      log.debug('Send message failed', { error: errorMessage });
      return null;
    }
  }, [sessionContext, messages, currentParameters]);

  /**
   * Initialize session with fallback personality (no blockchain)
   * Used when user has no agent NFT or wallet not connected
   */
  const initializeSessionWithFallback = useCallback(async (agentName: string = 'Aishi') => {
    log.debug('Initializing session with fallback personality (no blockchain)');

    setState('initializing');
    setError(null);

    setSessionContext({
      agentId: 0,
      agentName,
      agentContext: DEFAULT_AISHI_PERSONALITY,
      historicalData: null
    });

    setState('ready');
    log.debug('Fallback session initialized successfully');
  }, []);

  /**
   * Reset session
   */
  const resetSession = useCallback(() => {
    setMessages([]);
    setSessionContext(null);
    setState('idle');
    setError(null);
    log.debug('Session reset');
  }, []);

  /**
   * Cancel ongoing AI request
   */
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setState('ready');
      log.debug('AI request cancelled');
    }
  }, []);

  /**
   * End session - trigger save confirmation
   */
  const endSession = useCallback(() => {
    log.debug('Ending session, showing save confirmation');
    setState('confirmingSave');
  }, []);

  /**
   * Retry failed operation (upload or contract)
   */
  const retryOperation = useCallback(async () => {
    if (!retryStep || !saveData) {
      log.debug('No retry step defined');
      return;
    }

    log.debug('User chose to retry', { step: retryStep, attempt: retryCount });

    // Reset retry state for new attempt
    setRetryCount(0);
    setRetryError(null);
    setState('saving');

    try {
      if (retryStep === 'upload') {
        // Retry upload from saved fileData
        const { uploadToStorage } = await import('@/terminal-xstate/services/xstateStorage');

        const uploadResult = await uploadToStorage(
          saveData.fileData.fileContent,
          saveData.fileData.fileName,
          (status) => log.debug('Upload status', { status })
        );

        setSaveData(prev => ({ ...prev, rootHash: uploadResult.rootHash }));
        log.debug('Retry upload successful', { rootHash: uploadResult.rootHash });

        // Continue to contract update
        const { updateConversationContract } = await import('@/terminal-xstate/services/conversationContractUpdater');

        const contractResult = await updateConversationContract(
          sessionContext!.agentId,
          uploadResult.rootHash,
          saveData.summary?.type || 'general_chat'
        );

        setSaveData(prev => ({ ...prev, txHash: contractResult.txHash }));
        log.debug('Contract updated after upload retry', { txHash: contractResult.txHash });

        // Show success toast
        toast.success(
          `✓ Conversation saved on-chain! TX: ${contractResult.txHash.substring(0, 10)}...${contractResult.txHash.substring(contractResult.txHash.length - 8)}`,
          {
            duration: 5000,
            style: {
              background: '#fff',
              color: '#000',
              borderLeft: '4px solid #22C55E',
              padding: '16px',
              maxWidth: '500px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '14px',
              fontWeight: '500'
            }
          }
        );

      } else if (retryStep === 'contract') {
        // Retry contract update from saved rootHash
        const { updateConversationContract } = await import('@/terminal-xstate/services/conversationContractUpdater');

        const contractResult = await updateConversationContract(
          sessionContext!.agentId,
          saveData.rootHash!,
          saveData.summary?.type || 'general_chat'
        );

        setSaveData(prev => ({ ...prev, txHash: contractResult.txHash }));
        log.debug('Retry contract update successful', { txHash: contractResult.txHash });

        // Show success toast
        toast.success(
          `✓ Conversation saved on-chain! TX: ${contractResult.txHash.substring(0, 10)}...${contractResult.txHash.substring(contractResult.txHash.length - 8)}`,
          {
            duration: 5000,
            style: {
              background: '#fff',
              color: '#000',
              borderLeft: '4px solid #22C55E',
              padding: '16px',
              maxWidth: '500px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '14px',
              fontWeight: '500'
            }
          }
        );
      }

      // Success - complete
      setState('completed');
      setRetryStep(null);

      setTimeout(() => {
        resetSession();
        setSaveData({ summary: null, fileData: null, rootHash: null, txHash: null });
      }, 2000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Retry failed';
      setError(errorMessage);
      setState('error');
      log.debug('Retry operation failed', { error: errorMessage });
    }
  }, [retryStep, retryCount, saveData, sessionContext, resetSession]);

  /**
   * Abort retry - complete session without saving
   */
  const abortRetry = useCallback(() => {
    log.debug('User aborted retry, completing without save');
    setState('completed');
    setRetryCount(0);
    setRetryError(null);
    setRetryStep(null);

    setTimeout(() => {
      resetSession();
      setSaveData({ summary: null, fileData: null, rootHash: null, txHash: null });
    }, 500);
  }, [resetSession]);

  /**
   * Confirm save - execute full save workflow (1:1 from chatMachine)
   */
  const confirmSave = useCallback(async (shouldSave: boolean) => {
    if (!shouldSave || !sessionContext) {
      log.debug('Save cancelled, completing session');
      setState('completed');
      setTimeout(() => {
        resetSession();
      }, 500);
      return;
    }

    if (messages.length === 0) {
      log.debug('No messages to save');
      setState('completed');
      setTimeout(() => {
        resetSession();
      }, 500);
      return;
    }

    try {
      // Step 1: Generate conversation summary (like chatMachine summarizingConversation)
      log.debug('Generating conversation summary');
      setState('summarizing');

      const { generateConversationSummary } = await import('@/terminal-xstate/machines/chatServices');

      const transcript = messages
        .map(m => `${m.role === 'user' ? 'User' : sessionContext.agentName}: ${m.content}`)
        .join('\n');

      const summaryResult = await generateConversationSummary(
        transcript,
        messages,
        sessionContext.agentId,
        'gemini-2.5-flash'
      );

      setSaveData(prev => ({ ...prev, summary: summaryResult.summary }));
      log.debug('Summary generated', { summary: summaryResult.summary });

      // Step 2: Prepare conversation file (like chatMachine savingConversation.preparingFile)
      log.debug('Preparing conversation file');
      setState('saving');

      const { ConversationFileManager } = await import('@/terminal-xstate/services/conversationFileManager');
      const fileManager = new ConversationFileManager();

      const fileResult = await fileManager.manageConversationFile(
        sessionContext.agentId,
        sessionContext.agentName,
        summaryResult.summary
      );

      setSaveData(prev => ({ ...prev, fileData: fileResult }));
      log.debug('File prepared', { fileName: fileResult.fileName });

      // Step 3: Upload to 0G storage with retry logic (like chatMachine storageUploadFailed)
      log.debug('Uploading to 0G storage');

      const { uploadToStorage } = await import('@/terminal-xstate/services/xstateStorage');

      let uploadResult = null;
      let uploadAttempt = 0;

      while (uploadAttempt < MAX_RETRIES) {
        try {
          uploadResult = await uploadToStorage(
            fileResult.fileContent,
            fileResult.fileName,
            (status) => log.debug('Upload status', { status })
          );

          log.debug('Upload complete', { rootHash: uploadResult.rootHash });
          break; // Success

        } catch (uploadErr) {
          uploadAttempt++;
          const uploadErrorMsg = uploadErr instanceof Error ? uploadErr.message : 'Upload failed';

          if (uploadAttempt >= MAX_RETRIES) {
            // Max retries reached - ask user
            log.debug(`Upload failed after ${MAX_RETRIES} attempts`, { error: uploadErrorMsg });
            setRetryCount(uploadAttempt);
            setRetryError(uploadErrorMsg);
            setRetryStep('upload');
            setState('uploadRetryPrompt');
            return; // Wait for user decision via retryOperation()
          }

          log.debug(`Upload attempt ${uploadAttempt} failed, retrying in 2s...`, { error: uploadErrorMsg });
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      if (!uploadResult) {
        throw new Error('Upload failed after all retries');
      }

      setSaveData(prev => ({ ...prev, rootHash: uploadResult.rootHash }));

      // Step 4: Update contract with retry logic (like chatMachine)
      log.debug('Updating blockchain contract');

      const { updateConversationContract } = await import('@/terminal-xstate/services/conversationContractUpdater');

      let contractResult = null;
      let contractAttempt = 0;

      while (contractAttempt < MAX_RETRIES) {
        try {
          contractResult = await updateConversationContract(
            sessionContext.agentId,
            uploadResult.rootHash,
            summaryResult.summary?.type || 'general_chat'
          );

          log.debug('Contract updated', { txHash: contractResult.txHash });
          break; // Success

        } catch (contractErr) {
          contractAttempt++;
          const contractErrorMsg = contractErr instanceof Error ? contractErr.message : 'Contract update failed';

          if (contractAttempt >= MAX_RETRIES) {
            // Max retries reached - ask user
            log.debug(`Contract update failed after ${MAX_RETRIES} attempts`, { error: contractErrorMsg });
            setRetryCount(contractAttempt);
            setRetryError(contractErrorMsg);
            setRetryStep('contract');
            setState('contractRetryPrompt');
            return; // Wait for user decision via retryOperation()
          }

          log.debug(`Contract attempt ${contractAttempt} failed, retrying in 2s...`, { error: contractErrorMsg });
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      if (!contractResult) {
        throw new Error('Contract update failed after all retries');
      }

      setSaveData(prev => ({ ...prev, txHash: contractResult.txHash }));

      // Show success toast notification
      toast.success(
        `✓ Conversation saved on-chain! TX: ${contractResult.txHash.substring(0, 10)}...${contractResult.txHash.substring(contractResult.txHash.length - 8)}`,
        {
          duration: 5000,
          style: {
            background: '#fff',
            color: '#000',
            borderLeft: '4px solid #22C55E',
            padding: '16px',
            maxWidth: '500px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '14px',
            fontWeight: '500'
          }
        }
      );

      // Complete
      setState('completed');
      log.debug('Save workflow complete');

      // Reset after brief delay
      setTimeout(() => {
        resetSession();
        setSaveData({ summary: null, fileData: null, rootHash: null, txHash: null });
      }, 2000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save conversation';
      setError(errorMessage);
      setState('error');
      log.debug('Save workflow failed', { error: errorMessage });
    }
  }, [sessionContext, messages, resetSession]);

  return {
    state,
    messages,
    error,
    sessionContext,
    saveData,
    retryCount,
    retryError,
    retryStep,
    maxRetries: MAX_RETRIES,
    initializeSession,
    initializeSessionWithFallback,
    sendMessage,
    endSession,
    confirmSave,
    retryOperation,
    abortRetry,
    resetSession,
    cancelRequest
  };
};
