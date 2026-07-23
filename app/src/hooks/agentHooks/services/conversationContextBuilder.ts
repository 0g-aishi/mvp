'use client';

import { getContractConfig } from '../config/contractConfig';
import type { PublicClient } from 'viem';

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: number;
  metadata?: {
    conversationType: string;
    emotionalTone: string;
    uniqueFeatures: string[];
  };
}

export interface ConversationContext {
  sessionId: string;
  agentProfile: {
    name: string;
    intelligenceLevel: number;
    dreamCount: number;
    conversationCount: number;
  };
  personality: {
    creativity: number;
    analytical: number;
    empathy: number;
    intuition: number;
    resilience: number;
    curiosity: number;
    dominantMood: string;
    responseStyle: string;
  };
  uniqueFeatures: Array<{
    name: string;
    description: string;
    intensity: number;
    addedAt: number;
  }>;
  memoryAccess: {
    monthsAccessible: number;
    memoryDepth: string;
  };
  historicalData: {
    dailyDreams: any[];
    monthlyConsolidations: any[];
    yearlyCore: any;
    recentConversations: any[];
    monthlyConversations: any[];
  };
  conversationHistory: ChatMessage[];
}

export interface MemoryStructure {
  memoryCoreHash: string;
  currentDreamDailyHash: string;
  currentConvDailyHash: string;
  lastDreamMonthlyHash: string;
  lastConvMonthlyHash: string;
  lastConsolidation: number;
  currentMonth: number;
  currentYear: number;
}

export class ConversationContextBuilder {
  private contract: PublicClient | any;
  private debugLog: (message: string, data?: any) => void;

  constructor(contract: PublicClient | any, debugLog: (message: string, data?: any) => void) {
    this.contract = contract;
    this.debugLog = debugLog;
  }

