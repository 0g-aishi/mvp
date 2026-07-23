/**
 * @fileoverview Dream Data Schema Validator for XState Terminal
 * @description Validates AI response data for dream persistence with conditional evolution logic
 */

import { logger } from '@/lib/logger';

const log = logger.child({ component: 'DreamDataValidator' });

/**
 * Standard dream data structure (always required)
 */
export interface StandardDreamFields {
  // Required basic fields
  id: number;
  date: string;           // Format: YYYY-MM-DD
  timestamp: number;      // Unix timestamp
  emotions: string[];     // Min 1, max 5 elements
  symbols: string[];      // Min 1, max 5 elements  
  intensity: number;      // 1-10
  lucidity: number;       // 1-5
  
  // Optional standard fields
  themes?: string[];
  archetypes?: string[];
  recurring_from?: number[];
  analysis?: string;
  personality_impact?: {
    dominant_trait?: string;
    shift_direction?: string;
    intensity?: number;
  };
  sleep_quality?: number;    // 1-10
  recall_clarity?: number;   // 1-10
  dream_type?: string;       // enum: transformative|nightmare|neutral|lucid|prophetic
}

/**
 * Evolution fields structure (required when dreamCount % 5 === 0)
 */
export interface EvolutionFields {
  personalityImpact: {
    creativityChange: number;       // -10 to +10 (int8)
    analyticalChange: number;       // -10 to +10 (int8)
    empathyChange: number;          // -10 to +10 (int8)
    intuitionChange: number;        // -10 to +10 (int8)
    resilienceChange: number;       // -10 to +10 (int8)
    curiosityChange: number;        // -10 to +10 (int8)
    moodShift: string;             // Cannot be empty
    evolutionWeight: number;        // 1-100 (uint8)
    newFeatures: Array<{
      name: string;                 // Cannot be empty
      description: string;          // Cannot be empty
      intensity: number;            // 1-100 (uint8)
    }>;                            // Max 2 elements, can be empty array
  };
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validatedData?: {
    dreamData: StandardDreamFields;
    personalityImpact?: EvolutionFields['personalityImpact'];
  };
}

/**
 * Main validation function for AI response data
 */
export function validateDreamDataSchema(
  aiResponseBlock2: any, 
  dreamCount: number
): ValidationResult {
  log.debug('Starting dream data validation', { 
    dreamCount, 
    nextDreamId: dreamCount + 1,
    isEvolutionDream: (dreamCount + 1) % 5 === 0,
    hasPersonalityImpact: !!aiResponseBlock2.personalityImpact
  });

  const errors: string[] = [];
  const warnings: string[] = [];
  const isEvolutionDream = (dreamCount + 1) % 5 === 0;

  // Validate structure exists
  if (!aiResponseBlock2 || typeof aiResponseBlock2 !== 'object') {
    errors.push('AI response block 2 is missing or invalid');
    return { isValid: false, errors, warnings };
  }

  // Validate analysis field
  if (!aiResponseBlock2.analysis || typeof aiResponseBlock2.analysis !== 'string') {
    errors.push('Missing or invalid analysis field');
  }

  // Validate dreamData exists
  if (!aiResponseBlock2.dreamData || typeof aiResponseBlock2.dreamData !== 'object') {
    errors.push('Missing or invalid dreamData object');
    return { isValid: false, errors, warnings };
  }

  // Validate standard dream fields
  const dreamDataErrors = validateStandardDreamFields(aiResponseBlock2.dreamData);
  errors.push(...dreamDataErrors);

  // Conditional validation for evolution dreams
  if (isEvolutionDream) {
    log.debug('Validating evolution dream fields', { dreamId: dreamCount + 1 });
    
    if (!aiResponseBlock2.personalityImpact) {
      errors.push('Evolution dream missing required personalityImpact field');
    } else {
      const evolutionErrors = validateEvolutionFields(aiResponseBlock2.personalityImpact);
      errors.push(...evolutionErrors);
    }
  } else {
    // Non-evolution dreams should not have personalityImpact
    if (aiResponseBlock2.personalityImpact) {
      warnings.push('Non-evolution dream has personalityImpact field (will be ignored)');
    }
  }

  const isValid = errors.length === 0;

  log.debug('Validation completed', {
    isValid,
    errorsCount: errors.length,
    warningsCount: warnings.length,
    errors: errors.slice(0, 3), // Show first 3 errors
    warnings: warnings.slice(0, 3)
  });

  if (isValid) {
    return {
      isValid: true,
      errors: [],
      warnings,
      validatedData: {
        dreamData: aiResponseBlock2.dreamData,
        personalityImpact: isEvolutionDream ? aiResponseBlock2.personalityImpact : undefined
      }
    };
  }

  return { isValid: false, errors, warnings };
}

