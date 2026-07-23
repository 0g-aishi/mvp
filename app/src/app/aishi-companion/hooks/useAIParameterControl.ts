/**
 * @fileoverview AI Parameter Control Hook
 * @description Manages Live2D parameter state and executes AI-driven animations
 */

import { useRef, useState, useCallback } from 'react';
import type { Live2DModelRef } from '@/components/live2d/utils/live2d-types';
import {
  parseAIResponse,
  buildParameterUpdates,
  getDefaultParameterValues,
  type ParsedAIResponse
} from '../services/aiParameterService';
import { ParameterAnimator } from '../services/parameterAnimator';

import { logger } from '@/lib/logger';

const log = logger.child({ component: 'useAIParameterControl' });

/**
 * Hook for managing AI-controlled Live2D parameters
 */
export const useAIParameterControl = (modelRef: React.RefObject<Live2DModelRef>) => {
  const animatorRef = useRef(new ParameterAnimator());
  const expressionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [currentValues, setCurrentValues] = useState<Map<string, number>>(
    getDefaultParameterValues()
  );

  const [isAnimating, setIsAnimating] = useState(false);

  /**
   * Update single parameter value
   */
  const updateParameter = useCallback((paramId: string, value: number) => {
    if (!modelRef.current) {
      log.debug('Cannot update parameter - model ref is null');
      return;
    }

    modelRef.current.setParameterValue(paramId, value);
    setCurrentValues(prev => {
      const updated = new Map(prev);
      updated.set(paramId, value);
      return updated;
    });

    log.debug(`Parameter updated: ${paramId} = ${value}`);
  }, [modelRef]);

  /**
   * Process AI response and execute parameter animations
   * Returns clean text without JSON blocks
   */
  const processAIResponse = useCallback(async (aiResponse: string): Promise<string> => {
    log.debug('Processing AI response for parameters', {
      responseLength: aiResponse.length
    });

    // Parse AI response
    const parsed = parseAIResponse(aiResponse, currentValues);

    log.debug('AI response parsed', {
      hasParameters: parsed.hasParameters,
      hasExpressions: parsed.hasExpressions,
      parameterCount: Object.keys(parsed.parameters).length,
      expressionCount: parsed.expressions.length
    });

    // Apply expressions (immediate, not animated)
    if (parsed.hasExpressions && modelRef.current) {
      log.debug('Applying expressions', { expressions: parsed.expressions });

      parsed.expressions.forEach(expr => {
        try {
          modelRef.current!.setExpression(expr);
        } catch (error) {
          log.debug(`Failed to set expression: ${expr}`, { error: String(error) });
        }
      });

      // Clear existing expression timeout
      if (expressionTimeoutRef.current) {
        clearTimeout(expressionTimeoutRef.current);
      }

      // Auto-reset expressions after 15 seconds
      expressionTimeoutRef.current = setTimeout(() => {
        if (modelRef.current) {
          modelRef.current.resetExpression();
          log.debug('Auto-reset expressions after 15 seconds');
        }
      }, 15000);
    }

    // Animate parameters if any
    if (parsed.hasParameters && modelRef.current) {
      setIsAnimating(true);

      // Build parameter updates
      const updates = buildParameterUpdates(parsed.parameters, currentValues);

      if (updates.length > 0) {
        // Create animation sequences
        const sequences = animatorRef.current.queueAnimations(updates);

        log.debug('Executing parameter animations', {
          sequenceCount: sequences.length,
          parameters: sequences.map(s => s.name)
        });

        // Execute animations
        await animatorRef.current.executeAnimations(sequences, modelRef.current);

        // Update state with final values
        setCurrentValues(prev => {
          const updated = new Map(prev);
          Object.entries(parsed.parameters).forEach(([paramId, value]) => {
            updated.set(paramId, value);
          });
          return updated;
        });

        log.debug('Animations complete, state updated');
      }

      setIsAnimating(false);
    }

    return parsed.text;
  }, [currentValues, modelRef]);

  /**
   * Reset all parameters to defaults
   */
  const resetAllParameters = useCallback(() => {
    if (!modelRef.current) return;

    const defaults = getDefaultParameterValues();

    defaults.forEach((value, paramId) => {
      modelRef.current!.setParameterValue(paramId, value);
    });

    setCurrentValues(defaults);
    log.debug('All parameters reset to defaults');
  }, [modelRef]);

  /**
   * Get current parameter values map
   */
  const getCurrentValues = useCallback((): Map<string, number> => {
    return new Map(currentValues);
  }, [currentValues]);

  /**
   * Cancel any active animations
   */
  const cancelAnimations = useCallback(() => {
    animatorRef.current.cancelAll();
    setIsAnimating(false);
    log.debug('Animations cancelled');
  }, []);

  return {
    currentValues,
    isAnimating,
    processAIResponse,
    resetAllParameters,
    getCurrentValues,
    updateParameter,
    cancelAnimations
  };
};
