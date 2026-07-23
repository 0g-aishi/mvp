/**
 * @fileoverview Dream Machine Services
 * @description All services for fetching context, building prompts, and AI analysis
 */

import { fromPromise } from 'xstate';
import { createPublicClient, http } from 'viem';
import { getActiveChain } from '../../config/chains';
import { getContractConfig } from '../services/contractService';
import { DreamContext, AIResponse, defaultAgentData } from '../types/contextTypes';
import { convertBigIntToString } from '../utils/jsonSerializer';
import { XStateStorageService } from '../services/xstateStorage';
import { buildMockDreamContext, sendMockDreamAnalysis } from '../mocks/dreamMocks';
import { logger } from '@/lib/logger';

const log = logger.child({ component: 'DreamServices' });

// Helper function for retry logic
const fetchWithRetry = async <T>(fn: () => Promise<T>, retries = 3, name = 'data'): Promise<T | undefined> => {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await fn();
      
      // Check if data is complete (not undefined)
      if (result !== undefined && result !== null) {
        // Special handling for AgentData - check both named props and array
        if (name === 'AgentData') {
          const hasNamedProps = (result as any).agentName !== undefined;
          const hasArrayData = Array.isArray(result) && (result as any)[1] !== undefined;
          
          if (hasNamedProps || hasArrayData) {
            log.debug(`[SUCCESS] ${name} fetched successfully on attempt ${i + 1}`, {
              hasNamedProps,
              hasArrayData,
              agentName: hasNamedProps ? (result as any).agentName : (result as any)[1]
            });
            return result;
          }
        } else {
          // For other data types, just check if not undefined
          log.debug(`[SUCCESS] ${name} fetched successfully on attempt ${i + 1}`);
          return result;
        }
      }
      
      // If undefined or incomplete, retry
      if (i < retries - 1) {
        const delay = 1000 * (i + 1); // Progressive delay: 1000ms, 2000ms, 3000ms
        log.debug(`[WARNING] Attempt ${i + 1} for ${name} returned incomplete data, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      if (i === retries - 1) {
        log.debug(`[ERROR] Failed to fetch ${name} after ${retries} attempts`, { error: String(error) });
        throw error;
      }
      const delay = 1000 * (i + 1);
      log.debug(`[WARNING] Attempt ${i + 1} for ${name} failed, retrying in ${delay}ms...`, { error: String(error) });
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  log.debug(`[WARNING] Returning undefined for ${name} after ${retries} attempts`);
  return undefined;
};

// Service: Fetch dream context from blockchain
export const fetchContextService = fromPromise(async ({ input }: { input: { dreamText: string; tokenId?: number; agentName?: string; continueWithoutMemory?: boolean } }) => {
  log.debug('=== BANDYCKA JAZDA: Fetching REAL dream context ===', { 
    dreamLength: input.dreamText.length,
    tokenId: input.tokenId || defaultAgentData.tokenId,
    agentName: input.agentName || 'Unknown',
    continueWithoutMemory: input.continueWithoutMemory || false
  });
  
  try {
    // Use provided data or fall back to defaults
    const effectiveTokenId = input.tokenId || defaultAgentData.tokenId;
    const effectiveAgentName = input.agentName || 'Unknown';
    
    // 1. Create viem public client
    const contractConfig = getContractConfig();
    const activeChain = getActiveChain();
    const publicClient = createPublicClient({
      chain: activeChain,
      transport: http()
    });

    log.debug('Created viem PublicClient', {
      chainId: activeChain.id,
      rpcUrl: activeChain.rpcUrls.default.http[0],
      contractAddress: contractConfig.address
    });
    
    // 2. Fetch agent memory from contract with retry
    const memoryData = await fetchWithRetry(
      () => publicClient.readContract({
        address: contractConfig.address,
        abi: contractConfig.abi,
        functionName: 'getAgentMemory',
        args: [BigInt(effectiveTokenId)]
      }),
      3,
      'AgentMemory'
    ) as any;
    
    // Handle undefined memory data
    if (!memoryData) {
      log.debug('[WARNING] Memory data undefined after retries, using empty hashes');
    } else {
      log.debug('[DATA] Contract memory data fetched', {
        memoryCoreHash: memoryData.memoryCoreHash,
        currentDreamDailyHash: memoryData.currentDreamDailyHash,
        currentConvDailyHash: memoryData.currentConvDailyHash,
        lastDreamMonthlyHash: memoryData.lastDreamMonthlyHash,
        lastConvMonthlyHash: memoryData.lastConvMonthlyHash
      });
    }
    
    // 3. Fetch agent data from agents mapping
    const agentData = await fetchWithRetry(
      () => publicClient.readContract({
        address: contractConfig.address,
        abi: contractConfig.abi,
        functionName: 'agents',
        args: [BigInt(effectiveTokenId)]
      }),
      3,
      'AgentData'
    ) as any;
    
    // Parse agent data (handle array format from contract)
    // agents mapping returns: owner, agentName, createdAt, lastUpdated, intelligenceLevel, dreamCount, conversationCount, personalityInitialized, totalEvolutions, lastEvolutionDate
    let parsedAgentData: any = {
      agentName: effectiveAgentName,
      intelligenceLevel: 1,
      dreamCount: 0,
      conversationCount: 0,
      totalEvolutions: 0
    };
    
    if (agentData) {
      // Wagmi v2 returns structs as objects with named properties
      if (Array.isArray(agentData)) {
        // Legacy array format (older wagmi/ethers)
        parsedAgentData = {
          owner: agentData[0],
          agentName: agentData[1] || effectiveAgentName,
          createdAt: agentData[2],
          lastUpdated: agentData[3],
          intelligenceLevel: agentData[4] || 1,
          dreamCount: agentData[5] || 0,
          conversationCount: agentData[6] || 0,
          personalityInitialized: agentData[7],
          totalEvolutions: agentData[8] || 0,
          lastEvolutionDate: agentData[9]
        };
      } else {
        // Wagmi v2 format - object with named properties
        parsedAgentData = {
          owner: agentData.owner,
          agentName: agentData.agentName || effectiveAgentName,
          createdAt: agentData.createdAt,
          lastUpdated: agentData.lastUpdated,
          intelligenceLevel: agentData.intelligenceLevel || 1,
          dreamCount: agentData.dreamCount || 0,
          conversationCount: agentData.conversationCount || 0,
          personalityInitialized: agentData.personalityInitialized,
          totalEvolutions: agentData.totalEvolutions || 0,
          lastEvolutionDate: agentData.lastEvolutionDate
        };
      }
      
      log.debug('[AGENT] Agent data parsed', {
        agentName: parsedAgentData.agentName,
        intelligenceLevel: parsedAgentData.intelligenceLevel?.toString(),
        dreamCount: parsedAgentData.dreamCount?.toString()
      });
    } else {
      log.debug('[WARNING] Agent data undefined, using defaults');
    }
    
    // 4. Fetch personality traits
    const personalityTraits = await fetchWithRetry(
      () => publicClient.readContract({
        address: contractConfig.address,
        abi: contractConfig.abi,
        functionName: 'getPersonalityTraits',
        args: [BigInt(effectiveTokenId)]
      }),
      3,
      'PersonalityTraits'
    );
    
    log.debug('[PERSONALITY] Personality traits fetched', {
      traits: convertBigIntToString(personalityTraits)
    });
    
    // 5. Fetch unique features
    const uniqueFeatures = await fetchWithRetry(
      () => publicClient.readContract({
        address: contractConfig.address,
        abi: contractConfig.abi,
        functionName: 'getUniqueFeatures',
        args: [BigInt(effectiveTokenId)]
      }),
      3,
      'UniqueFeatures'
    );
    
    log.debug('[FEATURES] Unique features fetched', {
      featuresCount: Array.isArray(uniqueFeatures) ? uniqueFeatures.length : 0
    });
    
    // 6. Download historical data from 0G Storage
    const storageService = new XStateStorageService();
    const emptyHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
    
    const historicalData = {
      dailyDreams: [] as any[],
      monthlyConsolidations: [] as any[],
      yearlyCore: null as any
    };
    
    // Download current daily dreams if hash exists (unless skipping memory)
    if (input.continueWithoutMemory) {
      log.debug('[INFO] Skipping memory download (continuing without memory)');
      historicalData.dailyDreams = [];
    } else if (memoryData?.currentDreamDailyHash && memoryData.currentDreamDailyHash !== emptyHash) {
      log.debug('[DOWNLOAD] Downloading daily dreams from storage', { 
        hash: memoryData.currentDreamDailyHash 
      });
      
      try {
        const result = await storageService.downloadJson(memoryData.currentDreamDailyHash);
        if (result.success && result.data) {
          historicalData.dailyDreams = Array.isArray(result.data) ? result.data : [];
          log.debug('[SUCCESS] Daily dreams downloaded successfully', {
            count: historicalData.dailyDreams.length,
            preview: historicalData.dailyDreams.slice(0, 2).map(d => ({
              id: d.id,
              date: d.date,
              emotions: d.emotions?.slice(0, 3)
            }))
          });
        } else {
          log.debug('[WARNING] Failed to download daily dreams', { error: result.error });
          // Throw error to trigger memoryDownloadFailed state
          throw new Error(`Failed to download daily dreams: ${result.error || 'File not found'}`);
        }
      } catch (error) {
        log.debug('[ERROR] Error downloading daily dreams', { error: String(error) });
        // Re-throw to trigger the error state
        throw error;
      }
    } else {
      log.debug('[INFO] No daily dreams hash available');
    }
    
    // Download monthly consolidations if hash exists
    if (!input.continueWithoutMemory && memoryData?.lastDreamMonthlyHash && memoryData.lastDreamMonthlyHash !== emptyHash) {
      log.debug('[DOWNLOAD] Downloading monthly consolidations from storage', { 
        hash: memoryData.lastDreamMonthlyHash 
      });
      
      try {
        const result = await storageService.downloadJson(memoryData.lastDreamMonthlyHash);
        if (result.success && result.data) {
          historicalData.monthlyConsolidations = Array.isArray(result.data) ? result.data : [result.data];
          log.debug('[SUCCESS] Monthly consolidations downloaded', {
            count: historicalData.monthlyConsolidations.length
          });
        } else {
          log.debug('[WARNING] Failed to download monthly consolidations', { error: result.error });
        }
      } catch (error) {
        log.debug('[ERROR] Error downloading monthly consolidations', { error: String(error) });
      }
    } else {
      log.debug('[INFO] No monthly consolidation hash available');
    }
    
    // Download memory core if hash exists
    if (!input.continueWithoutMemory && memoryData?.memoryCoreHash && memoryData.memoryCoreHash !== emptyHash) {
      log.debug('[DOWNLOAD] Downloading memory core from storage', { 
        hash: memoryData.memoryCoreHash 
      });
      
      try {
        const result = await storageService.downloadJson(memoryData.memoryCoreHash);
        if (result.success && result.data) {
          historicalData.yearlyCore = result.data;
          log.debug('[SUCCESS] Memory core downloaded');
        } else {
          log.debug('[WARNING] Failed to download memory core', { error: result.error });
        }
      } catch (error) {
        log.debug('[ERROR] Error downloading memory core', { error: String(error) });
      }
    } else {
      log.debug('[INFO] No memory core hash available');
    }
    
    // 7. Calculate memory access based on intelligence level
    const intelligenceLevel = Number(parsedAgentData.intelligenceLevel || 0);
    const calculateMemoryAccess = (level: number): number => {
      if (level <= 5) return 1;
      if (level <= 10) return 3;
      if (level <= 20) return 6;
      return 12;
    };
    
    const getMemoryDepthString = (level: number): string => {
      if (level <= 5) return 'shallow';
      if (level <= 10) return 'moderate';
      if (level <= 20) return 'deep';
      return 'profound';
    };
    
    // 8. Build complete context with proper structure
    // Handle undefined personalityTraits with fallback to defaults
    const personalityData = personalityTraits || defaultAgentData.personality;
    
    const dreamContext: DreamContext = {
      userDream: input.dreamText,
      agentProfile: {
        name: parsedAgentData.agentName || effectiveAgentName,
        intelligenceLevel: intelligenceLevel,
        dreamCount: Number(parsedAgentData.dreamCount || 0),
        conversationCount: Number(parsedAgentData.conversationCount || 0)
      },
      // FIXED: personality at root level, not in agentProfile
      personality: {
        creativity: personalityData.creativity || 50,
        analytical: personalityData.analytical || 50,
        empathy: personalityData.empathy || 50,
        intuition: personalityData.intuition || 50,
        resilience: personalityData.resilience || 50,
        curiosity: personalityData.curiosity || 50,
        dominantMood: personalityData.dominantMood || 'neutral',
        responseStyle: 'responseStyle' in personalityData ? personalityData.responseStyle : 'balanced'
      },
      // FIXED: uniqueFeatures at root level
      uniqueFeatures: Array.isArray(uniqueFeatures) ? uniqueFeatures : [],
      memoryAccess: {
        monthsAccessible: calculateMemoryAccess(intelligenceLevel),
        memoryDepth: getMemoryDepthString(intelligenceLevel)
      },
      // FIXED: proper historicalData structure
      historicalData: {
        dailyDreams: historicalData.dailyDreams,
        monthlyConsolidations: historicalData.monthlyConsolidations,
        yearlyCore: historicalData.yearlyCore
      },
      // Add memoryData for file management
      memoryData: memoryData ? {
        memoryCoreHash: memoryData.memoryCoreHash || '',
        currentDreamDailyHash: memoryData.currentDreamDailyHash || '',
        currentConvDailyHash: memoryData.currentConvDailyHash || '',
        lastDreamMonthlyHash: memoryData.lastDreamMonthlyHash || '',
        lastConvMonthlyHash: memoryData.lastConvMonthlyHash || '',
        lastConsolidation: memoryData.lastConsolidation,
        currentMonth: memoryData.currentMonth,
        currentYear: memoryData.currentYear
      } : undefined
    };
    
    log.debug('[COMPLETE] REAL context built successfully', {
      agentName: dreamContext.agentProfile.name,
      dreamCount: dreamContext.agentProfile.dreamCount,
      intelligenceLevel: dreamContext.agentProfile.intelligenceLevel,
      memoryDepth: dreamContext.memoryAccess.memoryDepth,
      monthsAccessible: dreamContext.memoryAccess.monthsAccessible,
      personalityLoaded: !!personalityTraits,
      historicalDreamsCount: dreamContext.historicalData.dailyDreams.length,
      hasMonthlyData: dreamContext.historicalData.monthlyConsolidations.length > 0,
      hasYearlyCore: !!dreamContext.historicalData.yearlyCore
    });
    
    return dreamContext;
    
  } catch (error) {
    log.debug('[ERROR] Failed to fetch dream context', { error: String(error) });
    throw error;
  }
});

// Service: Build dream prompt
export const buildPromptService = fromPromise(async ({ input }: { input: { context: DreamContext } }) => {
  log.debug('Building advanced dream prompt with full consciousness');
  
  try {
    // Dynamic import to prevent circular dependencies
    const { buildAdvancedDreamPrompt } = await import('../services/advancedPromptBuilder');
    
    const promptResult = buildAdvancedDreamPrompt(input.context);
    
    // Combine system and user prompts into a single string for AI service
    const fullPrompt = `${promptResult.systemPrompt}\n\n${promptResult.userPrompt}`;
    
    log.debug('[DATA] Advanced prompt built', {
      promptLength: fullPrompt.length,
      hasHistoricalContext: input.context.historicalData?.dailyDreams?.length > 0,
      intelligenceLevel: input.context.agentProfile.intelligenceLevel,
      isEvolutionDream: promptResult.isEvolutionDream,
      dreamId: promptResult.dreamId
    });
    
    return fullPrompt;
  } catch (error) {
    log.debug('[ERROR] Failed to build prompt', { error: String(error) });
    throw error;
  }
});

// Service: AI analysis with different models
export const aiAnalysisService = fromPromise(async ({ input }: { input: { 
  prompt: string; 
  dreamCount: number;
  modelId?: string;
  walletAddress?: string;
} }) => {
  log.debug('Sending to AI for analysis');
  log.debug('[INFO] Dream analysis parameters', {
    modelId: input.modelId || 'default',
    dreamCount: input.dreamCount,
    promptLength: input.prompt.length
  });
  
  // Log full prompt for verification (only in test mode)
  if (process.env.NEXT_PUBLIC_DREAM_TEST === 'true') {
    log.debug('[FULL PROMPT FOR VERIFICATION - START]');
    log.debug('Full prompt: ' + input.prompt);
    log.debug('[FULL PROMPT FOR VERIFICATION - END]');
  }
  
  try {
    // Dynamic import to prevent circular dependencies
    const { sendDreamToAI } = await import('../services/apiService');
    
    // Calculate if this is an evolution dream (every 5th dream)
    const nextDreamId = input.dreamCount + 1;
    const isEvolutionDream = nextDreamId % 5 === 0;
    
    // Special logging for evolution dreams
    if (isEvolutionDream) {
      log.debug('========================================');
      log.debug('[EVOLUTION DREAM] Sequence activated');
      log.debug('========================================');
      log.debug('Dream #' + nextDreamId + ' - Personality evolution triggered');
      log.debug('Current dream count: ' + input.dreamCount);
      log.debug('Agent trait evolution in progress');
      log.debug('========================================');
    }
    
    log.debug('[API] Calling real AI backend', { 
      modelId: input.modelId,
      promptLength: input.prompt.length,
      isEvolutionDream,
      dreamCount: input.dreamCount,
      nextDreamId
    });
    
    const aiResponse = await sendDreamToAI(
      input.prompt, 
      input.modelId || 'gemini-2.5-flash-auto',
      input.walletAddress,
      isEvolutionDream,
      input.dreamCount
    );
    
    log.debug('[SUCCESS] AI analysis complete', {
      hasFullAnalysis: !!aiResponse.fullAnalysis,
      hasDreamData: !!aiResponse.dreamData,
      personalityImpact: aiResponse.personalityImpact
    });
    
    // Log personality evolution details if present
    if (aiResponse.personalityImpact) {
      log.debug('🧬 ========================================');
      log.debug('🧬 PERSONALITY EVOLUTION DATA RECEIVED!');
      log.debug('🧬 ========================================');
      log.debug('🧬 Creativity change: ' + (aiResponse.personalityImpact.creativityChange > 0 ? '+' : '') + aiResponse.personalityImpact.creativityChange);
      log.debug('🧬 Analytical change: ' + (aiResponse.personalityImpact.analyticalChange > 0 ? '+' : '') + aiResponse.personalityImpact.analyticalChange);
      log.debug('🧬 Empathy change: ' + (aiResponse.personalityImpact.empathyChange > 0 ? '+' : '') + aiResponse.personalityImpact.empathyChange);
      log.debug('🧬 Intuition change: ' + (aiResponse.personalityImpact.intuitionChange > 0 ? '+' : '') + aiResponse.personalityImpact.intuitionChange);
      log.debug('🧬 Resilience change: ' + (aiResponse.personalityImpact.resilienceChange > 0 ? '+' : '') + aiResponse.personalityImpact.resilienceChange);
      log.debug('🧬 Curiosity change: ' + (aiResponse.personalityImpact.curiosityChange > 0 ? '+' : '') + aiResponse.personalityImpact.curiosityChange);
      log.debug('🧬 Mood shift: ' + aiResponse.personalityImpact.moodShift);
      log.debug('🧬 Evolution weight: ' + aiResponse.personalityImpact.evolutionWeight);
      if (aiResponse.personalityImpact.newFeatures && aiResponse.personalityImpact.newFeatures.length > 0) {
        log.debug('🧬 New features gained: ' + aiResponse.personalityImpact.newFeatures.length);
        aiResponse.personalityImpact.newFeatures.forEach(feature => {
          log.debug('🧬   - ' + feature.name + ' (Intensity: ' + feature.intensity + '%)');
        });
      }
      log.debug('🧬 ========================================');
    }
    
    return aiResponse;
  } catch (error) {
    log.debug('[ERROR] AI analysis failed', { error: String(error) });
    throw error;
  }
});