/**
 * Validate standard dream data fields
 */
function validateStandardDreamFields(dreamData: any): string[] {
  const errors: string[] = [];

  // Required fields validation
  if (typeof dreamData.id !== 'number' || dreamData.id <= 0) {
    errors.push('Dream ID must be a positive number');
  }

  if (typeof dreamData.date !== 'string' || !isValidDateFormat(dreamData.date)) {
    errors.push('Dream date must be in YYYY-MM-DD format');
  }

  if (typeof dreamData.timestamp !== 'number' || dreamData.timestamp <= 0) {
    errors.push('Dream timestamp must be a positive Unix timestamp');
  }

  // Emotions validation
  if (!Array.isArray(dreamData.emotions) || dreamData.emotions.length === 0) {
    errors.push('Emotions must be a non-empty array');
  } else if (dreamData.emotions.length > 5) {
    errors.push('Emotions array cannot have more than 5 elements');
  } else if (!dreamData.emotions.every((emotion: any) => typeof emotion === 'string' && emotion.trim().length > 0)) {
    errors.push('All emotions must be non-empty strings');
  }

  // Symbols validation
  if (!Array.isArray(dreamData.symbols) || dreamData.symbols.length === 0) {
    errors.push('Symbols must be a non-empty array');
  } else if (dreamData.symbols.length > 5) {
    errors.push('Symbols array cannot have more than 5 elements');
  } else if (!dreamData.symbols.every((symbol: any) => typeof symbol === 'string' && symbol.trim().length > 0)) {
    errors.push('All symbols must be non-empty strings');
  }

  // Intensity validation (1-10)
  if (typeof dreamData.intensity !== 'number' || dreamData.intensity < 1 || dreamData.intensity > 10) {
    errors.push('Intensity must be a number between 1 and 10');
  }

  // Lucidity validation (1-5)
  if (typeof dreamData.lucidity !== 'number' || dreamData.lucidity < 1 || dreamData.lucidity > 5) {
    errors.push('Lucidity must be a number between 1 and 5');
  }

  // Optional fields validation
  if (dreamData.themes !== undefined) {
    if (!Array.isArray(dreamData.themes)) {
      errors.push('Themes must be an array if provided');
    } else if (!dreamData.themes.every((theme: any) => typeof theme === 'string')) {
      errors.push('All themes must be strings');
    }
  }

  if (dreamData.archetypes !== undefined) {
    if (!Array.isArray(dreamData.archetypes)) {
      errors.push('Archetypes must be an array if provided');
    } else if (!dreamData.archetypes.every((arch: any) => typeof arch === 'string')) {
      errors.push('All archetypes must be strings');
    }
  }

  if (dreamData.recurring_from !== undefined) {
    if (!Array.isArray(dreamData.recurring_from)) {
      errors.push('Recurring_from must be an array if provided');
    } else if (!dreamData.recurring_from.every((id: any) => typeof id === 'number' && id > 0)) {
      errors.push('All recurring_from IDs must be positive numbers');
    }
  }

  if (dreamData.sleep_quality !== undefined) {
    if (typeof dreamData.sleep_quality !== 'number' || dreamData.sleep_quality < 1 || dreamData.sleep_quality > 10) {
      errors.push('Sleep quality must be a number between 1 and 10 if provided');
    }
  }

  if (dreamData.recall_clarity !== undefined) {
    if (typeof dreamData.recall_clarity !== 'number' || dreamData.recall_clarity < 1 || dreamData.recall_clarity > 10) {
      errors.push('Recall clarity must be a number between 1 and 10 if provided');
    }
  }

  if (dreamData.dream_type !== undefined) {
    const validTypes = ['transformative', 'nightmare', 'neutral', 'lucid', 'prophetic'];
    if (!validTypes.includes(dreamData.dream_type)) {
      errors.push(`Dream type must be one of: ${validTypes.join(', ')}`);
    }
  }

  return errors;
}

