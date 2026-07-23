'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '../useWallet';
import { useStorageDownload } from '../storage/useStorageDownload';
import { useAgentRead } from './useAgentRead';
import { getContractConfig } from './config/contractConfig';
import { getViemProvider } from '../../lib/0g/fees';
import type { PublicClient } from 'viem';
import {
  consolidateYearWithLLM,
  saveMemoryCoreToStorage,
  callUpdateMemoryCore,
  YearlyMemoryCore
} from './services/agentMemoryCoreService';
import type { MonthlyDreamConsolidation, MonthlyConversationConsolidation } from './services/agentConsolidationService';
import { logger } from '@/lib/logger';

// State interface for yearly memory core consolidation process
interface MemoryCoreState {
  // Process states
  isCheckingYearlyReflection: boolean;
  isLoadingMonthlyData: boolean;
  isProcessingWithLLM: boolean;
  isUploadingToStorage: boolean;
  isUpdatingContract: boolean;
  
  // Status messages
  statusMessage: string;
  
  // Data states
  hasYearlyReflection: boolean;
  currentYear: number;
  
  // Monthly consolidation data
  monthlyDreamConsolidations: MonthlyDreamConsolidation[];
  monthlyConversationConsolidations: MonthlyConversationConsolidation[];
  
  // Results
  memoryCoreData: YearlyMemoryCore | null;
  
  txHash: string | null;
  error: string | null;
  
  // Completion state
  isCompleted: boolean;
}

