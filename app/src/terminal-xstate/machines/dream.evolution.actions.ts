/**
 * @fileoverview Dream Evolution Actions
 * @description Actions specific to evolution dreams (every 5th dream)
 */

import { assign, sendParent, sendTo, enqueueActions } from 'xstate';
import type { TerminalLine } from './types';
import type { DreamMachineContext } from './dreamMachine';
import { logger } from '@/lib/logger';

const log = logger.child({ component: 'DreamEvolutionActions' });

/**
 * Actions related to evolution dream detection and handling
 */
export const evolutionDreamActions = {
  /**
   * Send lines to parent with evolution dream awareness
   */
  sendDreamAnalysisWithEvolution: enqueueActions(({ context, enqueue }: any) => {
    log.debug('[EVOLUTION] sendDreamAnalysisWithEvolution triggered', {
      wasVoiceInput: context.wasVoiceInput,
      hasAiResponse: !!context.aiResponse,
      agentName: context.agentName
    });

    // First action: send lines to parent
    enqueue(sendParent(() => {
      const lines: TerminalLine[] = [];
      const timestamp = Date.now();

      if (context.aiResponse) {
        // Check if this is an evolution dream
        const dreamCount = context.dreamContext?.agentProfile?.dreamCount || 0;
        const nextDreamId = dreamCount + 1;
        const isEvolutionDream = nextDreamId % 5 === 0;

        // Add evolution dream notification
        if (isEvolutionDream && context.aiResponse.personalityImpact) {
          lines.push({
            type: 'system',
            content: `[EVOLUTION DETECTED] Dream #${nextDreamId} - Personality evolution sequence initiated`,
            timestamp: timestamp - 1
          });
        }

        // Display AI analysis - for text input only
        // For voice input, skip text display and let TTS handle the response
        if (!context.wasVoiceInput) {
          lines.push({
            type: 'info',
            content: `~ ${context.agentName} : ${context.aiResponse.fullAnalysis}`,
            timestamp
          });
        }

        // Ask for confirmation with evolution notice - only for text input
        // For voice input, delay question until after TTS audio is delivered
        if (!context.wasVoiceInput) {
          if (isEvolutionDream && context.aiResponse.personalityImpact) {
            lines.push({
              type: 'system',
              content: `Should ${context.agentName} evolve with this dream? (type 'y' or 'n')`,
              timestamp: timestamp + 1
            });
          } else {
            lines.push({
              type: 'system',
              content: `Should ${context.agentName} grow with this dream? (type 'y' or 'n')`,
              timestamp: timestamp + 1
            });
          }
        }
      }

      return { type: 'APPEND_LINES', lines };
    }));

    // Second action: send TTS request if voice input
    log.debug('[TTS DECISION] Analyzing TTS trigger conditions', {
      wasVoiceInput: context.wasVoiceInput,
      hasAiResponse: !!context.aiResponse,
      hasFullAnalysis: !!(context.aiResponse?.fullAnalysis),
      fullAnalysisLength: context.aiResponse?.fullAnalysis?.length || 0,
      agentName: context.agentName,
      willTriggerTTS: context.wasVoiceInput && context.aiResponse?.fullAnalysis
    });

    if (context.wasVoiceInput && context.aiResponse?.fullAnalysis) {
      log.debug('[EVOLUTION] ✅ TRIGGERING TTS - Voice input detected with AI response', {
        textLength: context.aiResponse.fullAnalysis.length,
        textPreview: context.aiResponse.fullAnalysis.substring(0, 100),
        agentName: context.agentName
      });
      enqueue(sendParent(() => {
        // Recalculate inside closure for proper scope access
        const dreamCount = context.dreamContext?.agentProfile?.dreamCount || 0;
        const nextDreamId = dreamCount + 1;
        const isEvolutionDreamInScope = nextDreamId % 5 === 0;

        return {
          type: 'VOICE.SYNTHESIZE_RESPONSE',
          text: context.aiResponse.fullAnalysis,
          agentName: context.agentName,
          isDreamResponse: true,
          isEvolutionDream: isEvolutionDreamInScope && !!context.aiResponse.personalityImpact
        };
      }));
    } else {
      log.debug('[EVOLUTION] ❌ NO TTS TRIGGERED - Conditions not met', {
        wasVoiceInput: context.wasVoiceInput,
        hasAiResponse: !!context.aiResponse,
        hasFullAnalysis: !!(context.aiResponse?.fullAnalysis),
        reason: !context.wasVoiceInput ? 'Not voice input' :
                !context.aiResponse ? 'No AI response' :
                !context.aiResponse.fullAnalysis ? 'No fullAnalysis in response' : 'Unknown'
      });
    }
  }),

  /**
   * Store persistence result with evolution awareness
   */
  storePersistenceWithEvolution: assign({
    persistenceResult: ({ event }: any) => {
      return event.output.persistenceResult;
    },
    storageRootHash: ({ event }: any) => {
      return event.output.rootHash;
    },
    contractTxHash: ({ event }: any) => {
      return event.output.txHash;
    },
    statusMessage: ({ event }: any) => {
      const output = event.output;
      if (output.isEvolutionDream) {
        log.debug('========================================');
        log.debug('[EVOLUTION COMPLETE] Dream workflow finalized');
        log.debug('========================================');
        log.debug('Agent personality permanently evolved');
        log.debug('New traits committed to blockchain');
        log.debug('View agent stats to observe evolution changes');
        log.debug('========================================');
        return 'Evolution dream persisted! Agent has evolved.';
      }
      return 'Dream persisted successfully!';
    }
  })
};