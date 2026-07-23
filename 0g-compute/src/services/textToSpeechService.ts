/**
 * @fileoverview Text-to-Speech Service using Google Cloud TTS with Gemini models
 * @description Converts text to natural speech with Gemini 2.5 Pro/Flash Preview voices
 */

const { TextToSpeechClient } = require('@google-cloud/text-to-speech');
const geminiAudioService = require('./geminiAudioService');
const { createLogger } = require('../lib/logger');

const log = createLogger('TextToSpeechService');

// Initialize Google Cloud Text-to-Speech client with Gemini support
const ttsClient = new TextToSpeechClient();

// Debug logging
const debugLog = (message: string, data?: any) => {
  if (process.env.TEST_ENV === 'true') {
    log.debug(message, data || {});
  }
};

interface TTSVoiceProfile {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  description: string;
  emotionalRange: string[];
  supportedLanguages: 'all';
}

interface TTSRequest {
  text: string;
  voiceId: string;
  detectedLanguage?: string;    // Auto-detected from text
  languageCode?: string;       // ISO code
  emotionalTone?: 'neutral' | 'empathetic' | 'excited' | 'calm' | 'warm';
  speed?: number;              // 0.5 - 2.0
  pitch?: number;              // 0.5 - 2.0
}

interface TTSResult {
  audioBuffer: Buffer;
  format: string;
  duration: number;
  voiceUsed: string;
  detectedLanguage: string;
  processingTime: number;
}

// Gemini 2.5 Pro Preview TTS Voice Profiles - TOTAL REPLACEMENT
const VOICE_PROFILES: TTSVoiceProfile[] = [
  // TOP RECOMMENDATIONS for AI Assistants
  {
    id: 'aoede',
    name: 'Aoede',
    gender: 'female',
    description: 'Breezy and natural - perfect for friendly conversations',
    emotionalRange: ['natural', 'friendly', 'conversational', 'warm'],
    supportedLanguages: 'all'
  },
  {
    id: 'zephyr',
    name: 'Zephyr',
    gender: 'female',
    description: 'Bright and cheerful - ideal for positive interactions',
    emotionalRange: ['cheerful', 'bright', 'enthusiastic', 'uplifting'],
    supportedLanguages: 'all'
  },
  {
    id: 'achernar',
    name: 'Achernar',
    gender: 'male',
    description: 'Soft and gentle - perfect for calming presence',
    emotionalRange: ['gentle', 'soft', 'soothing', 'peaceful'],
    supportedLanguages: 'all'
  },
  {
    id: 'kore',
    name: 'Kore',
    gender: 'female',
    description: 'Firm and confident - great for professional contexts',
    emotionalRange: ['confident', 'firm', 'authoritative', 'professional'],
    supportedLanguages: 'all'
  },
  {
    id: 'charon',
    name: 'Charon',
    gender: 'male',
    description: 'Informative and clear - ideal for educational content',
    emotionalRange: ['clear', 'informative', 'articulate', 'educational'],
    supportedLanguages: 'all'
  },
  {
    id: 'fenrir',
    name: 'Fenrir',
    gender: 'male',
    description: 'Excitable and dynamic - perfect for engaging narratives',
    emotionalRange: ['dynamic', 'excitable', 'energetic', 'passionate'],
    supportedLanguages: 'all'
  },
  {
    id: 'puck',
    name: 'Puck',
    gender: 'neutral',
    description: 'Upbeat and energetic - default voice for general use',
    emotionalRange: ['upbeat', 'energetic', 'versatile', 'balanced'],
    supportedLanguages: 'all'
  },
  // Additional voices from screenshots
  {
    id: 'achird',
    name: 'Achird',
    gender: 'male',
    description: 'Steady and reliable voice',
    emotionalRange: ['steady', 'reliable', 'consistent', 'trustworthy'],
    supportedLanguages: 'all'
  },
  {
    id: 'algenib',
    name: 'Algenib',
    gender: 'female',
    description: 'Sophisticated and elegant voice',
    emotionalRange: ['sophisticated', 'elegant', 'refined', 'graceful'],
    supportedLanguages: 'all'
  },
  {
    id: 'algieba',
    name: 'Algieba',
    gender: 'female',
    description: 'Warm and welcoming voice',
    emotionalRange: ['warm', 'welcoming', 'hospitable', 'friendly'],
    supportedLanguages: 'all'
  },
  {
    id: 'alnilam',
    name: 'Alnilam',
    gender: 'male',
    description: 'Strong and commanding voice',
    emotionalRange: ['strong', 'commanding', 'powerful', 'authoritative'],
    supportedLanguages: 'all'
  },
  {
    id: 'autonoe',
    name: 'Autonoe',
    gender: 'female',
    description: 'Mysterious and intriguing voice',
    emotionalRange: ['mysterious', 'intriguing', 'enigmatic', 'captivating'],
    supportedLanguages: 'all'
  },
  {
    id: 'callirhoe',
    name: 'Callirhoe',
    gender: 'female',
    description: 'Melodic and harmonious voice',
    emotionalRange: ['melodic', 'harmonious', 'musical', 'flowing'],
    supportedLanguages: 'all'
  }
];

