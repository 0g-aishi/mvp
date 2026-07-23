/**
 * Shizuku AI Integration Hook
 * Level 1100 Implementation with Gemini Native JSON Schema
 * 
 * Handles communication with 0g-compute backend and Gemini AI
 */

import { useState, useCallback, useRef } from 'react';
import {
  buildShizukuPrompt
} from '@/prompts/shizuku';
import { SHIZUKU_MASTER_PROMPT_COMPLETE } from '@/prompts/shizuku-complete';
import { logger } from '@/lib/logger';

// Enhanced type definitions based on new JSON Schema
export interface ShizukuResponse {
  text: string;
  mouth_open_timeline: number[];
  emotions: {
    base: string;
    intensity: number;
    eyeEffect: string;
  };
  mouth: {
    openness: number;
    form: number;
    lipSync: boolean;
  };
  handItem: string;
  decorations: {
    blush: string;
    tears: string;
    anger_mark: boolean;
    sweat: string;
  };
  physics: {
    headMovement: { x: number; y: number; z: number };
    bodyMovement: { x: number; y: number; z: number };
    breathing: number;
    eyeTracking: { x: number; y: number };
    // Enhanced physics parameters
    eyeOpening?: { left: number; right: number };
    eyebrowMovement?: { leftY: number; rightY: number; leftForm: number; rightForm: number };
    hairDynamics?: { front: number; side: number; back: number; accessories: number };
    bodyDynamics?: { chest: number; skirt: number; legs: number };
    specialFeatures?: { animalEars: number; wings: number };
  };
  physics_timeline?: Array<{
    headMovement?: { x?: number; y?: number; z?: number };
    bodyMovement?: { x?: number; y?: number; z?: number };
    eyeOpening?: { left?: number; right?: number };
    eyebrowMovement?: { leftY?: number; rightY?: number; leftForm?: number; rightForm?: number };
    hairDynamics?: { front?: number; side?: number; back?: number; accessories?: number };
    bodyDynamics?: { chest?: number; skirt?: number; legs?: number };
    specialFeatures?: { animalEars?: number; wings?: number };
    duration: number;
  }>;
  advanced_physics_timeline?: Array<{
    headMovement?: { x?: number; y?: number; z?: number };
    bodyMovement?: { x?: number; y?: number; z?: number };
    eyeOpening?: { left?: number; right?: number };
    eyebrowMovement?: { leftY?: number; rightY?: number; leftForm?: number; rightForm?: number };
    hairDynamics?: { front?: number; side?: number; back?: number; accessories?: number };
    bodyDynamics?: { chest?: number; skirt?: number; legs?: number };
    specialFeatures?: { animalEars?: number; wings?: number };
    breathing?: number;
    eyeTracking?: { x?: number; y?: number };
    duration: number;
  }>;
}

interface UseShizukuAIOptions {
  backendUrl?: string;
  temperature?: number;
  maxTokens?: number;
  enableTestMode?: boolean;
  useEnhancedPhysics?: boolean; // New option to enable full physics
}

interface ShizukuAIState {
  isLoading: boolean;
  error: string | null;
  lastResponse: ShizukuResponse | null;
  conversationHistory: string[];
}

