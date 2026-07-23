/**
 * @fileoverview Voice Selector Component
 * @description Dropdown for selecting voice profiles with test functionality
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Volume2, Check, Info, X, Mic, Play, Loader2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { breakpoints, touchTargets } from '../utils/responsive';
import { VoiceProfile } from '../hooks/useVoiceDiscovery';

interface VoiceSelectorProps {
  voices: VoiceProfile[];
  selectedVoice: string;
  onVoiceChange: (voiceId: string) => void;
  onTestVoice?: (voiceId: string) => Promise<any>;
  isLoading?: boolean;
  isTesting?: boolean;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  voices,
  selectedVoice,
  onVoiceChange,
  onTestVoice,
  isLoading = false,
  isTesting = false
}) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [testingVoiceId, setTestingVoiceId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoints.sm);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentVoice = voices.find(v => v.id === selectedVoice) || voices[0];

  // Group voices by gender
  const femaleVoices = voices.filter(v => v.gender === 'female');
  const maleVoices = voices.filter(v => v.gender === 'male');
  const neutralVoices = voices.filter(v => v.gender === 'neutral');

  const handleTestVoice = async (voiceId: string) => {
    if (onTestVoice && !testingVoiceId) {
      setTestingVoiceId(voiceId);
      try {
        await onTestVoice(voiceId);
      } finally {
        setTestingVoiceId(null);
      }
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading || isTesting}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          borderRadius: '8px',
          border: `1px solid ${theme.border}`,
          backgroundColor: isOpen ? theme.bg.panel : theme.bg.card,
          color: theme.text.primary,
          cursor: isLoading || isTesting ? 'wait' : 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          transition: 'all 0.2s ease',
          minWidth: '200px',
          justifyContent: 'space-between',
          opacity: isLoading || isTesting ? 0.7 : 1
        }}
        onMouseEnter={(e) => {
          if (!isLoading && !isTesting) {
            e.currentTarget.style.borderColor = theme.accent.primary;
            e.currentTarget.style.backgroundColor = theme.bg.panel;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = theme.border;
          e.currentTarget.style.backgroundColor = isOpen ? theme.bg.panel : theme.bg.card;
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Volume2 size={16} color={theme.accent.primary} />
          <span style={{ fontSize: '13px' }}>
            {isLoading ? 'Loading voices...' : (currentVoice?.name || 'Select Voice')}
          </span>
        </div>
        <ChevronDown
          size={16}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}
        />
      </button>

      {isOpen && !isLoading && (
        <>
          {/* Mobile Overlay */}
          {isMobile && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 999,
                animation: 'fadeIn 0.2s ease'
              }}
              onClick={() => setIsOpen(false)}
            />
          )}

          <div style={{
            position: isMobile ? 'fixed' : 'absolute',
            top: isMobile ? '45%' : 'calc(100% + 8px)',
            left: isMobile ? '50%' : 0,
            transform: isMobile ? 'translate(-50%, -50%)' : 'none',
            width: isMobile ? 'calc(100vw - 32px)' : 'auto',
            minWidth: isMobile ? 'auto' : '380px',
            maxWidth: isMobile ? '400px' : '480px',
            maxHeight: isMobile ? '80vh' : '400px',
            overflowY: 'auto',
            backgroundColor: theme.bg.panel,
            border: `1px solid ${theme.border}`,
            borderRadius: theme.radius.lg,
            boxShadow: isMobile
              ? '0 20px 60px rgba(0,0,0,0.3)'
              : '0 10px 40px rgba(0,0,0,0.15)',
            zIndex: 1000,
            animation: isMobile ? 'scaleIn 0.3s ease' : 'slideDown 0.2s ease'
          }}>

            {/* Female Voices */}
            {femaleVoices.length > 0 && (
              <div>
                <div style={{ padding: '8px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px 8px 4px 8px'
                  }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      color: theme.text.secondary,
                      letterSpacing: '0.5px'
                    }}>
                      Female Voices
                    </span>
                  </div>
                  {femaleVoices.map(voice => (
                    <VoiceOption
                      key={voice.id}
                      voice={voice}
                      isSelected={selectedVoice === voice.id}
                      onSelect={() => {
                        onVoiceChange(voice.id);
                        setIsOpen(false);
                      }}
                      onTest={() => handleTestVoice(voice.id)}
                      isTestAvailable={!!onTestVoice}
                      isTesting={testingVoiceId === voice.id}
                      theme={theme}
                      isMobile={isMobile}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Male Voices */}
            {maleVoices.length > 0 && (
              <div style={{ borderTop: femaleVoices.length > 0 ? `1px solid ${theme.border}` : 'none' }}>
                <div style={{ padding: '8px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px 8px 4px 8px'
                  }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      color: theme.text.secondary,
                      letterSpacing: '0.5px'
                    }}>
                      Male Voices
                    </span>
                  </div>
                  {maleVoices.map(voice => (
                    <VoiceOption
                      key={voice.id}
                      voice={voice}
                      isSelected={selectedVoice === voice.id}
                      onSelect={() => {
                        onVoiceChange(voice.id);
                        setIsOpen(false);
                      }}
                      onTest={() => handleTestVoice(voice.id)}
                      isTestAvailable={!!onTestVoice}
                      isTesting={testingVoiceId === voice.id}
                      theme={theme}
                      isMobile={isMobile}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Neutral Voices */}
            {neutralVoices.length > 0 && (
              <div style={{ borderTop: (femaleVoices.length > 0 || maleVoices.length > 0) ? `1px solid ${theme.border}` : 'none' }}>
                <div style={{ padding: '8px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px 8px 4px 8px'
                  }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      color: theme.text.secondary,
                      letterSpacing: '0.5px'
                    }}>
                      Neutral Voices
                    </span>
                  </div>
                  {neutralVoices.map(voice => (
                    <VoiceOption
                      key={voice.id}
                      voice={voice}
                      isSelected={selectedVoice === voice.id}
                      onSelect={() => {
                        onVoiceChange(voice.id);
                        setIsOpen(false);
                      }}
                      onTest={() => handleTestVoice(voice.id)}
                      isTestAvailable={!!onTestVoice}
                      isTesting={testingVoiceId === voice.id}
                      theme={theme}
                      isMobile={isMobile}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Info footer */}
            <div style={{
              borderTop: `1px solid ${theme.border}`,
              padding: isMobile ? '12px 16px' : '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '6px',
              backgroundColor: theme.bg.card,
              opacity: 0.8
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Info size={12} color={theme.text.secondary} />
                <span style={{ fontSize: '11px', color: theme.text.secondary }}>
                  Test voices before selecting
                </span>
              </div>
              {isMobile && (
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    padding: '4px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={16} color={theme.text.secondary} />
                </button>
              )}
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

// Voice Option Component
const VoiceOption: React.FC<{
  voice: VoiceProfile;
  isSelected: boolean;
  onSelect: () => void;
  onTest: () => void;
  isTestAvailable: boolean;
  isTesting: boolean;
  theme: any;
  isMobile: boolean;
}> = ({ voice, isSelected, onSelect, onTest, isTestAvailable, isTesting, theme, isMobile }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '20px 1fr auto',
        gap: '12px',
        alignItems: 'center',
        padding: isMobile ? '14px 16px' : '12px 16px',
        minHeight: isMobile ? `${touchTargets.comfortable}px` : 'auto',
        borderRadius: theme.radius.md,
        cursor: 'pointer',
        backgroundColor: isSelected ? theme.bg.card : (isHovered ? theme.bg.card : 'transparent'),
        transition: theme.effects.transitions.fast,
        transform: isHovered && !isMobile ? 'scale(1.02)' : 'scale(1)'
      }}
    >
      {/* Icon Column - Fixed Width */}
      <div style={{
        width: '20px',
        height: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Volume2 size={16} color={theme.accent.primary} />
      </div>

      {/* Text Column - Flexible */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        minWidth: 0,
        overflow: 'hidden'
      }}>
        <span style={{
          fontSize: isMobile ? '14px' : '13px',
          fontWeight: isSelected ? '600' : '400',
          color: theme.text.primary,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {voice.name}
        </span>
        <span style={{
          fontSize: '10px',
          color: theme.text.secondary,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {voice.description}
        </span>
      </div>

      {/* Actions Column - Auto Width */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexShrink: 0
      }}>
        {/* Test Button */}
        {isTestAvailable && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTest();
            }}
            disabled={isTesting}
            style={{
              padding: '4px 8px',
              borderRadius: theme.radius.sm,
              border: `1px solid ${theme.border}`,
              backgroundColor: isHovered ? theme.bg.panel : theme.bg.card,
              color: theme.text.primary,
              cursor: isTesting ? 'wait' : 'pointer',
              fontSize: '11px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: theme.effects.transitions.fast,
              opacity: isTesting ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
              if (!isTesting) {
                e.currentTarget.style.borderColor = theme.accent.primary;
                e.currentTarget.style.backgroundColor = theme.bg.panel;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = theme.border;
              e.currentTarget.style.backgroundColor = isHovered ? theme.bg.panel : theme.bg.card;
            }}
          >
            {isTesting ? (
              <>
                <Loader2 size={10} className="animate-spin" />
                <span>Testing</span>
              </>
            ) : (
              <>
                <Play size={10} />
                <span>Test</span>
              </>
            )}
          </button>
        )}

        {/* Gender Badge */}
        <span style={{
          padding: '3px 8px',
          borderRadius: theme.radius.sm,
          fontSize: '10px',
          fontWeight: '600',
          backgroundColor: theme.accent.primary,
          color: '#ffffff',
          whiteSpace: 'nowrap',
          opacity: 0.8
        }}>
          {voice.gender}
        </span>

        {isSelected && (
          <Check size={16} color={theme.accent.primary} />
        )}
      </div>
    </div>
  );
};

export default VoiceSelector;