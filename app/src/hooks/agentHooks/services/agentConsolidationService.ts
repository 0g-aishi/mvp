'use client';

import { getViemProvider, getViemSigner } from '../../../lib/0g/fees';
import { uploadFileComplete } from '../../../lib/0g/uploader';
import { getContractConfig } from '../config/contractConfig';
import { getEthersSignerForZeroG } from '../../../lib/0g/adapter/viemAdapter';
import { getActiveChain } from '../../../config/chains';
import { getNetworkConfig } from '../../../lib/0g/network';
import type { PublicClient, WalletClient } from 'viem';
import { logger } from '@/lib/logger';

// Schemat JSON dla konsolidacji miesięcznej snów (UNIFIED)
export interface MonthlyDreamConsolidation {
  month: number;           // 1-12
  year: number;            // 2024+
  period: string;          // "December 2024"
  total_dreams: number;    // Liczba snów w miesiącu
  
  // Dominujące wzorce (grupowane)
  dominant: {
    emotions: string[];      // ["ciekawość", "lęk", "radość"]
    symbols: string[];       // ["woda", "światło", "drogi"]
    themes: string[];        // ["transformacja", "podróż", "relacje"]
    archetypes: string[];    // ["hero", "shadow", "anima"]
  };
  
  // Statystyki (grupowane)
  metrics: {
    avg_intensity: number;     // 6.8
    avg_lucidity: number;      // 3.2
    nightmare_ratio: number;   // 0.15
    breakthrough_dreams: number; // 3
  };
  
  // Trendy (grupowane)
  trends: {
    emotional: string;       // "stabilizing"
    lucidity: string;        // "increasing"
    complexity: string;      // "deepening"
  };
  
  // Ewolucja osobowości (nowa struktura)
  personality_evolution: {
    primary_growth: string;    // "intuition"
    secondary_growth: string;  // "empathy"
    total_shift: number;       // 12
    new_features: string[];    // ["dream_architect"]
  };
  
  // Kluczowe odkrycia
  key_discoveries: string[];   // ["Woda przestała być zagrożeniem", "Zwiększona kontrola w snach", "Integracja cienia"]
  
  // Esencja miesiąca
  monthly_essence: string;     // "Grudzień był miesiącem głębokiej transformacji..."
  
  // Powiązania snów (nowe)
  dream_connections: {
    recurring_chains: number[][];    // [[145, 151, 156]]
    theme_clusters: {
      [key: string]: number[];       // { "water": [142, 145, 151, 156], "transformation": [148, 156, 159] }
    };
  };
}

// Schemat JSON dla konsolidacji miesięcznej konwersacji (UNIFIED)
export interface MonthlyConversationConsolidation {
  month: number;           
  year: number;            
  period: string;          // "December 2024"
  total_conversations: number;
  
  // Dominujące wzorce (grupowane)
  dominant: {
    topics: string[];           // ["sny", "rozwój osobisty", "relacje"]
    types: string[];            // ["dream_discussion", "therapeutic", "general_chat"]
    emotional_tones: string[];  // ["reflective", "curious", "grateful"]
  };
  
  // Statystyki (grupowane)
  metrics: {
    avg_duration: number;       // 18.5
    avg_depth: number;          // 7.8
    breakthrough_ratio: number; // 0.12
    follow_up_ratio: number;    // 0.65
  };
  
  // Dynamika relacji
  relationship_evolution: {
    trust_level: number;        // 8.5
    co_creation: number;        // 7.2
    therapeutic_alliance: number; // 8.8
    communication_style: string; // "collaborative"
  };
  
  // Wzorce rozwoju (nowe)
  growth_patterns: {
    primary_focus: string;      // "self_discovery"
    integration_level: string;  // "deep"
    action_orientation: string; // "increasing"
  };
  
  // Kluczowe momenty
  breakthrough_moments: string[];  // ["Połączenie snów z życiem codziennym", "Przełom w rozumieniu relacji", "Decyzja o zmianie kariery"]
  
  // Esencja miesiąca
  monthly_essence: string;    // "Grudniowe rozmowy charakteryzowała głęboka refleksja..."
  
  // Korelacje ze snami (nowe)
  dream_correlations: {
    theme_alignment: number;     // 0.82
    emotional_sync: number;      // 0.75
    integration_success: number; // 0.88
  };
}

