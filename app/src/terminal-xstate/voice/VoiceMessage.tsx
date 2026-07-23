/**
 * @fileoverview Voice Message Component - Messenger-like audio message UI
 * @description Component for displaying and playing voice messages with waveform visualization
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

const log = logger.child({ component: 'VoiceMessage' });

export interface VoiceMessageProps {
  audioUrl?: string;
  audioBlob?: Blob;
  duration: number;
  isUserMessage?: boolean;
  isPlaying?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  timestamp?: number;
  sender?: string;
  status?: 'sending' | 'sent' | 'error' | 'playing';
}

// Waveform bars configuration
const WAVEFORM_BARS = 30;

export const VoiceMessage: React.FC<VoiceMessageProps> = ({
  audioUrl,
  audioBlob,
  duration,
  isUserMessage = false,
  isPlaying: externalIsPlaying,
  onPlay,
  onPause,
  timestamp,
  sender,
  status = 'sent'
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [actualDuration, setActualDuration] = useState(duration);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationRef = useRef<number>();

  // Generate random waveform heights for visual effect
  const [waveformHeights] = useState(() =>
    Array.from({ length: WAVEFORM_BARS }, () =>
      Math.random() * 0.5 + 0.3 // Heights between 30% and 80%
    )
  );

  // Create audio URL from blob if needed
  useEffect(() => {
    if (audioBlob && !audioUrl && audioRef.current) {
      const url = URL.createObjectURL(audioBlob);
      audioRef.current.src = url;

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [audioBlob, audioUrl]);

  // Handle external play state
  useEffect(() => {
    if (externalIsPlaying !== undefined) {
      setIsPlaying(externalIsPlaying);
    }
  }, [externalIsPlaying]);

  // Update time during playback
  const updateTime = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (!audioRef.current.paused) {
        animationRef.current = requestAnimationFrame(updateTime);
      }
    }
  }, []);

  // Handle play/pause
  const togglePlay = useCallback(async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        setIsPlaying(false);
        onPause?.();
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
        updateTime();
        onPlay?.();
      }
    } catch (err) {
      setError('Failed to play audio');
      log.error('Audio playback error', { error: err });
    }
  }, [isPlaying, onPlay, onPause, updateTime]);

  // Handle audio ended
  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);

  // Handle audio loaded metadata
  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      const audioDuration = audioRef.current.duration;

      // Handle Infinity duration (common with certain codecs)
      if (!isFinite(audioDuration) || audioDuration === 0) {
        // Use provided duration or estimate from blob size
        if (audioBlob) {
          const estimatedDuration = Math.max(1, Math.round(audioBlob.size / 10000));
          log.debug('Using estimated duration', {
            blobSize: audioBlob.size,
            estimatedDuration
          });
          setActualDuration(estimatedDuration);
        } else {
          // Use provided duration or default
          setActualDuration(duration || 3);
        }
      } else {
        setActualDuration(audioDuration);
      }
    }
  }, [audioBlob, duration]);

  // Format time display
  const formatTime = (time: number): string => {
    // Handle Infinity or invalid duration
    if (!isFinite(time) || isNaN(time) || time === 0) {
      return '0:00';
    }
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate progress
  const progress = actualDuration > 0 ? (currentTime / actualDuration) * 100 : 0;

  // Component styles
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px', // Tighter spacing between elements
    padding: '10px 14px', // Reduced padding for cleaner layout
    backgroundColor: isUserMessage
      ? 'rgba(139, 92, 246, 0.1)'
      : 'rgba(255, 255, 255, 0.05)',
    border: '1px solid',
    borderColor: isUserMessage
      ? 'rgba(139, 92, 246, 0.3)'
      : 'rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    maxWidth: '320px',
    marginLeft: isUserMessage ? 'auto' : '0',
    marginRight: isUserMessage ? '0' : 'auto',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative' as const,
    opacity: status === 'sending' ? 0.7 : 1
  };

  const playButtonStyle: React.CSSProperties = {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: isUserMessage ? '#8B5CF6' : '#4B5563',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
    flexShrink: 0
  };

  const waveformContainerStyle: React.CSSProperties = {
    flex: 1,
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    position: 'relative' as const,
    overflow: 'hidden'
  };

  const progressOverlayStyle: React.CSSProperties = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    height: '100%',
    width: `${progress}%`,
    backgroundColor: isUserMessage
      ? 'rgba(139, 92, 246, 0.15)' // Reduced opacity for less blur
      : 'rgba(255, 255, 255, 0.08)', // Reduced opacity for cleaner look
    transition: 'width 0.1s linear',
    pointerEvents: 'none' as const,
    borderRadius: '0', // Clean edges
    backdropFilter: 'none' // Remove any blur effects
  };

  const waveformBarStyle = (index: number, height: number): React.CSSProperties => ({
    width: '2px',
    height: `${height * 100}%`,
    backgroundColor: index < (progress / 100) * WAVEFORM_BARS
      ? (isUserMessage ? '#8B5CF6' : '#F0F0F0')
      : (isUserMessage ? 'rgba(139, 92, 246, 0.4)' : 'rgba(255, 255, 255, 0.3)'),
    borderRadius: '1px',
    transition: 'all 0.2s ease',
    transform: isPlaying && index < (progress / 100) * WAVEFORM_BARS
      ? `scaleY(${1 + Math.sin(Date.now() / 100 + index) * 0.2})`
      : 'scaleY(1)'
  });

  const timeStyle: React.CSSProperties = {
    fontSize: '12px',
    color: isUserMessage ? '#8B5CF6' : '#8A8A8A',
    fontFamily: 'monospace',
    minWidth: '35px', // Reduced spacing for tighter layout
    textAlign: 'right' as const,
    paddingLeft: '4px' // Minimal padding for clean separation
  };

  const senderStyle: React.CSSProperties = {
    position: 'absolute' as const,
    top: '-18px',
    left: isUserMessage ? 'auto' : '0',
    right: isUserMessage ? '0' : 'auto',
    fontSize: '11px',
    color: '#8A8A8A',
    fontFamily: 'monospace'
  };

  return (
    <div style={containerStyle} onClick={togglePlay}>
      {sender && (
        <span style={senderStyle}>{sender}</span>
      )}

      <button
        style={playButtonStyle}
        onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
        }}
      >
        {isPlaying ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        )}
      </button>

      <div style={waveformContainerStyle}>
        <div style={progressOverlayStyle} />
        {waveformHeights.map((height, index) => (
          <div
            key={index}
            style={waveformBarStyle(index, height)}
          />
        ))}
      </div>

      <span style={timeStyle}>
        {formatTime(isPlaying ? currentTime : actualDuration)}
      </span>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onEnded={handleEnded}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        preload="metadata"
      />

      {/* Status indicator */}
      {status === 'sending' && (
        <div style={{
          position: 'absolute' as const,
          bottom: '-4px',
          right: '4px',
          fontSize: '10px',
          color: '#8A8A8A'
        }}>
          Sending...
        </div>
      )}

      {error && (
        <div style={{
          position: 'absolute' as const,
          bottom: '-18px',
          left: '0',
          fontSize: '11px',
          color: '#EF4444'
        }}>
          {error}
        </div>
      )}
    </div>
  );
};