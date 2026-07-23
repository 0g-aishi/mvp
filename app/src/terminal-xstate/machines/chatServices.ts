// @ts-nocheck
/**
 * @fileoverview Chat Services for Terminal XState
 * @description Services for chat context loading, AI communication, and persistence
 */

import { ChatMessage } from './chatMachine';
import { logger } from '@/lib/logger';

// Logger instance
const log = logger.child({ component: 'ChatServices' });

/**
 * Fetch full agent context for chat session
 */
export async function fetchChatContext(agentId: number, continueWithoutMemory: boolean = false) {
  log.debug('Fetching chat context', { agentId, continueWithoutMemory });

  try {
    // Import necessary services
    const { ContractReaderService } = await import('../services/contractReader');
    const contractReader = new ContractReaderService();

    // Create timeout promise (15 seconds for context loading)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Context loading timeout')), 15000);
    });

    // Fetch complete agent data with timeout
    const fetchDataPromise = async () => {
      const completeData = await contractReader.getCompleteAgentData(agentId);
      if (!completeData) {
        throw new Error('Agent not found');
      }

      log.debug('Complete agent data fetched', {
        name: completeData.basic.agentName,
        intelligence: completeData.basic.intelligenceLevel,
        dreamCount: completeData.basic.dreamCount,
        conversationCount: completeData.basic.conversationCount,
        hasPersonality: !!completeData.personality,
        hasMemory: !!completeData.memory,
        featuresCount: completeData.features?.length || 0
      });

      return completeData;
    };

    // Race between data fetch and timeout
    const completeData = await Promise.race([
      fetchDataPromise(),
      timeoutPromise
    ]) as any;

    // Build agent context from complete data with null checks
    const agentContext = {
      agentData: completeData.basic || {
        agentName: `Agent #${agentId}`,
        intelligenceLevel: 1,
        dreamCount: 0,
        conversationCount: 0
      },
      personality: completeData.personality || {
        creativity: 50,
        analytical: 50,
        empathy: 50,
        intuition: 50,
        resilience: 50,
        curiosity: 50,
        dominantMood: 'neutral'
      },
      uniqueFeatures: completeData.features || [],
      memory: completeData.memory || {
        memoryCoreHash: '',
        currentDreamDailyHash: '',
        currentConvDailyHash: '',
        lastDreamMonthlyHash: '',
        lastConvMonthlyHash: '',
        lastConsolidation: 0n,
        currentMonth: 0,
        currentYear: 0
      }
    };

    // Fetch historical data (dreams and conversations)
    const historicalData = await fetchHistoricalData(
      completeData.memory || agentContext.memory, 
      agentId,
      continueWithoutMemory
    );

    return {
      agentContext,
      historicalData
    };
  } catch (error) {
    log.debug('Error fetching chat context', { error: String(error) });
    
    // Check for memory/storage errors first (preserve original error for guard)
    const errorStr = String(error);
    if (errorStr.includes('File not found') || 
        errorStr.includes('Download failed') || 
        errorStr.includes('Failed to load daily') ||
        errorStr.includes('Failed to load memory')) {
      // Re-throw memory errors without modification so guard can catch them
      throw error;
    }
    
    if (errorStr.includes('timeout')) {
      throw new Error('Loading is taking longer than usual. Please wait...');
    } else if (errorStr.includes('not found') || errorStr.includes('Agent not found')) {
      throw new Error(`Agent #${agentId} not found. Please select a valid agent.`);
    } else if (errorStr.includes('network')) {
      throw new Error('Network error. Please check your connection and try again.');
    } else {
      throw new Error(`Failed to load agent context: ${errorStr.replace('Error: ', '')}`);
    }
  }
}

/**
 * Fetch historical data from storage
 */