  /**
   * Builds complete conversation context for agent chat
   */
  async buildContext(
    tokenId: number,
    sessionId: string,
    conversationHistory: ChatMessage[],
    downloadFile: (hash: string) => Promise<{ success: boolean; data?: ArrayBuffer; error?: string }>,
    agentData?: any // Optional pre-loaded agent data from useAgentRead
  ): Promise<ConversationContext> {
    this.debugLog('Building conversation context', { 
      tokenId, 
      sessionId,
      conversationHistoryLength: conversationHistory.length,
      hasPreloadedData: !!agentData 
    });

    try {
      let contractData;
      
      if (agentData) {
        // Use pre-loaded data from useAgentRead (Wagmi v2 compatible)
        this.debugLog('Using pre-loaded agent data from useAgentRead');
        contractData = {
          agentData: {
            agentName: agentData.agentName,
            intelligenceLevel: Number(agentData.intelligenceLevel),
            dreamCount: Number(agentData.dreamCount),
            conversationCount: Number(agentData.conversationCount)
          },
          personalityTraits: agentData.personality,
          memoryAccess: {
            monthsAccessible: agentData.memory?.monthsAccessible || 1,
            memoryDepth: agentData.memory?.memoryDepth || 'current month only'
          },
          uniqueFeatures: agentData.personality?.uniqueFeatures || [],
          responseStyle: agentData.responseStyle || 'balanced',
          memoryStructure: agentData.memory ? {
            memoryCoreHash: agentData.memory.memoryCoreHash,
            currentDreamDailyHash: agentData.memory.currentDreamDailyHash,
            currentConvDailyHash: agentData.memory.currentConvDailyHash,
            lastDreamMonthlyHash: agentData.memory.lastDreamMonthlyHash,
            lastConvMonthlyHash: agentData.memory.lastConvMonthlyHash,
            lastConsolidation: Number(agentData.memory.lastConsolidation),
            currentMonth: agentData.memory.currentMonth,
            currentYear: agentData.memory.currentYear
          } : null
        };
      } else {
        // Fallback to contract calls for backward compatibility
        this.debugLog('No pre-loaded data, fetching from contract');
        const [agentContractData, personalityTraits, memoryAccess, uniqueFeatures, responseStyle, memoryStructure] = 
          await Promise.all([
            this.contract.agents(tokenId),
            this.contract.getPersonalityTraits(tokenId),
            this.contract.getMemoryAccess(tokenId),
            this.contract.getUniqueFeatures(tokenId),
            this.contract.responseStyles(tokenId),
            this.contract.getAgentMemory(tokenId)
          ]);

        contractData = {
          agentData: {
            agentName: agentContractData.agentName,
            intelligenceLevel: Number(agentContractData.intelligenceLevel),
            dreamCount: Number(agentContractData.dreamCount),
            conversationCount: Number(agentContractData.conversationCount)
          },
          personalityTraits,
          memoryAccess,
          uniqueFeatures,
          responseStyle,
          memoryStructure
        };
      }

      this.debugLog('Contract data prepared', {
        agentName: contractData.agentData.agentName,
        intelligenceLevel: contractData.agentData.intelligenceLevel,
        monthsAccessible: contractData.memoryAccess.monthsAccessible,
        hasMemoryStructure: !!contractData.memoryStructure
      });

      // 2. Determine memory depth based on intelligence level
      const intelligence = contractData.agentData.intelligenceLevel;
      const monthsAccessible = contractData.memoryAccess.monthsAccessible;
      
      // 3. Download historical data based on memory access
      const historicalData = contractData.memoryStructure ? 
        await this.downloadHistoricalData(
          contractData.memoryStructure,
          monthsAccessible,
          downloadFile
        ) : 
        { 
          dailyDreams: [], 
          monthlyConsolidations: [], 
          yearlyCore: null,
          recentConversations: [],
          monthlyConversations: []
        };

      // 4. Build unified context
      const context: ConversationContext = {
        sessionId,
        agentProfile: {
          name: contractData.agentData.agentName,
          intelligenceLevel: intelligence,
          dreamCount: contractData.agentData.dreamCount,
          conversationCount: contractData.agentData.conversationCount
        },
        personality: {
          creativity: Number(contractData.personalityTraits.creativity || 50),
          analytical: Number(contractData.personalityTraits.analytical || 50),
          empathy: Number(contractData.personalityTraits.empathy || 50),
          intuition: Number(contractData.personalityTraits.intuition || 50),
          resilience: Number(contractData.personalityTraits.resilience || 50),
          curiosity: Number(contractData.personalityTraits.curiosity || 50),
          dominantMood: contractData.personalityTraits.dominantMood || 'balanced',
          responseStyle: contractData.responseStyle || 'balanced'
        },
        uniqueFeatures: contractData.uniqueFeatures.map((feature: any) => ({
          name: feature.name,
          description: feature.description,
          intensity: Number(feature.intensity),
          addedAt: Number(feature.addedAt)
        })),
        memoryAccess: {
          monthsAccessible: monthsAccessible,
          memoryDepth: contractData.memoryAccess.memoryDepth
        },
        historicalData,
        conversationHistory
      };

      this.debugLog('Conversation context built successfully', {
        agentName: context.agentProfile.name,
        intelligenceLevel: context.agentProfile.intelligenceLevel,
        memoryDepth: context.memoryAccess.memoryDepth,
        uniqueFeatures: context.uniqueFeatures.length,
        conversationHistoryLength: context.conversationHistory.length,
        historicalItems: context.historicalData.dailyDreams.length + 
                        context.historicalData.recentConversations.length + 
                        context.historicalData.monthlyConversations.length
      });

      return context;

    } catch (error) {
      this.debugLog('Error building conversation context', { error: error.message });
      throw error;
    }
  }

