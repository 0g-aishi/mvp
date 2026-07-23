'use client';

import { 
  buildMonthLearnConsolidationPrompt, 
  MonthLearnPromptData 
} from '../../../prompts/monthLearnConsolidationPrompt';
import { 
  parseMonthLearnResponse, 
  validateDreamConsolidation, 
  validateConversationConsolidation 
} from '../../../prompts/monthLearnResponseParser';

// API Response interfaces
export interface MonthLearnAPIResponse {
  response: string;
  model: string;
  cost: number;
  chatId: string;
  responseTime: number;
  isValid: boolean;
}

// Monthly consolidation data schemas
export interface MonthlyDreamConsolidation {
  month: number;
  year: number;
  period: string;
  total_dreams: number;
  dominant: {
    emotions: string[];
    symbols: string[];
    themes: string[];
    archetypes: string[];
  };
  metrics: {
    avg_intensity: number;
    avg_lucidity: number;
    nightmare_ratio: number;
    breakthrough_dreams: number;
  };
  trends: {
    emotional: string;
    lucidity: string;
    complexity: string;
  };
  personality_evolution: {
    primary_growth: string;
    secondary_growth: string;
    total_shift: number;
    new_features: string[];
  };
  key_discoveries: string[];
  monthly_essence: string;
  dream_connections: {
    recurring_chains: number[][];
    theme_clusters: Record<string, number[]>;
  };
}

export interface MonthlyConversationConsolidation {
  month: number;
  year: number;
  period: string;
  total_conversations: number;
  dominant: {
    topics: string[];
    types: string[];
    emotional_tones: string[];
  };
  metrics: {
    avg_duration: number;
    avg_depth: number;
    breakthrough_ratio: number;
    follow_up_ratio: number;
  };
  relationship_evolution: {
    trust_level: number;
    co_creation: number;
    therapeutic_alliance: number;
    communication_style: string;
  };
  growth_patterns: {
    primary_focus: string;
    integration_level: string;
    action_orientation: string;
  };
  breakthrough_moments: string[];
  monthly_essence: string;
  dream_correlations: {
    theme_alignment: number;
    emotional_sync: number;
    integration_success: number;
  };
}

/**
 * Send unified month-learn consolidation request to AI API
 * Processes both dreams and conversations in a single request
 */
export const sendUnifiedMonthLearnConsolidation = async (
  data: MonthLearnPromptData,
  walletAddress: string,
  debugLog: (message: string, data?: any) => void
): Promise<{ dreamConsolidation: any | null; conversationConsolidation: any | null }> => {
  debugLog('Sending unified month-learn consolidation to AI', { 
    dreamsCount: data.dreams.length,
    conversationsCount: data.conversations.length,
    month: data.month,
    year: data.year,
    walletAddress
  });

  // Build unified prompt using the new prompt builder
  const prompt = buildMonthLearnConsolidationPrompt(data);
  
  debugLog('Unified prompt built', { 
    promptLength: prompt.length,
    hasPersonality: !!data.agentPersonality
  });

  // Get API URL from environment
  const apiUrl = process.env.NEXT_PUBLIC_COMPUTE_API_URL || 'http://localhost:3001/api';
  
  debugLog('API URL configured', { apiUrl });

  try {
    debugLog('Preparing unified fetch request', {
      url: `${apiUrl}/0g-compute`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      bodySize: JSON.stringify({ walletAddress, query: prompt }).length
    });

    // Send single request to 0g-compute API
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

    debugLog('Unified fetch response received', {
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
      throw new Error(apiResult.error || 'Unified month-learn consolidation failed');
    }

    const aiResponse: MonthLearnAPIResponse = apiResult.data;
    
    debugLog('AI consolidation response received', {
      model: aiResponse.model,
      cost: aiResponse.cost,
      responseTime: aiResponse.responseTime,
      isValid: aiResponse.isValid,
      responseLength: aiResponse.response.length
    });

    // Parse the unified response using the new parser
    const parseResult = parseMonthLearnResponse(aiResponse.response);
    
    if (!parseResult.success) {
      throw new Error(`Failed to parse AI response: ${parseResult.error}`);
    }

    debugLog('Unified response parsed successfully', {
      hasDreamConsolidation: !!parseResult.dreamConsolidation,
      hasConversationConsolidation: !!parseResult.conversationConsolidation
    });

    // Validate parsed data
    if (parseResult.dreamConsolidation && !validateDreamConsolidation(parseResult.dreamConsolidation)) {
      debugLog('Dream consolidation validation failed', { data: parseResult.dreamConsolidation });
      throw new Error('Dream consolidation data is invalid');
    }

    if (parseResult.conversationConsolidation && !validateConversationConsolidation(parseResult.conversationConsolidation)) {
      debugLog('Conversation consolidation validation failed', { data: parseResult.conversationConsolidation });
      throw new Error('Conversation consolidation data is invalid');
    }

    return {
      dreamConsolidation: parseResult.dreamConsolidation,
      conversationConsolidation: parseResult.conversationConsolidation
    };

  } catch (error) {
    debugLog('sendUnifiedMonthLearnConsolidation error caught', {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorType: error?.constructor?.name,
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
};

// Old parsing functions removed - now using unified parser from /prompts folder

// Old prompt functions removed - now using unified prompt from /prompts folder