async function fetchHistoricalData(agentMemory: any, agentId: number, continueWithoutMemory: boolean = false) {
  log.debug('Fetching historical data', { agentId, hasMemory: !!agentMemory, continueWithoutMemory });

  const historicalData: any = {
    dailyDreams: [],
    dailyConversations: [],
    monthlyDreams: [],
    monthlyConversations: [],
    yearlyCore: null
  };

  // Return empty if no memory data or continuing without memory
  if (!agentMemory || continueWithoutMemory) {
    log.debug(continueWithoutMemory ? 
      'Continuing without memory (user choice)' : 
      'No memory data available, returning empty historical data');
    return historicalData;
  }

  try {
    const { downloadFromStorage } = await import('../services/xstateStorage');

    // Download daily dreams if available
    if (agentMemory.currentDreamDailyHash && agentMemory.currentDreamDailyHash !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
      try {
        const dreamsData = await downloadFromStorage(agentMemory.currentDreamDailyHash);
        if (dreamsData) {
          historicalData.dailyDreams = JSON.parse(dreamsData);
          log.debug('Daily dreams loaded', { count: historicalData.dailyDreams.length });
        }
      } catch (error) {
        log.debug('Failed to load daily dreams', { error: String(error) });
        // Re-throw to trigger memory error state
        throw new Error(`Failed to load daily dreams: ${error}`);
      }
    }

    // Download daily conversations if available
    if (agentMemory.currentConvDailyHash && agentMemory.currentConvDailyHash !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
      try {
        const convsData = await downloadFromStorage(agentMemory.currentConvDailyHash);
        if (convsData) {
          historicalData.dailyConversations = JSON.parse(convsData);
          log.debug('Daily conversations loaded', { count: historicalData.dailyConversations.length });
        }
      } catch (error) {
        log.debug('Failed to load daily conversations', { error: String(error) });
        // Re-throw to trigger memory error state
        throw new Error(`Failed to load daily conversations: ${error}`);
      }
    }

    // Download monthly dream consolidations if available
    if (agentMemory.lastDreamMonthlyHash && agentMemory.lastDreamMonthlyHash !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
      try {
        const monthlyDreamsData = await downloadFromStorage(agentMemory.lastDreamMonthlyHash);
        if (monthlyDreamsData) {
          const parsed = JSON.parse(monthlyDreamsData);
          historicalData.monthlyDreams = Array.isArray(parsed) ? parsed : [parsed];
          log.debug('Monthly dream consolidations loaded', { count: historicalData.monthlyDreams.length });
        }
      } catch (error) {
        log.debug('Failed to load monthly dream consolidations', { error: String(error) });
        // Don't throw - monthly data is optional for chat
      }
    }

    // Download monthly conversation consolidations if available
    if (agentMemory.lastConvMonthlyHash && agentMemory.lastConvMonthlyHash !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
      try {
        const monthlyConvsData = await downloadFromStorage(agentMemory.lastConvMonthlyHash);
        if (monthlyConvsData) {
          const parsed = JSON.parse(monthlyConvsData);
          historicalData.monthlyConversations = Array.isArray(parsed) ? parsed : [parsed];
          log.debug('Monthly conversation consolidations loaded', { count: historicalData.monthlyConversations.length });
        }
      } catch (error) {
        log.debug('Failed to load monthly conversation consolidations', { error: String(error) });
        // Don't throw - monthly data is optional for chat
      }
    }

    // Download memory core if available
    if (agentMemory.memoryCoreHash && agentMemory.memoryCoreHash !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
      try {
        const coreData = await downloadFromStorage(agentMemory.memoryCoreHash);
        if (coreData) {
          historicalData.yearlyCore = JSON.parse(coreData);
          log.debug('Memory core loaded');
        }
      } catch (error) {
        log.debug('Failed to load memory core', { error: String(error) });
        // Re-throw to trigger memory error state
        throw new Error(`Failed to load memory core: ${error}`);
      }
    }

  } catch (error) {
    log.debug('Error loading historical data', { error: String(error) });
    // Re-throw error to trigger memory error state in machine
    throw error;
  }

  return historicalData;
}

