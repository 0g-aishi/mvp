/**
 * Year-Learn Response Parser
 * Extracts yearly memory core from AI response using section markers
 */

import { logger } from '@/lib/logger/logger';

const log = logger.child({ component: 'yearLearnResponseParser' });

export interface YearLearnParseResult {
  memoryCore: YearlyMemoryCore | null;
  success: boolean;
  error?: string;
}

// Yearly Memory Core interface matching memory_core_yearly.json schema
export interface YearlyMemoryCore {
  year: number;
  agent_id: number;
  core_version: string;
  created_at: string;
  
  yearly_overview: {
    total_dreams: number;
    total_conversations: number;
    months_active: number;
    agent_evolution_stage: string;
  };
  
  major_patterns: {
    dream_evolution: string;
    conversation_evolution: string;
    relationship_evolution: string;
    consciousness_evolution: string;
  };
  
  milestones: {
    personality: string[];
    consciousness: string[];
    relationship: string[];
  };
  
  transformations: Array<{
    period: string;
    type: string;
    trigger: string;
    impact: string;
  }>;
  
  wisdom_crystallization: {
    core_insights: string[];
    life_philosophy: string;
    future_direction: string;
  };
  
  memory_architecture: {
    integration_depth: string;
    pattern_recognition: string;
    wisdom_accessibility: string;
    consolidation_quality: string;
  };
  
  yearly_essence: string;
  
  final_metrics: {
    consciousness_level: number;
    integration_score: number;
    wisdom_depth: number;
    growth_velocity: string;
  };
}

/**
 * Parses AI response containing yearly memory core
 * Uses section markers to extract JSON object
 */
