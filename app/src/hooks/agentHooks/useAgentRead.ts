'use client';

import { useReadContract } from 'wagmi'
import { getContractConfig } from './config/contractConfig'
import { useWallet } from '../useWallet'
import { Address } from 'viem'
import { logger } from '@/lib/logger'

// Logger instance (module-level for top-level hook)
const log = logger.child({ component: 'useAgentRead' });

export function useAgentRead(tokenId?: number) {
  const { address } = useWallet()
  const contractConfig = getContractConfig();
  const contractAddress = contractConfig.address;
  const contractAbi = contractConfig.abi;

  // Pobierz tokenId dla zalogowanego użytkownika
  const { data: userTokenId, isLoading: tokenIdLoading, error: tokenIdError } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'ownerToTokenId',
    args: address ? [address] : undefined,
  })

  // Użyj tokenId lub userTokenId jako efectiveTokenId
  const effectiveTokenId = tokenId || (userTokenId ? Number(userTokenId) : undefined)
  const shouldLoadData = effectiveTokenId && effectiveTokenId > 0

  log.debug('useAgentRead initialized', {
    tokenId,
    userTokenId: userTokenId ? Number(userTokenId) : undefined,
    effectiveTokenId,
    shouldLoadData,
    address,
    timestamp: Date.now()
  });

  // Pobierz dane agenta (zastępuje getAgentInfo)
  const { data: agentData, isLoading: agentLoading, error: agentError } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'agents',
    args: shouldLoadData ? [BigInt(effectiveTokenId)] : undefined,
    query: {
      enabled: shouldLoadData,
    },
  })

  // Pobierz cechy osobowości agenta - NOWA FUNKCJA getPersonalityTraits()
  const { data: personalityTraits, isLoading: personalityTraitsLoading, error: personalityTraitsError } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'getPersonalityTraits',
    args: shouldLoadData ? [BigInt(effectiveTokenId)] : undefined,
    query: {
      enabled: shouldLoadData,
    },
  })

  // Pobierz pamięć agenta
  const { data: memoryData, isLoading: memoryLoading, error: memoryError } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'getAgentMemory',
    args: shouldLoadData ? [BigInt(effectiveTokenId)] : undefined,
    query: {
      enabled: shouldLoadData,
    },
  })

  log.debug('Raw contract data', {
    agentData: agentData ? 'loaded' : 'null',
    personalityTraits: personalityTraits ? 'loaded' : 'null',
    memoryData: memoryData ? 'loaded' : 'null',
    memoryError: memoryError ? memoryError.message : 'no error',
    effectiveTokenId
  });

  // DETAILED PERSONALITY TRAITS LOGGING
  if (personalityTraits) {
    log.debug('PersonalityTraits RAW data from contract', {
      rawPersonalityTraits: personalityTraits,
      personalityTraitsType: typeof personalityTraits,
      personalityTraitsConstructor: personalityTraits.constructor.name,
      personalityTraitsLength: Array.isArray(personalityTraits) ? personalityTraits.length : 'not array',
      personalityTraitsKeys: typeof personalityTraits === 'object' ? Object.keys(personalityTraits) : 'not object'
    });

    // Test wagmi v2 vs array access
    log.debug('PersonalityTraits Wagmi v2 vs Array parsing', {
      // Array style (old ethers)
      creativityArray: (personalityTraits as any)[0],
      analyticalArray: (personalityTraits as any)[1],
      empathyArray: (personalityTraits as any)[2],
      moodArray: (personalityTraits as any)[6],
      
      // Object style (wagmi v2)
      creativityObj: (personalityTraits as any).creativity,
      analyticalObj: (personalityTraits as any).analytical,
      empathyObj: (personalityTraits as any).empathy,
      moodObj: (personalityTraits as any).dominantMood
    });
  }

  if (memoryData) {
    log.debug('Memory data details', {
      memoryCoreHash: (memoryData as any).memoryCoreHash,
      currentDreamDailyHash: (memoryData as any).currentDreamDailyHash,
      currentConvDailyHash: (memoryData as any).currentConvDailyHash,
      lastDreamMonthlyHash: (memoryData as any).lastDreamMonthlyHash,
      lastConvMonthlyHash: (memoryData as any).lastConvMonthlyHash,
      lastConsolidation: (memoryData as any).lastConsolidation,
      currentMonth: (memoryData as any).currentMonth,
      currentYear: (memoryData as any).currentYear
    });
  } else {
    log.debug('Memory data is null/undefined', { memoryData });
  }

  // NOWA FUNKCJA: Sprawdź czy można przetwarzać sen dzisiaj
  const { data: canProcessDreamToday, isLoading: canProcessLoading, error: canProcessError } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'canProcessDreamToday',
    args: shouldLoadData ? [BigInt(effectiveTokenId)] : undefined,
    query: {
      enabled: shouldLoadData,
    },
  })

  // NOWA FUNKCJA: Pobierz dostęp do pamięci
  const { data: memoryAccess, isLoading: memoryAccessLoading, error: memoryAccessError } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'getMemoryAccess',
    args: shouldLoadData ? [BigInt(effectiveTokenId)] : undefined,
    query: {
      enabled: shouldLoadData,
    },
  })

  // DETAILED AGENT DATA LOGGING
  if (agentData) {
    log.debug('AgentData RAW data from contract', {
      rawAgentData: agentData,
      agentDataType: typeof agentData,
      agentDataConstructor: agentData.constructor.name,
      agentDataLength: Array.isArray(agentData) ? agentData.length : 'not array',
      agentDataKeys: typeof agentData === 'object' ? Object.keys(agentData) : 'not object'
    });

    // Test wagmi v2 vs array access for agent data
    log.debug('AgentData Wagmi v2 vs Array parsing', {
      // Array style (old ethers)
      agentNameArray: (agentData as any)[1],
      intelligenceLevelArray: (agentData as any)[4],
      dreamCountArray: (agentData as any)[5],
      
      // Object style (wagmi v2)
      agentNameObj: (agentData as any).agentName,
      intelligenceLevelObj: (agentData as any).intelligenceLevel,
      dreamCountObj: (agentData as any).dreamCount
    });
  }

  // Kombinuj dane agenta z danymi osobowości
  const combinedAgentData = agentData && personalityTraits ? {
    // Dane podstawowe z agents() - WAGMI V2 COMPATIBLE
    owner: ((agentData as any).owner !== undefined ? 
      (agentData as any).owner : (agentData as any)[0]) as Address,
    agentName: ((agentData as any).agentName !== undefined ? 
      (agentData as any).agentName : (agentData as any)[1]) as string,
    createdAt: ((agentData as any).createdAt !== undefined ? 
      (agentData as any).createdAt : (agentData as any)[2]) as bigint,
    lastUpdated: ((agentData as any).lastUpdated !== undefined ? 
      (agentData as any).lastUpdated : (agentData as any)[3]) as bigint,
    intelligenceLevel: Number((agentData as any).intelligenceLevel !== undefined ? 
      (agentData as any).intelligenceLevel : (agentData as any)[4]),
    dreamCount: Number((agentData as any).dreamCount !== undefined ? 
      (agentData as any).dreamCount : (agentData as any)[5]),
    conversationCount: Number((agentData as any).conversationCount !== undefined ? 
      (agentData as any).conversationCount : (agentData as any)[6]),
    personalityInitialized: ((agentData as any).personalityInitialized !== undefined ? 
      (agentData as any).personalityInitialized : (agentData as any)[7]) as boolean,
    totalEvolutions: Number((agentData as any).totalEvolutions !== undefined ? 
      (agentData as any).totalEvolutions : (agentData as any)[8]),
    lastEvolutionDate: Number((agentData as any).lastEvolutionDate !== undefined ? 
      (agentData as any).lastEvolutionDate : (agentData as any)[9]),
    
    // Dane osobowości z getPersonalityTraits() - WAGMI V2 COMPATIBLE
    personality: {
      creativity: ((personalityTraits as any).creativity !== undefined ? 
        (personalityTraits as any).creativity : (personalityTraits as any)[0]) as number,
      analytical: ((personalityTraits as any).analytical !== undefined ? 
        (personalityTraits as any).analytical : (personalityTraits as any)[1]) as number,
      empathy: ((personalityTraits as any).empathy !== undefined ? 
        (personalityTraits as any).empathy : (personalityTraits as any)[2]) as number,
      intuition: ((personalityTraits as any).intuition !== undefined ? 
        (personalityTraits as any).intuition : (personalityTraits as any)[3]) as number,
      resilience: ((personalityTraits as any).resilience !== undefined ? 
        (personalityTraits as any).resilience : (personalityTraits as any)[4]) as number,
      curiosity: ((personalityTraits as any).curiosity !== undefined ? 
        (personalityTraits as any).curiosity : (personalityTraits as any)[5]) as number,
      dominantMood: ((personalityTraits as any).dominantMood !== undefined ? 
        (personalityTraits as any).dominantMood : (personalityTraits as any)[6]) as string,
      lastDreamDate: ((personalityTraits as any).lastDreamDate !== undefined ? 
        (personalityTraits as any).lastDreamDate : (personalityTraits as any)[7]) as bigint,
      // Dodaj unikalne features z getPersonalityTraits() - konwersja na string[]
      uniqueFeatures: ((personalityTraits as any).uniqueFeatures !== undefined ? 
        (personalityTraits as any).uniqueFeatures : (personalityTraits as any)[8])
        ?.map((feature: any) => feature.name) || [],
    },
    
    // Dane pamięci z getAgentMemory()
    memory: memoryData ? {
      memoryCoreHash: (memoryData as any).memoryCoreHash as `0x${string}`,
      currentDreamDailyHash: (memoryData as any).currentDreamDailyHash as `0x${string}`,
      currentConvDailyHash: (memoryData as any).currentConvDailyHash as `0x${string}`,
      lastDreamMonthlyHash: (memoryData as any).lastDreamMonthlyHash as `0x${string}`,
      lastConvMonthlyHash: (memoryData as any).lastConvMonthlyHash as `0x${string}`,
      lastConsolidation: Number((memoryData as any).lastConsolidation),
      currentMonth: (memoryData as any).currentMonth as number,
      currentYear: (memoryData as any).currentYear as number,
    } : undefined
  } : undefined

  log.debug('Combined agent data', {
    hasAgentData: !!agentData,
    hasPersonalityTraits: !!personalityTraits,
    hasMemoryData: !!memoryData,
    hasCombinedData: !!combinedAgentData,
    hasMemoryInCombined: !!combinedAgentData?.memory,
    currentDreamDailyHash: combinedAgentData?.memory?.currentDreamDailyHash || 'missing'
  });

  // DETAILED COMBINED DATA LOGGING
  if (combinedAgentData) {
    log.debug('Combined AgentData FULL details', {
      agentName: combinedAgentData.agentName,
      intelligenceLevel: combinedAgentData.intelligenceLevel,
      dreamCount: combinedAgentData.dreamCount,
      conversationCount: combinedAgentData.conversationCount,
      personalityInitialized: combinedAgentData.personalityInitialized,
      totalEvolutions: combinedAgentData.totalEvolutions,
      
      personalityFull: combinedAgentData.personality,
      
      personalityDetails: {
        creativity: combinedAgentData.personality.creativity,
        analytical: combinedAgentData.personality.analytical,
        empathy: combinedAgentData.personality.empathy,
        intuition: combinedAgentData.personality.intuition,
        resilience: combinedAgentData.personality.resilience,
        curiosity: combinedAgentData.personality.curiosity,
        dominantMood: combinedAgentData.personality.dominantMood,
        lastDreamDate: combinedAgentData.personality.lastDreamDate,
        uniqueFeaturesCount: combinedAgentData.personality.uniqueFeatures?.length || 0
      },
      
      memoryHashes: combinedAgentData.memory ? {
        memoryCoreHash: combinedAgentData.memory.memoryCoreHash,
        currentDreamDailyHash: combinedAgentData.memory.currentDreamDailyHash,
        lastDreamMonthlyHash: combinedAgentData.memory.lastDreamMonthlyHash
      } : 'no memory data'
    });
  }

  return {
    // Dane agenta
    agentData: combinedAgentData,
    isLoading: agentLoading || personalityTraitsLoading || memoryLoading || canProcessLoading || memoryAccessLoading,
    error: agentError || personalityTraitsError || memoryError || canProcessError || memoryAccessError,
    
    // TokenId użytkownika
    userTokenId: userTokenId ? Number(userTokenId) : undefined,
    isLoadingTokenId: tokenIdLoading,
    tokenIdError,
    
    // Sprawdź czy użytkownik ma agenta
    hasAgent: userTokenId ? Number(userTokenId) > 0 : false,
    
    // Aktualnie używane tokenId
    effectiveTokenId,

    // NOWE FUNKCJE - wyeksportowane z hook'a
    canProcessDreamToday: canProcessDreamToday as boolean,
    isLoadingCanProcess: canProcessLoading,
    canProcessError,

    memoryAccess: memoryAccess ? {
      monthsAccessible: ((memoryAccess as any).monthsAccessible !== undefined ? 
        (memoryAccess as any).monthsAccessible : (memoryAccess as any)[0]) as number,
      memoryDepth: ((memoryAccess as any).memoryDepth !== undefined ? 
        (memoryAccess as any).memoryDepth : (memoryAccess as any)[1]) as string,
    } : undefined,
    isLoadingMemoryAccess: memoryAccessLoading,
    memoryAccessError,

    // Osobowość z nowymi danymi - WAGMI V2 COMPATIBLE
    personalityTraits: personalityTraits ? {
      creativity: ((personalityTraits as any).creativity !== undefined ? 
        (personalityTraits as any).creativity : (personalityTraits as any)[0]) as number,
      analytical: ((personalityTraits as any).analytical !== undefined ? 
        (personalityTraits as any).analytical : (personalityTraits as any)[1]) as number,
      empathy: ((personalityTraits as any).empathy !== undefined ? 
        (personalityTraits as any).empathy : (personalityTraits as any)[2]) as number,
      intuition: ((personalityTraits as any).intuition !== undefined ? 
        (personalityTraits as any).intuition : (personalityTraits as any)[3]) as number,
      resilience: ((personalityTraits as any).resilience !== undefined ? 
        (personalityTraits as any).resilience : (personalityTraits as any)[4]) as number,
      curiosity: ((personalityTraits as any).curiosity !== undefined ? 
        (personalityTraits as any).curiosity : (personalityTraits as any)[5]) as number,
      dominantMood: ((personalityTraits as any).dominantMood !== undefined ? 
        (personalityTraits as any).dominantMood : (personalityTraits as any)[6]) as string,
      lastDreamDate: ((personalityTraits as any).lastDreamDate !== undefined ? 
        (personalityTraits as any).lastDreamDate : (personalityTraits as any)[7]) as bigint,
      uniqueFeatures: ((personalityTraits as any).uniqueFeatures !== undefined ? 
        (personalityTraits as any).uniqueFeatures : (personalityTraits as any)[8]) as Array<{
        name: string;
        description: string;
        intensity: number;
        addedAt: bigint;
      }>,
    } : undefined,
    isLoadingPersonalityTraits: personalityTraitsLoading,
    personalityTraitsError,
  }
} 