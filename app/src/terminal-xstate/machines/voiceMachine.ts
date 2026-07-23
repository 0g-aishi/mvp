/**
 * @fileoverview Voice Control State Machine for Terminal
 * @description Manages voice recording, transcription (STT), and speech synthesis (TTS)
 */

import { setup, assign, fromPromise, sendParent, enqueueActions } from 'xstate';
import { GeminiVoiceId } from './types';
import { logger } from '@/lib/logger';

const log = logger.child({ component: 'VoiceMachine' });

interface VoiceContext {
  // Recording
  audioBlob: Blob | null;
  audioBase64: string | null;
  recordingDuration: number;
  isRecording: boolean;

  // Voice Model
  selectedVoice: GeminiVoiceId;
  availableVoices: string[];

  // Transcription (STT)
  transcript: string | null;
  detectedLanguage: string | null;
  sttConfidence: number | null;

  // Synthesis (TTS)
  synthesizedAudio: string | null;
  isSpeaking: boolean;

  // Dream context for TTS completion
  isDreamResponse: boolean;
  dreamAgentName: string | null;
  isEvolutionDream: boolean;

  // Error handling
  errorMessage: string | null;
  isProcessing: boolean;
}

type VoiceEvent =
  | { type: 'START_RECORDING' }
  | { type: 'STOP_RECORDING'; audioBase64: string; audioBlob: Blob }
  | { type: 'PAUSE_RECORDING' }
  | { type: 'RESUME_RECORDING' }
  | { type: 'CLEAR_RECORDING' }
  | { type: 'TRANSCRIBE'; audioBase64: string }
  | { type: 'SYNTHESIZE'; text: string; emotionalTone?: string; isDreamResponse?: boolean; agentName?: string; isEvolutionDream?: boolean }
  | { type: 'SELECT_VOICE'; voiceId: GeminiVoiceId }
  | { type: 'PLAY_AUDIO' }
  | { type: 'STOP_AUDIO' }
  | { type: 'REFRESH_VOICES' }
  // XState completion events
  | { type: 'xstate.done.actor.transcribe'; output: TranscriptionResult }
  | { type: 'xstate.done.actor.synthesize'; output: SynthesisResult }
  | { type: 'xstate.done.actor.loadVoices'; output: string[] }
  | { type: 'xstate.done.actor.saveVoiceToStorage'; output: string }
  | { type: 'xstate.done.actor.loadVoiceFromStorage'; output: string }
  // XState error events
  | { type: 'xstate.error.actor.transcribe'; error: { message?: string } }
  | { type: 'xstate.error.actor.synthesize'; error: { message?: string } }
  | { type: 'xstate.error.actor.loadVoices'; error: { message?: string } };

interface TranscriptionResult {
  transcript: string;
  detectedLanguage: string;
  languageCode: string;
  confidence: number;
  processingTime: number;
}

interface SynthesisResult {
  audioData: string;
  format: string;
  duration: number;
  voiceUsed: string;
  detectedLanguage: string;
  processingTime: number;
}

// Service to transcribe audio using backend STT
const transcribeAudio = fromPromise(async ({ input }: { input: { audioBase64: string } }) => {
  const BACKEND_URL = process.env.NEXT_PUBLIC_COMPUTE_API_URL || 'http://localhost:3001/api';

  log.debug('transcribeAudio service called', {
    backendUrl: BACKEND_URL,
    audioBase64Length: input.audioBase64?.length || 0
  });

  try {
    const response = await fetch(`${BACKEND_URL}/voice/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioBuffer: input.audioBase64,
        inputFormat: 'webm' // Browser default format
      })
    });

    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.statusText}`);
    }

    const responseData = await response.json();
    const sttResult = responseData.data; // Extract from wrapped API response
    log.debug('Transcription response from backend', {
      hasTranscript: !!sttResult.transcript,
      transcript: sttResult.transcript,
      fullResponse: responseData,
      extractedData: sttResult
    });
    return sttResult as TranscriptionResult;
  } catch (error) {
    log.error('Error transcribing audio', { error });
    throw error;
  }
});

