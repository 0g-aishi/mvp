/**
 * @fileoverview Gemini Audio Service - Native Audio Processing with Gemini 2.5 Flash
 * @description Speech-to-Text using Gemini's native audio understanding capabilities
 * No language pre-configuration needed - automatic detection!
 */

const geminiService = require('./geminiService');
const { createLogger } = require('../lib/logger');

const log = createLogger('GeminiAudioService');

// Debug logging
const debugLog = (message: string, data?: any) => {
  if (process.env.TEST_ENV === 'true') {
    log.debug(message, data || {});
  }
};

interface GeminiSTTResult {
  transcript: string;
  detectedLanguage: string;     // "Polish", "English", "Japanese", etc.
  languageCode: string;          // "pl", "en", "ja", etc.
  confidence: number;            // 0.0 - 1.0
  processingTime: number;
  metadata?: {
    hasTimestamps?: boolean;
    speakerCount?: number;
  };
}

interface GeminiSTTRequest {
  audioBuffer: Buffer;
  inputFormat: 'webm' | 'wav' | 'mp3' | 'ogg' | 'opus';
  prompt?: string;               // Optional custom prompt for transcription
  includeTimestamps?: boolean;
}

class GeminiAudioService {
  private isInitialized = false;

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    try {
      // Ensure geminiService is initialized
      if (!geminiService.isReady()) {
        await geminiService.initialize();
      }

      this.isInitialized = true;
      debugLog('✅ Gemini Audio Service initialized');
    } catch (error) {
      debugLog('❌ Failed to initialize Gemini Audio Service', { error: String(error) });
      throw error;
    }
  }

  /**
   * Transcribe audio using Gemini 2.5 Flash native audio understanding
   * Automatically detects language without any pre-configuration!
   */
  async transcribeAudio(params: GeminiSTTRequest): Promise<GeminiSTTResult> {
    const startTime = Date.now();

    debugLog('Starting Gemini native audio transcription', {
      audioSize: params.audioBuffer.length,
      format: params.inputFormat,
      includeTimestamps: params.includeTimestamps
    });

    try {
      // Ensure service is initialized
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Validate audio buffer
      if (!params.audioBuffer || params.audioBuffer.length === 0) {
        throw new Error('Invalid audio buffer provided');
      }

      // Convert audio buffer to base64
      const audioBase64 = params.audioBuffer.toString('base64');

      // Map input format to MIME type
      const mimeTypeMap: Record<string, string> = {
        'webm': 'audio/webm',
        'wav': 'audio/wav',
        'mp3': 'audio/mp3',
        'ogg': 'audio/ogg',
        'opus': 'audio/opus'
      };

      const mimeType = mimeTypeMap[params.inputFormat] || 'audio/webm';

      // Build the multimodal prompt for Gemini
      const transcriptionPrompt = params.prompt || `
Please transcribe this audio and provide:
1. The full transcription
2. The detected language (full name like "English", "Polish", "Japanese")
3. The ISO 639-1 language code (like "en", "pl", "ja")

Return ONLY a JSON object with this exact structure, no markdown:
{
  "transcript": "the transcribed text here",
  "language": "English",
  "languageCode": "en"
}`;

      debugLog('Sending audio to Gemini 2.5 Flash', {
        mimeType,
        audioBase64Length: audioBase64.length,
        promptLength: transcriptionPrompt.length
      });

      // Call Gemini with native audio input
      // Using the fast profile for quick transcription
      // IMPORTANT: Gemini expects array/object, not JSON string!
      const contents = [
        {
          role: "user",
          parts: [
            {
              text: transcriptionPrompt
            },
            {
              inlineData: {
                mimeType: mimeType,
                data: audioBase64
              }
            }
          ]
        }
      ];

      // Log what we're sending (first 200 chars)
      debugLog('Sending contents to Gemini (not stringified)', {
        contentsType: typeof contents,
        isArray: Array.isArray(contents),
        firstPart: contents[0]?.parts?.[0]?.text?.substring(0, 100)
      });

      const response = await geminiService.generateContentWithProfile(
        contents,  // Pass as object/array, not JSON string
        'fast' // Use fast profile for transcription
      );

      const processingTime = Date.now() - startTime;

      // Parse the JSON response from Gemini
      let parsedResponse;
      try {
        // Clean the response (remove markdown if present)
        const cleanedResponse = response.data
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();

        parsedResponse = JSON.parse(cleanedResponse);
      } catch (parseError) {
        debugLog('Failed to parse Gemini response as JSON, using raw text', {
          response: response.data.substring(0, 200),
          error: String(parseError)
        });

        // Fallback: treat entire response as transcript
        parsedResponse = {
          transcript: response.data,
          language: 'English',
          languageCode: 'en'
        };
      }

      // Extract and validate response fields
      const transcript = parsedResponse.transcript || '';
      const detectedLanguage = parsedResponse.language || 'English';
      const languageCode = parsedResponse.languageCode || this.extractLanguageCode(detectedLanguage);

      debugLog('Transcription completed successfully', {
        transcript: transcript.substring(0, 100),
        detectedLanguage,
        languageCode,
        processingTime
      });

      return {
        transcript,
        detectedLanguage,
        languageCode,
        confidence: 0.95, // Gemini doesn't provide confidence scores, using high default
        processingTime,
        metadata: {
          hasTimestamps: params.includeTimestamps || false
        }
      };

    } catch (error) {
      debugLog('Gemini audio transcription failed', { error: String(error) });

      // Return error result
      return {
        transcript: '[Transcription failed]',
        detectedLanguage: 'English',
        languageCode: 'en',
        confidence: 0.0,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Detect language from text using Gemini Flash Lite
   * Used for TTS voice selection
   */
  async detectLanguageFromText(text: string): Promise<{ language: string; code: string }> {
    debugLog('Detecting language from text', { textLength: text.length });

    try {
      const prompt = `Detect the language of this text and return ONLY a JSON object:
Text: "${text.substring(0, 500)}"

Return format (no markdown):
{
  "language": "English",
  "code": "en"
}`;

      // Use fast profile for quick detection
      const response = await geminiService.generateContentWithProfile(prompt, 'fast');

      // Parse response
      const cleanedResponse = response.data
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const result = JSON.parse(cleanedResponse);

      debugLog('Language detected', result);

      return {
        language: result.language || 'English',
        code: result.code || 'en'
      };

    } catch (error) {
      debugLog('Language detection failed, defaulting to English', { error: String(error) });
      return { language: 'English', code: 'en' };
    }
  }

  /**
   * Extract language code from language name
   * Fallback for when Gemini doesn't provide the code
   */
  private extractLanguageCode(language: string): string {
    const languageMap: Record<string, string> = {
      'English': 'en',
      'Polish': 'pl',
      'Japanese': 'ja',
      'German': 'de',
      'French': 'fr',
      'Spanish': 'es',
      'Italian': 'it',
      'Portuguese': 'pt',
      'Russian': 'ru',
      'Korean': 'ko',
      'Chinese': 'zh',
      'Arabic': 'ar',
      'Hindi': 'hi',
      'Dutch': 'nl',
      'Swedish': 'sv',
      'Norwegian': 'no',
      'Danish': 'da',
      'Finnish': 'fi',
      'Turkish': 'tr',
      'Greek': 'el',
      'Hebrew': 'he',
      'Thai': 'th',
      'Vietnamese': 'vi',
      'Indonesian': 'id',
      'Malay': 'ms',
      'Czech': 'cs',
      'Slovak': 'sk',
      'Hungarian': 'hu',
      'Romanian': 'ro',
      'Bulgarian': 'bg',
      'Ukrainian': 'uk'
    };

    return languageMap[language] || 'en';
  }

  /**
   * Get supported audio formats
   */
  getSupportedFormats(): string[] {
    return ['webm', 'wav', 'mp3', 'ogg', 'opus'];
  }

  /**
   * Check if format is supported
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
    return {
      isReady: this.isInitialized && geminiService.isReady(),
      geminiReady: geminiService.isReady(),
      supportedFormats: this.getSupportedFormats(),
      nativeAudioSupport: true,
      automaticLanguageDetection: true
    };
  }

  /**
   * Test connection to Gemini
   */
  async testConnection(): Promise<boolean> {
    try {
      debugLog('Testing Gemini connection');

      // Simple test prompt
      const response = await geminiService.generateContentWithProfile(
        'Say "connection successful"',
        'fast'
      );

      return response.success;
    } catch (error) {
      debugLog('Connection test failed', { error: String(error) });
      return false;
    }
  }
}

module.exports = new GeminiAudioService();