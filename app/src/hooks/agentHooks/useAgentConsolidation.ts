'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '../useWallet';
import { useStorageDownload } from '../storage/useStorageDownload';
import { useAgentRead } from './useAgentRead';
import { getContractConfig } from './config/contractConfig';
import { getViemProvider } from '../../lib/0g/fees';
import type { PublicClient } from 'viem';
import {
  consolidateDreamsWithLLM,
  consolidateConversationsWithLLM,
  saveConsolidationToStorage,
  callConsolidateMonth,
  clearMonthlyFiles,
  MonthlyDreamConsolidation,
  MonthlyConversationConsolidation
} from './services/agentConsolidationService';
import { logger } from '@/lib/logger';

// State interface for consolidation process
interface ConsolidationState {
  // Process states
  isCheckingNeed: boolean;
  isLoadingData: boolean;
  isProcessingWithLLM: boolean;
  isUploadingToStorage: boolean;
  isUpdatingContract: boolean;
  isClearingFiles: boolean;
  
  // Status messages
  statusMessage: string;
  
  // Data states
  needsConsolidation: boolean;
  currentMonth: number;
  currentYear: number;
  
  // Consolidation data
  dreamConsolidation: MonthlyDreamConsolidation | null;
  conversationConsolidation: MonthlyConversationConsolidation | null;
  
  // Results
  consolidationReward: {
    baseReward: number;
    streakBonus: number;
    earlyBirdBonus: number;
    totalReward: number;
  } | null;
  
  txHash: string | null;
  error: string | null;
  
  // Preview data
  monthlyDreams: any[];
  monthlyConversations: any[];
  
  // Completion state
  isCompleted: boolean;
}

