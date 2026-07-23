/**
 * @fileoverview Contract Reader Service for comprehensive agent data retrieval
 * @description Centralized service for reading all agent-related data from the blockchain contract
 */

import { createPublicClient, http, Address } from 'viem';
import { getActiveChain } from '../../config/chains';
import { getContractConfig, ContractFunctions } from './contractService';
import { aishiAgentAbi } from '../../generated';
import { logger } from '@/lib/logger';

const log = logger.child({ component: 'ContractReader' });

/**
 * Complete agent data structure containing all contract information
 */
export interface CompleteAgentData {
  tokenId: number;
  
  // Basic agent information from agents mapping
  basic: {
    owner: Address;
    agentName: string;
    createdAt: bigint;
    lastUpdated: bigint;
    intelligenceLevel: number;
    dreamCount: number;
    conversationCount: number;
    personalityInitialized: boolean;
    totalEvolutions: number;
    lastEvolutionDate: bigint;
    achievedMilestones?: string[];
  };
  
  // Personality traits from getPersonalityTraits
  personality: {
    creativity: number;
    analytical: number;
    empathy: number;
    intuition: number;
    resilience: number;
    curiosity: number;
    dominantMood: string;
    lastDreamDate?: bigint;
  };
  
  // Memory structure from getAgentMemory
  memory: {
    memoryCoreHash: string;
    currentDreamDailyHash: string;
    currentConvDailyHash: string;
    lastDreamMonthlyHash: string;
    lastConvMonthlyHash: string;
    lastConsolidation: bigint;
    currentMonth: number;
    currentYear: number;
  };
  
  // Unique features from getUniqueFeatures
  features: Array<{
    name: string;
    description: string;
    intensity: number;
  }>;
  
  // Status information
  status: {
    canProcessDreamToday: boolean;
    consolidationStreak?: number;
    hasPendingRewards?: boolean;
    memoryAccessMonths?: number;
    memoryAccessDepth?: string;
  };
  
  // Consolidation reward preview
  consolidationReward?: {
    baseReward: number;
    streakBonus: number;
    earlyBirdBonus: number;
    totalReward: number;
  };
  
  // Evolution statistics
  evolutionStats?: {
    totalEvolutions: number;
    evolutionRate: number;
    lastEvolution: bigint;
  };
  
  // Pending rewards from mapping
  pendingRewards?: {
    intelligenceBonus: number;
    specialMilestone: string;
    yearlyReflection: boolean;
  };
  
  // Cached response style from contract mapping
  cachedResponseStyle?: string;
  
  // Computed/derived fields
  computed: {
    responseStyle: string;
    memoryDepthDescription: string;
    daysUntilNextConsolidation?: number;
    daysSinceLastDream?: number;
    isEvolutionReady: boolean;
    nextEvolutionAt: number;
  };
}

/**
 * Service for reading comprehensive agent data from the contract
 */
export class ContractReaderService {
  private publicClient: any;
  private contractConfig: ReturnType<typeof getContractConfig>;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTTL: number = 60000; // 1 minute cache

  constructor(publicClient?: any) {
    this.contractConfig = getContractConfig();
    
    // Use provided client or create new one
    this.publicClient = publicClient || createPublicClient({
      chain: getActiveChain(),
      transport: http()
    });
    
    log.debug('Service initialized', {
      contractAddress: this.contractConfig.address,
      chainId: this.contractConfig.chainId
    });
  }

