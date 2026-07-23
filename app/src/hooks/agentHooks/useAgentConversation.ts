'use client';

import { useState } from 'react';
import { useWallet } from '../useWallet';
import { ConversationPrompt, ConversationResponse } from './useAgentConversationPrompt';
import { logger } from '@/lib/logger';

interface ConversationState {
  isLoading: boolean;
  error: string | null;
  aiResponse: ConversationAIResponse | null;
  parsedResponse: ParsedConversationResponse | null;
}

interface ConversationAIResponse {
  response: string;
  model: string;
  cost: number;
  chatId: string;
  responseTime: number;
  isValid: boolean;
}

interface ParsedConversationResponse {
  agentResponse: string;
  references: Array<{
    type: 'dream' | 'conversation' | 'monthly' | 'yearly';
    id: number;
    date: string;
    relevance: string;
  }>;
  emotionalMirror: {
    detected_emotion: string;
    matching_personality_trait: string;
    symbolic_connection: string;
  };
  nextQuestions: string[];
  conversationSummary: {
    topic: string;
    emotional_tone: string;
    key_insights: string[];
    analysis: string;
  };
}

export function useAgentConversation() {
  const [state, setState] = useState<ConversationState>({
    isLoading: false,
    error: null,
    aiResponse: null,
    parsedResponse: null
  });

  const { address } = useWallet();

  // Logger instance
  const log = logger.child({ component: 'useAgentConversation' });

  log.debug('useAgentConversation hook initialized');

  const resetConversation = () => {
    setState({
      isLoading: false,
      error: null,
      aiResponse: null,
      parsedResponse: null
    });
    log.debug('Conversation state reset');
  };

  /**
   * Sends conversation message to 0g-compute API - ONLY FOR CONVERSATIONS
   */
  const sendConversationMessage = async (
    conversationPrompt: ConversationPrompt
  ): Promise<ParsedConversationResponse | null> => {
    if (!address) {
      const error = 'Wallet not connected';
      setState(prev => ({ ...prev, error }));
      log.debug('Conversation failed - wallet not connected');
      return null;
    }

    if (!conversationPrompt.prompt.trim()) {
      const error = 'Conversation prompt is required';
      setState(prev => ({ ...prev, error }));
      log.debug('Conversation failed - no prompt');
      return null;
    }

    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null,
      aiResponse: null,
      parsedResponse: null
    }));

    try {
      log.debug('Starting conversation message', { 
        walletAddress: address,
        promptLength: conversationPrompt.prompt.length,
        isConversation: conversationPrompt.expectedFormat.isConversation
      });

      // Get API URL from environment
      const apiUrl = process.env.NEXT_PUBLIC_COMPUTE_API_URL || 'http://localhost:3001/api';
      
      log.debug('API URL configured', { apiUrl });

      // Send request to 0g-compute API (same endpoint, different parsing)
      const response = await fetch(`${apiUrl}/0g-compute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
          query: conversationPrompt.prompt
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const apiResult = await response.json();
      
      if (!apiResult.success) {
        throw new Error(apiResult.error || 'Conversation failed');
      }

      const aiResponse: ConversationAIResponse = apiResult.data;
      
      log.debug('AI conversation response received', {
        model: aiResponse.model,
        cost: aiResponse.cost,
        responseTime: aiResponse.responseTime,
        isValid: aiResponse.isValid,
        responseLength: aiResponse.response.length
      });

      // Parse AI response for conversation
      const parsedResponse = parseConversationResponse(
        aiResponse.response, 
        conversationPrompt.expectedFormat
      );
      
      if (!parsedResponse) {
        throw new Error('Failed to parse conversation response');
      }

      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        aiResponse,
        parsedResponse
      }));

      log.debug('Conversation completed successfully', {
        responseLength: parsedResponse.agentResponse.length,
        topic: parsedResponse.conversationSummary.topic,
        emotionalTone: parsedResponse.conversationSummary.emotional_tone,
        referencesCount: parsedResponse.references.length,
        nextQuestionsCount: parsedResponse.nextQuestions.length
      });

      return parsedResponse;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: errorMessage
      }));
      log.debug('Conversation failed', { error: errorMessage });
      return null;
    }
  };

  /**
   * Parses AI response text for CONVERSATION ONLY
   */
  const parseConversationResponse = (
    responseText: string, 
    expectedFormat: any
  ): ParsedConversationResponse | null => {
    try {
      log.debug('Parsing conversation response', { 
        responseLength: responseText.length,
        isConversation: expectedFormat.isConversation,
        needsStructuredResponse: expectedFormat.needsStructuredResponse
      });

      // Extract JSON blocks for conversation
      const jsonBlocks = extractJsonBlocks(responseText);
      
      if (jsonBlocks.length < 1) {
        // Fallback to basic response if no JSON found
        log.debug('No JSON blocks found, creating fallback response');
        return {
          agentResponse: responseText,
          references: [],
          emotionalMirror: {
            detected_emotion: 'neutral',
            matching_personality_trait: 'empathy',
            symbolic_connection: 'none'
          },
          nextQuestions: [],
          conversationSummary: {
            topic: 'general chat',
            emotional_tone: 'neutral',
            key_insights: ['user shared thoughts'],
            analysis: responseText // PEŁNA treść - bez obcinania
          }
        };
      }

      try {
        // Parse conversation JSON response
        const conversationData: ConversationResponse = JSON.parse(jsonBlocks[0]);
        
        if (!conversationData.agent_response || !conversationData.conversation_summary) {
          log.debug('Missing required fields in conversation JSON');
          throw new Error('Invalid conversation JSON structure');
        }

        const parsedResponse: ParsedConversationResponse = {
          agentResponse: conversationData.agent_response,
          references: conversationData.references || [],
          emotionalMirror: conversationData.emotional_mirror || {
            detected_emotion: 'neutral',
            matching_personality_trait: 'empathy',
            symbolic_connection: 'none'
          },
          nextQuestions: conversationData.next_questions || [],
          conversationSummary: conversationData.conversation_summary
        };

        log.debug('Conversation response parsed successfully', {
          responseLength: parsedResponse.agentResponse.length,
          topic: parsedResponse.conversationSummary.topic,
          emotionalTone: parsedResponse.conversationSummary.emotional_tone,
          referencesCount: parsedResponse.references.length
        });

        return parsedResponse;

      } catch (parseError) {
        log.debug('Failed to parse conversation JSON, using fallback', parseError);
        
        // Fallback to basic response
        return {
          agentResponse: responseText,
          references: [],
          emotionalMirror: {
            detected_emotion: 'neutral',
            matching_personality_trait: 'empathy',
            symbolic_connection: 'none'
          },
          nextQuestions: [],
          conversationSummary: {
            topic: 'general chat',
            emotional_tone: 'neutral',
            key_insights: ['user engaged in conversation'],
            analysis: responseText // PEŁNA treść - bez obcinania
          }
        };
      }

    } catch (error) {
      log.debug('Failed to parse conversation response', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      return null;
    }
  };

  /**
   * Extracts JSON blocks from AI response text
   */
  const extractJsonBlocks = (text: string): string[] => {
    const jsonBlocks: string[] = [];
    
    // Look for JSON blocks wrapped in ```json or just ```
    const jsonRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/g;
    let match;
    
    while ((match = jsonRegex.exec(text)) !== null) {
      jsonBlocks.push(match[1]);
    }
    
    // If no wrapped blocks found, look for standalone JSON objects
    if (jsonBlocks.length === 0) {
      const standaloneRegex = /\{[\s\S]*?\}/g;
      while ((match = standaloneRegex.exec(text)) !== null) {
        try {
          JSON.parse(match[0]); // Test if it's valid JSON
          jsonBlocks.push(match[0]);
        } catch {
          // Skip invalid JSON
        }
      }
    }
    
    log.debug('JSON blocks extracted for conversation', { count: jsonBlocks.length });
    return jsonBlocks;
  };

  return {
    isLoading: state.isLoading,
    error: state.error,
    aiResponse: state.aiResponse,
    parsedResponse: state.parsedResponse,
    resetConversation,
    sendConversationMessage
  };
} 