// NO VOICE MAPPING NEEDED - Gemini 2.5 Pro Preview TTS handles all languages automatically

class TextToSpeechService {
  /**
   * Preprocess text with Gemini Flash Lite to detect language and prepare for TTS
   * Intelligently handles chunking for Chirp3-HD model
   * @private
   */
  private async preprocessTextForEmotion(text: string, voiceProfile: TTSVoiceProfile): Promise<{ text: string; language: string; voice: string }> {
    try {
      debugLog('Preprocessing text for TTS', { originalLength: text.length });

      const ttsModel = process.env.TTS_MODEL || 'gemini-2.5-flash-preview-tts';
      const isChirp3HD = ttsModel.includes('Chirp3-HD');

      const prompt = `Detect language and prepare chunking for TTS synthesis.

CRITICAL RULES:
- DO NOT MODIFY TEXT CONTENT!
- PRESERVE EXACT WORDING, PUNCTUATION, AND STRUCTURE!
- ONLY add [CHUNK] markers if text is too long
- ONLY detect language code

Model: ${ttsModel}
Selected voice: ${voiceProfile.name}
Text length: ${text.length} characters

Tasks:
1. Detect language from text content (pl-PL, en-US, es-ES, de-DE, fr-FR, ja-JP, etc.)
2. Build complete voice name: ${isChirp3HD ? '[language]-Chirp3-HD-' + voiceProfile.name : voiceProfile.name}
3. Smart chunking (PRESERVE EXACT TEXT):
   ${isChirp3HD
     ? '- If text >4500 chars: insert [CHUNK] at sentence/paragraph boundaries\n   - Each chunk max 4500 characters\n   - DO NOT rewrite or modify sentences!'
     : '- If text >3000 chars: insert [CHUNK] at natural pauses (periods, commas)\n   - Each chunk max 3000 characters\n   - DO NOT rewrite or modify text!'}

ORIGINAL TEXT (preserve exactly):
"${text}"

Return ONLY valid JSON (no markdown):
{
  "text": "EXACT original text with [CHUNK] markers ONLY (no other changes)",
  "language": "detected-language-code",
  "voice": "complete-voice-name-ready-for-TTS"
}`;

      // Use geminiService directly with fast profile
      const geminiService = require('./geminiService');
      if (!geminiService.isReady()) {
        await geminiService.initialize();
      }

      const response = await geminiService.generateContentWithProfile(prompt, 'fast');

      // Clean and parse JSON response
      const cleanedResponse = response.data
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const result = JSON.parse(cleanedResponse);

      debugLog('Preprocessing completed', {
        processedLength: result.text.length,
        detectedLanguage: result.language,
        voiceName: result.voice,
        hasChunks: result.text.includes('[CHUNK]'),
        preview: result.text.substring(0, 100)
      });

      return {
        text: result.text,
        language: result.language || 'en-US',
        voice: result.voice || voiceProfile.name
      };
    } catch (error) {
      debugLog('Preprocessing failed, using defaults', { error: String(error) });
      return {
        text: text,
        language: 'en-US',
        voice: voiceProfile.name
      };
    }
  }