/**
 * Send chat message to AI
 */
export async function sendChatMessage(
  message: string,
  messages: ChatMessage[],
  agentContext: any,
  historicalData: any,
  agentName: string,
  modelId: string = 'auto',
  walletAddress?: string
) {
  log.debug('Sending chat message to AI', {
    messageLength: message.length,
    previousMessages: messages.length,
    agentName,
    modelId,
    hasWalletAddress: !!walletAddress,
    walletAddress: walletAddress || 'undefined'
  });

  try {
    // Build chat prompt
    const { buildChatPrompt } = await import('../services/chatPromptBuilder');
    const isFirstMessage = messages.length === 1; // Just added user message
    
    const prompt = buildChatPrompt({
      userMessage: message,
      messages,
      agentContext,
      historicalData,
      agentName,
      isFirstMessage
    });

    log.debug('Chat prompt built', {
      promptLength: prompt.length,
      isFirstMessage
    });

    // Create timeout promise (60 seconds for AI response - 0G providers can be slower)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('AI response timeout after 60 seconds')), 60000);
    });

    // Send to AI with timeout (include walletAddress for 0G Network billing)
    const { sendToAI } = await import('../services/apiService');
    const aiResponse = await Promise.race([
      sendToAI(prompt, modelId, walletAddress),
      timeoutPromise
    ]) as string;

    log.debug('AI response received', {
      responseLength: aiResponse?.length || 0,
      fullResponse: aiResponse
    });

    return {
      response: aiResponse || 'I apologize, but I was unable to generate a response. Please try again.',
      prompt // For debugging
    };
  } catch (error) {
    log.debug('Error sending chat message', {
      error: String(error),
      errorType: error?.constructor?.name
    });

    // Provide user-friendly error messages
    if (String(error).includes('timeout') || String(error).includes('60 seconds')) {
      throw new Error('AI is taking longer than usual (60s timeout). The provider may be slow - please try again.');
    } else if (String(error).includes('Wallet address required')) {
      throw new Error('Wallet not connected. Please ensure wallet is synced before using 0G models.');
    } else if (String(error).includes('network')) {
      throw new Error('Connection lost. Please check your internet and try again.');
    } else if (String(error).includes('rate limit')) {
      throw new Error('Too many requests. Please wait a moment and try again.');
    } else {
      throw new Error(`Failed to process message: ${String(error).replace('Error: ', '')}`);
    }
  }
}

/**
 * Generate conversation summary
 */
export async function generateConversationSummary(
  transcript: string,
  messages: ChatMessage[],
  agentId: number,
  modelId: string = 'auto'
) {
  log.debug('Generating conversation summary', {
    transcriptLength: transcript.length,
    messageCount: messages.length,
    modelId
  });

  try {
    // Build summary prompt
    const { buildSummaryPrompt } = await import('../services/chatPromptBuilder');
    const prompt = buildSummaryPrompt(transcript, messages);

    log.debug('Summary prompt built', {
      promptLength: prompt.length
    });

    // Send to AI for summary generation
    const { sendToAI } = await import('../services/apiService');
    const aiResponse = await sendToAI(prompt, modelId);

    // Parse JSON response
    let summary;
    try {
      // Extract JSON from response (AI might include markdown blocks)
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || 
                       aiResponse.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        summary = JSON.parse(jsonStr);
      } else {
        summary = JSON.parse(aiResponse);
      }

      if (summary && typeof summary === 'object') {
        const firstMessageTs = messages.find(msg => msg.timestamp)?.timestamp || messages[0]?.timestamp;
        const lastMessageTs = [...messages].reverse().find(msg => msg.timestamp)?.timestamp || messages[messages.length - 1]?.timestamp;

        if (firstMessageTs) {
          const startDate = new Date(firstMessageTs);
          summary.date = startDate.toISOString().split('T')[0];
          summary.timestamp = Math.floor(firstMessageTs / 1000);
        }

        if (firstMessageTs && lastMessageTs) {
          const durationMinutes = Math.max(1, Math.round((lastMessageTs - firstMessageTs) / 60000));
          summary.duration = durationMinutes;
        }
      }

      log.debug('Summary parsed successfully', {
        hasId: summary && typeof summary === 'object' && 'id' in summary,
        hasDate: summary && typeof summary === 'object' && 'date' in summary,
        hasTopic: summary && typeof summary === 'object' && 'topic' in summary,
        timestamp: summary?.timestamp,
        duration: summary?.duration
      });

    } catch (parseError) {
      log.debug('Failed to parse summary JSON', { error: String(parseError) });
      // Create a basic summary if parsing fails
      summary = createBasicSummary(transcript, messages);
    }

    return {
      summary,
      rawResponse: aiResponse
    };
  } catch (error) {
    log.debug('Error generating conversation summary', { error: String(error) });
    throw error;
  }
}

