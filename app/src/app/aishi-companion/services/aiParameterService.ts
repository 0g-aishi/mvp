/**
 * @fileoverview AI Parameter Service for Live2D Body Language Control
 * @description Defines controllable parameters, parses AI responses, validates ranges
 */

import { logger } from '@/lib/logger';

const log = logger.child({ component: 'AIParameterService' });

/**
 * Live2D Parameter Definition
 */
export interface Live2DParameter {
  id: string;           // Internal Live2D parameter ID
  name: string;         // AI-friendly name (used in prompts)
  min: number;
  max: number;
  default: number;
  description: string;  // For AI understanding
}

/**
 * Parsed AI Response
 */
export interface ParsedAIResponse {
  text: string;                           // Clean text without JSON blocks
  parameters: Record<string, number>;     // Parameter updates from AI
  expressions: string[];                  // Expression triggers from AI
  rawResponse: string;                    // Original AI response
  hasParameters: boolean;
  hasExpressions: boolean;
}

/**
 * Parameter Update for Animation
 */
export interface ParameterUpdate {
  paramId: string;      // Live2D internal ID
  name: string;         // AI name
  currentValue: number;
  targetValue: number;
  isValid: boolean;
  error?: string;
}

/**
 * AI-Controllable Parameters (13 total)
 * MouthOpen and MouthForm excluded - used only by lip sync system
 */
export const CONTROLLABLE_PARAMETERS: Live2DParameter[] = [
  // HEAD MOVEMENT (affects whole body through physics)
  {
    id: 'ParamAngleX',
    name: 'HeadX',
    min: -30,
    max: 30,
    default: 0,
    description: 'Head turn left/right: -30=fully left, 0=facing forward, +30=fully right. Entire body follows (chest, skirt, hair sway with turn)'
  },
  {
    id: 'ParamAngleY',
    name: 'HeadY',
    min: -30,
    max: 30,
    default: 0,
    description: 'Head tilt up/down: -30=looking at ground, 0=eye level, +30=looking at sky. Body moves with head (chest rises/falls, clothing flows). Use for jump: rapid 0→15→0 or 0→20→-10→0'
  },
  {
    id: 'ParamAngleZ',
    name: 'HeadZ',
    min: -10,
    max: 10,
    default: 0,
    description: 'Head lean sideways: -10=leaning left, 0=upright, +10=leaning right. Body tilts with head'
  },

  // EYE CONTROL
  {
    id: 'ParamEyeBallX',
    name: 'EyeGazeX',
    min: -1,
    max: 1,
    default: 0,
    description: 'Eye gaze horizontal: -1=looking far left, -0.5=slight left, 0=looking at user, +0.5=slight right, +1=far right'
  },
  {
    id: 'ParamEyeBallY',
    name: 'EyeGazeY',
    min: -1,
    max: 1,
    default: 0,
    description: 'Eye gaze vertical: -1=looking down, -0.3=slight down (shy), 0=straight ahead, +0.5=looking up, +1=far up'
  },
  {
    id: 'ParamEyeLOpen',
    name: 'LeftEyeOpen',
    min: 0,
    max: 1.9,
    default: 1,
    description: 'Left eye openness: 0=fully closed, 0.5=half-closed (sleepy), 1=normal, 1.5=wide (surprised), 1.9=maximum'
  },
  {
    id: 'ParamEyeROpen',
    name: 'RightEyeOpen',
    min: 0,
    max: 1.9,
    default: 1,
    description: 'Right eye openness: 0=fully closed, 0.5=half-closed (sleepy), 1=normal, 1.5=wide (surprised), 1.9=maximum'
  },

  // EYEBROWS
  {
    id: 'ParamBrowLY',
    name: 'LeftBrowY',
    min: -1,
    max: 1,
    default: 0,
    description: 'Left eyebrow vertical: -1=down (angry/sad), -0.5=slightly down, 0=neutral, +0.5=slightly up, +1=high (very surprised)'
  },
  {
    id: 'ParamBrowRY',
    name: 'RightBrowY',
    min: -1,
    max: 1,
    default: 0,
    description: 'Right eyebrow vertical: -1=down (angry/sad), -0.5=slightly down, 0=neutral, +0.5=slightly up, +1=high (very surprised)'
  },

  // FACIAL DETAILS
  {
    id: 'Param58',
    name: 'CheekPuff',
    min: 0,
    max: 1,
    default: 0,
    description: 'Cheek inflation: 0=normal, 0.3=slight puff (happy), 0.7=puffed, 1=fully inflated'
  },
  {
    id: 'Param59',
    name: 'MouthX',
    min: -1,
    max: 1,
    default: 0,
    description: 'Mouth horizontal asymmetry: -1=shifted left (smirk left), 0=centered, +1=shifted right (smirk right)'
  },
  {
    id: 'Param31',
    name: 'MouthPucker',
    min: 0,
    max: 1,
    default: 0,
    description: 'Lip pucker/pout: 0=normal lips, 0.4=slight pout, 0.7=pouty, 1=full duck face'
  },
  {
    id: 'Param76',
    name: 'ChinPosition',
    min: 0,
    max: 1,
    default: 0,
    description: 'Jaw/chin drop: 0=normal position, 0.5=slightly open, 1=jaw dropped (shock)'
  }
];

/**
 * Physics parameters set to 70% default (AI doesn't control these)
 */
