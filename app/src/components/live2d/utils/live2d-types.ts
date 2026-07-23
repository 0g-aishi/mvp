// TypeScript definitions for Live2D integration with pixi-live2d-display
import type { Live2DModel as PixiLive2DModel } from 'pixi-live2d-display-lipsyncpatch/cubism4';
import type { Application } from 'pixi.js';
import type { EXPRESSION_PRESETS } from './expression-categories';

export interface Live2DModelOptions {
  modelPath: string;
  width?: number;
  height?: number;
  scale?: number;
  x?: number;
  y?: number;
  transparent?: boolean;
  autoPlay?: boolean;
  className?: string;
  onLoad?: () => void;
  onError?: (error: string) => void;
  onMotionStart?: (group: string, index: number) => void;
  onMotionFinish?: (group: string, index: number) => void;
  onHit?: (hitAreaNames: string[]) => void;
}

export interface Live2DModelRef {
  // Core model control
  playMotion: (group: string, index?: number, priority?: number) => Promise<void>;
  stopAllMotions: () => void;
  setExpression: (expressionId: string | number) => void;
  resetExpression: () => void;
  
  // Expression category management
  toggleExpression: (expressionName: string) => boolean;
  getActiveExpressions: () => string[];
  isExpressionActive: (expressionName: string) => boolean;
  applyFormPreset: (presetName: keyof typeof EXPRESSION_PRESETS) => void;
  
  // Interaction
  lookAt: (x: number, y: number) => void;
  stopLookAt: () => void;
  hit: (x: number, y: number) => void;
  
  // Lip sync
  startLipSync: (audioLevel: number) => void;
  stopLipSync: () => void;
  setLipSyncValue: (value: number) => void;
  
  // Information getters
  getAvailableMotions: () => string[];
  getAvailableExpressions: () => string[];
  getHitAreas: () => string[];
  getCurrentMotion: () => { group: string; index: number } | null;
  getCurrentExpression: () => string | null;
  
  // Advanced control
  setParameterValue: (id: string, value: number, weight?: number) => void;
  getParameterValue: (id: string) => number;

  // Transform control (zoom & positioning)
  updateScale: (scale: number, x?: number, y?: number) => void;
  updatePosition: (x: number, y: number) => void;
  getScale: () => number;
  getPosition: () => { x: number; y: number };

  // Model instance access (for advanced usage)
  getModel: () => PixiLive2DModel | null;
  getApp: () => Application | null;
}

export interface Live2DMotionPriority {
  NONE: 0;
  IDLE: 1;
  NORMAL: 2;
  FORCE: 3;
}

export interface Live2DPerformanceMetrics {
  fps: number;
  memory: number;
  drawCalls: number;
  textureCount: number;
}

export interface Live2DTestControlsProps {
  modelRef: React.RefObject<Live2DModelRef>;
  availableMotions: string[];
  availableExpressions: string[];
  showPerformance?: boolean;
}

// Model-specific types for 水母_vts
export interface JellyfishExpressionCategory {
  emotions: string[];
  accessories: string[];
  decorations: string[];
  special: string[];
}

export interface JellyfishModelExpressions {
  // Emotions
  love: string;      // 爱心眼
  star: string;      // 星星眼
  angry: string;     // 生气
  cry: string;       // 哭哭
  dark: string;      // 黑脸
  blush: string;     // 脸红
  blank: string;     // 空白眼
  dizzy: string;     // 蚊香眼
  
  // Accessories
  eyepatch: string;  // 眼罩
  jacket: string;    // 外套
  wings: string;     // 翅膀
  gaming: string;    // 游戏机
  mic: string;       // 麦克风
  tea: string;       // 茶杯
  catEars: string;   // 猫耳
  devil: string;     // 恶魔角
  halo: string;      // 光环
  
  // Decorations
  flowers: string;   // 花花
  crossPin: string;  // 十字发夹
  linePin: string;   // 一字发夹
  bow: string;       // 蝴蝶结
  
  // Special
  heart: string;     // 比心
  board: string;     // 写字板
  colorChange: string; // 换色
  touch: string;     // 点触
  watermark: string; // 水印
  
  // Additional variants
  haloColorChange: string; // 光环换色
  wingsToggle: string;     // 翅膀切换
}

export interface PhonemeMapping {
  openY: number;
  form: number;
}

// Error types
export class Live2DLoadError extends Error {
  constructor(public modelPath: string, public originalError: Error) {
    super(`Failed to load Live2D model: ${modelPath}`);
    this.name = 'Live2DLoadError';
  }
}

export class Live2DWebGLError extends Error {
  constructor(message: string) {
    super(`WebGL Error: ${message}`);
    this.name = 'Live2DWebGLError';
  }
}