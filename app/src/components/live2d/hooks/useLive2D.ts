// Core hook for managing Live2D model lifecycle
import { useEffect, useRef, useState, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { Live2DModel, type Cubism4InternalModel, type Cubism4ModelSettings, MotionPreloadStrategy } from 'pixi-live2d-display-lipsyncpatch/cubism4';
import {
  createPixiApp,
  loadLive2DModel,
  cleanupPixiApp,
  cleanupLive2DModel,
  createPerformanceMonitor,
} from '../utils/live2d-loader';
import type { Live2DModelRef, Live2DPerformanceMetrics } from '../utils/live2d-types';
import { ExpressionCategoryManager } from '../utils/ExpressionCategoryManager';
import { EXPRESSION_PRESETS } from '../utils/expression-categories';
import { logger } from '@/lib/logger/logger';

interface UseLive2DOptions {
  modelPath: string;
  width: number;
  height: number;
  scale?: number;
  transparent?: boolean;
  autoPlay?: boolean;
  onLoad?: () => void;
  onError?: (error: string) => void;
  onMotionStart?: (group: string, index: number) => void;
  onMotionFinish?: (group: string, index: number) => void;
  onHit?: (hitAreaNames: string[]) => void;
}

export const useLive2D = (options: UseLive2DOptions) => {
  const {
    modelPath,
    width,
    height,
    scale = 1,
    transparent = false,
    autoPlay = true,
    onLoad,
    onError,
    onMotionStart,
    onMotionFinish,
    onHit,
  } = options;

  const log = logger.child({ component: 'useLive2D' });

  // Debug log AI mode on hook initialization
  const isAIMode = process.env.NEXT_PUBLIC_LIVE2MODEL_AI === 'true';
  log.debug('Hook initialized with AI Mode', {
    isAIMode,
    NEXT_PUBLIC_LIVE2MODEL_AI: process.env.NEXT_PUBLIC_LIVE2MODEL_AI
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const modelRef = useRef<Live2DModel | null>(null);
  const performanceMonitorRef = useRef<ReturnType<typeof createPerformanceMonitor> | null>(null);
  const expressionManagerRef = useRef<ExpressionCategoryManager>(
    new ExpressionCategoryManager(process.env.NEXT_PUBLIC_LIVE2MODEL_TEST === 'true')
  );
  const targetDimensionsRef = useRef({ width, height, scale });
  const resizeModel = useCallback((newWidth: number, newHeight: number) => {
    targetDimensionsRef.current.width = newWidth;
    targetDimensionsRef.current.height = newHeight;

    const app = appRef.current;
    const model = modelRef.current;

    if (!app || !model) return;

    app.renderer.resize(newWidth, newHeight);

    // Safe positioning with proper null checks
    if (model && !model.destroyed) {
      model.x = newWidth / 2;
      model.y = newHeight * 0.5;  // Center positioning (was 0.75 - too low!)
    }
  }, []);

  const updateScale = useCallback((newScale: number, x?: number, y?: number) => {
    targetDimensionsRef.current.scale = newScale;

    const model = modelRef.current;
    if (!model || model.destroyed) return;

    model.scale.set(newScale);

    // Only update position if explicitly provided
    if (typeof x === 'number') {
      model.x = x;
    }
    // Don't reset x if not provided - preserve current position

    if (typeof y === 'number') {
      model.y = y;
    }
    // Don't reset y if not provided - preserve current position
  }, []);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [metrics, setMetrics] = useState<Live2DPerformanceMetrics>({
    fps: 0,
    memory: 0,
    drawCalls: 0,
    textureCount: 0,
  });

  // Model control methods
  const playMotion = useCallback(async (group: string, index?: number, priority: number = 2): Promise<void> => {
    if (!modelRef.current) {
      log.warn('Model not loaded');
      return;
    }

    try {
      // Use the motion API with proper priority
      const actualIndex = index ?? 0;
      await modelRef.current.motion(group, actualIndex, priority);
    } catch (error) {
      log.error('Failed to play motion:', error);
    }
  }, []);

  const stopAllMotions = useCallback(() => {
    if (!modelRef.current) return;
    modelRef.current.internalModel.motionManager?.stopAllMotions();
  }, []);

  const setExpression = useCallback((expressionId: string | number) => {
    if (!modelRef.current) return;
    try {
      // Use category manager for string expressions
      if (typeof expressionId === 'string') {
        expressionManagerRef.current.applyExpression(expressionId);
      } else {
        // Fallback for numeric indices
        modelRef.current.expression(expressionId);
      }
    } catch (error) {
      log.warn('Failed to set expression:', error);
    }
  }, []);

  const resetExpression = useCallback(() => {
    if (!modelRef.current) return;
    try {
      expressionManagerRef.current.reset();
    } catch (error) {
      log.warn('Failed to reset expression:', error);
    }
  }, []);

  const lookAt = useCallback((x: number, y: number) => {
    if (!modelRef.current) return;
    
    // Don't respond to lookAt calls in AI mode
    const isAIMode = process.env.NEXT_PUBLIC_LIVE2MODEL_AI === 'true';
    if (isAIMode) return;
    
    modelRef.current.focus(x, y);
  }, []);

  const stopLookAt = useCallback(() => {
    if (!modelRef.current) return;
    
    // Don't respond to stopLookAt calls in AI mode
    const isAIMode = process.env.NEXT_PUBLIC_LIVE2MODEL_AI === 'true';
    if (isAIMode) return;
    
    modelRef.current.focus(modelRef.current.x, modelRef.current.y);
  }, []);

  const startLipSync = useCallback((audioLevel: number) => {
    if (!modelRef.current) return;
    try {
      (modelRef.current.internalModel as Cubism4InternalModel).coreModel.setParameterValueById('ParamMouthOpenY', audioLevel);
    } catch (error) {
      log.warn('Failed to start lip sync:', error);
    }
  }, []);

  const setLipSyncValue = useCallback((value: number) => {
    if (!modelRef.current) return;
    const clampedValue = Math.max(0, Math.min(1, value));
    try {
      (modelRef.current.internalModel as Cubism4InternalModel).coreModel.setParameterValueById('ParamMouthOpenY', clampedValue);
    } catch (error) {
      log.warn('Failed to set lip sync value:', error);
    }
  }, []);

  const stopLipSync = useCallback(() => {
    setLipSyncValue(0);
  }, [setLipSyncValue]);

  const hit = useCallback((x: number, y: number) => {
    if (!modelRef.current) return;
    
    const hitAreas = modelRef.current.hitTest(x, y);
    
    if (hitAreas.length > 0 && onHit) {
      onHit(hitAreas);
    }
  }, [onHit]);

  const getAvailableMotions = useCallback((): string[] => {
    if (!modelRef.current) return [];
    return Object.keys(modelRef.current.internalModel.motionManager.motionGroups || {});
  }, []);

  const getAvailableExpressions = useCallback((): string[] => {
    if (!modelRef.current) return [];
    
    // Debug logging for expression manager structure
    if (process.env.NEXT_PUBLIC_LIVE2MODEL_TEST === 'true') {
      log.debug('[DEBUG] ExpressionManager structure:', {
        motionManager: !!modelRef.current.internalModel.motionManager,
        expressionManager: !!modelRef.current.internalModel.motionManager.expressionManager,
        expressions: modelRef.current.internalModel.motionManager.expressionManager?.expressions,
        settings: (modelRef.current.internalModel.settings as Cubism4ModelSettings)?.expressions,
      });
    }
    
    const expressionManager = modelRef.current.internalModel.motionManager.expressionManager;
    
    // Method 1: Try to get from expressionManager.expressions
    if (expressionManager?.expressions) {
      try {
        if (Array.isArray(expressionManager.expressions)) {
          const names = expressionManager.expressions.map((exp: any) => exp.name || exp.Name || exp);
          if (names.length > 0) {
            if (process.env.NEXT_PUBLIC_LIVE2MODEL_TEST === 'true') {
              log.debug('[DEBUG] Got expressions from expressionManager.expressions:', names);
            }
            return names.filter(name => name && typeof name === 'string');
          }
        }
      } catch (error) {
        log.warn('[DEBUG] Failed to get expressions from expressionManager.expressions:', error);
      }
    }
    
    // Method 2: Try to get from settings.expressions
    const settings = modelRef.current.internalModel.settings as Cubism4ModelSettings;
    if (settings?.expressions && Array.isArray(settings.expressions)) {
      try {
        const names = settings.expressions.map((exp: any) => exp.Name || exp.name || exp);
        if (names.length > 0) {
          if (process.env.NEXT_PUBLIC_LIVE2MODEL_TEST === 'true') {
            log.debug('[DEBUG] Got expressions from settings.expressions:', names);
          }
          return names.filter(name => name && typeof name === 'string');
        }
      } catch (error) {
        log.warn('[DEBUG] Failed to get expressions from settings.expressions:', error);
      }
    }
    
    // Method 3: Try to get expression names from expressionManager definitions
    if (expressionManager?.definitions) {
      try {
        const names = expressionManager.definitions.map((def: any) => 
          def.Name || def.name || def.File?.replace('.exp3.json', '')
        );
        if (names.length > 0) {
          if (process.env.NEXT_PUBLIC_LIVE2MODEL_TEST === 'true') {
            log.debug('[DEBUG] Got expressions from definitions:', names);
          }
          return names.filter(name => name && typeof name === 'string');
        }
      } catch (error) {
        log.warn('[DEBUG] Failed to get expressions from definitions:', error);
      }
    }
    
    // Method 4: Check other possible properties
    if (expressionManager) {
      try {
        // Check other possible properties
        const possibleProps = ['names', 'expressionNames', '_expressions', 'expressionMap'];
        for (const prop of possibleProps) {
          if (expressionManager[prop]) {
            if (process.env.NEXT_PUBLIC_LIVE2MODEL_TEST === 'true') {
              log.debug(`[DEBUG] Found expressions in ${prop}:`, expressionManager[prop]);
            }
            if (Array.isArray(expressionManager[prop])) {
              return expressionManager[prop];
            } else if (typeof expressionManager[prop] === 'object') {
              return Object.keys(expressionManager[prop]);
            }
          }
        }
      } catch (error) {
        log.warn('[DEBUG] Failed to get expressions from expressionManager methods:', error);
      }
    }
    
    if (process.env.NEXT_PUBLIC_LIVE2MODEL_TEST === 'true') {
      log.warn('[DEBUG] No expressions found through any method');
    }
    
    return [];
  }, []);

  const getHitAreas = useCallback((): string[] => {
    if (!modelRef.current) return [];
    const hitAreas = modelRef.current.internalModel.hitAreas;
    return Object.keys(hitAreas || {});
  }, []);

  const getCurrentMotion = useCallback((): { group: string; index: number } | null => {
    // Currently no way to get detailed motion info from MotionManager
    // The 'playing' property is just a boolean
    return null;
  }, []);

  const getCurrentExpression = useCallback((): string | null => {
    if (!modelRef.current) return null;
    return modelRef.current.internalModel.motionManager.expressionManager?.currentExpression || null;
  }, []);

  const setParameterValue = useCallback((id: string, value: number, weight: number = 1) => {
    if (!modelRef.current) return;
    try {
      // Use setParameterValueById for Cubism 4 models
      (modelRef.current.internalModel as Cubism4InternalModel).coreModel.setParameterValueById(id, value, weight);
    } catch (error) {
      log.warn(`Failed to set parameter ${id}:`, error);
    }
  }, []);

  const getParameterValue = useCallback((id: string): number => {
    if (!modelRef.current) return 0;
    try {
      // Use getParameterValueById for Cubism 4 models
      return (modelRef.current.internalModel as Cubism4InternalModel).coreModel.getParameterValueById(id) || 0;
    } catch (error) {
      log.warn(`Failed to get parameter ${id}:`, error);
      return 0;
    }
  }, []);

  // Expression category methods
  const toggleExpression = useCallback((expressionName: string): boolean => {
    if (!modelRef.current) return false;
    return expressionManagerRef.current.toggleExpression(expressionName);
  }, []);

  const getActiveExpressions = useCallback((): string[] => {
    return expressionManagerRef.current.getActiveExpressions();
  }, []);

  const isExpressionActive = useCallback((expressionName: string): boolean => {
    return expressionManagerRef.current.isExpressionActive(expressionName);
  }, []);

  const applyFormPreset = useCallback((presetName: keyof typeof EXPRESSION_PRESETS): void => {
    if (!modelRef.current) return;
    expressionManagerRef.current.applyFormPreset(presetName);
  }, []);

  // Position control
  const updatePosition = useCallback((x: number, y: number) => {
    const model = modelRef.current;
    if (!model || model.destroyed) return;

    model.x = x;
    model.y = y;
  }, []);

  // Get current scale
  const getScale = useCallback((): number => {
    const model = modelRef.current;
    if (!model) return targetDimensionsRef.current.scale;
    return model.scale.x;
  }, []);

  // Get current position
  const getPosition = useCallback((): { x: number; y: number } => {
    const model = modelRef.current;
    if (!model) {
      return {
        x: targetDimensionsRef.current.width / 2,
        y: targetDimensionsRef.current.height / 2
      };
    }
    return { x: model.x, y: model.y };
  }, []);

  // Create model ref object
  const modelRefObject: Live2DModelRef = {
    playMotion,
    stopAllMotions,
    setExpression,
    resetExpression,
    toggleExpression,
    getActiveExpressions,
    isExpressionActive,
    applyFormPreset,
    lookAt,
    stopLookAt,
    hit,
    startLipSync,
    stopLipSync,
    setLipSyncValue,
    getAvailableMotions,
    getAvailableExpressions,
    getHitAreas,
    getCurrentMotion,
    getCurrentExpression,
    setParameterValue,
    getParameterValue,
    updateScale,
    updatePosition,
    getScale,
    getPosition,
    getModel: () => modelRef.current,
    getApp: () => appRef.current,
  };

  // Initialize Live2D
  useEffect(() => {
    let mounted = true;

    const initLive2D = async () => {
      if (!containerRef.current) return;

      try {
        setIsLoading(true);
        setError(null);

        // Create PIXI application
        const app = createPixiApp({ width, height, transparent });
        appRef.current = app;

        // Add canvas to container
        containerRef.current.appendChild(app.view as HTMLCanvasElement);

        // Create performance monitor
        if (process.env.NEXT_PUBLIC_LIVE2MODEL_TEST === 'true') {
          performanceMonitorRef.current = createPerformanceMonitor();
        }

        // Check if AI mode is enabled
        const isAIMode = process.env.NEXT_PUBLIC_LIVE2MODEL_AI === 'true';
        
        // Load model with AI-specific options
        const model = await loadLive2DModel(modelPath, {
          autoUpdate: true,
          motionPreload: MotionPreloadStrategy.IDLE,
          autoFocus: !isAIMode, // Disable auto cursor tracking in AI mode
          autoHitTest: true, // Keep hit testing enabled
        });
        
        if (!mounted) {
          model.destroy();
          return;
        }

        modelRef.current = model;

        // Set model properties with proper centering
        model.anchor.set(0.5, 0.5);  // Ensure center pivot
        model.x = width / 2;
        model.y = height * 0.5;  // CENTER positioning for full character visibility

        // Calculate optimal scale to fit viewport (maintain aspect ratio)
        try {
          const modelBounds = model.getBounds();
          const scaleX = (width * 0.7) / modelBounds.width;  // 70% of width
          const scaleY = (height * 0.85) / modelBounds.height;  // 85% of height
          const optimalScale = Math.min(scaleX, scaleY, scale);  // Don't exceed user-provided scale

          model.scale.set(optimalScale);

          log.debug('[useLive2D] Auto-fit scaling:', {
            modelBounds: { width: modelBounds.width, height: modelBounds.height },
            viewport: { width, height },
            requestedScale: scale,
            optimalScale: optimalScale,
            position: { x: model.x, y: model.y }
          });
        } catch (error) {
          // Fallback to user-provided scale if bounds calculation fails
          model.scale.set(scale);
          log.warn('[useLive2D] Failed to calculate optimal scale, using provided scale:', scale);
        }

        // Add event listeners
        model.on('hit', (hitAreaNames: string[]) => {
          if (onHit) onHit(hitAreaNames);
        });

        // Note: Motion event listeners are currently not supported due to TypeScript type issues
        // with utils.EventEmitter not being properly exported from the library

        // Add to stage
        app.stage.addChild(model);

        // Add manual update to ticker as fallback
        app.ticker.add((deltaTime) => {
          if (modelRef.current) {
            modelRef.current.update(deltaTime);
          }
        });

        // Initialize expression category manager
        expressionManagerRef.current.setModel(model);
        
        // Load expression parameters for category management
        if ((model.internalModel.settings as Cubism4ModelSettings)?.expressions) {
          const baseUrl = modelPath.substring(0, modelPath.lastIndexOf('/') + 1);
          const expressions = (model.internalModel.settings as Cubism4ModelSettings).expressions!.map((expr: any) => ({
            name: expr.Name || expr.name,
            file: baseUrl + (expr.File || expr.file)
          }));
          await expressionManagerRef.current.loadExpressionParameters(expressions);
        }

        // Debug expression manager after model load
        if (process.env.NEXT_PUBLIC_LIVE2MODEL_TEST === 'true') {
          log.debug('[DEBUG] Model loaded, checking expression structure:', {
            hasMotionManager: !!model.internalModel.motionManager,
            hasExpressionManager: !!model.internalModel.motionManager.expressionManager,
            settingsExpressions: (model.internalModel.settings as Cubism4ModelSettings)?.expressions?.length || 0,
            motionGroups: Object.keys(model.internalModel.motionManager.motionGroups || {}),
          });
        }

        // Start idle animation if autoPlay
        if (autoPlay) {
          const motions = getAvailableMotions();
          if (motions.includes('idle')) {
            playMotion('idle');
          } else if (motions.length > 0) {
            // If no idle motion, play the first available motion
            playMotion(motions[0]);
          }
        }

        // Configure AI mode behavior
        if (isAIMode) {
          try {
            // Set neutral eye position (looking straight at viewer)
            (model.internalModel as Cubism4InternalModel).coreModel.setParameterValueById('ParamEyeBallX', 0);
            (model.internalModel as Cubism4InternalModel).coreModel.setParameterValueById('ParamEyeBallY', 0);
            
            // Set neutral head position
            (model.internalModel as Cubism4InternalModel).coreModel.setParameterValueById('ParamAngleX', 0);
            (model.internalModel as Cubism4InternalModel).coreModel.setParameterValueById('ParamAngleY', 0);
            (model.internalModel as Cubism4InternalModel).coreModel.setParameterValueById('ParamAngleZ', 0);
            
            // Ensure natural breathing is maintained (default value)
            (model.internalModel as Cubism4InternalModel).coreModel.setParameterValueById('ParamBreath', 0.5);
            
            // Ensure automatic blinking is enabled
            if ((model.internalModel as Cubism4InternalModel).eyeBlink) {
              (model.internalModel as Cubism4InternalModel).eyeBlink!.setBlinkingInterval(2.5); // Natural blink interval
            }
            
            if (process.env.NEXT_PUBLIC_DREAM_TEST === 'true') {
              log.debug('[AI MODE] ✓ Cursor tracking disabled, neutral position set');
              log.debug('[AI MODE] ✓ Eye blink enabled:', !!(model.internalModel as Cubism4InternalModel).eyeBlink);
            }
          } catch (error) {
            log.warn('[AI MODE] Failed to set neutral position:', error);
          }
        } else {
          // Normal mode - ensure blinking is also enabled
          try {
            if ((model.internalModel as Cubism4InternalModel).eyeBlink) {
              (model.internalModel as Cubism4InternalModel).eyeBlink!.setBlinkingInterval(2.5); // Natural blink interval
            }
            
            if (process.env.NEXT_PUBLIC_DREAM_TEST === 'true') {
              log.debug('[NORMAL MODE] ✓ Cursor tracking enabled, eye blink enabled:', !!(model.internalModel as Cubism4InternalModel).eyeBlink);
            }
          } catch (error) {
            log.warn('[NORMAL MODE] Failed to configure blinking:', error);
          }
        }

        setIsReady(true);
        setIsLoading(false);
        if (onLoad) onLoad();

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load Live2D model';
        setError(errorMessage);
        setIsLoading(false);
        if (onError) onError(errorMessage);
      }
    };

    initLive2D();

    // Update performance metrics
    const metricsInterval = setInterval(() => {
      if (performanceMonitorRef.current && appRef.current) {
        setMetrics({
          fps: performanceMonitorRef.current.getFPS(),
          memory: performanceMonitorRef.current.getMemory(),
          drawCalls: 0, // Simplified - exact draw calls not available
          textureCount: 0, // Simplified - texture count not easily accessible
        });
      }
    }, 1000);

    // Cleanup
    return () => {
      mounted = false;
      clearInterval(metricsInterval);

      if (performanceMonitorRef.current) {
        performanceMonitorRef.current.destroy();
      }

      if (modelRef.current) {
        cleanupLive2DModel(modelRef.current);
      }

      if (appRef.current) {
        cleanupPixiApp(appRef.current);
      }
    };
  }, [modelPath, width, height, scale, transparent, autoPlay]);

  return {
    containerRef,
    modelRef: modelRefObject,
    isLoading,
    error,
    isReady,
    metrics,
    resizeModel,
    updateScale,
    updatePosition,
    getScale,
    getPosition,
  };
};