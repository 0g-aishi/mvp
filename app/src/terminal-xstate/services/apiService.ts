// @ts-nocheck
/**
 * @fileoverview API Service for Terminal XState Dream Analysis
 * @description Handles communication with 0g-compute backend for AI dream analysis
 */

import { AIResponse } from '../types/contextTypes';
import { logger } from '@/lib/logger';

// Logger instance
const log = logger.child({ component: 'APIService' });

interface DreamAPIRequest {
  prompt: string;
  modelId: string;
  walletAddress?: string;
  isEvolutionDream: boolean;
}

interface BackendResponse {
  success: boolean;
  data?: string;
  error?: string;
  metadata?: {
    model?: string;
    responseTime?: number;
    profile?: string;
  };
}

/**
 * Sanitize JSON string by removing control characters
 */
function sanitizeJsonString(str: string): string {
  // Remove control characters except for \n in the middle of strings
  // This regex keeps newlines but removes other control chars
  return str
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars except \t, \n, \r
    .replace(/\r\n/g, '\\n') // Convert Windows newlines
    .replace(/\n/g, '\\n')   // Escape remaining newlines
    .replace(/\r/g, '\\n')   // Convert carriage returns
    .replace(/\t/g, '\\t');  // Escape tabs
    // Removed quote escaping - JSON structure quotes should not be escaped
}

/**
 * Enhanced JSON diagnostic logging
 */