export const PHYSICS_DEFAULTS: Record<string, number> = {
  'ParamBreath': 0.7,     // Auto-breathing
  'Param45': 21,          // ChestX (70% of max 30)
  'Param46': 28,          // ChestY (70% of max 40)
  'Param27': 31,          // SkirtXZ (70% of max 45)
  'Param29': 31,          // SkirtY (70% of max 45)
};

/**
 * Create AI name to parameter ID mapping
 */
export const AI_NAME_TO_PARAM_ID = Object.fromEntries(
  CONTROLLABLE_PARAMETERS.map(p => [p.name, p.id])
);

/**
 * Create parameter ID to definition mapping
 */
export const PARAM_ID_TO_DEF = Object.fromEntries(
  CONTROLLABLE_PARAMETERS.map(p => [p.id, p])
);

/**
 * Build parameter specification string for AI prompt
 */
export function buildParameterSpec(currentValues: Map<string, number>): string {
  let spec = '';

  CONTROLLABLE_PARAMETERS.forEach(param => {
    const currentValue = currentValues.get(param.id) ?? param.default;
    spec += `${param.name} [${param.min},${param.max}]: ${currentValue.toFixed(2)} - ${param.description}\n`;
  });

  return spec;
}

/**
 * Parse AI response for JSON block with parameters and expressions
 */
export function parseAIResponse(
  aiResponse: string,
  currentValues: Map<string, number>
): ParsedAIResponse {
  log.debug('Parsing AI response', {
    responseLength: aiResponse.length,
    hasJsonBlock: aiResponse.includes('```json')
  });

  // Extract JSON block
  const jsonBlockRegex = /```json\s*({[\s\S]*?})\s*```/;
  const match = aiResponse.match(jsonBlockRegex);

  if (!match) {
    log.debug('No JSON block found in response');
    return {
      text: aiResponse.trim(),
      parameters: {},
      expressions: [],
      rawResponse: aiResponse,
      hasParameters: false,
      hasExpressions: false
    };
  }

  let parsedJson: any;
  try {
    parsedJson = JSON.parse(match[1]);
    log.debug('JSON block parsed successfully', parsedJson);
  } catch (error) {
    log.debug('Failed to parse JSON block', { error: String(error) });
    return {
      text: aiResponse.replace(jsonBlockRegex, '').trim(),
      parameters: {},
      expressions: [],
      rawResponse: aiResponse,
      hasParameters: false,
      hasExpressions: false
    };
  }

  // Extract parameters
  const rawParameters = parsedJson.parameters || {};
  const validatedParameters: Record<string, number> = {};

  Object.entries(rawParameters).forEach(([aiName, value]) => {
    if (typeof value !== 'number') {
      log.debug(`Invalid parameter value type for ${aiName}`, { value, type: typeof value });
      return;
    }

    // Map AI name to parameter ID
    const paramId = AI_NAME_TO_PARAM_ID[aiName];
    if (!paramId) {
      log.debug(`Unknown parameter name: ${aiName}`);
      return;
    }

    const paramDef = PARAM_ID_TO_DEF[paramId];
    if (!paramDef) {
      log.debug(`Parameter definition not found: ${paramId}`);
      return;
    }

    // Clamp to valid range
    const clampedValue = Math.max(paramDef.min, Math.min(paramDef.max, value));

    if (clampedValue !== value) {
      log.debug(`Clamped ${aiName} from ${value} to ${clampedValue}`);
    }

    validatedParameters[paramId] = clampedValue;
  });

  // Extract expressions
  const expressions = Array.isArray(parsedJson.expressions) ? parsedJson.expressions : [];

  // Remove JSON block from text
  const cleanText = aiResponse.replace(jsonBlockRegex, '').trim();

  log.debug('Response parsing complete', {
    parameterCount: Object.keys(validatedParameters).length,
    expressionCount: expressions.length,
    textLength: cleanText.length
  });

  return {
    text: cleanText,
    parameters: validatedParameters,
    expressions,
    rawResponse: aiResponse,
    hasParameters: Object.keys(validatedParameters).length > 0,
    hasExpressions: expressions.length > 0
  };
}

/**
 * Build updates array for animator
 */
export function buildParameterUpdates(
  parsedParams: Record<string, number>,
  currentValues: Map<string, number>
): ParameterUpdate[] {
  const updates: ParameterUpdate[] = [];

  Object.entries(parsedParams).forEach(([paramId, targetValue]) => {
    const paramDef = PARAM_ID_TO_DEF[paramId];
    if (!paramDef) {
      updates.push({
        paramId,
        name: paramId,
        currentValue: 0,
        targetValue,
        isValid: false,
        error: `Unknown parameter ID: ${paramId}`
      });
      return;
    }

    const currentValue = currentValues.get(paramId) ?? paramDef.default;

    // Skip if no change needed
    if (Math.abs(targetValue - currentValue) < 0.01) {
      log.debug(`Skipping ${paramDef.name} - no change needed`, {
        current: currentValue,
        target: targetValue
      });
      return;
    }

    updates.push({
      paramId,
      name: paramDef.name,
      currentValue,
      targetValue,
      isValid: true
    });
  });

  log.debug('Built parameter updates', {
    totalUpdates: updates.length,
    validUpdates: updates.filter(u => u.isValid).length
  });

  return updates;
}

/**
 * Initialize parameter values to defaults
 */
export function getDefaultParameterValues(): Map<string, number> {
  return new Map(CONTROLLABLE_PARAMETERS.map(p => [p.id, p.default]));
}
