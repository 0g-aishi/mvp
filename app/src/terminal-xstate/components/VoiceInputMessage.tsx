/**
 * @fileoverview Voice Input Message Component
 * @description Mini voice message component displayed in terminal input field
 */

'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, X, Mic } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { logger } from '@/lib/logger';

const log = logger.child({ component: 'VoiceInputMessage' });

interface VoiceInputMessageProps {
  audioBlob: Blob;
  audioBase64?: string;
  duration?: number;
  onDelete: () => void;
  className?: string;
}

export const VoiceInputMessage: React.FC<VoiceInputMessageProps> = ({
  audioBlob,
  audioBase64,
  duration = 0,
  onDelete,
  className = ''
}) => {
  const { theme } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  // Create audio URL from blob - prioritize base64 for stability
  const audioUrl = React.useMemo(() => {
    // Prefer base64 as it's more stable than blob URLs
    if (audioBase64) {
      log.debug('Using base64 data URL');
      return `data:audio/webm;base64,${audioBase64}`;
    } else if (audioBlob) {
      try {
        const url = URL.createObjectURL(audioBlob);
        log.debug('Created blob URL', {
          url,
          blobSize: audioBlob.size,
          blobType: audioBlob.type
        });
        return url;
      } catch (error) {
        log.error('Failed to create blob URL', { error });
      }
    }
    return null;
  }, [audioBlob, audioBase64]);

  // Cleanup audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl && audioBlob) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl, audioBlob]);

  // Initialize audio element
  useEffect(() => {
    if (audioUrl) {
      log.debug('Initializing audio element with URL', { audioUrl });
      const audio = new Audio(audioUrl);

      audio.addEventListener('loadedmetadata', () => {
        log.debug('Audio metadata loaded', {
          duration: audio.duration,
          readyState: audio.readyState
        });
        // Handle Infinity duration (common with live streams or certain codecs)
        if (!isFinite(audio.duration) || audio.duration === 0) {
          // Estimate duration from blob size if available (rough estimate: ~10KB per second for webm/opus)
          if (audioBlob) {
            const estimatedDuration = Math.max(1, Math.round(audioBlob.size / 10000));
            log.debug('Using estimated duration', {
              blobSize: audioBlob.size,
              estimatedDuration
            });
            setTotalDuration(estimatedDuration);
          } else {
            // Default fallback duration
            setTotalDuration(duration || 3);
          }
        } else {
          setTotalDuration(audio.duration);
        }
      });

      audio.addEventListener('error', (e) => {
        log.error('Audio error', {
          error: e,
          audioUrl,
          readyState: audio.readyState,
          networkState: audio.networkState
        });
      });

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }
      });

      audioRef.current = audio;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [audioUrl]);

  // Handle play/pause
  const handleTogglePlay = useCallback(() => {
    if (!audioRef.current) {
      log.error('No audio ref available');
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    } else {
      audioRef.current.play().then(() => {
        log.debug('Audio playback started');
        setIsPlaying(true);

        // Update progress
        progressInterval.current = setInterval(() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }, 100);
      }).catch((error) => {
        log.error('Failed to play audio', { error });
        setIsPlaying(false);
      });
    }
  }, [isPlaying]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progressPercentage = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  // Generate waveform bars (simplified visualization)
  const waveformBars = Array.from({ length: 20 }, (_, i) => {
    const height = Math.random() * 60 + 20; // Random height between 20-80%
    const isActive = progressPercentage > (i / 20) * 100;
    return { height, isActive };
  });

  return (
    <div
      className={`voice-input-message ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 10px',
        backgroundColor: theme.bg.secondary,
        borderRadius: '20px',
        border: `1px solid ${theme.border}`,
        maxWidth: '300px',
        minWidth: '200px',
        position: 'relative'
      }}
    >
      {/* Play/Pause Button */}
      <button
        onClick={handleTogglePlay}
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          backgroundColor: theme.accent.primary,
          border: 'none',
          color: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'transform 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: '2px' }} />}
      </button>

      {/* Waveform Visualization */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          height: '24px',
          overflow: 'hidden'
        }}
      >
        {waveformBars.map((bar, index) => (
          <div
            key={index}
            style={{
              width: '2px',
              height: `${bar.height}%`,
              backgroundColor: bar.isActive ? theme.accent.primary : theme.text.tertiary,
              borderRadius: '1px',
              transition: 'all 0.2s ease',
              opacity: bar.isActive ? 1 : 0.4
            }}
          />
        ))}
      </div>

      {/* Duration */}
      <div
        style={{
          fontSize: '11px',
          fontFamily: 'monospace',
          color: theme.text.secondary,
          minWidth: '38px',
          textAlign: 'right'
        }}
      >
        {formatTime(isPlaying ? currentTime : totalDuration)}
      </div>

      {/* Delete Button */}
      <button
        onClick={onDelete}
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: 'transparent',
          border: `1px solid ${theme.border}`,
          color: theme.text.secondary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
          e.currentTarget.style.borderColor = '#EF4444';
          e.currentTarget.style.color = '#EF4444';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.borderColor = theme.border;
          e.currentTarget.style.color = theme.text.secondary;
        }}
        aria-label="Delete recording"
      >
        <X size={12} />
      </button>

      {/* Mic Icon Indicator */}
      <div
        style={{
          position: 'absolute',
          top: '-6px',
          right: '8px',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: theme.bg.card,
          border: `1px solid ${theme.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Mic size={10} style={{ color: theme.accent.primary }} />
      </div>
    </div>
  );
};

export default VoiceInputMessage;