  /**
   * Synthesize a single chunk of text
   * @private
   */
  private async synthesizeChunk(
    chunkText: string,
    voiceProfile: TTSVoiceProfile,
    languageCode: string,
    speed: number,
    pitch: number,
    fullVoiceName?: string
  ): Promise<Buffer> {
    const ttsModel = process.env.TTS_MODEL || 'gemini-2.5-flash-preview-tts';
    const isChirp3HD = ttsModel.includes('Chirp3-HD');

    debugLog('Synthesizing chunk', {
      chunkLength: chunkText.length,
      chunkBytes: Buffer.byteLength(chunkText, 'utf8'),
      voice: voiceProfile.name,
      language: languageCode
    });

    // Log the voice configuration
    log.debug('Building request', {
      voiceName: fullVoiceName || voiceProfile.name,
      languageCode,
      modelName: ttsModel,
      chunkSize: chunkText.length,
      isChirp3HD
    });

    const request = {
      input: {
        text: chunkText
      },
      voice: {
        languageCode: languageCode,
        name: fullVoiceName || voiceProfile.name, // Use preprocessed full voice name
        ...(isChirp3HD ? {} : { modelName: ttsModel }) // Only add modelName for non-Chirp3HD
      } as any,
      audioConfig: {
        audioEncoding: 'LINEAR16' as any,
        sampleRateHertz: 48000,
        volumeGainDb: 0.0,
        // Chirp3-HD doesn't support speakingRate and pitch
        ...(isChirp3HD ? {} : {
          speakingRate: speed,
          pitch: pitch
        })
      }
    };

    const [response] = await ttsClient.synthesizeSpeech(request);

    if (!response.audioContent) {
      throw new Error('No audio content received for chunk');
    }

    return Buffer.from(response.audioContent as Uint8Array);
  }

  /**
   * Combine multiple WAV audio buffers into a single buffer
   * @private
   */
  private combineAudioBuffers(audioBuffers: Buffer[]): Buffer {
    if (audioBuffers.length === 0) {
      return Buffer.alloc(0);
    }

    if (audioBuffers.length === 1) {
      return audioBuffers[0];
    }

    debugLog('Combining audio buffers', {
      bufferCount: audioBuffers.length,
      bufferSizes: audioBuffers.map(b => b.length)
    });

    // For LINEAR16 WAV files, we need to:
    // 1. Skip WAV headers (44 bytes) from all but first buffer
    // 2. Concatenate the raw audio data

    const wavHeaderSize = 44;
    const combinedBuffers: Buffer[] = [audioBuffers[0]]; // Keep first buffer with header

    // Add raw audio data from subsequent buffers (skip their headers)
    for (let i = 1; i < audioBuffers.length; i++) {
      if (audioBuffers[i].length > wavHeaderSize) {
        // Add small silence gap between chunks (0.1 second at 48kHz, 16-bit)
        const silenceFrames = 4800; // 0.1 second * 48000 Hz
        const silenceBuffer = Buffer.alloc(silenceFrames * 2); // 2 bytes per frame for 16-bit
        combinedBuffers.push(silenceBuffer);

        // Add audio data without header
        combinedBuffers.push(audioBuffers[i].slice(wavHeaderSize));
      }
    }

    const combinedBuffer = Buffer.concat(combinedBuffers);

    // Update WAV header with new file size
    const dataSize = combinedBuffer.length - wavHeaderSize;
    const fileSize = dataSize + 36;

    // Update RIFF chunk size (bytes 4-7)
    combinedBuffer.writeUInt32LE(fileSize, 4);
    // Update data chunk size (bytes 40-43)
    combinedBuffer.writeUInt32LE(dataSize, 40);

    debugLog('Audio buffers combined', {
      finalSize: combinedBuffer.length,
      durationEstimate: dataSize / (48000 * 2) // samples / (sampleRate * bytesPerSample)
    });

    return combinedBuffer;
  }

