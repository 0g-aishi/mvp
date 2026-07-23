/**
 * @fileoverview Speech-to-Text Service using Gemini 2.5 Flash Native Audio
 * @description Converts audio input to text with automatic language detection using Gemini's native audio understanding
 */

const geminiAudioService = require('./geminiAudioService');
const { createLogger } = require('../lib/logger');

const log = createLogger('SpeechToTextService');

// Debug logging
const debugLog = (message: string, data?: any) => {
  if (process.env.TEST_ENV === 'true') {
    log.debug(message, data || {});
  }
};

interface STTResult {
  transcript: string;
  detectedLanguage: string;     // "Polish", "English", "Japanese", etc.
  languageCode: string;        // "pl", "en", "ja", etc.
  confidence: number;
  processingTime: number;
}

interface STTRequest {
  audioBuffer: Buffer;
  inputFormat: 'webm' | 'wav' | 'mp3' | 'ogg';
  enableLanguageDetection?: boolean;
}

class SpeechToTextService {
  /**
   * Convert audio to text using Gemini 2.5 Flash native audio understanding
   * Automatically detects language without any pre-configuration!
   */
  async transcribeAudio(params: STTRequest): Promise<STTResult> {
    const startTime = Date.now();

    debugLog('Starting Gemini native audio transcription', {
      audioSize: params.audioBuffer.length,
      format: params.inputFormat,
      enableLanguageDetection: params.enableLanguageDetection !== false
    });

    try {
      // Ensure Gemini Audio Service is initialized
      if (!geminiAudioService.getStatus().isReady) {
        await geminiAudioService.initialize();
      }

      // Call Gemini Audio Service for transcription
      const result = await geminiAudioService.transcribeAudio({
        audioBuffer: params.audioBuffer,
        inputFormat: params.inputFormat as 'webm' | 'wav' | 'mp3' | 'ogg' | 'opus',
        includeTimestamps: false
      });

      debugLog('Transcription completed successfully', {
        transcript: result.transcript.substring(0, 100),
        detectedLanguage: result.detectedLanguage,
        languageCode: result.languageCode,
        confidence: result.confidence,
        processingTime: result.processingTime
      });

      // Return in the expected format
      return {
        transcript: result.transcript,
        detectedLanguage: result.detectedLanguage,
        languageCode: result.languageCode,
        confidence: result.confidence,
        processingTime: result.processingTime
      };

    } catch (error) {
      debugLog('Gemini audio transcription failed', { error: String(error) });

      // Return error result with processing time
      return {
        transcript: '[Speech transcription failed]',
        detectedLanguage: 'English',
        languageCode: 'en',
        confidence: 0.0,
        processingTime: Date.now() - startTime
      };
    }
  }


  /**
   * Get supported audio formats
   */
  getSupportedFormats(): string[] {
    return ['webm', 'wav', 'mp3', 'ogg', 'opus', 'flac'];
  }

  /**
   * Validate audio format
   */
  isFormatSupported(format: string): boolean {
    return this.getSupportedFormats().includes(format.toLowerCase());
  }

  /**
   * Get service status
   */
  getStatus(): {
    isReady: boolean;
    geminiReady: boolean;
    supportedFormats: string[];
    nativeAudioSupport: boolean;
    automaticLanguageDetection: boolean;
  } {
    const geminiStatus = geminiAudioService.getStatus();

    return {
      isReady: geminiStatus.isReady,
      geminiReady: geminiStatus.geminiReady,
      supportedFormats: this.getSupportedFormats(),
      nativeAudioSupport: true,
      automaticLanguageDetection: true
    };
  }

  /**
   * Test Gemini Audio Service connection
   */
  async testConnection(): Promise<boolean> {
    try {
      debugLog('Testing Gemini Audio Service connection');
      return await geminiAudioService.testConnection();
    } catch (error) {
      debugLog('Connection test failed', { error: String(error) });
      return false;
    }
  }
}

module.exports = new SpeechToTextService();