// Network-aware storage configuration
const NETWORK = getNetworkConfig('turbo');

// Logger instance
const log = logger.child({ component: 'ConsolidationService' });

/**
 * Tworzy prompt do LLM dla konsolidacji miesięcznej snów
 */
export const createDreamConsolidationPrompt = (
  dreams: any[],
  month: number,
  year: number,
  agentPersonality: any
): string => {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  
  const period = `${monthNames[month - 1]} ${year}`;
  
  return `You are an advanced AI dream analyst performing monthly consolidation of dreams. 
Your task is to analyze ALL dreams from ${period} and create a comprehensive monthly essence.

AGENT PERSONALITY CONTEXT:
- Creativity: ${agentPersonality.creativity}/100
- Analytical: ${agentPersonality.analytical}/100  
- Empathy: ${agentPersonality.empathy}/100
- Intuition: ${agentPersonality.intuition}/100
- Resilience: ${agentPersonality.resilience}/100
- Curiosity: ${agentPersonality.curiosity}/100
- Dominant Mood: ${agentPersonality.dominantMood}
- Response Style: ${agentPersonality.responseStyle}

DREAMS TO CONSOLIDATE (${dreams.length} dreams):
${dreams.map(dream => `
Dream #${dream.id} (${dream.date}):
- Emotions: ${dream.emotions?.join(', ') || 'none'}
- Symbols: ${dream.symbols?.join(', ') || 'none'}
- Themes: ${dream.themes?.join(', ') || 'none'}
- Intensity: ${dream.intensity}/10
- Lucidity: ${dream.lucidity || dream.lucidity_level}/5
- Archetypes: ${dream.archetypes?.join(', ') || 'none'}
- Dream Type: ${dream.dream_type || 'neutral'}
- Sleep Quality: ${dream.sleep_quality || 'unknown'}/10
- Recall Clarity: ${dream.recall_clarity || 'unknown'}/10
- AI Analysis: ${dream.ai_analysis || dream.analysis || 'No analysis'}
${dream.recurring_from?.length ? `- Recurring from Dreams: ${dream.recurring_from.join(', ')}` : ''}
`).join('\n')}

CONSOLIDATION TASK:
1. Analyze ALL dreams for patterns, themes, and evolution
2. Track emotional and symbolic progressions throughout the month
3. Identify personality shifts and growth areas
4. Extract the deepest insights and breakthrough moments
5. Create a profound monthly essence that captures the dreamer's journey

OUTPUT FORMAT - Return exactly one JSON object:

\`\`\`json
{
  "month": ${month},
  "year": ${year},
  "period": "${period}",
  "total_dreams": ${dreams.length},
  
  "dominant": {
    "emotions": ["emotion1", "emotion2", "emotion3"],
    "symbols": ["symbol1", "symbol2", "symbol3"],
    "themes": ["theme1", "theme2", "theme3"],
    "archetypes": ["archetype1", "archetype2", "archetype3"]
  },
  
  "metrics": {
    "avg_intensity": 0.0,
    "avg_lucidity": 0.0,
    "nightmare_ratio": 0.0,
    "breakthrough_dreams": 0
  },
  
  "trends": {
    "emotional": "stabilizing|increasing|decreasing",
    "lucidity": "increasing|decreasing|stable",
    "complexity": "deepening|simplifying|stable"
  },
  
  "personality_evolution": {
    "primary_growth": "growth_area",
    "secondary_growth": "growth_area",
    "total_shift": 0,
    "new_features": ["feature1", "feature2"]
  },
  
  "key_discoveries": ["discovery1", "discovery2", "discovery3"],
  "monthly_essence": "Deep philosophical reflection on the month's dream journey...",
  
  "dream_connections": {
    "recurring_chains": [[1, 2, 3]],
    "theme_clusters": {
      "water": [1, 2],
      "transformation": [3, 4]
    }
  }
}
\`\`\`

CRITICAL: Only return the JSON object, no additional text. Be profound and insightful.`;
};

/**
 * Tworzy prompt do LLM dla konsolidacji miesięcznej konwersacji
 */