  /**
   * Convert text to speech using Gemini 2.5 Pro Preview TTS
   */
  async synthesizeSpeech(params: TTSRequest): Promise<TTSResult> {
    const startTime = Date.now();

    // ENHANCED LOGGING - Check environment variables
    log.info('Starting TTS synthesis', {
      TTS_MODEL: process.env.TTS_MODEL,
      GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      VERTEX_AI_PROJECT: process.env.VERTEX_AI_PROJECT,
      VERTEX_AI_LOCATION: process.env.VERTEX_AI_LOCATION
    });

    debugLog('Starting Gemini 2.5 Pro Preview TTS synthesis', {
      textLength: params.text.length,
      voiceId: params.voiceId,
      providedLanguage: params.detectedLanguage || params.languageCode
    });

    log.info('Input params', {
      voiceId: params.voiceId,
      textPreview: params.text.substring(0, 100),
      hasEmotionalTags: params.text.includes('[')
    });

    try {
      // Validate input
      if (!params.text || params.text.trim().length === 0) {
        throw new Error('Text input is required and cannot be empty');
      }

      if (params.text.length > 5000) {
        debugLog('Text too long, truncating', { originalLength: params.text.length });
        params.text = params.text.substring(0, 5000) + '...';
      }

      // Validate voice profile
      const voiceProfile = this.getVoiceProfile(params.voiceId);
      if (!voiceProfile) {
        throw new Error(`Unsupported voice: ${params.voiceId}`);
      }

      // ONE CALL: Preprocess text, detect language, and get full voice name
      const preprocessResult = await this.preprocessTextForEmotion(params.text, voiceProfile);
      const processedText = preprocessResult.text;
      const languageCode = params.languageCode || preprocessResult.language || 'en-US';
      const fullVoiceName = preprocessResult.voice;

      debugLog('Preprocessing completed', {
        detectedLanguage: preprocessResult.language,
        usedLanguageCode: languageCode,
        fullVoiceName: fullVoiceName,
        hasChunks: processedText.includes('[CHUNK]'),
        textPreview: processedText.substring(0, 100)
      });

      // Check if text needs to be chunked
      const chunks = processedText.includes('[CHUNK]')
        ? processedText.split('[CHUNK]').map(c => c.trim()).filter(c => c.length > 0)
        : [processedText];

      log.info('Text chunking', {
        totalChunks: chunks.length,
        chunkSizes: chunks.map(c => Buffer.byteLength(c, 'utf8')),
        needsChunking: chunks.length > 1
      });

      // Prepare speed and pitch normalization
      const normalizedSpeed = this.normalizeSpeed(params.speed || 1.0);
      const normalizedPitch = this.normalizePitch(params.pitch || 0);

      let audioBuffer: Buffer;
      let estimatedDuration: number;

      if (chunks.length === 1) {
        // Single chunk - process normally
        log.info('Processing as single chunk');
        audioBuffer = await this.synthesizeChunk(
          chunks[0],
          voiceProfile,
          languageCode,
          normalizedSpeed,
          normalizedPitch,
          fullVoiceName
        );
        estimatedDuration = this.estimateAudioDuration(chunks[0], normalizedSpeed);
      } else {
        // Multiple chunks - process sequentially and combine
        log.info('Processing multiple chunks sequentially');
        const audioBuffers: Buffer[] = [];

        for (let i = 0; i < chunks.length; i++) {
          log.info('Processing chunk', { chunk: i + 1, total: chunks.length, size: Buffer.byteLength(chunks[i], 'utf8') });

          try {
            const chunkAudio = await this.synthesizeChunk(
              chunks[i],
              voiceProfile,
              languageCode,
              normalizedSpeed,
              normalizedPitch,
              fullVoiceName
            );
            audioBuffers.push(chunkAudio);

            debugLog(`Chunk ${i + 1}/${chunks.length} synthesized successfully`, {
              audioSize: chunkAudio.length,
              chunkText: chunks[i].substring(0, 50)
            });
          } catch (chunkError: any) {
            log.error('Failed to synthesize chunk', { chunk: i + 1, error: chunkError.message });
            // Continue with other chunks even if one fails
            if (chunkError.message?.includes('900 bytes')) {
              log.error('Chunk still exceeds limit after splitting. Consider more aggressive chunking');
            }
          }
        }

        if (audioBuffers.length === 0) {
          throw new Error('Failed to synthesize any chunks');
        }

        // Combine all audio buffers
        log.info('Combining audio chunks');
        audioBuffer = this.combineAudioBuffers(audioBuffers);

        // Estimate total duration
        estimatedDuration = chunks.reduce((total, chunk) =>
          total + this.estimateAudioDuration(chunk, normalizedSpeed), 0
        );
      }

      const processingTime = Date.now() - startTime;

      debugLog('Gemini TTS synthesis completed successfully', {
        audioSize: audioBuffer.length,
        estimatedDuration,
        processingTime,
        languageCode,
        voiceUsed: voiceProfile.name,
        hasEmotionalTags: processedText.includes('['),
        hasChunks: chunks.length > 1,
        totalChunks: chunks.length,
        model: process.env.TTS_MODEL || 'gemini-2.5-flash-preview-tts'
      });

      return {
        audioBuffer,
        format: 'wav', // LINEAR16 is WAV format
        duration: estimatedDuration,
        voiceUsed: voiceProfile.name,
        detectedLanguage: this.getLanguageName(languageCode),
        processingTime
      };

    } catch (error: any) {
      log.error('ERROR in TTS synthesis', {
        errorMessage: error.message,
        errorStack: error.stack,
        errorDetails: error.details || 'No additional details',
        errorCode: error.code
      });

      debugLog('Gemini 2.5 Pro Preview TTS synthesis failed', { error: String(error) });

      const emptyBuffer = Buffer.alloc(0);
      return {
        audioBuffer: emptyBuffer,
        format: 'wav',
        duration: 0,
        voiceUsed: params.voiceId,
        detectedLanguage: 'English',
        processingTime: Date.now() - startTime
      };
    }
  }