// Service to synthesize speech using backend TTS
const synthesizeSpeech = fromPromise(async ({
  input
}: {
  input: {
    text: string;
    voiceId: string;
    emotionalTone?: string;
  }
}) => {
  const BACKEND_URL = process.env.NEXT_PUBLIC_COMPUTE_API_URL || 'http://localhost:3001/api';

  try {
    const response = await fetch(`${BACKEND_URL}/voice/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: input.text,
        voiceId: input.voiceId,
        emotionalTone: input.emotionalTone || 'neutral',
        speed: 1.0,
        pitch: 1.0
      })
    });

    if (!response.ok) {
      throw new Error(`Speech synthesis failed: ${response.statusText}`);
    }

    const responseData = await response.json();
    const ttsResult = responseData.data; // Extract from wrapped API response
    log.debug('TTS response from backend', {
      hasAudioData: !!ttsResult.audioData,
      audioDataLength: ttsResult.audioData?.length || 0,
      duration: ttsResult.duration,
      format: ttsResult.format,
      voiceUsed: ttsResult.voiceUsed,
      fullResponse: responseData,
      extractedData: ttsResult
    });
    return ttsResult as SynthesisResult;
  } catch (error) {
    log.error('Error synthesizing speech', { error });
    throw error;
  }
});

// Service to load available voices
const loadVoices = fromPromise(async () => {
  const BACKEND_URL = process.env.NEXT_PUBLIC_COMPUTE_API_URL || 'http://localhost:3001/api';

  try {
    const response = await fetch(`${BACKEND_URL}/voice/voices`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Failed to load voices: ${response.statusText}`);
    }

    const data = await response.json();
    return data.voices || ['aoede', 'zephyr', 'achernar', 'kore', 'charon', 'fenrir', 'puck'];
  } catch (error) {
    log.error('Error loading voices', { error });
    // Return default voices if loading fails
    return ['aoede', 'zephyr', 'achernar', 'kore', 'charon', 'fenrir', 'puck'];
  }
});

// Service to save voice preference to localStorage
const saveVoiceToStorage = fromPromise(async ({ input }: { input: { voiceId: string } }) => {
  try {
    localStorage.setItem('aishi-selected-voice', input.voiceId);
    return input.voiceId;
  } catch (error) {
    log.error('Failed to save voice preference', { error });
    throw error;
  }
});

// Service to load voice preference from localStorage
const loadVoiceFromStorage = fromPromise(async () => {
  try {
    const saved = localStorage.getItem('aishi-selected-voice');
    const geminiVoices = ['aoede', 'zephyr', 'achernar', 'kore', 'charon', 'fenrir', 'puck'];
    if (saved && geminiVoices.includes(saved)) {
      return saved;
    }
    // Return random default voice from top recommendations
    const topVoices = ['aoede', 'zephyr', 'achernar', 'puck'];
    return topVoices[Math.floor(Math.random() * topVoices.length)];
  } catch (error) {
    log.error('Failed to load voice preference', { error });
    return 'aoede';
  }
});