export function useAgentMemoryCore(tokenId?: number) {
  const { isConnected, address } = useWallet();
  const { downloadFile } = useStorageDownload();
  const { 
    agentData, 
    personalityTraits, 
    effectiveTokenId
  } = useAgentRead();
  
  // Logger instance
  const log = logger.child({ component: 'useAgentMemoryCore' });
  const logFn = (message: string, data?: any) => log.debug(message, data);

  const [memoryCoreState, setMemoryCoreState] = useState<MemoryCoreState>({
    isCheckingYearlyReflection: false,
    isLoadingMonthlyData: false,
    isProcessingWithLLM: false,
    isUploadingToStorage: false,
    isUpdatingContract: false,
    statusMessage: '',
    hasYearlyReflection: false,
    currentYear: new Date().getFullYear(),
    monthlyDreamConsolidations: [],
    monthlyConversationConsolidations: [],
    memoryCoreData: null,
    txHash: null,
    error: null,
    isCompleted: false
  });

  // Get effective token ID for operations
  const operationalTokenId = tokenId || effectiveTokenId;

  /**
   * Sprawdza czy agent ma dostępną yearly reflection
   */
  const checkYearlyReflection = useCallback(async () => {
    if (!isConnected || !operationalTokenId) {
      setMemoryCoreState(prev => ({ 
        ...prev, 
        error: 'Wallet not connected or no agent found' 
      }));
      return;
    }

    setMemoryCoreState(prev => ({ 
      ...prev, 
      isCheckingYearlyReflection: true, 
      error: null,
      statusMessage: 'Checking yearly reflection availability...' 
    }));

    try {
      log.debug('Checking yearly reflection status', { tokenId: operationalTokenId });

      const [publicClient, publicErr] = await getViemProvider();
      if (!publicClient || publicErr) {
        throw new Error(`PublicClient error: ${publicErr?.message}`);
      }

      const contractConfig = getContractConfig();

      const [intelligenceBonus, specialMilestone, yearlyReflection] = await publicClient.readContract({
        address: contractConfig.address,
        abi: contractConfig.abi,
        functionName: 'pendingRewards',
        args: [BigInt(operationalTokenId)]
      }) as readonly [bigint, string, boolean];
      const hasYearlyReflection = yearlyReflection;

      setMemoryCoreState(prev => ({
        ...prev,
        isCheckingYearlyReflection: false,
        hasYearlyReflection,
        statusMessage: hasYearlyReflection ? 'Yearly reflection available!' : 'No yearly reflection available'
      }));

      log.debug('Yearly reflection check completed', {
        hasYearlyReflection,
        pendingRewards: {
          intelligenceBonus: Number(intelligenceBonus),
          specialMilestone: specialMilestone,
          yearlyReflection: yearlyReflection
        }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setMemoryCoreState(prev => ({ 
        ...prev, 
        isCheckingYearlyReflection: false,
        error: errorMessage,
        statusMessage: ''
      }));
      log.debug('Yearly reflection check failed', { error: errorMessage });
    }
  }, [isConnected, operationalTokenId, debugLog]);

  /**
   * Pobiera wszystkie 12 miesięcznych konsolidacji z poprzedniego roku
   */
  const loadMonthlyConsolidations = useCallback(async (year: number) => {
    if (!isConnected || !operationalTokenId) {
      setMemoryCoreState(prev => ({ 
        ...prev, 
        error: 'Wallet not connected or no agent found' 
      }));
      return;
    }

    setMemoryCoreState(prev => ({ 
      ...prev, 
      isLoadingMonthlyData: true, 
      error: null,
      statusMessage: 'Loading monthly consolidations...' 
    }));

    try {
      log.debug('Loading monthly consolidations', { tokenId: operationalTokenId, year });

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
      
      log.debug('Agent memory retrieved', {
        lastDreamMonthlyHash: agentMemory.lastDreamMonthlyHash,
        lastConvMonthlyHash: agentMemory.lastConvMonthlyHash
      });

      // Note: W rzeczywistości musiałby być mechanizm zapisywania historii miesięcznych hashy
      // Na razie użyjemy ostatnich miesięcznych konsolidacji jako przykład
      
      const monthlyDreamConsolidations: MonthlyDreamConsolidation[] = [];
      const monthlyConversationConsolidations: MonthlyConversationConsolidation[] = [];

      // Load available monthly consolidations (simplified for now)
      const emptyHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
      
      if (agentMemory.lastDreamMonthlyHash && agentMemory.lastDreamMonthlyHash !== emptyHash) {
        setMemoryCoreState(prev => ({ 
          ...prev, 
          statusMessage: 'Downloading dream consolidations...' 
        }));
        
        const dreamResult = await downloadFile(agentMemory.lastDreamMonthlyHash);
        if (dreamResult.success && dreamResult.data) {
          const textDecoder = new TextDecoder('utf-8');
          const jsonText = textDecoder.decode(dreamResult.data);
          const dreamConsolidation = JSON.parse(jsonText) as MonthlyDreamConsolidation;
          monthlyDreamConsolidations.push(dreamConsolidation);
          log.debug('Dream consolidation loaded', { month: dreamConsolidation.month, year: dreamConsolidation.year });
        }
      }

      if (agentMemory.lastConvMonthlyHash && agentMemory.lastConvMonthlyHash !== emptyHash) {
        setMemoryCoreState(prev => ({ 
          ...prev, 
          statusMessage: 'Downloading conversation consolidations...' 
        }));
        
        const convResult = await downloadFile(agentMemory.lastConvMonthlyHash);
        if (convResult.success && convResult.data) {
          const textDecoder = new TextDecoder('utf-8');
          const jsonText = textDecoder.decode(convResult.data);
          const convConsolidation = JSON.parse(jsonText) as MonthlyConversationConsolidation;
          monthlyConversationConsolidations.push(convConsolidation);
          log.debug('Conversation consolidation loaded', { month: convConsolidation.month, year: convConsolidation.year });
        }
      }

      // TODO: W pełnej implementacji należałoby iterować przez wszystkie 12 miesięcy
      // i pobierać każdy miesięczny hash z odpowiedniego storage location
      
      setMemoryCoreState(prev => ({
        ...prev,
        isLoadingMonthlyData: false,
        monthlyDreamConsolidations,
        monthlyConversationConsolidations,
        statusMessage: `Loaded ${monthlyDreamConsolidations.length} dream consolidations and ${monthlyConversationConsolidations.length} conversation consolidations`
      }));

      log.debug('Monthly consolidations loaded successfully', {
        dreamConsolidationsCount: monthlyDreamConsolidations.length,
        conversationConsolidationsCount: monthlyConversationConsolidations.length
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setMemoryCoreState(prev => ({ 
        ...prev, 
        isLoadingMonthlyData: false,
        error: errorMessage,
        statusMessage: ''
      }));
      log.debug('Monthly consolidations loading failed', { error: errorMessage });
    }
  }, [isConnected, operationalTokenId, downloadFile, debugLog]);

  /**
   * Wykonuje pełny proces rocznej konsolidacji (memory core)
   */
  const performYearlyConsolidation = useCallback(async () => {
    if (!isConnected || !operationalTokenId || !personalityTraits || !agentData) {
      setMemoryCoreState(prev => ({ 
        ...prev, 
        error: 'Missing required data for yearly consolidation' 
      }));
      return;
    }

    const { monthlyDreamConsolidations, monthlyConversationConsolidations, currentYear } = memoryCoreState;

    if (monthlyDreamConsolidations.length === 0 && monthlyConversationConsolidations.length === 0) {
      setMemoryCoreState(prev => ({ 
        ...prev, 
        error: 'No monthly consolidations to process' 
      }));
      return;
    }

    try {
      log.debug('Starting full yearly consolidation process', {
        tokenId: operationalTokenId,
        year: currentYear,
        dreamConsolidationsCount: monthlyDreamConsolidations.length,
        conversationConsolidationsCount: monthlyConversationConsolidations.length
      });

      // Step 1: Process with LLM
      setMemoryCoreState(prev => ({ 
        ...prev, 
        isProcessingWithLLM: true,
        statusMessage: 'Creating yearly essence with AI...',
        error: null 
      }));

      const llmResult = await consolidateYearWithLLM(
        monthlyDreamConsolidations,
        monthlyConversationConsolidations,
        currentYear,
        personalityTraits,
        agentData,
        address!
      );

      if (!llmResult.success || !llmResult.data) {
        throw new Error(`Yearly consolidation failed: ${llmResult.error}`);
      }

      const memoryCoreData = llmResult.data;

      setMemoryCoreState(prev => ({
        ...prev,
        isProcessingWithLLM: false,
        memoryCoreData,
        statusMessage: 'AI processing completed'
      }));

      log.debug('LLM processing completed', {
        year: memoryCoreData.year,
        totalDreams: memoryCoreData.yearly_overview.total_dreams,
        totalConversations: memoryCoreData.yearly_overview.total_conversations,
        evolutionStage: memoryCoreData.yearly_overview.agent_evolution_stage
      });

      // Step 2: Upload to storage
      setMemoryCoreState(prev => ({ 
        ...prev, 
        isUploadingToStorage: true,
        statusMessage: 'Uploading memory core to storage...' 
      }));

      const storageResult = await saveMemoryCoreToStorage(
        operationalTokenId,
        memoryCoreData,
        downloadFile
      );
      
      if (!storageResult.success) {
        throw new Error(`Storage upload failed: ${storageResult.error}`);
      }

      setMemoryCoreState(prev => ({
        ...prev,
        isUploadingToStorage: false,
        statusMessage: 'Storage upload completed'
      }));

      log.debug('Storage upload completed', {
        memoryCoreHash: storageResult.memoryCoreHash
      });

      // Step 3: Update contract (updateMemoryCore)
      setMemoryCoreState(prev => ({ 
        ...prev, 
        isUpdatingContract: true,
        statusMessage: 'Updating memory core in contract...' 
      }));

      const contractResult = await callUpdateMemoryCore(
        operationalTokenId,
        storageResult.memoryCoreHash!
      );

      if (!contractResult.success) {
        throw new Error(`Contract update failed: ${contractResult.error}`);
      }

      setMemoryCoreState(prev => ({
        ...prev,
        isUpdatingContract: false,
        txHash: contractResult.txHash!,
        statusMessage: 'Memory core updated successfully!',
        isCompleted: true
      }));

      log.debug('Contract update completed', {
        txHash: contractResult.txHash
      });

      // Clear status message after 5 seconds
      setTimeout(() => {
        setMemoryCoreState(prev => ({ ...prev, statusMessage: '' }));
      }, 5000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setMemoryCoreState(prev => ({ 
        ...prev, 
        isProcessingWithLLM: false,
        isUploadingToStorage: false,
        isUpdatingContract: false,
        error: errorMessage,
        statusMessage: ''
      }));
      log.debug('Yearly consolidation failed', { error: errorMessage });
    }
  }, [isConnected, operationalTokenId, personalityTraits, agentData, memoryCoreState, debugLog]);

  /**
   * Resetuje stan rocznej konsolidacji
   */
  const resetMemoryCore = useCallback(() => {
    setMemoryCoreState({
      isCheckingYearlyReflection: false,
      isLoadingMonthlyData: false,
      isProcessingWithLLM: false,
      isUploadingToStorage: false,
      isUpdatingContract: false,
      statusMessage: '',
      hasYearlyReflection: false,
      currentYear: new Date().getFullYear(),
      monthlyDreamConsolidations: [],
      monthlyConversationConsolidations: [],
      memoryCoreData: null,
      txHash: null,
      error: null,
      isCompleted: false
    });
    log.debug('Memory core state reset');
  }, [debugLog]);

  // Check if can start yearly consolidation
  const canStartYearlyConsolidation = memoryCoreState.hasYearlyReflection && 
    (memoryCoreState.monthlyDreamConsolidations.length > 0 || memoryCoreState.monthlyConversationConsolidations.length > 0) &&
    !memoryCoreState.isProcessingWithLLM && 
    !memoryCoreState.isUploadingToStorage && 
    !memoryCoreState.isUpdatingContract;

  // Overall processing state
  const isProcessing = memoryCoreState.isProcessingWithLLM || 
    memoryCoreState.isUploadingToStorage || 
    memoryCoreState.isUpdatingContract;

  return {
    // State
    memoryCoreState,
    isProcessing,
    canStartYearlyConsolidation,
    
    // Actions
    checkYearlyReflection,
    loadMonthlyConsolidations,
    performYearlyConsolidation,
    resetMemoryCore,
    
    // Agent data
    agentData,
    personalityTraits,
    operationalTokenId
  };
} 