export function useAgentConsolidation(tokenId?: number) {
  const { isConnected, address } = useWallet();
  const { downloadFile } = useStorageDownload();
  const { 
    agentData, 
    personalityTraits, 
    effectiveTokenId
  } = useAgentRead();
  
  // Logger instance
  const log = logger.child({ component: 'useAgentConsolidation' });
  const logFn = (message: string, data?: any) => log.debug(message, data);

  const [consolidationState, setConsolidationState] = useState<ConsolidationState>({
    isCheckingNeed: false,
    isLoadingData: false,
    isProcessingWithLLM: false,
    isUploadingToStorage: false,
    isUpdatingContract: false,
    isClearingFiles: false,
    statusMessage: '',
    needsConsolidation: false,
    currentMonth: 0,
    currentYear: 0,
    dreamConsolidation: null,
    conversationConsolidation: null,
    consolidationReward: null,
    txHash: null,
    error: null,
    monthlyDreams: [],
    monthlyConversations: [],
    isCompleted: false
  });

  // Get effective token ID for operations
  const operationalTokenId = tokenId || effectiveTokenId;

  /**
   * Sprawdza czy agent potrzebuje konsolidacji
   */
  const checkConsolidationNeed = useCallback(async () => {
    if (!isConnected || !operationalTokenId) {
      setConsolidationState(prev => ({ 
        ...prev, 
        error: 'Wallet not connected or no agent found' 
      }));
      return;
    }

    setConsolidationState(prev => ({ 
      ...prev, 
      isCheckingNeed: true, 
      error: null,
      statusMessage: 'Checking if consolidation is needed...' 
    }));

    try {
      log.debug('Checking consolidation need', { tokenId: operationalTokenId });

      const [publicClient, publicErr] = await getViemProvider();
      if (!publicClient || publicErr) {
        throw new Error(`PublicClient error: ${publicErr?.message}`);
      }

      const contractConfig = getContractConfig();

      // Note: needsConsolidation function doesn't exist in ABI
      // We'll check if consolidation is needed based on agent memory dates
      const agentMemory = await publicClient.readContract({
        address: contractConfig.address,
        abi: contractConfig.abi,
        functionName: 'getAgentMemory',
        args: [BigInt(operationalTokenId)]
      }) as any;
      
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      const lastConsolidation = Number(agentMemory.lastConsolidation || 0);
      const lastConsolidationDate = lastConsolidation > 0 ? new Date(lastConsolidation * 1000) : null;
      const isNeeded = !lastConsolidationDate || 
                       lastConsolidationDate.getMonth() + 1 !== currentMonth ||
                       lastConsolidationDate.getFullYear() !== currentYear;
      
      const rewardResult = await publicClient.readContract({
        address: contractConfig.address,
        abi: contractConfig.abi,
        functionName: 'getConsolidationReward',
        args: [BigInt(operationalTokenId)]
      }) as [bigint, bigint, bigint, bigint];
      const [baseReward, streakBonus, earlyBirdBonus, totalReward] = rewardResult;

      setConsolidationState(prev => ({
        ...prev,
        isCheckingNeed: false,
        needsConsolidation: isNeeded,
        currentMonth: Number(currentMonth),
        currentYear: Number(currentYear),
        consolidationReward: {
          baseReward: Number(baseReward),
          streakBonus: Number(streakBonus),
          earlyBirdBonus: Number(earlyBirdBonus),
          totalReward: Number(totalReward)
        },
        statusMessage: isNeeded ? 'Consolidation needed!' : 'No consolidation needed'
      }));

      log.debug('Consolidation check completed', {
        isNeeded,
        currentMonth: Number(currentMonth),
        currentYear: Number(currentYear),
        totalReward: Number(totalReward)
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setConsolidationState(prev => ({ 
        ...prev, 
        isCheckingNeed: false,
        error: errorMessage,
        statusMessage: ''
      }));
      log.debug('Consolidation check failed', { error: errorMessage });
    }
  }, [isConnected, operationalTokenId, debugLog]);

  /**
   * Pobiera dane miesięczne do konsolidacji
   */
  const loadMonthlyData = useCallback(async () => {
    if (!isConnected || !operationalTokenId) {
      setConsolidationState(prev => ({ 
        ...prev, 
        error: 'Wallet not connected or no agent found' 
      }));
      return;
    }

    setConsolidationState(prev => ({ 
      ...prev, 
      isLoadingData: true, 
      error: null,
      statusMessage: 'Loading monthly data...' 
    }));

    try {
      log.debug('Loading monthly data', { tokenId: operationalTokenId });

      const [publicClient, publicErr] = await getViemProvider();
      if (!publicClient || publicErr) {
        throw new Error(`PublicClient error: ${publicErr?.message}`);
      }

      const contractConfig = getContractConfig();

      const agentMemory = await publicClient.readContract({
        address: contractConfig.address,
        abi: contractConfig.abi,
        functionName: 'getAgentMemory',
        args: [BigInt(operationalTokenId)]
      }) as {
        memoryCoreHash: string;
        currentDreamDailyHash: string;
        currentConvDailyHash: string;
        lastDreamMonthlyHash: string;
        lastConvMonthlyHash: string;
        lastConsolidation: bigint;
        currentMonth: number;
        currentYear: number;
      };
      const currentDreamHash = agentMemory.currentDreamDailyHash;
      const currentConvHash = agentMemory.currentConvDailyHash;
      const emptyHash = '0x0000000000000000000000000000000000000000000000000000000000000000';

      log.debug('Agent memory retrieved', {
        currentDreamHash,
        currentConvHash
      });

      // Load dreams
      let monthlyDreams: any[] = [];
      if (currentDreamHash && currentDreamHash !== emptyHash) {
        setConsolidationState(prev => ({ 
          ...prev, 
          statusMessage: 'Downloading dreams...' 
        }));
        
        const dreamResult = await downloadFile(currentDreamHash);
        if (dreamResult.success && dreamResult.data) {
          const textDecoder = new TextDecoder('utf-8');
          const jsonText = textDecoder.decode(dreamResult.data);
          monthlyDreams = JSON.parse(jsonText);
          log.debug('Dreams loaded', { count: monthlyDreams.length });
        }
      }

      // Load conversations
      let monthlyConversations: any[] = [];
      if (currentConvHash && currentConvHash !== emptyHash) {
        setConsolidationState(prev => ({ 
          ...prev, 
          statusMessage: 'Downloading conversations...' 
        }));
        
        const convResult = await downloadFile(currentConvHash);
        if (convResult.success && convResult.data) {
          const textDecoder = new TextDecoder('utf-8');
          const jsonText = textDecoder.decode(convResult.data);
          monthlyConversations = JSON.parse(jsonText);
          log.debug('Conversations loaded', { count: monthlyConversations.length });
        }
      }

      setConsolidationState(prev => ({
        ...prev,
        isLoadingData: false,
        monthlyDreams,
        monthlyConversations,
        statusMessage: `Loaded ${monthlyDreams.length} dreams and ${monthlyConversations.length} conversations`
      }));

      log.debug('Monthly data loaded successfully', {
        dreamsCount: monthlyDreams.length,
        conversationsCount: monthlyConversations.length
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setConsolidationState(prev => ({ 
        ...prev, 
        isLoadingData: false,
        error: errorMessage,
        statusMessage: ''
      }));
      log.debug('Monthly data loading failed', { error: errorMessage });
    }
  }, [isConnected, operationalTokenId, downloadFile, debugLog]);

  /**
   * Wykonuje pełny proces konsolidacji miesięcznej
   */
  const performConsolidation = useCallback(async () => {
    if (!isConnected || !operationalTokenId || !personalityTraits) {
      setConsolidationState(prev => ({ 
        ...prev, 
        error: 'Missing required data for consolidation' 
      }));
      return;
    }

    const { currentMonth, currentYear, monthlyDreams, monthlyConversations } = consolidationState;

    if (monthlyDreams.length === 0 && monthlyConversations.length === 0) {
      setConsolidationState(prev => ({ 
        ...prev, 
        error: 'No data to consolidate' 
      }));
      return;
    }

    try {
      log.debug('Starting full consolidation process', {
        tokenId: operationalTokenId,
        month: currentMonth,
        year: currentYear,
        dreamsCount: monthlyDreams.length,
        conversationsCount: monthlyConversations.length
      });

      // Step 1: Process with LLM
      setConsolidationState(prev => ({ 
        ...prev, 
        isProcessingWithLLM: true,
        statusMessage: 'Processing with AI...',
        error: null 
      }));

      const [dreamResult, convResult] = await Promise.all([
        monthlyDreams.length > 0 
          ? consolidateDreamsWithLLM(monthlyDreams, currentMonth, currentYear, personalityTraits, address!)
          : Promise.resolve({ success: true, data: null }),
        monthlyConversations.length > 0 
          ? consolidateConversationsWithLLM(monthlyConversations, currentMonth, currentYear, personalityTraits, address!)
          : Promise.resolve({ success: true, data: null })
      ]);

      if (!dreamResult.success) {
        throw new Error(`Dream consolidation failed: ${'error' in dreamResult ? dreamResult.error : 'Unknown error'}`);
      }

      if (!convResult.success) {
        throw new Error(`Conversation consolidation failed: ${'error' in convResult ? convResult.error : 'Unknown error'}`);
      }

      const dreamConsolidation = dreamResult.data;
      const conversationConsolidation = convResult.data;

      setConsolidationState(prev => ({
        ...prev,
        isProcessingWithLLM: false,
        dreamConsolidation,
        conversationConsolidation,
        statusMessage: 'AI processing completed'
      }));

      log.debug('LLM processing completed', {
        hasDreamConsolidation: !!dreamConsolidation,
        hasConversationConsolidation: !!conversationConsolidation
      });

      // Step 2: Upload to storage
      setConsolidationState(prev => ({ 
        ...prev, 
        isUploadingToStorage: true,
        statusMessage: 'Uploading to storage...' 
      }));

      if (!dreamConsolidation || !conversationConsolidation) {
        throw new Error('Missing consolidation data');
      }

      const storageResult = await saveConsolidationToStorage(
        operationalTokenId,
        dreamConsolidation, 
        conversationConsolidation,
        downloadFile
      );
      
      if (!storageResult.success) {
        throw new Error(`Storage upload failed: ${storageResult.error}`);
      }

      setConsolidationState(prev => ({
        ...prev,
        isUploadingToStorage: false,
        statusMessage: 'Storage upload completed'
      }));

      log.debug('Storage upload completed', {
        dreamHash: storageResult.dreamHash,
        convHash: storageResult.convHash
      });

      // Step 3: Update contract
      setConsolidationState(prev => ({ 
        ...prev, 
        isUpdatingContract: true,
        statusMessage: 'Updating contract...' 
      }));

      const contractResult = await callConsolidateMonth(
        operationalTokenId,
        storageResult.dreamHash!,
        storageResult.convHash!,
        currentMonth,
        currentYear
      );

      if (!contractResult.success) {
        throw new Error(`Contract update failed: ${contractResult.error}`);
      }

      setConsolidationState(prev => ({
        ...prev,
        isUpdatingContract: false,
        txHash: contractResult.txHash!,
        statusMessage: 'Contract updated successfully'
      }));

      log.debug('Contract update completed', {
        txHash: contractResult.txHash
      });

      // Step 4: Clear monthly files (optional)
      setConsolidationState(prev => ({ 
        ...prev, 
        isClearingFiles: true,
        statusMessage: 'Clearing monthly files...' 
      }));

      const clearResult = await clearMonthlyFiles(operationalTokenId);
      
      if (!clearResult.success) {
        // Non-critical error - log but don't fail
        log.debug('Clear files failed (non-critical)', { error: clearResult.error });
      }

      setConsolidationState(prev => ({
        ...prev,
        isClearingFiles: false,
        isCompleted: true,
        statusMessage: 'Consolidation completed successfully! 🎉'
      }));

      log.debug('Full consolidation process completed successfully');

      // Refresh agent data by re-fetching if needed
      // Note: useAgentRead doesn't provide refreshAgentData, so we rely on automatic updates

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setConsolidationState(prev => ({ 
        ...prev, 
        isProcessingWithLLM: false,
        isUploadingToStorage: false,
        isUpdatingContract: false,
        isClearingFiles: false,
        error: errorMessage,
        statusMessage: ''
      }));
      log.debug('Consolidation process failed', { error: errorMessage });
    }
  }, [
    isConnected, 
    operationalTokenId, 
    personalityTraits, 
    consolidationState, 
    debugLog
  ]);

  /**
   * Resetuje stan konsolidacji
   */
  const resetConsolidation = useCallback(() => {
    setConsolidationState({
      isCheckingNeed: false,
      isLoadingData: false,
      isProcessingWithLLM: false,
      isUploadingToStorage: false,
      isUpdatingContract: false,
      isClearingFiles: false,
      statusMessage: '',
      needsConsolidation: false,
      currentMonth: 0,
      currentYear: 0,
      dreamConsolidation: null,
      conversationConsolidation: null,
      consolidationReward: null,
      txHash: null,
      error: null,
      monthlyDreams: [],
      monthlyConversations: [],
      isCompleted: false
    });
  }, []);

  // Computed states
  const isProcessing = consolidationState.isCheckingNeed || 
                      consolidationState.isLoadingData || 
                      consolidationState.isProcessingWithLLM || 
                      consolidationState.isUploadingToStorage || 
                      consolidationState.isUpdatingContract ||
                      consolidationState.isClearingFiles;

  const canStartConsolidation = !isProcessing && 
                               consolidationState.needsConsolidation && 
                               (consolidationState.monthlyDreams.length > 0 || 
                                consolidationState.monthlyConversations.length > 0);

  return {
    // State
    consolidationState,
    
    // Computed
    isProcessing,
    canStartConsolidation,
    
    // Functions
    checkConsolidationNeed,
    loadMonthlyData,
    performConsolidation,
    resetConsolidation,
    
    // Agent data
    agentData,
    personalityTraits,
    operationalTokenId
  };
} 