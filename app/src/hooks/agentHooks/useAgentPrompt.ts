'use client';

import { DreamContext } from './services/dreamContextBuilder';
import {
  buildDreamAnalysisPrompt as buildDreamAnalysisPromptFromFile,
  DreamAnalysisPrompt
} from '../../prompts/dreamAnalysisPrompt';
import { logger } from '@/lib/logger';

// Re-export type for compatibility
export type { DreamAnalysisPrompt };

export function useAgentPrompt() {

  // Logger instance
  const log = logger.child({ component: 'useAgentPrompt' });

  log.debug('useAgentPrompt hook initialized');

  /**
   * Buduje kompletny prompt do analizy snu na podstawie DreamContext
   */
  const buildDreamAnalysisPrompt = (context: DreamContext): DreamAnalysisPrompt => {
    return buildDreamAnalysisPromptFromFile(context);
  };

  return {
    buildDreamAnalysisPrompt
  };
}

