// Live2D model loader with error handling and performance optimization
import * as PIXI from 'pixi.js';
import { Live2DModel, config, MotionPreloadStrategy } from 'pixi-live2d-display-lipsyncpatch/cubism4';
import { Live2DLoadError, Live2DWebGLError } from './live2d-types';

// Register Ticker for Live2DModel to enable automatic updates
Live2DModel.registerTicker(PIXI.Ticker);

// Expose PIXI globally for pixi-live2d-display (legacy support)
if (typeof window !== 'undefined') {
  (window as any).PIXI = PIXI;
}

// WebGL context check
export const checkWebGLSupport = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch (e) {
    return false;
  }
};

// Performance optimizations
export const configurePIXISettings = () => {
  // Optimize for Live2D rendering
  PIXI.settings.PREFER_ENV = PIXI.ENV.WEBGL2;
  PIXI.settings.RESOLUTION = window.devicePixelRatio || 1;
  PIXI.settings.ROUND_PIXELS = true;
  
  // Texture garbage collection
  PIXI.settings.GC_MODE = PIXI.GC_MODES.AUTO;
};

// Create PIXI application optimized for Live2D
export const createPixiApp = (options: {
  width: number;
  height: number;
  backgroundColor?: number;
  transparent?: boolean;
  antialias?: boolean;
}): PIXI.Application => {
  if (!checkWebGLSupport()) {
    throw new Live2DWebGLError('WebGL is not supported in this browser');
  }

  configurePIXISettings();

  const app = new PIXI.Application({
    width: options.width,
    height: options.height,
    backgroundColor: options.transparent ? undefined : (options.backgroundColor || 0x000000),
    backgroundAlpha: options.transparent ? 0 : 1,
    antialias: options.antialias ?? true,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance',
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });

  return app;
};

// Load Live2D model with error handling
export const loadLive2DModel = async (
  modelPath: string,
  options?: {
    autoUpdate?: boolean;
    motionPreload?: MotionPreloadStrategy;
    autoFocus?: boolean;
    autoHitTest?: boolean;
  }
): Promise<Live2DModel> => {
  try {
    // Validate model path
    if (!modelPath || !modelPath.endsWith('.model3.json')) {
      throw new Error('Invalid model path. Must end with .model3.json');
    }

    // Load model with options
    const model = await Live2DModel.from(modelPath, {
      autoUpdate: options?.autoUpdate ?? true,
      motionPreload: options?.motionPreload ?? MotionPreloadStrategy.IDLE,
      autoFocus: options?.autoFocus ?? true,
      autoHitTest: options?.autoHitTest ?? true,
    });

    // Set default properties
    model.interactive = true;
    model.anchor.set(0.5, 0.5);

    return model;
  } catch (error) {
    throw new Live2DLoadError(
      modelPath,
      error instanceof Error ? error : new Error('Unknown error')
    );
  }
};

// Memory cleanup utilities
export const cleanupPixiApp = (app: PIXI.Application) => {
  if (!app) return;

  // Stop the app
  app.stop();

  // Destroy all children
  while (app.stage.children[0]) {
    app.stage.removeChildAt(0).destroy({ children: true });
  }

  // Destroy renderer
  app.destroy(true);
};

export const cleanupLive2DModel = (model: Live2DModel) => {
  if (!model || model.destroyed) return;

  // Stop all motions
  model.internalModel.motionManager?.stopAllMotions();

  // Remove event listeners
  model.removeAllListeners();

  // Destroy the model
  model.destroy();
};

// Performance monitoring
export const createPerformanceMonitor = () => {
  let lastTime = performance.now();
  let frames = 0;
  let fps = 0;

  const ticker = new PIXI.Ticker();
  
  ticker.add(() => {
    frames++;
    const currentTime = performance.now();
    
    if (currentTime >= lastTime + 1000) {
      fps = Math.round((frames * 1000) / (currentTime - lastTime));
      frames = 0;
      lastTime = currentTime;
    }
  });

  ticker.start();

  return {
    getFPS: () => fps,
    getMemory: () => {
      if ((performance as any).memory) {
        return Math.round((performance as any).memory.usedJSHeapSize / 1048576);
      }
      return 0;
    },
    destroy: () => {
      ticker.stop();
      ticker.destroy();
    },
  };
};