  // REMOVED: detectLanguageWithGemini - Now handled in preprocessTextForEmotion ONE CALL

  /**
   * Get voice profile by ID
   * @private
   */
  private getVoiceProfile(voiceId: string): TTSVoiceProfile | undefined {
    return VOICE_PROFILES.find(profile => profile.id === voiceId);
  }


  /**
   * Get readable language name from code
   * @private
   */
  private getLanguageName(languageCode: string): string {
    const languageNames: Record<string, string> = {
      'en-US': 'English',
      'pl-PL': 'Polish',
      'ja-JP': 'Japanese',
      'de-DE': 'German',
      'fr-FR': 'French',
      'es-ES': 'Spanish',
      'en': 'English',
      'pl': 'Polish',
      'ja': 'Japanese',
      'de': 'German',
      'fr': 'French',
      'es': 'Spanish'
    };

    return languageNames[languageCode] || 'English';
  }

  /**
   * Normalize speaking speed to Google Cloud TTS range
   * @private
   */
  private normalizeSpeed(speed: number): number {
    return Math.max(0.25, Math.min(4.0, speed)); // Google Cloud TTS range
  }

  /**
   * Normalize pitch to Google Cloud TTS range
   * @private
   */
  private normalizePitch(pitch: number): number {
    return Math.max(-20.0, Math.min(20.0, pitch)); // Google Cloud TTS range in semitones
  }

  /**
   * Estimate audio duration based on text length and speaking rate
   * @private
   */
  private estimateAudioDuration(text: string, speakingRate: number): number {
    // Average speaking rate: ~150 words per minute at normal speed
    const wordsPerMinute = 150 * speakingRate;
    const wordCount = text.split(/\s+/).length;
    return Math.max(1, (wordCount / wordsPerMinute) * 60); // Duration in seconds
  }

  /**
   * Get available voice profiles
   */
  getAvailableVoices(): TTSVoiceProfile[] {
    return [...VOICE_PROFILES];
  }

  /**
   * Get recommended voice for emotional tone
   */
  getRecommendedVoice(emotionalTone: string): string {
    switch (emotionalTone) {
      case 'empathetic':
      case 'warm':
      case 'caring':
        return 'aoede'; // Breezy and natural
      case 'professional':
      case 'informative':
        return 'kore'; // Firm and confident
      case 'calm':
      case 'reassuring':
        return 'achernar'; // Soft and gentle
      case 'cheerful':
      case 'excited':
        return 'zephyr'; // Bright and cheerful
      case 'dynamic':
      case 'energetic':
        return 'fenrir'; // Excitable and dynamic
      case 'educational':
      case 'clear':
        return 'charon'; // Informative and clear
      default:
        return 'puck'; // Upbeat and energetic (default)
    }
  }

  /**
   * Get service status
   */
  getStatus(): {
    isReady: boolean;
    geminiReady: boolean;
    availableVoices: number;
    supportedLanguages: string;
    ttsModel: string;
  } {
    return {
      isReady: !!ttsClient && geminiAudioService.getStatus().isReady,
      geminiReady: geminiAudioService.getStatus().geminiReady,
      availableVoices: VOICE_PROFILES.length,
      supportedLanguages: '24+ languages (automatic detection)',
      ttsModel: process.env.TTS_MODEL || 'gemini-2.5-flash-preview-tts'
    };
  }
}

module.exports = new TextToSpeechService();