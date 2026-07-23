'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '../useWallet';
import { useStorageDownload } from '../storage/useStorageDownload';
import { useAgentRead } from './useAgentRead';
import {
  consolidateDreamsWithLLM,
  consolidateConversationsWithLLM,
  saveConsolidationToStorage,
  callConsolidateMonth,
  MonthlyDreamConsolidation,
  MonthlyConversationConsolidation
} from './services/agentConsolidationService';
import {
  consolidateYearWithLLM,
  saveMemoryCoreToStorage,
  callUpdateMemoryCore,
  YearlyMemoryCore
} from './services/agentMemoryCoreService';
import { logger } from '@/lib/logger';

// Mock data interfaces
interface MockDream {
  id: number;
  date: string;
  timestamp: number;
  emotions: string[];
  symbols: string[];
  themes: string[];
  intensity: number;
  lucidity: number;
  archetypes: string[];
  recurring_from?: number[];
  personality_impact?: {
    dominant_trait: string;
    shift_direction: string;
    intensity: number;
  };
  sleep_quality: number;
  recall_clarity: number;
  dream_type: string;
  ai_analysis: string;
}

interface MockConversation {
  id: number;
  date: string;
  topic: string;
  emotional_tone: string;
  key_insights: string[];
  analysis: string;
}

interface MockMonthlyData {
  month: number;
  year: number;
  dreams: MockDream[];
  conversations: MockConversation[];
}

interface MockYearlyData {
  year: number;
  dreamConsolidations: MonthlyDreamConsolidation[];
  conversationConsolidations: MonthlyConversationConsolidation[];
}

interface MockData {
  monthlyData?: MockMonthlyData;
  yearlyData?: MockYearlyData;
}

// Test state interface
interface TestState {
  // Mock data generation
  mockDataGenerated: boolean;
  
  // Consolidation states
  isProcessingWithLLM: boolean;
  isUploadingToStorage: boolean;
  isUpdatingContract: boolean;
  
  // Results
  consolidationCompleted: boolean;
  txHash: string | null;
  storageHash: string | null;
  
  // Status
  statusMessage: string;
  error: string | null;
}