  /**
   * Helper for retry logic with exponential backoff
   */
  private async fetchWithRetry<T>(
    fn: () => Promise<T>,
    retries = 3,
    name = 'data'
  ): Promise<T | undefined> {
    for (let i = 0; i < retries; i++) {
      try {
        const result = await fn();
        
        if (result !== undefined && result !== null) {
          log.debug(`[SUCCESS] ${name} fetched on attempt ${i + 1}`);
          return result;
        }
        
        if (i < retries - 1) {
          const delay = 1000 * (i + 1);
          log.debug(`[RETRY] Attempt ${i + 1} for ${name} failed, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        if (i === retries - 1) {
          log.debug(`[ERROR] Failed to fetch ${name} after ${retries} attempts`, { error: String(error) });
          throw error;
        }
        const delay = 1000 * (i + 1);
        log.debug(`[WARNING] Attempt ${i + 1} for ${name} failed, retrying...`, { error: String(error) });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    log.debug(`[WARNING] Returning undefined for ${name} after ${retries} attempts`);
    return undefined;
  }

  /**
   * Check cache for data
   */
  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      log.debug(`[CACHE HIT] ${key}`);
      return cached.data as T;
    }
    return null;
  }

  /**
   * Store data in cache
   */
  private setCached(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
    log.debug(`[CACHE SET] ${key}`);
  }

  /**
   * Get complete agent data - all information in one call
   */
  async getCompleteAgentData(tokenId: number): Promise<CompleteAgentData | null> {
    const cacheKey = `complete_${tokenId}`;
    const cached = this.getCached<CompleteAgentData>(cacheKey);
    if (cached) return cached;

    log.debug('Fetching complete agent data', { tokenId });

    try {
      // Fetch all data in parallel for efficiency
      const [
        basic, 
        personality, 
        memory, 
        features, 
        status,
        consolidationReward,
        evolutionStats,
        pendingRewards,
        cachedResponseStyle,
        consolidationStreak
      ] = await Promise.all([
        this.getBasicData(tokenId),
        this.getPersonalityTraits(tokenId),
        this.getMemoryData(tokenId),
        this.getUniqueFeatures(tokenId),
        this.getStatusData(tokenId),
        this.getConsolidationReward(tokenId),
        this.getEvolutionStats(tokenId),
        this.getPendingRewards(tokenId),
        this.getCachedResponseStyle(tokenId),
        this.getConsolidationStreak(tokenId)
      ]);

      if (!basic) {
        log.debug('No basic data found for token', { tokenId });
        return null;
      }

      // Update status with consolidation streak
      if (status && consolidationStreak !== undefined) {
        status.consolidationStreak = consolidationStreak;
      }

      // Check if has pending rewards
      if (status && pendingRewards) {
        status.hasPendingRewards = pendingRewards.intelligenceBonus > 0 || 
                                  pendingRewards.specialMilestone !== '' || 
                                  pendingRewards.yearlyReflection;
      }

      // Compute derived fields
      const computed = this.computeDerivedFields(basic, personality, memory);

      const completeData: CompleteAgentData = {
        tokenId,
        basic,
        personality: personality || this.getDefaultPersonality(),
        memory: memory || this.getDefaultMemory(),
        features: features || [],
        status: status || this.getDefaultStatus(),
        consolidationReward,
        evolutionStats,
        pendingRewards,
        cachedResponseStyle,
        computed
      };

      this.setCached(cacheKey, completeData);
      return completeData;

    } catch (error) {
      log.debug('Error fetching complete agent data', { error: String(error) });
      return null;
    }
  }

  /**
   * Get basic agent data from agents mapping
   */
  async getBasicData(tokenId: number): Promise<CompleteAgentData['basic'] | null> {
    const cacheKey = `basic_${tokenId}`;
    const cached = this.getCached<CompleteAgentData['basic']>(cacheKey);
    if (cached) return cached;

    log.debug('Fetching basic agent data', { tokenId });

    const agentData = await this.fetchWithRetry(
      () => this.publicClient.readContract({
        address: this.contractConfig.address,
        abi: this.contractConfig.abi,
        functionName: ContractFunctions.AGENTS,
        args: [BigInt(tokenId)]
      }),
      5, // More retries for critical data
      'AgentBasicData'
    ) as any;

    if (!agentData) return null;

    // Parse data with Wagmi v2 compatibility (named properties or array access)
    const parsed: CompleteAgentData['basic'] = {
      owner: (agentData.owner !== undefined ? agentData.owner : agentData[0]) as Address,
      agentName: (agentData.agentName !== undefined ? agentData.agentName : agentData[1]) as string,
      createdAt: BigInt(agentData.createdAt !== undefined ? agentData.createdAt : agentData[2]),
      lastUpdated: BigInt(agentData.lastUpdated !== undefined ? agentData.lastUpdated : agentData[3]),
      intelligenceLevel: Number(agentData.intelligenceLevel !== undefined ? agentData.intelligenceLevel : agentData[4]),
      dreamCount: Number(agentData.dreamCount !== undefined ? agentData.dreamCount : agentData[5]),
      conversationCount: Number(agentData.conversationCount !== undefined ? agentData.conversationCount : agentData[6]),
      personalityInitialized: Boolean(agentData.personalityInitialized !== undefined ? agentData.personalityInitialized : agentData[7]),
      totalEvolutions: Number(agentData.totalEvolutions !== undefined ? agentData.totalEvolutions : agentData[8]),
      lastEvolutionDate: BigInt(agentData.lastEvolutionDate !== undefined ? agentData.lastEvolutionDate : agentData[9]),
      achievedMilestones: agentData.achievedMilestones || agentData[10] || []
    };

    this.setCached(cacheKey, parsed);
    return parsed;
  }

  /**
   * Get personality traits
   */
  async getPersonalityTraits(tokenId: number): Promise<CompleteAgentData['personality'] | null> {
    const cacheKey = `personality_${tokenId}`;
    const cached = this.getCached<CompleteAgentData['personality']>(cacheKey);
    if (cached) return cached;

    log.debug('Fetching personality traits', { tokenId });

    const traits = await this.fetchWithRetry(
      () => this.publicClient.readContract({
        address: this.contractConfig.address,
        abi: this.contractConfig.abi,
        functionName: ContractFunctions.GET_PERSONALITY_TRAITS,
        args: [BigInt(tokenId)]
      }),
      3,
      'PersonalityTraits'
    ) as any;

    if (!traits) return null;

    const parsed: CompleteAgentData['personality'] = {
      creativity: Number(traits.creativity !== undefined ? traits.creativity : traits[0]),
      analytical: Number(traits.analytical !== undefined ? traits.analytical : traits[1]),
      empathy: Number(traits.empathy !== undefined ? traits.empathy : traits[2]),
      intuition: Number(traits.intuition !== undefined ? traits.intuition : traits[3]),
      resilience: Number(traits.resilience !== undefined ? traits.resilience : traits[4]),
      curiosity: Number(traits.curiosity !== undefined ? traits.curiosity : traits[5]),
      dominantMood: (traits.dominantMood !== undefined ? traits.dominantMood : traits[6]) as string,
      lastDreamDate: traits.lastDreamDate !== undefined ? BigInt(traits.lastDreamDate) : undefined
    };

    this.setCached(cacheKey, parsed);
    return parsed;
  }

  /**
   * Get memory structure
   */
  async getMemoryData(tokenId: number): Promise<CompleteAgentData['memory'] | null> {
    const cacheKey = `memory_${tokenId}`;
    const cached = this.getCached<CompleteAgentData['memory']>(cacheKey);
    if (cached) return cached;

    log.debug('Fetching memory data', { tokenId });

    const memory = await this.fetchWithRetry(
      () => this.publicClient.readContract({
        address: this.contractConfig.address,
        abi: this.contractConfig.abi,
        functionName: ContractFunctions.GET_AGENT_MEMORY,
        args: [BigInt(tokenId)]
      }),
      3,
      'MemoryData'
    ) as any;

    if (!memory) return null;

    const parsed: CompleteAgentData['memory'] = {
      memoryCoreHash: memory.memoryCoreHash as string,
      currentDreamDailyHash: memory.currentDreamDailyHash as string,
      currentConvDailyHash: memory.currentConvDailyHash as string,
      lastDreamMonthlyHash: memory.lastDreamMonthlyHash as string,
      lastConvMonthlyHash: memory.lastConvMonthlyHash as string,
      lastConsolidation: BigInt(memory.lastConsolidation || 0),
      currentMonth: Number(memory.currentMonth || 0),
      currentYear: Number(memory.currentYear || 0)
    };

    this.setCached(cacheKey, parsed);
    return parsed;
  }

  /**
   * Get unique features
   */
  async getUniqueFeatures(tokenId: number): Promise<CompleteAgentData['features'] | null> {
    const cacheKey = `features_${tokenId}`;
    const cached = this.getCached<CompleteAgentData['features']>(cacheKey);
    if (cached) return cached;

    log.debug('Fetching unique features', { tokenId });

    try {
      const features = await this.fetchWithRetry(
        () => this.publicClient.readContract({
          address: this.contractConfig.address,
          abi: this.contractConfig.abi,
          functionName: ContractFunctions.GET_UNIQUE_FEATURES,
          args: [BigInt(tokenId)]
        }),
        3,
        'UniqueFeatures'
      ) as any;

      if (!features || !Array.isArray(features)) return [];

      const parsed: CompleteAgentData['features'] = features.map((f: any) => ({
        name: f.name || 'Unknown Feature',
        description: f.description || '',
        intensity: Number(f.intensity || 0)
      }));

      this.setCached(cacheKey, parsed);
      return parsed;
    } catch (error) {
      log.debug('Error fetching unique features', { error: String(error) });
      return [];
    }
  }

  /**
   * Get status data
   */
  async getStatusData(tokenId: number): Promise<CompleteAgentData['status'] | null> {
    const cacheKey = `status_${tokenId}`;
    const cached = this.getCached<CompleteAgentData['status']>(cacheKey);
    if (cached) return cached;

    log.debug('Fetching status data', { tokenId });

    try {
      // Fetch canProcessDreamToday
      const canProcess = await this.fetchWithRetry(
        () => this.publicClient.readContract({
          address: this.contractConfig.address,
          abi: this.contractConfig.abi,
          functionName: ContractFunctions.CAN_PROCESS_DREAM_TODAY,
          args: [BigInt(tokenId)]
        }),
        3,
        'CanProcessDreamToday'
      ) as boolean;

      // Try to fetch memory access if available
      let memoryAccess: any;
      try {
        memoryAccess = await this.fetchWithRetry(
          () => this.publicClient.readContract({
            address: this.contractConfig.address,
            abi: this.contractConfig.abi,
            functionName: ContractFunctions.GET_MEMORY_ACCESS,
            args: [BigInt(tokenId)]
          }),
          2,
          'MemoryAccess'
        );
      } catch {
        // Function might not exist in contract
        log.debug('Memory access function not available');
      }

      const parsed: CompleteAgentData['status'] = {
        canProcessDreamToday: canProcess || false,
        memoryAccessMonths: memoryAccess ? Number(memoryAccess.monthsAccessible || memoryAccess[0] || 1) : 1,
        memoryAccessDepth: memoryAccess ? (memoryAccess.memoryDepth || memoryAccess[1] || 'current month') : 'current month'
      };

      this.setCached(cacheKey, parsed);
      return parsed;
    } catch (error) {
      log.debug('Error fetching status data', { error: String(error) });
      return this.getDefaultStatus();
    }
  }

  /**
   * Get consolidation reward preview
   */
  async getConsolidationReward(tokenId: number): Promise<CompleteAgentData['consolidationReward'] | null> {
    const cacheKey = `consolidation_reward_${tokenId}`;
    const cached = this.getCached<CompleteAgentData['consolidationReward']>(cacheKey);
    if (cached) return cached;

    log.debug('Fetching consolidation reward', { tokenId });

    try {
      const reward = await this.fetchWithRetry(
        () => this.publicClient.readContract({
          address: this.contractConfig.address,
          abi: this.contractConfig.abi,
          functionName: ContractFunctions.GET_CONSOLIDATION_REWARD,
          args: [BigInt(tokenId)]
        }),
        2,
        'ConsolidationReward'
      ) as any;

      if (!reward) return null;

      const parsed: CompleteAgentData['consolidationReward'] = {
        baseReward: Number(reward.baseReward || reward[0] || 0),
        streakBonus: Number(reward.streakBonus || reward[1] || 0),
        earlyBirdBonus: Number(reward.earlyBirdBonus || reward[2] || 0),
        totalReward: Number(reward.totalReward || reward[3] || 0)
      };

      this.setCached(cacheKey, parsed);
      return parsed;
    } catch (error) {
      log.debug('Error fetching consolidation reward', { error: String(error) });
      return null;
    }
  }

  /**
   * Get evolution statistics
   */
  async getEvolutionStats(tokenId: number): Promise<CompleteAgentData['evolutionStats'] | null> {
    const cacheKey = `evolution_stats_${tokenId}`;
    const cached = this.getCached<CompleteAgentData['evolutionStats']>(cacheKey);
    if (cached) return cached;

    log.debug('Fetching evolution stats', { tokenId });

    try {
      const stats = await this.fetchWithRetry(
        () => this.publicClient.readContract({
          address: this.contractConfig.address,
          abi: this.contractConfig.abi,
          functionName: ContractFunctions.GET_EVOLUTION_STATS,
          args: [BigInt(tokenId)]
        }),
        2,
        'EvolutionStats'
      ) as any;

      if (!stats) return null;

      const parsed: CompleteAgentData['evolutionStats'] = {
        totalEvolutions: Number(stats.totalEvolutions || stats[0] || 0),
        evolutionRate: Number(stats.evolutionRate || stats[1] || 0),
        lastEvolution: BigInt(stats.lastEvolution || stats[2] || 0)
      };

      this.setCached(cacheKey, parsed);
      return parsed;
    } catch (error) {
      log.debug('Error fetching evolution stats', { error: String(error) });
      return null;
    }
  }

  /**
   * Get consolidation streak from mapping
   */
  async getConsolidationStreak(tokenId: number): Promise<number> {
    const cacheKey = `consolidation_streak_${tokenId}`;
    const cached = this.getCached<number>(cacheKey);
    if (cached !== null) return cached;

    log.debug('Fetching consolidation streak', { tokenId });

    try {
      const streak = await this.fetchWithRetry(
        () => this.publicClient.readContract({
          address: this.contractConfig.address,
          abi: this.contractConfig.abi,
          functionName: ContractFunctions.CONSOLIDATION_STREAK,
          args: [BigInt(tokenId)]
        }),
        2,
        'ConsolidationStreak'
      ) as any;

      const parsed = Number(streak || 0);
      this.setCached(cacheKey, parsed);
      return parsed;
    } catch (error) {
      log.debug('Error fetching consolidation streak', { error: String(error) });
      return 0;
    }
  }

  /**
   * Get cached response style from contract mapping
   */
  async getCachedResponseStyle(tokenId: number): Promise<string | null> {
    const cacheKey = `response_style_${tokenId}`;
    const cached = this.getCached<string>(cacheKey);
    if (cached) return cached;

    log.debug('Fetching cached response style', { tokenId });

    try {
      const style = await this.fetchWithRetry(
        () => this.publicClient.readContract({
          address: this.contractConfig.address,
          abi: this.contractConfig.abi,
          functionName: ContractFunctions.RESPONSE_STYLES,
          args: [BigInt(tokenId)]
        }),
        2,
        'ResponseStyle'
      ) as string;

      if (!style || style === '') return null;

      this.setCached(cacheKey, style);
      return style;
    } catch (error) {
      log.debug('Error fetching response style', { error: String(error) });
      return null;
    }
  }

  /**
   * Get pending rewards from mapping
   */
  async getPendingRewards(tokenId: number): Promise<CompleteAgentData['pendingRewards'] | null> {
    const cacheKey = `pending_rewards_${tokenId}`;
    const cached = this.getCached<CompleteAgentData['pendingRewards']>(cacheKey);
    if (cached) return cached;

    log.debug('Fetching pending rewards', { tokenId });

    try {
      const rewards = await this.fetchWithRetry(
        () => this.publicClient.readContract({
          address: this.contractConfig.address,
          abi: this.contractConfig.abi,
          functionName: ContractFunctions.PENDING_REWARDS,
          args: [BigInt(tokenId)]
        }),
        2,
        'PendingRewards'
      ) as any;

      if (!rewards) return null;

      const parsed: CompleteAgentData['pendingRewards'] = {
        intelligenceBonus: Number(rewards.intelligenceBonus || rewards[0] || 0),
        specialMilestone: (rewards.specialMilestone || rewards[1] || '') as string,
        yearlyReflection: Boolean(rewards.yearlyReflection || rewards[2] || false)
      };

      this.setCached(cacheKey, parsed);
      return parsed;
    } catch (error) {
      log.debug('Error fetching pending rewards', { error: String(error) });
      return null;
    }
  }

  /**
   * Compute derived fields from raw data
   */
  private computeDerivedFields(
    basic: CompleteAgentData['basic'],
    personality: CompleteAgentData['personality'] | null,
    memory: CompleteAgentData['memory'] | null
  ): CompleteAgentData['computed'] {
    // Compute response style based on personality
    const responseStyle = this.computeResponseStyle(personality);
    
    // Compute memory depth description based on intelligence
    const memoryDepthDescription = this.computeMemoryDepth(basic.intelligenceLevel);
    
    // Calculate days since last dream
    const daysSinceLastDream = personality?.lastDreamDate
      ? Math.floor((Date.now() - Number(personality.lastDreamDate) * 1000) / (1000 * 60 * 60 * 24))
      : undefined;
    
    // Calculate if ready for evolution (every 5 dreams)
    const isEvolutionReady = (basic.dreamCount + 1) % 5 === 0;
    const nextEvolutionAt = Math.ceil((basic.dreamCount + 1) / 5) * 5;
    
    // Calculate days until next consolidation (monthly)
    const daysUntilNextConsolidation = memory?.lastConsolidation
      ? 30 - Math.floor((Date.now() - Number(memory.lastConsolidation) * 1000) / (1000 * 60 * 60 * 24))
      : 30;

    return {
      responseStyle,
      memoryDepthDescription,
      daysSinceLastDream,
      isEvolutionReady,
      nextEvolutionAt,
      daysUntilNextConsolidation: daysUntilNextConsolidation > 0 ? daysUntilNextConsolidation : 0
    };
  }

  /**
   * Compute response style from personality traits
   */
  private computeResponseStyle(personality: CompleteAgentData['personality'] | null): string {
    if (!personality) return 'balanced thinker';

    const traits = [
      { name: 'creative dreamer', value: personality.creativity },
      { name: 'analytical mind', value: personality.analytical },
      { name: 'empathetic soul', value: personality.empathy },
      { name: 'intuitive sage', value: personality.intuition },
      { name: 'resilient warrior', value: personality.resilience },
      { name: 'curious explorer', value: personality.curiosity }
    ];

    // Find dominant trait
    const dominant = traits.reduce((max, trait) => 
      trait.value > max.value ? trait : max, traits[0]);

    // Add mood modifier
    const moodModifier = personality.dominantMood === 'optimistic' ? 'hopeful ' :
                        personality.dominantMood === 'melancholic' ? 'thoughtful ' :
                        personality.dominantMood === 'energetic' ? 'vibrant ' :
                        '';

    return `${moodModifier}${dominant.name}`;
  }

  /**
   * Compute memory depth description from intelligence level
   */
  private computeMemoryDepth(intelligenceLevel: number): string {
    if (intelligenceLevel >= 80) return 'full yearly core + 12 months';
    if (intelligenceLevel >= 60) return 'last 6 months + partial core';
    if (intelligenceLevel >= 40) return 'last 3 months';
    if (intelligenceLevel >= 20) return 'last month only';
    return 'current experiences only';
  }

  /**
   * Default values for missing data
   */
  private getDefaultPersonality(): CompleteAgentData['personality'] {
    return {
      creativity: 50,
      analytical: 50,
      empathy: 50,
      intuition: 50,
      resilience: 50,
      curiosity: 50,
      dominantMood: 'neutral'
    };
  }

  private getDefaultMemory(): CompleteAgentData['memory'] {
    const emptyHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
    return {
      memoryCoreHash: emptyHash,
      currentDreamDailyHash: emptyHash,
      currentConvDailyHash: emptyHash,
      lastDreamMonthlyHash: emptyHash,
      lastConvMonthlyHash: emptyHash,
      lastConsolidation: BigInt(0),
      currentMonth: new Date().getMonth() + 1,
      currentYear: new Date().getFullYear()
    };
  }

  private getDefaultStatus(): CompleteAgentData['status'] {
    return {
      canProcessDreamToday: true,
      consolidationStreak: 0,
      hasPendingRewards: false,
      memoryAccessMonths: 1,
      memoryAccessDepth: 'current month only'
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    log.debug('Cache cleared');
  }

  /**
   * Set cache TTL
   */
  setCacheTTL(ttl: number): void {
    this.cacheTTL = ttl;
    log.debug('Cache TTL updated', { ttl });
  }
}

// Export singleton instance for convenience
export const contractReader = new ContractReaderService();