function logJsonDiagnostics(responseText: string, blockContent?: string, blockIndex?: number) {
  log.debug('=== JSON DIAGNOSTICS START ===');
  log.debug('Full AI Response Preview', {
    length: responseText.length,
    firstChars: responseText.substring(0, 100),
    lastChars: responseText.substring(responseText.length - 100),
    containsJsonBlocks: responseText.includes('```json'),
    jsonBlockCount: (responseText.match(/```json/g) || []).length
  });
  
  if (blockContent !== undefined && blockIndex !== undefined) {
    log.debug(`JSON Block ${blockIndex + 1} Diagnostics`, {
      length: blockContent.length,
      firstChars: blockContent.substring(0, 50),
      hexDump: Array.from(blockContent.substring(0, 20)).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' '),
      hasUnicodeChars: /[^\x00-\x7F]/.test(blockContent),
      startsWithBrace: blockContent.trim().startsWith('{'),
      endsWithBrace: blockContent.trim().endsWith('}')
    });
  }
  log.debug('=== JSON DIAGNOSTICS END ===');
}

/**
 * Robust JSON parsing with multiple strategies
 */
function parseJsonSafely(jsonStr: string, blockIndex: number): any | null {
  const originalStr = jsonStr;
  
  // Strategy 1: Direct parsing (fastest path)
  try {
    const result = JSON.parse(jsonStr);
    log.debug(`JSON Block ${blockIndex + 1} parsed successfully (direct)`, { strategy: 'direct' });
    return result;
  } catch (directError) {
    log.debug(`JSON Block ${blockIndex + 1} direct parsing failed`, { 
      error: String(directError),
      errorPosition: (directError as any).message?.match(/position (\d+)/)?.[1]
    });
  }

  // Strategy 2: Unicode normalization and BOM removal
  try {
    let normalized = jsonStr
      .replace(/^\uFEFF/, '') // Remove BOM
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width chars
      .normalize('NFC'); // Unicode normalization
    
    const result = JSON.parse(normalized);
    log.debug(`JSON Block ${blockIndex + 1} parsed successfully (normalized)`, { strategy: 'normalized' });
    return result;
  } catch (normalizedError) {
    log.debug(`JSON Block ${blockIndex + 1} normalized parsing failed`, { 
      error: String(normalizedError) 
    });
  }

  // Strategy 3: Conservative string content escaping
  try {
    let escaped = jsonStr
      .replace(/([^\\])\n/g, '$1\\n')  // Escape unescaped newlines
      .replace(/([^\\])\r/g, '$1\\r')  // Escape unescaped carriage returns
      .replace(/([^\\])\t/g, '$1\\t')  // Escape unescaped tabs
      .replace(/\\/g, '\\\\')          // Escape backslashes first
      .replace(/\\\\n/g, '\\n')        // Fix double-escaped newlines
      .replace(/\\\\r/g, '\\r')        // Fix double-escaped carriage returns
      .replace(/\\\\t/g, '\\t');       // Fix double-escaped tabs
    
    const result = JSON.parse(escaped);
    log.debug(`JSON Block ${blockIndex + 1} parsed successfully (escaped)`, { strategy: 'escaped' });
    return result;
  } catch (escapedError) {
    log.debug(`JSON Block ${blockIndex + 1} escaped parsing failed`, { 
      error: String(escapedError) 
    });
  }

  // Strategy 4: Manual content extraction (last resort)
  try {
    log.debug(`JSON Block ${blockIndex + 1} attempting manual extraction`, { 
      originalLength: originalStr.length 
    });
    
    // Try to extract key-value pairs manually for critical fields
    const fullAnalysisMatch = originalStr.match(/"full_analysis"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    const analysisMatch = originalStr.match(/"analysis"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    const dreamDataMatch = originalStr.match(/"dreamData"\s*:\s*({[^}]+})/);
    
    if (fullAnalysisMatch && blockIndex === 0) {
      const result = { full_analysis: fullAnalysisMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n') };
      log.debug(`JSON Block ${blockIndex + 1} manual extraction successful`, { strategy: 'manual', extracted: 'full_analysis' });
      return result;
    }
    
    if (analysisMatch && dreamDataMatch && blockIndex === 1) {
      const dreamData = JSON.parse(dreamDataMatch[1]);
      const result = { 
        analysis: analysisMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
        dreamData 
      };
      log.debug(`JSON Block ${blockIndex + 1} manual extraction successful`, { strategy: 'manual', extracted: 'analysis+dreamData' });
      return result;
    }
  } catch (manualError) {
    log.debug(`JSON Block ${blockIndex + 1} manual extraction failed`, { 
      error: String(manualError) 
    });
  }

  // All strategies failed
  log.debug(`JSON Block ${blockIndex + 1} ALL PARSING STRATEGIES FAILED`, { 
    originalLength: originalStr.length,
    strategies: ['direct', 'normalized', 'escaped', 'manual']
  });
  
  return null;
}

/**
 * Extract JSON blocks from AI response text with enhanced error handling
 */
function extractJsonBlocks(responseText: string): { fullAnalysis?: any; dreamData?: any } {
  log.debug('Extracting JSON blocks from response', { 
    responseLength: responseText.length 
  });
  
  // Enhanced logging
  logJsonDiagnostics(responseText);
  
  // Improved regex to extract only JSON objects
  const jsonBlockRegex = /```json\s*({[\s\S]*?})\s*```/g;
  const matches = [...responseText.matchAll(jsonBlockRegex)];
  
  log.debug('Found JSON blocks', { count: matches.length });
  
  if (matches.length === 0) {
    log.debug('No JSON blocks found with enhanced regex, trying fallback');
    
    // Fallback: try original regex pattern
    const fallbackRegex = /```json\s*([\s\S]*?)```/g;
    const fallbackMatches = [...responseText.matchAll(fallbackRegex)];
    
    if (fallbackMatches.length === 0) {
      log.debug('No JSON blocks found at all, treating as plain text');
      return { fullAnalysis: responseText };
    }
    
    log.debug('Found JSON blocks with fallback regex', { count: fallbackMatches.length });
    
    // Process fallback matches
    const result: any = {};
    fallbackMatches.forEach((match, index) => {
      logJsonDiagnostics(responseText, match[1], index);
      const parsed = parseJsonSafely(match[1].trim(), index);
      
      if (parsed) {
        if (index === 0 && parsed.full_analysis) {
          result.fullAnalysis = parsed.full_analysis;
        }
        if (index === 1 || (index === 0 && parsed.dreamData)) {
          result.dreamData = parsed;
        }
      }
    });
    
    return result;
  }
  
  const result: any = {};
  
  // Parse each JSON block with enhanced error handling
  matches.forEach((match, index) => {
    const jsonStr = match[1].trim();
    
    // Enhanced diagnostics for each block
    logJsonDiagnostics(responseText, jsonStr, index);
    
    // Use robust parsing
    const parsed = parseJsonSafely(jsonStr, index);
    
    if (parsed) {
      log.debug(`Successfully processed JSON block ${index + 1}`, { 
        hasFullAnalysis: !!parsed.full_analysis,
        hasAnalysis: !!parsed.analysis,
        hasDreamData: !!parsed.dreamData
      });
      
      // First block should contain full_analysis
      if (index === 0 && parsed.full_analysis) {
        result.fullAnalysis = parsed.full_analysis;
      }
      
      // Second block should contain analysis and dreamData
      if (index === 1 || (index === 0 && parsed.dreamData)) {
        result.dreamData = parsed;
      }
    } else {
      log.debug(`Failed to process JSON block ${index + 1} with all strategies`);
      
      // Graceful fallback: if first block fails but second succeeds, use second for both
      if (index === 0 && matches.length > 1) {
        log.debug('Will attempt to use second block as fallback for first block content');
      }
    }
  });
  
  // Fallback strategy: if first block failed but we have second block
  if (!result.fullAnalysis && result.dreamData && result.dreamData.analysis) {
    log.debug('Using analysis from second block as fallback for full_analysis');
    result.fullAnalysis = result.dreamData.analysis;
  }
  
  return result;
}

/**
 * Route request to appropriate backend endpoint based on model
 */
async function routeToBackend(request: DreamAPIRequest): Promise<BackendResponse> {
  const BACKEND_URL = process.env.NEXT_PUBLIC_COMPUTE_API_URL || 
                      'http://localhost:3001/api';
  
  const isGeminiModel = request.modelId.startsWith('gemini-');
  const endpoint = isGeminiModel ? '/gemini' : '/0g-compute';
  
  log.debug('Routing request to backend', {
    model: request.modelId,
    endpoint,
    isGemini: isGeminiModel,
    backendUrl: BACKEND_URL
  });
  
  // Prepare request body based on endpoint
  const requestBody = isGeminiModel ? {
    prompt: request.prompt,
    modelId: request.modelId
  } : (() => {
    // For 0G Network models, walletAddress is REQUIRED (no zero address fallback!)
    if (!request.walletAddress || request.walletAddress === '0x0000000000000000000000000000000000000000') {
      const error = 'Wallet address required for 0G Network models. Please ensure wallet is connected and agent is synced.';
      log.debug('❌ Missing or invalid walletAddress for 0G model', {
        modelId: request.modelId,
        hasWalletAddress: !!request.walletAddress,
        walletAddress: request.walletAddress || 'undefined'
      });
      throw new Error(error);
    }

    return {
      walletAddress: request.walletAddress,
      query: request.prompt,
      modelId: request.modelId
    };
  })();
  
  try {
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(60000) // 60 second timeout
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return data;
  } catch (error) {
    log.debug('Backend request failed', { error: String(error) });
    throw error;
  }
}

/**
 * Main function to send dream analysis to AI backend
 */
export async function sendDreamToAI(
  prompt: string,
  modelId: string,
  walletAddress?: string,
  isEvolutionDream: boolean = false,
  dreamCount: number = 0
): Promise<AIResponse> {
  log.debug('=== BANDYCKA JAZDA: Sending dream to REAL AI ===', {
    promptLength: prompt.length,
    modelId,
    isEvolutionDream,
    hasWallet: !!walletAddress,
    dreamCount,
    nextDreamId: dreamCount + 1
  });
  
  try {
    // Send to backend
    const backendResponse = await routeToBackend({
      prompt,
      modelId,
      walletAddress,
      isEvolutionDream
    });
    
    if (!backendResponse.success) {
      throw new Error(backendResponse.error || 'Backend request failed');
    }
    
    log.debug('Received backend response', {
      hasData: !!backendResponse.data,
      dataLength: backendResponse.data?.length,
      metadata: backendResponse.metadata
    });
    
    // Extract JSON blocks from AI response
    const responseText = backendResponse.data || '';
    const { fullAnalysis, dreamData } = extractJsonBlocks(responseText);
    
    // If no structured data found, use the raw response
    const analysisText = fullAnalysis || responseText;
    
    // Build response in expected format
    const aiResponse: AIResponse = {
      fullAnalysis: typeof analysisText === 'string' ? analysisText : 
                   (analysisText.full_analysis || 'Dream analysis completed.'),
      
      dreamData: dreamData?.dreamData || {
        id: dreamData?.dreamData?.id || (dreamCount + 1),
        date: dreamData?.dreamData?.date || new Date().toISOString().split('T')[0],
        timestamp: dreamData?.dreamData?.timestamp || Math.floor(Date.now() / 1000),
        content: prompt.substring(0, 200),
        emotions: dreamData?.dreamData?.emotions || ['neutral'],
        symbols: dreamData?.dreamData?.symbols || ['unidentified'],
        intensity: dreamData?.dreamData?.intensity || 5,
        lucidity: dreamData?.dreamData?.lucidity || 2,
        dreamType: dreamData?.dreamData?.dream_type || 'normal'
      },
      
      analysis: dreamData?.analysis || 'Dream has been analyzed and insights extracted.',
      
      // Include personality impact if it's an evolution dream
      personalityImpact: isEvolutionDream && dreamData?.personalityImpact ? 
        dreamData.personalityImpact : undefined
    };
    
    log.debug('=== AI Response Parsed Successfully ===', {
      hasFullAnalysis: !!aiResponse.fullAnalysis,
      fullAnalysisLength: aiResponse.fullAnalysis.length,
      dreamId: aiResponse.dreamData.id,
      hasPersonalityImpact: !!aiResponse.personalityImpact,
      emotions: aiResponse.dreamData.emotions,
      model: backendResponse.metadata?.model || modelId
    });
    
    return aiResponse;
    
  } catch (error) {
    log.debug('=== AI Request Failed ===', { error: String(error) });
    
    // Return a fallback response on error
    const fallbackResponse: AIResponse = {
      fullAnalysis: `I encountered an issue connecting to the AI service (${String(error)}). Your dream has been noted but couldn't be fully analyzed at this time. Please try again later.`,
      dreamData: {
        id: dreamCount + 1,
        date: new Date().toISOString().split('T')[0],
        timestamp: Math.floor(Date.now() / 1000),
        content: prompt.substring(0, 200),
        emotions: ['uncertain'],
        symbols: ['unidentified'],
        intensity: 5,
        lucidity: 1,
        dreamType: 'unanalyzed'
      },
      analysis: 'Dream analysis temporarily unavailable.'
    };
    
    return fallbackResponse;
  }
}

/**
 * Simple chat function that sends a prompt to AI and returns text response
 * Used for chat conversations (not dream analysis)
 */
export async function sendToAI(
  prompt: string,
  modelId: string = 'gemini-2.5-flash',
  walletAddress?: string
): Promise<string> {
  log.debug('=== Sending chat message to AI ===', {
    promptLength: prompt.length,
    modelId,
    hasWalletAddress: !!walletAddress,
    walletAddress: walletAddress || 'undefined'
  });

  try {
    // Use the same backend infrastructure (pass walletAddress for 0G models)
    const backendResponse = await routeToBackend({
      prompt,
      modelId,
      walletAddress
    });

    log.debug('Backend response received for chat', {
      hasData: !!backendResponse.data,
      hasError: !!backendResponse.error,
      model: backendResponse.metadata?.model || modelId
    });

    if (backendResponse.error) {
      throw new Error(backendResponse.error);
    }

    // For Gemini models, response is in data field
    const responseText = backendResponse.data || backendResponse.response || '';

    if (!responseText) {
      throw new Error('Empty response from AI');
    }

    log.debug('Chat response parsed successfully', {
      responseLength: responseText.length,
      fullResponse: responseText
    });

    return responseText;

  } catch (error) {
    log.debug('Chat AI request failed', { error: String(error) });
    
    // Return a fallback message instead of throwing
    return `I apologize, but I'm having trouble connecting to the AI service right now (${String(error).replace('Error: ', '')}). Please try again in a moment.`;
  }
}

/**
 * Helper to get selected model from terminal context
 */
export function getSelectedModel(modelRef: any): string {
  try {
    const modelState = modelRef?.getSnapshot();
    const selectedModel = modelState?.context?.selectedModel;
    
    log.debug('Retrieved selected model from modelRef', { 
      selectedModel,
      hasModelRef: !!modelRef,
      hasContext: !!modelState?.context
    });
    
    return selectedModel || 'gemini-2.5-flash-auto';
  } catch (error) {
    log.debug('Failed to get selected model, using default', { error: String(error) });
    return 'gemini-2.5-flash-auto';
  }
}