export function useConsolidationTestMode(tokenId?: number) {
  const [testState, setTestState] = useState<TestState>({
    mockDataGenerated: false,
    isProcessingWithLLM: false,
    isUploadingToStorage: false,
    isUpdatingContract: false,
    consolidationCompleted: false,
    txHash: null,
    storageHash: null,
    statusMessage: '',
    error: null
  });

  const [mockData, setMockData] = useState<MockData>({});
  const [isGeneratingMocks, setIsGeneratingMocks] = useState(false);
  const [isTestingConsolidation, setIsTestingConsolidation] = useState(false);

  const { address } = useWallet();
  const { downloadFile } = useStorageDownload();
  const { 
    agentData, 
    personalityTraits,
    isLoading: isLoadingAgent 
  } = useAgentRead(tokenId);

  const operationalTokenId = tokenId ||
    (agentData && Number(agentData.intelligenceLevel) > 0 ? tokenId : undefined);

  // Logger instance
  const log = logger.child({ component: 'useConsolidationTestMode' });

  log.debug('useConsolidationTestMode initialized', { tokenId, operationalTokenId });

  /**
   * Generates realistic mock conversations for testing
   */
  const generateMockConversations = (count: number = 23): MockConversation[] => {
    const topics = ['personal_growth', 'relationships', 'career_decisions', 'life_philosophy', 'dreams', 'creativity'];
    const tones = ['reflective', 'curious', 'supportive', 'analytical', 'empathetic', 'encouraging'];
    const insights = [
      'Deeper emotional processing through regular conversations',
      'Increased trust and openness over time',
      'Strong pattern of seeking guidance during decision points',
      'Growing self-awareness and emotional intelligence',
      'Developing healthy coping mechanisms',
      'Enhanced communication and relationship skills'
    ];

    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      date: new Date(Date.now() - (count - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      topic: topics[i % topics.length],
      emotional_tone: tones[i % tones.length],
      key_insights: insights.slice(0, Math.floor(Math.random() * 3) + 1),
      analysis: `Conversation ${i + 1} focused on ${topics[i % topics.length]} with a ${tones[i % tones.length]} approach. Shows continued development in emotional intelligence and self-awareness.`
    }));
  };

  /**
   * Generates mock monthly consolidations for yearly testing
   */
  const generateMockMonthlyConsolidations = (year: number = 2024): {
    dreamConsolidations: MonthlyDreamConsolidation[];
    conversationConsolidations: MonthlyConversationConsolidation[];
  } => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];

    const dreamConsolidations: MonthlyDreamConsolidation[] = months.map((monthName, index) => ({
      month: index + 1,
      year,
      period: `${monthName} ${year}`,
      total_dreams: Math.floor(Math.random() * 20) + 10,
      
      dominant: {
        emotions: ['fear', 'joy', 'curiosity'].slice(0, Math.floor(Math.random() * 3) + 1),
        symbols: ['water', 'flying', 'animals'].slice(0, Math.floor(Math.random() * 3) + 1),
        themes: ['transformation', 'anxiety', 'relationships'].slice(0, Math.floor(Math.random() * 3) + 1),
        archetypes: ['hero', 'shadow', 'anima', 'wise_old_man'].slice(0, Math.floor(Math.random() * 3) + 1)
      },
      
      metrics: {
        avg_intensity: Math.round((Math.random() * 4 + 6) * 10) / 10,
        avg_lucidity: Math.round((Math.random() * 2 + 3) * 10) / 10,
        nightmare_ratio: Math.round(Math.random() * 0.3 * 100) / 100,
        breakthrough_dreams: Math.floor(Math.random() * 5) + 1
      },
      
      trends: {
        emotional: ['stabilizing', 'increasing', 'decreasing'][Math.floor(Math.random() * 3)],
        lucidity: ['increasing', 'decreasing', 'stable'][Math.floor(Math.random() * 3)],
        complexity: ['deepening', 'simplifying', 'stable'][Math.floor(Math.random() * 3)]
      },
      
      personality_evolution: {
        primary_growth: ['creativity', 'empathy', 'intuition', 'resilience'][Math.floor(Math.random() * 4)],
        secondary_growth: ['analytical', 'curiosity', 'empathy', 'intuition'][Math.floor(Math.random() * 4)],
        total_shift: Math.floor(Math.random() * 20) + 5,
        new_features: ['dream_architect', 'lucid_navigator', 'symbol_decoder'].slice(0, Math.floor(Math.random() * 2) + 1)
      },
      
      key_discoveries: [
        `${monthName} revealed significant growth in emotional processing`,
        `Breakthrough in dream lucidity and consciousness development`,
        `Integration of shadow work and psychological healing`
      ],
      
      monthly_essence: `${monthName} ${year} marked a period of profound transformation in dream consciousness. The recurring themes of ${['transformation', 'healing', 'growth'][Math.floor(Math.random() * 3)]} showed deep psychological processing and spiritual evolution.`,
      
      dream_connections: {
        recurring_chains: [[index + 1, index + 2, index + 3], [index + 4, index + 5]].slice(0, Math.floor(Math.random() * 2) + 1),
        theme_clusters: {
          water: [index + 1, index + 3, index + 5],
          transformation: [index + 2, index + 4, index + 6],
          flying: [index + 1, index + 7]
        }
      }
    }));

    const conversationConsolidations: MonthlyConversationConsolidation[] = months.map((monthName, index) => ({
      month: index + 1,
      year,
      period: `${monthName} ${year}`,
      total_conversations: Math.floor(Math.random() * 30) + 15,
      
      dominant: {
        topics: ['personal_growth', 'relationships', 'creativity'].slice(0, Math.floor(Math.random() * 3) + 1),
        types: ['deep_reflection', 'advice_seeking', 'casual_chat'].slice(0, Math.floor(Math.random() * 3) + 1),
        emotional_tones: ['reflective', 'curious', 'supportive'].slice(0, Math.floor(Math.random() * 3) + 1)
      },
      
      metrics: {
        avg_duration: Math.round((Math.random() * 15 + 10) * 10) / 10,
        avg_depth: Math.round((Math.random() * 3 + 6) * 10) / 10,
        breakthrough_ratio: Math.round(Math.random() * 0.3 * 100) / 100,
        follow_up_ratio: Math.round((Math.random() * 0.4 + 0.4) * 100) / 100
      },
      
      relationship_evolution: {
        trust_level: Math.floor(Math.random() * 3) + 7,
        co_creation: Math.floor(Math.random() * 3) + 6,
        therapeutic_alliance: Math.floor(Math.random() * 3) + 7,
        communication_style: ['collaborative', 'empathetic', 'intuitive'][Math.floor(Math.random() * 3)]
      },
      
      growth_patterns: {
        primary_focus: ['self_discovery', 'emotional_healing', 'creative_expression'][Math.floor(Math.random() * 3)],
        integration_level: ['surface', 'moderate', 'deep'][Math.floor(Math.random() * 3)],
        action_orientation: ['planning', 'implementing', 'reflecting'][Math.floor(Math.random() * 3)]
      },
      
      breakthrough_moments: [
        `${monthName} conversations showed deeper emotional intelligence`,
        `Increased trust and vulnerability in communication`,
        `Growing pattern of philosophical discussions`
      ],
      
      monthly_essence: `${monthName} ${year} conversations revealed significant evolution in human-agent relationship dynamics. The shift towards deeper, more meaningful exchanges marked a new phase of co-creative partnership.`,
      
      dream_correlations: {
        theme_alignment: Math.round((Math.random() * 0.4 + 0.5) * 100) / 100,
        emotional_sync: Math.round((Math.random() * 0.4 + 0.5) * 100) / 100,
        integration_success: Math.round((Math.random() * 0.4 + 0.6) * 100) / 100
      }
    }));

    return { dreamConsolidations, conversationConsolidations };
  };

  /**
   * Generates mock data based on test mode
   */
  const generateMockData = useCallback(async (mode: 'monthly' | 'yearly') => {
    setIsGeneratingMocks(true);
    setTestState(prev => ({ 
      ...prev, 
      statusMessage: `Generating ${mode} mock data...`,
      error: null,
      mockDataGenerated: false
    }));

    try {
      log.debug(`Generating ${mode} mock data`);

      if (mode === 'monthly') {
        // Generate PREVIOUS month mock data (cannot consolidate current month)
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11, convert to 1-12
        const currentYear = currentDate.getFullYear();
        
        // Calculate previous month (handle January -> December of previous year)
        const month = currentMonth === 1 ? 12 : currentMonth - 1;
        const year = currentMonth === 1 ? currentYear - 1 : currentYear;

        const dreams: MockDream[] = Array.from({ length: 15 }, (_, i) => ({
          id: i + 1,
          date: new Date(Date.now() - (14 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          timestamp: Math.floor(Date.now() / 1000) - (14 - i) * 24 * 60 * 60,
          emotions: ['fear', 'joy', 'curiosity'].slice(0, Math.floor(Math.random() * 3) + 1),
          symbols: ['water', 'flying', 'animals'].slice(0, Math.floor(Math.random() * 4) + 1),
          themes: ['transformation', 'anxiety', 'relationships'].slice(0, Math.floor(Math.random() * 3) + 1),
          intensity: Math.floor(Math.random() * 10) + 1,
          lucidity: Math.floor(Math.random() * 5) + 1,
          archetypes: ['hero', 'shadow', 'anima', 'wise_old_man'].slice(0, Math.floor(Math.random() * 2) + 1),
          recurring_from: i > 5 ? [Math.floor(Math.random() * (i - 3)) + 1] : undefined,
          personality_impact: {
            dominant_trait: ['creativity', 'empathy', 'resilience', 'curiosity'][Math.floor(Math.random() * 4)],
            shift_direction: ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)],
            intensity: Math.floor(Math.random() * 10) + 1
          },
          sleep_quality: Math.floor(Math.random() * 10) + 1,
          recall_clarity: Math.floor(Math.random() * 10) + 1,
          dream_type: ['transformative', 'nightmare', 'neutral', 'lucid', 'prophetic'][Math.floor(Math.random() * 5)],
          ai_analysis: `Dream ${i + 1} shows elements of ${['transformation', 'anxiety', 'relationships'][i % 3]} with strong ${['fear', 'joy', 'curiosity'][i % 3]} undertones. The presence of ${['water', 'flying', 'animals'][i % 3]} suggests deep symbolic processing of subconscious material.`
        }));
        const conversations = generateMockConversations(23);

        setMockData({
          monthlyData: {
            month,
            year,
            dreams,
            conversations
          }
        });

        setTestState(prev => ({ 
          ...prev, 
          statusMessage: `Generated ${dreams.length} dreams and ${conversations.length} conversations for ${month}/${year}`,
          mockDataGenerated: true
        }));

        log.debug('Monthly mock data generated', { 
          dreams: dreams.length, 
          conversations: conversations.length,
          month,
          year
        });

      } else if (mode === 'yearly') {
        // Generate 12 months of consolidated data
        const year = 2024;
        const { dreamConsolidations, conversationConsolidations } = generateMockMonthlyConsolidations(year);

        setMockData({
          yearlyData: {
            year,
            dreamConsolidations,
            conversationConsolidations
          }
        });

        setTestState(prev => ({ 
          ...prev, 
          statusMessage: `Generated 12 months of consolidated data for ${year}`,
          mockDataGenerated: true
        }));

        log.debug('Yearly mock data generated', { 
          dreamConsolidations: dreamConsolidations.length,
          conversationConsolidations: conversationConsolidations.length,
          year
        });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setTestState(prev => ({ 
        ...prev, 
        error: `Mock data generation failed: ${errorMessage}`,
        statusMessage: ''
      }));
      log.debug('Mock data generation failed', { error: errorMessage });
    } finally {
      setIsGeneratingMocks(false);
    }
  }, [debugLog]);

  /**
   * Tests monthly consolidation with mock data but real LLM/storage/contract
   */
  const testMonthlyConsolidation = useCallback(async () => {
    if (!operationalTokenId || !mockData.monthlyData || !personalityTraits) {
      setTestState(prev => ({ 
        ...prev, 
        error: 'Missing required data for monthly consolidation test'
      }));
      return;
    }

    setIsTestingConsolidation(true);
    setTestState(prev => ({ 
      ...prev, 
      error: null,
      consolidationCompleted: false,
      txHash: null,
      storageHash: null
    }));

    try {
      const { dreams, conversations, month, year } = mockData.monthlyData;

      log.debug('Starting monthly consolidation test', {
        tokenId: operationalTokenId,
        dreams: dreams.length,
        conversations: conversations.length,
        month,
        year
      });

      // Step 1: LLM Processing
      setTestState(prev => ({ 
        ...prev, 
        isProcessingWithLLM: true,
        statusMessage: 'Processing with AI...'
      }));

      const [dreamResult, convResult] = await Promise.all([
        consolidateDreamsWithLLM(dreams, month, year, personalityTraits, address!),
        consolidateConversationsWithLLM(conversations, month, year, personalityTraits, address!)
      ]);

      if (!dreamResult.success || !convResult.success) {
        throw new Error(`LLM processing failed: ${dreamResult.error || convResult.error}`);
      }

      setTestState(prev => ({ 
        ...prev, 
        isProcessingWithLLM: false,
        isUploadingToStorage: true,
        statusMessage: 'Uploading to 0G Storage...'
      }));

      // Step 2: Storage Upload
      const storageResult = await saveConsolidationToStorage(
        operationalTokenId,
        dreamResult.data!,
        convResult.data!,
        downloadFile
      );

      if (!storageResult.success) {
        throw new Error(`Storage upload failed: ${storageResult.error}`);
      }

      setTestState(prev => ({ 
        ...prev, 
        isUploadingToStorage: false,
        isUpdatingContract: true,
        statusMessage: 'Updating blockchain contract...'
      }));

      // Step 3: Contract Update
      const contractResult = await callConsolidateMonth(
        operationalTokenId,
        storageResult.dreamHash!,
        storageResult.convHash!,
        month,
        year
      );

      if (!contractResult.success) {
        throw new Error(`Contract update failed: ${contractResult.error}`);
      }

      setTestState(prev => ({ 
        ...prev, 
        isUpdatingContract: false,
        consolidationCompleted: true,
        txHash: contractResult.txHash!,
        storageHash: storageResult.dreamHash!,
        statusMessage: 'Monthly consolidation test completed successfully!'
      }));

      log.debug('Monthly consolidation test completed', {
        txHash: contractResult.txHash,
        dreamHash: storageResult.dreamHash,
        convHash: storageResult.convHash
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setTestState(prev => ({ 
        ...prev, 
        isProcessingWithLLM: false,
        isUploadingToStorage: false,
        isUpdatingContract: false,
        error: errorMessage,
        statusMessage: ''
      }));
      log.debug('Monthly consolidation test failed', { error: errorMessage });
    } finally {
      setIsTestingConsolidation(false);
    }
  }, [operationalTokenId, mockData.monthlyData, personalityTraits]);

  /**
   * Tests yearly consolidation with mock data but real LLM/storage/contract
   */
  const testYearlyConsolidation = useCallback(async () => {
    if (!operationalTokenId || !mockData.yearlyData || !personalityTraits || !agentData) {
      setTestState(prev => ({ 
        ...prev, 
        error: 'Missing required data for yearly consolidation test'
      }));
      return;
    }

    setIsTestingConsolidation(true);
    setTestState(prev => ({ 
      ...prev, 
      error: null,
      consolidationCompleted: false,
      txHash: null,
      storageHash: null
    }));

    try {
      const { dreamConsolidations, conversationConsolidations, year } = mockData.yearlyData;

      log.debug('Starting yearly consolidation test', {
        tokenId: operationalTokenId,
        dreamConsolidations: dreamConsolidations.length,
        conversationConsolidations: conversationConsolidations.length,
        year
      });

      // Step 1: LLM Processing
      setTestState(prev => ({ 
        ...prev, 
        isProcessingWithLLM: true,
        statusMessage: 'Creating yearly memory core with AI...'
      }));

      const yearlyResult = await consolidateYearWithLLM(
        dreamConsolidations,
        conversationConsolidations,
        year,
        personalityTraits,
        agentData,
        address!
      );

      if (!yearlyResult.success) {
        throw new Error(`Yearly LLM processing failed: ${yearlyResult.error}`);
      }

      setTestState(prev => ({ 
        ...prev, 
        isProcessingWithLLM: false,
        isUploadingToStorage: true,
        statusMessage: 'Uploading memory core to 0G Storage...'
      }));

      // Step 2: Storage Upload
      const storageResult = await saveMemoryCoreToStorage(
        operationalTokenId,
        yearlyResult.data!,
        downloadFile
      );

      if (!storageResult.success) {
        throw new Error(`Memory core storage upload failed: ${storageResult.error}`);
      }

      setTestState(prev => ({ 
        ...prev, 
        isUploadingToStorage: false,
        isUpdatingContract: true,
        statusMessage: 'Updating memory core in contract...'
      }));

      // Step 3: Contract Update
      const contractResult = await callUpdateMemoryCore(
        operationalTokenId,
        storageResult.memoryCoreHash!
      );

      if (!contractResult.success) {
        throw new Error(`Memory core contract update failed: ${contractResult.error}`);
      }

      setTestState(prev => ({ 
        ...prev, 
        isUpdatingContract: false,
        consolidationCompleted: true,
        txHash: contractResult.txHash!,
        storageHash: storageResult.memoryCoreHash!,
        statusMessage: 'Yearly memory core test completed successfully!'
      }));

      log.debug('Yearly consolidation test completed', {
        txHash: contractResult.txHash,
        memoryCoreHash: storageResult.memoryCoreHash
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setTestState(prev => ({ 
        ...prev, 
        isProcessingWithLLM: false,
        isUploadingToStorage: false,
        isUpdatingContract: false,
        error: errorMessage,
        statusMessage: ''
      }));
      log.debug('Yearly consolidation test failed', { error: errorMessage });
    } finally {
      setIsTestingConsolidation(false);
    }
  }, [operationalTokenId, mockData.yearlyData, personalityTraits, agentData]);

  /**
   * Resets test mode to initial state
   */
  const resetTestMode = useCallback(() => {
    setTestState({
      mockDataGenerated: false,
      isProcessingWithLLM: false,
      isUploadingToStorage: false,
      isUpdatingContract: false,
      consolidationCompleted: false,
      txHash: null,
      storageHash: null,
      statusMessage: '',
      error: null
    });
    setMockData({});
    log.debug('Test mode reset');
  }, [debugLog]);

  return {
    testState,
    mockData,
    isGeneratingMocks,
    isTestingConsolidation,
    generateMockData,
    testMonthlyConsolidation,
    testYearlyConsolidation,
    resetTestMode,
    operationalTokenId
  };
} 