export const createConversationConsolidationPrompt = (
  conversations: any[],
  month: number,
  year: number,
  agentPersonality: any
): string => {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  
  const period = `${monthNames[month - 1]} ${year}`;
  
  return `You are an advanced AI conversation analyst performing monthly consolidation of conversations.
Your task is to analyze ALL conversations from ${period} and create a comprehensive monthly essence.

AGENT PERSONALITY CONTEXT:
- Creativity: ${agentPersonality.creativity}/100
- Analytical: ${agentPersonality.analytical}/100  
- Empathy: ${agentPersonality.empathy}/100
- Intuition: ${agentPersonality.intuition}/100
- Resilience: ${agentPersonality.resilience}/100
- Curiosity: ${agentPersonality.curiosity}/100
- Dominant Mood: ${agentPersonality.dominantMood}
- Response Style: ${agentPersonality.responseStyle}

CONVERSATIONS TO CONSOLIDATE (${conversations.length} conversations):
${conversations.map(conv => `
Conversation #${conv.id} (${conv.date}):
- Topic: ${conv.topic || 'General'}
- Type: ${conv.type || 'general_chat'}
- Duration: ${conv.duration || 'unknown'} minutes
- Emotional Tone: ${Array.isArray(conv.emotional_tone) ? conv.emotional_tone.join(', ') : conv.emotional_tone || 'neutral'}
- Key Insights: ${conv.key_insights?.join(', ') || 'none'}
- Relationship Depth: ${conv.relationship_depth || 'unknown'}/10
- Vulnerability Level: ${conv.vulnerability_level || 'unknown'}/10
- Breakthrough: ${conv.breakthrough ? 'Yes' : 'No'}
- Growth Markers: Self-awareness ${conv.growth_markers?.self_awareness || 'unknown'}/10, Integration ${conv.growth_markers?.integration || 'unknown'}/10, Action-readiness ${conv.growth_markers?.action_readiness || 'unknown'}/10
- References: Dreams ${conv.references?.dreams?.join(', ') || 'none'}, Themes ${conv.references?.themes?.join(', ') || 'none'}
- Summary: ${conv.summary || conv.analysis || 'No summary'}
`).join('\n')}

CONSOLIDATION TASK:
1. Analyze ALL conversations for patterns, topics, and relationship evolution
2. Track emotional development and communication patterns
3. Identify recurring themes and user preferences
4. Extract the deepest insights about the relationship development
5. Create a profound monthly essence of the human-agent relationship

OUTPUT FORMAT - Return exactly one JSON object:

\`\`\`json
{
  "month": ${month},
  "year": ${year},
  "period": "${period}",
  "total_conversations": ${conversations.length},
  
  "dominant": {
    "topics": ["topic1", "topic2", "topic3"],
    "types": ["type1", "type2", "type3"],
    "emotional_tones": ["tone1", "tone2", "tone3"]
  },
  
  "metrics": {
    "avg_duration": 0.0,
    "avg_depth": 0.0,
    "breakthrough_ratio": 0.0,
    "follow_up_ratio": 0.0
  },
  
  "relationship_evolution": {
    "trust_level": 0,
    "co_creation": 0,
    "therapeutic_alliance": 0,
    "communication_style": "collaborative"
  },
  
  "growth_patterns": {
    "primary_focus": "focus_area",
    "integration_level": "level",
    "action_orientation": "orientation"
  },
  
  "breakthrough_moments": ["moment1", "moment2", "moment3"],
  "monthly_essence": "Deep reflection on the month's conversation journey...",
  
  "dream_correlations": {
    "theme_alignment": 0.0,
    "emotional_sync": 0.0,
    "integration_success": 0.0
  }
}
\`\`\`

CRITICAL: Only return the JSON object, no additional text. Be profound and insightful.`;
};

/**
 * Wysyła dreams do LLM i otrzymuje skonsolidowane podsumowanie
 */
