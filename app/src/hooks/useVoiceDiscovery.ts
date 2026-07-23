/**
 * @fileoverview Voice Discovery Hook
 * @description Manages voice profile discovery, selection, and testing
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

const BACKEND_URL = process.env.NEXT_PUBLIC_COMPUTE_API_URL || 'http://localhost:3001/api';

export interface VoiceProfile {
  id: 'aria' | 'nova' | 'atlas' | 'echo' | 'aoede' | 'zephyr' |
      'achernar' | 'kore' | 'charon' | 'fenrir' | 'puck' | string;
  name: string;
  description: string;
  personality: string;
  gender: 'female' | 'male' | 'neutral';
  style: string;
  emotionalRange: string[];
  sampleText?: string;
  available: boolean;
}

const DEFAULT_VOICES: VoiceProfile[] = [
  // Gemini 2.5 Pro Preview TTS Voices - TOP RECOMMENDATIONS
  {
    id: 'aoede' as const,
    name: 'Aoede',
    description: 'Breezy and natural voice',
    personality: 'Friendly, conversational, and naturally engaging',
    gender: 'female',
    style: 'Breezy, natural flow with warm undertones',
    emotionalRange: ['natural', 'friendly', 'conversational', 'warm'],
    sampleText: 'Hi! I\'m Aoede. Let\'s have a natural, friendly conversation about your dreams.',
    available: true
  },
  {
    id: 'zephyr' as const,
    name: 'Zephyr',
    description: 'Bright and cheerful voice',
    personality: 'Uplifting, positive, and enthusiastic',
    gender: 'female',
    style: 'Bright, cheerful with infectious energy',
    emotionalRange: ['cheerful', 'bright', 'enthusiastic', 'uplifting'],
    sampleText: 'Hello there! I\'m Zephyr, bringing brightness and cheer to our conversation!',
    available: true
  },
  {
    id: 'achernar' as const,
    name: 'Achernar',
    description: 'Soft and gentle voice',
    personality: 'Calming, peaceful, and soothing',
    gender: 'male',
    style: 'Soft, gentle with calming presence',
    emotionalRange: ['gentle', 'soft', 'soothing', 'peaceful'],
    sampleText: 'Welcome. I\'m Achernar. Let\'s explore your thoughts in a calm, gentle space.',
    available: true
  },
  {
    id: 'kore' as const,
    name: 'Kore',
    description: 'Firm and confident voice',
    personality: 'Professional, authoritative, and confident',
    gender: 'female',
    style: 'Firm, confident with clear articulation',
    emotionalRange: ['confident', 'firm', 'authoritative', 'professional'],
    sampleText: 'Good day. I\'m Kore. Let\'s approach your goals with confidence and clarity.',
    available: true
  },
  {
    id: 'charon' as const,
    name: 'Charon',
    description: 'Informative and clear voice',
    personality: 'Educational, articulate, and informative',
    gender: 'male',
    style: 'Clear, informative with excellent diction',
    emotionalRange: ['clear', 'informative', 'articulate', 'educational'],
    sampleText: 'Hello. I\'m Charon. I\'ll help you understand complex ideas with clarity.',
    available: true
  },
  {
    id: 'fenrir' as const,
    name: 'Fenrir',
    description: 'Excitable and dynamic voice',
    personality: 'Energetic, passionate, and engaging',
    gender: 'male',
    style: 'Dynamic, excitable with passionate delivery',
    emotionalRange: ['dynamic', 'excitable', 'energetic', 'passionate'],
    sampleText: 'Hey! I\'m Fenrir! Ready to dive into an exciting conversation? Let\'s go!',
    available: true
  },
  {
    id: 'puck' as const,
    name: 'Puck',
    description: 'Upbeat and energetic voice',
    personality: 'Versatile, balanced, and adaptable',
    gender: 'neutral',
    style: 'Upbeat, energetic with versatile range',
    emotionalRange: ['upbeat', 'energetic', 'versatile', 'balanced'],
    sampleText: 'Hi, I\'m Puck! I bring energy and versatility to every conversation.',
    available: true
  }
];

export const useVoiceDiscovery = () => {
  const log = logger.child({ component: 'useVoiceDiscovery' });
  const [voices, setVoices] = useState<VoiceProfile[]>(DEFAULT_VOICES);
  const [selectedVoice, setSelectedVoice] = useState<string>(() => {
    // Load saved voice from localStorage or select random
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aishi-selected-voice');
      const newVoiceIds = ['aoede', 'zephyr', 'achernar', 'kore', 'charon', 'fenrir', 'puck'];
      if (saved && newVoiceIds.includes(saved)) {
        return saved;
      }
      // Random selection on first visit from top recommendations
      const topVoices = ['aoede', 'zephyr', 'achernar', 'puck'];
      return topVoices[Math.floor(Math.random() * topVoices.length)];
    }
    return 'aoede';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available voices from backend
  const discoverVoices = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/voice/voices`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.voices && Array.isArray(data.voices)) {
        // Map backend voices to our VoiceProfile format (Gemini 2.5 Pro Preview voices)
        const mappedVoices = data.voices.map((voiceId: string) => {
          const defaultVoice = DEFAULT_VOICES.find(v => v.id === voiceId);
          return defaultVoice || {
            id: voiceId,
            name: voiceId.charAt(0).toUpperCase() + voiceId.slice(1),
            description: `${voiceId} voice profile`,
            personality: 'AI voice assistant',
            gender: 'neutral',
            style: 'Natural conversational tone',
            emotionalRange: ['neutral'],
            available: true
          };
        });

        setVoices(mappedVoices);
      } else {
        // Use default voices if backend doesn't provide list
        setVoices(DEFAULT_VOICES);
      }
    } catch (error) {
      log.error('Failed to discover voices', { error });
      setError(error instanceof Error ? error.message : 'Failed to discover voices');
      // Fallback to default voices
      setVoices(DEFAULT_VOICES);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Test a voice by synthesizing sample text
  const testVoice = useCallback(async (voiceId: string) => {
    log.debug('Starting voice test', { voiceId });
    setIsTesting(true);
    setError(null);

    try {
      const voice = voices.find(v => v.id === voiceId);
      if (!voice) {
        throw new Error('Voice not found');
      }

      const sampleText = voice.sampleText || `Hello! This is a test of the ${voice.name} voice.`;

      // Request TTS synthesis
      log.debug('Sending TTS request', { sampleText, voiceId, url: `${BACKEND_URL}/voice/synthesize` });

      const response = await fetch(`${BACKEND_URL}/voice/synthesize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: sampleText,
          voiceId: voiceId,
          emotionalTone: 'neutral',
          speed: 1.0,
          pitch: 1.0
        }),
      });

      log.debug('TTS response received', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText
      });

      if (!response.ok) {
        throw new Error(`Failed to synthesize voice: ${response.statusText}`);
      }

      const responseData = await response.json();

      // Handle API response structure { success: true, data: { audioData, format, ... } }
      const data = responseData.data || responseData;

      log.debug('TTS response structure', {
        hasSuccess: 'success' in responseData,
        hasData: 'data' in responseData,
        topLevelKeys: Object.keys(responseData)
      });

      log.debug('TTS response data', {
        hasAudioData: !!data.audioData,
        audioDataLength: data.audioData?.length,
        format: data.format,
        duration: data.duration,
        voiceUsed: data.voiceUsed
      });

      if (data.audioData) {
        // Check WAV header (first few bytes)
        const headerBytes = data.audioData.substring(0, 8);
        log.debug('Audio header (base64)', { headerBytes });

        // Create audio element and play
        const dataUri = `data:audio/wav;base64,${data.audioData}`;
        log.debug('Creating audio element', { dataUriLength: dataUri.length });

        const audio = new Audio(dataUri);
        audio.volume = 0.8;

        // Add debug event listeners
        audio.addEventListener('loadstart', () => log.debug('Audio event: loadstart'));
        audio.addEventListener('loadeddata', () => log.debug('Audio event: loadeddata'));
        audio.addEventListener('canplay', () => log.debug('Audio event: canplay'));
        audio.addEventListener('play', () => log.debug('Audio event: play'));
        audio.addEventListener('playing', () => log.debug('Audio event: playing'));
        audio.addEventListener('error', (e) => {
          log.debug('Audio event: error', {
            error: e,
            audioError: audio.error,
            errorCode: audio.error?.code,
            errorMessage: audio.error?.message
          });
        });

        // Play the audio
        log.debug('Attempting to play audio', {
          readyState: audio.readyState,
          networkState: audio.networkState,
          duration: audio.duration
        });

        try {
          const playPromise = audio.play();
          log.debug('Play promise created');
          await playPromise;
          log.debug('Audio playback started successfully');
        } catch (playError) {
          log.debug('Play promise rejected', {
            error: playError,
            errorMessage: (playError as Error).message
          });
          throw playError;
        }

        // Wait for playback to complete
        return new Promise((resolve) => {
          audio.addEventListener('ended', () => {
            log.debug('Audio playback ended');
            resolve(true);
          });

          // Error handler already added above, but add resolution
          const errorHandler = (e: Event) => {
            log.debug('Audio playback error in promise', { event: e });
            resolve(false);
          };

          // If error wasn't already added
          if (!audio.onerror) {
            audio.addEventListener('error', errorHandler);
          }
        });
      }
    } catch (error) {
      log.error('Failed to test voice', { error });
      setError(error instanceof Error ? error.message : 'Failed to test voice');
      return false;
    } finally {
      setIsTesting(false);
    }
  }, [voices, log]);

  // Test current selected voice
  const testSelectedVoice = useCallback(async () => {
    return testVoice(selectedVoice);
  }, [selectedVoice, testVoice]);

  // Initial discovery on mount
  useEffect(() => {
    discoverVoices();
  }, []);

  // Save selected voice to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('aishi-selected-voice', selectedVoice);
    }
  }, [selectedVoice]);

  // Get the currently selected voice object
  const getSelectedVoice = useCallback(() => {
    return voices.find(v => v.id === selectedVoice) || voices[0];
  }, [selectedVoice, voices]);

  return {
    voices,
    selectedVoice,
    setSelectedVoice,
    isLoading,
    isTesting,
    error,
    testVoice,
    testSelectedVoice,
    getSelectedVoice,
    refreshVoices: discoverVoices
  };
};

export default useVoiceDiscovery;