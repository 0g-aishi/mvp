import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { parseCommand, suggestCommands, AVAILABLE_COMMANDS, CommandType } from '../services/commandParser';
import MicrophoneButton from './MicrophoneButton';
import VoiceInputMessage from './VoiceInputMessage';
import { Send } from 'lucide-react';
import { breakpoints } from '../../utils/responsive';
import { logger } from '@/lib/logger';

interface PremiumCommandBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onHistoryUp: () => void;
  onHistoryDown: () => void;
  onClear: () => void;
  disabled?: boolean;
  placeholder?: string;
  promptSymbol?: string;
  isChatActive?: boolean;
  isDreamActive?: boolean;
  onEndSession?: () => void;
  onVoiceInput?: (audioBase64: string, audioBlob: Blob) => void;
  isVoiceEnabled?: boolean;
  onRecordingStateChange?: (isRecording: boolean) => void;
  dreamStatus?: string | null;
  dreamPrompt?: string | null;
  chatStatus?: string | null;
  chatPrompt?: string | null;
  onQuickSubmit?: (value: string) => void;
  isInitialState?: boolean;
}

const colors = {
  pearl: '#F0F0F0',
  silver: '#8A8A8A',
  accent: '#8B5CF6',
  accentMuted: 'rgba(139, 92, 246, 0.1)',
  borderSubtle: 'rgba(255, 255, 255, 0.05)'
};

