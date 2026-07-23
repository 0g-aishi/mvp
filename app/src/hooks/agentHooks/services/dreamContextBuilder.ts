'use client';

import { getContractConfig } from '../config/contractConfig';
import type { PublicClient } from 'viem';

export interface DreamContext {
  userDream: string;
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
  };
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

export class DreamContextBuilder {
  private contract: PublicClient | any;
  private debugLog: (message: string, data?: any) => void;

  constructor(contract: PublicClient | any, debugLog: (message: string, data?: any) => void) {
    this.contract = contract;
    this.debugLog = debugLog;
  }

  /**
   * Builds complete dream analysis context
   */
  async buildContext(
    tokenId: number,
    userDream: string,
    downloadFile: (hash: string) => Promise<{ success: boolean; data?: ArrayBuffer; error?: string }>,
    agentData?: any // Optional pre-loaded agent data from useAgentRead
  ): Promise<DreamContext> {
    this.debugLog('Building dream context', { tokenId, dreamLength: userDream.length, hasPreloadedData: !!agentData });

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
          responseStyle: 'balanced',
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

      // DETAILED CONTRACT DATA LOGGING
      this.debugLog('Contract data FULL details', {
        agentDataFull: contractData.agentData,
        personalityTraitsFull: contractData.personalityTraits,
        memoryAccessFull: contractData.memoryAccess,
        uniqueFeaturesFull: contractData.uniqueFeatures,
        responseStyle: contractData.responseStyle,
        memoryStructureFull: contractData.memoryStructure
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
        { dailyDreams: [], monthlyConsolidations: [], yearlyCore: null };

      // 4. Build unified context
      const context: DreamContext = {
        userDream,
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
          dominantMood: contractData.personalityTraits.dominantMood || 'neutral',
          responseStyle: contractData.responseStyle || 'balanced'
        },
        uniqueFeatures: (contractData.uniqueFeatures || []).map((feature: any) => ({
          name: feature.name,
          description: feature.description,
          intensity: Number(feature.intensity),
          addedAt: Number(feature.addedAt)
        })),
        memoryAccess: {
          monthsAccessible,
          memoryDepth: contractData.memoryAccess.memoryDepth
        },
        historicalData
      };

      this.debugLog('Dream context built successfully', {
        totalHistoricalItems: historicalData.dailyDreams.length + historicalData.monthlyConsolidations.length,
        hasYearlyCore: !!historicalData.yearlyCore
      });

      // DETAILED FINAL CONTEXT LOGGING
      this.debugLog('Final DreamContext FULL details', {
        userDream: context.userDream.substring(0, 100) + '...',
        agentProfile: context.agentProfile,
        personality: context.personality,
        uniqueFeatures: context.uniqueFeatures,
        memoryAccess: context.memoryAccess,
        historicalDataSummary: {
          dailyDreamsCount: context.historicalData.dailyDreams.length,
          monthlyConsolidationsCount: context.historicalData.monthlyConsolidations.length,
          hasYearlyCore: !!context.historicalData.yearlyCore,
          dailyDreamsPreview: context.historicalData.dailyDreams.slice(0, 2).map(dream => ({
            id: dream.id,
            date: dream.date || (dream.timestamp ? new Date(dream.timestamp * 1000).toLocaleDateString() : 'unknown'),
            emotions: dream.emotions,
            symbols: dream.symbols,
            themes: dream.themes,
            intensity: dream.intensity,
            lucidity: dream.lucidity || dream.lucidity_level, // backward compatibility
            archetypes: dream.archetypes,
            dream_type: dream.dream_type,
            sleep_quality: dream.sleep_quality,
            recall_clarity: dream.recall_clarity,
            ai_analysis: dream.ai_analysis?.substring(0, 50) + '...' || dream.analysis?.substring(0, 50) + '...'
          }))
        }
      });

      return context;

    } catch (error) {
      this.debugLog('Error building dream context', error);
      throw new Error(`Failed to build dream context: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Downloads historical data based on memory access level
   */
  private async downloadHistoricalData(
    memory: MemoryStructure,
    monthsAccessible: number,
    downloadFile: (hash: string) => Promise<{ success: boolean; data?: ArrayBuffer; error?: string }>
  ): Promise<{ dailyDreams: any[]; monthlyConsolidations: any[]; yearlyCore: any }> {
    this.debugLog('Downloading historical data', { monthsAccessible, memory });

    // Log all hashes from contract
    this.debugLog('Memory hashes from contract', {
      memoryCoreHash: memory.memoryCoreHash,
      currentDreamDailyHash: memory.currentDreamDailyHash,
      currentConvDailyHash: memory.currentConvDailyHash,
      lastDreamMonthlyHash: memory.lastDreamMonthlyHash,
      lastConvMonthlyHash: memory.lastConvMonthlyHash,
      lastConsolidation: memory.lastConsolidation,
      currentMonth: memory.currentMonth,
      currentYear: memory.currentYear
    });

    const result = {
      dailyDreams: [],
      monthlyConsolidations: [],
      yearlyCore: null
    };

    try {
      // 1. Download current daily dreams (current month)
      const emptyHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
      
      this.debugLog('Checking currentDreamDailyHash', {
        hash: memory.currentDreamDailyHash,
        isEmpty: memory.currentDreamDailyHash === emptyHash,
        isNull: !memory.currentDreamDailyHash
      });

      if (memory.currentDreamDailyHash && memory.currentDreamDailyHash !== emptyHash) {
        this.debugLog('Downloading daily dreams', memory.currentDreamDailyHash);
        const dailyResult = await downloadFile(memory.currentDreamDailyHash);
        this.debugLog('Daily dreams download result', {
          success: dailyResult.success,
          hasData: !!dailyResult.data,
          error: dailyResult.error
        });
        
        if (dailyResult.success && dailyResult.data) {
          const dailyData = this.parseJsonData(dailyResult.data);
          if (dailyData) {
            result.dailyDreams = Array.isArray(dailyData) ? dailyData : [];
            this.debugLog('Daily dreams loaded', { count: result.dailyDreams.length });
          }
        }
      } else {
        this.debugLog('Skipping daily dreams - hash is empty or null');
      }

      // 2. Download monthly consolidations based on access level OR deep memory active
      const isDeepMemoryActive = process.env.MEMORY_DEEP_ACTIVE === 'true';
      this.debugLog('Checking lastDreamMonthlyHash', {
        hash: memory.lastDreamMonthlyHash,
        isEmpty: memory.lastDreamMonthlyHash === emptyHash,
        monthsAccessible,
        hasAccess: monthsAccessible > 1,
        isDeepMemoryActive
      });

      if (memory.lastDreamMonthlyHash && memory.lastDreamMonthlyHash !== emptyHash && (monthsAccessible > 1 || isDeepMemoryActive)) {
        this.debugLog('Downloading monthly consolidations', memory.lastDreamMonthlyHash);
        const monthlyResult = await downloadFile(memory.lastDreamMonthlyHash);
        this.debugLog('Monthly consolidations download result', {
          success: monthlyResult.success,
          hasData: !!monthlyResult.data,
          error: monthlyResult.error
        });
        
        if (monthlyResult.success && monthlyResult.data) {
          const monthlyData = this.parseJsonData(monthlyResult.data);
          if (monthlyData && Array.isArray(monthlyData)) {
            // WSZYSTKIE dane - bez filtrowania (UNIFIED SCHEMA sorting)
            result.monthlyConsolidations = monthlyData
              .sort((a, b) => {
                // Sort by year and month (newest first) - UNIFIED SCHEMA compatible
                const aTime = (a.year || 2024) * 12 + (a.month || 1);
                const bTime = (b.year || 2024) * 12 + (b.month || 1);
                return bTime - aTime;
              });
            this.debugLog('Monthly consolidations loaded', { count: result.monthlyConsolidations.length });
          }
        }
      } else {
        this.debugLog('Skipping monthly consolidations', {
          reason: !memory.lastDreamMonthlyHash ? 'no hash' :
                  memory.lastDreamMonthlyHash === emptyHash ? 'empty hash' :
                  (!isDeepMemoryActive && monthsAccessible <= 1) ? 'insufficient access level' : 'unknown'
        });
      }

      // 3. Download yearly core (memory core) if accessible OR deep memory active
      this.debugLog('Checking memoryCoreHash', {
        hash: memory.memoryCoreHash,
        isEmpty: memory.memoryCoreHash === emptyHash,
        monthsAccessible,
        hasAccess: monthsAccessible >= 12,
        isDeepMemoryActive
      });

      if (memory.memoryCoreHash && memory.memoryCoreHash !== emptyHash && (monthsAccessible >= 12 || isDeepMemoryActive)) {
        this.debugLog('Downloading yearly core', memory.memoryCoreHash);
        const coreResult = await downloadFile(memory.memoryCoreHash);
        this.debugLog('Yearly core download result', {
          success: coreResult.success,
          hasData: !!coreResult.data,
          error: coreResult.error
        });
        
        if (coreResult.success && coreResult.data) {
          const coreData = this.parseJsonData(coreResult.data);
          if (coreData) {
            result.yearlyCore = coreData;
            this.debugLog('Yearly core loaded');
          }
        }
      } else {
        this.debugLog('Skipping yearly core', {
          reason: !memory.memoryCoreHash ? 'no hash' :
                  memory.memoryCoreHash === emptyHash ? 'empty hash' :
                  (!isDeepMemoryActive && monthsAccessible < 12) ? 'insufficient access level' : 'unknown'
        });
      }

    } catch (error) {
      this.debugLog('Error downloading historical data', error);
      // Continue with partial data rather than failing completely
    }

    this.debugLog('Historical data download completed', {
      dailyDreams: result.dailyDreams.length,
      monthlyConsolidations: result.monthlyConsolidations.length,
      hasYearlyCore: !!result.yearlyCore
    });

    return result;
  }

  /**
   * Parses JSON data from ArrayBuffer
   */
  private parseJsonData(arrayBuffer: ArrayBuffer): any {
    try {
      const decoder = new TextDecoder('utf-8');
      const jsonString = decoder.decode(arrayBuffer);
      return JSON.parse(jsonString);
    } catch (error) {
      this.debugLog('Error parsing JSON data', error);
      return null;
    }
  }

  /**
   * Filters data by newest ID based on append-only pattern
   */
  private filterByNewestIds(data: any[], maxCount: number): any[] {
    if (!Array.isArray(data) || data.length === 0) return [];
    
    // Sort by ID descending (newest first) and take maxCount
    return data
      .filter(item => item.id !== undefined)
      .sort((a, b) => b.id - a.id)
      .slice(0, maxCount);
  }
} 