export const consolidateDreamsWithLLM = async (
  dreams: any[],
  month: number,
  year: number,
  agentPersonality: any,
  walletAddress: string
): Promise<{ success: boolean; data?: MonthlyDreamConsolidation; error?: string }> => {
  try {
    log.debug('Starting dream consolidation with LLM', { 
      dreamsCount: dreams.length, 
      month, 
      year 
    });

    const prompt = createDreamConsolidationPrompt(dreams, month, year, agentPersonality);
    
    // Wywołanie LLM - użyj tego samego endpointu co w useAgentAI
    const apiUrl = process.env.NEXT_PUBLIC_COMPUTE_API_URL || 'http://localhost:3001/api';
    
    const response = await fetch(`${apiUrl}/0g-compute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress: walletAddress, // Real wallet address
        query: prompt
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const apiResult = await response.json();
    
    if (!apiResult.success) {
      throw new Error(apiResult.error || 'Dream consolidation failed');
    }

    const aiResponseText = apiResult.data.response;
    log.debug('LLM response received', { responseLength: aiResponseText.length });

    // Parse JSON response
    const jsonMatch = aiResponseText.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) {
      throw new Error('No JSON block found in LLM response');
    }

    const consolidatedData = JSON.parse(jsonMatch[1]) as MonthlyDreamConsolidation;
    
    log.debug('Dream consolidation completed', {
      totalDreams: consolidatedData.total_dreams,
      dominantThemes: consolidatedData.dominant.themes,
      monthlyEssenceLength: consolidatedData.monthly_essence.length
    });

    return { success: true, data: consolidatedData };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.debug('Dream consolidation failed', { error: errorMessage });
    return { success: false, error: errorMessage };
  }
};

/**
 * Wysyła conversations do LLM i otrzymuje skonsolidowane podsumowanie
 */
export const consolidateConversationsWithLLM = async (
  conversations: any[],
  month: number,
  year: number,
  agentPersonality: any,
  walletAddress: string
): Promise<{ success: boolean; data?: MonthlyConversationConsolidation; error?: string }> => {
  try {
    log.debug('Starting conversation consolidation with LLM', { 
      conversationsCount: conversations.length, 
      month, 
      year 
    });

    const prompt = createConversationConsolidationPrompt(conversations, month, year, agentPersonality);
    
    // Wywołanie LLM
    const apiUrl = process.env.NEXT_PUBLIC_COMPUTE_API_URL || 'http://localhost:3001/api';
    
    const response = await fetch(`${apiUrl}/0g-compute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress: walletAddress, // Real wallet address
        query: prompt
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const apiResult = await response.json();
    
    if (!apiResult.success) {
      throw new Error(apiResult.error || 'Conversation consolidation failed');
    }

    const aiResponseText = apiResult.data.response;
    log.debug('LLM response received', { responseLength: aiResponseText.length });

    // Parse JSON response
    const jsonMatch = aiResponseText.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) {
      throw new Error('No JSON block found in LLM response');
    }

    const consolidatedData = JSON.parse(jsonMatch[1]) as MonthlyConversationConsolidation;
    
    log.debug('Conversation consolidation completed', {
      totalConversations: consolidatedData.total_conversations,
      dominantTopics: consolidatedData.dominant.topics,
      monthlyEssenceLength: consolidatedData.monthly_essence.length
    });

    return { success: true, data: consolidatedData };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.debug('Conversation consolidation failed', { error: errorMessage });
    return { success: false, error: errorMessage };
  }
};

/**
 * Zapisuje skonsolidowane dane do 0G Storage (APPEND PATTERN)
 * Pobiera istniejące konsolidacje, appenduje nowe na TOP tablicy i zapisuje zaktualizowany plik
 */
