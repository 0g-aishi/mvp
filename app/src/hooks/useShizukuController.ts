/**
 * Shizuku Live2D Controller Hook
 * Level 1100 Implementation with VTubeStudio-inspired Parameter Control
 * 
 * Maps AI JSON responses to Live2D model parameters
 */

import { useCallback, useRef } from 'react';
import type { Live2DModelRef } from '@/components/live2d/utils/live2d-types';
import type { ShizukuResponse } from '@/hooks/useShizukuAI';
import { logger } from '@/lib/logger';

// Enhanced expression mapping for new emotion system
const EMOTION_MAP = {
  love: '爱心眼',
  starry: '星星眼', 
  angry: '生气',
  crying: '哭哭',
  dark: '黑脸',
  blush: '脸红',
  blank: '空白眼',
  dizzy: '蚊香眼',
  none: null
};

// Hand items mapping (AI-controlled)
const HAND_ITEM_MAP = {
  gaming: '游戏机',
  microphone: '麦克风',
  tea: '茶杯',
  heart: '比心',
  board: '写字板',
  none: null
};

// Enhanced decorations with intensity levels
const DECORATION_INTENSITY_MAP = {
  blush: {
    none: null,
    light: '脸红_轻',
    medium: '脸红',
    heavy: '脸红_重'
  },
  tears: {
    none: null,
    light: '眼泪_轻',
    flowing: '眼泪',
    streaming: '眼泪_重'
  },
  sweat: {
    none: null,
    light: '汗滴_轻',
    nervous: '汗滴',
    heavy: '汗滴_重'
  }
};

interface UseShizukuControllerOptions {
  enableDebugLogs?: boolean;
  smoothTransitions?: boolean;
  transitionDuration?: number;
  speechRate?: number; // ms per character for mouth_open_timeline playback
}

