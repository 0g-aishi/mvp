/**
 * @fileoverview Simplified Voice Service for STT → TTS workflow
 * @description Simple orchestrator for speech-to-text and text-to-speech conversion
 */

const speechToTextService = require('./speechToTextService');
const textToSpeechService = require('./textToSpeechService');
const { createLogger } = require('../lib/logger');

const log = createLogger('VoiceService');

// Debug logging
const debugLog = (message: string, data?: any) => {
  if (process.env.TEST_ENV === 'true') {
    log.debug(message, data || {});
  }
};

interface SimpleVoiceRequest {
  audioBuffer: Buffer;
  inputFormat: 'webm' | 'wav' | 'mp3' | 'ogg';
  voiceId?: string;
}

interface SimpleVoiceResult {
  // STT Results
  transcribedText: string;
  detectedLanguage: string;
  languageCode: string;

  // Processing metadata
  totalProcessingTime: number;
  stages: {
    stt: number;
    tts?: number;
  };
}

interface TTSRequest {
  text: string;
  voiceId: string;
  detectedLanguage?: string;
  languageCode?: string;
}

class VoiceService {
  /**
   * Simple speech-to-text conversion
   */
  async convertSpeechToText(params: SimpleVoiceRequest): Promise<SimpleVoiceResult> {
    const pipelineStartTime = Date.now();

    debugLog('Starting speech-to-text conversion', {
      audioSize: params.audioBuffer.length,
      inputFormat: params.inputFormat
    });

    try {
      // Speech-to-Text conversion
      const sttStartTime = Date.now();
      const sttResult = await speechToTextService.transcribeAudio({
        audioBuffer: params.audioBuffer,
        inputFormat: params.inputFormat,
        enableLanguageDetection: true
      });
      const sttTime = Date.now() - sttStartTime;

      debugLog('STT completed', {
        transcript: sttResult.transcript.substring(0, 100),
        detectedLanguage: sttResult.detectedLanguage,
        languageCode: sttResult.languageCode,
        processingTime: sttTime
      });

      const totalProcessingTime = Date.now() - pipelineStartTime;

      return {
        transcribedText: sttResult.transcript,
        detectedLanguage: sttResult.detectedLanguage,
        languageCode: sttResult.languageCode,
        totalProcessingTime,
        stages: {
          stt: sttTime
        }
      };

    } catch (error) {
      debugLog('STT conversion failed', { error: String(error) });

      // Return error response
      return {
        transcribedText: '[transcription failed]',
        detectedLanguage: 'English',
        languageCode: 'en',
        totalProcessingTime: Date.now() - pipelineStartTime,
        stages: { stt: 0 }
      };
    }
  }

  /**
   * Simple text-to-speech conversion
   */
  async convertTextToSpeech(params: TTSRequest): Promise<any> {
    const startTime = Date.now();

    debugLog('Starting text-to-speech conversion', {
      textLength: params.text.length,
      voiceId: params.voiceId,
      detectedLanguage: params.detectedLanguage
    });

    try {
      const selectedVoice = params.voiceId || 'aria';

      const ttsResult = await textToSpeechService.synthesizeSpeech({
        text: params.text,
        voiceId: selectedVoice,
        detectedLanguage: params.detectedLanguage,
        languageCode: params.languageCode,
        speed: 1.0
      });

      const processingTime = Date.now() - startTime;

      debugLog('TTS synthesis completed', {
        voiceUsed: ttsResult.voiceUsed,
        audioSize: ttsResult.audioBuffer.length,
        processingTime
      });

      return {
        ...ttsResult,
        processingTime
      };

    } catch (error) {
      debugLog('TTS conversion failed', { error: String(error) });
      throw error;
    }
  }

  /**
   * Get service status
   */
  getStatus(): {
    isReady: boolean;
    sttReady: boolean;
    ttsReady: boolean;
    availableVoices: string[];
  } {
    const sttStatus = speechToTextService.getStatus();
    const ttsStatus = textToSpeechService.getStatus();

    return {
      isReady: sttStatus.isReady && ttsStatus.isReady,
      sttReady: sttStatus.isReady,
      ttsReady: ttsStatus.isReady,
      availableVoices: textToSpeechService.getAvailableVoices().map((v: any) => v.id)
    };
  }
}

module.exports = new VoiceService();