export const useShizukuAI = (options: UseShizukuAIOptions = {}) => {
  const log = logger.child({ component: 'useShizukuAI' });
  const {
    backendUrl = process.env.NEXT_PUBLIC_COMPUTE_API_URL || 'http://localhost:3001/api',
    temperature = 0.8,
    maxTokens = 2048,
    enableTestMode = process.env.NEXT_PUBLIC_LIVE2MODEL_SHIZUKU_TEST === 'true',
    useEnhancedPhysics = process.env.NEXT_PUBLIC_SHIZUKU_ENHANCED_PHYSICS === 'true'
  } = options;

  // Debug log initialization
  log.debug('Hook initialized', {
    backendUrl,
    enableTestMode,
    isAIMode: process.env.NEXT_PUBLIC_LIVE2MODEL_AI,
    temperature,
    maxTokens
  });

  const [state, setState] = useState<ShizukuAIState>({
    isLoading: false,
    error: null,
    lastResponse: null,
    conversationHistory: []
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Parse JSON from Gemini response (may be wrapped in markdown)
  const parseShizukuResponse = useCallback((rawResponse: string): ShizukuResponse => {
    try {
      // Safety check for input type
      if (!rawResponse || typeof rawResponse !== 'string') {
        throw new Error(`Invalid input type: ${typeof rawResponse}`);
      }

      // Handle markdown code block wrapping
      let jsonStr = rawResponse.trim();
      
      // Remove markdown code block if present
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const parsed = JSON.parse(jsonStr);
      
      // Flexible parsing to handle different response formats
      // AI might return mouth_open_timeline in different places
      if (!parsed.mouth_open_timeline && parsed.mouth?.mouth_open_timeline) {
        parsed.mouth_open_timeline = parsed.mouth.mouth_open_timeline;
      }
      
      // Handle hand_item in different locations
      if (!parsed.handItem) {
        if (parsed.hand_item) {
          parsed.handItem = parsed.hand_item;
        } else if (parsed.accessories?.hand_item) {
          parsed.handItem = parsed.accessories.hand_item;
        } else {
          parsed.handItem = 'none';
        }
      }
      
      // Ensure decorations have proper structure
      if (!parsed.decorations || typeof parsed.decorations !== 'object') {
        parsed.decorations = {
          blush: 'none',
          tears: 'none',
          anger_mark: false,
          sweat: 'none'
        };
      }
      
      // Validate core required fields
      if (!parsed.text || !parsed.emotions || !parsed.physics) {
        throw new Error('Missing required fields in AI response');
      }
      
      // If mouth_open_timeline is still missing, generate default
      if (!parsed.mouth_open_timeline) {
        log.warn('mouth_open_timeline missing, generating default');
        parsed.mouth_open_timeline = Array(parsed.text.length).fill(20);
      }

      // Validate mouth_open_timeline length matches text length
      if (parsed.mouth_open_timeline.length !== parsed.text.length) {
        log.warn(`mouth_open_timeline length (${parsed.mouth_open_timeline.length}) doesn't match text length (${parsed.text.length})`);
        // Auto-fix by padding or truncating
        const targetLength = parsed.text.length;
        if (parsed.mouth_open_timeline.length < targetLength) {
          // Pad with average values
          const avg = parsed.mouth_open_timeline.reduce((a: number, b: number) => a + b, 0) / parsed.mouth_open_timeline.length;
          while (parsed.mouth_open_timeline.length < targetLength) {
            parsed.mouth_open_timeline.push(Math.round(avg));
          }
        } else {
          // Truncate to match
          parsed.mouth_open_timeline = parsed.mouth_open_timeline.slice(0, targetLength);
        }
      }
      
      // Return with type safety
      return parsed as ShizukuResponse;

    } catch (error) {
      log.error('Failed to parse response', { error, rawResponse });

      // Return fallback response with new schema
      const fallbackText = "Sorry, I'm a bit confused right now...";
      return {
        text: fallbackText,
        mouth_open_timeline: Array(fallbackText.length).fill(15), // Generate timeline for fallback
        emotions: { base: "dizzy", intensity: 0.6, eyeEffect: "none" },
        mouth: { openness: 30, form: -20, lipSync: true },
        handItem: "none",
        decorations: {
          blush: "none",
          tears: "none", 
          anger_mark: false,
          sweat: "light"
        },
        physics: {
          headMovement: { x: 0, y: -5, z: -2 },
          bodyMovement: { x: 0, y: 0, z: 0 },
          breathing: 0.4,
          eyeTracking: { x: 0, y: 0 },
          eyeOpening: { left: 0.6, right: 0.6 },
          eyebrowMovement: { leftY: -0.3, rightY: -0.3, leftForm: -0.5, rightForm: -0.5 },
          hairDynamics: { front: 0.1, side: 0.1, back: 0.1, accessories: 0.1 },
          bodyDynamics: { chest: 0.3, skirt: 0.1, legs: 0 },
          specialFeatures: { animalEars: 0.2, wings: 0 }
        }
      };
    }
  }, []);

  // Send message to Shizuku and get AI response
  const sendMessage = useCallback(async (userMessage: string): Promise<ShizukuResponse> => {
    // Abort previous request if still running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }));

    try {
      // Build prompt with user message and conversation history
      const prompt = useEnhancedPhysics
        ? SHIZUKU_MASTER_PROMPT_COMPLETE + `\n\n## CONVERSATION_HISTORY\n${state.conversationHistory.slice(-3).join('\n')}\n\n## USER_MESSAGE\n${userMessage}`
        : buildShizukuPrompt(userMessage, state.conversationHistory);

      log.debug('Sending prompt to Gemini', {
        userMessage,
        promptLength: prompt.length,
        conversationHistory: state.conversationHistory.length
      });

      // Send request to 0g-compute backend
      const response = await fetch(`${backendUrl}/api/gemini`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          temperature,
          maxTokens
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      log.debug('Raw backend response', {
        success: result.success,
        dataType: typeof result.data,
        dataLength: typeof result.data === 'string' ? result.data.length : 'N/A',
        error: result.error,
        // Log first 200 chars of response
        preview: typeof result.data === 'string' ? result.data.substring(0, 200) + '...' : result.data
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to get AI response');
      }

      // Parse the AI response - handle different response formats
      let responseText: string;
      if (typeof result.data === 'string') {
        responseText = result.data;
      } else if (result.data && typeof result.data === 'object') {
        // If backend returns nested structure, extract text
        responseText = result.data.text || JSON.stringify(result.data);
      } else {
        throw new Error('Invalid response format from backend');
      }

      const shizukuResponse = parseShizukuResponse(responseText);

      // Update conversation history
      const newHistory = [
        ...state.conversationHistory,
        `User: ${userMessage}`,
        `Shizuku: ${shizukuResponse.text}`
      ].slice(-6); // Keep last 3 exchanges

      setState(prev => ({
        ...prev,
        isLoading: false,
        lastResponse: shizukuResponse,
        conversationHistory: newHistory,
        error: null
      }));

      log.debug('Response parsed successfully', {
        text: shizukuResponse.text,
        mouth_timeline_length: shizukuResponse.mouth_open_timeline.length,
        emotion: shizukuResponse.emotions.base,
        emotion_intensity: shizukuResponse.emotions.intensity,
        hand_item: shizukuResponse.handItem,
        breathing: shizukuResponse.physics.breathing,
        has_physics_timeline: !!shizukuResponse.physics_timeline
      });

      return shizukuResponse;

    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Request was aborted, don't update state
        return parseShizukuResponse('{"text":"Request aborted","emotions":{"base":"none","eyeEffect":"none"}}');
      }

      const errorMessage = error.message || 'Unknown error occurred';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));

      log.error('Error', { errorMessage });

      // Return error response with new schema
      const errorText = `Sorry, I encountered an issue: ${errorMessage}`;
      return parseShizukuResponse(JSON.stringify({
        text: errorText,
        mouth_open_timeline: Array(errorText.length).fill(10), // Generate timeline for error
        emotions: { base: "crying", intensity: 0.7, eyeEffect: "none" },
        mouth: { openness: 20, form: -50, lipSync: true },
        handItem: "none",
        decorations: {
          blush: "none",
          tears: "flowing",
          anger_mark: false,
          sweat: "nervous"
        },
        physics: {
          headMovement: { x: 0, y: -10, z: -3 },
          bodyMovement: { x: 0, y: 0, z: 0 },
          breathing: 0.3,
          eyeTracking: { x: 0, y: 0 },
          eyeOpening: { left: 0.5, right: 0.5 },
          eyebrowMovement: { leftY: -0.5, rightY: -0.5, leftForm: -0.7, rightForm: -0.7 },
          hairDynamics: { front: 0.1, side: 0.1, back: 0.1, accessories: 0 },
          bodyDynamics: { chest: 0.2, skirt: 0, legs: 0 },
          specialFeatures: { animalEars: 0.1, wings: 0 }
        }
      }));
    }
  }, [backendUrl, temperature, maxTokens, enableTestMode, state.conversationHistory, parseShizukuResponse]);

  // Clear conversation history
  const clearHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      conversationHistory: [],
      lastResponse: null,
      error: null
    }));
  }, []);

  // Cancel current request
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    // State
    isLoading: state.isLoading,
    error: state.error,
    lastResponse: state.lastResponse,
    conversationHistory: state.conversationHistory,
    
    // Actions
    sendMessage,
    clearHistory,
    cancelRequest,
    
    // Utilities
    parseShizukuResponse
  };
};