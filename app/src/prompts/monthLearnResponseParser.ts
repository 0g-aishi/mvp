/**
 * Month-Learn Response Parser
 * Extracts dreams and conversations consolidations from AI response using section markers
 */

import { logger } from '@/lib/logger/logger';

const log = logger.child({ component: 'monthLearnResponseParser' });

export interface MonthLearnParseResult {
  dreamConsolidation: any | null;
  conversationConsolidation: any | null;
  success: boolean;
  error?: string;
}

/**
 * Parses AI response containing both dreams and conversations consolidations
 * Uses section markers to extract separate JSON objects
 */
export function parseMonthLearnResponse(aiResponse: string): MonthLearnParseResult {
  try {
    // Extract dreams consolidation
    const dreamsMatch = aiResponse.match(/### DREAMS CONSOLIDATION ###\s*```json\s*([\s\S]*?)\s*```/);
    let dreamConsolidation: any | null = null;
    
    if (dreamsMatch && dreamsMatch[1]) {
      try {
        dreamConsolidation = JSON.parse(dreamsMatch[1].trim());
      } catch (error) {
        log.error('Failed to parse dreams consolidation JSON:', { error });
        return {
          dreamConsolidation: null,
          conversationConsolidation: null,
          success: false,
          error: 'Failed to parse dreams consolidation JSON'
        };
      }
    }

    // Extract conversations consolidation
    const conversationsMatch = aiResponse.match(/### CONVERSATIONS CONSOLIDATION ###\s*```json\s*([\s\S]*?)\s*```/);
    let conversationConsolidation: any | null = null;
    
    if (conversationsMatch && conversationsMatch[1]) {
      try {
        conversationConsolidation = JSON.parse(conversationsMatch[1].trim());
      } catch (error) {
        log.error('Failed to parse conversations consolidation JSON:', { error });
        return {
          dreamConsolidation,
          conversationConsolidation: null,
          success: false,
          error: 'Failed to parse conversations consolidation JSON'
        };
      }
    }

    // Validate that we got at least one consolidation
    if (!dreamConsolidation && !conversationConsolidation) {
      return {
        dreamConsolidation: null,
        conversationConsolidation: null,
        success: false,
        error: 'No consolidation data found in AI response. Expected section markers not found.'
      };
    }

    return {
      dreamConsolidation,
      conversationConsolidation,
      success: true
    };

  } catch (error) {
    return {
      dreamConsolidation: null,
      conversationConsolidation: null,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Validates dream consolidation structure
 */
export function validateDreamConsolidation(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  
  const requiredFields = ['month', 'year', 'period', 'total_dreams'];
  return requiredFields.every(field => field in data);
}

/**
 * Validates conversation consolidation structure
 */
export function validateConversationConsolidation(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  
  const requiredFields = ['month', 'year', 'period', 'total_conversations'];
  return requiredFields.every(field => field in data);
} 