/**
 * Create basic summary if AI fails
 */
function createBasicSummary(transcript: string, messages: ChatMessage[]) {
  const now = new Date();
  const startTime = messages[0]?.timestamp || Date.now();
  const endTime = messages[messages.length - 1]?.timestamp || Date.now();
  const duration = Math.round((endTime - startTime) / 60000); // minutes

  return {
    id: Date.now(),
    date: now.toISOString().split('T')[0],
    timestamp: Math.floor(startTime / 1000),
    duration: duration || 1,
    topic: 'General conversation',
    type: 'general_chat',
    emotional_tone: ['neutral'],
    key_insights: ['Conversation with agent'],
    relationship_depth: 5,
    breakthrough: false,
    vulnerability_level: 5,
    references: {
      dreams: [],
      conversations: [],
      themes: []
    },
    summary: `Conversation with agent containing ${messages.length} messages.`,
    growth_markers: {
      self_awareness: 5,
      integration: 5,
      action_readiness: 5
    }
  };
}

/**
 * Persist chat conversation
 */
export async function persistChatConversation(
  agentId: number,
  agentName: string,
  conversationSummary: any,
  transcript: string
) {
  log.debug('Persisting chat conversation', {
    agentId,
    agentName,
    hasSummary: !!conversationSummary
  });

  try {
    // Manage conversation file
    const { ConversationFileManager } = await import('../services/conversationFileManager');
    const fileManager = new ConversationFileManager();
    
    const fileResult = await fileManager.manageConversationFile(
      agentId,
      agentName,
      conversationSummary
    );

    log.debug('Conversation file managed', {
      fileName: fileResult.fileName,
      isNewFile: fileResult.isNewFile,
      totalConversations: fileResult.totalConversations
    });

    // Upload to storage
    const { uploadToStorage } = await import('../services/xstateStorage');
    const uploadResult = await uploadToStorage(
      fileResult.fileContent,
      fileResult.fileName
    );

    log.debug('Conversation uploaded to storage', {
      rootHash: uploadResult.rootHash,
      success: uploadResult.success
    });

    // Check if upload was successful
    if (!uploadResult.success || !uploadResult.rootHash) {
      throw new Error(`Failed to upload conversation: ${uploadResult.error || 'No root hash returned'}`);
    }

    // Update contract
    const { updateConversationContract } = await import('../services/conversationContractUpdater');
    const contractResult = await updateConversationContract(
      agentId,
      uploadResult.rootHash,
      conversationSummary.type
    );

    log.debug('Contract updated', {
      txHash: contractResult.txHash
    });

    return {
      rootHash: uploadResult.rootHash,
      txHash: contractResult.txHash,
      fileName: fileResult.fileName,
      conversationId: conversationSummary.id
    };
  } catch (error) {
    log.debug('Error persisting conversation', { error: String(error) });
    throw error;
  }
}