const PremiumCommandBarComponent: React.FC<PremiumCommandBarProps> = ({
  value,
  onChange,
  onSubmit,
  onHistoryUp,
  onHistoryDown,
  onClear,
  disabled = false,
  placeholder = 'Enter command',
  promptSymbol = '>',
  isChatActive = false,
  isDreamActive = false,
  onEndSession,
  onVoiceInput,
  isVoiceEnabled = false,
  onRecordingStateChange,
  dreamStatus = null,
  dreamPrompt = null,
  chatStatus = null,
  chatPrompt = null,
  onQuickSubmit,
  isInitialState = false
}) => {
  const log = logger.child({ component: 'PremiumCommandBar' });
  const inputRef = useRef<HTMLInputElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [voiceInputBlob, setVoiceInputBlob] = useState<Blob | null>(null);
  const [voiceInputBase64, setVoiceInputBase64] = useState<string | null>(null);
  const [voiceInputUrl, setVoiceInputUrl] = useState<string | null>(null);

  // Responsive detection
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkViewport = () => {
      const width = window.innerWidth;
      setIsMobile(width < breakpoints.sm);
      setIsTablet(width >= breakpoints.sm && width < breakpoints.md);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);
  
  // Check if current command is valid
  const isValidCommand = useMemo(() => {
    if (!value.trim()) return false;
    const parsed = parseCommand(value);
    return parsed.isValid;
  }, [value]);
  
  // Get suggestions for current input
  const suggestions = useMemo(() => {
    if (!value.trim() || value.includes(' ')) return [];
    return suggestCommands(value);
  }, [value]);

  // Show microphone button only when dream/chat workflow is active
  const showMicrophone = isVoiceEnabled && (
    isDreamActive ||
    isChatActive
  );

  // Handle voice recording completion
  const handleVoiceRecordingComplete = useCallback((audioBase64: string, audioBlob: Blob) => {
    log.debug('Voice recording completed', {
      audioBlobSize: audioBlob.size,
      base64Length: audioBase64.length,
      isDreamActive,
      isChatActive
    });

    // Store both blob and base64
    setVoiceInputBlob(audioBlob);
    setVoiceInputBase64(audioBase64);

    // Create and store blob URL once
    try {
      const url = URL.createObjectURL(audioBlob);
      setVoiceInputUrl(url);
      log.debug('Created blob URL', { url });
    } catch (error) {
      log.error('Failed to create blob URL', { error });
    }

    // Clear text input when voice is recorded
    onChange('');
  }, [onChange, isDreamActive, isChatActive, log]);

  // Handle voice input deletion
  const handleDeleteVoiceInput = useCallback(() => {
    log.debug('Voice input deleted');

    // Cleanup blob URL if exists
    if (voiceInputUrl) {
      URL.revokeObjectURL(voiceInputUrl);
    }

    setVoiceInputBlob(null);
    setVoiceInputBase64(null);
    setVoiceInputUrl(null);
  }, [voiceInputUrl, log]);

  // Submit voice input
  const submitVoiceInput = useCallback(() => {
    if (voiceInputBase64 && voiceInputBlob && onVoiceInput) {
      log.debug('Submitting voice input', {
        blobSize: voiceInputBlob.size,
        base64Length: voiceInputBase64.length
      });
      onVoiceInput(voiceInputBase64, voiceInputBlob);

      // Cleanup blob URL if exists
      if (voiceInputUrl) {
        URL.revokeObjectURL(voiceInputUrl);
      }

      // Clear voice input after submission
      setVoiceInputBlob(null);
      setVoiceInputBase64(null);
      setVoiceInputUrl(null);
    }
  }, [voiceInputBase64, voiceInputBlob, onVoiceInput, voiceInputUrl, log]);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Keep focus when disabled state changes
  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (voiceInputUrl) {
        URL.revokeObjectURL(voiceInputUrl);
      }
    };
  }, [voiceInputUrl]);

  const lowerDreamStatus = dreamStatus?.toLowerCase() ?? '';
  const lowerChatStatus = chatStatus?.toLowerCase() ?? '';
  const activeStatus = isChatActive ? lowerChatStatus : lowerDreamStatus;
  const activePromptLower = (isChatActive ? chatPrompt : dreamPrompt)?.toLowerCase() ?? '';
  const activePrompt = isChatActive ? chatPrompt : dreamPrompt;
  const retryPromptActive = activeStatus.includes('type y or n') || activeStatus.includes('type y/n');
  const promptAsksConfirmation = activePromptLower.includes('type y or n') || activePromptLower.includes('type y/n');
  const retryingActive = activeStatus.includes('retrying') || activePromptLower.includes('retrying');

  const smartPlaceholder = useMemo(() => {
    // Initial state - friendly prompt
    if (isInitialState) {
      return 'Type a command or "help" to get started';
    }
    if (retryPromptActive || promptAsksConfirmation) {
      return "Type 'y' to retry or 'n' to cancel";
    }
    if (retryingActive) {
      return 'Retrying... type n to cancel';
    }
    if (activePromptLower.includes('waiting for your response')) {
      return "Type your response or 'n' to cancel";
    }
    if (activePromptLower.includes('waiting for your decision')) {
      return "Type y or n";
    }
    if (activePrompt) {
      return activePrompt;
    }
    if (activeStatus.includes('waiting for your response')) {
      return "Type your response or 'n' to cancel";
    }
    if (isChatActive) {
      if (lowerChatStatus.includes('typing')) {
        return 'Agent is typing...';
      }
      if (lowerChatStatus === 'waiting for your decision...') {
        return 'Type y or n';
      }
      return 'Type your message...';
    }
    if (isDreamActive) {
      if (lowerDreamStatus.includes('thinking')) {
        return dreamStatus || 'Processing dream...';
      }
      if (lowerDreamStatus === 'type y/n to confirm' || lowerDreamStatus === 'type y or n to confirm') {
        return 'Type y or n';
      }
      if (dreamStatus) {
        return dreamStatus;
      }
      return 'Describe your dream here';
    }
    return placeholder;
  }, [retryPromptActive, retryingActive, activeStatus, isChatActive, isDreamActive, lowerChatStatus, lowerDreamStatus, dreamStatus, placeholder, isInitialState, promptAsksConfirmation, activePromptLower, activePrompt]);

  const inputPlaceholder = disabled ? 'Processing...' : smartPlaceholder;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle suggestions navigation
    if (showSuggestions && suggestions.length > 0) {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setSelectedSuggestion(prev => Math.max(0, prev - 1));
          return;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedSuggestion(prev => Math.min(suggestions.length - 1, prev + 1));
          return;
        case 'Tab':
        case 'Enter':
          if (e.key === 'Tab' || (e.key === 'Enter' && suggestions.length === 1)) {
            e.preventDefault();
            onChange(suggestions[selectedSuggestion]);
            setShowSuggestions(false);
            return;
          }
          break;
        case 'Escape':
          e.preventDefault();
          setShowSuggestions(false);
          return;
      }
    }
    
    // Regular command handling
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (voiceInputBlob) {
          // Submit voice input
          submitVoiceInput();
        } else if (value.toLowerCase() === 'clear') {
          onClear();
          onChange('');
        } else {
          onSubmit();
        }
        setShowSuggestions(false);
        break;
      case 'ArrowUp':
        e.preventDefault();
        onHistoryUp();
        break;
      case 'ArrowDown':
        e.preventDefault();
        onHistoryDown();
        break;
      case 'Escape':
        e.preventDefault();
        onChange('');
        setShowSuggestions(false);
        break;
    }
  };
  
  // Show/hide suggestions based on input
  useEffect(() => {
    if (suggestions.length > 0 && value && !value.includes(' ')) {
      setShowSuggestions(true);
      setSelectedSuggestion(0);
    } else {
      setShowSuggestions(false);
    }
  }, [suggestions, value]);

  const commandBarStyle: React.CSSProperties = {
    // Consistent styling throughout all states
    padding: isMobile ? '0.75rem 1rem' : isTablet ? '1rem 1.25rem' : '1rem 1.5rem',
    background: 'rgba(26, 26, 26, 0.85)',
    borderRadius: '24px',
    transition: 'all 0.3s ease'
  };

  const commandInputStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: isMobile ? '0.5rem' : '1rem'
  };

  const commandPromptStyle: React.CSSProperties = {
    color: colors.silver,
    fontSize: '14px',
    fontWeight: 400,
    opacity: 0.5
  };

  const commandFieldStyle: React.CSSProperties = {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: isValidCommand ? colors.accent : colors.pearl,
    fontFamily: 'Inter, -apple-system, "SF Pro Display", system-ui, sans-serif',
    fontSize: '14px',
    fontWeight: isValidCommand ? 400 : 300,
    letterSpacing: '0.02em',
    caretColor: colors.accent,
    transition: 'color 0.2s ease, font-weight 0.2s ease',
    lineHeight: '1.6', // Increase line height to prevent text cutoff
    padding: '0.25rem 0' // Add vertical padding
  };
  
  const suggestionsStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '100%',
    left: isMobile ? '1rem' : isTablet ? '1.5rem' : '2rem',
    right: isMobile ? '1rem' : isTablet ? '1.5rem' : '2rem',
    marginBottom: '0.5rem',
    background: 'rgba(26, 26, 26, 0.95)',
    border: `1px solid ${colors.borderSubtle}`,
    borderRadius: '8px',
    overflow: 'hidden',
    zIndex: 10
  };
  
  const suggestionItemStyle = (isSelected: boolean): React.CSSProperties => ({
    padding: '0.5rem 1rem',
    color: isSelected ? colors.accent : colors.silver,
    background: isSelected ? colors.accentMuted : 'transparent',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: 'Inter, -apple-system, "SF Pro Display", system-ui, sans-serif',
    transition: 'all 0.1s ease'
  });

  return (
    <div 
      style={{ ...commandBarStyle, position: 'relative' }}
      onFocus={() => {
        // Add focus effect
        const bar = inputRef.current?.parentElement?.parentElement;
        if (bar) {
          bar.style.background = 'rgba(26, 26, 26, 0.6)';
          bar.style.borderTopColor = colors.accentMuted;
        }
      }}
      onBlur={() => {
        // Remove focus effect
        const bar = inputRef.current?.parentElement?.parentElement;
        if (bar) {
          bar.style.background = 'rgba(26, 26, 26, 0.5)';
          bar.style.borderTopColor = colors.borderSubtle;
        }
      }}
    >
      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div style={suggestionsStyle}>
          {suggestions.map((cmd, index) => (
            <div
              key={cmd}
              style={suggestionItemStyle(index === selectedSuggestion)}
              onMouseEnter={() => setSelectedSuggestion(index)}
              onClick={() => {
                onChange(cmd);
                setShowSuggestions(false);
                inputRef.current?.focus();
              }}
            >
              <span style={{ color: colors.accent }}>{cmd}</span>
              <span style={{ marginLeft: '1rem', opacity: 0.7 }}>
                {AVAILABLE_COMMANDS[cmd as CommandType]}
              </span>
            </div>
          ))}
        </div>
      )}
      
      <div style={commandInputStyle}>
        <span style={commandPromptStyle}>{promptSymbol}</span>

        {/* Input wrapper - maintains consistent layout */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          minWidth: 0 // Allow flex to shrink properly
        }}>
          {voiceInputBlob ? (
            <>
              {log.debug('Rendering VoiceInputMessage', {
                hasBlob: !!voiceInputBlob,
                hasBase64: !!voiceInputBase64
              })}
              <VoiceInputMessage
                audioBlob={voiceInputBlob}
                audioBase64={voiceInputBase64}
                onDelete={handleDeleteVoiceInput}
              />
            </>
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
            placeholder={inputPlaceholder}
              style={{
                ...commandFieldStyle,
                width: '100%' // Take full width of wrapper
              }}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          )}
        </div>

        {/* Action buttons container - fixed position */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexShrink: 0 // Prevent compression
        }}>
          {/* Microphone button for voice input */}
          {showMicrophone && !voiceInputBlob && (
            <MicrophoneButton
              onRecordingComplete={handleVoiceRecordingComplete}
              isDisabled={disabled}
              maxDuration={300}
              onRecordingStateChange={onRecordingStateChange}
            />
          )}

          {/* Submit button for dream/chat input */}
          {(showMicrophone || voiceInputBlob) && (
            <button
              onClick={() => {
                if (voiceInputBlob) {
                  submitVoiceInput();
                } else {
                  onSubmit();
                }
              }}
              disabled={disabled}
              style={{
                width: '40px', // Match MicrophoneButton size
                height: '40px', // Match MicrophoneButton size
                minWidth: '40px', // Prevent squashing
                minHeight: '40px', // Prevent squashing
                flexShrink: 0, // Prevent compression in flex layout
                borderRadius: '50%',
                backgroundColor: colors.accent,
                border: 'none',
                color: '#1a1a1a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: disabled ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!disabled) {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.backgroundColor = colors.accent;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.backgroundColor = colors.accent;
              }}
              aria-label="Send message"
            >
              <Send size={20} />
            </button>
          )}
        </div>

      {(retryPromptActive || promptAsksConfirmation) && (
        <button
          onClick={() => !disabled && onQuickSubmit?.('n')}
          disabled={disabled}
          style={{
            marginLeft: '8px',
            padding: isMobile ? '4px 10px' : '6px 14px',
            borderRadius: '999px',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            background: 'rgba(239, 68, 68, 0.12)',
            color: '#F87171',
            fontSize: isMobile ? '10px' : '12px',
            letterSpacing: '0.4px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            flexShrink: 0
          }}
          onMouseEnter={e => {
            if (!disabled) {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
          }}
        >
          Cancel retry
        </button>
      )}
      </div>
      <style jsx>{`
        input::placeholder {
          color: ${colors.silver};
          opacity: 0.5;
        }
      `}</style>
    </div>
  );
};

export const PremiumCommandBar = React.memo(PremiumCommandBarComponent);