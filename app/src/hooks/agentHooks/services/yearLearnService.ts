'use client';

import { 
  buildYearLearnConsolidationPrompt, 
  YearLearnPromptData 
} from '../../../prompts/yearLearnConsolidationPrompt';
import { 
  parseYearLearnResponse, 
  validateYearlyMemoryCore,
  validateMemoryCoreQuality,
  YearlyMemoryCore 
} from '../../../prompts/yearLearnResponseParser';

// API Response interfaces
export interface YearLearnAPIResponse {
  response: string;
  model: string;
  cost: number;
  chatId: string;
  responseTime: number;
  isValid: boolean;
}

// Re-export types for convenience
export type { YearlyMemoryCore } from '../../../prompts/yearLearnResponseParser';

/**
 * Send year-learn consolidation request to AI API
 * Processes yearly monthly consolidations to create memory core
 */
export const sendYearlyConsolidation = async (
  data: YearLearnPromptData,
  walletAddress: string,
  debugLog: (message: string, data?: any) => void
): Promise<YearlyMemoryCore | null> => {
  debugLog('Sending yearly consolidation to AI', { 
    dreamConsolidationsCount: data.dreamConsolidations.length,
    conversationConsolidationsCount: data.conversationConsolidations.length,
    year: data.year,
    walletAddress
  });

  // Build yearly consolidation prompt using the dedicated prompt builder
  const prompt = buildYearLearnConsolidationPrompt(data);
  
  debugLog('Yearly consolidation prompt built', { 
    promptLength: prompt.length,
    hasPersonality: !!data.agentPersonality
  });

  // Get API URL from environment
  const apiUrl = process.env.NEXT_PUBLIC_COMPUTE_API_URL || 'http://localhost:3001/api';
  
  debugLog('API URL configured', { apiUrl });

  try {
    debugLog('Preparing yearly consolidation fetch request', {
      url: `${apiUrl}/0g-compute`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      bodySize: JSON.stringify({ walletAddress, query: prompt }).length
    });

    // Send request to 0g-compute API
    const response = await fetch(`${apiUrl}/0g-compute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress,
        query: prompt
      })
    });

    debugLog('Yearly consolidation fetch response received', {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      debugLog('Error response data', { errorData });
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const apiResult = await response.json();
    debugLog('API result parsed', { 
      success: apiResult.success,
      hasData: !!apiResult.data,
      error: apiResult.error
    });
    
    if (!apiResult.success) {
      throw new Error(apiResult.error || 'Yearly consolidation failed');
    }

    const aiResponse: YearLearnAPIResponse = apiResult.data;
    
    debugLog('AI yearly consolidation response received', {
      model: aiResponse.model,
      cost: aiResponse.cost,
      responseTime: aiResponse.responseTime,
      isValid: aiResponse.isValid,
      responseLength: aiResponse.response.length
    });

    // Parse the yearly consolidation response using the dedicated parser
    const parseResult = parseYearLearnResponse(aiResponse.response);
    
    if (!parseResult.success) {
      throw new Error(`Failed to parse AI response: ${parseResult.error}`);
    }

    if (!parseResult.memoryCore) {
      throw new Error('No memory core data returned from AI');
    }

    debugLog('Yearly consolidation response parsed successfully', {
      hasMemoryCore: !!parseResult.memoryCore,
      year: parseResult.memoryCore?.year,
      agentId: parseResult.memoryCore?.agent_id
    });

    // Validate parsed memory core structure
    if (!validateYearlyMemoryCore(parseResult.memoryCore)) {
      debugLog('Memory core validation failed', { data: parseResult.memoryCore });
      throw new Error('Memory core data structure is invalid');
    }

    // Additional quality validation
    const qualityCheck = validateMemoryCoreQuality(parseResult.memoryCore);
    if (!qualityCheck.isValid) {
      debugLog('Memory core quality validation failed', { 
        warnings: qualityCheck.warnings,
        data: parseResult.memoryCore 
      });
      throw new Error(`Memory core quality is insufficient: ${qualityCheck.warnings.join(', ')}`);
    }

    if (qualityCheck.warnings.length > 0) {
      debugLog('Memory core quality warnings', { warnings: qualityCheck.warnings });
    }

    debugLog('Memory core validation completed successfully', {
      year: parseResult.memoryCore.year,
      evolutionStage: parseResult.memoryCore.yearly_overview.agent_evolution_stage,
      consciousnessLevel: parseResult.memoryCore.final_metrics.consciousness_level,
      integrationScore: parseResult.memoryCore.final_metrics.integration_score,
      wisdomDepth: parseResult.memoryCore.final_metrics.wisdom_depth
    });

    return parseResult.memoryCore;

  } catch (error) {
    debugLog('sendYearlyConsolidation error caught', {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorType: error?.constructor?.name,
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
};

/**
 * Validate yearly data completeness before sending to AI
 * Checks if we have enough data to generate a meaningful memory core
 */
export const validateYearlyDataCompleteness = (
  data: YearLearnPromptData,
  debugLog: (message: string, data?: any) => void
): { isValid: boolean; warnings: string[]; recommendations: string[] } => {
  const warnings: string[] = [];
  const recommendations: string[] = [];
  let isValid = true;

  debugLog('Validating yearly data completeness', {
    dreamConsolidationsCount: data.dreamConsolidations.length,
    conversationConsolidationsCount: data.conversationConsolidations.length,
    year: data.year
  });

  // Check total data availability
  if (data.dreamConsolidations.length === 0 && data.conversationConsolidations.length === 0) {
    isValid = false;
    warnings.push('No consolidation data available for the year');
    recommendations.push('Complete at least one monthly consolidation before creating yearly memory core');
    return { isValid, warnings, recommendations };
  }

  // Calculate coverage
  const availableMonths = new Set([
    ...data.dreamConsolidations.map(d => d.month),
    ...data.conversationConsolidations.map(c => c.month)
  ]);
  const monthsCovered = availableMonths.size;
  const coveragePercentage = (monthsCovered / 12) * 100;

  debugLog('Yearly data coverage calculated', {
    monthsCovered,
    coveragePercentage: coveragePercentage.toFixed(1),
    availableMonths: Array.from(availableMonths).sort()
  });

  // Coverage warnings
  if (coveragePercentage < 25) {
    warnings.push(`Low data coverage: Only ${monthsCovered}/12 months have data (${coveragePercentage.toFixed(1)}%)`);
    recommendations.push('Consider completing more monthly consolidations for richer memory core');
  } else if (coveragePercentage < 50) {
    warnings.push(`Moderate data coverage: ${monthsCovered}/12 months have data (${coveragePercentage.toFixed(1)}%)`);
  }

  // Check data balance
  const dreamMonthsCovered = new Set(data.dreamConsolidations.map(d => d.month)).size;
  const conversationMonthsCovered = new Set(data.conversationConsolidations.map(c => c.month)).size;

  if (dreamMonthsCovered === 0 && conversationMonthsCovered > 0) {
    warnings.push('Only conversation data available - no dream consolidations');
    recommendations.push('Memory core will focus on conversational growth patterns only');
  }

  if (conversationMonthsCovered === 0 && dreamMonthsCovered > 0) {
    warnings.push('Only dream data available - no conversation consolidations');  
    recommendations.push('Memory core will focus on dream evolution patterns only');
  }

  // Check personality data
  if (!data.agentPersonality) {
    warnings.push('No agent personality data available');
    recommendations.push('Personality context would enrich the memory core analysis');
  }

  // Calculate total interactions
  const totalDreams = data.dreamConsolidations.reduce((sum, d) => sum + d.total_dreams, 0);
  const totalConversations = data.conversationConsolidations.reduce((sum, c) => sum + c.total_conversations, 0);

  debugLog('Yearly interaction totals', { totalDreams, totalConversations });

  if (totalDreams + totalConversations < 10) {
    warnings.push(`Low interaction count: Only ${totalDreams + totalConversations} total interactions`);
    recommendations.push('Memory core may be less detailed due to limited interaction history');
  }

  // Check for evolution patterns
  const hasPersonalityEvolution = data.dreamConsolidations.some(d => 
    d.personality_evolution && (d.personality_evolution.total_shift > 0 || d.personality_evolution.new_features.length > 0)
  );

  if (!hasPersonalityEvolution) {
    warnings.push('No personality evolution detected in dream consolidations');
    recommendations.push('Memory core will focus on patterns and wisdom rather than personality changes');
  }

  debugLog('Yearly data validation completed', {
    isValid,
    warningsCount: warnings.length,
    recommendationsCount: recommendations.length,
    coveragePercentage: coveragePercentage.toFixed(1)
  });

  return { isValid, warnings, recommendations };
};

/**
 * Generate yearly data summary for logging and debugging
 */
export const generateYearlyDataSummary = (data: YearLearnPromptData): {
  summary: string;
  metrics: Record<string, number>;
  patterns: string[];
} => {
  const availableMonths = new Set([
    ...data.dreamConsolidations.map(d => d.month),
    ...data.conversationConsolidations.map(c => c.month)
  ]);

  const totalDreams = data.dreamConsolidations.reduce((sum, d) => sum + d.total_dreams, 0);
  const totalConversations = data.conversationConsolidations.reduce((sum, c) => sum + c.total_conversations, 0);
  const totalPersonalityShift = data.dreamConsolidations.reduce((sum, d) => sum + (d.personality_evolution?.total_shift || 0), 0);

  const metrics = {
    monthsCovered: availableMonths.size,
    totalDreams,
    totalConversations,
    totalPersonalityShift,
    dreamConsolidations: data.dreamConsolidations.length,
    conversationConsolidations: data.conversationConsolidations.length
  };

  // Extract dominant patterns
  const patterns: string[] = [];
  
  // Dream patterns
  const dreamEmotions = data.dreamConsolidations.flatMap(d => d.dominant?.emotions || []);
  const dreamThemes = data.dreamConsolidations.flatMap(d => d.dominant?.themes || []);
  
  if (dreamEmotions.length > 0) {
    const mostCommonEmotion = dreamEmotions.reduce((acc, emotion) => 
      dreamEmotions.filter(e => e === emotion).length > dreamEmotions.filter(e => e === acc).length ? emotion : acc
    );
    patterns.push(`Dominant dream emotion: ${mostCommonEmotion}`);
  }

  if (dreamThemes.length > 0) {
    const mostCommonTheme = dreamThemes.reduce((acc, theme) => 
      dreamThemes.filter(t => t === theme).length > dreamThemes.filter(t => t === acc).length ? theme : acc
    );
    patterns.push(`Dominant dream theme: ${mostCommonTheme}`);
  }

  // Conversation patterns
  const conversationTopics = data.conversationConsolidations.flatMap(c => c.dominant?.topics || []);
  
  if (conversationTopics.length > 0) {
    const mostCommonTopic = conversationTopics.reduce((acc, topic) => 
      conversationTopics.filter(t => t === topic).length > conversationTopics.filter(t => t === acc).length ? topic : acc
    );
    patterns.push(`Dominant conversation topic: ${mostCommonTopic}`);
  }

  const summary = `Year ${data.year} consolidation summary: ${metrics.monthsCovered}/12 months covered, ${totalDreams} dreams, ${totalConversations} conversations, personality shift: ${totalPersonalityShift}`;

  return { summary, metrics, patterns };
};