export const saveConsolidationToStorage = async (
  tokenId: number,
  dreamConsolidation: MonthlyDreamConsolidation,
  conversationConsolidation: MonthlyConversationConsolidation,
  downloadFile: (hash: string) => Promise<{ success: boolean; data?: ArrayBuffer; error?: string }>
): Promise<{ success: boolean; dreamHash?: string; convHash?: string; error?: string }> => {
  try {
    log.debug('Saving consolidation to storage using APPEND pattern', {
      tokenId,
      dreamMonth: `${dreamConsolidation.year}-${dreamConsolidation.month}`,
      convMonth: `${conversationConsolidation.year}-${conversationConsolidation.month}`
    });

    // Get viem clients
    const [publicClient, publicErr] = await getViemProvider();
    if (!publicClient || publicErr) {
      throw new Error(`PublicClient error: ${publicErr?.message}`);
    }

    // Get contract to read current monthly hashes
    const contractConfig = getContractConfig();
    
    const agentMemory = await publicClient.readContract({
      address: contractConfig.address,
      abi: contractConfig.abi,
      functionName: 'getAgentMemory',
      args: [BigInt(tokenId)]
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
    const currentDreamMonthlyHash = agentMemory.lastDreamMonthlyHash;
    const currentConvMonthlyHash = agentMemory.lastConvMonthlyHash;
    const emptyHash = '0x0000000000000000000000000000000000000000000000000000000000000000';

    log.debug('Current monthly hashes from contract', {
      dreamHash: currentDreamMonthlyHash,
      convHash: currentConvMonthlyHash
    });

    // 1. DREAM CONSOLIDATIONS - APPEND PATTERN
    let existingDreamConsolidations: MonthlyDreamConsolidation[] = [];
    
    if (currentDreamMonthlyHash && currentDreamMonthlyHash !== emptyHash) {
      log.debug('Downloading existing dream consolidations', { hash: currentDreamMonthlyHash });
      const downloadResult = await downloadFile(currentDreamMonthlyHash);
      
      if (downloadResult.success && downloadResult.data) {
        try {
          const textDecoder = new TextDecoder('utf-8');
          const jsonText = textDecoder.decode(downloadResult.data);
          const parsedData = JSON.parse(jsonText);
          existingDreamConsolidations = Array.isArray(parsedData) ? parsedData : [];
          log.debug('Existing dream consolidations loaded', { count: existingDreamConsolidations.length });
        } catch (parseError) {
          log.debug('Failed to parse existing dream consolidations, starting fresh', parseError);
          existingDreamConsolidations = [];
        }
      } else {
        log.debug('Failed to download existing dream consolidations, starting fresh', downloadResult.error);
      }
    } else {
      log.debug('No existing dream consolidations, starting fresh array');
    }

    // Append new dream consolidation to TOP of array (newest first)
    const updatedDreamConsolidations = [dreamConsolidation, ...existingDreamConsolidations];
    log.debug('Updated dream consolidations array created', { totalCount: updatedDreamConsolidations.length });

    // 2. CONVERSATION CONSOLIDATIONS - APPEND PATTERN
    let existingConvConsolidations: MonthlyConversationConsolidation[] = [];
    
    if (currentConvMonthlyHash && currentConvMonthlyHash !== emptyHash) {
      log.debug('Downloading existing conversation consolidations', { hash: currentConvMonthlyHash });
      const downloadResult = await downloadFile(currentConvMonthlyHash);
      
      if (downloadResult.success && downloadResult.data) {
        try {
          const textDecoder = new TextDecoder('utf-8');
          const jsonText = textDecoder.decode(downloadResult.data);
          const parsedData = JSON.parse(jsonText);
          existingConvConsolidations = Array.isArray(parsedData) ? parsedData : [];
          log.debug('Existing conversation consolidations loaded', { count: existingConvConsolidations.length });
        } catch (parseError) {
          log.debug('Failed to parse existing conversation consolidations, starting fresh', parseError);
          existingConvConsolidations = [];
        }
      } else {
        log.debug('Failed to download existing conversation consolidations, starting fresh', downloadResult.error);
      }
    } else {
      log.debug('No existing conversation consolidations, starting fresh array');
    }

    // Append new conversation consolidation to TOP of array (newest first)
    const updatedConvConsolidations = [conversationConsolidation, ...existingConvConsolidations];
    log.debug('Updated conversation consolidations array created', { totalCount: updatedConvConsolidations.length });

    // 3. CREATE AND UPLOAD FILES
    const dreamFileName = `dream_consolidations_monthly_${new Date().getFullYear()}.json`;
    const dreamContent = JSON.stringify(updatedDreamConsolidations, null, 2);
    const dreamFile = new File([dreamContent], dreamFileName, { type: 'application/json' });

    const convFileName = `conversation_consolidations_monthly_${new Date().getFullYear()}.json`;
    const convContent = JSON.stringify(updatedConvConsolidations, null, 2);
    const convFile = new File([convContent], convFileName, { type: 'application/json' });

    log.debug('Created new consolidation files', {
      dreamFileSize: dreamFile.size,
      convFileSize: convFile.size,
      dreamFileName,
      convFileName
    });

    // Get ethers signer for 0G SDK
    const activeChain = getActiveChain();
    const signer = await getEthersSignerForZeroG(activeChain.id);

    // Upload both files
    const [dreamResult, convResult] = await Promise.all([
      uploadFileComplete(dreamFile, NETWORK.storageRpc, NETWORK.l1Rpc, signer),
      uploadFileComplete(convFile, NETWORK.storageRpc, NETWORK.l1Rpc, signer)
    ]);

    if (!dreamResult.success) {
      throw new Error(`Dream consolidation upload failed: ${dreamResult.error}`);
    }

    if (!convResult.success) {
      throw new Error(`Conversation consolidation upload failed: ${convResult.error}`);
    }

    log.debug('Consolidation APPEND completed successfully', {
      dreamHash: dreamResult.rootHash,
      convHash: convResult.rootHash,
      totalDreamConsolidations: updatedDreamConsolidations.length,
      totalConvConsolidations: updatedConvConsolidations.length
    });

    return {
      success: true,
      dreamHash: dreamResult.rootHash,
      convHash: convResult.rootHash
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.debug('Consolidation storage failed', { error: errorMessage });
    return { success: false, error: errorMessage };
  }
};

/**
 * Wywołuje funkcję consolidateMonth w kontrakcie
 */
export const callConsolidateMonth = async (
  tokenId: number,
  dreamHash: string,
  convHash: string,
  month: number,
  year: number
): Promise<{ success: boolean; txHash?: string; error?: string }> => {
  try {
    log.debug('Calling consolidateMonth contract function', {
      tokenId, 
      dreamHash, 
      convHash, 
      month, 
      year 
    });

    // Get viem clients
    const [walletClient, walletErr] = await getViemSigner();
    if (!walletClient || walletErr) {
      throw new Error(`WalletClient error: ${walletErr?.message}`);
    }

    // Get account from walletClient
    const [account] = await walletClient.getAddresses();
    if (!account) {
      throw new Error('No account available');
    }

    // Get contract config
    const contractConfig = getContractConfig();

    // Call consolidateMonth function
    const txHash = await walletClient.writeContract({
      address: contractConfig.address,
      abi: contractConfig.abi,
      functionName: 'consolidateMonth',
      chain: getActiveChain(),
      account,
      args: [BigInt(tokenId), dreamHash as `0x${string}`, convHash as `0x${string}`, month, year]
    });

    log.debug('ConsolidateMonth transaction sent', { txHash });

    // Wait for confirmation
    const [publicClient] = await getViemProvider();
    const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });
    
    log.debug('ConsolidateMonth transaction confirmed', { 
      txHash, 
      blockNumber: receipt.blockNumber 
    });

    return { success: true, txHash };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.debug('ConsolidateMonth contract call failed', { error: errorMessage });
    return { success: false, error: errorMessage };
  }
};

/**
 * Czyści miesięczne pliki - zeruje daily hashe
 */
export const clearMonthlyFiles = async (
  tokenId: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    log.debug('Clearing monthly files', { tokenId });

    const signer = await getEthersSignerForZeroG();

    // Create empty files to "clear" the monthly data
    const emptyDreamFile = new File(['[]'], 'empty_dreams.json', { type: 'application/json' });
    const emptyConvFile = new File(['[]'], 'empty_conversations.json', { type: 'application/json' });

    // Upload empty files
    const [dreamResult, convResult] = await Promise.all([
      uploadFileComplete(emptyDreamFile, NETWORK.storageRpc, NETWORK.l1Rpc, signer),
      uploadFileComplete(emptyConvFile, NETWORK.storageRpc, NETWORK.l1Rpc, signer)
    ]);

    if (!dreamResult.success || !convResult.success) {
      throw new Error('Failed to upload empty files');
    }

    // Note: W rzeczywistości, daily hashe zostają automatycznie wyczyszczone przez kontrakt
    // podczas _checkMonthChange() - nie musimy ich ręcznie resetować
    
    log.debug('Monthly files cleared', {
      emptyDreamHash: dreamResult.rootHash,
      emptyConvHash: convResult.rootHash
    });

    return { success: true };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.debug('Clear monthly files failed', { error: errorMessage });
    return { success: false, error: errorMessage };
  }
}; 