/**
 * Validate evolution fields for personality impact
 */
function validateEvolutionFields(personalityImpact: any): string[] {
  const errors: string[] = [];

  if (!personalityImpact || typeof personalityImpact !== 'object') {
    errors.push('PersonalityImpact must be an object');
    return errors;
  }

  // Validate personality change fields (-10 to +10, int8 range)
  const changeFields = [
    'creativityChange', 'analyticalChange', 'empathyChange', 
    'intuitionChange', 'resilienceChange', 'curiosityChange'
  ];

  for (const field of changeFields) {
    const value = personalityImpact[field];
    if (typeof value !== 'number' || value < -10 || value > 10 || !Number.isInteger(value)) {
      errors.push(`${field} must be an integer between -10 and 10`);
    }
  }

  // Validate moodShift (required, non-empty string)
  if (typeof personalityImpact.moodShift !== 'string' || personalityImpact.moodShift.trim().length === 0) {
    errors.push('moodShift must be a non-empty string');
  }

  // Validate evolutionWeight (1-100, uint8 range)
  if (typeof personalityImpact.evolutionWeight !== 'number' || 
      personalityImpact.evolutionWeight < 1 || 
      personalityImpact.evolutionWeight > 100 || 
      !Number.isInteger(personalityImpact.evolutionWeight)) {
    errors.push('evolutionWeight must be an integer between 1 and 100');
  }

  // Validate newFeatures array
  if (!Array.isArray(personalityImpact.newFeatures)) {
    errors.push('newFeatures must be an array (can be empty)');
  } else {
    if (personalityImpact.newFeatures.length > 2) {
      errors.push('newFeatures array cannot have more than 2 elements');
    }

    personalityImpact.newFeatures.forEach((feature: any, index: number) => {
      if (!feature || typeof feature !== 'object') {
        errors.push(`newFeatures[${index}] must be an object`);
        return;
      }

      if (typeof feature.name !== 'string' || feature.name.trim().length === 0) {
        errors.push(`newFeatures[${index}].name must be a non-empty string`);
      }

      if (typeof feature.description !== 'string' || feature.description.trim().length === 0) {
        errors.push(`newFeatures[${index}].description must be a non-empty string`);
      }

      if (typeof feature.intensity !== 'number' || 
          feature.intensity < 1 || 
          feature.intensity > 100 || 
          !Number.isInteger(feature.intensity)) {
        errors.push(`newFeatures[${index}].intensity must be an integer between 1 and 100`);
      }
    });
  }

  return errors;
}

/**
 * Validate date format (YYYY-MM-DD)
 */
function isValidDateFormat(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }

  // Check if it's a valid date
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime()) && dateString === date.toISOString().split('T')[0];
}

/**
 * Helper function to clamp values to contract ranges
 */
export function clampToContractRanges(personalityImpact: EvolutionFields['personalityImpact']): EvolutionFields['personalityImpact'] {
  return {
    creativityChange: Math.max(-10, Math.min(10, Math.round(personalityImpact.creativityChange))),
    analyticalChange: Math.max(-10, Math.min(10, Math.round(personalityImpact.analyticalChange))),
    empathyChange: Math.max(-10, Math.min(10, Math.round(personalityImpact.empathyChange))),
    intuitionChange: Math.max(-10, Math.min(10, Math.round(personalityImpact.intuitionChange))),
    resilienceChange: Math.max(-10, Math.min(10, Math.round(personalityImpact.resilienceChange))),
    curiosityChange: Math.max(-10, Math.min(10, Math.round(personalityImpact.curiosityChange))),
    moodShift: personalityImpact.moodShift.trim(),
    evolutionWeight: Math.max(1, Math.min(100, Math.round(personalityImpact.evolutionWeight))),
    newFeatures: personalityImpact.newFeatures.slice(0, 2).map(feature => ({
      name: feature.name.trim(),
      description: feature.description.trim(),
      intensity: Math.max(1, Math.min(100, Math.round(feature.intensity)))
    }))
  };
}
