/**
 * @fileoverview Contract service for dynamic ABI imports and configuration
 * @description Provides centralized contract configuration for terminal integration
 */

import { aishiAgentAbi, aishiAgentAddress } from '../../generated';
import { getActiveChain } from '../../config/chains';

export interface ContractConfig {
  address: `0x${string}`;
  abi: any[];
  chainId: number;
  contractName: string;
  network: string;
}

/**
 * @returns Contract configuration with type-safe ABI for blockchain interactions
 */
export const getContractConfig = () => {
  const activeChain = getActiveChain();
  return {
    address: aishiAgentAddress[activeChain.id as 16602 | 16661],
    abi: aishiAgentAbi,
    chainId: activeChain.id,
    contractName: 'AishiAgent',
    network: activeChain.network
  } as const;
};

export const ContractFunctions = {
  AGENTS: 'agents',
  OWNER_TO_TOKEN_ID: 'ownerToTokenId',
  GET_PERSONALITY_TRAITS: 'getPersonalityTraits',
  GET_AGENT_MEMORY: 'getAgentMemory',
  GET_MEMORY_ACCESS: 'getMemoryAccess',
  GET_UNIQUE_FEATURES: 'getUniqueFeatures',
  CAN_PROCESS_DREAM_TODAY: 'canProcessDreamToday',
  PROCESS_DAILY_DREAM: 'processDailyDream',
  MINT_AGENT: 'mintAgent',
  GET_CONSOLIDATION_REWARD: 'getConsolidationReward',
  GET_EVOLUTION_STATS: 'getEvolutionStats',
  CONSOLIDATION_STREAK: 'consolidationStreak',
  RESPONSE_STYLES: 'responseStyles',
  PENDING_REWARDS: 'pendingRewards',
  HAS_MILESTONE: 'hasMilestone'
} as const;

export interface AgentMemoryStructure {
  memoryCoreHash: string;
  currentDreamDailyHash: string;
  currentConvDailyHash: string;
  lastDreamMonthlyHash: string;
  lastConvMonthlyHash: string;
  lastConsolidation: bigint;
  currentMonth: number;
  currentYear: number;
}

export interface PersonalityTraits {
  creativity: bigint;
  analytical: bigint;
  empathy: bigint;
  intuition: bigint;
  resilience: bigint;
  curiosity: bigint;
  dominantMood: string;
}

/**
 * @param hash Contract hash to validate
 * @returns true if hash represents empty/uninitialized state
 */
export const isEmptyHash = (hash: string): boolean => {
  const emptyHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
  return !hash || hash === emptyHash || hash === '0x0';
};