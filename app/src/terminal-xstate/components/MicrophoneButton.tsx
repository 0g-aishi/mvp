/**
 * @fileoverview Microphone Button Component for Voice Recording
 * @description Button component with recording states and visual feedback
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, Square } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAudioRecorder } from '../voice/useAudioRecorder';
import { logger } from '@/lib/logger';

const log = logger.child({ component: 'MicrophoneButton' });

interface MicrophoneButtonProps {
  onRecordingComplete: (audioBase64: string, audioBlob: Blob) => void;
  isDisabled?: boolean;
  maxDuration?: number; // Max recording duration in seconds
  className?: string;
  onRecordingStateChange?: (isRecording: boolean) => void;
}

export const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({
  onRecordingComplete,
  isDisabled = false,
  maxDuration = 300, // 5 minutes default
  className = '',
  onRecordingStateChange
}) => {
  const { theme } = useTheme();
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  const {
    isRecording,
    isPaused,
    duration,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording,
    getBase64
  } = useAudioRecorder();

  // Notify parent about recording state changes
  useEffect(() => {
    if (onRecordingStateChange) {
      onRecordingStateChange(isRecording);
    }
  }, [isRecording, onRecordingStateChange]);

  // Update recording duration
  useEffect(() => {
    if (isRecording && !isPaused) {
      durationInterval.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1;
          // Auto-stop at max duration
          if (newDuration >= maxDuration) {
            handleStopRecording();
          }
          return newDuration;
        });
      }, 1000);
    } else {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }
    }

    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording, isPaused, maxDuration]);

  // Handle recording toggle
  const handleToggleRecording = useCallback(async () => {
    log.debug('handleToggleRecording called', {
      isRecording,
      action: isRecording ? 'stopping' : 'starting'
    });
    if (isRecording) {
      await handleStopRecording();
    } else {
      await handleStartRecording();
    }
  }, [isRecording]);

  const handleStartRecording = useCallback(async () => {
    try {
      log.debug('Starting recording', { maxDuration });
      setRecordingDuration(0);
      await startRecording();
    } catch (error) {
      log.error('Failed to start recording', { error });
      alert('Failed to access microphone. Please check permissions.');
    }
  }, [startRecording, maxDuration]);

  const handleStopRecording = useCallback(async () => {
    log.debug('handleStopRecording called');
    try {
      setIsProcessing(true);

      // Stop recording
      const audioBlob = await stopRecording();

      if (audioBlob) {
        // Get base64 encoding
        const base64 = await getBase64(audioBlob);

        if (base64) {
          log.debug('Recording stopped', {
            audioBlobSize: audioBlob.size,
            base64Length: base64.length,
            recordingDuration: recordingDuration
          });
          // Notify parent component
          onRecordingComplete(base64, audioBlob);
        } else {
          log.debug('Failed to convert audio to base64');
        }
      } else {
        log.debug('No audio blob received from stopRecording');
      }

      // Don't clear recording here - let VoiceInputMessage use the blob
      // clearRecording() should only be called when user deletes the voice message
      setRecordingDuration(0);
    } catch (error) {
      log.error('Failed to stop recording', { error });
    } finally {
      setIsProcessing(false);
    }
  }, [stopRecording, getBase64, clearRecording, onRecordingComplete, recordingDuration]);

  // Format duration display
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progressPercentage = (recordingDuration / maxDuration) * 100;

  return (
    <div
      className={`microphone-button-container ${className}`}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      <button
        onClick={handleToggleRecording}
        disabled={isDisabled || isProcessing}
        className="microphone-button"
        style={{
          position: 'relative',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: `2px solid ${theme.accent.primary}`,
          backgroundColor: theme.accent.primary,
          color: '#1a1a1a', // Dark icon on purple background (consistent with send button)
          cursor: isDisabled || isProcessing ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
          opacity: isDisabled || isProcessing ? 0.5 : 1,
          overflow: 'hidden'
        }}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        title={isRecording ? 'Click to stop recording' : 'Click to start recording'}
      >
        {/* Progress ring */}
        {isRecording && (
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              transform: 'rotate(-90deg)',
              pointerEvents: 'none'
            }}
          >
            <circle
              cx="20"
              cy="20"
              r="18"
              stroke={`${theme.accent.primary}33`}
              strokeWidth="2"
              fill="none"
            />
            <circle
              cx="20"
              cy="20"
              r="18"
              stroke={theme.accent.primary}
              strokeWidth="2"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 18}`}
              strokeDashoffset={`${2 * Math.PI * 18 * (1 - progressPercentage / 100)}`}
              style={{
                transition: 'stroke-dashoffset 1s linear'
              }}
            />
          </svg>
        )}

        {/* Icon */}
        {isProcessing ? (
          <Loader2 size={20} className="animate-spin" />
        ) : isRecording ? (
          <Square size={16} style={{ fill: '#1a1a1a' }} />
        ) : (
          <Mic size={20} />
        )}

        {/* Pulsing animation when recording */}
        {isRecording && !isProcessing && (
          <div
            className="recording-pulse"
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              border: `2px solid ${theme.accent.primary}`,
              animation: 'pulse 1.5s ease-out infinite',
              pointerEvents: 'none'
            }}
          />
        )}
      </button>

      {/* Duration display */}
      {isRecording && (
        <div
          style={{
            fontSize: '12px',
            fontFamily: 'monospace',
            color: theme.accent.primary,
            fontWeight: '600',
            minWidth: '40px'
          }}
        >
          {formatDuration(recordingDuration)}
        </div>
      )}

      {/* Max duration warning */}
      {isRecording && recordingDuration > maxDuration - 30 && (
        <div
          style={{
            position: 'absolute',
            bottom: '-20px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '10px',
            color: '#FCD34D',
            whiteSpace: 'nowrap',
            background: theme.bg.card,
            padding: '2px 6px',
            borderRadius: '4px',
            border: `1px solid ${theme.border}`
          }}
        >
          {maxDuration - recordingDuration}s remaining
        </div>
      )}

      {/* Inline styles for animations */}
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.3);
            opacity: 0.5;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        .microphone-button:hover:not(:disabled) {
          transform: scale(1.05);
        }

        .microphone-button:active:not(:disabled) {
          transform: scale(0.95);
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default MicrophoneButton;