export const voiceMachine = setup({
  types: {} as {
    context: VoiceContext;
    events: VoiceEvent;
  },
  actors: {
    transcribeAudio,
    synthesizeSpeech,
    loadVoices,
    saveVoiceToStorage,
    loadVoiceFromStorage
  },
  actions: {
    setRecording: assign({
      isRecording: true,
      errorMessage: null
    }),

    stopRecording: assign({
      isRecording: false,
      audioBase64: ({ event }) => {
        if (event.type === 'STOP_RECORDING') {
          return event.audioBase64;
        }
        return null;
      },
      audioBlob: ({ event }) => {
        if (event.type === 'STOP_RECORDING') {
          return event.audioBlob;
        }
        return null;
      }
    }),

    clearRecording: assign({
      audioBlob: null,
      audioBase64: null,
      recordingDuration: 0,
      transcript: null,
      detectedLanguage: null,
      sttConfidence: null
    }),

    setTranscript: assign({
      transcript: ({ event }) => {
        if (event.type === 'xstate.done.actor.transcribe') {
          log.debug('setTranscript from event.output', {
            hasOutput: !!event.output,
            transcript: event.output?.transcript,
            fullOutput: event.output
          });
          return event.output?.transcript || null;
        }
        return null;
      },
      detectedLanguage: ({ event }) => {
        if (event.type === 'xstate.done.actor.transcribe') {
          return event.output?.detectedLanguage || null;
        }
        return null;
      },
      sttConfidence: ({ event }) => {
        if (event.type === 'xstate.done.actor.transcribe') {
          return event.output?.confidence || null;
        }
        return null;
      }
    }),

    setSynthesizedAudio: assign({
      synthesizedAudio: ({ event }) => {
        if (event.type === 'xstate.done.actor.synthesize') {
          return event.output.audioData;
        }
        return null;
      }
    }),

    setSelectedVoice: assign({
      selectedVoice: ({ event }) => {
        if (event.type === 'SELECT_VOICE') {
          return event.voiceId;
        }
        if (event.type === 'xstate.done.actor.loadVoiceFromStorage') {
          return event.output as GeminiVoiceId;
        }
        return 'aoede';
      }
    }),

    setAvailableVoices: assign({
      availableVoices: ({ event }) => {
        if (event.type === 'xstate.done.actor.loadVoices') {
          return event.output;
        }
        return ['aoede', 'zephyr', 'achernar', 'kore', 'charon', 'fenrir', 'puck'];
      }
    }),

    setProcessing: assign({
      isProcessing: true
    }),

    clearProcessing: assign({
      isProcessing: false
    }),

    setError: assign({
      errorMessage: ({ event }) => {
        if (event.type === 'xstate.error.actor.transcribe') {
          return event.error.message || 'Transcription failed';
        }
        if (event.type === 'xstate.error.actor.synthesize') {
          return event.error.message || 'Speech synthesis failed';
        }
        return 'Voice operation failed';
      }
    }),

    clearError: assign({
      errorMessage: null
    }),

    // Store dream context for synthesis
    storeDreamContext: assign({
      isDreamResponse: ({ event }) => {
        if (event.type === 'SYNTHESIZE') {
          return event.isDreamResponse || false;
        }
        return false;
      },
      dreamAgentName: ({ event }) => {
        if (event.type === 'SYNTHESIZE') {
          return event.agentName || null;
        }
        return null;
      },
      isEvolutionDream: ({ event }) => {
        if (event.type === 'SYNTHESIZE') {
          return event.isEvolutionDream || false;
        }
        return false;
      }
    }),

    // Send transcription result to parent (terminal machine)
    sendTranscriptToParent: sendParent(({ context }) => {
      log.debug('sendTranscriptToParent sending to terminal', {
        transcript: context.transcript,
        detectedLanguage: context.detectedLanguage,
        hasTranscript: !!context.transcript
      });
      return {
        type: 'VOICE.TRANSCRIBED',
        transcript: context.transcript,
        language: context.detectedLanguage
      };
    }),

    // Send synthesized audio as voice-output line to parent
    sendVoiceOutputToParent: enqueueActions(({ context, event, enqueue }) => {
      if (event.type === 'xstate.done.actor.synthesize') {
        log.debug('sendVoiceOutputToParent creating voice-output line', {
          hasOutput: !!event.output,
          hasAudioData: !!event.output?.audioData,
          audioDataLength: event.output?.audioData?.length || 0,
          duration: event.output?.duration,
          voiceUsed: event.output?.voiceUsed,
          isDreamResponse: context.isDreamResponse,
          dreamAgentName: context.dreamAgentName,
          fullOutput: event.output
        });

        // First: Send the voice output line
        enqueue(sendParent(() => ({
          type: 'APPEND_LINES',
          lines: [{
            type: 'voice-output',
            content: '', // Text is already shown
            audioData: event.output?.audioData || null,
            audioFormat: event.output?.format ? `audio/${event.output.format}` : 'audio/mp3',
            duration: event.output?.duration || 0,
            voiceId: event.output?.voiceUsed || context.selectedVoice,
            timestamp: Date.now()
          }]
        })));

        // Second: Send confirmation question if this was a dream response
        if (context.isDreamResponse && context.dreamAgentName) {
          const confirmationText = context.isEvolutionDream
            ? `Should ${context.dreamAgentName} evolve with this dream? (type 'y' or 'n')`
            : `Should ${context.dreamAgentName} grow with this dream? (type 'y' or 'n')`;

          enqueue(sendParent(() => ({
            type: 'APPEND_LINES',
            lines: [{
              type: 'system',
              content: confirmationText,
              timestamp: Date.now() + 100 // Small delay after voice message
            }]
          })));
        }

        // Third: Notify parent that TTS is complete
        enqueue(sendParent(() => ({
          type: 'VOICE.TTS_COMPLETE'
        })));
      }
    })
  },
  guards: {
    hasAudioToTranscribe: ({ context, event }) => {
      // Check if audio is in event (from TRANSCRIBE) or in context (from recording)
      log.debug('hasAudioToTranscribe guard', {
        eventType: event.type,
        hasEventAudio: event.type === 'TRANSCRIBE' && !!event.audioBase64,
        hasContextAudio: context.audioBase64 !== null
      });
      return (event.type === 'TRANSCRIBE' && event.audioBase64) || context.audioBase64 !== null;
    },

    hasTextToSynthesize: ({ event }) => {
      return event.type === 'SYNTHESIZE' && event.text.length > 0;
    }
  }
}).createMachine({
  id: 'voice',
  initial: 'initializing',
  context: {
    // Recording
    audioBlob: null,
    audioBase64: null,
    recordingDuration: 0,
    isRecording: false,

    // Voice Model
    selectedVoice: 'aoede',
    availableVoices: ['aoede', 'zephyr', 'achernar', 'kore', 'charon', 'fenrir', 'puck'],

    // Transcription
    transcript: null,
    detectedLanguage: null,
    sttConfidence: null,

    // Synthesis
    synthesizedAudio: null,
    isSpeaking: false,

    // Dream context
    isDreamResponse: false,
    dreamAgentName: null,
    isEvolutionDream: false,

    // State
    errorMessage: null,
    isProcessing: false
  },

  states: {
    initializing: {
      invoke: [
        {
          id: 'loadVoiceFromStorage',
          src: 'loadVoiceFromStorage',
          onDone: {
            actions: 'setSelectedVoice'
          }
        },
        {
          id: 'loadVoices',
          src: 'loadVoices',
          onDone: {
            target: 'idle',
            actions: 'setAvailableVoices'
          },
          onError: {
            target: 'idle',
            actions: 'setError'
          }
        }
      ]
    },

    idle: {
      on: {
        START_RECORDING: {
          target: 'recording',
          actions: 'setRecording'
        },
        TRANSCRIBE: {
          target: 'transcribing',
          guard: 'hasAudioToTranscribe'
        },
        SYNTHESIZE: {
          target: 'synthesizing',
          guard: 'hasTextToSynthesize',
          actions: 'storeDreamContext'
        },
        SELECT_VOICE: {
          target: 'savingVoice',
          actions: 'setSelectedVoice'
        },
        CLEAR_RECORDING: {
          actions: 'clearRecording'
        }
      }
    },

    recording: {
      on: {
        STOP_RECORDING: {
          target: 'idle',
          actions: 'stopRecording'
        },
        PAUSE_RECORDING: {
          target: 'paused'
        }
      }
    },

    paused: {
      on: {
        RESUME_RECORDING: {
          target: 'recording'
        },
        STOP_RECORDING: {
          target: 'idle',
          actions: 'stopRecording'
        }
      }
    },

    transcribing: {
      entry: ['setProcessing', ({ context, event }) => {
        log.debug('Entering transcribing state', {
          eventType: event.type,
          hasEventAudio: event.type === 'TRANSCRIBE' && !!event.audioBase64,
          hasContextAudio: !!context.audioBase64,
          audioLength: event.type === 'TRANSCRIBE'
            ? event.audioBase64?.length
            : context.audioBase64?.length
        });
      }],
      invoke: {
        id: 'transcribe',
        src: 'transcribeAudio',
        input: ({ context, event }) => {
          // Get audio from context or event
          const audioBase64 = event.type === 'TRANSCRIBE'
            ? event.audioBase64
            : context.audioBase64;
          return { audioBase64: audioBase64! };
        },
        onDone: {
          target: 'idle',
          actions: [
            'setTranscript',
            'clearProcessing',
            'sendTranscriptToParent'
          ]
        },
        onError: {
          target: 'idle',
          actions: ['setError', 'clearProcessing']
        }
      }
    },

    synthesizing: {
      entry: 'setProcessing',
      invoke: {
        id: 'synthesize',
        src: 'synthesizeSpeech',
        input: ({ context, event }) => {
          if (event.type === 'SYNTHESIZE') {
            return {
              text: event.text,
              voiceId: context.selectedVoice,
              emotionalTone: event.emotionalTone
            };
          }
          return {
            text: '',
            voiceId: context.selectedVoice
          };
        },
        onDone: {
          target: 'idle',
          actions: ['setSynthesizedAudio', 'clearProcessing', 'sendVoiceOutputToParent']
        },
        onError: {
          target: 'idle',
          actions: ['setError', 'clearProcessing']
        }
      }
    },

    savingVoice: {
      invoke: {
        id: 'saveVoiceToStorage',
        src: 'saveVoiceToStorage',
        input: ({ context }) => ({ voiceId: context.selectedVoice }),
        onDone: 'idle',
        onError: 'idle'
      }
    }
  }
});