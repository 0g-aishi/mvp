/**
 * @fileoverview Audio Recording Hook using MediaRecorder API
 * @description Hook for recording audio from microphone with automatic format detection
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { logger } from '@/lib/logger';

const log = logger.child({ component: 'useAudioRecorder' });

export interface AudioRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  error: string | null;
  permissionStatus: 'pending' | 'granted' | 'denied';
}

export interface UseAudioRecorderOptions {
  mimeType?: string;
  audioBitsPerSecond?: number;
  onRecordingStart?: () => void;
  onRecordingStop?: (blob: Blob) => void;
  onError?: (error: string) => void;
}

const DEFAULT_OPTIONS: UseAudioRecorderOptions = {
  mimeType: 'audio/webm;codecs=opus',
  audioBitsPerSecond: 128000
};

// Supported MIME types in order of preference
const MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4',
  'audio/mp3',
  'audio/wav'
];

export function useAudioRecorder(options: UseAudioRecorderOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioBlob: null,
    audioUrl: null,
    error: null,
    permissionStatus: 'pending'
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Find supported MIME type
  const getSupportedMimeType = useCallback((): string => {
    if (typeof MediaRecorder === 'undefined') {
      return 'audio/webm';
    }

    for (const mimeType of MIME_TYPES) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    }

    // Fallback
    return 'audio/webm';
  }, []);

  // Request microphone permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      streamRef.current = stream;

      setState(prev => ({
        ...prev,
        permissionStatus: 'granted',
        error: null
      }));

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Microphone permission denied';

      setState(prev => ({
        ...prev,
        permissionStatus: 'denied',
        error: errorMessage
      }));

      opts.onError?.(errorMessage);
      return false;
    }
  }, [opts]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      // Clear previous recording
      if (state.audioUrl) {
        URL.revokeObjectURL(state.audioUrl);
      }

      // Request permission if needed
      if (!streamRef.current) {
        const hasPermission = await requestPermission();
        if (!hasPermission) {
          return;
        }
      }

      const stream = streamRef.current!;
      const mimeType = opts.mimeType || getSupportedMimeType();

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: opts.audioBitsPerSecond
      });

      log.debug('MediaRecorder created with mimeType', { mimeType });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Note: onstop handler is set in stopRecording to handle promise resolution

      // Handle errors
      mediaRecorder.onerror = (event) => {
        const error = `Recording error: ${event.error}`;
        setState(prev => ({
          ...prev,
          error,
          isRecording: false,
          isPaused: false
        }));
        opts.onError?.(error);
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      startTimeRef.current = Date.now();

      log.debug('Recording started', {
        mimeType,
        streamActive: stream.active
      });

      // Update duration every second
      durationIntervalRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          duration: Math.floor((Date.now() - startTimeRef.current) / 1000)
        }));
      }, 1000);

      setState(prev => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        error: null,
        duration: 0
      }));

      opts.onRecordingStart?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording';
      setState(prev => ({
        ...prev,
        error: errorMessage
      }));
      opts.onError?.(errorMessage);
    }
  }, [state.audioUrl, requestPermission, getSupportedMimeType, opts]);

  // Stop recording
  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      log.debug('stopRecording called', {
        hasMediaRecorder: !!mediaRecorderRef.current,
        isRecording: state.isRecording,
        chunksLength: chunksRef.current.length
      });

      if (mediaRecorderRef.current && state.isRecording) {
        // Override the onstop handler to resolve the promise
        const originalOnStop = mediaRecorderRef.current.onstop;

        mediaRecorderRef.current.onstop = (event) => {
          log.debug('MediaRecorder stopped', {
            chunksLength: chunksRef.current.length,
            totalSize: chunksRef.current.reduce((acc, chunk) => acc + chunk.size, 0)
          });

          const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
          const audioBlob = new Blob(chunksRef.current, {
            type: mimeType
          });

          log.debug('Created audio blob', {
            blobType: mimeType,
            blobSize: audioBlob.size
          });
          const audioUrl = URL.createObjectURL(audioBlob);

          setState(prev => ({
            ...prev,
            isRecording: false,
            isPaused: false,
            audioBlob,
            audioUrl,
            duration: Math.floor((Date.now() - startTimeRef.current) / 1000)
          }));

          opts.onRecordingStop?.(audioBlob);

          // Clear duration interval
          if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
            durationIntervalRef.current = null;
          }

          // Call original handler if it exists and is different
          if (originalOnStop && originalOnStop !== mediaRecorderRef.current?.onstop) {
            originalOnStop.call(mediaRecorderRef.current, event);
          }

          // Resolve with the blob
          resolve(audioBlob);
        };

        mediaRecorderRef.current.stop();

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      } else {
        resolve(null);
      }
    });
  }, [state.isRecording, opts]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && !state.isPaused) {
      mediaRecorderRef.current.pause();
      setState(prev => ({ ...prev, isPaused: true }));
    }
  }, [state.isRecording, state.isPaused]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && state.isPaused) {
      mediaRecorderRef.current.resume();
      setState(prev => ({ ...prev, isPaused: false }));
    }
  }, [state.isRecording, state.isPaused]);

  // Clear recording
  const clearRecording = useCallback(() => {
    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl);
    }

    setState(prev => ({
      ...prev,
      audioBlob: null,
      audioUrl: null,
      duration: 0,
      error: null
    }));
  }, [state.audioUrl]);

  // Convert blob to base64
  const getBase64 = useCallback(async (blob?: Blob): Promise<string | null> => {
    const targetBlob = blob || state.audioBlob;

    if (!targetBlob) {
      log.debug('getBase64 called but no blob available');
      return null;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix
        const base64Data = base64.split(',')[1];

        log.debug('Base64 conversion complete', {
          blobSize: targetBlob.size,
          base64Length: base64Data.length
        });

        resolve(base64Data);
      };
      reader.readAsDataURL(targetBlob);
    });
  }, [state.audioBlob]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (state.audioUrl) {
        URL.revokeObjectURL(state.audioUrl);
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [state.audioUrl]);

  return {
    // State
    ...state,

    // Actions
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording,
    requestPermission,

    // Utilities
    getBase64,
    getSupportedMimeType
  };
}