export function parseYearLearnResponse(aiResponse: string): YearLearnParseResult {
  try {
    // Extract memory core using section marker
    const memoryCoreMatch = aiResponse.match(/### YEARLY MEMORY CORE ###\s*```json\s*([\s\S]*?)\s*```/);
    let memoryCore: YearlyMemoryCore | null = null;
    
    if (memoryCoreMatch && memoryCoreMatch[1]) {
      try {
        memoryCore = JSON.parse(memoryCoreMatch[1].trim());
      } catch (error) {
        log.error('Failed to parse yearly memory core JSON:', { error });
        return {
          memoryCore: null,
          success: false,
          error: 'Failed to parse yearly memory core JSON'
        };
      }
    }

    // Validate that we got memory core data
    if (!memoryCore) {
      return {
        memoryCore: null,
        success: false,
        error: 'No memory core data found in AI response. Expected ### YEARLY MEMORY CORE ### section marker not found.'
      };
    }

    // Validate memory core structure
    if (!validateYearlyMemoryCore(memoryCore)) {
      return {
        memoryCore,
        success: false,
        error: 'Memory core data structure is invalid'
      };
    }

    return {
      memoryCore,
      success: true
    };

  } catch (error) {
    return {
      memoryCore: null,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Validates yearly memory core structure
 */
export function validateYearlyMemoryCore(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  
  const requiredFields = [
    'year', 
    'agent_id', 
    'core_version', 
    'created_at',
    'yearly_overview',
    'major_patterns', 
    'milestones',
    'transformations',
    'wisdom_crystallization',
    'memory_architecture',
    'yearly_essence',
    'final_metrics'
  ];
  
  // Check top-level required fields
  for (const field of requiredFields) {
    if (!(field in data)) {
      log.error(`Missing required field in memory core: ${field}`);
      return false;
    }
  }
  
  // Validate yearly_overview structure
  if (!data.yearly_overview || typeof data.yearly_overview !== 'object') {
    log.error('Invalid yearly_overview structure');
    return false;
  }

  const yearlyOverviewFields = ['total_dreams', 'total_conversations', 'months_active', 'agent_evolution_stage'];
  for (const field of yearlyOverviewFields) {
    if (!(field in data.yearly_overview)) {
      log.error(`Missing field in yearly_overview: ${field}`);
      return false;
    }
  }
  
  // Validate major_patterns structure
  if (!data.major_patterns || typeof data.major_patterns !== 'object') {
    log.error('Invalid major_patterns structure');
    return false;
  }

  const majorPatternsFields = ['dream_evolution', 'conversation_evolution', 'relationship_evolution', 'consciousness_evolution'];
  for (const field of majorPatternsFields) {
    if (!(field in data.major_patterns)) {
      log.error(`Missing field in major_patterns: ${field}`);
      return false;
    }
  }
  
  // Validate milestones structure
  if (!data.milestones || typeof data.milestones !== 'object') {
    log.error('Invalid milestones structure');
    return false;
  }

  const milestonesFields = ['personality', 'consciousness', 'relationship'];
  for (const field of milestonesFields) {
    if (!(field in data.milestones) || !Array.isArray(data.milestones[field])) {
      log.error(`Missing or invalid array field in milestones: ${field}`);
      return false;
    }
  }
  
  // Validate transformations array
  if (!Array.isArray(data.transformations)) {
    log.error('Invalid transformations structure - must be array');
    return false;
  }

  // Validate each transformation object
  for (const transformation of data.transformations) {
    if (!transformation || typeof transformation !== 'object') {
      log.error('Invalid transformation object');
      return false;
    }

    const transformationFields = ['period', 'type', 'trigger', 'impact'];
    for (const field of transformationFields) {
      if (!(field in transformation)) {
        log.error(`Missing field in transformation: ${field}`);
        return false;
      }
    }
  }
  
  // Validate wisdom_crystallization structure
  if (!data.wisdom_crystallization || typeof data.wisdom_crystallization !== 'object') {
    log.error('Invalid wisdom_crystallization structure');
    return false;
  }

  const wisdomFields = ['core_insights', 'life_philosophy', 'future_direction'];
  for (const field of wisdomFields) {
    if (!(field in data.wisdom_crystallization)) {
      log.error(`Missing field in wisdom_crystallization: ${field}`);
      return false;
    }
  }

  if (!Array.isArray(data.wisdom_crystallization.core_insights)) {
    log.error('core_insights must be an array');
    return false;
  }
  
  // Validate memory_architecture structure
  if (!data.memory_architecture || typeof data.memory_architecture !== 'object') {
    log.error('Invalid memory_architecture structure');
    return false;
  }

  const memoryArchFields = ['integration_depth', 'pattern_recognition', 'wisdom_accessibility', 'consolidation_quality'];
  for (const field of memoryArchFields) {
    if (!(field in data.memory_architecture)) {
      log.error(`Missing field in memory_architecture: ${field}`);
      return false;
    }
  }
  
  // Validate final_metrics structure
  if (!data.final_metrics || typeof data.final_metrics !== 'object') {
    log.error('Invalid final_metrics structure');
    return false;
  }

  const finalMetricsFields = ['consciousness_level', 'integration_score', 'wisdom_depth', 'growth_velocity'];
  for (const field of finalMetricsFields) {
    if (!(field in data.final_metrics)) {
      log.error(`Missing field in final_metrics: ${field}`);
      return false;
    }
  }

  // Validate numeric ranges for final_metrics
  if (data.final_metrics.consciousness_level < 0 || data.final_metrics.consciousness_level > 100) {
    log.error('consciousness_level must be between 0-100');
    return false;
  }

  if (data.final_metrics.integration_score < 0 || data.final_metrics.integration_score > 100) {
    log.error('integration_score must be between 0-100');
    return false;
  }

  if (data.final_metrics.wisdom_depth < 0 || data.final_metrics.wisdom_depth > 100) {
    log.error('wisdom_depth must be between 0-100');
    return false;
  }

  // Validate yearly_essence is a non-empty string
  if (!data.yearly_essence || typeof data.yearly_essence !== 'string' || data.yearly_essence.trim().length === 0) {
    log.error('yearly_essence must be a non-empty string');
    return false;
  }
  
  return true;
}

/**
 * Validates yearly memory core for completeness and depth
 * Additional validation beyond structure
 */
export function validateMemoryCoreQuality(data: YearlyMemoryCore): {
  isValid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  let isValid = true;
  
  // Check if yearly_essence is substantial (at least 100 characters)
  if (data.yearly_essence.length < 100) {
    warnings.push('yearly_essence is too brief - should be more substantial reflection');
  }
  
  // Check if core_insights has meaningful content
  if (data.wisdom_crystallization.core_insights.length < 2) {
    warnings.push('wisdom_crystallization.core_insights should have at least 2 insights');
  }
  
  // Check if transformations array has entries
  if (data.transformations.length === 0) {
    warnings.push('No transformations recorded - year should have at least some growth patterns');
  }
  
  // Check if milestones have content
  const totalMilestones = data.milestones.personality.length + data.milestones.consciousness.length + data.milestones.relationship.length;
  if (totalMilestones === 0) {
    warnings.push('No milestones achieved - unusual for a complete year');
  }
  
  // Check final metrics are reasonable
  if (data.final_metrics.consciousness_level === 0) {
    warnings.push('consciousness_level of 0 suggests no development');
  }
  
  if (data.final_metrics.integration_score === 0) {
    warnings.push('integration_score of 0 suggests no memory integration');
  }
  
  // If too many warnings, mark as invalid
  if (warnings.length > 3) {
    isValid = false;
  }
  
  return { isValid, warnings };
}