export const useShizukuController = (
  modelRef: React.RefObject<Live2DModelRef>,
  options: UseShizukuControllerOptions = {}
) => {
  const log = logger.child({ component: 'useShizukuController' });
  const {
    enableDebugLogs = process.env.NEXT_PUBLIC_DREAM_TEST === 'true',
    smoothTransitions = true,
    transitionDuration = 500,
    speechRate = 120 // ms per character
  } = options;

  const lastAppliedStateRef = useRef<ShizukuResponse | null>(null);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mouthTimelineTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const physicsTimelineTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Smooth parameter transition utility
  const smoothSetParameter = useCallback((
    parameterId: string, 
    targetValue: number, 
    duration: number = transitionDuration
  ) => {
    if (!modelRef.current || !smoothTransitions) {
      modelRef.current?.setParameterValue(parameterId, targetValue);
      return;
    }

    const currentValue = modelRef.current.getParameterValue(parameterId);
    const startTime = Date.now();
    const valueDiff = targetValue - currentValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const eased = 1 - Math.pow(1 - progress, 3);
      const newValue = currentValue + (valueDiff * eased);
      
      modelRef.current?.setParameterValue(parameterId, newValue);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [modelRef, smoothTransitions, transitionDuration]);

  // NEW: Play mouth_open_timeline for character-level lip sync
  const playMouthTimeline = useCallback((timeline: number[], text: string) => {
    if (!modelRef.current || !timeline.length) return;

    // Clear any existing mouth timeline
    if (mouthTimelineTimeoutRef.current) {
      clearTimeout(mouthTimelineTimeoutRef.current);
    }

    let currentIndex = 0;
    
    const playNextFrame = () => {
      if (currentIndex >= timeline.length || !modelRef.current) return;

      const mouthValue = timeline[currentIndex] / 100; // Convert 0-40 to 0-0.4
      smoothSetParameter('ParamMouthOpenY', mouthValue, 50); // Fast transitions for speech

      if (enableDebugLogs && currentIndex < 10) { // Log first 10 chars to avoid spam
        log.debug(`Char "${text[currentIndex]}" -> ${timeline[currentIndex]}% (${mouthValue})`);
      }

      currentIndex++;
      
      if (currentIndex < timeline.length) {
        mouthTimelineTimeoutRef.current = setTimeout(playNextFrame, speechRate);
      } else {
        // Timeline finished, return to base mouth openness
        setTimeout(() => {
          if (modelRef.current) {
            smoothSetParameter('ParamMouthOpenY', 0, transitionDuration);
          }
        }, speechRate);
      }
    };

    playNextFrame();
  }, [modelRef, speechRate, enableDebugLogs, smoothSetParameter, transitionDuration]);

  // NEW: Play physics_timeline for complex animations
  const playPhysicsTimeline = useCallback((timeline: Array<{
    headMovement?: { x?: number; y?: number; z?: number };
    bodyMovement?: { x?: number; y?: number; z?: number };
    duration: number;
  }>) => {
    if (!modelRef.current || !timeline.length) return;

    // Clear any existing physics timeline
    if (physicsTimelineTimeoutRef.current) {
      clearTimeout(physicsTimelineTimeoutRef.current);
    }

    let currentIndex = 0;

    const playNextStep = () => {
      if (currentIndex >= timeline.length || !modelRef.current) return;

      const step = timeline[currentIndex];
      
      // Apply head movement if specified
      if (step.headMovement) {
        if (step.headMovement.x !== undefined) smoothSetParameter('ParamAngleX', step.headMovement.x, step.duration);
        if (step.headMovement.y !== undefined) smoothSetParameter('ParamAngleY', step.headMovement.y, step.duration);
        if (step.headMovement.z !== undefined) smoothSetParameter('ParamAngleZ', step.headMovement.z, step.duration);
      }

      // Apply body movement if specified
      if (step.bodyMovement) {
        if (step.bodyMovement.x !== undefined) smoothSetParameter('ParamBodyAngleX', step.bodyMovement.x, step.duration);
        if (step.bodyMovement.y !== undefined) smoothSetParameter('ParamBodyAngleY', step.bodyMovement.y, step.duration);
        if (step.bodyMovement.z !== undefined) smoothSetParameter('ParamBodyAngleZ', step.bodyMovement.z, step.duration);
      }

      if (enableDebugLogs) {
        log.debug(`Physics Timeline Step ${currentIndex + 1}/${timeline.length}`, { step });
      }

      currentIndex++;
      
      if (currentIndex < timeline.length) {
        physicsTimelineTimeoutRef.current = setTimeout(playNextStep, step.duration);
      }
    };

    playNextStep();
  }, [modelRef, enableDebugLogs, smoothSetParameter]);

  // Apply emotion expressions with intensity support
  const applyEmotions = useCallback((emotions: ShizukuResponse['emotions']) => {
    if (!modelRef.current || emotions.base === 'none') return;

    try {
      const baseExpression = EMOTION_MAP[emotions.base as keyof typeof EMOTION_MAP];
      if (baseExpression) {
        // Apply base emotion
        modelRef.current.setExpression(baseExpression);
        
        // Apply intensity if the model supports expression intensity
        // This is a future enhancement - for now we just log it
        if (emotions.intensity !== undefined && emotions.intensity !== 1.0) {
          // Could be implemented as expression parameter scaling
          if (enableDebugLogs) {
            log.debug(`Emotion Intensity: ${emotions.base} at ${emotions.intensity * 100}%`);
          }
        }
      }

      // Apply eye effects if specified and not none
      if (emotions.eyeEffect !== 'none') {
        const eyeExpression = EMOTION_MAP[emotions.eyeEffect as keyof typeof EMOTION_MAP];
        if (eyeExpression) {
          modelRef.current.setExpression(eyeExpression);
        }
      }

      if (enableDebugLogs) {
        log.debug('Applied emotions', {
          base: emotions.base,
          intensity: emotions.intensity,
          eyeEffect: emotions.eyeEffect,
          expression: baseExpression
        });
      }
    } catch (error) {
      log.warn('Failed to apply emotions', { error });
    }
  }, [modelRef, enableDebugLogs]);

  // Apply mouth parameters with lip sync support
  const applyMouth = useCallback((mouth: ShizukuResponse['mouth']) => {
    if (!modelRef.current) return;

    try {
      // Convert 0-100 range to 0-1 for ParamMouthOpenY
      const normalizedOpenness = mouth.openness / 100;
      smoothSetParameter('ParamMouthOpenY', normalizedOpenness);

      // Convert -100 to 100 range to -1 to 1 for ParamMouthForm
      const normalizedForm = mouth.form / 100;
      smoothSetParameter('ParamMouthForm', normalizedForm);

      // Lip sync is handled by the speech system, we just record the preference
      if (enableDebugLogs) {
        log.debug('Applied mouth', {
          openness: mouth.openness,
          form: mouth.form,
          lipSync: mouth.lipSync
        });
      }
    } catch (error) {
      log.warn('Failed to apply mouth parameters', { error });
    }
  }, [modelRef, enableDebugLogs, smoothSetParameter]);

  // NEW: Apply hand items (AI-controlled, mutually exclusive)
  const applyHandItem = useCallback((handItem: string) => {
    if (!modelRef.current || handItem === 'none') return;

    try {
      const expressionName = HAND_ITEM_MAP[handItem as keyof typeof HAND_ITEM_MAP];
      if (expressionName) {
        modelRef.current.setExpression(expressionName);
      }

      if (enableDebugLogs) {
        log.debug('Applied hand item', { handItem });
      }
    } catch (error) {
      log.warn('Failed to apply hand item', { error });
    }
  }, [modelRef, enableDebugLogs]);

  // Enhanced decorations with intensity levels
  const applyDecorations = useCallback((decorations: ShizukuResponse['decorations']) => {
    if (!modelRef.current) return;

    try {
      // Apply blush with intensity
      if (decorations.blush !== 'none') {
        const blushExpression = DECORATION_INTENSITY_MAP.blush[decorations.blush as keyof typeof DECORATION_INTENSITY_MAP.blush];
        if (blushExpression) {
          modelRef.current.setExpression(blushExpression);
        }
      }

      // Apply tears with intensity  
      if (decorations.tears !== 'none') {
        const tearExpression = DECORATION_INTENSITY_MAP.tears[decorations.tears as keyof typeof DECORATION_INTENSITY_MAP.tears];
        if (tearExpression) {
          modelRef.current.setExpression(tearExpression);
        }
      }

      // Apply sweat with intensity
      if (decorations.sweat !== 'none') {
        const sweatExpression = DECORATION_INTENSITY_MAP.sweat[decorations.sweat as keyof typeof DECORATION_INTENSITY_MAP.sweat];
        if (sweatExpression) {
          modelRef.current.setExpression(sweatExpression);
        }
      }

      // Apply anger mark (boolean)
      if (decorations.anger_mark) {
        modelRef.current.setExpression('愤怒标记');
      }

      if (enableDebugLogs) {
        log.debug('Applied decorations', { decorations });
      }
    } catch (error) {
      log.warn('Failed to apply decorations', { error });
    }
  }, [modelRef, enableDebugLogs]);


  // Apply physics parameters (head, body, breathing, eyes)
  const applyPhysics = useCallback((physics: ShizukuResponse['physics']) => {
    if (!modelRef.current) return;

    try {
      // Head movement (AI mode maintains control over these)
      smoothSetParameter('ParamAngleX', physics.headMovement.x);
      smoothSetParameter('ParamAngleY', physics.headMovement.y);
      smoothSetParameter('ParamAngleZ', physics.headMovement.z);

      // Body movement
      smoothSetParameter('ParamBodyAngleX', physics.bodyMovement.x);
      smoothSetParameter('ParamBodyAngleY', physics.bodyMovement.y);
      smoothSetParameter('ParamBodyAngleZ', physics.bodyMovement.z);

      // Breathing intensity
      smoothSetParameter('ParamBreath', physics.breathing);

      // Eye tracking (in AI mode, eyes should look at user)
      // We keep this for future use, but in current AI mode implementation,
      // eyes are set to neutral position
      if (physics.eyeTracking.x !== 0 || physics.eyeTracking.y !== 0) {
        smoothSetParameter('ParamEyeBallX', physics.eyeTracking.x);
        smoothSetParameter('ParamEyeBallY', physics.eyeTracking.y);
      }

      if (enableDebugLogs) {
        log.debug('Applied physics', { physics });
      }
    } catch (error) {
      log.warn('Failed to apply physics', { error });
    }
  }, [modelRef, enableDebugLogs, smoothSetParameter]);

  // Apply form preset (overrides individual settings)
  const applyFormPreset = useCallback((formPreset: string | null) => {
    if (!modelRef.current || !formPreset) return;

    try {
      // Use the existing form preset system from Live2D model
      if (modelRef.current.applyFormPreset) {
        modelRef.current.applyFormPreset(formPreset as any);
      }

      if (enableDebugLogs) {
        log.debug('Applied form preset', { formPreset });
      }
    } catch (error) {
      log.warn('Failed to apply form preset', { error });
    }
  }, [modelRef, enableDebugLogs]);

  // Main function to apply complete Shizuku response to Live2D model
  const applyShizukuResponse = useCallback((response: ShizukuResponse) => {
    if (!modelRef.current) {
      log.warn('Model not ready');
      return;
    }

    // Clear any existing transitions and timelines
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    if (mouthTimelineTimeoutRef.current) {
      clearTimeout(mouthTimelineTimeoutRef.current);
    }
    if (physicsTimelineTimeoutRef.current) {
      clearTimeout(physicsTimelineTimeoutRef.current);
    }

    try {
      if (enableDebugLogs) {
        log.debug('Applying enhanced Shizuku response', {
          text: response.text.substring(0, 50) + '...',
          mouth_timeline_length: response.mouth_open_timeline.length,
          emotion: response.emotions.base,
          emotion_intensity: response.emotions.intensity,
          hand_item: response.handItem,
          has_physics_timeline: !!response.physics_timeline,
          breathing: response.physics.breathing
        });
      }

      // Apply in enhanced order:
      // 1. Emotions with intensity (highest visual priority)
      applyEmotions(response.emotions);

      // 2. Decorations with intensity levels
      applyDecorations(response.decorations);

      // 3. Hand items (AI-controlled accessories)
      applyHandItem(response.handItem);

      // 4. Physics parameters (always applied for "life")
      applyPhysics(response.physics);

      // 5. Base mouth parameters (before timeline)
      applyMouth(response.mouth);

      // 6. NEW: Start mouth_open_timeline playback for lip sync
      if (response.mouth_open_timeline && response.mouth_open_timeline.length > 0) {
        playMouthTimeline(response.mouth_open_timeline, response.text);
      }

      // 7. NEW: Start physics_timeline if provided (for complex animations)
      if (response.physics_timeline && response.physics_timeline.length > 0) {
        playPhysicsTimeline(response.physics_timeline);
      }

      // Store the last applied state
      lastAppliedStateRef.current = response;

      if (enableDebugLogs) {
        log.debug('Successfully applied all enhanced parameters');
      }

    } catch (error) {
      log.error('Failed to apply Shizuku response', { error });
    }
  }, [
    modelRef, 
    enableDebugLogs,
    applyEmotions,
    applyDecorations,
    applyHandItem,
    applyPhysics,
    applyMouth,
    playMouthTimeline,
    playPhysicsTimeline
  ]);

  // Reset to neutral state
  const resetToNeutral = useCallback(() => {
    if (!modelRef.current) return;

    try {
      // Reset expressions
      modelRef.current.resetExpression();

      // Reset physics to neutral
      smoothSetParameter('ParamAngleX', 0);
      smoothSetParameter('ParamAngleY', 0);
      smoothSetParameter('ParamAngleZ', 0);
      smoothSetParameter('ParamBodyAngleX', 0);
      smoothSetParameter('ParamBodyAngleY', 0);
      smoothSetParameter('ParamBodyAngleZ', 0);
      smoothSetParameter('ParamBreath', 0.5);
      smoothSetParameter('ParamEyeBallX', 0);
      smoothSetParameter('ParamEyeBallY', 0);

      // Reset mouth
      smoothSetParameter('ParamMouthOpenY', 0);
      smoothSetParameter('ParamMouthForm', 0);

      lastAppliedStateRef.current = null;

      if (enableDebugLogs) {
        log.debug('Reset to neutral state');
      }
    } catch (error) {
      log.warn('Failed to reset to neutral', { error });
    }
  }, [modelRef, enableDebugLogs, smoothSetParameter]);

  return {
    applyShizukuResponse,
    resetToNeutral,
    lastAppliedState: lastAppliedStateRef.current,
    
    // NEW: Timeline playback functions
    playMouthTimeline,
    playPhysicsTimeline,
    
    // Individual parameter application functions (for fine control)
    applyEmotions,
    applyMouth,
    applyHandItem,
    applyDecorations,
    applyPhysics,
    
    // Legacy function kept for compatibility
    applyFormPreset
  };
};