  /**
   * Downloads historical data including dreams AND conversations
   */
  private async downloadHistoricalData(
    memory: MemoryStructure,
    monthsAccessible: number,
    downloadFile: (hash: string) => Promise<{ success: boolean; data?: ArrayBuffer; error?: string }>
  ): Promise<{ 
    dailyDreams: any[]; 
    monthlyConsolidations: any[]; 
    yearlyCore: any;
    recentConversations: any[];
    monthlyConversations: any[];
  }> {
    const emptyHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
    
    this.debugLog('Downloading historical data', {
      memoryCoreHash: memory.memoryCoreHash,
      currentDreamDailyHash: memory.currentDreamDailyHash,
      currentConvDailyHash: memory.currentConvDailyHash,
      lastDreamMonthlyHash: memory.lastDreamMonthlyHash,
      lastConvMonthlyHash: memory.lastConvMonthlyHash,
      monthsAccessible,
      // WAGMI V2 DEBUG: Check hash formats
      hashLengths: {
        memoryCoreHash: memory.memoryCoreHash?.length,
        dreamDaily: memory.currentDreamDailyHash?.length,
        convDaily: memory.currentConvDailyHash?.length,
        dreamMonthly: memory.lastDreamMonthlyHash?.length,
        convMonthly: memory.lastConvMonthlyHash?.length
      },
      emptyHashCheck: {
        memoryCoreEmpty: memory.memoryCoreHash === '0x0000000000000000000000000000000000000000000000000000000000000000',
        dreamDailyEmpty: memory.currentDreamDailyHash === '0x0000000000000000000000000000000000000000000000000000000000000000',
        dreamMonthlyEmpty: memory.lastDreamMonthlyHash === '0x0000000000000000000000000000000000000000000000000000000000000000',
        convMonthlyEmpty: memory.lastConvMonthlyHash === '0x0000000000000000000000000000000000000000000000000000000000000000'
      }
    });

    const result = {
      dailyDreams: [],
      monthlyConsolidations: [],
      yearlyCore: null,
      recentConversations: [],
      monthlyConversations: []
    };

    try {
      // 1. Download daily dreams (always if available)
      if (memory.currentDreamDailyHash && memory.currentDreamDailyHash !== emptyHash) {
        this.debugLog('Downloading daily dreams', { hash: memory.currentDreamDailyHash });
        const dailyResult = await downloadFile(memory.currentDreamDailyHash);
        if (dailyResult.success && dailyResult.data) {
          const dailyDreams = this.parseJsonData(dailyResult.data);
          result.dailyDreams = Array.isArray(dailyDreams) ? dailyDreams : [];
          this.debugLog('Daily dreams loaded', { count: result.dailyDreams.length });
        }
      }

      // 2. Download recent conversations (always if available)
      if (memory.currentConvDailyHash && memory.currentConvDailyHash !== emptyHash) {
        this.debugLog('Downloading recent conversations', { hash: memory.currentConvDailyHash });
        const convResult = await downloadFile(memory.currentConvDailyHash);
        if (convResult.success && convResult.data) {
          const recentConversations = this.parseJsonData(convResult.data);
          result.recentConversations = Array.isArray(recentConversations) ? recentConversations : [];
          this.debugLog('Recent conversations loaded', { count: result.recentConversations.length });
        }
      }

      // 3. Download monthly dream consolidations (if months access > 1 OR deep memory active)
      const isDeepMemoryActive = process.env.MEMORY_DEEP_ACTIVE === 'true';
      if (memory.lastDreamMonthlyHash && memory.lastDreamMonthlyHash !== emptyHash && (monthsAccessible > 1 || isDeepMemoryActive)) {
        this.debugLog('Downloading monthly dream consolidations', { hash: memory.lastDreamMonthlyHash });
        const monthlyResult = await downloadFile(memory.lastDreamMonthlyHash);
        if (monthlyResult.success && monthlyResult.data) {
          const monthlyData = this.parseJsonData(monthlyResult.data);
          this.debugLog('Monthly dream consolidations parsed', { 
            isArray: Array.isArray(monthlyData),
            dataType: typeof monthlyData,
            dataLength: monthlyData?.length,
            firstItem: monthlyData?.[0] ? {
              month: monthlyData[0].month,
              year: monthlyData[0].year,
              period: monthlyData[0].period,
              total_dreams: monthlyData[0].total_dreams,
              hasDominant: !!monthlyData[0].dominant,
              dominantKeys: monthlyData[0].dominant ? Object.keys(monthlyData[0].dominant) : [],
              hasEssence: !!monthlyData[0].monthly_essence
            } : null
          });
          
          if (Array.isArray(monthlyData)) {
            result.monthlyConsolidations = monthlyData; // WSZYSTKIE dane - bez filtrowania
            this.debugLog('Monthly dream consolidations loaded', { count: result.monthlyConsolidations.length });
          }
        }
      }

      // 4. Download monthly conversation consolidations (if months access > 1 OR deep memory active)
      if (memory.lastConvMonthlyHash && memory.lastConvMonthlyHash !== emptyHash && (monthsAccessible > 1 || isDeepMemoryActive)) {
        this.debugLog('Downloading monthly conversation consolidations', { hash: memory.lastConvMonthlyHash });
        const monthlyConvResult = await downloadFile(memory.lastConvMonthlyHash);
        if (monthlyConvResult.success && monthlyConvResult.data) {
          const monthlyConvData = this.parseJsonData(monthlyConvResult.data);
          if (Array.isArray(monthlyConvData)) {
            result.monthlyConversations = monthlyConvData; // WSZYSTKIE dane - bez filtrowania
            this.debugLog('Monthly conversation consolidations loaded', { count: result.monthlyConversations.length });
          }
        }
      }

      // 5. Download yearly core (if months access >= 12 OR deep memory active)
      if (memory.memoryCoreHash && memory.memoryCoreHash !== emptyHash && (monthsAccessible >= 12 || isDeepMemoryActive)) {
        this.debugLog('Downloading yearly core', { hash: memory.memoryCoreHash });
        const coreResult = await downloadFile(memory.memoryCoreHash);
        if (coreResult.success && coreResult.data) {
          result.yearlyCore = this.parseJsonData(coreResult.data);
          this.debugLog('Yearly core parsed', { 
            hasData: !!result.yearlyCore,
            isArray: Array.isArray(result.yearlyCore),
            dataType: typeof result.yearlyCore,
            dataLength: result.yearlyCore?.length,
            firstItem: Array.isArray(result.yearlyCore) && result.yearlyCore[0] ? {
              year: result.yearlyCore[0].year,
              agent_id: result.yearlyCore[0].agent_id,
              hasYearlyOverview: !!result.yearlyCore[0].yearly_overview,
              hasMajorPatterns: !!result.yearlyCore[0].major_patterns,
              hasMilestones: !!result.yearlyCore[0].milestones,
              hasWisdom: !!result.yearlyCore[0].wisdom_crystallization,
              hasEssence: !!result.yearlyCore[0].yearly_essence,
              hasFinalMetrics: !!result.yearlyCore[0].final_metrics
            } : (result.yearlyCore ? {
              year: result.yearlyCore.year,
              agent_id: result.yearlyCore.agent_id,
              hasYearlyOverview: !!result.yearlyCore.yearly_overview,
              hasMajorPatterns: !!result.yearlyCore.major_patterns
            } : null)
          });
          this.debugLog('Yearly core loaded', { hasData: !!result.yearlyCore });
        }
      }

      this.debugLog('Historical data download completed', {
        dailyDreams: result.dailyDreams.length,
        recentConversations: result.recentConversations.length,
        monthlyConsolidations: result.monthlyConsolidations.length,
        monthlyConversations: result.monthlyConversations.length,
        hasYearlyCore: !!result.yearlyCore
      });

      return result;

    } catch (error) {
      this.debugLog('Error downloading historical data', { error: error.message });
      // Return partial data on error
      return result;
    }
  }

  /**
   * Safely parses JSON data from ArrayBuffer
   */
  private parseJsonData(arrayBuffer: ArrayBuffer): any {
    try {
      const textDecoder = new TextDecoder('utf-8');
      const jsonString = textDecoder.decode(arrayBuffer);
      return JSON.parse(jsonString);
    } catch (error) {
      this.debugLog('Error parsing JSON data', { error: error.message });
      return null;
    }
  }

  /**
   * Filters array to newest items based on ID or timestamp
   */
  private filterByNewestIds(data: any[], maxCount: number): any[] {
    if (!Array.isArray(data)) return [];
    
    // Sort by id (descending) or timestamp (descending) and take maxCount
    const sorted = data.sort((a, b) => {
      if (a.id && b.id) return b.id - a.id;
      if (a.timestamp && b.timestamp) return b.timestamp - a.timestamp;
      return 0;
    });
    
    return sorted.slice(0, maxCount);
  }
} 